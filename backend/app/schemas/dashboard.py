"""Executive dashboard schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


class KPI(BaseModel):
    label: str
    value: float
    delta_pct: Optional[float] = None
    hint: Optional[str] = None
    currency: Optional[str] = None


class TimeSeriesPoint(BaseModel):
    t: str
    value: float


class StatusBreakdown(BaseModel):
    status: str
    count: int


class DepartmentLoad(BaseModel):
    department: str
    active: int
    delayed: int


class OnlineUser(BaseModel):
    id: int
    full_name: str
    department: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    avatar_url: Optional[str] = None


class ActivityFeedItem(BaseModel):
    id: int
    occurred_at: datetime
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    module: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    summary: str


class ScheduleItem(BaseModel):
    id: str
    kind: Literal["order_deadline", "follow_up"]
    title: str
    subtitle: Optional[str] = None
    reference_code: Optional[str] = None
    reference_id: Optional[int] = None
    owner_name: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    status: Optional[str] = None
    overdue: bool = False


class LowStockItem(BaseModel):
    id: int
    name: str
    sku: str
    on_hand: float
    reorder_level: float
    unit: str
    stock_status: Literal["critical", "low", "ok"]


class DashboardSummary(BaseModel):
    kpis: List[KPI]
    revenue_series: List[TimeSeriesPoint]
    orders_by_status: List[StatusBreakdown]
    department_load: List[DepartmentLoad]
    online_users: List[OnlineUser]
    activity_feed: List[ActivityFeedItem]
    upcoming_schedules: List[ScheduleItem] = []
    schedules_total: int = 0
    low_stock: List[LowStockItem] = []
    low_stock_total: int = 0
    overdue_invoices: List[dict] = []
    pending_approvals: List[dict] = []
