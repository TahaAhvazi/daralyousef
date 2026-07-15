"""Web Push schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PushKeysIn(BaseModel):
    p256dh: str = Field(min_length=8, max_length=255)
    auth: str = Field(min_length=8, max_length=255)


class PushSubscribeIn(BaseModel):
    endpoint: str = Field(min_length=8, max_length=2048)
    keys: PushKeysIn
    user_agent: Optional[str] = Field(default=None, max_length=512)


class PushUnsubscribeIn(BaseModel):
    endpoint: str = Field(min_length=8, max_length=2048)


class PushStatusOut(BaseModel):
    enabled: bool
    vapid_configured: bool
    subscription_count: int
