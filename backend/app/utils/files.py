"""File-storage helpers."""
from __future__ import annotations

import mimetypes
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationError

# Block executable/script types only — all other extensions are allowed.
BLOCKED_EXTENSIONS = frozenset({
    "exe", "bat", "cmd", "com", "msi", "scr", "ps1", "vbs", "dll", "sh", "bash",
    "app", "deb", "rpm", "jar", "apk", "dmg", "iso", "reg", "inf",
})


def _ext(name: str) -> str:
    return Path(name).suffix.lstrip(".").lower()


def validate(file: UploadFile) -> str:
    name = file.filename or ""
    ext = _ext(name)
    if not ext:
        raise ValidationError("File must have an extension")
    if ext in BLOCKED_EXTENSIONS:
        raise ValidationError(f"File type .{ext} is not allowed for security reasons")
    return ext


async def save_upload(file: UploadFile) -> Tuple[Path, str, int, str]:
    """Persist an UploadFile to disk. Returns (path, public_url, size, mime)."""
    ext = validate(file)
    today = datetime.now(timezone.utc)
    folder = settings.UPLOAD_DIR / f"{today:%Y}" / f"{today:%m}"
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{secrets.token_urlsafe(16)}.{ext}"
    dest = folder / name

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise ValidationError(f"File exceeds {settings.MAX_UPLOAD_MB} MB limit")

    dest.write_bytes(content)

    mime = file.content_type or mimetypes.guess_type(name)[0] or "application/octet-stream"
    public_url = f"/uploads/{today:%Y}/{today:%m}/{name}"
    return dest, public_url, len(content), mime
