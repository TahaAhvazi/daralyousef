"""Support / ticket schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class TicketMessageBase(BaseModel):
    body: str


class TicketMessageOut(ORMModel, TicketMessageBase):
    id: int
    author_user_id: Optional[int] = None
    author_kind: str
    author_name: Optional[str] = None
    created_at: datetime


class TicketBase(BaseModel):
    subject: str
    body: Optional[str] = None
    priority: str = "normal"
    category: Optional[str] = None
    customer_id: Optional[int] = None
    assignee_id: Optional[int] = None


class TicketCreate(TicketBase): ...
class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    assignee_id: Optional[int] = None


class TicketOut(ORMModel, TicketBase):
    id: int
    code: str
    status: str
    opener_user_id: Optional[int] = None
    assignee_name: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    messages: List[TicketMessageOut] = []
