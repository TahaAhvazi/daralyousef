"""Pull-sync Daftra entities into local Atelier tables (fast, resumable, background-safe)."""
from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import SessionLocal
from app.models.catalog import Product
from app.models.customer import Customer
from app.models.department import Department
from app.models.finance import Expense, Invoice, InvoiceItem, Payment
from app.models.hr import Designation, EmployeeContract, Payslip, StaffProfile
from app.models.order import Order, OrderItem, OrderStatusEvent, OrderWorkflowAssignment
from app.models.sales_ops import CreditNote, CreditNoteItem, RecurringInvoice, RecurringInvoiceItem
from app.models.user import User
from app.services.daftra_client import DaftraClient, as_list, unwrap
from app.services.portal_access import ensure_customer_portal_user, normalize_phone
from app.services.staff_role_mapping import apply_title_role_to_user

logger = logging.getLogger(__name__)

# Daftra workflow_type_id → local department slug / pipeline stage seed.
# Types observed: 1 ورقیات, 2 اعلانات/حدادة, 3 تنضید ملازم, 4 اختام/دروع…, 5 فلکس/یوفی
_WORK_ORDER_TYPE_DEPARTMENT: Dict[str, str] = {
    "1": "printing",
    "2": "cnc",
    "3": "design",
    "4": "flex_uv",
    "5": "flex_uv",
}
_WORK_ORDER_TYPE_STAGE: Dict[str, str] = {
    "1": "printing",
    "2": "production",
    "3": "design",
    "4": "finishing",
    "5": "finishing",
}
# Daftra work_order.status — currently all active records use 1.
_WORK_ORDER_STATUS_MAP: Dict[int, str] = {
    0: "cancelled",
    1: "in_production",
    2: "delivered",
}

META_FILENAME = "daftra_sync_meta.json"
_SYNC_LOCK = asyncio.Lock()
_SYNC_TASK: Optional[asyncio.Task] = None


@dataclass
class ModuleSyncResult:
    module: str
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = field(default_factory=list)
    pages_done: int = 0
    total_pages: Optional[int] = None


@dataclass
class SyncReport:
    ok: bool = True
    status: str = "idle"  # idle | running | done | error
    current_module: Optional[str] = None
    modules: List[ModuleSyncResult] = field(default_factory=list)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "status": self.status,
            "current_module": self.current_module,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "message": self.message,
            "modules": [asdict(m) for m in self.modules],
        }


def _meta_path() -> Path:
    return Path(settings.UPLOAD_DIR) / META_FILENAME


def load_sync_meta() -> Dict[str, Any]:
    path = _meta_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_sync_meta(report: SyncReport | Dict[str, Any]) -> None:
    path = _meta_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = report.to_dict() if isinstance(report, SyncReport) else report
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def is_sync_running() -> bool:
    global _SYNC_TASK
    return _SYNC_TASK is not None and not _SYNC_TASK.done()


