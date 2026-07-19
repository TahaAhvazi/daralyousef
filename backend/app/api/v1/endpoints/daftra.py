"""Daftra integration endpoints — status, connection test, background pull sync."""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import current_superuser
from app.core.exceptions import ValidationError
from app.db.base import get_db
from app.models.user import User
from app.schemas.daftra import (
    DaftraStatusOut,
    DaftraSyncReportOut,
    DaftraSyncRequest,
    DaftraTestOut,
)
from app.services.daftra_client import DaftraClient, unwrap
from app.services.daftra_sync import (
    is_sync_running,
    load_sync_meta,
    mapped_counts,
    start_background_sync,
)


router = APIRouter()


@router.get("/status", response_model=DaftraStatusOut)
async def daftra_status(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(current_superuser),
):
    client = DaftraClient()
    meta = load_sync_meta() or None
    return DaftraStatusOut(
        enabled=bool(settings.DAFTRA_ENABLED),
        configured=client.configured,
        base_url=settings.DAFTRA_BASE_URL,
        last_sync=meta,
        mapped_counts=await mapped_counts(db),
        sync_running=is_sync_running() or (isinstance(meta, dict) and meta.get("status") == "running"),
    )


@router.post("/test", response_model=DaftraTestOut)
async def daftra_test(
    _: User = Depends(current_superuser),
):
    if not settings.DAFTRA_ENABLED and not settings.DAFTRA_API_KEY:
        raise ValidationError("Daftra is disabled and no API key is configured")
    client = DaftraClient()
    if not client.configured:
        raise ValidationError("Set DAFTRA_API_KEY and DAFTRA_BASE_URL in the server environment")
    try:
        async with client:
            payload = await client.get_site_info()
        site: Optional[Dict[str, Any]] = None
        data = payload.get("data") if isinstance(payload, dict) else None
        if isinstance(data, dict):
            site = unwrap(data, "Site") or data
        elif isinstance(payload, dict):
            site = unwrap(payload, "Site") or None
        business = (site or {}).get("business_name") or (site or {}).get("subdomain") or "ok"
        return DaftraTestOut(ok=True, message=f"Connected: {business}", site=site)
    except Exception as exc:
        return DaftraTestOut(ok=False, message=str(exc), site=None)


@router.post("/sync", response_model=DaftraSyncReportOut)
async def daftra_sync(
    body: DaftraSyncRequest | None = None,
    _: User = Depends(current_superuser),
):
    """Start a background pull-sync. Poll GET /status for progress (large accounts take minutes)."""
    if not settings.DAFTRA_ENABLED:
        raise ValidationError("Daftra sync is disabled (set DAFTRA_ENABLED=true)")
    client = DaftraClient()
    if not client.configured:
        raise ValidationError("Set DAFTRA_API_KEY and DAFTRA_BASE_URL in the server environment")
    modules = body.modules if body else None
    started = await start_background_sync(modules)
    return DaftraSyncReportOut(
        ok=True,
        status=started.get("status", "running"),
        current_module=started.get("current_module"),
        started_at=started.get("started_at"),
        finished_at=started.get("finished_at"),
        message=started.get("message") or "Sync started in background",
        modules=started.get("modules") or [],
    )
