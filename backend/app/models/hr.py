"""HR domain: contracts, requests, payslips, attendance, adjustments."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


CONTRACT_STATUSES = (
    "active",
    "expired",
    "under_review",
    "replacement",
    "cancelled",
    "suspended",
    "draft",
)

HR_REQUEST_STATUSES = ("pending", "approved", "rejected", "cancelled")
HR_REQUEST_TYPES = ("leave", "permission", "overtime", "document", "other")
ATTENDANCE_STATUSES = ("present", "absent", "late", "on_leave")
PAYROLL_ADJUSTMENT_KINDS = ("bonus", "deduction", "overtime", "other")
PAYSLIP_STATUSES = ("draft", "confirmed", "paid")
PAYSLIP_SOURCES = ("local", "daftra")


class Designation(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    """Job title / designation (synced from Daftra HR)."""

    __tablename__ = "designations"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)
    daftra_department_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, index=True)
    daftra_role_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    employment_type_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    employment_level_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    salary_structure_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    payroll_frequency: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    currency_code: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)


class StaffProfile(IntPK, TimestampMixin, Base):
    """Extended employee profile synced from Daftra Get All Staff."""

    __tablename__ = "staff_profiles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)
    employee_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, index=True)
    staff_type: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # employee|user
    can_access_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    designation_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("designations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    address1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    home_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    business_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    fax: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    citizenship_status: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    official_id: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    hire_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    residence_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hourly_rate_currency: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    employment_type_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    employment_level_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class EmployeeContract(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "employee_contracts"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    job_level: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="active", nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    join_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    signed_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    probation_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    salary: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="IQD", nullable=False)
    salary_template: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # monthly/weekly/daily
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class HrRequest(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "hr_requests"

    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    request_type: Mapped[str] = mapped_column(String(40), default="leave", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    starts_on: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    ends_on: Mapped[Optional[date]] = mapped_column(Date, nullable=True)


class Payslip(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "payslips"

    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    gross_pay: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    deductions: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    net_pay: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    base_salary: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overtime: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    absence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    bonus: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="IQD", nullable=False)
    paid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="paid", nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(20), default="local", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)


class PayrollAdjustment(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    """Manual bonus / deduction / overtime for a payroll month."""

    __tablename__ = "payroll_adjustments"

    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(40), default="bonus", nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="IQD", nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )


class AttendanceRecord(IntPK, TimestampMixin, Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("employee_id", "work_date", name="uq_attendance_employee_date"),
    )

    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    work_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), default="present", nullable=False, index=True)
    check_in: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    check_out: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deduction_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    marked_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
