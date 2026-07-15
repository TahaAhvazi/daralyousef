"""Staff messaging — DMs, groups (CEO-only), project mentions."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.core.exceptions import ForbiddenError
from app.db.base import get_db
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageOut, ConversationCreate, ConversationOut
from app.services import chat_service as chat_svc
from app.services.audit import record as audit


router = APIRouter()


def _require_staff(user: User) -> None:
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff only")


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _require_staff(user)
    return await chat_svc.list_conversations(db, user)


@router.get("/meta/staff")
async def list_staff(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _require_staff(user)
    from sqlalchemy import select
    res = await db.execute(
        select(User.id, User.full_name, User.email, User.avatar_url)
        .where(User.is_staff.is_(True), User.is_active.is_(True), User.deleted_at.is_(None))
        .order_by(User.full_name)
    )
    return [
        {"id": r.id, "full_name": r.full_name, "email": r.email, "avatar_url": r.avatar_url}
        for r in res.all()
    ]


@router.get("/meta/orders")
async def list_orders_for_mention(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _require_staff(user)
    from sqlalchemy import select
    from app.models.order import Order
    res = await db.execute(
        select(Order.id, Order.code, Order.title)
        .where(Order.deleted_at.is_(None))
        .order_by(Order.id.desc())
        .limit(100)
    )
    return [{"id": r.id, "code": r.code, "title": r.title} for r in res.all()]


@router.get("/by-order/{order_id}", response_model=ConversationOut)
async def get_conversation_for_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """Open (or auto-create) the project chat group for an order."""
    _require_staff(user)
    out = await chat_svc.get_or_create_order_conversation_for_user(db, user, order_id)
    await db.commit()
    return out


@router.get("/{cid}", response_model=ConversationOut)
async def get_conversation(
    cid: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _require_staff(user)
    conv = await chat_svc.load_conversation(db, cid)
    await chat_svc.assert_member(db, cid, user.id)
    await chat_svc.mark_read(db, user, cid)
    await db.commit()
    conv = await chat_svc.load_conversation(db, cid)
    return await chat_svc.serialize_conversation(db, conv, user.id)


@router.post("", response_model=ConversationOut, status_code=201)
async def create_conversation(
    data: ConversationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _require_staff(user)
    conv = await chat_svc.create_conversation(db, user, data)
    await audit(
        db, action="create", module="messages", user=user, entity_type="conversation",
        entity_id=conv.id, new={"kind": conv.kind, "title": conv.title}, request=request,
    )
    await db.commit()
    conv = await chat_svc.load_conversation(db, conv.id)
    return await chat_svc.serialize_conversation(db, conv, user.id)


@router.post("/{cid}/messages", response_model=ChatMessageOut, status_code=201)
async def send_message(
    cid: int,
    data: ChatMessageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _require_staff(user)
    msg = await chat_svc.send_message(db, user, cid, data)
    await audit(
        db, action="message", module="messages", user=user, entity_type="conversation",
        entity_id=cid, request=request,
    )
    await db.commit()
    return await chat_svc.serialize_message(db, msg)
