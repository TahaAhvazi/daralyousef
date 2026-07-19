"""Order schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator

from app.schemas.common import ORMModel
from app.schemas.department import DepartmentOut


class OrderItemStatusHistoryOut(ORMModel):
    id: int
    department_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: str
    actor_id: Optional[int] = None
    notes: Optional[str] = None
    occurred_at: datetime


class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    quantity: float = 1.0
    unit: str = "pcs"
    unit_price: float = 0.0
    discount_pct: float = 0.0
    tax_rate: float = 0.0
    spec: Optional[Dict[str, Any]] = None


class OrderItemCreate(OrderItemBase): ...


class OrderItemOut(ORMModel, OrderItemBase):
    id: int
    line_total: float
    workflow_status: str = "pending"
    current_department_id: Optional[int] = None
    current_department: Optional[DepartmentOut] = None
    status_history: List[OrderItemStatusHistoryOut] = []


class OrderItemSummaryOut(ORMModel, OrderItemBase):
    """List view — excludes status_history to avoid lazy-load in async sessions."""
    id: int
    line_total: float
    workflow_status: str = "pending"
    current_department_id: Optional[int] = None
    current_department: Optional[DepartmentOut] = None


class OrderBase(BaseModel):
    customer_id: int
    company_id: Optional[int] = None
    owner_id: Optional[int] = None
    department: Optional[str] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[date] = None
    delivery_method: Optional[str] = None
    delivery_address: Optional[str] = None
    priority: str = "normal"
    currency: str = "USD"


class WorkflowAssigneeOut(BaseModel):
    id: int
    full_name: str


class WorkflowAssignmentCreate(BaseModel):
    workflow_status: str
    assignee_id: Optional[int] = None
    assignee_ids: List[int] = []
    is_skipped: bool = False

    def resolved_assignee_ids(self) -> List[int]:
        if self.assignee_ids:
            return list(dict.fromkeys(self.assignee_ids))
        if self.assignee_id is not None:
            return [self.assignee_id]
        return []


class WorkflowAssignmentOut(BaseModel):
    workflow_status: str
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    assignee_ids: List[int] = []
    assignee_names: List[str] = []
    assignees: List[WorkflowAssigneeOut] = []
    department_slug: Optional[str] = None
    is_skipped: bool = False


class WorkflowStaffOut(BaseModel):
    id: int
    full_name: str
    email: str
    department_id: Optional[int] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = []
    workflow_assignments: List[WorkflowAssignmentCreate] = []


class OrderUpdate(OrderBase):
    customer_id: Optional[int] = None  # type: ignore


class OrderStatusEventOut(ORMModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_kind: Optional[str] = None
    occurred_at: datetime
    notes: Optional[str] = None


class OrderOut(ORMModel, OrderBase):
    id: int
    code: str
    status: str
    board_column: str = "intake"
    placed_via: str
    subtotal: float
    tax_total: float
    discount_total: float
    grand_total: float
    daftra_id: Optional[str] = None
    daftra_number: Optional[str] = None
    daftra_workflow_type_id: Optional[str] = None
    stock_check_status: Optional[str] = None
    stock_checked_at: Optional[datetime] = None
    stock_checked_by_id: Optional[int] = None
    stock_check_notes: Optional[str] = None
    materials_deducted: bool = False
    stock_approved: bool = False
    items: List[OrderItemOut] = []
    events: List[OrderStatusEventOut] = []
    workflow_assignments: List[WorkflowAssignmentOut] = []
    created_at: datetime
    updated_at: datetime

    @field_validator("workflow_assignments", mode="before")
    @classmethod
    def _coerce_workflow_assignments(cls, value):
        if not value:
            return []
        first = value[0]
        if isinstance(first, (dict, WorkflowAssignmentOut)):
            return value
        # ORM rows are expanded in order_service.serialize_order
        return []


class OrderSummaryOut(ORMModel, OrderBase):
    """List view — items omit workflow history."""
    id: int
    code: str
    status: str
    board_column: str = "intake"
    placed_via: str
    subtotal: float
    tax_total: float
    discount_total: float
    grand_total: float
    daftra_id: Optional[str] = None
    daftra_number: Optional[str] = None
    daftra_workflow_type_id: Optional[str] = None
    stock_check_status: Optional[str] = None
    items: List[OrderItemSummaryOut] = []
    events: List[OrderStatusEventOut] = []
    created_at: datetime
    updated_at: datetime


class OrderStatusChange(BaseModel):
    to_status: str
    notes: Optional[str] = None


class OrderItemWorkflowChange(BaseModel):
    to_status: str
    notes: Optional[str] = None
    department_id: Optional[int] = None


class WorkflowBoardOrderOut(BaseModel):
    order_id: int
    order_code: str
    order_title: Optional[str] = None
    order_priority: str
    order_deadline: Optional[date] = None
    order_status: str
    board_column: str
    progress_pct: int = 0
    placed_via: Optional[str] = None
    workflow_status: str
    item_count: int
    items_summary: str
    updated_at: datetime
    daftra_id: Optional[str] = None
    daftra_number: Optional[str] = None
    stage_assignee_id: Optional[int] = None
    stage_assignee_name: Optional[str] = None
    stage_assignee_ids: List[int] = []
    stage_assignee_names: List[str] = []
    assignments_ready: bool = False
    stages_with_assignees: List[str] = []
    can_advance: bool = False
    read_only_reason: Optional[str] = None
    enabled_stages: List[str] = []
    skipped_stages: List[str] = []
    next_status: Optional[str] = None
    prev_status: Optional[str] = None
    prev_column: Optional[str] = None
    can_revert: bool = False
    revert_requires_reason: bool = False
    stock_check_status: Optional[str] = None


class WorkflowBoardActivityOut(BaseModel):
    id: int
    order_code: str
    summary: str
    actor_name: Optional[str] = None
    occurred_at: datetime


class WorkflowBoardStatsOut(BaseModel):
    total: int
    by_column: Dict[str, int]


class WorkflowBoardOut(BaseModel):
    columns: Dict[str, List[WorkflowBoardOrderOut]]
    stats: WorkflowBoardStatsOut
    recent_activity: List[WorkflowBoardActivityOut] = []


class OrderBoardMove(BaseModel):
    to_column: str
    notes: Optional[str] = None


class OrderRelease(BaseModel):
    notes: Optional[str] = None
    workflow_assignments: List[WorkflowAssignmentCreate] = []


class OrderProposal(BaseModel):
    deadline: Optional[date] = None
    notes: Optional[str] = None
    admin_message: Optional[str] = None
    items: List[OrderItemCreate]


class CustomerOrderResponse(BaseModel):
    approved: bool
    notes: Optional[str] = None


class OrderReceiptConfirm(BaseModel):
    notes: Optional[str] = None


class OrderPaymentToggle(BaseModel):
    paid: bool
    notes: Optional[str] = None


class OrderStockCheck(BaseModel):
    approved: bool
    notes: Optional[str] = None


class OrderWorkflowChange(BaseModel):
    to_status: str
    notes: Optional[str] = None
    department_id: Optional[int] = None
