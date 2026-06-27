"""Audit-log helpers."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.user import User


def _client_info(request: Optional[Request]) -> Dict[str, Optional[str]]:
    if not request:
        return {"ip": None, "ua": None}
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return {"ip": ip, "ua": ua}


async def record(
    db: AsyncSession,
    *,
    action: str,
    module: str,
    user: Optional[User] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    old: Optional[Dict[str, Any]] = None,
    new: Optional[Dict[str, Any]] = None,
    notes: Optional[str] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    info = _client_info(request)
    row = AuditLog(
        occurred_at=datetime.now(timezone.utc),
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        department=user.department if user else None,
        action=action,
        module=module,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old,
        new_values=new,
        ip_address=info["ip"],
        user_agent=info["ua"],
        notes=notes,
    )
    db.add(row)
    await db.flush()
    return row
