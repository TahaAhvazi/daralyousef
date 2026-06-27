"""CRM endpoints: Leads, Opportunities, Follow-ups."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_permissions
from app.core.exceptions import NotFoundError
from app.db.base import get_db
from app.models.crm import FollowUp, Lead, Opportunity
from app.models.customer import Customer
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.schemas.crm import (
    FollowUpCreate, FollowUpOut,
    LeadCreate, LeadOut, LeadUpdate,
    OpportunityCreate, OpportunityOut, OpportunityUpdate,
)
from app.services.audit import record as audit
from app.utils.codes import customer_code


router = APIRouter()


# ── Leads ────────────────────────────────────────────────────────────────────
@router.get("/leads", response_model=PaginatedResponse[LeadOut])
async def list_leads(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("crm:read")),
):
    stmt = select(Lead).where(Lead.deleted_at.is_(None))
    if q:
        stmt = stmt.where(or_(Lead.full_name.ilike(f"%{q}%"),
                              Lead.company_name.ilike(f"%{q}%"),
                              Lead.email.ilike(f"%{q}%")))
    if stage: stmt = stmt.where(Lead.stage == stage)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Lead.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[LeadOut](
        items=[LeadOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/leads", response_model=LeadOut, status_code=201)
async def create_lead(data: LeadCreate, request: Request,
                      db: AsyncSession = Depends(get_db),
                      user: User = Depends(require_permissions("crm:create"))):
    lead = Lead(**data.model_dump())
    db.add(lead); await db.flush()
    await audit(db, action="create", module="crm", user=user, entity_type="lead",
                entity_id=lead.id, new=data.model_dump(), request=request)
    await db.commit()
    return LeadOut.model_validate(lead)


@router.patch("/leads/{lid}", response_model=LeadOut)
async def update_lead(lid: int, data: LeadUpdate, request: Request,
                      db: AsyncSession = Depends(get_db),
                      user: User = Depends(require_permissions("crm:update"))):
    lead = await db.get(Lead, lid)
    if not lead or lead.deleted_at is not None: raise NotFoundError("Lead not found")
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items(): setattr(lead, k, v)
    await audit(db, action="update", module="crm", user=user, entity_type="lead",
                entity_id=lead.id, new=payload, request=request)
    await db.commit()
    return LeadOut.model_validate(lead)


@router.post("/leads/{lid}/convert", response_model=LeadOut)
async def convert_lead(lid: int, request: Request,
                       db: AsyncSession = Depends(get_db),
                       user: User = Depends(require_permissions("crm:update"))):
    lead = await db.get(Lead, lid)
    if not lead or lead.deleted_at is not None: raise NotFoundError("Lead not found")
    if lead.converted_customer_id:
        return LeadOut.model_validate(lead)
    cust = Customer(code=customer_code(), full_name=lead.full_name,
                    email=lead.email, phone=lead.phone)
    db.add(cust); await db.flush()
    lead.converted_customer_id = cust.id
    lead.stage = "won"
    if lead.estimated_value:
        opp = Opportunity(title=f"{lead.full_name} – initial deal",
                          customer_id=cust.id, lead_id=lead.id,
                          expected_value=lead.estimated_value, probability=80,
                          stage="proposal", owner_id=lead.owner_id)
        db.add(opp)
    await audit(db, action="convert", module="crm", user=user, entity_type="lead",
                entity_id=lead.id, new={"customer_id": cust.id}, request=request)
    await db.commit()
    return LeadOut.model_validate(lead)


@router.delete("/leads/{lid}", response_model=OkResponse)
async def delete_lead(lid: int, request: Request,
                      db: AsyncSession = Depends(get_db),
                      user: User = Depends(require_permissions("crm:delete"))):
    lead = await db.get(Lead, lid)
    if not lead or lead.deleted_at is not None: raise NotFoundError("Lead not found")
    lead.deleted_at = datetime.now(timezone.utc)
    await audit(db, action="delete", module="crm", user=user, entity_type="lead",
                entity_id=lead.id, request=request)
    await db.commit()
    return OkResponse()


# ── Opportunities ────────────────────────────────────────────────────────────
@router.get("/opportunities", response_model=PaginatedResponse[OpportunityOut])
async def list_opportunities(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("crm:read")),
):
    stmt = select(Opportunity).where(Opportunity.deleted_at.is_(None))
    if q: stmt = stmt.where(Opportunity.title.ilike(f"%{q}%"))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Opportunity.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[OpportunityOut](
        items=[OpportunityOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/opportunities", response_model=OpportunityOut, status_code=201)
async def create_opportunity(data: OpportunityCreate, request: Request,
                             db: AsyncSession = Depends(get_db),
                             user: User = Depends(require_permissions("crm:create"))):
    o = Opportunity(**data.model_dump())
    db.add(o); await db.flush()
    await audit(db, action="create", module="crm", user=user, entity_type="opportunity",
                entity_id=o.id, new=data.model_dump(), request=request)
    await db.commit()
    return OpportunityOut.model_validate(o)


@router.patch("/opportunities/{oid}", response_model=OpportunityOut)
async def update_opportunity(oid: int, data: OpportunityUpdate, request: Request,
                             db: AsyncSession = Depends(get_db),
                             user: User = Depends(require_permissions("crm:update"))):
    o = await db.get(Opportunity, oid)
    if not o or o.deleted_at is not None: raise NotFoundError("Opportunity not found")
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items(): setattr(o, k, v)
    await audit(db, action="update", module="crm", user=user, entity_type="opportunity",
                entity_id=o.id, new=payload, request=request)
    await db.commit()
    return OpportunityOut.model_validate(o)


# ── Follow-ups ───────────────────────────────────────────────────────────────
@router.get("/follow-ups", response_model=PaginatedResponse[FollowUpOut])
async def list_follow_ups(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("crm:read")),
):
    stmt = select(FollowUp)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(FollowUp.due_at).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[FollowUpOut](
        items=[FollowUpOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/follow-ups", response_model=FollowUpOut, status_code=201)
async def create_follow_up(data: FollowUpCreate, db: AsyncSession = Depends(get_db),
                           _: User = Depends(require_permissions("crm:create"))):
    f = FollowUp(**data.model_dump())
    db.add(f); await db.commit()
    return FollowUpOut.model_validate(f)


@router.post("/follow-ups/{fid}/done", response_model=OkResponse)
async def complete_follow_up(fid: int, db: AsyncSession = Depends(get_db),
                             _: User = Depends(require_permissions("crm:update"))):
    f = await db.get(FollowUp, fid)
    if not f: raise NotFoundError("Follow-up not found")
    f.done = True
    await db.commit()
    return OkResponse()
