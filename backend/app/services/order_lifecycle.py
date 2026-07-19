"""Order lifecycle helpers — chat narrative, stock gate, role checks.

Happy path:
  intake → approval → confirmed → paid → warehouse → design → … → delivery → completed

General manager / CEO / CTO can move any stage forward or back (existing override).
Every major transition posts into the project chat and writes OrderStatusEvent / AuditLog.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, ValidationError
from app.models.chat import ChatMessage
from app.models.inventory import StockMovement
from app.models.order import Order, OrderStatusEvent
from app.models.rbac import Role, UserRole
from app.models.user import User
from app.services import chat_service as chat_svc
from app.services.inventory_service import deduct_materials_for_order, validate_stock_for_items

logger = logging.getLogger("atelier.order_lifecycle")

STOCK_CHECK_ROLE_SLUGS = frozenset({"warehouse", "general_manager", "ceo", "cto"})
LIFECYCLE_WATCHER_SLUGS = frozenset({"ceo", "accountant", "general_manager", "warehouse"})


def order_stock_approved(order: Order) -> bool:
    """True when warehouse signed off, or order already past the gate (legacy)."""
    status = getattr(order, "stock_check_status", None)
    if status == "approved":
        return True
    # Legacy / already manufacturing before warehouse gate existed
    if order.status in ("in_production", "delivered", "closed"):
        return True
    return False


async def user_can_stock_check(db: AsyncSession, user: User) -> bool:
    if user.is_superuser:
        return True
    res = await db.execute(
        select(Role.slug)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    return bool(set(res.scalars().all()) & STOCK_CHECK_ROLE_SLUGS)


async def ids_for_lifecycle_watchers(db: AsyncSession) -> set[int]:
    """CEO + accountant + GM + warehouse — always on project chat."""
    res = await db.execute(
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(
            Role.slug.in_(tuple(LIFECYCLE_WATCHER_SLUGS)),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    return set(res.scalars().all())


async def post_order_chat(
    db: AsyncSession,
    order: Order,
    *,
    body: str,
    actor: Optional[User] = None,
) -> Optional[ChatMessage]:
    """Append a lifecycle note into the order project chat (best-effort)."""
    text = (body or "").strip()
    if not text:
        return None
    try:
        extra = {actor.id} if actor else set()
        watchers = await ids_for_lifecycle_watchers(db)
        conv = await chat_svc.ensure_order_conversation(
            db,
            order,
            created_by_id=actor.id if actor else order.owner_id,
            extra_member_ids=extra | watchers,
        )
        msg = ChatMessage(
            conversation_id=conv.id,
            author_user_id=actor.id if actor else None,
            body=text[:8000],
            order_id=order.id,
        )
        db.add(msg)
        conv.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return msg
    except Exception:
        logger.exception("Failed to post order chat for order %s", order.id)
        return None


async def _materials_already_deducted(db: AsyncSession, order_id: int) -> bool:
    n = await db.scalar(
        select(func.count())
        .select_from(StockMovement)
        .where(
            StockMovement.reference_type == "order",
            StockMovement.reference_id == order_id,
            StockMovement.type == "OUT",
        )
    )
    return int(n or 0) > 0


async def submit_stock_check(
    db: AsyncSession,
    order: Order,
    user: User,
    *,
    approved: bool,
    notes: Optional[str] = None,
) -> Order:
    """Warehouse (or GM) reviews materials before production starts."""
    if not await user_can_stock_check(db, user):
        raise ForbiddenError("Only warehouse or management can complete stock check")
    if order.status != "paid":
        raise ValidationError(
            "Stock check is only available after payment is confirmed",
            code="stock_check_requires_paid",
        )
    if order_stock_approved(order) and approved:
        return order

    note = (notes or "").strip() or None
    old = order.status
    now = datetime.now(timezone.utc)

    if approved:
        await validate_stock_for_items(db, order.items)
        if not getattr(order, "materials_deducted", False) and not await _materials_already_deducted(db, order.id):
            await deduct_materials_for_order(db, order, user)
            order.materials_deducted = True
        order.stock_check_status = "approved"
        order.stock_checked_at = now
        order.stock_checked_by_id = user.id
        order.stock_check_notes = note
        event_notes = note or "Warehouse approved stock — ready for production"
        chat_body = (
            f"✅ Warehouse stock check approved by {user.full_name}.\n"
            f"Materials reserved. Order can move into design / production."
            + (f"\nNote: {note}" if note else "")
        )
    else:
        if not note:
            raise ValidationError("Reason required when rejecting stock check")
        order.stock_check_status = "rejected"
        order.stock_checked_at = now
        order.stock_checked_by_id = user.id
        order.stock_check_notes = note
        event_notes = f"Stock check rejected: {note}"
        chat_body = (
            f"⚠️ Warehouse stock check rejected by {user.full_name}.\n"
            f"Reason: {note}\n"
            f"Fix inventory or revise the order before production."
        )

    order.events.append(OrderStatusEvent(
        order_id=order.id,
        from_status=old,
        to_status=old,  # lifecycle sub-state; order.status stays paid
        occurred_at=now,
        actor_id=user.id,
        notes=event_notes,
    ))
    await post_order_chat(db, order, body=chat_body, actor=user)
    await db.flush()
    return order


def format_status_chat(
    *,
    action: str,
    actor_name: str,
    from_status: Optional[str] = None,
    to_status: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    lines = [f"📌 {action} — {actor_name}"]
    if from_status and to_status and from_status != to_status:
        lines.append(f"{from_status} → {to_status}")
    elif to_status:
        lines.append(f"Status: {to_status}")
    if notes and str(notes).strip():
        lines.append(f"Note: {str(notes).strip()}")
    return "\n".join(lines)
