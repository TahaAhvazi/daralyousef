"""Orders + item workflow."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import current_user, require_any_permission, require_permissions
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.db.base import get_db
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.core.workflow import ASSIGNMENT_STAGES, WORKFLOW_BOARD_STAGES, derive_order_pipeline_stage
from app.schemas.order import (
    CustomerOrderResponse, OrderBoardMove, OrderCreate, OrderItemOut, OrderItemWorkflowChange, OrderOut,
    OrderProposal, OrderReceiptConfirm, OrderPaymentToggle, OrderRelease, OrderStockCheck, OrderSummaryOut, OrderStatusChange, OrderUpdate,
    OrderWorkflowChange, WorkflowBoardActivityOut, WorkflowBoardOrderOut, WorkflowBoardOut,
    WorkflowBoardStatsOut,
    WorkflowAssignmentCreate, WorkflowStaffOut,
)
from app.services import workflow_assignment_service as assign_svc
from app.services import order_service as orders_svc
from app.services import order_approval_service as approval_svc
from app.services import workflow_service as workflow_svc
from app.services.audit import record as audit


async def _assert_staff_order_admin(db: AsyncSession, user: User) -> None:
    """Full order detail / admin actions — CEO / platform admin only (via orders:admin or *)."""
    if user.is_superuser:
        return
    from app.core.deps import _user_permissions
    perms = await _user_permissions(user, db)
    if "*" in perms or "orders:admin" in perms:
        return
    raise ForbiddenError("Administrator access required for order details")


async def _assert_staff_can_view_order(db: AsyncSession, user: User, order) -> None:
    """View order detail: admin, readers, assignees, CEO, accountant."""
    from app.services.order_collaboration import assert_can_access_order_collaboration

    await assert_can_access_order_collaboration(db, user, order)


async def _assert_order_list_access(db: AsyncSession, user: User) -> None:
    """Staff need orders:read/admin; portal customers may list their own orders."""
    if user.is_staff or user.is_superuser:
        if user.is_superuser:
            return
        from app.core.deps import _user_permissions
        perms = await _user_permissions(user, db)
        if "*" in perms or "orders:read" in perms or "orders:admin" in perms:
            return
        raise ForbiddenError("Missing one of: orders:read, orders:admin")
    cust = await orders_svc.resolve_customer_scope(db, user)
    if not cust:
        raise ForbiddenError("Customer profile missing")


router = APIRouter()


def _board_order(order, meta: dict) -> WorkflowBoardOrderOut:
    active = [it for it in order.items if it.workflow_status not in ("completed", "cancelled")]
    stage = derive_order_pipeline_stage({it.workflow_status for it in active}) if active else "pending"
    board_col = meta.get("board_column", "intake")
    names = [it.name for it in order.items[:2]]
    summary = names[0] if len(order.items) == 1 else f"{names[0]} +{len(order.items) - 1} more"
    wf = stage if stage in WORKFLOW_BOARD_STAGES else board_col
    return WorkflowBoardOrderOut(
        order_id=order.id,
        order_code=order.code,
        order_title=order.title,
        order_priority=order.priority,
        order_deadline=order.deadline,
        order_status=order.status,
        board_column=board_col,
        progress_pct=meta.get("progress_pct", 0),
        placed_via=meta.get("placed_via"),
        workflow_status=wf,
        item_count=len(order.items),
        items_summary=summary,
        updated_at=order.updated_at,
        daftra_id=getattr(order, "daftra_id", None),
        daftra_number=getattr(order, "daftra_number", None),
        stage_assignee_id=meta.get("stage_assignee_id"),
        stage_assignee_name=meta.get("stage_assignee_name"),
        stage_assignee_ids=meta.get("stage_assignee_ids", []),
        stage_assignee_names=meta.get("stage_assignee_names", []),
        assignments_ready=meta.get("assignments_ready", False),
        stages_with_assignees=meta.get("stages_with_assignees", []),
        can_advance=meta.get("can_advance", False),
        read_only_reason=meta.get("read_only_reason"),
        enabled_stages=meta.get("enabled_stages", []),
        skipped_stages=meta.get("skipped_stages", []),
        next_status=meta.get("next_status"),
        prev_status=meta.get("prev_status"),
        prev_column=meta.get("prev_column"),
        can_revert=meta.get("can_revert", False),
        revert_requires_reason=meta.get("revert_requires_reason", False),
        stock_check_status=meta.get("stock_check_status"),
    )


@router.get("/workflow/board", response_model=WorkflowBoardOut)
async def workflow_board(
    department_id: Optional[int] = None,
    department_slug: Optional[str] = None,
    include_done: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_any_permission("production:read", "production:update", "orders:admin", "orders:read")),
):
    result = await workflow_svc.get_workflow_board(
        db,
        user,
        department_id=department_id,
        department_slug=department_slug,
        include_done=include_done,
    )
    return WorkflowBoardOut(
        columns={
            k: [_board_order(o, m) for o, m in v]
            for k, v in result["columns"].items()
        },
        stats=WorkflowBoardStatsOut(**result["stats"]),
        recent_activity=[WorkflowBoardActivityOut(**a) for a in result["recent_activity"]],
    )


@router.post("/{oid}/board-move", response_model=OrderOut)
async def board_move_order(
    oid: int,
    data: OrderBoardMove,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_any_permission("production:update", "orders:admin", "orders:update")),
):
    order = await workflow_svc.move_order_to_board_column(
        db, oid, user, to_column=data.to_column, notes=data.notes,
    )
    await audit(
        db, action="board_move", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"board_column": data.to_column}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.get("/workflow/staff", response_model=List[WorkflowStaffOut])
async def workflow_staff(
    workflow_status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_any_permission("orders:admin", "orders:create", "orders:update", "production:update")),
):
    if workflow_status not in ASSIGNMENT_STAGES:
        raise ValidationError(f"Invalid workflow stage: {workflow_status}")
    staff = await assign_svc.list_staff_for_stage(db, workflow_status)
    return [
        WorkflowStaffOut(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            department_id=u.department_id,
        )
        for u in staff
    ]


@router.put("/{oid}/workflow-assignments", response_model=OrderOut)
async def set_workflow_assignments(
    oid: int,
    data: List[WorkflowAssignmentCreate],
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_any_permission("orders:admin", "orders:update")),
):
    order = await orders_svc.get_order_by_id(db, oid)
    if order.status in ("closed", "cancelled"):
        raise ValidationError("Cannot change assignments on a closed or cancelled order")
    await assign_svc.replace_order_assignments(db, order, user, data, require_all_stages=False)
    await audit(
        db, action="assign_workflow", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"stages": [a.workflow_status for a in data]},
        request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.get("", response_model=PaginatedResponse[OrderSummaryOut])
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    await _assert_order_list_access(db, user)
    rows, total = await orders_svc.list_orders(
        db, user, page=page, page_size=page_size, q=q, status=status, customer_id=customer_id
    )
    return PaginatedResponse[OrderSummaryOut](
        items=[orders_svc.serialize_order_summary(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{oid}", response_model=OrderOut)
async def get_order(
    oid: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    order = await orders_svc.get_order_by_id(db, oid)
    if user.is_staff or user.is_superuser:
        await _assert_staff_can_view_order(db, user, order)
    await orders_svc.assert_order_access(db, user, order)
    return await orders_svc.serialize_order(db, order)


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    data: OrderCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    if not (user.is_staff or user.is_superuser):
        cust = await orders_svc.resolve_customer_scope(db, user)
        if not cust:
            raise ForbiddenError("Customer profile missing")
        data.customer_id = cust.id
        placed_via = "portal"
    else:
        placed_via = "staff"

    order = await orders_svc.create_order(db, user, data, placed_via=placed_via)
    await audit(
        db, action="create", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"code": order.code, "total": order.grand_total},
        request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, order.id)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/propose", response_model=OrderOut)
async def propose_order(
    oid: int,
    data: OrderProposal,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_any_permission("orders:admin", "orders:update")),
):
    order = await orders_svc.get_order_by_id(db, oid)
    await approval_svc.propose_order_to_customer(db, order, user, data)
    await audit(
        db, action="propose", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"status": order.status, "total": order.grand_total},
        request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/customer-response", response_model=OrderOut)
async def customer_order_response(
    oid: int,
    data: CustomerOrderResponse,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    order = await orders_svc.get_order_by_id(db, oid)
    await approval_svc.customer_respond_to_proposal(db, order, user, data)
    await audit(
        db, action="customer_response", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"approved": data.approved, "status": order.status},
        request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/confirm-receipt", response_model=OrderOut)
async def confirm_order_receipt(
    oid: int,
    data: OrderReceiptConfirm,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    order = await orders_svc.get_order_by_id(db, oid)
    await approval_svc.confirm_order_receipt(db, order, user, data)
    await audit(
        db, action="confirm_receipt", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"status": "delivered"}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/release", response_model=OrderOut)
async def release_order(
    oid: int,
    data: OrderRelease,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("orders:admin")),
):
    order = await orders_svc.get_order_by_id(db, oid)
    await approval_svc.release_order_to_production(db, order, user, data)
    await audit(
        db, action="release", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"status": "confirmed"}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/payment", response_model=OrderOut)
async def toggle_order_payment(
    oid: int,
    data: OrderPaymentToggle,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    order = await orders_svc.get_order_by_id(db, oid)
    await orders_svc.toggle_order_payment(db, order, user, data)
    await audit(
        db, action="payment_toggle", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"paid": data.paid}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/stock-check", response_model=OrderOut)
async def stock_check_order(
    oid: int,
    data: OrderStockCheck,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_any_permission(
        "inventory:update", "orders:admin", "production:update",
    )),
):
    """Warehouse (or manager) approves/rejects material availability before production."""
    from app.services.order_lifecycle import submit_stock_check

    order = await orders_svc.get_order_by_id(db, oid)
    await _assert_staff_can_view_order(db, user, order)
    await submit_stock_check(db, order, user, approved=data.approved, notes=data.notes)
    await audit(
        db, action="stock_check", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"approved": data.approved, "notes": data.notes}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.patch("/{oid}", response_model=OrderOut)
async def update_order(
    oid: int,
    data: OrderUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("orders:update")),
):
    order = await orders_svc.get_order_by_id(db, oid)
    payload = data.model_dump(exclude_unset=True)
    await orders_svc.update_order(db, order, data)
    await audit(
        db, action="update", module="orders", user=user, entity_type="order",
        entity_id=order.id, new=payload, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/status", response_model=OrderOut)
async def change_status(
    oid: int,
    data: OrderStatusChange,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    order = await orders_svc.get_order_by_id(db, oid)
    old = order.status
    if data.to_status == "paid" or old == "paid":
        raise ValidationError("Use payment confirmation to mark or clear payment received")
    from app.core.deps import _user_permissions
    perms = await _user_permissions(user, db)
    if not (user.is_superuser or "*" in perms or "orders:admin" in perms):
        raise ForbiddenError("Admin permission required to change order status")
    await orders_svc.change_order_status(db, order, user, data)
    await audit(
        db, action="status_change", module="orders", user=user, entity_type="order",
        entity_id=order.id, old={"status": order.events[-1].from_status if order.events else None},
        new={"status": data.to_status}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/{oid}/workflow", response_model=OrderOut)
async def change_order_workflow(
    oid: int,
    data: OrderWorkflowChange,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("production:update")),
):
    order = await workflow_svc.change_order_workflow(
        db, oid, user,
        to_status=data.to_status,
        notes=data.notes,
        department_id=data.department_id,
    )
    await audit(
        db, action="workflow_change", module="orders", user=user, entity_type="order",
        entity_id=order.id, new={"workflow_status": data.to_status}, request=request,
    )
    await db.commit()
    order = await orders_svc.get_order_by_id(db, oid)
    return await orders_svc.serialize_order(db, order)


@router.post("/items/{item_id}/workflow", response_model=OrderItemOut)
async def change_item_workflow(
    item_id: int,
    data: OrderItemWorkflowChange,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("production:update")),
):
    item = await workflow_svc.change_item_workflow(
        db, item_id, user,
        to_status=data.to_status,
        notes=data.notes,
        department_id=data.department_id,
    )
    await audit(
        db, action="workflow_change", module="orders", user=user, entity_type="order_item",
        entity_id=item.id, new={"workflow_status": data.to_status}, request=request,
    )
    await db.commit()
    res = await db.execute(
        select(OrderItem)
        .where(OrderItem.id == item.id)
        .options(
            selectinload(OrderItem.status_history),
            selectinload(OrderItem.current_department),
        )
    )
    loaded = res.scalar_one()
    return OrderItemOut.model_validate(loaded)


@router.delete("/{oid}", response_model=OkResponse)
async def delete_order(
    oid: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("orders:delete")),
):
    o = await db.get(Order, oid)
    if not o or o.deleted_at is not None:
        raise NotFoundError("Order not found")
    o.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return OkResponse()
