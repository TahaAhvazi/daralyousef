"""HTTP client for the Daftra REST API (pull sync).

Docs: https://docs.daftara.dev/
Auth: API key via `apikey` header (Bearer OAuth optional fallback).
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.core.exceptions import AppError, ValidationError

logger = logging.getLogger(__name__)


class DaftraError(AppError):
    def __init__(self, message: str, *, status_code: int = 502):
        super().__init__(message, status_code=status_code, code="daftra_error")


class DaftraClient:
    """Async wrapper around Daftra `/api2` with connection reuse + retries."""

    def __init__(
        self,
        *,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 90.0,
    ) -> None:
        self.base_url = (base_url or settings.DAFTRA_BASE_URL).rstrip("/")
        self.api_key = (api_key if api_key is not None else settings.DAFTRA_API_KEY).strip()
        self.timeout = timeout
        self._access_token: Optional[str] = None
        self._http: Optional[httpx.AsyncClient] = None

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    async def __aenter__(self) -> "DaftraClient":
        self._http = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout, connect=30.0),
            limits=httpx.Limits(max_connections=8, max_keepalive_connections=4),
            headers={
                "Accept": "application/json",
                "apikey": self.api_key,
            },
        )
        return self

    async def __aexit__(self, *args) -> None:
        if self._http is not None:
            await self._http.aclose()
            self._http = None

    def _headers(self, *, include_content_type: bool = False) -> Dict[str, str]:
        headers = {
            "Accept": "application/json",
            "apikey": self.api_key,
        }
        if include_content_type:
            headers["Content-Type"] = "application/json"
        if self._access_token:
            headers["Authorization"] = f"Bearer {self._access_token}"
        return headers

    async def _client(self) -> httpx.AsyncClient:
        if self._http is not None:
            return self._http
        # Fallback one-shot client (tests / short calls)
        return httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout, connect=30.0),
            headers=self._headers(),
        )

    async def ensure_token(self) -> None:
        if self._access_token or not (
            settings.DAFTRA_CLIENT_ID and settings.DAFTRA_CLIENT_SECRET
        ):
            return
        root = self.base_url
        if root.endswith("/api2"):
            root = root[: -len("/api2")]
        url = f"{root}/v2/oauth/token"
        http = await self._client()
        owns = self._http is None
        try:
            resp = await http.post(
                url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.DAFTRA_CLIENT_ID,
                    "client_secret": settings.DAFTRA_CLIENT_SECRET,
                },
                headers={"Accept": "application/json"},
            )
            if resp.status_code >= 400:
                return
            data = resp.json()
            token = data.get("access_token") or data.get("token")
            if token:
                self._access_token = str(token)
                if self._http is not None:
                    self._http.headers["Authorization"] = f"Bearer {self._access_token}"
        finally:
            if owns:
                await http.aclose()

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json_body: Any = None,
        retry_with_oauth: bool = True,
        retries: int = 4,
    ) -> Any:
        if not self.configured:
            raise ValidationError("Daftra is not configured (set DAFTRA_API_KEY and DAFTRA_BASE_URL)")

        path = path if path.startswith("/") else f"/{path}"
        # V2 entity API lives on site root, not under /api2
        if path.startswith("/v2/"):
            root = self.base_url
            if root.endswith("/api2"):
                root = root[: -len("/api2")]
            url = f"{root.rstrip('/')}{path}"
        else:
            url = f"{self.base_url}{path}"
        use_body = json_body is not None
        http = await self._client()
        owns = self._http is None
        last_exc: Optional[Exception] = None

        try:
            for attempt in range(retries + 1):
                try:
                    resp = await http.request(
                        method,
                        url,
                        params=params,
                        json=json_body if use_body else None,
                        headers=self._headers(include_content_type=use_body),
                    )

                    if resp.status_code in (401, 403) and retry_with_oauth and not self._access_token:
                        await self.ensure_token()
                        if self._access_token:
                            return await self.request(
                                method,
                                path,
                                params=params,
                                json_body=json_body,
                                retry_with_oauth=False,
                                retries=retries,
                            )

                    if resp.status_code in (429, 500, 502, 503, 504) and attempt < retries:
                        await asyncio.sleep(min(2 ** attempt, 12))
                        continue

                    if resp.status_code >= 400:
                        detail = resp.text[:500]
                        try:
                            body = resp.json()
                            detail = str(body.get("message") or body.get("result") or detail)
                        except Exception:
                            pass
                        raise DaftraError(
                            f"Daftra {method} {path} failed ({resp.status_code}): {detail}",
                            status_code=502,
                        )

                    if not resp.content:
                        return {}
                    try:
                        return resp.json()
                    except Exception as exc:
                        raise DaftraError(f"Invalid JSON from Daftra: {exc}") from exc

                except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout, httpx.RemoteProtocolError) as exc:
                    last_exc = exc
                    if attempt >= retries:
                        break
                    wait = min(2 ** attempt, 12)
                    logger.warning("Daftra network error on %s %s (attempt %s): %s — retry in %ss",
                                   method, path, attempt + 1, exc, wait)
                    await asyncio.sleep(wait)

            raise DaftraError(f"Daftra {method} {path} network failure: {last_exc}")
        finally:
            if owns:
                await http.aclose()

    async def get(self, path: str, **params: Any) -> Any:
        clean = {k: v for k, v in params.items() if v is not None}
        return await self.request("GET", path, params=clean or None)

    async def get_site_info(self) -> Dict[str, Any]:
        return await self.get("/site_info.json")

    async def list_page(
        self,
        path: str,
        *,
        page: int = 1,
        limit: int = 100,
        **extra: Any,
    ) -> Dict[str, Any]:
        return await self.get(path, page=page, limit=limit, **extra)

    async def iter_pages(
        self,
        path: str,
        *,
        limit: int = 100,
        max_pages: int = 2000,
        **extra: Any,
    ):
        page = 1
        while page <= max_pages:
            payload = await self.list_page(path, page=page, limit=limit, **extra)
            rows = payload.get("data") or []
            if not isinstance(rows, list):
                rows = []
            if not rows:
                break
            yield rows, payload.get("pagination") or {}
            pagination = payload.get("pagination") or {}
            try:
                page_count = int(pagination.get("page_count") or 0)
            except (TypeError, ValueError):
                page_count = 0
            if page_count and page >= page_count:
                break
            if not pagination.get("next") and len(rows) < limit:
                break
            page += 1

    async def list_clients(self, **kwargs: Any):
        async for batch, pag in self.iter_pages("/clients.json", **kwargs):
            yield batch, pag

    async def list_invoices(self, **kwargs: Any):
        async for batch, pag in self.iter_pages("/invoices.json", **kwargs):
            yield batch, pag

    async def get_invoice(self, invoice_id: int | str) -> Dict[str, Any]:
        return await self.get(f"/invoices/{invoice_id}.json")

    async def list_products(self, **kwargs: Any):
        async for batch, pag in self.iter_pages("/products.json", **kwargs):
            yield batch, pag

    async def list_expenses(self, **kwargs: Any):
        async for batch, pag in self.iter_pages("/expenses.json", **kwargs):
            yield batch, pag

    async def list_invoice_payments(self, **kwargs: Any):
        async for batch, pag in self.iter_pages("/invoice_payments.json", **kwargs):
            yield batch, pag

    async def list_subscriptions(self, **kwargs: Any):
        """List recurring invoice generators (subscriptions)."""
        async for batch, pag in self.iter_pages("/invoices/subscription.json", **kwargs):
            yield batch, pag

    async def get_subscription(self, subscription_id: int | str) -> Dict[str, Any]:
        """Full nested subscription detail (View Subscription)."""
        return await self.get(f"/invoices/view_subscription/{subscription_id}.json")

    async def list_entity_page(
        self,
        entity: str,
        *,
        level: int = 1,
        page: int = 1,
        per_page: int = 50,
        **extra: Any,
    ) -> Dict[str, Any]:
        """Daftra V2 entity list: GET /v2/api/entity/{entity}/list/{level}."""
        return await self.get(
            f"/v2/api/entity/{entity}/list/{level}",
            page=page,
            per_page=per_page,
            **extra,
        )

    async def iter_entity_pages(
        self,
        entity: str,
        *,
        level: int = 1,
        per_page: int = 50,
        max_pages: int = 500,
        **extra: Any,
    ):
        """Paginate Laravel-style V2 entity responses (current_page / last_page)."""
        page = 1
        while page <= max_pages:
            payload = await self.list_entity_page(
                entity, level=level, page=page, per_page=per_page, **extra,
            )
            rows = payload.get("data") or []
            if not isinstance(rows, list):
                rows = []
            if not rows:
                break
            pagination = {
                "current_page": payload.get("current_page") or page,
                "last_page": payload.get("last_page"),
                "total": payload.get("total"),
                "per_page": payload.get("per_page") or per_page,
            }
            yield rows, pagination
            try:
                last_page = int(payload.get("last_page") or 0)
            except (TypeError, ValueError):
                last_page = 0
            if last_page and page >= last_page:
                break
            if not payload.get("next_page_url") and len(rows) < per_page:
                break
            page += 1

    async def list_refund_receipts(self, **kwargs: Any):
        """Get All Refund Receipts — `/api2/refund_receipts.json`."""
        async for batch, pag in self.iter_pages("/refund_receipts.json", **kwargs):
            yield batch, pag

    async def get_refund_receipt(self, receipt_id: int | str) -> Dict[str, Any]:
        """Single refund receipt with InvoiceItem lines."""
        payload = await self.get(f"/refund_receipts/{receipt_id}.json")
        if isinstance(payload, dict):
            data = payload.get("data")
            if isinstance(data, dict):
                return unwrap(data, "RefundReceipt")
            return unwrap(payload, "RefundReceipt")
        return {}

    async def list_work_orders(self, **kwargs: Any):
        """Get All Work Orders — V2 entity `work_order` (includes typed workflow entities)."""
        kwargs.setdefault("level", 2)
        kwargs.setdefault("per_page", 50)
        async for batch, pag in self.iter_entity_pages("work_order", **kwargs):
            yield batch, pag

    async def list_workflow_type_entities(self, workflow_id: int | str, **kwargs: Any):
        """Get All Records for a workflow type: `le_workflow-type-entity-{id}`."""
        entity = f"le_workflow-type-entity-{workflow_id}"
        kwargs.setdefault("level", 2)
        kwargs.setdefault("per_page", 50)
        async for batch, pag in self.iter_entity_pages(entity, **kwargs):
            yield batch, pag

    async def list_workflow_types(self, **kwargs: Any):
        """List Daftra workflow type definitions."""
        kwargs.setdefault("level", 1)
        async for batch, pag in self.iter_entity_pages("workflow_type", **kwargs):
            yield batch, pag

    async def list_designations(self, **kwargs: Any):
        """Get All Designations (HR job titles)."""
        async for batch, pag in self.iter_entity_pages("designation", level=1, **kwargs):
            yield batch, pag

    async def list_hr_departments(self, **kwargs: Any):
        """Get All Departments (HR) via V2 entity API."""
        async for batch, pag in self.iter_entity_pages("department", level=1, **kwargs):
            yield batch, pag

    async def list_staff(self, **kwargs: Any):
        """GET All Staff — `/api2/staff.json` (official list + optional custom data)."""
        kwargs.setdefault("load_custom_data", 1)
        async for batch, pag in self.iter_pages("/staff.json", **kwargs):
            rows: List[Dict[str, Any]] = []
            for row in batch:
                rows.append(unwrap(row, "Staff"))
            yield rows, pag

    async def get_staff(self, staff_id: int | str) -> Dict[str, Any]:
        """GET Single Staff — `/api2/staff/{id}.json`."""
        payload = await self.get(f"/staff/{staff_id}.json")
        if isinstance(payload, dict):
            data = payload.get("data")
            if isinstance(data, dict):
                return unwrap(data, "Staff")
            return unwrap(payload, "Staff")
        return {}

    async def list_staff_v2(self, **kwargs: Any):
        """V2 staff list (includes nested staff_info for dept/designation)."""
        async for batch, pag in self.iter_entity_pages("staff", level=1, **kwargs):
            yield batch, pag

    async def staff_v2_index(self) -> Dict[str, Dict[str, Any]]:
        """Map daftra staff id → v2 row (for HR enrichment)."""
        index: Dict[str, Dict[str, Any]] = {}
        async for batch, _pag in self.list_staff_v2(per_page=50):
            for row in batch:
                if not isinstance(row, dict):
                    continue
                sid = str(row.get("id") or "").strip()
                if sid:
                    index[sid] = row
        return index


def unwrap(row: Any, key: str) -> Dict[str, Any]:
    if not isinstance(row, dict):
        return {}
    inner = row.get(key)
    if isinstance(inner, dict):
        return inner
    for alt in (key, key.lower(), key.capitalize()):
        if isinstance(row.get(alt), dict):
            return row[alt]
    return row


def as_list(payload: Any, key: str) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [unwrap(x, key) for x in payload]
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, list):
            return [unwrap(x, key) for x in data]
        nested = unwrap(payload, key)
        return [nested] if nested else []
    return []
