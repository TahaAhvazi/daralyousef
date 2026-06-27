"""Customer & Company endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_permissions
from app.core.exceptions import NotFoundError
from app.db.base import get_db
from app.models.customer import Company, Customer
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.schemas.customer import (
    CompanyCreate, CompanyOut, CompanyUpdate,
    CustomerCreate, CustomerOut, CustomerUpdate,
)
from app.services.audit import record as audit
from app.utils.codes import customer_code


router = APIRouter()


# ── Companies ────────────────────────────────────────────────────────────────
@router.get("/companies", response_model=PaginatedResponse[CompanyOut])
async def list_companies(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("crm:read")),
):
    stmt = select(Company).where(Company.deleted_at.is_(None))
    if q: stmt = stmt.where(Company.name.ilike(f"%{q}%"))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Company.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[CompanyOut](
        items=[CompanyOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/companies", response_model=CompanyOut, status_code=201)
async def create_company(data: CompanyCreate, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("crm:create"))):
    c = Company(**data.model_dump())
    db.add(c); await db.flush()
    await audit(db, action="create", module="crm", user=user, entity_type="company",
                entity_id=c.id, new=data.model_dump(), request=request)
    await db.commit()
    return CompanyOut.model_validate(c)


@router.patch("/companies/{cid}", response_model=CompanyOut)
async def update_company(cid: int, data: CompanyUpdate, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("crm:update"))):
    c = await db.get(Company, cid)
    if not c or c.deleted_at is not None: raise NotFoundError("Company not found")
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items(): setattr(c, k, v)
    await audit(db, action="update", module="crm", user=user, entity_type="company",
                entity_id=c.id, new=payload, request=request)
    await db.commit()
    return CompanyOut.model_validate(c)


@router.delete("/companies/{cid}", response_model=OkResponse)
async def delete_company(cid: int, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("crm:delete"))):
    c = await db.get(Company, cid)
    if not c or c.deleted_at is not None: raise NotFoundError("Company not found")
    c.deleted_at = datetime.now(timezone.utc)
    await audit(db, action="delete", module="crm", user=user, entity_type="company",
                entity_id=c.id, request=request)
    await db.commit()
    return OkResponse()


# ── Customers ────────────────────────────────────────────────────────────────
@router.get("", response_model=PaginatedResponse[CustomerOut])
async def list_customers(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("crm:read")),
):
    stmt = select(Customer).where(Customer.deleted_at.is_(None))
    if q:
        stmt = stmt.where(or_(
            Customer.full_name.ilike(f"%{q}%"),
            Customer.email.ilike(f"%{q}%"),
            Customer.phone.ilike(f"%{q}%"),
            Customer.code.ilike(f"%{q}%"),
        ))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Customer.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[CustomerOut](
        items=[CustomerOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.get("/{cid}", response_model=CustomerOut)
async def get_customer(cid: int, db: AsyncSession = Depends(get_db),
                       _: User = Depends(require_permissions("crm:read"))):
    c = await db.get(Customer, cid)
    if not c or c.deleted_at is not None: raise NotFoundError("Customer not found")
    return CustomerOut.model_validate(c)


@router.post("", response_model=CustomerOut, status_code=201)
async def create_customer(data: CustomerCreate, request: Request,
                          db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("crm:create"))):
    c = Customer(code=customer_code(), **data.model_dump())
    db.add(c); await db.flush()
    await audit(db, action="create", module="crm", user=user, entity_type="customer",
                entity_id=c.id, new=data.model_dump(), request=request)
    await db.commit()
    return CustomerOut.model_validate(c)


@router.patch("/{cid}", response_model=CustomerOut)
async def update_customer(cid: int, data: CustomerUpdate, request: Request,
                          db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("crm:update"))):
    c = await db.get(Customer, cid)
    if not c or c.deleted_at is not None: raise NotFoundError("Customer not found")
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items(): setattr(c, k, v)
    await audit(db, action="update", module="crm", user=user, entity_type="customer",
                entity_id=c.id, new=payload, request=request)
    await db.commit()
    return CustomerOut.model_validate(c)


@router.delete("/{cid}", response_model=OkResponse)
async def delete_customer(cid: int, request: Request,
                          db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_permissions("crm:delete"))):
    c = await db.get(Customer, cid)
    if not c or c.deleted_at is not None: raise NotFoundError("Customer not found")
    c.deleted_at = datetime.now(timezone.utc)
    await audit(db, action="delete", module="crm", user=user, entity_type="customer",
                entity_id=c.id, request=request)
    await db.commit()
    return OkResponse()
