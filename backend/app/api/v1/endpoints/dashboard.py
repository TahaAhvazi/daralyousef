"""Executive dashboard — live KPIs, charts, feed."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_any_permission
from app.db.base import get_db
from app.models.audit import AuditLog
from app.models.finance import Invoice
from app.models.inventory import Material
from app.models.order import Order
from app.models.production import DesignRevision
from app.models.user import User
from app.schemas.dashboard import (
    ActivityFeedItem, DashboardSummary, DepartmentLoad,
    KPI, OnlineUser, StatusBreakdown, TimeSeriesPoint,
)


router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("dashboard:read", "orders:admin")),
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    online_since = now - timedelta(minutes=10)

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

    # Activity feed
    res = await db.execute(select(AuditLog).order_by(AuditLog.id.desc()).limit(15))
    feed = [
        ActivityFeedItem(
            id=a.id, occurred_at=a.occurred_at, user_email=a.user_email,
            action=a.action, module=a.module, entity_type=a.entity_type,
            entity_id=a.entity_id,
            summary=f"{a.user_email or 'system'} {a.action} {a.module}/{a.entity_type or ''}",
        )
        for a in res.scalars().all()
    ]

    # Low-stock
    res = await db.execute(
        select(Material).where(
            Material.deleted_at.is_(None),
            Material.on_hand <= Material.reorder_level,
            Material.reorder_level > 0,
        ).order_by((Material.on_hand - Material.reorder_level).asc()).limit(10))
    low_stock = [
        {"id": m.id, "name": m.name, "sku": m.sku, "on_hand": m.on_hand,
         "reorder_level": m.reorder_level, "unit": m.unit}
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
        kpis=kpis, revenue_series=series_points, orders_by_status=by_status,
        department_load=dept_load, online_users=online_users, activity_feed=feed,
        low_stock=low_stock, overdue_invoices=overdue, pending_approvals=approvals,
    )
