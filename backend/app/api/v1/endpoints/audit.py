"""Audit log queries (CEO / GM only)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_any_role
from app.db.base import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogOut
from app.schemas.common import PaginatedResponse


router = APIRouter()


@router.get("", response_model=PaginatedResponse[AuditLogOut])
async def list_audit_logs(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    user_id: Optional[int] = None, module: Optional[str] = None,
    action: Optional[str] = None,
    from_date: Optional[datetime] = None, to_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_role("ceo", "general_manager")),
):
    stmt = select(AuditLog)
    if user_id: stmt = stmt.where(AuditLog.user_id == user_id)
    if module: stmt = stmt.where(AuditLog.module == module)
    if action: stmt = stmt.where(AuditLog.action == action)
    if from_date: stmt = stmt.where(AuditLog.occurred_at >= from_date)
    if to_date: stmt = stmt.where(AuditLog.occurred_at <= to_date)

    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(AuditLog.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[AuditLogOut](
        items=[AuditLogOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )
