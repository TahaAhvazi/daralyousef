"""Brand-settings endpoints (system name + logo).

Public read access so any visitor sees the customised brand on the public
landing page and login screen. Mutations (text fields and logo upload) are
restricted to platform administrators (`is_superuser`).
"""
from __future__ import annotations

import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import current_superuser
from app.core.exceptions import ValidationError
from app.db.base import get_db
from app.models.branding import BrandSettings
from app.models.user import User
from app.schemas.branding import BrandSettingsOut, BrandSettingsUpdate
from app.services.audit import record as audit


router = APIRouter()


_LOGO_ALLOWED = {"png", "jpg", "jpeg", "webp", "svg"}
_LOGO_DIR = settings.UPLOAD_DIR / "brand"


async def _get_or_create(db: AsyncSession) -> BrandSettings:
    res = await db.execute(select(BrandSettings).where(BrandSettings.id == 1))
    row = res.scalar_one_or_none()
    if row is None:
        row = BrandSettings(id=1)
        db.add(row)
        await db.flush()
    return row


@router.get("", response_model=BrandSettingsOut)
async def read_brand(db: AsyncSession = Depends(get_db)):
    """Public — used by every page (landing, auth, portal, app)."""
    row = await _get_or_create(db)
    await db.commit()
    return BrandSettingsOut.model_validate(row)


@router.patch("", response_model=BrandSettingsOut)
async def update_brand(
    data: BrandSettingsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(current_superuser),
):
    row = await _get_or_create(db)
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(row, key, value)
    await audit(
        db, action="update", module="branding", user=actor,
        entity_type="brand_settings", entity_id=row.id, new=payload, request=request,
    )
    await db.commit()
    return BrandSettingsOut.model_validate(row)


@router.post("/logo", response_model=BrandSettingsOut)
async def upload_logo(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(current_superuser),
):
    ext = (Path(file.filename or "").suffix.lstrip(".") or "").lower()
    if ext not in _LOGO_ALLOWED:
        raise ValidationError(
            f"Unsupported logo type .{ext or '?'} (allowed: {', '.join(sorted(_LOGO_ALLOWED))})"
        )

    content = await file.read()
    if not content:
        raise ValidationError("Empty file uploaded")
    if len(content) > 5 * 1024 * 1024:  # 5 MB cap for a logo
        raise ValidationError("Logo must be 5 MB or smaller")

    _LOGO_DIR.mkdir(parents=True, exist_ok=True)
    # Stable filename so /uploads/brand/logo.<ext> can be cached/predicted.
    # Wipe any older logo extensions.
    for old in _LOGO_DIR.glob("logo.*"):
        try:
            old.unlink()
        except OSError:
            pass

    dest = _LOGO_DIR / f"logo.{ext}"
    dest.write_bytes(content)

    # Cache-bust via mtime so browsers pick up the new image immediately.
    public_url = f"/uploads/brand/logo.{ext}?v={int(dest.stat().st_mtime)}"

    row = await _get_or_create(db)
    row.logo_url = public_url

    await audit(
        db, action="upload", module="branding", user=actor,
        entity_type="brand_settings", entity_id=row.id,
        new={"logo": dest.name, "size": len(content), "mime": file.content_type
             or mimetypes.guess_type(dest.name)[0] or "application/octet-stream"},
        request=request,
    )
    await db.commit()
    return BrandSettingsOut.model_validate(row)


@router.delete("/logo", response_model=BrandSettingsOut)
async def remove_logo(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(current_superuser),
):
    row = await _get_or_create(db)
    row.logo_url = None
    if _LOGO_DIR.exists():
        for old in _LOGO_DIR.glob("logo.*"):
            try:
                old.unlink()
            except OSError:
                pass
    await audit(
        db, action="delete", module="branding", user=actor,
        entity_type="brand_settings", entity_id=row.id, request=request,
    )
    await db.commit()
    return BrandSettingsOut.model_validate(row)
