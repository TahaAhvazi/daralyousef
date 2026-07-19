"""Order workflow — unified pipeline stage per order, department board."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.workflow import (
    ITEM_WORKFLOW_STATUSES,
    ITEM_WORKFLOW_TRANSITIONS,
    ORDER_BOARD_COLUMNS,
    WORKFLOW_BOARD_STAGES,
    WORKFLOW_DEPARTMENT_SLUG,
    allowed_order_transitions,
    board_column_progress,
    derive_order_board_column,
    derive_order_pipeline_stage,
    is_backward_board_move,
    is_backward_workflow_move,
    next_enabled_pipeline_status,
    previous_board_column,
    previous_enabled_pipeline_status,
    resolve_enabled_stages,
    skipped_workflow_stages,
    PIPELINE_STATUSES,
)
from app.models.department import Department
from app.models.order import PRODUCTION_ORDER_STATUSES, Order, OrderItem, OrderItemStatusHistory, OrderStatusEvent, OrderWorkflowAssignment
from app.models.user import User
from app.services.order_approval_service import assert_order_in_production
from app.services.order_service import assert_order_access
from app.services import workflow_assignment_service as assign_svc


async def _department_id_for_slug(db: AsyncSession, slug: str) -> Optional[int]:
    res = await db.execute(select(Department.id).where(Department.slug == slug))
    return res.scalar_one_or_none()


async def _resolve_department_id(
    db: AsyncSession,
    to_status: str,
    department_id: Optional[int] = None,
) -> Optional[int]:
    if department_id is not None:
        return department_id
    slug = WORKFLOW_DEPARTMENT_SLUG.get(to_status)
    if slug:
        return await _department_id_for_slug(db, slug)
    return None


async def _load_order_with_items(db: AsyncSession, order_id: int) -> Order:
    res = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.deleted_at.is_(None))
        .options(selectinload(Order.items))
    )
    order = res.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found")
    return order


async def _apply_item_workflow(
    db: AsyncSession,
    item: OrderItem,
    user: User,
    *,
    to_status: str,
    notes: Optional[str] = None,
    department_id: Optional[int] = None,
) -> None:
    if item.workflow_status in ("completed", "cancelled"):
        return

    old = item.workflow_status
    if old == to_status:
        return

    dept_id = await _resolve_department_id(db, to_status, department_id)
    item.workflow_status = to_status
    item.current_department_id = dept_id

    item.status_history.append(OrderItemStatusHistory(
        department_id=dept_id,
        from_status=old,
        to_status=to_status,
        actor_id=user.id,
        notes=notes,
        occurred_at=datetime.now(timezone.utc),
    ))


async def _workflow_transition_allowed(
    db: AsyncSession,
    user: User,
    order_id: int,
    current: str,
    to_status: str,
    enabled: frozenset,
    can_override: bool,
) -> bool:
    if to_status == current:
        return False
    if to_status not in ITEM_WORKFLOW_STATUSES:
        return False

    forward = allowed_order_transitions(current, enabled)
    if to_status in forward:
        return True

    if can_override:
        if to_status in ITEM_WORKFLOW_TRANSITIONS.get(current, frozenset()):
            return True
        if to_status in enabled or to_status in {"pending", "on_hold", "cancelled", "completed"}:
            return True
        return to_status in PIPELINE_STATUSES

    prev = previous_enabled_pipeline_status(current, enabled)
    if to_status == prev:
        try:
            await assign_svc.assert_assignee_can_advance(db, user, order_id, current)
            return True
        except ForbiddenError:
            return False
    return False


def _require_revert_reason(is_backward: bool, can_override: bool, notes: Optional[str]) -> None:
    if is_backward and not can_override:
        if not notes or not str(notes).strip():
            raise ValidationError(
                "A reason is required when moving an order to a previous stage",
                code="board_revert_reason_required",
            )


async def change_order_workflow(
    db: AsyncSession,
    order_id: int,
    user: User,
    *,
    to_status: str,
    notes: Optional[str] = None,
    department_id: Optional[int] = None,
) -> Order:
    """Move every active line item on an order to the same pipeline stage."""
    if to_status not in ITEM_WORKFLOW_STATUSES:
        raise ValidationError(f"Invalid workflow status: {to_status}")

    order = await _load_order_with_items(db, order_id)
    await assert_order_access(db, user, order)
    if order.status == "confirmed":
        raise ValidationError("Order must be marked as paid before starting production")
    assert_order_in_production(order)

    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff access required to update workflow")

    current = derive_order_pipeline_stage({it.workflow_status for it in order.items})
    assignments_res = await db.execute(
        select(OrderWorkflowAssignment).where(OrderWorkflowAssignment.order_id == order_id)
    )
    by_stage = assign_svc._group_by_stage(list(assignments_res.scalars().all()))
    enabled = resolve_enabled_stages(by_stage)
    can_override = await assign_svc.user_can_override_assignments(db, user)

    backward = is_backward_workflow_move(current, to_status)
    _require_revert_reason(backward, can_override, notes)

    allowed = await _workflow_transition_allowed(
        db, user, order_id, current, to_status, enabled, can_override,
    )
    if not allowed:
        raise ValidationError(f"Cannot transition order from '{current}' to '{to_status}'")

    if not backward:
        await assign_svc.assert_assignee_can_advance(db, user, order_id, current)
    elif not can_override:
        await assign_svc.assert_assignee_can_advance(db, user, order_id, current)

    res = await db.execute(
        select(OrderItem)
        .where(OrderItem.order_id == order_id)
        .options(selectinload(OrderItem.status_history))
    )
    items = res.scalars().all()

    for item in items:
        await _apply_item_workflow(
            db, item, user,
            to_status=to_status,
            notes=notes,
            department_id=department_id,
        )

    await _sync_order_status_from_items(db, order)

    from app.services.order_lifecycle import format_status_chat, post_order_chat

    await post_order_chat(
        db,
        order,
        body=format_status_chat(
            action="Production stage updated",
            actor_name=user.full_name,
            from_status=current,
            to_status=to_status,
            notes=notes,
        ),
        actor=user,
    )
    return order


async def change_item_workflow(
    db: AsyncSession,
    item_id: int,
    user: User,
    *,
    to_status: str,
    notes: Optional[str] = None,
    department_id: Optional[int] = None,
) -> OrderItem:
    """Backward-compatible entry — applies the transition to the whole order."""
    if to_status not in ITEM_WORKFLOW_STATUSES:
        raise ValidationError(f"Invalid workflow status: {to_status}")

    res = await db.execute(
        select(OrderItem)
        .where(OrderItem.id == item_id)
        .options(selectinload(OrderItem.order))
    )
    item = res.scalar_one_or_none()
    if not item:
        raise NotFoundError("Order item not found")

    await change_order_workflow(
        db, item.order_id, user,
        to_status=to_status,
        notes=notes,
        department_id=department_id,
    )

    res = await db.execute(
        select(OrderItem)
        .where(OrderItem.id == item_id)
        .options(
            selectinload(OrderItem.status_history),
            selectinload(OrderItem.current_department),
        )
    )
    return res.scalar_one()


async def _sync_order_status_from_items(db: AsyncSession, order: Order) -> None:
    """Derive order-level status from item workflow when appropriate."""
    if order.status in ("closed", "cancelled"):
        return

    res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = res.scalars().all()
    if not items:
        return

    statuses = {it.workflow_status for it in items}
    if statuses == {"completed"}:
        if order.status not in ("delivered", "closed", "cancelled"):
            order.status = "in_production"
    elif statuses <= {"completed", "delivery"}:
        order.status = "in_production"
    elif any(s not in ("pending", "cancelled", "on_hold") for s in statuses):
        order.status = "in_production"
    elif order.status == "draft" and any(s != "pending" for s in statuses):
        order.status = "confirmed"


_TERMINAL_BOARD_COLUMNS = frozenset({"completed", "cancelled"})


async def get_workflow_board(
    db: AsyncSession,
    user: User,
    *,
    department_id: Optional[int] = None,
    department_slug: Optional[str] = None,
    include_done: bool = False,
) -> Dict[str, object]:
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff access required")

    stmt = (
        select(Order)
        .where(Order.deleted_at.is_(None))
        .options(selectinload(Order.items))
        .order_by(Order.updated_at.desc())
    )
    orders = (await db.execute(stmt)).scalars().unique().all()

    order_ids = [o.id for o in orders]
    assignments_map = await assign_svc.load_assignments_map(db, order_ids)
    can_override = await assign_svc.user_can_override_assignments(db, user)

    board: Dict[str, List[tuple[Order, dict]]] = {col: [] for col in ORDER_BOARD_COLUMNS}
    terminal_counts: Dict[str, int] = {col: 0 for col in _TERMINAL_BOARD_COLUMNS}

    dept_slug_filter = department_slug
    dept_id_filter = department_id

    for order in orders:
        item_statuses = [it.workflow_status for it in order.items]
        col = derive_order_board_column(
            order.status,
            item_statuses,
            stock_check_status=getattr(order, "stock_check_status", None),
        )
        if col not in board:
            continue

        if col in _TERMINAL_BOARD_COLUMNS and not include_done:
            # Count for stats, skip card payload + assignment work
            if dept_slug_filter or dept_id_filter:
                stage = derive_order_pipeline_stage(
                    {s for s in item_statuses if s not in ("completed", "cancelled")}
                ) if item_statuses else "pending"
                slugs = {WORKFLOW_DEPARTMENT_SLUG.get(stage)}
                if dept_slug_filter and dept_slug_filter not in slugs:
                    continue
                if dept_id_filter:
                    expected = await _department_id_for_slug(db, WORKFLOW_DEPARTMENT_SLUG.get(stage, ""))
                    if expected != dept_id_filter:
                        continue
            terminal_counts[col] = terminal_counts.get(col, 0) + 1
            continue

        if dept_slug_filter or dept_id_filter:
            stage = derive_order_pipeline_stage(
                {s for s in item_statuses if s not in ("completed", "cancelled")}
            ) if item_statuses else "pending"
            slugs = {WORKFLOW_DEPARTMENT_SLUG.get(stage)}
            if dept_slug_filter and dept_slug_filter not in slugs:
                continue
            if dept_id_filter:
                expected = await _department_id_for_slug(db, WORKFLOW_DEPARTMENT_SLUG.get(stage, ""))
                if expected != dept_id_filter:
                    continue

        order_assignments = assignments_map.get(order.id, {})
        enabled = resolve_enabled_stages(order_assignments)
        skipped = skipped_workflow_stages(order_assignments)
        with_assignees = assign_svc.stages_with_assignees(order_assignments)

        meta: dict = {
            "board_column": col,
            "progress_pct": board_column_progress(col),
            "placed_via": order.placed_via,
            "can_advance": False,
            "read_only_reason": None,
            "stage_assignee_id": None,
            "stage_assignee_name": None,
            "stage_assignee_ids": [],
            "stage_assignee_names": [],
            "assignments_ready": assign_svc.assignments_ready_for_production(order_assignments),
            "enabled_stages": sorted(enabled),
            "skipped_stages": list(skipped),
            "stages_with_assignees": with_assignees,
            "next_status": None,
            "prev_status": None,
            "prev_column": previous_board_column(col),
            "can_revert": False,
            "revert_requires_reason": False,
            "stock_check_status": getattr(order, "stock_check_status", None),
        }

        prev_col = meta["prev_column"]
        if prev_col and can_override:
            meta["can_revert"] = True
            meta["revert_requires_reason"] = False

        if col in WORKFLOW_BOARD_STAGES and order.status in PRODUCTION_ORDER_STATUSES:
            active_items = [
                it for it in order.items
                if it.workflow_status not in ("completed", "cancelled")
            ]
            stage = derive_order_pipeline_stage(
                {it.workflow_status for it in active_items}
            ) if active_items else "pending"
            stage_rows = order_assignments.get(stage, [])
            access = assign_svc.compute_board_access(
                user,
                current_stage=stage,
                assignments=stage_rows,
                can_override=can_override,
                enabled_stages=enabled,
            )
            meta.update({
                "can_advance": access[0],
                "read_only_reason": access[1],
                "stage_assignee_id": access[2][0] if access[2] else None,
                "stage_assignee_name": access[3][0] if access[3] else None,
                "stage_assignee_ids": access[2],
                "stage_assignee_names": access[3],
                "next_status": next_enabled_pipeline_status(stage, enabled),
                "prev_status": previous_enabled_pipeline_status(stage, enabled),
            })
            if access[0] and meta["prev_status"]:
                meta["can_revert"] = True
                meta["revert_requires_reason"] = not can_override
        elif col == "confirmed" and prev_col and can_override:
            meta["can_revert"] = True

        board[col].append((order, meta))

    # Recent order activity
    events_res = await db.execute(
        select(OrderStatusEvent)
        .join(Order, OrderStatusEvent.order_id == Order.id)
        .where(Order.deleted_at.is_(None))
        .order_by(OrderStatusEvent.occurred_at.desc())
        .limit(12)
        .options(selectinload(OrderStatusEvent.order))
    )
    recent_events = events_res.scalars().all()
    actor_ids = {e.actor_id for e in recent_events if e.actor_id}
    actor_names: dict[int, str] = {}
    if actor_ids:
        users_res = await db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids)))
        actor_names = {row.id: row.full_name for row in users_res.all()}

    activity = []
    for ev in recent_events:
        code = ev.order.code if ev.order else f"#{ev.order_id}"
        frm = ev.from_status or "—"
        activity.append({
            "id": ev.id,
            "order_code": code,
            "summary": f"{code}: {frm} → {ev.to_status}",
            "actor_name": actor_names.get(ev.actor_id) if ev.actor_id else None,
            "occurred_at": ev.occurred_at,
        })

    by_column = {k: len(v) for k, v in board.items()}
    for col, n in terminal_counts.items():
        by_column[col] = by_column.get(col, 0) + n
    total = sum(by_column.values())
    stats = {
        "total": total,
        "by_column": by_column,
    }

    return {"columns": board, "stats": stats, "recent_activity": activity}


async def move_order_to_board_column(
    db: AsyncSession,
    order_id: int,
    user: User,
    *,
    to_column: str,
    notes: Optional[str] = None,
) -> Order:
    if to_column not in ORDER_BOARD_COLUMNS:
        raise ValidationError(f"Invalid board column: {to_column}")

    order = await _load_order_with_items(db, order_id)
    await assert_order_access(db, user, order)

    item_statuses = [it.workflow_status for it in order.items]
    current = derive_order_board_column(
        order.status,
        item_statuses,
        stock_check_status=getattr(order, "stock_check_status", None),
    )
    if current == to_column:
        return order

    can_override = await assign_svc.user_can_override_assignments(db, user)
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff access required")

    backward = is_backward_board_move(current, to_column)
    _require_revert_reason(backward, can_override, notes)

    assignments_map = await assign_svc.load_assignments_map(db, [order_id])
    by_stage = assignments_map.get(order_id, {})

    if not backward and to_column in WORKFLOW_BOARD_STAGES:
        assign_svc.assert_board_move_to_production_allowed(
            order, current, to_column, by_stage,
        )

    if backward and not can_override:
        cur_idx = ORDER_BOARD_COLUMNS.index(current)
        to_idx = ORDER_BOARD_COLUMNS.index(to_column)
        if to_idx != cur_idx - 1:
            raise ValidationError(
                "You can only move one stage back — contact your manager",
                code="board_one_stage_back",
            )
        if current in WORKFLOW_BOARD_STAGES:
            stage = derive_order_pipeline_stage(
                {s for s in item_statuses if s not in ("completed", "cancelled")}
            )
            await assign_svc.assert_assignee_can_advance(db, user, order_id, stage)
        else:
            raise ValidationError("Only managers can move orders back to earlier lifecycle stages")

    from app.schemas.order import OrderStatusChange
    from app.services.order_lifecycle import format_status_chat, order_stock_approved, post_order_chat
    from app.services.order_service import _change_order_status_with_paid, change_order_status, user_can_change_paid_status

    async def _chat_move(result: Order, label: str) -> Order:
        await post_order_chat(
            db,
            result,
            body=format_status_chat(
                action=label,
                actor_name=user.full_name,
                from_status=current,
                to_status=to_column,
                notes=notes,
            ),
            actor=user,
        )
        return result

    if to_column == "warehouse":
        # Explicit move into warehouse queue (usually automatic after paid)
        if order.status not in ("paid", "confirmed") and not can_override:
            raise ValidationError("Order must be paid before warehouse review")
        if order.status == "confirmed" and can_override:
            await _change_order_status_with_paid(
                db, order, user,
                OrderStatusChange(to_status="paid", notes=notes or "Moved to warehouse by manager"),
            )
            order = await _load_order_with_items(db, order_id)
        if order.status == "paid" and order.stock_check_status != "approved":
            order.stock_check_status = "pending"
        return await _chat_move(order, "Moved to warehouse stock check")

    if to_column == "paid":
        if not await user_can_change_paid_status(db, user):
            # Allow warehouse to send back to "paid ready" only if already approved — else accountant
            if not (order_stock_approved(order) and can_override):
                raise ForbiddenError("Only accountant or general manager can change paid status")
        if current in WORKFLOW_BOARD_STAGES and backward:
            if not can_override:
                raise ValidationError("Only managers can move production orders back to paid")
            await change_order_workflow(db, order_id, user, to_status="pending", notes=notes)
            order = await _load_order_with_items(db, order_id)
        if current == "warehouse" and order_stock_approved(order):
            # Stay paid; column derived as paid when stock approved
            return await _chat_move(order, "Stock ready — in paid queue for production")
        result = await _change_order_status_with_paid(
            db, order, user,
            OrderStatusChange(to_status="paid", notes=notes),
        )
        if result.stock_check_status != "approved":
            result.stock_check_status = "pending"
        return await _chat_move(result, "Payment / paid column updated")

    if to_column == "cancelled":
        result = await change_order_status(
            db, order, user,
            OrderStatusChange(to_status="cancelled", notes=notes),
        )
        return await _chat_move(result, "Order cancelled")

    if to_column == "completed":
        if order.status in PRODUCTION_ORDER_STATUSES:
            try:
                await change_order_workflow(db, order_id, user, to_status="completed", notes=notes)
            except ValidationError:
                if not can_override:
                    raise
            order = await _load_order_with_items(db, order_id)
        result = await change_order_status(
            db, order, user,
            OrderStatusChange(to_status="delivered", notes=notes),
        )
        return await _chat_move(result, "Order marked completed / delivered")

    if to_column in WORKFLOW_BOARD_STAGES:
        if current == "confirmed" and not can_override:
            raise ValidationError(
                "Order must be marked as paid before production",
                code="order_payment_required",
            )
        if current == "warehouse" and not order_stock_approved(order) and not can_override:
            raise ValidationError(
                "Warehouse must approve stock before production starts",
                code="stock_check_required",
            )
        if (
            current == "paid"
            and not order_stock_approved(order)
            and not can_override
        ):
            raise ValidationError(
                "Warehouse must approve stock before production starts",
                code="stock_check_required",
            )
        if order.status == "paid":
            order.status = "in_production"
            await db.flush()
        elif order.status not in PRODUCTION_ORDER_STATUSES:
            if can_override and order.status in ("confirmed", "paid"):
                order.status = "in_production"
                await db.flush()
            else:
                raise ValidationError("Order must be paid before entering production")
        # GM override into production also marks stock approved if still pending
        if can_override and not order_stock_approved(order):
            from datetime import datetime, timezone

            order.stock_check_status = "approved"
            order.stock_checked_at = order.stock_checked_at or datetime.now(timezone.utc)
            order.stock_checked_by_id = order.stock_checked_by_id or user.id
            order.stock_check_notes = order.stock_check_notes or (
                notes or "Stock check skipped by manager override"
            )
        result = await change_order_workflow(db, order_id, user, to_status=to_column, notes=notes)
        return result  # change_order_workflow already chats

    status_map = {
        "intake": "pending_review",
        "approval": "awaiting_customer",
        "confirmed": "confirmed",
    }
    if to_column in status_map:
        if not can_override and current in WORKFLOW_BOARD_STAGES and not backward:
            raise ValidationError("Cannot move production order back without admin rights")
        await change_order_status(
            db, order, user,
            OrderStatusChange(to_status=status_map[to_column], notes=notes),
        )
        if to_column == "confirmed":
            for item in order.items:
                if item.workflow_status not in ("completed", "cancelled"):
                    item.workflow_status = "pending"
            order.stock_check_status = None
        return await _chat_move(order, f"Lifecycle moved to {to_column}")

    raise ValidationError(f"Unsupported board column: {to_column}")
