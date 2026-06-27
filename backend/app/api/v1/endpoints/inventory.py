"""Inventory: Warehouses, Materials, Stock movements."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_permissions
from app.core.exceptions import NotFoundError, ValidationError
from app.db.base import get_db
from app.models.inventory import Material, StockMovement, Warehouse
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.schemas.inventory import (
    MaterialCreate, MaterialOut, MaterialUpdate,
    StockMovementCreate, StockMovementOut, WarehouseOut,
)
from app.services.audit import record as audit


router = APIRouter()


# ── Warehouses ───────────────────────────────────────────────────────────────
@router.get("/warehouses", response_model=list[WarehouseOut])
async def list_warehouses(db: AsyncSession = Depends(get_db),
                          _: User = Depends(require_permissions("inventory:read"))):
    rows = (await db.execute(select(Warehouse).order_by(Warehouse.id))).scalars().all()
    return [WarehouseOut.model_validate(r) for r in rows]


# ── Materials ────────────────────────────────────────────────────────────────
@router.get("/materials", response_model=PaginatedResponse[MaterialOut])
async def list_materials(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, low_stock: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("inventory:read")),
):
    stmt = select(Material).where(Material.deleted_at.is_(None))
    if q: stmt = stmt.where(Material.name.ilike(f"%{q}%"))
    if low_stock:
        stmt = stmt.where(Material.on_hand <= Material.reorder_level)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Material.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[MaterialOut](
        items=[MaterialOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/materials", response_model=MaterialOut, status_code=201)
async def create_material(data: MaterialCreate, request: Request,
                          db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("inventory:create"))):
    payload = data.model_dump()
    payload["sku"] = payload.get("sku") or f"MAT-{int(datetime.utcnow().timestamp())}"
    m = Material(**payload); db.add(m); await db.flush()
    await audit(db, action="create", module="inventory", user=user, entity_type="material",
                entity_id=m.id, new=payload, request=request)
    await db.commit()
    return MaterialOut.model_validate(m)


@router.patch("/materials/{mid}", response_model=MaterialOut)
async def update_material(mid: int, data: MaterialUpdate, request: Request,
                          db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("inventory:update"))):
    m = await db.get(Material, mid)
    if not m or m.deleted_at is not None: raise NotFoundError("Material not found")
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items(): setattr(m, k, v)
    await audit(db, action="update", module="inventory", user=user, entity_type="material",
                entity_id=m.id, new=payload, request=request)
    await db.commit()
    return MaterialOut.model_validate(m)


@router.delete("/materials/{mid}", response_model=OkResponse)
async def delete_material(mid: int, db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("inventory:delete"))):
    m = await db.get(Material, mid)
    if not m or m.deleted_at is not None: raise NotFoundError("Material not found")
    m.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return OkResponse()


# ── Stock movements ──────────────────────────────────────────────────────────
VALID_TYPES = {"IN", "OUT", "TRANSFER", "DAMAGED", "ADJUSTMENT"}


@router.post("/movements", response_model=StockMovementOut, status_code=201)
async def create_movement(data: StockMovementCreate, request: Request,
                          db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("inventory:create"))):
    if data.type not in VALID_TYPES:
        raise ValidationError(f"Invalid movement type: {data.type}")
    m = await db.get(Material, data.material_id)
    if not m or m.deleted_at is not None: raise NotFoundError("Material not found")
    mv = StockMovement(actor_id=user.id, **data.model_dump())
    # update on-hand
    delta = data.quantity
    if data.type in {"OUT", "DAMAGED"}:
        delta = -abs(data.quantity)
    elif data.type == "ADJUSTMENT":
        delta = data.quantity
    elif data.type == "IN":
        delta = abs(data.quantity)
    elif data.type == "TRANSFER":
        delta = 0  # transfer keeps total stock unchanged
    m.on_hand = round(m.on_hand + delta, 3)
    db.add(mv); await db.flush()
    await audit(db, action="stock_move", module="inventory", user=user,
                entity_type="material", entity_id=m.id,
                new={"type": data.type, "qty": data.quantity, "on_hand": m.on_hand},
                request=request)
    await db.commit()
    return StockMovementOut.model_validate(mv)


@router.get("/movements", response_model=PaginatedResponse[StockMovementOut])
async def list_movements(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    material_id: Optional[int] = None, type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("inventory:read")),
):
    stmt = select(StockMovement)
    if material_id: stmt = stmt.where(StockMovement.material_id == material_id)
    if type: stmt = stmt.where(StockMovement.type == type)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(StockMovement.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[StockMovementOut](
        items=[StockMovementOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )
