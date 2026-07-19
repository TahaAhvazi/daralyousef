"""Order approval workflow — customer requests, admin pricing, mutual sign-off."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, ValidationError
from app.core.workflow import ASSIGNMENT_STAGES
from app.models.order import PRODUCTION_ORDER_STATUSES, Order, OrderItem, OrderStatusEvent
from app.models.user import User
from app.schemas.order import CustomerOrderResponse, OrderItemCreate, OrderProposal, OrderReceiptConfirm, OrderRelease
from app.services import workflow_assignment_service as assign_svc
from app.services.order_service import (
    _init_item_workflow,
    _populate_item_from_product,
    assert_order_access,
    resolve_customer_scope,
)

RECEIPT_TERMINAL_STATUSES = frozenset({"delivered", "closed", "cancelled"})
RECEIPT_STAFF_ROLE_SLUGS = frozenset({"accountant", "cto", "ceo", "general_manager"})
from app.utils.line_totals import aggregate_order_totals, compute_line_total


def _can_propose(status: str) -> bool:
    return status in ("draft", "pending_review", "awaiting_customer")


def _require_priced_items(items: List[OrderItem]) -> None:
    if not items:
        raise ValidationError("Order must have at least one line item")
    for it in items:
        if it.unit_price <= 0:
            raise ValidationError(f"Line item '{it.name}' requires a unit price before proceeding")


async def _replace_items(db: AsyncSession, order: Order, raw_items: List[OrderItemCreate]) -> None:
    order.items.clear()
    await db.flush()
    for raw in raw_items:
        item = OrderItem(**raw.model_dump())
        await _populate_item_from_product(db, item, allow_pricing=True)
        if not item.status_history:
            await _init_item_workflow(db, item, item.product_id)
        item.line_total = compute_line_total(item)
        order.items.append(item)


async def propose_order_to_customer(
    db: AsyncSession,
    order: Order,
    user: User,
    data: OrderProposal,
) -> Order:
    if not _can_propose(order.status):
        raise ValidationError(f"Cannot send proposal while order is '{order.status}'")

    await _replace_items(db, order, data.items)
    _require_priced_items(order.items)

    if data.deadline is not None:
        order.deadline = data.deadline
    if data.notes is not None:
        order.notes = data.notes

    aggregate_order_totals(order)

    old = order.status
    if order.placed_via == "portal" or old in ("pending_review", "awaiting_customer"):
        order.status = "awaiting_customer"
    else:
        order.status = "customer_approved"

    msg = data.admin_message or "Pricing and terms updated"
    order.events.append(OrderStatusEvent(
        from_status=old,
        to_status=order.status,
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=msg,
    ))
    from app.services.order_lifecycle import format_status_chat, post_order_chat

    await post_order_chat(
        db,
        order,
        body=format_status_chat(
            action="Pricing proposal sent" if order.status == "awaiting_customer" else "Pricing saved",
            actor_name=user.full_name,
            from_status=old,
            to_status=order.status,
            notes=msg,
        ),
        actor=user,
    )
    return order


async def customer_respond_to_proposal(
    db: AsyncSession,
    order: Order,
    user: User,
    data: CustomerOrderResponse,
) -> Order:
    cust = await resolve_customer_scope(db, user)
    if not cust or cust.id != order.customer_id:
        raise ForbiddenError("Not your order")
    if order.status != "awaiting_customer":
        raise ValidationError("No proposal awaiting your response")

    old = order.status
    if data.approved:
        order.status = "customer_approved"
        note = data.notes or "Customer approved the proposal"
    else:
        order.status = "pending_review"
        note = data.notes or "Customer requested changes to the proposal"

    order.events.append(OrderStatusEvent(
        from_status=old,
        to_status=order.status,
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=note,
    ))
    from app.services.order_lifecycle import format_status_chat, post_order_chat

    await post_order_chat(
        db,
        order,
        body=format_status_chat(
            action="Customer approved proposal" if data.approved else "Customer requested changes",
            actor_name=user.full_name,
            from_status=old,
            to_status=order.status,
            notes=note,
        ),
        actor=user,
    )
    return order


async def _user_may_confirm_receipt(db: AsyncSession, user: User, order: Order) -> bool:
    if order.status in RECEIPT_TERMINAL_STATUSES:
        return False
    cust = await resolve_customer_scope(db, user)
    if cust and cust.id == order.customer_id:
        return True
    if not (user.is_staff or user.is_superuser):
        return False
    if user.is_superuser:
        return True
    from app.core.deps import _user_permissions
    perms = await _user_permissions(user, db)
    if "*" in perms or "orders:admin" in perms or "orders:update" in perms:
        return True
    slugs = await assign_svc._user_role_slugs(db, user)
    return bool(slugs & RECEIPT_STAFF_ROLE_SLUGS)


async def confirm_order_receipt(
    db: AsyncSession,
    order: Order,
    user: User,
    data: OrderReceiptConfirm,
) -> Order:
    await assert_order_access(db, user, order)
    if not await _user_may_confirm_receipt(db, user, order):
        raise ForbiddenError("You cannot confirm receipt for this order")

    from app.services.workflow_service import _apply_item_workflow

    old = order.status
    note = data.notes or (
        "Customer confirmed order received" if not user.is_staff
        else "Order marked as delivered (receipt confirmed)"
    )

    for item in order.items:
        if item.workflow_status not in ("completed", "cancelled"):
            await _apply_item_workflow(
                db, item, user,
                to_status="completed",
                notes=note,
            )

    order.status = "delivered"
    order.events.append(OrderStatusEvent(
        from_status=old,
        to_status="delivered",
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=note,
    ))
    from app.services.order_lifecycle import format_status_chat, post_order_chat

    await post_order_chat(
        db,
        order,
        body=format_status_chat(
            action="Delivery confirmed — order completed",
            actor_name=user.full_name,
            from_status=old,
            to_status="delivered",
            notes=note,
        ),
        actor=user,
    )
    return order


async def release_order_to_production(
    db: AsyncSession,
    order: Order,
    user: User,
    data: OrderRelease,
) -> Order:
    if order.status not in ("draft", "customer_approved"):
        raise ValidationError(
            "Order must be draft (staff-created) or customer-approved before release to production"
        )
    if order.placed_via == "portal" and order.status == "draft":
        raise ValidationError("Portal requests require customer approval before release")

    _require_priced_items(order.items)
    if not order.deadline:
        raise ValidationError("Set a deadline before releasing to production")

    if data.workflow_assignments:
        await assign_svc.replace_order_assignments(
            db, order, user, data.workflow_assignments, require_all_stages=True,
        )
    else:
        existing = await assign_svc.load_assignments_map(db, [order.id])
        stages = existing.get(order.id, {})
        if not assign_svc.assignments_ready_for_production(stages):
            missing = [s for s in ASSIGNMENT_STAGES if s not in stages or not stages.get(s)]
            raise ValidationError(
                "Assign responsible staff for each production stage before release: "
                + ", ".join(missing) if missing else "configure every stage"
            )

    old = order.status
    order.status = "confirmed"
    order.events.append(OrderStatusEvent(
        from_status=old,
        to_status="confirmed",
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=data.notes or "Released to production by administrator",
    ))

    assign_map = await assign_svc.load_assignments_map(db, [order.id])
    assignee_ids: list[int] = []
    for rows in assign_map.get(order.id, {}).values():
        for row in rows:
            if not row.is_skipped and row.assignee_id:
                assignee_ids.append(row.assignee_id)

    from app.services.notification_service import notify_order_released
    from app.services.order_lifecycle import format_status_chat, post_order_chat

    await notify_order_released(db, order, user, assignee_ids)
    await post_order_chat(
        db,
        order,
        body=format_status_chat(
            action="Order released — awaiting accountant payment confirmation",
            actor_name=user.full_name,
            from_status=old,
            to_status="confirmed",
            notes=data.notes,
        ),
        actor=user,
    )
    return order


def assert_order_in_production(order: Order) -> None:
    if order.status not in PRODUCTION_ORDER_STATUSES:
        raise ValidationError(
            f"Order must be paid before production workflow changes (current: {order.status})"
        )
