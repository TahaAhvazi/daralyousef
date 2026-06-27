"""Executive dashboard schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

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
    user_email: Optional[str]
    action: str
    module: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    summary: str


class DashboardSummary(BaseModel):
    kpis: List[KPI]
    revenue_series: List[TimeSeriesPoint]
    orders_by_status: List[StatusBreakdown]
    department_load: List[DepartmentLoad]
    online_users: List[OnlineUser]
    activity_feed: List[ActivityFeedItem]
    low_stock: List[dict] = []
    overdue_invoices: List[dict] = []
    pending_approvals: List[dict] = []
