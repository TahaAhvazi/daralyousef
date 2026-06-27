"""Department schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class DepartmentBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class DepartmentOut(ORMModel, DepartmentBase):
    id: int
    slug: str
