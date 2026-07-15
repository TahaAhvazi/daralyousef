"""Project shift notes — separate from chat."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.models.order import Order
from app.models.order_note import OrderNote
from app.models.user import User
from app.schemas.order_note import OrderNoteCreate, OrderNoteOut, OrderNoteUpdate
from app.services.order_collaboration import assert_can_access_order_collaboration, assert_can_write_order_note


async def list_notes(db: AsyncSession, user: User, order_id: int) -> list[OrderNoteOut]:
    order = await db.get(Order, order_id)
    if not order or order.deleted_at is not None:
        raise NotFoundError("Order not found")
    await assert_can_access_order_collaboration(db, user, order)

    res = await db.execute(
        select(OrderNote)
        .where(OrderNote.order_id == order_id, OrderNote.deleted_at.is_(None))
        .options(selectinload(OrderNote.author))
        .order_by(OrderNote.id.desc())
    )
    rows = list(res.scalars().all())
    return [
        OrderNoteOut(
            id=n.id,
            order_id=n.order_id,
            author_id=n.author_id,
            author_name=n.author.full_name if n.author else None,
            body=n.body,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in rows
    ]


async def create_note(
    db: AsyncSession, user: User, order_id: int, data: OrderNoteCreate,
) -> OrderNoteOut:
    order = await db.get(Order, order_id)
    if not order or order.deleted_at is not None:
        raise NotFoundError("Order not found")
    await assert_can_write_order_note(db, user, order)

    body = data.body.strip()
    if not body:
        raise ValidationError("Note cannot be empty")

    note = OrderNote(order_id=order.id, author_id=user.id, body=body)
    db.add(note)
    await db.flush()
    return OrderNoteOut(
        id=note.id,
        order_id=note.order_id,
        author_id=user.id,
        author_name=user.full_name,
        body=note.body,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


async def update_note(
    db: AsyncSession, user: User, order_id: int, note_id: int, data: OrderNoteUpdate,
) -> OrderNoteOut:
    order = await db.get(Order, order_id)
    if not order or order.deleted_at is not None:
        raise NotFoundError("Order not found")
    await assert_can_write_order_note(db, user, order)

    note = await db.get(OrderNote, note_id)
    if not note or note.deleted_at is not None or note.order_id != order_id:
        raise NotFoundError("Note not found")
    if note.author_id != user.id and not user.is_superuser:
        raise ForbiddenError("You can only edit your own notes")

    body = data.body.strip()
    if not body:
        raise ValidationError("Note cannot be empty")
    note.body = body
    await db.flush()
    return OrderNoteOut(
        id=note.id,
        order_id=note.order_id,
        author_id=note.author_id,
        author_name=user.full_name if note.author_id == user.id else None,
        body=note.body,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


async def delete_note(db: AsyncSession, user: User, order_id: int, note_id: int) -> None:
    order = await db.get(Order, order_id)
    if not order or order.deleted_at is not None:
        raise NotFoundError("Order not found")
    await assert_can_write_order_note(db, user, order)

    note = await db.get(OrderNote, note_id)
    if not note or note.deleted_at is not None or note.order_id != order_id:
        raise NotFoundError("Note not found")
    if note.author_id != user.id and not user.is_superuser:
        raise ForbiddenError("You can only delete your own notes")

    note.deleted_at = datetime.now(timezone.utc)
