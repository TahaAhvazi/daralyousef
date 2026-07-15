"""Chat / conversation schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ChatMessageOut(ORMModel):
    id: int
    body: str
    author_user_id: Optional[int] = None
    author_name: Optional[str] = None
    author_avatar_url: Optional[str] = None
    order_id: Optional[int] = None
    order_code: Optional[str] = None
    order_title: Optional[str] = None
    created_at: datetime


class ConversationMemberOut(ORMModel):
    user_id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None


class ConversationOut(ORMModel):
    id: int
    kind: str
    title: Optional[str] = None
    order_id: Optional[int] = None
    order_code: Optional[str] = None
    order_title: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberOut] = []
    messages: List[ChatMessageOut] = []
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0


class ConversationCreate(BaseModel):
    kind: str = Field(default="dm", pattern="^(dm|group)$")
    title: Optional[str] = None
    order_id: Optional[int] = None
    member_ids: List[int] = []


class ChatMessageCreate(BaseModel):
    body: str
    order_id: Optional[int] = None
