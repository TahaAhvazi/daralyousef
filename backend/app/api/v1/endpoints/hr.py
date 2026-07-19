"""Human Resources API — dashboard summary for managers."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_any_permission
from app.db.base import get_db
from app.models.hr import (
    ATTENDANCE_STATUSES,
    CONTRACT_STATUSES,
    PAYROLL_ADJUSTMENT_KINDS,
    AttendanceRecord,
    Designation,
    EmployeeContract,
    HrRequest,
    PayrollAdjustment,
    Payslip,
    StaffProfile,
)
from app.models.user import User
from app.models.department import Department
from app.schemas.hr import (
    AttendanceBreakdown,
    AttendanceBulkIn,
    AttendanceDayIn,
    AttendanceMonthDay,
    AttendanceMonthOut,
    AttendanceOut,
    ContractStatusCount,
    DesignationOut,
    EmployeeContractOut,
    EmployeeHrActivity,
    EmployeeHrProfile,
    EmployeePayrollOverview,
    EmployeeProjectOut,
    ExpiringContractOut,
    HrDashboardSummary,
    NamedCount,
    PayrollAdjustmentIn,
    PayrollAdjustmentOut,
    PayrollMonthPoint,
    PayrollReportOut,
    PayrollReportRow,
    PayrollSummary,
    PayslipDraftPreview,
    PayslipOut,
    PayslipUpdateIn,
    PayslipWriteIn,
    PendingHrRequestOut,
    StaffProfileOut,
    WorkforceSummary,
)
from app.core.exceptions import NotFoundError, ValidationError
from app.models.audit import AuditLog
from app.models.order import Order, OrderWorkflowAssignment
from app.models.rbac import Role, UserRole
from app.services import hr_payroll as payroll_svc

BOARD_PIPELINE_STAGES = ("design", "printing", "production", "finishing", "delivery")
CLOSED_ORDER_STATUSES = ("cancelled", "closed", "draft")


router = APIRouter()


@router.get("/designations", response_model=list[DesignationOut])
async def list_designations(
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "users:write")),
):
    """Local job titles / designations (synced from Daftra)."""
    stmt = select(Designation).where(Designation.deleted_at.is_(None))
    if active_only:
        stmt = stmt.where(Designation.is_active.is_(True))
    stmt = stmt.order_by(Designation.name.asc())
    res = await db.execute(stmt)
    return [DesignationOut.model_validate(d) for d in res.scalars().all()]


def _as_utc(dt: datetime | date | None) -> datetime:
    """Normalize naive/aware datetimes for safe sorting."""
    if dt is None:
        return datetime.min.replace(tzinfo=timezone.utc)
    if isinstance(dt, date) and not isinstance(dt, datetime):
        return datetime.combine(dt, time(12, 0), tzinfo=timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("/summary", response_model=HrDashboardSummary)
async def hr_summary(
    currency: str = Query("IQD"),
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "dashboard:read")),
):
    today = date.today()
    period_end = today
    period_start = today - timedelta(days=days - 1)
    soon = today + timedelta(days=45)

    # Contracts by status
    status_rows = await db.execute(
        select(EmployeeContract.status, func.count(EmployeeContract.id))
        .where(EmployeeContract.deleted_at.is_(None))
        .group_by(EmployeeContract.status)
    )
    status_map = {s: int(c) for s, c in status_rows.all()}
    contracts_by_status = [
        ContractStatusCount(status=s, count=status_map.get(s, 0)) for s in CONTRACT_STATUSES
    ]
    contracts_total = sum(c.count for c in contracts_by_status)

    # Pending requests
    pending_total = await db.scalar(
        select(func.count(HrRequest.id)).where(
            HrRequest.deleted_at.is_(None), HrRequest.status == "pending",
        )
    ) or 0
    req_res = await db.execute(
        select(HrRequest, User)
        .join(User, User.id == HrRequest.employee_id)
        .where(HrRequest.deleted_at.is_(None), HrRequest.status == "pending")
        .order_by(HrRequest.id.desc())
        .limit(20)
    )
    pending_requests = [
        PendingHrRequestOut(
            id=r.id,
            employee_id=u.id,
            employee_name=u.full_name,
            employee_avatar=u.avatar_url,
            request_type=r.request_type,
            subject=r.subject,
            status=r.status,
            starts_on=r.starts_on,
            ends_on=r.ends_on,
            created_at=r.created_at,
        )
        for r, u in req_res.all()
    ]

    # Payroll in period
    pay_row = await db.execute(
        select(
            func.coalesce(func.sum(Payslip.gross_pay), 0.0),
            func.coalesce(func.sum(Payslip.deductions), 0.0),
            func.coalesce(func.sum(Payslip.net_pay), 0.0),
            func.count(Payslip.id),
        ).where(
            Payslip.deleted_at.is_(None),
            Payslip.currency == currency,
            Payslip.period_end >= period_start,
            Payslip.period_start <= period_end,
        )
    )
    gross, deductions, net, slip_count = pay_row.one()
    payroll = PayrollSummary(
        currency=currency,
        period_start=period_start,
        period_end=period_end,
        total_gross=float(gross or 0),
        total_deductions=float(deductions or 0),
        total_net=float(net or 0),
        payslip_count=int(slip_count or 0),
    )

    # Expiring contracts
    exp_res = await db.execute(
        select(EmployeeContract, User)
        .join(User, User.id == EmployeeContract.employee_id)
        .where(
            EmployeeContract.deleted_at.is_(None),
            EmployeeContract.end_date.is_not(None),
            EmployeeContract.end_date >= today,
            EmployeeContract.end_date <= soon,
            EmployeeContract.status.in_(("active", "under_review", "replacement")),
        )
        .order_by(EmployeeContract.end_date.asc())
        .limit(20)
    )
    expiring_contracts = [
        ExpiringContractOut(
            id=c.id,
            code=c.code,
            employee_id=u.id,
            employee_name=u.full_name,
            employee_avatar=u.avatar_url,
            title=c.title,
            start_date=c.start_date,
            end_date=c.end_date,  # type: ignore[arg-type]
            status=c.status,
        )
        for c, u in exp_res.all()
    ]

    # Attendance breakdown
    att_rows = await db.execute(
        select(AttendanceRecord.status, func.count(AttendanceRecord.id))
        .where(
            AttendanceRecord.work_date >= period_start,
            AttendanceRecord.work_date <= period_end,
        )
        .group_by(AttendanceRecord.status)
    )
    att_map = {s: int(c) for s, c in att_rows.all()}
    attendance_total = sum(att_map.values())
    attendance = [
        AttendanceBreakdown(
            status=s,
            count=att_map.get(s, 0),
            pct=(att_map.get(s, 0) / attendance_total * 100.0) if attendance_total else 0.0,
        )
        for s in ATTENDANCE_STATUSES
    ]

    # Workforce reporting (synced staff directory)
    staff_base = select(User).where(User.deleted_at.is_(None), User.is_staff.is_(True))
    employees_total = int(await db.scalar(select(func.count()).select_from(staff_base.subquery())) or 0)
    employees_active = int(await db.scalar(
        select(func.count()).select_from(
            select(User.id).where(
                User.deleted_at.is_(None), User.is_staff.is_(True), User.is_active.is_(True),
            ).subquery()
        )
    ) or 0)
    employees_inactive = max(0, employees_total - employees_active)
    synced_from_daftra = int(await db.scalar(
        select(func.count()).select_from(
            select(User.id).where(
                User.deleted_at.is_(None), User.is_staff.is_(True), User.daftra_id.is_not(None),
            ).subquery()
        )
    ) or 0)
    with_department = int(await db.scalar(
        select(func.count()).select_from(
            select(User.id).where(
                User.deleted_at.is_(None), User.is_staff.is_(True), User.department_id.is_not(None),
            ).subquery()
        )
    ) or 0)
    with_title = int(await db.scalar(
        select(func.count()).select_from(
            select(User.id).where(
                User.deleted_at.is_(None), User.is_staff.is_(True), User.title.is_not(None),
            ).subquery()
        )
    ) or 0)
    with_contract = int(await db.scalar(
        select(func.count(func.distinct(EmployeeContract.employee_id))).where(
            EmployeeContract.deleted_at.is_(None),
        )
    ) or 0)

    dept_rows = await db.execute(
        select(Department.id, Department.name, func.count(User.id))
        .join(User, User.department_id == Department.id)
        .where(User.deleted_at.is_(None), User.is_staff.is_(True))
        .group_by(Department.id, Department.name)
        .order_by(func.count(User.id).desc(), Department.name.asc())
    )
    by_department = [
        NamedCount(id=did, name=name, count=int(cnt))
        for did, name, cnt in dept_rows.all()
    ]
    no_dept = int(await db.scalar(
        select(func.count()).select_from(
            select(User.id).where(
                User.deleted_at.is_(None), User.is_staff.is_(True), User.department_id.is_(None),
            ).subquery()
        )
    ) or 0)
    if no_dept:
        by_department.append(NamedCount(id=None, name="—", count=no_dept))

    title_rows = await db.execute(
        select(User.title, func.count(User.id))
        .where(User.deleted_at.is_(None), User.is_staff.is_(True), User.title.is_not(None))
        .group_by(User.title)
        .order_by(func.count(User.id).desc(), User.title.asc())
        .limit(20)
    )
    by_title = [
        NamedCount(name=str(title), count=int(cnt))
        for title, cnt in title_rows.all()
    ]

    workforce = WorkforceSummary(
        employees_total=employees_total,
        employees_active=employees_active,
        employees_inactive=employees_inactive,
        synced_from_daftra=synced_from_daftra,
        with_department=with_department,
        with_title=with_title,
        with_contract=with_contract,
        by_department=by_department,
        by_title=by_title,
    )

    return HrDashboardSummary(
        contracts_by_status=contracts_by_status,
        contracts_total=contracts_total,
        pending_requests=pending_requests,
        pending_requests_total=int(pending_total),
        payroll=payroll,
        expiring_contracts=expiring_contracts,
        attendance=attendance,
        attendance_total=attendance_total,
        workforce=workforce,
    )


@router.get("/employees/{employee_id}", response_model=EmployeeHrProfile)
async def employee_hr_profile(
    employee_id: int,
    days: int = Query(365, ge=7, le=730),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "dashboard:read")),
):
    user = await db.get(User, employee_id)
    if not user or user.deleted_at is not None or not user.is_staff:
        raise NotFoundError("Employee not found")

    today = date.today()
    period_start = today - timedelta(days=days - 1)

    roles_res = await db.execute(
        select(Role.name, Role.slug)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    role_rows = list(roles_res.all())
    role_names = [r[0] for r in role_rows]
    role_slugs = [r[1] for r in role_rows]

    contracts_res = await db.execute(
        select(EmployeeContract)
        .where(EmployeeContract.employee_id == user.id, EmployeeContract.deleted_at.is_(None))
        .order_by(EmployeeContract.is_primary.desc(), EmployeeContract.start_date.desc())
    )
    contracts = [EmployeeContractOut.model_validate(c) for c in contracts_res.scalars().all()]
    primary = next((c for c in contracts if c.is_primary), contracts[0] if contracts else None)

    slips_res = await db.execute(
        select(Payslip)
        .where(Payslip.employee_id == user.id, Payslip.deleted_at.is_(None))
        .order_by(Payslip.period_end.desc())
        .limit(48)
    )
    slip_models = list(slips_res.scalars().all())
    payslips = [PayslipOut.model_validate(p) for p in slip_models]

    pay_row = await db.execute(
        select(
            func.coalesce(func.sum(Payslip.gross_pay), 0.0),
            func.coalesce(func.sum(Payslip.deductions), 0.0),
            func.coalesce(func.sum(Payslip.net_pay), 0.0),
            func.coalesce(func.sum(Payslip.base_salary), 0.0),
            func.coalesce(func.sum(Payslip.overtime), 0.0),
            func.coalesce(func.sum(Payslip.absence), 0.0),
            func.coalesce(func.sum(Payslip.bonus), 0.0),
            func.count(Payslip.id),
        ).where(
            Payslip.deleted_at.is_(None),
            Payslip.employee_id == user.id,
            Payslip.period_end >= period_start,
        )
    )
    gross, deductions, net, sum_base, sum_ot, sum_abs, sum_bonus, slip_count = pay_row.one()
    currency = payslips[0].currency if payslips else "IQD"
    count_n = int(slip_count or 0)
    payroll_totals = PayrollSummary(
        currency=currency,
        period_start=period_start,
        period_end=today,
        total_gross=float(gross or 0),
        total_deductions=float(deductions or 0),
        total_net=float(net or 0),
        payslip_count=count_n,
    )

    # Monthly matrix (calendar months in range) from payslips in period
    month_map: dict[tuple[int, int], PayrollMonthPoint] = {}
    for p in slip_models:
        if p.period_end < period_start:
            continue
        key = (p.period_end.year, p.period_end.month)
        point = month_map.get(key)
        if not point:
            point = PayrollMonthPoint(
                year=key[0],
                month=key[1],
                label=f"{key[0]}-{key[1]:02d}",
            )
            month_map[key] = point
        point.base_salary += float(p.base_salary or 0)
        point.overtime += float(p.overtime or 0)
        point.absence += float(p.absence or 0)
        point.bonus += float(getattr(p, "bonus", 0) or 0)
        point.gross_pay += float(p.gross_pay or 0)
        point.deductions += float(p.deductions or 0)
        point.net_pay += float(p.net_pay or 0)

    months = sorted(month_map.values(), key=lambda m: (m.year, m.month))
    payroll_overview = EmployeePayrollOverview(
        currency=currency,
        period_start=period_start,
        period_end=today,
        average_gross=(float(gross or 0) / count_n) if count_n else 0.0,
        average_net=(float(net or 0) / count_n) if count_n else 0.0,
        total_net=float(net or 0),
        total_gross=float(gross or 0),
        total_deductions=float(deductions or 0),
        total_base_salary=float(sum_base or 0),
        total_overtime=float(sum_ot or 0),
        total_absence=float(sum_abs or 0),
        total_bonus=float(sum_bonus or 0),
        payslip_count=count_n,
        months=months,
    )

    att_res = await db.execute(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.employee_id == user.id,
            AttendanceRecord.work_date >= period_start,
        )
        .order_by(AttendanceRecord.work_date.desc())
        .limit(90)
    )
    attendance_rows = list(att_res.scalars().all())
    attendance = [AttendanceOut.model_validate(a) for a in attendance_rows]

    att_map: dict[str, int] = {}
    for a in attendance_rows:
        att_map[a.status] = att_map.get(a.status, 0) + 1
    att_total = sum(att_map.values())
    attendance_summary = [
        AttendanceBreakdown(
            status=s,
            count=att_map.get(s, 0),
            pct=(att_map.get(s, 0) / att_total * 100.0) if att_total else 0.0,
        )
        for s in ATTENDANCE_STATUSES
    ]

    req_res = await db.execute(
        select(HrRequest)
        .where(HrRequest.employee_id == user.id, HrRequest.deleted_at.is_(None))
        .order_by(HrRequest.id.desc())
        .limit(20)
    )
    requests = [
        PendingHrRequestOut(
            id=r.id,
            employee_id=user.id,
            employee_name=user.full_name,
            employee_avatar=user.avatar_url,
            request_type=r.request_type,
            subject=r.subject,
            status=r.status,
            starts_on=r.starts_on,
            ends_on=r.ends_on,
            created_at=r.created_at,
        )
        for r in req_res.scalars().all()
    ]

    activity: list[EmployeeHrActivity] = []
    for r in requests[:8]:
        activity.append(EmployeeHrActivity(
            id=f"req-{r.id}",
            occurred_at=_as_utc(r.created_at),
            kind="request",
            summary=r.subject,
            meta=r.request_type,
        ))
    for p in payslips[:8]:
        occurred = _as_utc(p.paid_at) if p.paid_at else _as_utc(p.period_end)
        activity.append(EmployeeHrActivity(
            id=f"pay-{p.id}",
            occurred_at=occurred,
            kind="payslip",
            summary=f"{p.code} · {p.net_pay:g} {p.currency}",
            meta="paid" if p.paid else "unpaid",
        ))
    for a in attendance[:10]:
        activity.append(EmployeeHrActivity(
            id=f"att-{a.id}",
            occurred_at=_as_utc(a.work_date),
            kind="attendance",
            summary=a.status,
            meta=f"{a.check_in or '—'} – {a.check_out or '—'}",
        ))

    audit_res = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == user.id)
        .order_by(AuditLog.id.desc())
        .limit(15)
    )
    for log in audit_res.scalars().all():
        activity.append(EmployeeHrActivity(
            id=f"audit-{log.id}",
            occurred_at=_as_utc(log.occurred_at),
            kind="audit",
            summary=f"{log.action} {log.module}",
            meta=log.notes,
        ))

    activity.sort(key=lambda x: _as_utc(x.occurred_at), reverse=True)

    projects_by_id: dict[int, EmployeeProjectOut] = {}
    stages_by_id: dict[int, list[str]] = {}

    assign_res = await db.execute(
        select(Order, OrderWorkflowAssignment)
        .join(OrderWorkflowAssignment, OrderWorkflowAssignment.order_id == Order.id)
        .where(
            OrderWorkflowAssignment.assignee_id == user.id,
            Order.deleted_at.is_(None),
            OrderWorkflowAssignment.is_skipped.is_(False),
        )
        .order_by(Order.id.desc())
    )
    for order, asg in assign_res.all():
        stages_by_id.setdefault(order.id, []).append(asg.workflow_status)
        if order.id in projects_by_id:
            continue
        on_board = (
            order.status not in CLOSED_ORDER_STATUSES
            and asg.workflow_status in BOARD_PIPELINE_STAGES
        )
        projects_by_id[order.id] = EmployeeProjectOut(
            order_id=order.id,
            code=order.code,
            title=order.title,
            status=order.status,
            priority=order.priority,
            deadline=order.deadline,
            workflow_status=asg.workflow_status,
            role="assignee",
            on_board=on_board,
            grand_total=float(order.grand_total or 0),
            currency=order.currency or "USD",
        )

    owner_res = await db.execute(
        select(Order)
        .where(Order.owner_id == user.id, Order.deleted_at.is_(None))
        .order_by(Order.id.desc())
    )
    for order in owner_res.scalars().all():
        if order.id in projects_by_id:
            continue
        on_board = order.status not in CLOSED_ORDER_STATUSES
        projects_by_id[order.id] = EmployeeProjectOut(
            order_id=order.id,
            code=order.code,
            title=order.title,
            status=order.status,
            priority=order.priority,
            deadline=order.deadline,
            workflow_status=None,
            role="owner",
            on_board=on_board,
            grand_total=float(order.grand_total or 0),
            currency=order.currency or "USD",
        )

    for oid, stages in stages_by_id.items():
        proj = projects_by_id.get(oid)
        if not proj or len(stages) <= 1:
            continue
        # Prefer the furthest pipeline stage as the displayed workflow status.
        ranked = [s for s in BOARD_PIPELINE_STAGES if s in stages]
        if ranked:
            projects_by_id[oid] = proj.model_copy(update={
                "workflow_status": ranked[-1],
                "on_board": proj.status not in CLOSED_ORDER_STATUSES,
            })

    projects = sorted(
        projects_by_id.values(),
        key=lambda p: (0 if p.on_board else 1, p.deadline or date.max, -p.order_id),
    )

    profile_res = await db.execute(
        select(StaffProfile).where(StaffProfile.user_id == user.id)
    )
    staff_profile = profile_res.scalar_one_or_none()
    profile_out = StaffProfileOut.model_validate(staff_profile) if staff_profile else None

    dept_name = user.department
    if user.department_id:
        dname = await db.scalar(select(Department.name).where(Department.id == user.department_id))
        if dname:
            dept_name = dname

    return EmployeeHrProfile(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        avatar_url=user.avatar_url,
        title=user.title,
        department=dept_name,
        department_id=user.department_id,
        is_active=user.is_active,
        is_staff=bool(user.is_staff),
        daftra_id=user.daftra_id,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        roles=role_names,
        role_slugs=role_slugs,
        profile=profile_out,
        primary_contract=primary,
        contracts=contracts,
        payslips=payslips,
        attendance=attendance,
        attendance_summary=attendance_summary,
        requests=requests,
        projects=projects,
        activity=activity[:40],
        payroll_totals=payroll_totals,
        payroll_overview=payroll_overview,
    )


# ── Attendance calendar & payroll write APIs (hr:manage) ─────────────────────


async def _get_staff_user(db: AsyncSession, employee_id: int) -> User:
    user = await db.get(User, employee_id)
    if not user or user.deleted_at is not None or not user.is_staff:
        raise NotFoundError("Employee not found")
    return user


def _validate_attendance_status(status: str) -> str:
    s = (status or "").strip().lower()
    if s not in ATTENDANCE_STATUSES:
        raise ValidationError(f"Invalid status. Allowed: {', '.join(ATTENDANCE_STATUSES)}")
    return s


@router.get("/employees/{employee_id}/attendance", response_model=AttendanceMonthOut)
async def get_attendance_month(
    employee_id: int,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "dashboard:read", "hr:manage")),
):
    user = await _get_staff_user(db, employee_id)
    period_start, period_end = payroll_svc.month_bounds(year, month)
    base, currency = await payroll_svc.employee_base_salary(db, user.id)
    res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == user.id,
            AttendanceRecord.work_date >= period_start,
            AttendanceRecord.work_date <= period_end,
        )
    )
    by_date = {r.work_date: r for r in res.scalars().all()}
    counts: dict[str, int] = {s: 0 for s in ATTENDANCE_STATUSES}
    days: list[AttendanceMonthDay] = []
    last = period_end.day
    for d in range(1, last + 1):
        dt = date(year, month, d)
        rec = by_date.get(dt)
        if rec:
            counts[rec.status] = counts.get(rec.status, 0) + 1
        days.append(AttendanceMonthDay(
            date=dt,
            day=d,
            weekday=dt.weekday(),
            status=rec.status if rec else None,
            check_in=rec.check_in if rec else None,
            check_out=rec.check_out if rec else None,
            notes=rec.notes if rec else None,
            deduction_amount=rec.deduction_amount if rec else None,
            record_id=rec.id if rec else None,
        ))
    return AttendanceMonthOut(
        employee_id=user.id,
        year=year,
        month=month,
        daily_rate=payroll_svc.daily_rate(base),
        currency=currency,
        base_salary=base,
        counts=counts,
        days=days,
    )


@router.put("/employees/{employee_id}/attendance", response_model=AttendanceOut)
async def upsert_attendance_day(
    employee_id: int,
    body: AttendanceDayIn,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(require_any_permission("hr:manage")),
):
    user = await _get_staff_user(db, employee_id)
    status = _validate_attendance_status(body.status)
    res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == user.id,
            AttendanceRecord.work_date == body.date,
        )
    )
    rec = res.scalar_one_or_none()
    if not rec:
        rec = AttendanceRecord(employee_id=user.id, work_date=body.date)
        db.add(rec)
    rec.status = status
    rec.check_in = (body.check_in or None)
    rec.check_out = (body.check_out or None)
    rec.notes = (body.notes or None)
    rec.deduction_amount = body.deduction_amount
    rec.marked_by_id = me.id
    await db.commit()
    await db.refresh(rec)
    return AttendanceOut.model_validate(rec)


@router.post("/employees/{employee_id}/attendance/bulk", response_model=AttendanceMonthOut)
async def bulk_mark_attendance(
    employee_id: int,
    body: AttendanceBulkIn,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(require_any_permission("hr:manage")),
):
    user = await _get_staff_user(db, employee_id)
    status = _validate_attendance_status(body.status)
    if body.end_date < body.start_date:
        raise ValidationError("end_date must be >= start_date")
    if (body.end_date - body.start_date).days > 62:
        raise ValidationError("Range too large (max 62 days)")

    cursor = body.start_date
    while cursor <= body.end_date:
        if body.weekdays_only and cursor.weekday() >= 5:
            cursor += timedelta(days=1)
            continue
        res = await db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.employee_id == user.id,
                AttendanceRecord.work_date == cursor,
            )
        )
        rec = res.scalar_one_or_none()
        if not rec:
            rec = AttendanceRecord(employee_id=user.id, work_date=cursor)
            db.add(rec)
        rec.status = status
        rec.marked_by_id = me.id
        cursor += timedelta(days=1)

    await db.commit()
    return await get_attendance_month(
        employee_id=user.id,
        year=body.start_date.year,
        month=body.start_date.month,
        db=db,
        _=me,
    )


@router.get("/employees/{employee_id}/adjustments", response_model=list[PayrollAdjustmentOut])
async def list_adjustments(
    employee_id: int,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "dashboard:read", "hr:manage")),
):
    await _get_staff_user(db, employee_id)
    rows = await payroll_svc.list_month_adjustments(db, employee_id, year, month)
    return [PayrollAdjustmentOut.model_validate(r) for r in rows]


@router.post("/employees/{employee_id}/adjustments", response_model=PayrollAdjustmentOut)
async def create_adjustment(
    employee_id: int,
    body: PayrollAdjustmentIn,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(require_any_permission("hr:manage")),
):
    await _get_staff_user(db, employee_id)
    kind = (body.kind or "bonus").strip().lower()
    if kind not in PAYROLL_ADJUSTMENT_KINDS:
        raise ValidationError(f"Invalid kind. Allowed: {', '.join(PAYROLL_ADJUSTMENT_KINDS)}")
    if body.amount <= 0:
        raise ValidationError("amount must be > 0")
    if body.period_month < 1 or body.period_month > 12:
        raise ValidationError("Invalid period_month")
    row = PayrollAdjustment(
        employee_id=employee_id,
        period_year=body.period_year,
        period_month=body.period_month,
        kind=kind,
        amount=float(body.amount),
        currency=(body.currency or "IQD")[:8],
        reason=(body.reason or None),
        created_by_id=me.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return PayrollAdjustmentOut.model_validate(row)


@router.delete("/employees/{employee_id}/adjustments/{adjustment_id}")
async def delete_adjustment(
    employee_id: int,
    adjustment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:manage")),
):
    await _get_staff_user(db, employee_id)
    row = await db.get(PayrollAdjustment, adjustment_id)
    if not row or row.employee_id != employee_id or row.deleted_at is not None:
        raise NotFoundError("Adjustment not found")
    row.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.get("/employees/{employee_id}/payslips/preview", response_model=PayslipDraftPreview)
async def preview_payslip_draft(
    employee_id: int,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "dashboard:read", "hr:manage")),
):
    await _get_staff_user(db, employee_id)
    amounts = await payroll_svc.build_draft_amounts(db, employee_id, year, month)
    draft = await payroll_svc.find_local_period_slip(
        db, employee_id, amounts["period_start"], amounts["period_end"],
    )
    return PayslipDraftPreview(
        employee_id=employee_id,
        year=year,
        month=month,
        period_start=amounts["period_start"],
        period_end=amounts["period_end"],
        currency=amounts["currency"],
        base_salary=amounts["base_salary"],
        daily_rate=amounts["daily_rate"],
        absent_days=amounts["absent_days"],
        absence_deduction=amounts["absence_deduction"],
        overtime=amounts["overtime"],
        bonus=amounts["bonus"],
        extra_deduction=amounts["extra_deduction"],
        gross_pay=amounts["gross_pay"],
        deductions=amounts["deductions"],
        net_pay=amounts["net_pay"],
        adjustments=[PayrollAdjustmentOut.model_validate(a) for a in amounts["adjustments"]],
        draft_payslip=PayslipOut.model_validate(draft) if draft else None,
    )


@router.post("/employees/{employee_id}/payslips/draft", response_model=PayslipOut)
async def create_or_update_payslip_draft(
    employee_id: int,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:manage")),
):
    await _get_staff_user(db, employee_id)
    amounts = await payroll_svc.build_draft_amounts(db, employee_id, year, month)
    period_start = amounts["period_start"]
    period_end = amounts["period_end"]

    existing = await payroll_svc.find_local_period_slip(db, employee_id, period_start, period_end)
    # Regenerating from attendance reopens a local slip (even if previously paid)
    notes = (
        f"Local draft · absent={amounts['absent_days']} · "
        f"daily_rate={amounts['daily_rate']:g}"
    )
    if existing:
        slip = existing
        slip.status = "draft"
        slip.paid = False
        slip.paid_at = None
    else:
        code = f"LOC-PS-{employee_id}-{year}{month:02d}"
        clash = await db.scalar(select(Payslip.id).where(Payslip.code == code))
        if clash:
            code = f"LOC-PS-{employee_id}-{year}{month:02d}-{int(datetime.now().timestamp()) % 10000}"
        slip = Payslip(
            employee_id=employee_id,
            code=code[:40],
            period_start=period_start,
            period_end=period_end,
            source="local",
            status="draft",
            paid=False,
        )
        db.add(slip)

    slip.base_salary = amounts["base_salary"]
    slip.overtime = amounts["overtime"]
    slip.absence = amounts["absence_deduction"]
    slip.bonus = amounts["bonus"]
    slip.gross_pay = amounts["gross_pay"]
    slip.deductions = amounts["deductions"]
    slip.net_pay = amounts["net_pay"]
    slip.currency = amounts["currency"]
    slip.notes = notes
    slip.source = "local"
    await db.commit()
    await db.refresh(slip)
    return PayslipOut.model_validate(slip)


@router.post("/payslips/{payslip_id}/confirm", response_model=PayslipOut)
async def confirm_payslip(
    payslip_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:manage")),
):
    slip = await db.get(Payslip, payslip_id)
    if not slip or slip.deleted_at is not None:
        raise NotFoundError("Payslip not found")
    slip.status = "paid"
    slip.paid = True
    slip.paid_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(slip)
    return PayslipOut.model_validate(slip)


def _recompute_payslip_totals(slip: Payslip) -> None:
    base = float(slip.base_salary or 0)
    ot = float(slip.overtime or 0)
    bonus = float(slip.bonus or 0)
    absence = float(slip.absence or 0)
    # Extra deductions beyond absence live in deductions - absence; keep absence as absence component
    extra = max(0.0, float(slip.deductions or 0) - absence) if slip.deductions else 0.0
    # When writing via form we set absence and recompute deductions = absence (+ keep only absence unless notes)
    slip.gross_pay = round(base + ot + bonus, 2)
    slip.deductions = round(absence + extra, 2) if extra else round(absence, 2)
    slip.net_pay = round(slip.gross_pay - slip.deductions, 2)


def _apply_paid_flag(slip: Payslip, *, mark_paid: bool | None, status: str | None) -> None:
    want_paid = mark_paid
    if want_paid is None and status:
        want_paid = status == "paid"
    if want_paid is True:
        slip.status = "paid"
        slip.paid = True
        if slip.paid_at is None:
            slip.paid_at = datetime.now(timezone.utc)
    elif want_paid is False or status == "draft":
        slip.status = "draft"
        slip.paid = False
        slip.paid_at = None


@router.post("/employees/{employee_id}/payslips", response_model=PayslipOut)
async def create_payslip(
    employee_id: int,
    body: PayslipWriteIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:manage")),
):
    await _get_staff_user(db, employee_id)
    if body.period_end < body.period_start:
        raise ValidationError("period_end must be >= period_start")
    code = f"LOC-PS-{employee_id}-{body.period_start.strftime('%Y%m')}"
    if await db.scalar(select(Payslip.id).where(Payslip.code == code, Payslip.deleted_at.is_(None))):
        code = f"LOC-PS-{employee_id}-{body.period_start.strftime('%Y%m%d')}-{int(datetime.now().timestamp()) % 100000}"
    slip = Payslip(
        employee_id=employee_id,
        code=code[:40],
        period_start=body.period_start,
        period_end=body.period_end,
        base_salary=float(body.base_salary or 0),
        overtime=float(body.overtime or 0),
        absence=float(body.absence or 0),
        bonus=float(body.bonus or 0),
        deductions=float(body.absence or 0),
        currency=(body.currency or "IQD")[:8],
        notes=body.notes,
        source="local",
        status="draft",
        paid=False,
    )
    _recompute_payslip_totals(slip)
    _apply_paid_flag(slip, mark_paid=body.mark_paid, status=body.status)
    db.add(slip)
    await db.commit()
    await db.refresh(slip)
    return PayslipOut.model_validate(slip)


@router.patch("/payslips/{payslip_id}", response_model=PayslipOut)
async def update_payslip(
    payslip_id: int,
    body: PayslipUpdateIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:manage")),
):
    slip = await db.get(Payslip, payslip_id)
    if not slip or slip.deleted_at is not None:
        raise NotFoundError("Payslip not found")
    if body.period_start is not None:
        slip.period_start = body.period_start
    if body.period_end is not None:
        slip.period_end = body.period_end
    if slip.period_end < slip.period_start:
        raise ValidationError("period_end must be >= period_start")
    if body.base_salary is not None:
        slip.base_salary = float(body.base_salary)
    if body.overtime is not None:
        slip.overtime = float(body.overtime)
    if body.absence is not None:
        slip.absence = float(body.absence)
        # Reset deductions to absence when absence is explicitly set (extra kept via recompute only if deductions > absence)
    if body.bonus is not None:
        slip.bonus = float(body.bonus)
    if body.currency is not None:
        slip.currency = body.currency[:8]
    if body.notes is not None:
        slip.notes = body.notes
    # When editing amounts, treat deductions as absence-only unless we had extra
    if body.absence is not None:
        slip.deductions = float(body.absence)
    _recompute_payslip_totals(slip)
    _apply_paid_flag(slip, mark_paid=body.mark_paid, status=body.status)
    # Editing makes it a managed local record while keeping daftra_id history if present
    if not slip.source:
        slip.source = "local"
    await db.commit()
    await db.refresh(slip)
    return PayslipOut.model_validate(slip)


@router.delete("/payslips/{payslip_id}")
async def delete_payslip(
    payslip_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:manage")),
):
    slip = await db.get(Payslip, payslip_id)
    if not slip or slip.deleted_at is not None:
        raise NotFoundError("Payslip not found")
    slip.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.get("/payroll/report", response_model=PayrollReportOut)
async def payroll_report(
    date_from: date = Query(..., alias="from"),
    date_to: date = Query(..., alias="to"),
    department_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_permission("hr:read", "users:read", "dashboard:read", "hr:manage")),
):
    if date_to < date_from:
        raise ValidationError("to must be >= from")
    stmt = (
        select(Payslip, User)
        .join(User, User.id == Payslip.employee_id)
        .where(
            Payslip.deleted_at.is_(None),
            Payslip.period_end >= date_from,
            Payslip.period_start <= date_to,
            User.deleted_at.is_(None),
            User.is_staff.is_(True),
        )
        .order_by(Payslip.period_end.desc(), User.full_name.asc())
    )
    if department_id:
        stmt = stmt.where(User.department_id == department_id)
    rows_db = (await db.execute(stmt)).all()

    rows: list[PayrollReportRow] = []
    total_gross = total_ded = total_bonus = total_net = 0.0
    employees: set[int] = set()
    currency = "IQD"
    for slip, emp in rows_db:
        currency = slip.currency or currency
        total_gross += float(slip.gross_pay or 0)
        total_ded += float(slip.deductions or 0)
        total_bonus += float(getattr(slip, "bonus", 0) or 0)
        total_net += float(slip.net_pay or 0)
        employees.add(emp.id)
        rows.append(PayrollReportRow(
            payslip_id=slip.id,
            employee_id=emp.id,
            employee_name=emp.full_name,
            department=emp.department,
            code=slip.code,
            period_start=slip.period_start,
            period_end=slip.period_end,
            base_salary=float(slip.base_salary or 0),
            overtime=float(slip.overtime or 0),
            absence=float(slip.absence or 0),
            bonus=float(getattr(slip, "bonus", 0) or 0),
            gross_pay=float(slip.gross_pay or 0),
            deductions=float(slip.deductions or 0),
            net_pay=float(slip.net_pay or 0),
            currency=slip.currency or "IQD",
            status=getattr(slip, "status", None) or ("paid" if slip.paid else "draft"),
            source=getattr(slip, "source", None) or ("daftra" if slip.daftra_id else "local"),
            paid=bool(slip.paid),
            paid_at=slip.paid_at,
        ))

    return PayrollReportOut(
        period_start=date_from,
        period_end=date_to,
        currency=currency,
        total_gross=round(total_gross, 2),
        total_deductions=round(total_ded, 2),
        total_bonus=round(total_bonus, 2),
        total_net=round(total_net, 2),
        headcount=len(employees),
        payslip_count=len(rows),
        rows=rows,
    )
