"""Inventory helpers — BOM explosion, stock checks, order deductions."""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ValidationError
from app.models.catalog import Product, ProductMaterial
from app.models.inventory import Material, StockMovement
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderItemCreate


async def _load_product_bom(db: AsyncSession, product_id: int) -> list[ProductMaterial]:
    res = await db.execute(
        select(ProductMaterial)
        .where(ProductMaterial.product_id == product_id)
        .options(selectinload(ProductMaterial.material))
    )
    return list(res.scalars().all())


def _accumulate_requirements(
    target: dict[int, float],
    bom: Iterable[ProductMaterial],
    quantity: float,
) -> None:
    for line in bom:
        if line.quantity_per_unit <= 0:
            continue
        needed = round(line.quantity_per_unit * quantity, 4)
        target[line.material_id] = round(target.get(line.material_id, 0.0) + needed, 4)


async def compute_requirements_from_items(
    db: AsyncSession,
    items: Iterable[OrderItem | OrderItemCreate],
) -> dict[int, float]:
    """Return {material_id: total_quantity_needed} for order line items."""
    requirements: dict[int, float] = {}
    product_cache: dict[int, list[ProductMaterial]] = {}

    for item in items:
        product_id = getattr(item, "product_id", None)
        if not product_id:
            continue
        qty = float(getattr(item, "quantity", 0) or 0)
        if qty <= 0:
            continue
        if product_id not in product_cache:
            product_cache[product_id] = await _load_product_bom(db, product_id)
        _accumulate_requirements(requirements, product_cache[product_id], qty)

    return requirements


async def validate_stock_for_items(
    db: AsyncSession,
    items: Iterable[OrderItem | OrderItemCreate],
) -> None:
    requirements = await compute_requirements_from_items(db, items)
    if not requirements:
        return

    shortages: list[dict] = []
    for material_id, needed in requirements.items():
        mat = await db.get(Material, material_id)
        if not mat or mat.deleted_at is not None:
            shortages.append({"material_id": material_id, "needed": needed, "available": 0})
            continue
        if mat.on_hand + 1e-9 < needed:
            shortages.append({
                "material_id": material_id,
                "material_name": mat.name,
                "material_sku": mat.sku,
                "needed": needed,
                "available": mat.on_hand,
                "unit": mat.unit,
            })

    if shortages:
        first = shortages[0]
        name = first.get("material_name", f"material #{first['material_id']}")
        raise ValidationError(
            f"Insufficient stock for {name}: need {first['needed']}, have {first.get('available', 0)}",
            details={"shortages": shortages},
        )


async def deduct_materials_for_order(
    db: AsyncSession,
    order: Order,
    user: Optional[User],
    *,
    items: Optional[Iterable[OrderItem]] = None,
) -> None:
    """Deduct BOM materials for order items via OUT stock movements."""
    line_items = list(items if items is not None else order.items)
    requirements = await compute_requirements_from_items(db, line_items)
    if not requirements:
        return

    actor_id = user.id if user else None
    for material_id, qty in requirements.items():
        mat = await db.get(Material, material_id)
        if not mat or mat.deleted_at is not None:
            raise ValidationError(f"Material #{material_id} not found for stock deduction")
        if mat.on_hand + 1e-9 < qty:
            raise ValidationError(
                f"Insufficient stock for {mat.name}: need {qty}, have {mat.on_hand}",
            )
        mv = StockMovement(
            material_id=material_id,
            warehouse_id=mat.warehouse_id,
            type="OUT",
            quantity=qty,
            unit_cost=mat.cost,
            actor_id=actor_id,
            reference_type="order",
            reference_id=order.id,
            notes=f"Order {order.code}",
        )
        mat.on_hand = round(mat.on_hand - qty, 3)
        db.add(mv)


async def product_stock_status(db: AsyncSession, product: Product) -> str:
    """in_stock | restock | out_of_stock based on BOM availability for 1 unit."""
    bom = await _load_product_bom(db, product.id)
    if not bom:
        return "in_stock"

    can_make = True
    needs_restock = False
    for line in bom:
        mat = line.material
        if not mat:
            mat = await db.get(Material, line.material_id)
        if not mat:
            return "out_of_stock"
        per_unit = line.quantity_per_unit or 1.0
        if mat.on_hand < per_unit:
            can_make = False
        if mat.on_hand <= mat.reorder_level and mat.reorder_level > 0:
            needs_restock = True

    if not can_make:
        return "out_of_stock"
    if needs_restock:
        return "restock"
    return "in_stock"
