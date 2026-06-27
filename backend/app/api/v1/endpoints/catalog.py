"""Catalog: categories, products, instant-pricing calculator."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_permissions, current_user
from app.core.exceptions import NotFoundError
from app.db.base import get_db
from app.models.catalog import PricingRule, Product, ProductCategory, ProductMaterial
from app.models.inventory import Material
from app.models.user import User
from app.schemas.catalog import (
    CategoryCreate, CategoryOut, CategoryUpdate,
    ProductBomUpdate, ProductCreate, ProductMaterialOut, ProductOut, ProductUpdate,
    QuoteEstimate, QuoteRequest,
)
from app.schemas.common import OkResponse, PaginatedResponse
from app.services.audit import record as audit
from app.services.inventory_service import product_stock_status
from app.utils.pricing import calculate_price
from app.utils.product_departments import sync_product_departments


router = APIRouter()


def _slug(name: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")


async def _sync_departments(db: AsyncSession, product_id: int, dept_ids: list[int] | None) -> None:
    if dept_ids is None:
        return
    await sync_product_departments(db, product_id, dept_ids)


def _product_options():
    return (
        selectinload(Product.pricing_rules),
        selectinload(Product.required_departments),
        selectinload(Product.materials).selectinload(ProductMaterial.material),
    )


async def _product_out(db: AsyncSession, product: Product) -> ProductOut:
    out = ProductOut.model_validate(product)
    out.stock_status = await product_stock_status(db, product)
    return out


# ── Categories (public read) ────────────────────────────────────────────────
@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ProductCategory).order_by(ProductCategory.sort_order, ProductCategory.name))).scalars().all()
    return [CategoryOut.model_validate(r) for r in rows]


@router.post("/categories", response_model=CategoryOut, status_code=201)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db),
                          _: User = Depends(require_permissions("catalog:manage"))):
    payload = data.model_dump()
    payload["slug"] = payload.get("slug") or _slug(payload["name"])
    c = ProductCategory(**payload); db.add(c); await db.commit()
    return CategoryOut.model_validate(c)


# ── Products ─────────────────────────────────────────────────────────────────
@router.get("/products", response_model=PaginatedResponse[ProductOut])
async def list_products(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, category_id: Optional[int] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(Product.deleted_at.is_(None))
    if active_only:
        stmt = stmt.where(Product.is_active.is_(True))
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))
    if category_id: stmt = stmt.where(Product.category_id == category_id)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(*_product_options())
            .order_by(Product.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[ProductOut](
        items=[await _product_out(db, r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.get("/products/{pid}", response_model=ProductOut)
async def get_product(pid: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Product).where(Product.id == pid, Product.deleted_at.is_(None))
        .options(*_product_options())
    )
    p = res.scalar_one_or_none()
    if not p: raise NotFoundError("Product not found")
    return await _product_out(db, p)


@router.post("/products", response_model=ProductOut, status_code=201)
async def create_product(data: ProductCreate, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("catalog:manage"))):
    payload = data.model_dump(exclude={"department_ids"})
    payload["sku"] = payload.get("sku") or f"P-{int(datetime.utcnow().timestamp())}"
    payload["slug"] = payload.get("slug") or _slug(payload["name"])
    p = Product(**payload)
    db.add(p); await db.flush()
    await _sync_departments(db, p.id, data.department_ids)
    await audit(db, action="create", module="catalog", user=user, entity_type="product",
                entity_id=p.id, new=payload, request=request)
    await db.commit()
    res = await db.execute(
        select(Product).where(Product.id == p.id).options(*_product_options()))
    return await _product_out(db, res.scalar_one())


@router.patch("/products/{pid}", response_model=ProductOut)
async def update_product(pid: int, data: ProductUpdate, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("catalog:manage"))):
    p = await db.get(Product, pid)
    if not p or p.deleted_at is not None: raise NotFoundError("Product not found")
    payload = data.model_dump(exclude_unset=True, exclude={"department_ids"})
    dept_ids = data.department_ids
    for k, v in payload.items(): setattr(p, k, v)
    await _sync_departments(db, p.id, dept_ids)
    await audit(db, action="update", module="catalog", user=user, entity_type="product",
                entity_id=p.id, new=payload, request=request)
    await db.commit()
    res = await db.execute(
        select(Product).where(Product.id == p.id).options(*_product_options()))
    return await _product_out(db, res.scalar_one())


@router.delete("/products/{pid}", response_model=OkResponse)
async def delete_product(pid: int, db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("catalog:manage"))):
    p = await db.get(Product, pid)
    if not p or p.deleted_at is not None: raise NotFoundError("Product not found")
    p.deleted_at = datetime.now(timezone.utc); p.is_active = False
    await db.commit()
    return OkResponse()


# ── Product BOM (materials per unit) ─────────────────────────────────────────
@router.get("/products/{pid}/materials", response_model=List[ProductMaterialOut])
async def get_product_materials(
    pid: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("catalog:manage")),
):
    res = await db.execute(
        select(Product).where(Product.id == pid, Product.deleted_at.is_(None))
        .options(selectinload(Product.materials).selectinload(ProductMaterial.material))
    )
    p = res.scalar_one_or_none()
    if not p:
        raise NotFoundError("Product not found")
    return [ProductMaterialOut.model_validate(m) for m in p.materials]


@router.put("/products/{pid}/materials", response_model=List[ProductMaterialOut])
async def replace_product_materials(
    pid: int,
    data: ProductBomUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("catalog:manage")),
):
    res = await db.execute(
        select(Product).where(Product.id == pid, Product.deleted_at.is_(None))
        .options(selectinload(Product.materials))
    )
    p = res.scalar_one_or_none()
    if not p:
        raise NotFoundError("Product not found")

    p.materials.clear()
    await db.flush()
    for line in data.lines:
        if line.quantity_per_unit <= 0:
            continue
        m = await db.get(Material, line.material_id)
        if not m or m.deleted_at is not None:
            raise NotFoundError(f"Material #{line.material_id} not found")
        p.materials.append(ProductMaterial(
            material_id=line.material_id,
            quantity_per_unit=line.quantity_per_unit,
        ))

    await audit(db, action="update", module="catalog", user=user, entity_type="product_bom",
                entity_id=p.id, new={"lines": [l.model_dump() for l in data.lines]}, request=request)
    await db.commit()

    res = await db.execute(
        select(ProductMaterial)
        .where(ProductMaterial.product_id == pid)
        .options(selectinload(ProductMaterial.material))
    )
    return [ProductMaterialOut.model_validate(m) for m in res.scalars().all()]


# ── Instant pricing ──────────────────────────────────────────────────────────
@router.post("/quote", response_model=QuoteEstimate)
async def instant_quote(data: QuoteRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Product).where(Product.id == data.product_id, Product.deleted_at.is_(None))
        .options(selectinload(Product.pricing_rules))
    )
    product = res.scalar_one_or_none()
    if not product: raise NotFoundError("Product not found")

    unit, total, breakdown = calculate_price(
        product, quantity=data.quantity, options=data.options, rules=product.pricing_rules)
    return QuoteEstimate(unit_price=unit, line_total=total, breakdown=breakdown)
