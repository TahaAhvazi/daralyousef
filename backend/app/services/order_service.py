"""Order business logic — create, update, status changes."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.workflow import ITEM_WORKFLOW_STATUSES, WORKFLOW_DEPARTMENT_SLUG, derive_order_board_column
from app.models.catalog import Product
from app.models.customer import Customer
from app.models.department import Department
from app.models.attachment import Attachment
from app.models.order import (
    ORDER_STATUSES,
    PAID_STATUS_ROLE_SLUGS,
    Order,
    OrderItem,
    OrderItemStatusHistory,
    OrderStatusEvent,
    OrderWorkflowAssignment,
)
from app.models.user import User
from app.schemas.order import (
    OrderCreate, OrderItemCreate, OrderOut, OrderPaymentToggle, OrderStatusChange, OrderStatusEventOut, OrderSummaryOut, OrderUpdate,
    WorkflowAssignmentOut,
)
from app.services import workflow_assignment_service as assign_svc
from app.services.inventory_service import validate_stock_for_items
from app.utils.codes import order_code
from app.utils.line_totals import aggregate_order_totals
from app.utils.product_departments import first_product_department_id


async def resolve_customer_scope(db: AsyncSession, user: User) -> Optional[Customer]:
    if user.is_staff or user.is_superuser:
        return None
    res = await db.execute(select(Customer).where(Customer.user_id == user.id))
    return res.scalar_one_or_none()


async def apply_customer_filter(stmt, user: User, db: AsyncSession):
    if user.is_staff or user.is_superuser:
        return stmt
    cust = await resolve_customer_scope(db, user)
    if not cust:
        return stmt.where(Order.id == -1)
    return stmt.where(Order.customer_id == cust.id)


async def assert_order_access(db: AsyncSession, user: User, order: Order) -> None:
    if user.is_staff or user.is_superuser:
        return
    cust = await resolve_customer_scope(db, user)
    if not cust or cust.id != order.customer_id:
        raise ForbiddenError("Not your order")


async def _department_id_for_slug(db: AsyncSession, slug: str) -> Optional[int]:
    res = await db.execute(select(Department.id).where(Department.slug == slug))
    return res.scalar_one_or_none()


async def _init_item_workflow(db: AsyncSession, item: OrderItem, product_id: Optional[int] = None) -> None:
    item.workflow_status = "pending"
    slug = WORKFLOW_DEPARTMENT_SLUG["pending"]
    if product_id:
        dept_id = await first_product_department_id(db, product_id)
        if dept_id:
            item.current_department_id = dept_id
            res = await db.execute(select(Department.slug).where(Department.id == dept_id))
            found = res.scalar_one_or_none()
            if found:
                slug = found
        else:
            item.current_department_id = await _department_id_for_slug(db, slug)
    else:
        item.current_department_id = await _department_id_for_slug(db, slug)
    item.status_history.append(OrderItemStatusHistory(
        department_id=item.current_department_id,
        from_status=None,
        to_status="pending",
        occurred_at=datetime.now(timezone.utc),
        notes="Item created",
    ))


async def _populate_item_from_product(
    db: AsyncSession, item: OrderItem, *, allow_pricing: bool = True
) -> None:
    if not item.product_id:
        return
    prod = await db.get(Product, item.product_id)
    if not prod:
        return
    if allow_pricing and not item.unit_price:
        item.unit_price = prod.base_price
    if allow_pricing and not item.tax_rate:
        item.tax_rate = prod.tax_rate
    if not item.name:
        item.name = prod.name
    if not item.unit:
        item.unit = prod.unit
    await _init_item_workflow(db, item, item.product_id)


async def create_order(
    db: AsyncSession, user: User, data: OrderCreate, *, placed_via: str = "staff"
) -> Order:
    initial_status = "pending_review" if placed_via == "portal" else "draft"
    allow_pricing = placed_via != "portal"

    dump = data.model_dump(exclude={"items", "workflow_assignments"})
    if placed_via == "portal":
        dump["deadline"] = None
        dump["priority"] = "normal"

    order = Order(
        code=order_code(),
        placed_via=placed_via,
        status=initial_status,
        **dump,
    )
    await validate_stock_for_items(db, data.items)

    for raw in data.items:
        item_data = raw.model_dump()
        if not allow_pricing:
            item_data["unit_price"] = 0.0
            item_data["tax_rate"] = 0.0
        item = OrderItem(**item_data)
        await _populate_item_from_product(db, item, allow_pricing=allow_pricing)
        if not item.status_history:
            await _init_item_workflow(db, item, item.product_id)
        order.items.append(item)
    aggregate_order_totals(order)
    note = "Customer order request submitted" if placed_via == "portal" else "Order created"
    order.events.append(OrderStatusEvent(
        to_status=initial_status,
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=note,
    ))
    db.add(order)
    await db.flush()

    # Stock is validated above; materials are deducted at warehouse approval (not at create)
    order.materials_deducted = False
    order.stock_check_status = None

    if placed_via == "staff" and data.workflow_assignments:
        await assign_svc.replace_order_assignments(
            db, order, user, data.workflow_assignments, require_all_stages=False,
        )
    else:
        from app.services import chat_service as chat_svc

        await chat_svc.ensure_order_conversation(
            db, order, created_by_id=user.id, extra_member_ids={user.id},
        )

    from app.services.order_lifecycle import format_status_chat, post_order_chat

    await post_order_chat(
        db,
        order,
        body=format_status_chat(
            action="Order created" if placed_via != "portal" else "Customer order request submitted",
            actor_name=user.full_name,
            to_status=initial_status,
            notes=order.title,
        ),
        actor=user,
    )

    return order


async def update_order(db: AsyncSession, order: Order, data: OrderUpdate) -> Order:
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(order, k, v)
    aggregate_order_totals(order)
    return order


async def user_can_change_paid_status(db: AsyncSession, user: User) -> bool:
    if user.is_superuser:
        return True
    slugs = await assign_svc._user_role_slugs(db, user)
    return bool(slugs & PAID_STATUS_ROLE_SLUGS)


async def change_order_status(
    db: AsyncSession, order: Order, user: User, data: OrderStatusChange
) -> Order:
    if data.to_status not in ORDER_STATUSES:
        raise ValidationError(f"Invalid status: {data.to_status}")
    old = order.status
    involves_paid = data.to_status == "paid" or old == "paid"
    if involves_paid:
        raise ValidationError("Use payment confirmation to mark or clear payment received")
    order.status = data.to_status
    db.add(OrderStatusEvent(
        order_id=order.id,
        from_status=old,
        to_status=data.to_status,
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=data.notes,
    ))
    return order


async def _change_order_status_with_paid(
    db: AsyncSession, order: Order, user: User, data: OrderStatusChange
) -> Order:
    if data.to_status not in ORDER_STATUSES:
        raise ValidationError(f"Invalid status: {data.to_status}")
    old = order.status
    involves_paid = data.to_status == "paid" or old == "paid"
    if involves_paid and not await user_can_change_paid_status(db, user):
        raise ForbiddenError("Only accountant or general manager can change paid status")
    if data.to_status == "paid" and old not in ("confirmed", "paid"):
        raise ValidationError("Order must be confirmed before marking as paid")
    if old == "paid" and data.to_status not in ("confirmed", "paid", "in_production"):
        raise ValidationError("Paid orders can only move to confirmed or in production")
    order.status = data.to_status
    db.add(OrderStatusEvent(
        order_id=order.id,
        from_status=old,
        to_status=data.to_status,
        occurred_at=datetime.now(timezone.utc),
        actor_id=user.id,
        notes=data.notes,
    ))
    return order


async def _order_payment_proof_count(db: AsyncSession, order_id: int) -> int:
    res = await db.execute(
        select(func.count())
        .select_from(Attachment)
        .where(
            Attachment.entity_type == "order",
            Attachment.entity_id == order_id,
            Attachment.kind == "payment_proof",
        )
    )
    return int(res.scalar() or 0)


async def toggle_order_payment(
    db: AsyncSession, order: Order, user: User, data: OrderPaymentToggle
) -> Order:
    if not await user_can_change_paid_status(db, user):
        raise ForbiddenError("Only accountant or general manager can change paid status")
    from app.services.order_lifecycle import format_status_chat, post_order_chat

    if data.paid:
        if order.status not in ("confirmed", "paid"):
            raise ValidationError("Order must be confirmed before marking payment received")
        has_notes = bool(data.notes and data.notes.strip())
        proof_count = await _order_payment_proof_count(db, order.id)
        if not has_notes and proof_count == 0:
            raise ValidationError(
                "Payment proof required — add a note or upload a receipt / screenshot"
            )
        if order.status == "paid":
            return order
        result = await _change_order_status_with_paid(
            db, order, user,
            OrderStatusChange(to_status="paid", notes=data.notes),
        )
        # Queue warehouse review
        if result.stock_check_status != "approved":
            result.stock_check_status = "pending"
        await post_order_chat(
            db,
            result,
            body=format_status_chat(
                action="Payment confirmed — waiting for warehouse stock check",
                actor_name=user.full_name,
                from_status="confirmed",
                to_status="paid",
                notes=data.notes,
            ),
            actor=user,
        )
        return result
    if order.status != "paid":
        raise ValidationError("Order is not marked as paid")
    if not data.notes or not data.notes.strip():
        raise ValidationError("Reason required to clear payment confirmation")
    result = await _change_order_status_with_paid(
        db, order, user,
        OrderStatusChange(to_status="confirmed", notes=data.notes),
    )
    result.stock_check_status = None
    await post_order_chat(
        db,
        result,
        body=format_status_chat(
            action="Payment confirmation cleared",
            actor_name=user.full_name,
            from_status="paid",
            to_status="confirmed",
            notes=data.notes,
        ),
        actor=user,
    )
    return result


async def get_order_by_id(db: AsyncSession, oid: int) -> Order:
    res = await db.execute(
        select(Order)
        .where(Order.id == oid, Order.deleted_at.is_(None))
        .options(
            selectinload(Order.items).selectinload(OrderItem.status_history),
            selectinload(Order.items).selectinload(OrderItem.current_department),
            selectinload(Order.events),
            selectinload(Order.workflow_assignments).selectinload(OrderWorkflowAssignment.assignee),
        )
    )
    order = res.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found")
    return order


async def list_orders(
    db: AsyncSession,
    user: User,
    *,
    page: int = 1,
    page_size: int = 25,
    q: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
):
    stmt = select(Order).where(Order.deleted_at.is_(None))
    if q:
        stmt = stmt.where(or_(Order.code.ilike(f"%{q}%"), Order.title.ilike(f"%{q}%")))
    if status:
        stmt = stmt.where(Order.status == status)
    if customer_id:
        stmt = stmt.where(Order.customer_id == customer_id)
    stmt = await apply_customer_filter(stmt, user, db)

    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (
        await db.execute(
            stmt.options(
                selectinload(Order.items).selectinload(OrderItem.current_department),
                selectinload(Order.events),
            )
            .order_by(Order.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    return rows, total or 0


async def serialize_order(db: AsyncSession, order: Order) -> OrderOut:
    actor_ids = {e.actor_id for e in order.events if e.actor_id}
    meta: dict[int, tuple[str, str]] = {}
    if actor_ids:
        res = await db.execute(
            select(User.id, User.full_name, User.is_staff, User.is_superuser).where(User.id.in_(actor_ids))
        )
        for row in res.all():
            kind = "staff" if (row.is_staff or row.is_superuser) else "customer"
            meta[row.id] = (row.full_name, kind)

    data = OrderOut.model_validate(order)
    data.board_column = derive_order_board_column(
        order.status,
        [it.workflow_status for it in order.items],
        stock_check_status=getattr(order, "stock_check_status", None),
    )
    data.stock_check_status = getattr(order, "stock_check_status", None)
    data.stock_checked_at = getattr(order, "stock_checked_at", None)
    data.stock_checked_by_id = getattr(order, "stock_checked_by_id", None)
    data.stock_check_notes = getattr(order, "stock_check_notes", None)
    data.materials_deducted = bool(getattr(order, "materials_deducted", False))
    data.stock_approved = (
        getattr(order, "stock_check_status", None) == "approved"
        or order.status in ("in_production", "delivered", "closed")
    )
    data.workflow_assignments = [
        WorkflowAssignmentOut(**row) for row in await assign_svc.serialize_assignments(db, order)
    ]
    data.events = [
        OrderStatusEventOut.model_validate(e).model_copy(
            update={
                "actor_name": meta[e.actor_id][0] if e.actor_id in meta else None,
                "actor_kind": meta[e.actor_id][1] if e.actor_id in meta else None,
            },
        )
        for e in order.events
    ]
    return data


def serialize_order_summary(order: Order) -> OrderSummaryOut:
    data = OrderSummaryOut.model_validate(order)
    data.board_column = derive_order_board_column(
        order.status,
        [it.workflow_status for it in order.items],
        stock_check_status=getattr(order, "stock_check_status", None),
    )
    data.stock_check_status = getattr(order, "stock_check_status", None)
    return data

