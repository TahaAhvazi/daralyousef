"""Departments API."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db.base import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentOut


router = APIRouter()


@router.get("", response_model=List[DepartmentOut])
async def list_departments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(current_user),
):
    rows = (
        await db.execute(
            select(Department)
            .where(Department.is_active.is_(True))
            .order_by(Department.sort_order, Department.name)
        )
    ).scalars().all()
    return [DepartmentOut.model_validate(r) for r in rows]
