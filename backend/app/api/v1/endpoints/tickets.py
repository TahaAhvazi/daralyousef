"""Customer + internal tickets."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import current_user
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import get_db
from app.models.support import Ticket, TicketMessage
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.support import (
    TicketCreate, TicketMessageBase, TicketMessageOut, TicketOut, TicketUpdate,
)
from app.services import ticket_service as ticket_svc
from app.services.audit import record as audit
from app.utils.codes import ticket_code


router = APIRouter()


async def _load_ticket(db: AsyncSession, tid: int) -> Ticket:
    res = await db.execute(
        select(Ticket)
        .where(Ticket.id == tid, Ticket.deleted_at.is_(None))
        .options(selectinload(Ticket.messages))
    )
    t = res.scalar_one_or_none()
    if not t:
        raise NotFoundError("Ticket not found")
    return t


@router.get("/assignees")
async def list_assignees(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff only")
    await ticket_svc.assert_ticket_assign(db, user)
    return await ticket_svc.list_support_assignees(db)


@router.get("", response_model=PaginatedResponse[TicketOut])
async def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    stmt = select(Ticket).where(Ticket.deleted_at.is_(None))
    if q:
        stmt = stmt.where(or_(Ticket.subject.ilike(f"%{q}%"), Ticket.code.ilike(f"%{q}%")))
    if status:
        stmt = stmt.where(Ticket.status == status)
    stmt = await ticket_svc.apply_ticket_list_scope(stmt, db, user)

    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (
        await db.execute(
            stmt.options(selectinload(Ticket.messages))
            .order_by(Ticket.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    items = [await ticket_svc.serialize_ticket(db, r) for r in rows]
    return PaginatedResponse[TicketOut](
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/{tid}", response_model=TicketOut)
async def get_ticket(
    tid: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    t = await _load_ticket(db, tid)
    await ticket_svc.assert_ticket_view(db, user, t)
    return await ticket_svc.serialize_ticket(db, t)


@router.post("", response_model=TicketOut, status_code=201)
async def create_ticket(
    data: TicketCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    customer_id = data.customer_id
    if not (user.is_staff or user.is_superuser):
        cust = await ticket_svc.resolve_customer(db, user)
        if not cust:
            raise ForbiddenError("Customer profile missing")
        customer_id = cust.id

    payload = data.model_dump(exclude={"body"})
    payload["customer_id"] = customer_id
    t = Ticket(code=ticket_code(), opener_user_id=user.id, status="open", **payload)
    if data.body:
        kind = "staff" if (user.is_staff or user.is_superuser) else "customer"
        t.messages.append(TicketMessage(
            body=data.body,
            author_user_id=user.id,
            author_kind=kind,
        ))
    db.add(t)
    await db.flush()
    await audit(
        db, action="create", module="support", user=user, entity_type="ticket",
        entity_id=t.id, new={"code": t.code, "subject": t.subject}, request=request,
    )
    await db.commit()
    t = await _load_ticket(db, t.id)
    return await ticket_svc.serialize_ticket(db, t)


@router.patch("/{tid}", response_model=TicketOut)
async def update_ticket(
    tid: int,
    data: TicketUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    t = await _load_ticket(db, tid)
    payload = data.model_dump(exclude_unset=True)
    await ticket_svc.assert_ticket_update(db, user, t, payload)
    for k, v in payload.items():
        setattr(t, k, v)
    if t.status in {"resolved", "closed"} and not t.closed_at:
        t.closed_at = datetime.now(timezone.utc)
    if t.status not in {"resolved", "closed"}:
        t.closed_at = None
    await audit(
        db, action="update", module="support", user=user, entity_type="ticket",
        entity_id=t.id, new=payload, request=request,
    )
    await db.commit()
    t = await _load_ticket(db, tid)
    return await ticket_svc.serialize_ticket(db, t)


@router.post("/{tid}/messages", response_model=TicketMessageOut, status_code=201)
async def reply_ticket(
    tid: int,
    data: TicketMessageBase,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    t = await _load_ticket(db, tid)
    await ticket_svc.assert_ticket_reply(db, user, t)
    kind = "staff" if (user.is_staff or user.is_superuser) else "customer"
    msg = TicketMessage(ticket_id=t.id, author_user_id=user.id, author_kind=kind, body=data.body)
    db.add(msg)
    if kind == "customer" and t.status == "waiting_customer":
        t.status = "in_progress"
    elif kind == "staff" and t.status in {"open", "in_progress"}:
        t.status = "waiting_customer"
    await audit(
        db, action="reply", module="support", user=user,
        entity_type="ticket", entity_id=t.id, request=request,
    )
    await db.commit()
    names = await ticket_svc.load_user_names(db, {user.id})
    out = TicketMessageOut.model_validate(msg)
    out.author_name = names.get(user.id)
    return out
