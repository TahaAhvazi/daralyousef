"""Direct junction-table writes for product ↔ department links (async-safe)."""
from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department, product_departments


async def sync_product_departments(
    db: AsyncSession,
    product_id: int,
    department_ids: Iterable[int],
) -> None:
    """Replace product department links without ORM relationship assignment."""
    await db.execute(
        delete(product_departments).where(product_departments.c.product_id == product_id)
    )
    for sort_order, dept_id in enumerate(department_ids):
        await db.execute(
            insert(product_departments).values(
                product_id=product_id,
                department_id=dept_id,
                sort_order=sort_order,
            )
        )


async def first_product_department_id(db: AsyncSession, product_id: int) -> Optional[int]:
    """Return the first required department for a product (by sort_order)."""
    res = await db.execute(
        select(Department.id)
        .join(product_departments, product_departments.c.department_id == Department.id)
        .where(product_departments.c.product_id == product_id)
        .order_by(product_departments.c.sort_order, Department.sort_order)
        .limit(1)
    )
    return res.scalar_one_or_none()