def _str_id(value: Any) -> Optional[str]:
    if value is None or value == "":
        return None
    return str(value)


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_date(value: Any) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    text = str(value or "").strip()
    if not text:
        return date.today()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(text[:10], fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        return date.today()


def _parse_date_opt(value: Any) -> Optional[date]:
    if value is None or str(value).strip() in ("", "None", "null"):
        return None
    return _parse_date(value)


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    text = str(value or "").strip()
    if not text:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        pass
    d = _parse_date(text)
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def _slugify(text: str, fallback: str) -> str:
    raw = (text or "").strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    if not slug:
        slug = fallback
    return slug[:200]


def _client_name(c: Dict[str, Any]) -> str:
    business = (c.get("business_name") or "").strip()
    if business:
        return business
    parts = [c.get("first_name"), c.get("last_name")]
    name = " ".join(str(p).strip() for p in parts if p).strip()
    return name or f"Client {c.get('id', '')}"


def _invoice_status(inv: Dict[str, Any]) -> str:
    if str(inv.get("draft") or "0") in ("1", "true", "True"):
        return "draft"
    paid = _safe_float(inv.get("summary_paid") or inv.get("paid_amount"))
    total = _safe_float(inv.get("summary_total") or inv.get("total"))
    payment_status = inv.get("payment_status")
    try:
        ps = int(payment_status) if payment_status is not None else None
    except (TypeError, ValueError):
        ps = None
    if ps == 2 or (total > 0 and paid >= total - 0.01):
        return "paid"
    if ps == 1 or paid > 0:
        return "partial"
    return "unpaid"


def _push_error(result: ModuleSyncResult, msg: str, *, limit: int = 40) -> None:
    if len(result.errors) < limit:
        result.errors.append(msg)


async def _customers_by_daftra_ids(db: AsyncSession, ids: Set[str]) -> Dict[str, Customer]:
    if not ids:
        return {}
    res = await db.execute(select(Customer).where(Customer.daftra_id.in_(list(ids))))
    return {c.daftra_id: c for c in res.scalars().all() if c.daftra_id}


async def _ensure_stub_customer(
    db: AsyncSession,
    daftra_id: str,
    inv: Dict[str, Any],
    cache: Dict[str, Customer],
) -> Customer:
    if daftra_id in cache:
        return cache[daftra_id]
    name = (
        (inv.get("client_business_name") or "").strip()
        or " ".join(
            str(p).strip()
            for p in (inv.get("client_first_name"), inv.get("client_last_name"))
            if p
        ).strip()
        or f"Client {daftra_id}"
    )
    code = f"DFT-{daftra_id}"[:40]
    with db.no_autoflush:
        by_daftra = (
            await db.execute(select(Customer).where(Customer.daftra_id == daftra_id))
        ).scalar_one_or_none()
        if by_daftra is not None:
            cache[daftra_id] = by_daftra
            return by_daftra
        by_code = (
            await db.execute(select(Customer).where(Customer.code == code))
        ).scalar_one_or_none()
    if by_code is not None:
        if by_code.daftra_id in (None, daftra_id):
            by_code.daftra_id = daftra_id
            if name and (not by_code.full_name or by_code.full_name.startswith("Client ")):
                by_code.full_name = name[:255]
            cache[daftra_id] = by_code
            return by_code
        code = f"D-{daftra_id}"[:40]

    customer = Customer(
        code=code,
        full_name=name[:255],
        email=(inv.get("client_email") or None) or None,
        phone=(inv.get("client_phone1") or inv.get("client_phone2") or None) or None,
        address=(inv.get("client_address1") or None) or None,
        city=(inv.get("client_city") or None) or None,
        country=(inv.get("client_country_code") or None) or None,
        daftra_id=daftra_id,
        notes="Auto-created from Daftra invoice sync",
    )
    db.add(customer)
    await db.flush()
    cache[daftra_id] = customer
    return customer


async def sync_clients(db: AsyncSession, client: DaftraClient, report: SyncReport) -> ModuleSyncResult:
    result = ModuleSyncResult(module="clients")
    report.current_module = "clients"
    save_sync_meta(report)

    async for batch, pag in client.list_clients(limit=100):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        ids = {_str_id(unwrap(row, "Client").get("id")) for row in batch}
        ids.discard(None)
        existing_map = await _customers_by_daftra_ids(db, ids)  # type: ignore[arg-type]

        for row in batch:
            c = unwrap(row, "Client")
            daftra_id = _str_id(c.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                async with db.begin_nested():
                    existing = existing_map.get(daftra_id)
                    full_name = _client_name(c)[:255]
                    email = (c.get("email") or None) or None
                    if email == "":
                        email = None
                    phone = (c.get("phone1") or c.get("mobile") or c.get("phone2") or None) or None
                    if phone:
                        phone = str(phone)[:40]
                    address_parts = [c.get("address1"), c.get("address2")]
                    address = ", ".join(str(p).strip() for p in address_parts if p) or None
                    city = (c.get("city") or None) or None
                    if city:
                        city = str(city)[:80]
                    country = (c.get("country_code") or c.get("country") or None) or None
                    if country:
                        country = str(country)[:80]
                    notes = (c.get("notes") or None) or None
                    code = f"DFT-{daftra_id}"[:40]

                    if not existing:
                        # Reclaim rows from older sync that used client_number as code.
                        with db.no_autoflush:
                            by_code = (
                                await db.execute(select(Customer).where(Customer.code == code))
                            ).scalar_one_or_none()
                        if by_code is not None:
                            if by_code.daftra_id in (None, daftra_id):
                                existing = by_code
                                existing.daftra_id = daftra_id
                                existing_map[daftra_id] = existing
                            else:
                                # Code owned by another mapped client — use alternate code.
                                code = f"D-{daftra_id}"[:40]

                    if existing:
                        existing.full_name = full_name
                        existing.email = email
                        existing.phone = phone
                        existing.address = address
                        existing.city = city
                        existing.country = country
                        existing.notes = notes
                        existing.daftra_id = daftra_id
                        if existing.deleted_at is not None:
                            existing.deleted_at = None
                        result.updated += 1
                        cust = existing
                    else:
                        cust = Customer(
                            code=code,
                            full_name=full_name,
                            email=email,
                            phone=phone,
                            address=address,
                            city=city,
                            country=country,
                            notes=notes,
                            daftra_id=daftra_id,
                        )
                        db.add(cust)
                        await db.flush()
                        existing_map[daftra_id] = cust
                        result.created += 1

                    # Portal enabled by default — phone + PORTAL_DEFAULT_PASSWORD
                    try:
                        if not hasattr(sync_clients, "_portal_hash"):
                            from app.core.security import hash_password
                            sync_clients._portal_hash = hash_password(  # type: ignore[attr-defined]
                                settings.PORTAL_DEFAULT_PASSWORD or "yousef123"
                            )
                        await ensure_customer_portal_user(
                            db, cust, password_hash=sync_clients._portal_hash,  # type: ignore[attr-defined]
                        )
                    except Exception as portal_exc:
                        _push_error(result, f"portal {daftra_id}: {type(portal_exc).__name__}")
            except Exception as exc:
                _push_error(result, f"client {daftra_id}: {type(exc).__name__}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


async def sync_portal(db: AsyncSession, client: Optional[DaftraClient], report: SyncReport) -> ModuleSyncResult:
    """Backfill portal logins for every Daftra-mapped customer (default password)."""
    from app.core.security import hash_password

    result = ModuleSyncResult(module="portal")
    report.current_module = "portal"
    save_sync_meta(report)

    shared_hash = hash_password(settings.PORTAL_DEFAULT_PASSWORD or "yousef123")
    page = 0
    page_size = 100
    while True:
        page += 1
        res = await db.execute(
            select(Customer)
            .where(Customer.daftra_id.is_not(None), Customer.deleted_at.is_(None))
            .order_by(Customer.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list(res.scalars().all())
        if not rows:
            break
        result.pages_done = page
        for cust in rows:
            cust_id = cust.id
            try:
                async with db.begin_nested():
                    before = cust.user_id
                    user = await ensure_customer_portal_user(
                        db, cust, password_hash=shared_hash, reset_password=False,
                    )
                    if user and before is None:
                        result.created += 1
                    elif user:
                        result.updated += 1
                    else:
                        result.skipped += 1
            except Exception as exc:
                _push_error(result, f"portal customer {cust_id}: {type(exc).__name__}")
        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)
        if len(rows) < page_size:
            break

    return result


async def sync_products(db: AsyncSession, client: DaftraClient, report: SyncReport) -> ModuleSyncResult:
    result = ModuleSyncResult(module="products")
    report.current_module = "products"
    save_sync_meta(report)

    async for batch, pag in client.list_products(limit=100):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        ids = {_str_id(unwrap(row, "Product").get("id")) for row in batch}
        ids.discard(None)
        if ids:
            res = await db.execute(select(Product).where(Product.daftra_id.in_(list(ids))))
            existing_map = {p.daftra_id: p for p in res.scalars().all() if p.daftra_id}
        else:
            existing_map = {}

        for row in batch:
            p = unwrap(row, "Product")
            daftra_id = _str_id(p.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                name = str(p.get("name") or p.get("product_code") or f"Product {daftra_id}").strip()[:255]
                sku = f"DFT-{daftra_id}"[:64]
                unit_price = _safe_float(p.get("unit_price") or p.get("average_price") or p.get("buy_price"))
                cost = _safe_float(p.get("buy_price") or p.get("average_cost"))
                status = p.get("status")
                is_active = str(status) in ("0", "None", "") or status is None or status == 0
                description = (p.get("notes") or p.get("description") or None) or None
                if description is not None:
                    description = str(description)
                slug = _slugify(name, f"dft-{daftra_id}")

                try:
                    async with db.begin_nested():
                        existing = existing_map.get(daftra_id)
                        if existing:
                            existing.name = name
                            existing.base_price = unit_price
                            existing.cost = cost
                            existing.is_active = bool(is_active)
                            existing.description = description
                            if existing.deleted_at is not None:
                                existing.deleted_at = None
                            result.updated += 1
                        else:
                            slug_base = slug
                            n = 0
                            while True:
                                candidate = slug_base if n == 0 else f"{slug_base}-{n}"
                                with db.no_autoflush:
                                    slug_clash = await db.execute(
                                        select(Product.id).where(Product.slug == candidate)
                                    )
                                if not slug_clash.scalar_one_or_none():
                                    slug = candidate
                                    break
                                n += 1
                                if n > 50:
                                    slug = f"dft-{daftra_id}-{n}"
                                    break
                            prod = Product(
                                sku=sku,
                                name=name,
                                slug=slug,
                                unit=str(p.get("unit") or "pcs")[:20],
                                base_price=unit_price,
                                cost=cost,
                                description=description,
                                is_active=bool(is_active),
                                is_customizable=False,
                                pricing_model="fixed",
                                daftra_id=daftra_id,
                            )
                            db.add(prod)
                            existing_map[daftra_id] = prod
                            result.created += 1
                except Exception as exc:
                    _push_error(result, f"product {daftra_id}: {exc}")
            except Exception as exc:
                _push_error(result, f"product {daftra_id}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


async def _upsert_invoice_fast(
    db: AsyncSession,
    inv: Dict[str, Any],
    customer_cache: Dict[str, Customer],
    invoice_cache: Dict[str, Invoice],
    staff_cache: Optional[Dict[str, User]] = None,
) -> str:
    daftra_id = _str_id(inv.get("id"))
    if not daftra_id:
        return "skipped"

    client_daftra_id = _str_id(inv.get("client_id"))
    if not client_daftra_id:
        return "skipped"

    customer = customer_cache.get(client_daftra_id)
    if not customer:
        customer = await _ensure_stub_customer(db, client_daftra_id, inv, customer_cache)

    code = f"DFT-INV-{daftra_id}"[:40]
    currency = str(inv.get("currency_code") or "IQD")[:8]
    issue_date = _parse_date(inv.get("date") or inv.get("issue_date"))
    due_raw = inv.get("due_date") or inv.get("payment_date")
    due_date = _parse_date(due_raw) if due_raw else None
    subtotal = _safe_float(inv.get("summary_subtotal") or inv.get("subtotal"))
    discount = _safe_float(inv.get("summary_discount") or inv.get("discount"))
    tax = _safe_float(inv.get("summary_tax") or inv.get("tax"))
    grand = _safe_float(inv.get("summary_total") or inv.get("total") or (subtotal - discount + tax))
    paid = _safe_float(inv.get("summary_paid") or inv.get("paid_amount"))
    balance_default = max(grand - paid, 0.0)
    balance = _safe_float(inv.get("summary_unpaid"), default=balance_default)
    notes = inv.get("notes") or inv.get("html_notes")
    if notes is not None:
        notes = str(notes)
    status = _invoice_status(inv)

    staff_cache = staff_cache or {}
    staff_daftra = _str_id(inv.get("staff_id"))
    sales_daftra = _str_id(inv.get("sales_person_id"))
    creator = staff_cache.get(staff_daftra) if staff_daftra else None
    salesperson = staff_cache.get(sales_daftra) if sales_daftra else None
    # Prefer dedicated sales person; fall back to creating staff when Daftra leaves sales blank.
    if salesperson is None and creator is not None:
        salesperson = creator

    existing = invoice_cache.get(daftra_id)
    if existing:
        invoice = existing
        invoice.customer_id = customer.id
        invoice.status = status
        invoice.issue_date = issue_date
        invoice.due_date = due_date
        invoice.currency = currency
        invoice.subtotal = subtotal
        invoice.discount_total = discount
        invoice.tax_total = tax
        invoice.grand_total = grand
        invoice.paid_total = paid
        invoice.balance = balance
        invoice.notes = notes
        if creator is not None:
            invoice.created_by_id = creator.id
        if salesperson is not None:
            invoice.salesperson_id = salesperson.id
        # Keep human invoice number in notes prefix if useful
        no = inv.get("no") or inv.get("invoice_number")
        if no and not notes:
            invoice.notes = f"Daftra #{no}"
        if invoice.deleted_at is not None:
            invoice.deleted_at = None
        await db.execute(delete(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id))
        action = "updated"
    else:
        invoice = Invoice(
            code=code,
            customer_id=customer.id,
            status=status,
            issue_date=issue_date,
            due_date=due_date,
            currency=currency,
            subtotal=subtotal,
            discount_total=discount,
            tax_total=tax,
            grand_total=grand,
            paid_total=paid,
            balance=balance,
            notes=notes or (f"Daftra #{inv.get('no')}" if inv.get("no") else None),
            daftra_id=daftra_id,
            created_by_id=creator.id if creator else None,
            salesperson_id=salesperson.id if salesperson else None,
        )
        db.add(invoice)
        await db.flush()
        invoice_cache[daftra_id] = invoice
        action = "created"

    line_name = (
        (inv.get("client_business_name") or "").strip()
        or f"Invoice {code}"
    )[:255]
    db.add(InvoiceItem(
        invoice_id=invoice.id,
        name=line_name,
        description=None,
        quantity=1.0,
        unit="pcs",
        unit_price=grand,
        discount_pct=0.0,
        tax_rate=0.0,
        line_total=grand,
    ))
    return action


def _upsert_module(report: SyncReport, result: ModuleSyncResult) -> None:
    for i, m in enumerate(report.modules):
        if m.module == result.module:
            report.modules[i] = result
            return
    report.modules.append(result)


async def sync_invoices(db: AsyncSession, client: DaftraClient, report: SyncReport) -> ModuleSyncResult:
    result = ModuleSyncResult(module="invoices")
    report.current_module = "invoices"
    save_sync_meta(report)

    async for batch, pag in client.list_invoices(limit=100):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        client_ids: Set[str] = set()
        inv_ids: Set[str] = set()
        staff_ids: Set[str] = set()
        parsed: List[Dict[str, Any]] = []
        for row in batch:
            inv = unwrap(row, "Invoice")
            parsed.append(inv)
            cid = _str_id(inv.get("client_id"))
            iid = _str_id(inv.get("id"))
            sid = _str_id(inv.get("staff_id"))
            spid = _str_id(inv.get("sales_person_id"))
            if cid:
                client_ids.add(cid)
            if iid:
                inv_ids.add(iid)
            if sid:
                staff_ids.add(sid)
            if spid:
                staff_ids.add(spid)

        customer_cache = await _customers_by_daftra_ids(db, client_ids)
        staff_cache = await _users_by_daftra_ids(db, staff_ids)
        if inv_ids:
            res = await db.execute(select(Invoice).where(Invoice.daftra_id.in_(list(inv_ids))))
            invoice_cache = {i.daftra_id: i for i in res.scalars().all() if i.daftra_id}
        else:
            invoice_cache = {}

        for inv in parsed:
            daftra_id = _str_id(inv.get("id"))
            try:
                async with db.begin_nested():
                    action = await _upsert_invoice_fast(
                        db, inv, customer_cache, invoice_cache, staff_cache,
                    )
                if action == "created":
                    result.created += 1
                elif action == "updated":
                    result.updated += 1
                else:
                    result.skipped += 1
            except Exception as exc:
                _push_error(result, f"invoice {daftra_id}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


async def sync_payments(db: AsyncSession, client: DaftraClient, report: SyncReport) -> ModuleSyncResult:
    result = ModuleSyncResult(module="payments")
    report.current_module = "payments"
    save_sync_meta(report)

    async for batch, pag in client.list_invoice_payments(limit=100):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        pay_ids: Set[str] = set()
        inv_ids: Set[str] = set()
        parsed: List[Dict[str, Any]] = []
        for row in batch:
            p = unwrap(row, "InvoicePayment")
            if not p.get("id"):
                p = unwrap(row, "Payment")
            parsed.append(p)
            pid = _str_id(p.get("id"))
            iid = _str_id(p.get("invoice_id"))
            if pid:
                pay_ids.add(pid)
            if iid:
                inv_ids.add(iid)

        if inv_ids:
            res = await db.execute(select(Invoice).where(Invoice.daftra_id.in_(list(inv_ids))))
            invoice_map = {i.daftra_id: i for i in res.scalars().all() if i.daftra_id}
        else:
            invoice_map = {}

        if pay_ids:
            res = await db.execute(select(Payment).where(Payment.daftra_id.in_(list(pay_ids))))
            payment_map = {p.daftra_id: p for p in res.scalars().all() if p.daftra_id}
        else:
            payment_map = {}

        for p in parsed:
            daftra_id = _str_id(p.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                invoice_daftra_id = _str_id(p.get("invoice_id"))
                invoice = invoice_map.get(invoice_daftra_id) if invoice_daftra_id else None
                if not invoice:
                    result.skipped += 1
                    continue
                amount = _safe_float(p.get("amount"))
                if amount <= 0:
                    result.skipped += 1
                    continue
                method = str(p.get("payment_method") or p.get("treasury_name") or "cash")[:40]
                paid_at = _parse_datetime(p.get("date") or p.get("created") or p.get("paid_at"))
                reference = p.get("transaction_id") or p.get("reference")
                if reference is not None:
                    reference = str(reference)[:120]

                existing = payment_map.get(daftra_id)
                if existing:
                    existing.amount = amount
                    existing.method = method
                    existing.paid_at = paid_at
                    existing.reference = reference
                    existing.invoice_id = invoice.id
                    existing.customer_id = invoice.customer_id
                    existing.currency = invoice.currency
                    result.updated += 1
                else:
                    pay = Payment(
                        invoice_id=invoice.id,
                        customer_id=invoice.customer_id,
                        method=method,
                        amount=amount,
                        currency=invoice.currency,
                        paid_at=paid_at,
                        reference=reference,
                        daftra_id=daftra_id,
                    )
                    db.add(pay)
                    payment_map[daftra_id] = pay
                    result.created += 1
            except Exception as exc:
                _push_error(result, f"payment {daftra_id}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


async def sync_expenses(db: AsyncSession, client: DaftraClient, report: SyncReport) -> ModuleSyncResult:
    result = ModuleSyncResult(module="expenses")
    report.current_module = "expenses"
    save_sync_meta(report)

    async for batch, pag in client.list_expenses(limit=100):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        ids = {_str_id(unwrap(row, "Expense").get("id")) for row in batch}
        ids.discard(None)
        if ids:
            res = await db.execute(select(Expense).where(Expense.daftra_id.in_(list(ids))))
            existing_map = {e.daftra_id: e for e in res.scalars().all() if e.daftra_id}
        else:
            existing_map = {}

        for row in batch:
            e = unwrap(row, "Expense")
            daftra_id = _str_id(e.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                amount = _safe_float(e.get("amount"))
                if amount <= 0:
                    result.skipped += 1
                    continue
                category = str(
                    e.get("expense_category")
                    or e.get("category")
                    or e.get("journal_account_name")
                    or "general"
                )[:80]
                description = e.get("notes") or e.get("description") or e.get("vendor")
                if description is not None:
                    description = str(description)
                currency = str(e.get("currency_code") or "IQD")[:8]
                spent_at = _parse_date(e.get("date") or e.get("created"))

                existing = existing_map.get(daftra_id)
                if existing:
                    existing.category = category
                    existing.description = description
                    existing.amount = amount
                    existing.currency = currency
                    existing.spent_at = spent_at
                    if existing.deleted_at is not None:
                        existing.deleted_at = None
                    result.updated += 1
                else:
                    exp = Expense(
                        category=category,
                        description=description,
                        amount=amount,
                        currency=currency,
                        spent_at=spent_at,
                        daftra_id=daftra_id,
                    )
                    db.add(exp)
                    existing_map[daftra_id] = exp
                    result.created += 1
            except Exception as exc:
                _push_error(result, f"expense {daftra_id}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


def _map_subscription_interval(inv: Dict[str, Any]) -> str:
    """Map Daftra subscription_unit → local weekly|monthly|yearly."""
    unit = str(inv.get("subscription_unit") or inv.get("period") or "months").strip().lower()
    if unit in ("day", "days"):
        return "weekly"
    if unit in ("week", "weeks"):
        return "weekly"
    if unit in ("year", "years"):
        return "yearly"
    return "monthly"


def _subscription_items(payload: Any, inv: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract InvoiceItem list from view_subscription / list payload."""
    items: Any = None
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, dict):
            items = data.get("InvoiceItem")
            if items is None:
                nested = unwrap(data, "Invoice")
                items = nested.get("InvoiceItem") if nested else None
        elif isinstance(data, list) and data and isinstance(data[0], dict):
            items = data[0].get("InvoiceItem")
        if items is None:
            items = payload.get("InvoiceItem")
    if items is None:
        items = inv.get("InvoiceItem")
    if isinstance(items, dict):
        return [items]
    if isinstance(items, list):
        out = []
        for x in items:
            if isinstance(x, dict) and "InvoiceItem" in x:
                out.append(unwrap(x, "InvoiceItem"))
            elif isinstance(x, dict):
                out.append(x)
        return out
    return []


async def sync_subscriptions(
    db: AsyncSession, client: DaftraClient, report: SyncReport,
) -> ModuleSyncResult:
    """Pull Daftra subscriptions → local RecurringInvoice (offline-capable)."""
    result = ModuleSyncResult(module="subscriptions")
    report.current_module = "subscriptions"
    save_sync_meta(report)

    async for batch, pag in client.list_subscriptions(limit=50):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        for row in batch:
            inv = unwrap(row, "Invoice")
            daftra_id = _str_id(inv.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                async with db.begin_nested():
                    # Full detail (line items + recurrence fields)
                    detail_payload: Dict[str, Any] = {}
                    try:
                        detail_payload = await client.get_subscription(daftra_id)
                        data = detail_payload.get("data") if isinstance(detail_payload, dict) else None
                        if isinstance(data, dict):
                            nested = unwrap(data, "Invoice")
                            if nested:
                                inv = {**inv, **nested}
                    except Exception:
                        pass

                    client_daftra_id = _str_id(inv.get("client_id"))
                    if not client_daftra_id:
                        result.skipped += 1
                        continue

                    cust_res = await db.execute(
                        select(Customer).where(Customer.daftra_id == client_daftra_id)
                    )
                    customer = cust_res.scalar_one_or_none()
                    if not customer:
                        customer = await _ensure_stub_customer(
                            db, client_daftra_id, inv, {},
                        )

                    title = (
                        (inv.get("name") or "").strip()
                        or (inv.get("client_business_name") or "").strip()
                        or f"Subscription {daftra_id}"
                    )[:255]
                    code = f"DFT-SUB-{daftra_id}"[:40]
                    currency = str(inv.get("currency_code") or "IQD")[:8]
                    interval = _map_subscription_interval(inv)
                    period = inv.get("subscription_period") or 1
                    try:
                        period_n = int(period)
                    except (TypeError, ValueError):
                        period_n = 1

                    next_raw = (
                        inv.get("subscription_next_invoice_date")
                        or inv.get("next_invoice_date")
                        or inv.get("date")
                        or inv.get("issue_date")
                    )
                    next_run = _parse_date(next_raw)
                    end_raw = (
                        inv.get("subscription_end_date")
                        or inv.get("end_date")
                        or inv.get("due_date")
                    )
                    end_date = _parse_date(end_raw) if end_raw else None

                    active_raw = inv.get("active")
                    if active_raw is None:
                        is_active = str(inv.get("draft") or "0") not in ("1", "true", "True")
                    else:
                        is_active = str(active_raw) in ("1", "true", "True")

                    subtotal = _safe_float(inv.get("summary_subtotal") or inv.get("subtotal"))
                    tax = _safe_float(inv.get("summary_tax") or inv.get("tax"))
                    grand = _safe_float(
                        inv.get("summary_total") or inv.get("total") or (subtotal + tax)
                    )
                    notes_parts = []
                    if inv.get("notes"):
                        notes_parts.append(str(inv.get("notes")))
                    if inv.get("no"):
                        notes_parts.append(f"Daftra #{inv.get('no')}")
                    if period_n > 1:
                        notes_parts.append(
                            f"Every {period_n} {inv.get('subscription_unit') or interval}"
                        )
                    max_rep = inv.get("subscription_max_repeat")
                    if max_rep not in (None, "", 0, "0"):
                        notes_parts.append(f"Max repeats: {max_rep}")
                    notes = "\n".join(notes_parts) if notes_parts else None

                    existing_res = await db.execute(
                        select(RecurringInvoice).where(RecurringInvoice.daftra_id == daftra_id)
                    )
                    existing = existing_res.scalar_one_or_none()

                    if existing:
                        sch = existing
                        sch.customer_id = customer.id
                        sch.title = title
                        sch.interval = interval
                        sch.next_run = next_run
                        sch.end_date = end_date
                        sch.is_active = is_active
                        sch.currency = currency
                        sch.subtotal = subtotal
                        sch.tax_total = tax
                        sch.grand_total = grand
                        sch.notes = notes
                        if sch.deleted_at is not None:
                            sch.deleted_at = None
                        await db.execute(
                            delete(RecurringInvoiceItem).where(
                                RecurringInvoiceItem.schedule_id == sch.id
                            )
                        )
                        action = "updated"
                    else:
                        clash = await db.execute(
                            select(RecurringInvoice.id).where(RecurringInvoice.code == code)
                        )
                        if clash.scalar_one_or_none():
                            code = f"D-SUB-{daftra_id}"[:40]
                        sch = RecurringInvoice(
                            code=code,
                            customer_id=customer.id,
                            title=title,
                            interval=interval,
                            next_run=next_run,
                            end_date=end_date,
                            is_active=is_active,
                            currency=currency,
                            subtotal=subtotal,
                            tax_total=tax,
                            grand_total=grand,
                            notes=notes,
                            daftra_id=daftra_id,
                        )
                        db.add(sch)
                        await db.flush()
                        action = "created"

                    items_raw = _subscription_items(detail_payload, inv)
                    if not items_raw and grand:
                        items_raw = [{
                            "item": title,
                            "quantity": 1,
                            "unit_price": grand,
                        }]

                    for line in items_raw:
                        name = str(
                            line.get("item")
                            or line.get("name")
                            or line.get("product_name")
                            or title
                        )[:255]
                        qty = _safe_float(line.get("quantity"), 1.0) or 1.0
                        unit_price = _safe_float(line.get("unit_price") or line.get("price"))
                        tax_rate = _safe_float(line.get("tax_rate") or line.get("tax1"))
                        line_total = _safe_float(
                            line.get("subtotal") or line.get("total"),
                            qty * unit_price,
                        )
                        db.add(RecurringInvoiceItem(
                            schedule_id=sch.id,
                            name=name,
                            quantity=qty,
                            unit_price=unit_price,
                            tax_rate=tax_rate,
                            line_total=line_total,
                        ))

                    if action == "created":
                        result.created += 1
                    else:
                        result.updated += 1
            except Exception as exc:
                _push_error(result, f"subscription {daftra_id}: {type(exc).__name__}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


def _opt_str_id(value: Any) -> Optional[str]:
    if value is None or value == "":
        return None
    return _str_id(value)


async def sync_hr_departments(
    db: AsyncSession, client: DaftraClient, report: SyncReport,
) -> ModuleSyncResult:
    """Pull Daftra HR departments → local Department (for designation linking)."""
    result = ModuleSyncResult(module="hr_departments")
    report.current_module = "hr_departments"
    save_sync_meta(report)

    async for batch, pag in client.list_hr_departments(per_page=50):
        try:
            result.total_pages = int(pag.get("last_page") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        for row in batch:
            if not isinstance(row, dict):
                result.skipped += 1
                continue
            daftra_id = _str_id(row.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                async with db.begin_nested():
                    name = str(row.get("name") or f"Department {daftra_id}").strip()[:120]
                    desc = row.get("description")
                    description = str(desc).strip() if desc else None
                    is_active = str(row.get("active") if row.get("active") is not None else 1) in (
                        "1", "true", "True",
                    )
                    slug = _slugify(name, f"dft-dept-{daftra_id}")[:64]

                    existing_res = await db.execute(
                        select(Department).where(Department.daftra_id == daftra_id)
                    )
                    existing = existing_res.scalar_one_or_none()
                    if not existing:
                        by_name = await db.execute(
                            select(Department).where(Department.name == name)
                        )
                        existing = by_name.scalar_one_or_none()
                        if existing and existing.daftra_id not in (None, daftra_id):
                            name = f"{name} (DFT-{daftra_id})"[:120]
                            slug = f"dft-dept-{daftra_id}"[:64]
                            existing = None

                    if existing:
                        existing.daftra_id = daftra_id
                        existing.description = description or existing.description
                        existing.is_active = is_active
                        result.updated += 1
                    else:
                        # Ensure unique slug
                        base_slug = slug
                        for n in range(0, 20):
                            candidate = base_slug if n == 0 else f"{base_slug}-{n}"[:64]
                            clash = await db.execute(
                                select(Department.id).where(Department.slug == candidate)
                            )
                            if clash.scalar_one_or_none() is None:
                                slug = candidate
                                break
                        name_clash = await db.execute(
                            select(Department.id).where(Department.name == name)
                        )
                        if name_clash.scalar_one_or_none():
                            name = f"{name} ({daftra_id})"[:120]
                        db.add(Department(
                            name=name,
                            slug=slug,
                            description=description,
                            sort_order=int(daftra_id) if daftra_id.isdigit() else 0,
                            is_active=is_active,
                            daftra_id=daftra_id,
                        ))
                        result.created += 1
            except Exception as exc:
                _push_error(result, f"hr_department {daftra_id}: {type(exc).__name__}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


async def sync_designations(
    db: AsyncSession, client: DaftraClient, report: SyncReport,
) -> ModuleSyncResult:
    """Pull Daftra designations (job titles) → local Designation (offline-capable)."""
    # Departments first so designation.department_id can resolve
    await sync_hr_departments(db, client, report)

    result = ModuleSyncResult(module="designations")
    report.current_module = "designations"
    save_sync_meta(report)

    # Cache local departments by daftra_id
    dept_res = await db.execute(
        select(Department).where(Department.daftra_id.is_not(None))
    )
    dept_by_daftra = {
        d.daftra_id: d for d in dept_res.scalars().all() if d.daftra_id
    }

    async for batch, pag in client.list_designations(per_page=50):
        try:
            result.total_pages = int(pag.get("last_page") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        for row in batch:
            if not isinstance(row, dict):
                result.skipped += 1
                continue
            daftra_id = _str_id(row.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                async with db.begin_nested():
                    name = str(row.get("name") or f"Designation {daftra_id}").strip()[:255]
                    desc = row.get("description")
                    description = str(desc).strip() if desc else None
                    is_active = str(row.get("active") if row.get("active") is not None else 1) in (
                        "1", "true", "True",
                    )
                    daftra_dept_id = _opt_str_id(row.get("department_id"))
                    local_dept = dept_by_daftra.get(daftra_dept_id) if daftra_dept_id else None

                    role_raw = row.get("role_id")
                    try:
                        role_id = int(role_raw) if role_raw not in (None, "") else None
                    except (TypeError, ValueError):
                        role_id = None

                    existing_res = await db.execute(
                        select(Designation).where(Designation.daftra_id == daftra_id)
                    )
                    existing = existing_res.scalar_one_or_none()

                    fields = dict(
                        name=name,
                        description=description,
                        is_active=is_active,
                        department_id=local_dept.id if local_dept else None,
                        daftra_department_id=daftra_dept_id,
                        daftra_role_id=role_id,
                        employment_type_id=_opt_str_id(row.get("employment_type_id")),
                        employment_level_id=_opt_str_id(row.get("employment_level_id")),
                        salary_structure_id=_opt_str_id(row.get("salary_structure_id")),
                        payroll_frequency=(
                            str(row.get("payroll_frequency")).strip()[:40]
                            if row.get("payroll_frequency") not in (None, "")
                            else None
                        ),
                        currency_code=(
                            str(row.get("currency_code")).strip()[:8]
                            if row.get("currency_code") not in (None, "")
                            else None
                        ),
                    )

                    if existing:
                        for k, v in fields.items():
                            setattr(existing, k, v)
                        if existing.deleted_at is not None:
                            existing.deleted_at = None
                        result.updated += 1
                    else:
                        db.add(Designation(daftra_id=daftra_id, **fields))
                        result.created += 1
            except Exception as exc:
                _push_error(result, f"designation {daftra_id}: {type(exc).__name__}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


def _staff_site_root() -> str:
    root = settings.DAFTRA_BASE_URL.rstrip("/")
    if root.endswith("/api2"):
        root = root[: -len("/api2")]
    return root.rstrip("/")


def _staff_email(row: Dict[str, Any], daftra_id: str) -> str:
    email = str(row.get("email_address") or "").strip().lower()
    if email and "@" in email and " " not in email:
        return email[:255]
    return f"staff{daftra_id}@staff.local"


def _staff_avatar(photo: Any) -> Optional[str]:
    text = str(photo or "").strip()
    if not text:
        return None
    if text.startswith("http://") or text.startswith("https://"):
        return text[:500]
    return f"{_staff_site_root()}/{text.lstrip('/')}"[:500]


def _opt_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


async def _upsert_staff_profile(
    db: AsyncSession,
    *,
    user: User,
    daftra_id: str,
    row: Dict[str, Any],
    info: Dict[str, Any],
    designation_id: Optional[int],
) -> StaffProfile:
    res = await db.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        profile = StaffProfile(user_id=user.id)
        db.add(profile)

    profile.daftra_id = daftra_id
    profile.employee_code = str(row.get("code") or daftra_id)[:40]
    profile.staff_type = str(row.get("type") or "employee")[:40] or None
    profile.can_access_system = str(row.get("can_access_system") or "0") in ("1", "true", "True")
    profile.designation_id = designation_id
    profile.address1 = (str(row.get("address1")).strip()[:255] if row.get("address1") else None)
    profile.address2 = (str(row.get("address2")).strip()[:255] if row.get("address2") else None)
    profile.city = (str(row.get("city")).strip()[:120] if row.get("city") else None)
    profile.state = (str(row.get("state")).strip()[:120] if row.get("state") else None)
    profile.postal_code = (str(row.get("postal_code")).strip()[:40] if row.get("postal_code") else None)
    profile.country_code = (str(row.get("country_code")).strip()[:8] if row.get("country_code") else None)
    profile.home_phone = (str(row.get("home_phone")).strip()[:40] if row.get("home_phone") else None)
    profile.business_phone = (
        str(row.get("business_Phone") or row.get("business_phone") or "").strip()[:40] or None
    )
    profile.fax = (str(row.get("fax")).strip()[:40] if row.get("fax") else None)
    profile.nationality = (str(row.get("nationality")).strip()[:80] if row.get("nationality") else None)
    profile.citizenship_status = (
        str(row.get("citizenship_status")).strip()[:80] if row.get("citizenship_status") else None
    )
    profile.official_id = (str(row.get("official_id")).strip()[:80] if row.get("official_id") else None)
    profile.gender = (str(info.get("gender") or "").strip()[:40] or None)
    profile.birth_date = _parse_date_opt(info.get("birth_date"))
    created = row.get("created") or info.get("created")
    profile.hire_date = _parse_date_opt(created)
    resid = row.get("residence_expiry_date") or info.get("residence_expiry_date")
    profile.residence_expiry = _parse_date_opt(resid)
    profile.hourly_rate = _opt_float(row.get("hourly_rate"))
    profile.hourly_rate_currency = (
        str(row.get("hourly_rate_currency_code") or "").strip()[:8] or None
    )
    profile.employment_type_id = _opt_str_id(info.get("employment_type_id"))
    profile.employment_level_id = _opt_str_id(info.get("employment_level_id"))
    note = row.get("note") or row.get("notes")
    profile.notes = str(note).strip() if note else None
    return profile


async def _ensure_staff_contract(
    db: AsyncSession,
    *,
    user: User,
    daftra_id: str,
    title: Optional[str],
    profile: StaffProfile,
    is_active: bool,
) -> None:
    """Ensure a primary HR contract exists so synced staff appear in HR reports."""
    existing = await db.execute(
        select(EmployeeContract).where(
            EmployeeContract.employee_id == user.id,
            EmployeeContract.deleted_at.is_(None),
        ).order_by(EmployeeContract.is_primary.desc(), EmployeeContract.id.asc())
    )
    contracts = list(existing.scalars().all())
    salary = 0.0
    currency = profile.hourly_rate_currency or "IQD"
    if profile.hourly_rate is not None:
        # Store monthly estimate (hourly × 160) for reporting when only rate is known
        salary = float(profile.hourly_rate) * 160.0
    start = profile.hire_date or date.today()
    job_title = (title or user.title or "Employee")[:120]

    if contracts:
        primary = next((c for c in contracts if c.is_primary), contracts[0])
        primary.job_title = job_title
        primary.title = job_title
        if salary > 0:
            primary.salary = salary
            primary.currency = currency[:8]
        primary.status = "active" if is_active else "suspended"
        if primary.join_date is None and profile.hire_date:
            primary.join_date = profile.hire_date
        return

    code = f"DFT-CTR-{daftra_id}"[:40]
    clash = await db.execute(select(EmployeeContract.id).where(EmployeeContract.code == code))
    if clash.scalar_one_or_none():
        code = f"D-CTR-{daftra_id}-{user.id}"[:40]
    db.add(EmployeeContract(
        code=code,
        employee_id=user.id,
        title=job_title,
        job_title=job_title,
        status="active" if is_active else "suspended",
        start_date=start,
        join_date=profile.hire_date,
        salary=salary,
        currency=currency[:8],
        salary_template="monthly",
        is_primary=True,
        notes=f"Synced from Daftra staff #{daftra_id}",
    ))


async def sync_staff(
    db: AsyncSession, client: DaftraClient, report: SyncReport,
) -> ModuleSyncResult:
    """Pull Daftra GET /staff.json → Users + StaffProfile + contracts (offline-capable)."""
    await sync_designations(db, client, report)

    result = ModuleSyncResult(module="staff")
    report.current_module = "staff"
    save_sync_meta(report)

    dept_res = await db.execute(
        select(Department).where(Department.daftra_id.is_not(None))
    )
    dept_by_daftra = {d.daftra_id: d for d in dept_res.scalars().all() if d.daftra_id}

    desig_res = await db.execute(
        select(Designation).where(Designation.daftra_id.is_not(None))
    )
    desig_by_daftra = {d.daftra_id: d for d in desig_res.scalars().all() if d.daftra_id}

    # V2 index for department / designation / birth_date (api2 list lacks staff_info)
    v2_index: Dict[str, Dict[str, Any]] = {}
    try:
        v2_index = await client.staff_v2_index()
    except Exception as exc:
        logger.warning("Daftra staff v2 enrichment unavailable: %s", exc)

    default_password = settings.PORTAL_DEFAULT_PASSWORD or "yousef123"

    async for batch, pag in client.list_staff(limit=50):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        for row in batch:
            if not isinstance(row, dict):
                result.skipped += 1
                continue
            daftra_id = _str_id(row.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue

            # Skip soft-deleted remote staff
            if row.get("deleted") not in (None, "", 0, "0", False) or row.get("deleted_at"):
                existing_del = await db.execute(
                    select(User).where(User.daftra_id == daftra_id)
                )
                u_del = existing_del.scalar_one_or_none()
                if u_del and u_del.deleted_at is None:
                    u_del.is_active = False
                    u_del.deleted_at = datetime.now(timezone.utc)
                    result.updated += 1
                else:
                    result.skipped += 1
                continue

            try:
                async with db.begin_nested():
                    v2 = v2_index.get(daftra_id) or {}
                    info = v2.get("staff_info") if isinstance(v2.get("staff_info"), dict) else {}
                    # Prefer richer v2 name/email when api2 row is sparse
                    merged = {**row}
                    for k in ("full_name", "email_address", "mobile", "photo", "active"):
                        if not merged.get(k) and v2.get(k) is not None:
                            merged[k] = v2.get(k)

                    full_name = (
                        str(merged.get("full_name") or "").strip()
                        or " ".join(
                            p for p in [
                                str(merged.get("name") or "").strip(),
                                str(merged.get("middle_name") or "").strip(),
                                str(merged.get("last_name") or "").strip(),
                            ] if p
                        )
                        or f"Staff {daftra_id}"
                    )[:255]
                    email = _staff_email(merged, daftra_id)
                    phone_raw = merged.get("mobile") or merged.get("home_phone") or merged.get("business_Phone")
                    phone = normalize_phone(str(phone_raw)) if phone_raw else None
                    if phone and len(phone) > 40:
                        phone = phone[:40]
                    is_active = str(merged.get("active") if merged.get("active") is not None else 1) in (
                        "1", "true", "True", True,
                    )
                    avatar = _staff_avatar(merged.get("photo"))

                    dept_daftra = _opt_str_id(info.get("department_id"))
                    local_dept = dept_by_daftra.get(dept_daftra) if dept_daftra else None
                    desig_daftra = _opt_str_id(info.get("designation_id"))
                    local_desig = desig_by_daftra.get(desig_daftra) if desig_daftra else None
                    title = (local_desig.name if local_desig else None)

                    existing_res = await db.execute(
                        select(User).where(User.daftra_id == daftra_id)
                    )
                    existing = existing_res.scalar_one_or_none()
                    if not existing:
                        by_email = await db.execute(
                            select(User).where(User.email == email)
                        )
                        existing = by_email.scalar_one_or_none()
                        if existing:
                            portal_link = await db.execute(
                                select(Customer.id).where(Customer.user_id == existing.id)
                            )
                            if portal_link.scalar_one_or_none() and not existing.is_staff:
                                email = f"staff{daftra_id}@staff.local"
                                existing = None
                            elif existing.daftra_id not in (None, daftra_id):
                                email = f"staff{daftra_id}@staff.local"
                                clash2 = await db.execute(select(User).where(User.email == email))
                                existing = clash2.scalar_one_or_none()

                    last_login_raw = merged.get("last_login")
                    last_login_at = _parse_datetime(last_login_raw) if last_login_raw else None

                    if existing:
                        user = existing
                        user.full_name = full_name
                        if phone:
                            user.phone = phone
                        user.is_active = is_active
                        user.is_staff = True
                        user.daftra_id = daftra_id
                        if local_dept:
                            user.department_id = local_dept.id
                            user.department = local_dept.name
                        if title:
                            user.title = title[:120]
                        if avatar:
                            user.avatar_url = avatar
                        if last_login_at and (
                            user.last_login_at is None or last_login_at > user.last_login_at
                        ):
                            user.last_login_at = last_login_at
                        if user.deleted_at is not None:
                            user.deleted_at = None
                        # Keep portal login usable: email + default password
                        email_l = (user.email or "").lower()
                        if is_active and not (
                            email_l.endswith("@atelier.app")
                            or email_l.endswith("@test.atelier.app")
                        ):
                            user.password_hash = hash_password(default_password)
                        action = "updated"
                    else:
                        clash = await db.execute(select(User.id).where(User.email == email))
                        if clash.scalar_one_or_none():
                            email = f"staff{daftra_id}@staff.local"
                        user = User(
                            email=email,
                            full_name=full_name,
                            phone=phone,
                            avatar_url=avatar,
                            department=local_dept.name if local_dept else None,
                            department_id=local_dept.id if local_dept else None,
                            title=title[:120] if title else None,
                            is_active=is_active,
                            is_staff=True,
                            is_superuser=False,
                            password_hash=hash_password(default_password),
                            daftra_id=daftra_id,
                            locale="ar",
                            last_login_at=last_login_at,
                        )
                        db.add(user)
                        await db.flush()
                        action = "created"

                    profile = await _upsert_staff_profile(
                        db,
                        user=user,
                        daftra_id=daftra_id,
                        row=merged,
                        info=info,
                        designation_id=local_desig.id if local_desig else None,
                    )
                    await db.flush()
                    await _ensure_staff_contract(
                        db,
                        user=user,
                        daftra_id=daftra_id,
                        title=title,
                        profile=profile,
                        is_active=is_active,
                    )

                    # Job title → RBAC (مصمم→designer, محاسب→accountant, فني→general_manager)
                    await apply_title_role_to_user(db, user)

                    if action == "created":
                        result.created += 1
                    else:
                        result.updated += 1
            except Exception as exc:
                _push_error(result, f"staff {daftra_id}: {type(exc).__name__}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


def _payslip_component_bucket(pc: Dict[str, Any]) -> str:
    """Map a Daftra salary component into base / overtime / absence / other."""
    key = str(pc.get("component_key") or "").strip().lower()
    name = str(pc.get("name") or "").strip().lower()
    is_basic = pc.get("is_basic") in (1, "1", True, "true", "True")
    if is_basic or key in ("sc_1", "system_basic", "basic") or "راتب" in name or "salary" in name or "basic" in name:
        return "base"
    if key == "sc_6" or "اوفر" in name or "overtime" in name or "over time" in name:
        return "overtime"
    if key in ("sc_11", "sc_5") or "غياب" in name or "absence" in name or "absent" in name:
        return "absence"
    return "other"


async def sync_payslips(
    db: AsyncSession, client: DaftraClient, report: SyncReport,
) -> ModuleSyncResult:
    """Pull Daftra V2 payslip (+ components) → local Payslip rows."""
    result = ModuleSyncResult(module="payslips")
    report.current_module = "payslips"
    save_sync_meta(report)

    # staff_id (Daftra) → local User.id
    staff_res = await db.execute(
        select(User).where(User.daftra_id.is_not(None), User.is_staff.is_(True))
    )
    staff_by_daftra: Dict[str, User] = {
        u.daftra_id: u for u in staff_res.scalars().all() if u.daftra_id
    }

    async for batch, pag in client.iter_entity_pages("payslip", level=1, per_page=50):
        try:
            result.total_pages = int(pag.get("last_page") or pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        ids = {_str_id(r.get("id")) for r in batch if isinstance(r, dict)}
        ids.discard(None)
        existing_map: Dict[str, Payslip] = {}
        if ids:
            res = await db.execute(select(Payslip).where(Payslip.daftra_id.in_(list(ids))))
            existing_map = {p.daftra_id: p for p in res.scalars().all() if p.daftra_id}

        for row in batch:
            if not isinstance(row, dict):
                result.skipped += 1
                continue
            daftra_id = _str_id(row.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue

            if row.get("deleted_at"):
                existing = existing_map.get(daftra_id)
                if existing and existing.deleted_at is None:
                    existing.deleted_at = datetime.now(timezone.utc)
                    result.updated += 1
                else:
                    result.skipped += 1
                continue

            staff_daftra = _str_id(row.get("staff_id"))
            user = staff_by_daftra.get(staff_daftra) if staff_daftra else None
            if not user:
                result.skipped += 1
                continue

            try:
                async with db.begin_nested():
                    period_start = _parse_date(row.get("start_date"))
                    period_end = _parse_date(row.get("end_date") or row.get("start_date"))
                    gross = _safe_float(row.get("gross_pay"))
                    deductions = _safe_float(row.get("total_deduction") or row.get("total_deductions"))
                    net = _safe_float(row.get("net_pay"))
                    status = str(row.get("status") or "").strip().lower()
                    paid = status in ("paid", "1", "true") or bool(row.get("payment_id"))
                    expense = row.get("expense") if isinstance(row.get("expense"), dict) else {}
                    currency = str(
                        (expense or {}).get("currency_code")
                        or row.get("currency_code")
                        or "IQD"
                    ).strip()[:8] or "IQD"
                    paid_at = None
                    if paid:
                        paid_at = _parse_datetime(
                            row.get("posting_date") or row.get("modified") or row.get("created")
                        )
                    notes = str(row.get("notes")).strip() if row.get("notes") else None
                    code = f"DFT-PS-{daftra_id}"[:40]

                    existing = existing_map.get(daftra_id)
                    if existing:
                        slip = existing
                        slip.employee_id = user.id
                        slip.period_start = period_start
                        slip.period_end = period_end
                        slip.gross_pay = gross
                        slip.deductions = deductions
                        slip.net_pay = net
                        # Keep component breakdown unless still zero (set below / later pass)
                        if slip.base_salary <= 0 and slip.overtime <= 0 and slip.absence <= 0:
                            slip.base_salary = gross
                            slip.overtime = 0.0
                            slip.absence = deductions
                        slip.currency = currency
                        slip.paid = paid
                        slip.paid_at = paid_at
                        slip.notes = notes
                        slip.deleted_at = None
                        slip.source = "daftra"
                        slip.status = "paid" if paid else "draft"
                        if not slip.code:
                            slip.code = code
                        result.updated += 1
                    else:
                        clash = await db.execute(select(Payslip.id).where(Payslip.code == code))
                        if clash.scalar_one_or_none():
                            code = f"D-PS-{daftra_id}-{user.id}"[:40]
                        slip = Payslip(
                            employee_id=user.id,
                            code=code,
                            period_start=period_start,
                            period_end=period_end,
                            gross_pay=gross,
                            deductions=deductions,
                            net_pay=net,
                            base_salary=gross,
                            overtime=0.0,
                            absence=deductions,
                            bonus=0.0,
                            currency=currency,
                            paid=paid,
                            paid_at=paid_at,
                            status="paid" if paid else "draft",
                            source="daftra",
                            notes=notes,
                            daftra_id=daftra_id,
                        )
                        db.add(slip)
                        existing_map[daftra_id] = slip
                        result.created += 1
            except Exception as exc:
                _push_error(result, f"payslip {daftra_id}: {type(exc).__name__}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    # Second pass: aggregate payslip_component into base / OT / absence
    totals: Dict[str, Dict[str, float]] = {}
    async for batch, pag in client.iter_entity_pages("payslip_component", level=1, per_page=100):
        result.pages_done += 1
        for row in batch:
            if not isinstance(row, dict):
                continue
            payslip_id = _str_id(row.get("payslip_id"))
            if not payslip_id:
                continue
            amount = _safe_float(row.get("amount"))
            pc = row.get("payslip_component") if isinstance(row.get("payslip_component"), dict) else {}
            bucket = _payslip_component_bucket(pc)
            if bucket == "other":
                continue
            slot = totals.setdefault(payslip_id, {"base": 0.0, "overtime": 0.0, "absence": 0.0})
            slot[bucket] = slot.get(bucket, 0.0) + amount

        _upsert_module(report, result)
        save_sync_meta(report)

    if totals:
        ids = list(totals.keys())
        # chunk updates
        for i in range(0, len(ids), 200):
            chunk = ids[i : i + 200]
            res = await db.execute(select(Payslip).where(Payslip.daftra_id.in_(chunk)))
            for slip in res.scalars().all():
                if not slip.daftra_id:
                    continue
                slot = totals.get(slip.daftra_id)
                if not slot:
                    continue
                slip.base_salary = float(slot.get("base") or 0.0)
                slip.overtime = float(slot.get("overtime") or 0.0)
                slip.absence = float(slot.get("absence") or 0.0)
                # If Daftra had no basic line, fall back so chart still has a salary row
                if slip.base_salary <= 0 and slip.gross_pay > 0:
                    slip.base_salary = max(0.0, slip.gross_pay - slip.overtime)
            await db.commit()

    # Refresh primary contract salary from latest base payslip when available
    try:
        for staff_daftra, user in staff_by_daftra.items():
            latest = await db.execute(
                select(Payslip)
                .where(Payslip.employee_id == user.id, Payslip.deleted_at.is_(None))
                .order_by(Payslip.period_end.desc())
                .limit(1)
            )
            slip = latest.scalar_one_or_none()
            if not slip or slip.base_salary <= 0:
                continue
            ctr = await db.execute(
                select(EmployeeContract).where(
                    EmployeeContract.employee_id == user.id,
                    EmployeeContract.deleted_at.is_(None),
                    EmployeeContract.is_primary.is_(True),
                ).limit(1)
            )
            contract = ctr.scalar_one_or_none()
            if contract:
                contract.salary = float(slip.base_salary)
                contract.currency = (slip.currency or contract.currency or "IQD")[:8]
        await db.commit()
    except Exception as exc:
        logger.warning("Payslip→contract salary refresh failed: %s", exc)

    return result


def _work_order_assigned_staff_ids(row: Dict[str, Any]) -> List[str]:
    """Normalize assigned_users (dict or list) → unique Daftra staff ids."""
    raw = row.get("assigned_users")
    entries: List[Any]
    if isinstance(raw, list):
        entries = raw
    elif isinstance(raw, dict):
        entries = [raw]
    else:
        entries = []
    ids: List[str] = []
    seen: Set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        sid = _str_id(entry.get("staff_id"))
        if sid and sid not in seen:
            seen.add(sid)
            ids.append(sid)
    return ids


def _work_order_code(daftra_id: str, number: Optional[str]) -> str:
    # Numbers are per workflow-type in Daftra; use global id for uniqueness.
    num = (number or "").strip()
    if num:
        return f"WO-{daftra_id}-{num}"[:40]
    return f"WO-{daftra_id}"[:40]


def _work_order_department(workflow_type_id: Optional[str]) -> str:
    if not workflow_type_id:
        return "design"
    return _WORK_ORDER_TYPE_DEPARTMENT.get(workflow_type_id, "design")


def _work_order_stage(workflow_type_id: Optional[str]) -> str:
    if not workflow_type_id:
        return "design"
    return _WORK_ORDER_TYPE_STAGE.get(workflow_type_id, "design")


def _work_order_order_status(raw_status: Any) -> str:
    try:
        key = int(raw_status)
    except (TypeError, ValueError):
        return "in_production"
    return _WORK_ORDER_STATUS_MAP.get(key, "in_production")


async def _ensure_stub_customer_from_work_order(
    db: AsyncSession,
    daftra_id: str,
    row: Dict[str, Any],
    cache: Dict[str, Customer],
) -> Customer:
    if daftra_id in cache:
        return cache[daftra_id]
    client = row.get("work_order_client") if isinstance(row.get("work_order_client"), dict) else {}
    name = (
        (client.get("business_name") or "").strip()
        or " ".join(
            str(p).strip()
            for p in (client.get("first_name"), client.get("last_name"))
            if p
        ).strip()
        or (row.get("title") or "").strip()
        or f"Client {daftra_id}"
    )
    code = f"DFT-{daftra_id}"[:40]
    with db.no_autoflush:
        by_daftra = (
            await db.execute(select(Customer).where(Customer.daftra_id == daftra_id))
        ).scalar_one_or_none()
        if by_daftra is not None:
            cache[daftra_id] = by_daftra
            return by_daftra
        by_code = (
            await db.execute(select(Customer).where(Customer.code == code))
        ).scalar_one_or_none()
    if by_code is not None:
        if by_code.daftra_id in (None, daftra_id):
            by_code.daftra_id = daftra_id
            if name and (not by_code.full_name or by_code.full_name.startswith("Client ")):
                by_code.full_name = name[:255]
            cache[daftra_id] = by_code
            return by_code
        code = f"D-{daftra_id}"[:40]

    customer = Customer(
        code=code,
        full_name=name[:255],
        email=(client.get("email") or None) or None,
        phone=(client.get("phone1") or client.get("phone2") or None) or None,
        address=(client.get("address1") or None) or None,
        city=(client.get("city") or None) or None,
        country=(client.get("country_code") or None) or None,
        daftra_id=daftra_id,
        notes="Auto-created from Daftra work-order sync",
    )
    db.add(customer)
    await db.flush()
    cache[daftra_id] = customer
    return customer


async def _users_by_daftra_ids(db: AsyncSession, ids: Set[str]) -> Dict[str, User]:
    if not ids:
        return {}
    res = await db.execute(select(User).where(User.daftra_id.in_(list(ids))))
    return {u.daftra_id: u for u in res.scalars().all() if u.daftra_id}


async def _dept_id_by_slug(db: AsyncSession, slug: str, cache: Dict[str, Optional[int]]) -> Optional[int]:
    if slug in cache:
        return cache[slug]
    res = await db.execute(select(Department.id).where(Department.slug == slug))
    dept_id = res.scalar_one_or_none()
    cache[slug] = dept_id
    return dept_id


async def sync_work_orders(db: AsyncSession, client: DaftraClient, report: SyncReport) -> ModuleSyncResult:
    """Pull Daftra work orders into local Orders for the project board.

    Policy:
    - Upsert by Order.daftra_id (idempotent).
    - On create: seed board pipeline (status + item stage + assignee) from workflow type.
    - On update: refresh metadata (title, notes, deadline, totals, customer, owner) but
      do NOT overwrite local board status/item workflow — preserves staff moves & RBAC.
    - Runtime after sync uses local Orders CRUD + board endpoints only.
    """
    result = ModuleSyncResult(module="work_orders")
    report.current_module = "work_orders"
    save_sync_meta(report)

    dept_cache: Dict[str, Optional[int]] = {}

    async for batch, pag in client.list_work_orders(per_page=50):
        try:
            last_page = int(pag.get("last_page") or 0)
            if last_page:
                result.total_pages = last_page
            elif pag.get("total") and pag.get("per_page"):
                total = int(pag["total"])
                per = max(int(pag["per_page"]), 1)
                result.total_pages = max(1, (total + per - 1) // per)
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        client_ids: Set[str] = set()
        wo_ids: Set[str] = set()
        staff_ids: Set[str] = set()
        for row in batch:
            if not isinstance(row, dict):
                continue
            wid = _str_id(row.get("id"))
            cid = _str_id(row.get("client_id"))
            sid = _str_id(row.get("staff_id"))
            if wid:
                wo_ids.add(wid)
            if cid:
                client_ids.add(cid)
            if sid:
                staff_ids.add(sid)
            for asid in _work_order_assigned_staff_ids(row):
                staff_ids.add(asid)

        customer_cache = await _customers_by_daftra_ids(db, client_ids)
        user_cache = await _users_by_daftra_ids(db, staff_ids)
        if wo_ids:
            res = await db.execute(
                select(Order)
                .where(Order.daftra_id.in_(list(wo_ids)))
                .options(selectinload(Order.items))
            )
            order_cache = {o.daftra_id: o for o in res.scalars().unique().all() if o.daftra_id}
        else:
            order_cache = {}

        for row in batch:
            if not isinstance(row, dict):
                result.skipped += 1
                continue
            daftra_id = _str_id(row.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                async with db.begin_nested():
                    client_daftra_id = _str_id(row.get("client_id"))
                    if client_daftra_id:
                        customer = customer_cache.get(client_daftra_id)
                        if not customer:
                            customer = await _ensure_stub_customer_from_work_order(
                                db, client_daftra_id, row, customer_cache,
                            )
                    else:
                        # Orphan WO (no client) — attach to a shared local stub so the board stays complete.
                        orphan_key = "__wo_orphan__"
                        customer = customer_cache.get(orphan_key)
                        if not customer:
                            with db.no_autoflush:
                                customer = (
                                    await db.execute(
                                        select(Customer).where(Customer.code == "DFT-WO-ORPHAN")
                                    )
                                ).scalar_one_or_none()
                            if customer is None:
                                customer = Customer(
                                    code="DFT-WO-ORPHAN",
                                    full_name="Daftra work order (no client)",
                                    notes="Shared stub for Daftra work orders missing client_id",
                                )
                                db.add(customer)
                                await db.flush()
                            customer_cache[orphan_key] = customer

                    title = (row.get("title") or "").strip() or None
                    if title:
                        title = title[:255]
                    description = (row.get("description") or "").strip() or None
                    number = (row.get("number") or None)
                    if number is not None:
                        number = str(number).strip()[:40] or None
                    wt_id = _str_id(row.get("workflow_type_id"))
                    dept_slug = _work_order_department(wt_id)
                    stage = _work_order_stage(wt_id)
                    budget = _safe_float(row.get("budget"))
                    currency = str(row.get("budget_currency") or "IQD")[:8]
                    deadline = _parse_date_opt(row.get("delivery_date"))
                    owner_daftra = _str_id(row.get("staff_id"))
                    owner = user_cache.get(owner_daftra) if owner_daftra else None
                    code = _work_order_code(daftra_id, number)

                    wt_name = None
                    wt = row.get("workflow_type")
                    if isinstance(wt, dict):
                        wt_name = (wt.get("name") or wt.get("singular_title") or None)
                    notes_parts = []
                    if description:
                        notes_parts.append(description)
                    if wt_name:
                        notes_parts.append(f"[Daftra type] {wt_name}")
                    if number:
                        notes_parts.append(f"[WO#] {number}")
                    notes = "\n".join(notes_parts) or None

                    existing = order_cache.get(daftra_id)
                    if existing:
                        # Reclaim code collisions only when the same Daftra row owns it.
                        existing.title = title
                        existing.notes = notes
                        existing.deadline = deadline
                        existing.customer_id = customer.id
                        existing.owner_id = owner.id if owner else existing.owner_id
                        existing.department = dept_slug
                        existing.currency = currency
                        existing.subtotal = budget
                        existing.grand_total = budget
                        existing.daftra_number = number
                        existing.daftra_workflow_type_id = wt_id
                        # Keep local pipeline / board column intact.
                        if existing.items:
                            item = existing.items[0]
                            item.name = (title or item.name or f"Work order {daftra_id}")[:255]
                            item.description = description
                            item.unit_price = budget
                            item.line_total = budget
                        result.updated += 1
                    else:
                        # Avoid unique code clash with a non-mapped local order.
                        with db.no_autoflush:
                            clash = (
                                await db.execute(select(Order).where(Order.code == code))
                            ).scalar_one_or_none()
                        if clash is not None and clash.daftra_id not in (None, daftra_id):
                            code = f"DFT-WO-{daftra_id}"[:40]

                        order_status = _work_order_order_status(row.get("status"))
                        dept_id = await _dept_id_by_slug(db, dept_slug, dept_cache)
                        item_status = "completed" if order_status == "delivered" else (
                            "cancelled" if order_status == "cancelled" else stage
                        )
                        if order_status == "cancelled":
                            board_order_status = "cancelled"
                        elif order_status == "delivered":
                            board_order_status = "delivered"
                        else:
                            board_order_status = "in_production"

                        order = Order(
                            code=code,
                            customer_id=customer.id,
                            owner_id=owner.id if owner else None,
                            department=dept_slug,
                            status=board_order_status,
                            priority="normal",
                            placed_via="daftra",
                            title=title,
                            notes=notes,
                            deadline=deadline,
                            subtotal=budget,
                            tax_total=0.0,
                            discount_total=0.0,
                            grand_total=budget,
                            currency=currency,
                            daftra_id=daftra_id,
                            daftra_number=number,
                            daftra_workflow_type_id=wt_id,
                        )
                        item = OrderItem(
                            name=(title or f"Work order {daftra_id}")[:255],
                            description=description,
                            quantity=1.0,
                            unit="pcs",
                            unit_price=budget,
                            discount_pct=0.0,
                            tax_rate=0.0,
                            line_total=budget,
                            workflow_status=item_status,
                            current_department_id=dept_id,
                            spec={
                                "source": "daftra_work_order",
                                "daftra_id": daftra_id,
                                "workflow_type_id": wt_id,
                            },
                        )
                        order.items.append(item)
                        order.events.append(
                            OrderStatusEvent(
                                to_status=board_order_status,
                                occurred_at=datetime.now(timezone.utc),
                                notes="Imported from Daftra work order",
                            )
                        )

                        # Seed assignee on the mapped pipeline stage (board policies apply after).
                        assignee_ids = _work_order_assigned_staff_ids(row)
                        if not assignee_ids and owner_daftra:
                            assignee_ids = [owner_daftra]
                        for asid in assignee_ids:
                            user = user_cache.get(asid)
                            if not user or item_status in ("completed", "cancelled", "pending"):
                                continue
                            order.workflow_assignments.append(
                                OrderWorkflowAssignment(
                                    workflow_status=item_status,
                                    assignee_id=user.id,
                                    is_skipped=False,
                                )
                            )

                        db.add(order)
                        await db.flush()
                        order_cache[daftra_id] = order
                        result.created += 1
            except Exception as exc:
                _push_error(result, f"work_order {daftra_id}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


def _apply_invoice_credit_amount(inv: Invoice, amount: float) -> None:
    """Mirror sales_ops credit application — raises paid_total / lowers balance."""
    if amount <= 0:
        return
    inv.paid_total = min(inv.grand_total, max(0.0, (inv.paid_total or 0.0) + amount))
    inv.balance = max(0.0, inv.grand_total - inv.paid_total)
    if inv.balance <= 0.01:
        inv.status = "paid"
        inv.balance = 0.0
    elif inv.paid_total > 0:
        inv.status = "partial"
    else:
        inv.status = "unpaid"


def _refund_line_items(detail: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw = detail.get("InvoiceItem")
    if isinstance(raw, list):
        rows = raw
    elif isinstance(raw, dict):
        rows = [raw]
    else:
        rows = as_list(detail, "InvoiceItem")
    out: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        item = unwrap(row, "InvoiceItem") if "InvoiceItem" in row else row
        name = (item.get("item") or item.get("name") or "Item").strip() or "Item"
        desc = (item.get("description") or None)
        if desc is not None:
            desc = str(desc).strip() or None
        qty = _safe_float(item.get("quantity"), 1.0) or 1.0
        unit = _safe_float(item.get("unit_price"))
        line = _safe_float(item.get("subtotal"), default=qty * unit)
        tax1 = _safe_float(item.get("summary_tax1") or item.get("tax1"))
        tax_rate = 0.0
        if unit * qty > 0 and tax1 > 0:
            tax_rate = round((tax1 / (unit * qty)) * 100.0, 4)
        out.append({
            "name": name[:255],
            "description": desc,
            "quantity": qty,
            "unit_price": unit,
            "tax_rate": tax_rate,
            "line_total": line,
        })
    return out


async def sync_refund_receipts(
    db: AsyncSession, client: DaftraClient, report: SyncReport,
) -> ModuleSyncResult:
    """Pull Daftra Refund Receipts → local Credit Notes (with line items + invoice link).

    Link: refund.subscription_id → original Invoice.daftra_id (Daftra 'Invoice No' on the PDF).
    """
    result = ModuleSyncResult(module="refund_receipts")
    report.current_module = "refund_receipts"
    save_sync_meta(report)

    async for batch, pag in client.list_refund_receipts(limit=50):
        try:
            result.total_pages = int(pag.get("page_count") or result.total_pages or 0) or result.total_pages
        except (TypeError, ValueError):
            pass
        result.pages_done += 1

        client_ids: Set[str] = set()
        inv_ids: Set[str] = set()
        rr_ids: Set[str] = set()
        staff_ids: Set[str] = set()
        parsed: List[Dict[str, Any]] = []
        for row in batch:
            rr = unwrap(row, "RefundReceipt")
            parsed.append(rr)
            rid = _str_id(rr.get("id"))
            cid = _str_id(rr.get("client_id"))
            # Original sale invoice id is stored as subscription_id on refund receipts.
            src = _str_id(rr.get("subscription_id"))
            sid = _str_id(rr.get("staff_id") or rr.get("sales_person_id"))
            if rid:
                rr_ids.add(rid)
            if cid:
                client_ids.add(cid)
            if src:
                inv_ids.add(src)
            if sid:
                staff_ids.add(sid)

        customer_cache = await _customers_by_daftra_ids(db, client_ids)
        staff_cache = await _users_by_daftra_ids(db, staff_ids)
        if inv_ids:
            res = await db.execute(select(Invoice).where(Invoice.daftra_id.in_(list(inv_ids))))
            invoice_cache = {i.daftra_id: i for i in res.scalars().all() if i.daftra_id}
        else:
            invoice_cache = {}
        if rr_ids:
            res = await db.execute(
                select(CreditNote)
                .where(CreditNote.daftra_id.in_(list(rr_ids)))
                .options(selectinload(CreditNote.items))
            )
            cn_cache = {c.daftra_id: c for c in res.scalars().unique().all() if c.daftra_id}
        else:
            cn_cache = {}

        for rr in parsed:
            daftra_id = _str_id(rr.get("id"))
            if not daftra_id:
                result.skipped += 1
                continue
            try:
                async with db.begin_nested():
                    client_daftra_id = _str_id(rr.get("client_id"))
                    if not client_daftra_id:
                        result.skipped += 1
                        continue
                    customer = customer_cache.get(client_daftra_id)
                    if not customer:
                        customer = await _ensure_stub_customer(db, client_daftra_id, rr, customer_cache)

                    src_inv_id = _str_id(rr.get("subscription_id"))
                    invoice = invoice_cache.get(src_inv_id) if src_inv_id else None
                    staff_daftra = _str_id(rr.get("staff_id"))
                    sales_daftra = _str_id(rr.get("sales_person_id"))
                    staff = staff_cache.get(staff_daftra) if staff_daftra else None
                    sales = staff_cache.get(sales_daftra) if sales_daftra else None
                    actor = sales or staff

                    number = str(rr.get("no") or "").strip()
                    code = (f"RR-{number}" if number else f"DFT-RR-{daftra_id}")[:40]
                    currency = str(rr.get("currency_code") or "IQD")[:8]
                    issue_date = _parse_date(rr.get("date") or rr.get("issue_date") or rr.get("created"))
                    subtotal = _safe_float(rr.get("summary_subtotal") or rr.get("subtotal"))
                    tax = _safe_float(rr.get("summary_tax1") or rr.get("summary_tax") or rr.get("tax"))
                    grand = _safe_float(
                        rr.get("summary_total") or rr.get("total") or (subtotal + tax)
                    )
                    inv_no = None
                    if invoice and invoice.code:
                        inv_no = invoice.code
                    notes_parts = []
                    if number:
                        notes_parts.append(f"Daftra refund #{number}")
                    if inv_no:
                        notes_parts.append(f"Invoice {inv_no}")
                    elif src_inv_id:
                        notes_parts.append(f"Daftra invoice id {src_inv_id}")
                    html_notes = (rr.get("notes") or rr.get("html_notes") or "").strip()
                    if html_notes:
                        notes_parts.append(html_notes)
                    notes = "\n".join(notes_parts) or None

                    # Fetch line items from detail endpoint
                    lines: List[Dict[str, Any]] = []
                    try:
                        detail = await client.get_refund_receipt(daftra_id)
                        lines = _refund_line_items(detail)
                    except Exception as exc:
                        logger.warning("Refund %s detail fetch failed: %s", daftra_id, exc)
                    if not lines:
                        lines = [{
                            "name": (rr.get("client_business_name") or f"Refund {number or daftra_id}")[:255],
                            "description": None,
                            "quantity": 1.0,
                            "unit_price": grand,
                            "tax_rate": 0.0,
                            "line_total": grand,
                        }]
                    if subtotal <= 0:
                        subtotal = sum(float(x["quantity"]) * float(x["unit_price"]) for x in lines)
                    if grand <= 0:
                        grand = sum(float(x["line_total"]) for x in lines) or subtotal

                    existing = cn_cache.get(daftra_id)
                    if existing:
                        with db.no_autoflush:
                            clash = (
                                await db.execute(select(CreditNote).where(CreditNote.code == code))
                            ).scalar_one_or_none()
                        if clash is not None and clash.id != existing.id:
                            code = f"DFT-RR-{daftra_id}"[:40]
                        existing.code = code
                        existing.customer_id = customer.id
                        existing.invoice_id = invoice.id if invoice else existing.invoice_id
                        existing.issue_date = issue_date
                        existing.currency = currency
                        existing.subtotal = subtotal
                        existing.tax_total = tax
                        existing.grand_total = grand
                        existing.notes = notes
                        existing.reason = f"Refund receipt {number or daftra_id}"
                        existing.status = "issued"
                        if actor:
                            existing.actor_id = actor.id
                        existing.items.clear()
                        for line in lines:
                            existing.items.append(CreditNoteItem(**line))
                        result.updated += 1
                    else:
                        with db.no_autoflush:
                            clash = (
                                await db.execute(select(CreditNote).where(CreditNote.code == code))
                            ).scalar_one_or_none()
                        if clash is not None and clash.daftra_id not in (None, daftra_id):
                            code = f"DFT-RR-{daftra_id}"[:40]

                        cn = CreditNote(
                            code=code,
                            customer_id=customer.id,
                            invoice_id=invoice.id if invoice else None,
                            status="issued",
                            issue_date=issue_date,
                            currency=currency,
                            subtotal=subtotal,
                            tax_total=tax,
                            grand_total=grand,
                            reason=f"Refund receipt {number or daftra_id}",
                            notes=notes,
                            actor_id=actor.id if actor else None,
                            daftra_id=daftra_id,
                        )
                        for line in lines:
                            cn.items.append(CreditNoteItem(**line))
                        db.add(cn)
                        await db.flush()
                        if invoice:
                            _apply_invoice_credit_amount(invoice, grand)
                        cn_cache[daftra_id] = cn
                        result.created += 1
            except Exception as exc:
                _push_error(result, f"refund_receipt {daftra_id}: {exc}")

        await db.commit()
        _upsert_module(report, result)
        save_sync_meta(report)

    return result


DEFAULT_MODULES: Sequence[str] = (
    "clients",
    "portal",
    "products",
    "subscriptions",
    "invoices",
    "payments",
    "expenses",
    "refund_receipts",
    "designations",
    "staff",
    "payslips",
    "work_orders",
)

_SYNC_FUNCS = {
    "clients": sync_clients,
    "portal": sync_portal,
    "products": sync_products,
    "subscriptions": sync_subscriptions,
    "invoices": sync_invoices,
    "payments": sync_payments,
    "expenses": sync_expenses,
    "refund_receipts": sync_refund_receipts,
    "hr_departments": sync_hr_departments,
    "designations": sync_designations,
    "staff": sync_staff,
    "payslips": sync_payslips,
    "work_orders": sync_work_orders,
}


async def sync_all(
    db: AsyncSession,
    *,
    modules: Optional[Iterable[str]] = None,
    client: Optional[DaftraClient] = None,
    report: Optional[SyncReport] = None,
) -> SyncReport:
    owns_client = client is None
    client = client or DaftraClient()
    selected = list(modules) if modules else list(DEFAULT_MODULES)
    ordered = [m for m in DEFAULT_MODULES if m in selected]
    for m in selected:
        if m not in ordered and m in _SYNC_FUNCS:
            ordered.append(m)

    report = report or SyncReport(ok=True, status="running")
    report.status = "running"
    report.started_at = report.started_at or datetime.now(timezone.utc).isoformat()
    report.modules = [ModuleSyncResult(module=m) for m in ordered]
    save_sync_meta(report)

    async def _run(c: DaftraClient) -> SyncReport:
        for name in ordered:
            fn = _SYNC_FUNCS.get(name)
            if not fn:
                bad = ModuleSyncResult(module=name, errors=[f"Unknown module: {name}"])
                _upsert_module(report, bad)
                report.ok = False
                continue
            try:
                result = await fn(db, c, report)
                _upsert_module(report, result)
                # Row-level errors are warnings unless nothing was imported.
                if result.errors and (result.created + result.updated) == 0:
                    report.ok = False
            except Exception as exc:
                logger.exception("Daftra sync module %s failed", name)
                bad = ModuleSyncResult(module=name, errors=[str(exc)])
                _upsert_module(report, bad)
                report.ok = False
                await db.rollback()

        report.status = "done" if report.ok else "error"
        report.finished_at = datetime.now(timezone.utc).isoformat()
        report.current_module = None
        warn_count = sum(len(m.errors) for m in report.modules)
        if report.ok and warn_count:
            report.message = f"Sync completed with {warn_count} row warning(s)"
        elif report.ok:
            report.message = "Sync completed"
        else:
            report.message = "Sync completed with errors"
        save_sync_meta(report)
        return report

    if owns_client:
        async with client:
            return await _run(client)
    return await _run(client)


async def mapped_counts(db: AsyncSession) -> Dict[str, int]:
    async def _count(model) -> int:
        res = await db.execute(
            select(func.count()).select_from(model).where(model.daftra_id.is_not(None))
        )
        return int(res.scalar_one() or 0)

    return {
        "clients": await _count(Customer),
        "products": await _count(Product),
        "subscriptions": await _count(RecurringInvoice),
        "invoices": await _count(Invoice),
        "payments": await _count(Payment),
        "expenses": await _count(Expense),
        "refund_receipts": await _count(CreditNote),
        "hr_departments": await _count(Department),
        "designations": await _count(Designation),
        "staff": await _count(User),
        "payslips": await _count(Payslip),
        "work_orders": await _count(Order),
    }


async def _background_sync(modules: Optional[List[str]]) -> None:
    report = SyncReport(
        ok=True,
        status="running",
        started_at=datetime.now(timezone.utc).isoformat(),
        message="Sync started",
    )
    save_sync_meta(report)
    try:
        async with SessionLocal() as db:
            async with DaftraClient() as client:
                await sync_all(db, modules=modules, client=client, report=report)
    except Exception as exc:
        logger.exception("Background Daftra sync crashed")
        meta = load_sync_meta()
        meta["ok"] = False
        meta["status"] = "error"
        meta["message"] = str(exc)
        meta["finished_at"] = datetime.now(timezone.utc).isoformat()
        save_sync_meta(meta)


async def start_background_sync(modules: Optional[List[str]] = None) -> Dict[str, Any]:
    global _SYNC_TASK
    async with _SYNC_LOCK:
        if is_sync_running():
            meta = load_sync_meta()
            meta["message"] = "Sync already running"
            return meta
        report = SyncReport(
            ok=True,
            status="running",
            started_at=datetime.now(timezone.utc).isoformat(),
            message="Sync queued",
            modules=[ModuleSyncResult(module=m) for m in (modules or list(DEFAULT_MODULES))],
        )
        save_sync_meta(report)
        _SYNC_TASK = asyncio.create_task(_background_sync(modules))
        return report.to_dict()
