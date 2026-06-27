"""Attachment schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class AttachmentOut(ORMModel):
    id: int
    entity_type: str
    entity_id: int
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    url: str
    uploader_id: Optional[int] = None
    caption: Optional[str] = None
    kind: Optional[str] = None
    created_at: datetime
