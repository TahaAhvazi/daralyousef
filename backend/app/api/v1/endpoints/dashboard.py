"""Executive dashboard — live KPIs, charts, feed."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Literal

from fastapi import APIRouter, Depends
from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_any_permission
from app.db.base import get_db
from app.models.audit import AuditLog
from app.models.crm import FollowUp
from app.models.finance import Invoice
from app.models.inventory import Material
from app.models.order import Order
from app.models.production import DesignRevision
from app.models.user import User
from app.schemas.dashboard import (
    ActivityFeedItem,
    DashboardSummary,
    DepartmentLoad,
    KPI,
    LowStockItem,
    OnlineUser,
    ScheduleItem,
    StatusBreakdown,
    TimeSeriesPoint,
)


router = APIRouter()

OPEN_ORDER_STATUSES = (
    "confirmed",
    "paid",
    "in_production",
    "customer_approved",
    "pending_review",
    "awaiting_customer",
)


def _stock_status(on_hand: float, reorder_level: float) -> Literal["critical", "low", "ok"]:
    if on_hand <= 0:
        return "critical"
    if reorder_level > 0 and on_hand <= reorder_level:
        return "low"
    return "ok"


def _activity_summary(
    *,
    user_name: str | None,
    user_email: str | None,
    action: str,
    module: str,
    entity_type: str | None,
    entity_id: int | None,
    notes: str | None,
) -> str:
    actor = user_name or user_email or "system"
    target = ""
    if entity_type and entity_id:
        target = f" {entity_type} #{entity_id}"
    elif entity_type:
        target = f" {entity_type}"
    base = f"{actor} {action} {module}{target}".strip()
    if notes:
        return f"{base} — {notes}"
    return base


@router.get("/summary", response_model=DashboardSummary)
async def summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("dashboard:read", "orders:admin")),
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    online_since = now - timedelta(minutes=10)
    schedule_horizon = now.date() + timedelta(days=30)

    # KPIs
    today_revenue = await db.scalar(
        select(func.coalesce(func.sum(Invoice.paid_total), 0.0))
        .where(Invoice.deleted_at.is_(None), Invoice.created_at >= today_start)) or 0.0
    month_revenue = await db.scalar(
        select(func.coalesce(func.sum(Invoice.paid_total), 0.0))
        .where(Invoice.deleted_at.is_(None), Invoice.created_at >= month_start)) or 0.0
    active_orders = await db.scalar(
        select(func.count(Order.id))
        .where(Order.deleted_at.is_(None),
               Order.status.in_(("confirmed", "paid", "in_production")))) or 0
    delayed_orders = await db.scalar(
        select(func.count(Order.id))
        .where(Order.deleted_at.is_(None),
               Order.status.in_(("confirmed", "paid", "in_production")),
               Order.deadline.is_not(None), Order.deadline < now.date())) or 0
    online_users_count = await db.scalar(
        select(func.count(User.id)).where(User.last_seen_at >= online_since)) or 0
    pending_approvals = await db.scalar(
        select(func.count(DesignRevision.id))
        .where(DesignRevision.status == "awaiting_approval")) or 0

    kpis: List[KPI] = [
        KPI(label="Revenue Today", value=float(today_revenue), currency="USD", hint="Paid invoices"),
        KPI(label="Revenue MTD", value=float(month_revenue), currency="USD", hint="Month to date"),
        KPI(label="Active Orders", value=float(active_orders), hint="In flight"),
        KPI(label="Delayed Orders", value=float(delayed_orders), hint="Past deadline"),
        KPI(label="Online Now", value=float(online_users_count), hint="Last 10 min"),
        KPI(label="Pending Approvals", value=float(pending_approvals), hint="Design revisions"),
    ]

    # Revenue time series (30 days)
    series_points: List[TimeSeriesPoint] = []
    for i in range(29, -1, -1):
        d_start = today_start - timedelta(days=i)
        d_end = d_start + timedelta(days=1)
        v = await db.scalar(
            select(func.coalesce(func.sum(Invoice.paid_total), 0.0))
            .where(Invoice.created_at >= d_start, Invoice.created_at < d_end)) or 0.0
        series_points.append(TimeSeriesPoint(t=d_start.strftime("%Y-%m-%d"), value=float(v)))

    # Orders by status
    res = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.deleted_at.is_(None)).group_by(Order.status))
    by_status = [StatusBreakdown(status=s or "draft", count=int(c)) for s, c in res.all()]

    # Department load
    res = await db.execute(
        select(Order.department, func.count(Order.id),
               func.sum(case((Order.deadline < now.date(), 1), else_=0)))
        .where(Order.deleted_at.is_(None),
               Order.status.in_(("confirmed", "paid", "in_production")))
        .group_by(Order.department))
    dept_load = [DepartmentLoad(department=d or "general", active=int(a), delayed=int(dl or 0))
                 for d, a, dl in res.all()]

    # Online users list
    res = await db.execute(
        select(User).where(User.last_seen_at >= online_since).order_by(User.last_seen_at.desc()).limit(20))
    online_users = [
        OnlineUser(id=u.id, full_name=u.full_name, department=u.department,
                   last_seen_at=u.last_seen_at, avatar_url=u.avatar_url)
        for u in res.scalars().all()
    ]

    # Activity feed (enriched with actor name)
    res = await db.execute(select(AuditLog).order_by(AuditLog.id.desc()).limit(25))
    audits = list(res.scalars().all())
    actor_ids = {a.user_id for a in audits if a.user_id}
    actors: dict[int, User] = {}
    if actor_ids:
        actor_res = await db.execute(select(User).where(User.id.in_(actor_ids)))
        actors = {u.id: u for u in actor_res.scalars().all()}

    feed = [
        ActivityFeedItem(
            id=a.id,
            occurred_at=a.occurred_at,
            user_id=a.user_id,
            user_email=a.user_email,
            user_name=(actors[a.user_id].full_name if a.user_id and a.user_id in actors else None),
            action=a.action,
            module=a.module,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            summary=_activity_summary(
                user_name=(actors[a.user_id].full_name if a.user_id and a.user_id in actors else None),
                user_email=a.user_email,
                action=a.action,
                module=a.module,
                entity_type=a.entity_type,
                entity_id=a.entity_id,
                notes=a.notes,
            ),
        )
        for a in audits
    ]

    # Upcoming schedules: order deadlines + CRM follow-ups
    schedules: List[ScheduleItem] = []

    order_res = await db.execute(
        select(Order, User.full_name)
        .outerjoin(User, User.id == Order.owner_id)
        .where(
            Order.deleted_at.is_(None),
            Order.deadline.is_not(None),
            Order.status.in_(OPEN_ORDER_STATUSES),
            Order.deadline <= schedule_horizon,
        )
        .order_by(Order.deadline.asc())
        .limit(40)
    )
    for order, owner_name in order_res.all():
        starts = datetime.combine(order.deadline, datetime.min.time(), tzinfo=timezone.utc)
        schedules.append(ScheduleItem(
            id=f"order-{order.id}",
            kind="order_deadline",
            title=order.title or order.code,
            subtitle=order.status,
            reference_code=order.code,
            reference_id=order.id,
            owner_name=owner_name,
            starts_at=starts,
            ends_at=starts + timedelta(hours=1),
            status=order.status,
            overdue=order.deadline < now.date(),
        ))

    follow_res = await db.execute(
        select(FollowUp, User.full_name)
        .outerjoin(User, User.id == FollowUp.owner_id)
        .where(FollowUp.done.is_(False), FollowUp.due_at <= now + timedelta(days=30))
        .order_by(FollowUp.due_at.asc())
        .limit(40)
    )
    for follow, owner_name in follow_res.all():
        due = follow.due_at
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        schedules.append(ScheduleItem(
            id=f"follow-{follow.id}",
            kind="follow_up",
            title=follow.subject,
            subtitle=follow.notes,
            reference_code=f"FU-{follow.id}",
            reference_id=follow.id,
            owner_name=owner_name,
            starts_at=due,
            ends_at=due + timedelta(minutes=30),
            status="open",
            overdue=due < now,
        ))

    schedules.sort(key=lambda s: (not s.overdue, s.starts_at))
    schedules_total = len(schedules)
    upcoming_schedules = schedules[:12]

    # Low-stock (with total count + stock status)
    low_stock_total = await db.scalar(
        select(func.count(Material.id)).where(
            Material.deleted_at.is_(None),
            Material.reorder_level > 0,
            Material.on_hand <= Material.reorder_level,
        )
    ) or 0
    res = await db.execute(
        select(Material).where(
            Material.deleted_at.is_(None),
            or_(
                Material.on_hand <= 0,
                and_(Material.reorder_level > 0, Material.on_hand <= Material.reorder_level),
            ),
        ).order_by((Material.on_hand - Material.reorder_level).asc()).limit(12)
    )
    low_stock = [
        LowStockItem(
            id=m.id,
            name=m.name,
            sku=m.sku,
            on_hand=float(m.on_hand),
            reorder_level=float(m.reorder_level),
            unit=m.unit,
            stock_status=_stock_status(float(m.on_hand), float(m.reorder_level)),
        )
        for m in res.scalars().all()
    ]

    # Overdue invoices
    res = await db.execute(
        select(Invoice).where(
            Invoice.deleted_at.is_(None),
            Invoice.balance > 0,
            Invoice.due_date.is_not(None),
            Invoice.due_date < now.date(),
        ).order_by(Invoice.due_date.asc()).limit(10))
    overdue = [
        {"id": i.id, "code": i.code, "customer_id": i.customer_id,
         "due_date": str(i.due_date), "balance": i.balance, "currency": i.currency}
        for i in res.scalars().all()
    ]

    # Pending approvals
    res = await db.execute(
        select(DesignRevision).where(DesignRevision.status == "awaiting_approval")
        .order_by(DesignRevision.id.desc()).limit(10))
    approvals = [
        {"id": r.id, "order_id": r.order_id, "version": r.version, "title": r.title}
        for r in res.scalars().all()
    ]

    return DashboardSummary(
        kpis=kpis,
        revenue_series=series_points,
        orders_by_status=by_status,
        department_load=dept_load,
        online_users=online_users,
        activity_feed=feed,
        upcoming_schedules=upcoming_schedules,
        schedules_total=schedules_total,
        low_stock=low_stock,
        low_stock_total=int(low_stock_total),
        overdue_invoices=overdue,
        pending_approvals=approvals,
    )
