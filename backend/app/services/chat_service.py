"""Internal messaging business logic."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.models.chat import ChatMessage, Conversation, ConversationMember
from app.models.order import Order
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate, ChatMessageOut, ConversationCreate, ConversationMemberOut, ConversationOut,
)


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Normalize SQLite/Postgres datetimes for safe comparison."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def _load_order_meta(db: AsyncSession, order_id: Optional[int]) -> tuple[Optional[str], Optional[str]]:
    if not order_id:
        return None, None
    res = await db.execute(select(Order.code, Order.title).where(Order.id == order_id))
    row = res.one_or_none()
    if not row:
        return None, None
    return row.code, row.title


async def _load_user_profiles(
    db: AsyncSession, user_ids: set[int],
) -> dict[int, tuple[str, str, Optional[str]]]:
    """id → (full_name, email, avatar_url)."""
    if not user_ids:
        return {}
    res = await db.execute(
        select(User.id, User.full_name, User.email, User.avatar_url).where(User.id.in_(user_ids))
    )
    return {r.id: (r.full_name, r.email, r.avatar_url) for r in res.all()}


async def _load_user_names(db: AsyncSession, user_ids: set[int]) -> dict[int, tuple[str, str]]:
    profiles = await _load_user_profiles(db, user_ids)
    return {uid: (name, email) for uid, (name, email, _) in profiles.items()}


async def assert_member(db: AsyncSession, conversation_id: int, user_id: int) -> ConversationMember:
    res = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    member = res.scalar_one_or_none()
    if not member:
        raise ForbiddenError("Not a member of this conversation")
    return member


async def load_conversation(db: AsyncSession, cid: int) -> Conversation:
    res = await db.execute(
        select(Conversation)
        .where(Conversation.id == cid, Conversation.deleted_at.is_(None))
        .options(
            selectinload(Conversation.members),
            selectinload(Conversation.messages),
        )
    )
    conv = res.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    return conv


async def serialize_message(db: AsyncSession, msg: ChatMessage) -> ChatMessageOut:
    profiles = await _load_user_profiles(db, {msg.author_user_id} if msg.author_user_id else set())
    code, title = await _load_order_meta(db, msg.order_id)
    author = profiles.get(msg.author_user_id or -1)
    return ChatMessageOut.model_validate(msg).model_copy(
        update={
            "author_name": author[0] if author else None,
            "author_avatar_url": author[2] if author else None,
            "order_code": code,
            "order_title": title,
        },
    )


async def serialize_conversation(
    db: AsyncSession, conv: Conversation, user_id: int, *, include_messages: bool = True,
) -> ConversationOut:
    user_ids = {m.user_id for m in conv.members}
    user_ids.update({msg.author_user_id for msg in conv.messages if msg.author_user_id})
    profiles = await _load_user_profiles(db, user_ids)
    code, title = await _load_order_meta(db, conv.order_id)

    member = next((m for m in conv.members if m.user_id == user_id), None)
    last_read = _as_utc(member.last_read_at if member else None)
    unread = sum(
        1 for msg in conv.messages
        if msg.author_user_id != user_id
        and (not last_read or _as_utc(msg.created_at) > last_read)
    )
    last_msg = conv.messages[-1].body if conv.messages else None
    last_msg_at = conv.messages[-1].created_at if conv.messages else None

    messages: list[ChatMessageOut] = []
    if include_messages:
        for msg in conv.messages:
            author = profiles.get(msg.author_user_id or -1)
            ocode, otitle = await _load_order_meta(db, msg.order_id)
            messages.append(
                ChatMessageOut.model_validate(msg).model_copy(
                    update={
                        "author_name": author[0] if author else None,
                        "author_avatar_url": author[2] if author else None,
                        "order_code": ocode,
                        "order_title": otitle,
                    },
                )
            )

    return ConversationOut(
        id=conv.id,
        kind=conv.kind,
        title=conv.title,
        order_id=conv.order_id,
        order_code=code,
        order_title=title,
        created_by_id=conv.created_by_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        members=[
            ConversationMemberOut(
                user_id=m.user_id,
                full_name=profiles.get(m.user_id, ("Unknown", "", None))[0],
                email=profiles.get(m.user_id, ("", "", None))[1],
                avatar_url=profiles.get(m.user_id, ("", "", None))[2],
            )
            for m in conv.members
        ],
        messages=messages,
        last_message=last_msg,
        last_message_at=last_msg_at,
        unread_count=unread,
    )


async def list_conversations(db: AsyncSession, user: User) -> list[ConversationOut]:
    res = await db.execute(
        select(Conversation)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(
            ConversationMember.user_id == user.id,
            Conversation.deleted_at.is_(None),
        )
        .options(
            selectinload(Conversation.members),
            selectinload(Conversation.messages),
        )
        .order_by(Conversation.updated_at.desc())
    )
    rows = res.scalars().unique().all()
    return [await serialize_conversation(db, c, user.id, include_messages=False) for c in rows]


async def create_conversation(db: AsyncSession, user: User, data: ConversationCreate) -> Conversation:
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff only")
    if data.kind == "group" and not user.is_superuser:
        raise ForbiddenError("Only the CEO can create group conversations")

    member_ids = set(data.member_ids)
    member_ids.add(user.id)
    if data.kind == "dm" and len(member_ids) != 2:
        raise ValidationError("Direct messages require exactly one other member")

    conv = Conversation(
        kind=data.kind,
        title=data.title or (f"Group" if data.kind == "group" else None),
        order_id=data.order_id,
        created_by_id=user.id,
    )
    for uid in member_ids:
        conv.members.append(ConversationMember(user_id=uid))
    db.add(conv)
    await db.flush()
    return conv


async def send_message(
    db: AsyncSession, user: User, conversation_id: int, data: ChatMessageCreate,
) -> ChatMessage:
    conv = await load_conversation(db, conversation_id)
    await assert_member(db, conversation_id, user.id)
    msg = ChatMessage(
        conversation_id=conv.id,
        author_user_id=user.id,
        body=data.body.strip(),
        order_id=data.order_id or conv.order_id,
    )
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    member = await assert_member(db, conversation_id, user.id)
    member.last_read_at = datetime.now(timezone.utc)
    await db.flush()

    from app.services.notification_service import notify_chat_message

    await notify_chat_message(db, conv, msg, user)
    return msg


async def mark_read(db: AsyncSession, user: User, conversation_id: int) -> None:
    member = await assert_member(db, conversation_id, user.id)
    member.last_read_at = datetime.now(timezone.utc)


async def get_order_conversation(db: AsyncSession, order_id: int) -> Optional[Conversation]:
    res = await db.execute(
        select(Conversation)
        .where(
            Conversation.order_id == order_id,
            Conversation.kind == "group",
            Conversation.deleted_at.is_(None),
        )
        .options(
            selectinload(Conversation.members),
            selectinload(Conversation.messages),
        )
        .order_by(Conversation.id.asc())
        .limit(1)
    )
    return res.scalar_one_or_none()


async def ensure_order_conversation(
    db: AsyncSession,
    order: Order,
    *,
    created_by_id: Optional[int] = None,
    extra_member_ids: Optional[set[int]] = None,
) -> Conversation:
    """Create (or return) the auto project group for an order. No CEO gate."""
    existing = await get_order_conversation(db, order.id)
    member_ids: set[int] = set(extra_member_ids or set())
    if created_by_id:
        member_ids.add(created_by_id)
    if order.owner_id:
        member_ids.add(order.owner_id)

    from app.services.order_collaboration import ids_for_global_watchers

    member_ids |= await ids_for_global_watchers(db)

    # Active assignees
    from app.models.order import OrderWorkflowAssignment

    res = await db.execute(
        select(OrderWorkflowAssignment.assignee_id).where(
            OrderWorkflowAssignment.order_id == order.id,
            OrderWorkflowAssignment.is_skipped.is_(False),
        )
    )
    member_ids.update(res.scalars().all())

    title = f"{order.code}" + (f" — {order.title}" if order.title else " — Project")

    if existing:
        await _add_members(db, existing, member_ids)
        if not existing.title:
            existing.title = title
        await db.flush()
        return existing

    conv = Conversation(
        kind="group",
        title=title[:255],
        order_id=order.id,
        created_by_id=created_by_id or order.owner_id,
    )
    for uid in member_ids:
        if uid:
            conv.members.append(ConversationMember(user_id=uid))
    db.add(conv)
    await db.flush()
    return conv


async def _add_members(db: AsyncSession, conv: Conversation, member_ids: set[int]) -> None:
    current = {m.user_id for m in conv.members}
    for uid in member_ids:
        if uid and uid not in current:
            conv.members.append(ConversationMember(user_id=uid))
            current.add(uid)


async def sync_order_conversation_members(db: AsyncSession, order: Order) -> Conversation:
    """Ensure project group exists and includes current assignees + CEO/accountant."""
    return await ensure_order_conversation(db, order, created_by_id=order.owner_id)


async def get_or_create_order_conversation_for_user(
    db: AsyncSession, user: User, order_id: int,
) -> ConversationOut:
    from app.services.order_collaboration import assert_can_access_order_collaboration

    order = await db.get(Order, order_id)
    if not order or order.deleted_at is not None:
        raise NotFoundError("Order not found")
    await assert_can_access_order_collaboration(db, user, order)

    conv = await ensure_order_conversation(db, order, created_by_id=user.id, extra_member_ids={user.id})
    # Make sure current viewer is a member so they can chat
    await _add_members(db, conv, {user.id})
    await db.flush()
    conv = await load_conversation(db, conv.id)
    await mark_read(db, user, conv.id)
    return await serialize_conversation(db, conv, user.id)
