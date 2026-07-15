"""Order project notes (shift handoff) schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class OrderNoteCreate(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class OrderNoteUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class OrderNoteOut(ORMModel):
    id: int
    order_id: int
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    body: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
