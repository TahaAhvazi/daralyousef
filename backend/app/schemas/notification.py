"""Notification schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class NotificationOut(ORMModel):
    id: int
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
