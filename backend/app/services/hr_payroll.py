"""Local payroll draft calculation (attendance ÷ 30 + adjustments)."""
from __future__ import annotations

import calendar
from datetime import date
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hr import (
    AttendanceRecord,
    EmployeeContract,
    PayrollAdjustment,
    Payslip,
)


def month_bounds(year: int, month: int) -> Tuple[date, date]:
    last = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last)


async def employee_base_salary(
    db: AsyncSession, employee_id: int,
) -> Tuple[float, str]:
    res = await db.execute(
        select(EmployeeContract)
        .where(
            EmployeeContract.employee_id == employee_id,
            EmployeeContract.deleted_at.is_(None),
        )
        .order_by(EmployeeContract.is_primary.desc(), EmployeeContract.id.asc())
        .limit(1)
    )
    contract = res.scalar_one_or_none()
    if contract and float(contract.salary or 0) > 0:
        return float(contract.salary), (contract.currency or "IQD")[:8]
    return 0.0, "IQD"


def daily_rate(base_salary: float) -> float:
    return round(float(base_salary or 0) / 30.0, 2)


async def compute_absence_deduction(
    db: AsyncSession,
    *,
    employee_id: int,
    period_start: date,
    period_end: date,
    base: float,
) -> Tuple[float, int]:
    rate = daily_rate(base)
    res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.work_date >= period_start,
            AttendanceRecord.work_date <= period_end,
            AttendanceRecord.status == "absent",
        )
    )
    rows = list(res.scalars().all())
    total = 0.0
    for r in rows:
        if r.deduction_amount is not None:
            total += float(r.deduction_amount)
        else:
            total += rate
    return round(total, 2), len(rows)


async def list_month_adjustments(
    db: AsyncSession, employee_id: int, year: int, month: int,
) -> list[PayrollAdjustment]:
    res = await db.execute(
        select(PayrollAdjustment).where(
            PayrollAdjustment.employee_id == employee_id,
            PayrollAdjustment.period_year == year,
            PayrollAdjustment.period_month == month,
            PayrollAdjustment.deleted_at.is_(None),
        ).order_by(PayrollAdjustment.id.desc())
    )
    return list(res.scalars().all())


def sum_adjustments(rows: list[PayrollAdjustment]) -> Tuple[float, float, float]:
    bonus = overtime = extra = 0.0
    for a in rows:
        amt = float(a.amount or 0)
        if a.kind == "bonus":
            bonus += amt
        elif a.kind == "overtime":
            overtime += amt
        elif a.kind in ("deduction", "other"):
            extra += amt
    return round(bonus, 2), round(overtime, 2), round(extra, 2)


async def build_draft_amounts(
    db: AsyncSession, employee_id: int, year: int, month: int,
) -> dict:
    period_start, period_end = month_bounds(year, month)
    base, currency = await employee_base_salary(db, employee_id)
    absence_deduction, absent_days = await compute_absence_deduction(
        db,
        employee_id=employee_id,
        period_start=period_start,
        period_end=period_end,
        base=base,
    )
    adjustments = await list_month_adjustments(db, employee_id, year, month)
    bonus, overtime, extra_deduction = sum_adjustments(adjustments)
    gross = round(base + overtime + bonus, 2)
    deductions = round(absence_deduction + extra_deduction, 2)
    net = round(gross - deductions, 2)
    return {
        "period_start": period_start,
        "period_end": period_end,
        "currency": currency,
        "base_salary": base,
        "daily_rate": daily_rate(base),
        "absent_days": absent_days,
        "absence_deduction": absence_deduction,
        "overtime": overtime,
        "bonus": bonus,
        "extra_deduction": extra_deduction,
        "gross_pay": gross,
        "deductions": deductions,
        "net_pay": net,
        "adjustments": adjustments,
    }


async def find_local_draft(
    db: AsyncSession, employee_id: int, period_start: date, period_end: date,
) -> Optional[Payslip]:
    res = await db.execute(
        select(Payslip).where(
            Payslip.employee_id == employee_id,
            Payslip.period_start == period_start,
            Payslip.period_end == period_end,
            Payslip.source == "local",
            Payslip.deleted_at.is_(None),
            Payslip.status == "draft",
        ).limit(1)
    )
    return res.scalar_one_or_none()


async def find_local_period_slip(
    db: AsyncSession, employee_id: int, period_start: date, period_end: date,
) -> Optional[Payslip]:
    """Any non-deleted local slip for the period (draft or paid)."""
    res = await db.execute(
        select(Payslip).where(
            Payslip.employee_id == employee_id,
            Payslip.period_start == period_start,
            Payslip.period_end == period_end,
            Payslip.source == "local",
            Payslip.deleted_at.is_(None),
        ).order_by(Payslip.id.desc()).limit(1)
    )
    return res.scalar_one_or_none()
