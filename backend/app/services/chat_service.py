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


async def _load_user_names(db: AsyncSession, user_ids: set[int]) -> dict[int, tuple[str, str]]:
    if not user_ids:
        return {}
    res = await db.execute(
        select(User.id, User.full_name, User.email).where(User.id.in_(user_ids))
    )
    return {r.id: (r.full_name, r.email) for r in res.all()}


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
    names = await _load_user_names(db, {msg.author_user_id} if msg.author_user_id else set())
    code, title = await _load_order_meta(db, msg.order_id)
    author = names.get(msg.author_user_id or -1)
    return ChatMessageOut.model_validate(msg).model_copy(
        update={
            "author_name": author[0] if author else None,
            "order_code": code,
            "order_title": title,
        },
    )


async def serialize_conversation(
    db: AsyncSession, conv: Conversation, user_id: int, *, include_messages: bool = True,
) -> ConversationOut:
    user_ids = {m.user_id for m in conv.members}
    user_ids.update({msg.author_user_id for msg in conv.messages if msg.author_user_id})
    names = await _load_user_names(db, user_ids)
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
            author = names.get(msg.author_user_id or -1)
            ocode, otitle = await _load_order_meta(db, msg.order_id)
            messages.append(
                ChatMessageOut.model_validate(msg).model_copy(
                    update={
                        "author_name": author[0] if author else None,
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
                full_name=names.get(m.user_id, ("Unknown", ""))[0],
                email=names.get(m.user_id, ("", ""))[1],
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
