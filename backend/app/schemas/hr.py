"""HR dashboard and employee profile schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ContractStatusCount(BaseModel):
    status: str
    count: int


class PendingHrRequestOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    employee_avatar: Optional[str] = None
    request_type: str
    subject: str
    status: str
    starts_on: Optional[date] = None
    ends_on: Optional[date] = None
    created_at: datetime


class PayrollSummary(BaseModel):
    currency: str
    period_start: date
    period_end: date
    total_gross: float
    total_deductions: float
    total_net: float
    payslip_count: int


class ExpiringContractOut(BaseModel):
    id: int
    code: str
    employee_id: int
    employee_name: str
    employee_avatar: Optional[str] = None
    title: Optional[str] = None
    start_date: date
    end_date: date
    status: str


class AttendanceBreakdown(BaseModel):
    status: str
    count: int
    pct: float


class NamedCount(BaseModel):
    id: Optional[int] = None
    name: str
    count: int


class WorkforceSummary(BaseModel):
    employees_total: int = 0
    employees_active: int = 0
    employees_inactive: int = 0
    synced_from_daftra: int = 0
    with_department: int = 0
    with_title: int = 0
    with_contract: int = 0
    by_department: List[NamedCount] = []
    by_title: List[NamedCount] = []


class HrDashboardSummary(BaseModel):
    contracts_by_status: List[ContractStatusCount]
    contracts_total: int
    pending_requests: List[PendingHrRequestOut]
    pending_requests_total: int
    payroll: PayrollSummary
    expiring_contracts: List[ExpiringContractOut]
    attendance: List[AttendanceBreakdown]
    attendance_total: int
    workforce: WorkforceSummary = WorkforceSummary()


class DesignationOut(ORMModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool = True
    department_id: Optional[int] = None
    daftra_id: Optional[str] = None
    daftra_department_id: Optional[str] = None
    currency_code: Optional[str] = None


class StaffProfileOut(ORMModel):
    employee_code: Optional[str] = None
    staff_type: Optional[str] = None
    can_access_system: bool = False
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    home_phone: Optional[str] = None
    business_phone: Optional[str] = None
    fax: Optional[str] = None
    nationality: Optional[str] = None
    citizenship_status: Optional[str] = None
    official_id: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    hire_date: Optional[date] = None
    residence_expiry: Optional[date] = None
    hourly_rate: Optional[float] = None
    hourly_rate_currency: Optional[str] = None
    employment_type_id: Optional[str] = None
    employment_level_id: Optional[str] = None
    notes: Optional[str] = None
    daftra_id: Optional[str] = None


class EmployeeContractOut(ORMModel):
    id: int
    code: str
    employee_id: int
    title: Optional[str] = None
    job_title: Optional[str] = None
    job_level: Optional[str] = None
    description: Optional[str] = None
    status: str
    start_date: date
    end_date: Optional[date] = None
    join_date: Optional[date] = None
    signed_at: Optional[date] = None
    probation_end: Optional[date] = None
    salary: float
    currency: str
    salary_template: Optional[str] = None
    is_primary: bool = True
    notes: Optional[str] = None


class PayslipOut(ORMModel):
    id: int
    code: str
    period_start: date
    period_end: date
    gross_pay: float
    deductions: float
    net_pay: float
    base_salary: float = 0.0
    overtime: float = 0.0
    absence: float = 0.0
    bonus: float = 0.0
    currency: str
    paid: bool
    paid_at: Optional[datetime] = None
    status: str = "paid"
    source: str = "local"
    notes: Optional[str] = None
    daftra_id: Optional[str] = None


class PayrollMonthPoint(BaseModel):
    """One calendar month of payroll for chart + breakdown matrix."""

    year: int
    month: int
    label: str
    base_salary: float = 0.0
    overtime: float = 0.0
    absence: float = 0.0
    bonus: float = 0.0
    gross_pay: float = 0.0
    deductions: float = 0.0
    net_pay: float = 0.0


class EmployeePayrollOverview(BaseModel):
    currency: str
    period_start: date
    period_end: date
    average_gross: float = 0.0
    average_net: float = 0.0
    total_net: float = 0.0
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_base_salary: float = 0.0
    total_overtime: float = 0.0
    total_absence: float = 0.0
    total_bonus: float = 0.0
    payslip_count: int = 0
    months: List[PayrollMonthPoint] = []


class AttendanceOut(ORMModel):
    id: int
    work_date: date
    status: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None
    deduction_amount: Optional[float] = None
    marked_by_id: Optional[int] = None


class AttendanceDayIn(BaseModel):
    date: date
    status: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None
    deduction_amount: Optional[float] = None


class AttendanceBulkIn(BaseModel):
    start_date: date
    end_date: date
    status: str = "present"
    weekdays_only: bool = True


class AttendanceMonthDay(BaseModel):
    date: date
    day: int
    weekday: int  # 0=Mon … 6=Sun
    status: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None
    deduction_amount: Optional[float] = None
    record_id: Optional[int] = None


class AttendanceMonthOut(BaseModel):
    employee_id: int
    year: int
    month: int
    daily_rate: float = 0.0
    currency: str = "IQD"
    base_salary: float = 0.0
    counts: dict[str, int] = {}
    days: List[AttendanceMonthDay] = []


class PayrollAdjustmentIn(BaseModel):
    period_year: int
    period_month: int
    kind: str = "bonus"
    amount: float
    currency: str = "IQD"
    reason: Optional[str] = None


class PayrollAdjustmentOut(ORMModel):
    id: int
    employee_id: int
    period_year: int
    period_month: int
    kind: str
    amount: float
    currency: str
    reason: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime


class PayslipDraftPreview(BaseModel):
    employee_id: int
    year: int
    month: int
    period_start: date
    period_end: date
    currency: str
    base_salary: float
    daily_rate: float
    absent_days: int
    absence_deduction: float
    overtime: float
    bonus: float
    extra_deduction: float
    gross_pay: float
    deductions: float
    net_pay: float
    adjustments: List[PayrollAdjustmentOut] = []
    draft_payslip: Optional[PayslipOut] = None


class PayslipWriteIn(BaseModel):
    period_start: date
    period_end: date
    base_salary: float = 0.0
    overtime: float = 0.0
    absence: float = 0.0
    bonus: float = 0.0
    currency: str = "IQD"
    notes: Optional[str] = None
    status: str = "draft"  # draft | paid
    mark_paid: bool = False


class PayslipUpdateIn(BaseModel):
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    base_salary: Optional[float] = None
    overtime: Optional[float] = None
    absence: Optional[float] = None
    bonus: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    mark_paid: Optional[bool] = None


class PayrollReportRow(BaseModel):
    payslip_id: int
    employee_id: int
    employee_name: str
    department: Optional[str] = None
    code: str
    period_start: date
    period_end: date
    base_salary: float
    overtime: float
    absence: float
    bonus: float
    gross_pay: float
    deductions: float
    net_pay: float
    currency: str
    status: str
    source: str
    paid: bool
    paid_at: Optional[datetime] = None


class PayrollReportOut(BaseModel):
    period_start: date
    period_end: date
    currency: str = "IQD"
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_bonus: float = 0.0
    total_net: float = 0.0
    headcount: int = 0
    payslip_count: int = 0
    rows: List[PayrollReportRow] = []


class EmployeeHrActivity(BaseModel):
    id: str
    occurred_at: datetime
    kind: str
    summary: str
    meta: Optional[str] = None


class EmployeeProjectOut(BaseModel):
    order_id: int
    code: str
    title: Optional[str] = None
    status: str
    priority: str
    deadline: Optional[date] = None
    workflow_status: Optional[str] = None
    role: str  # assignee | owner
    on_board: bool = True
    grand_total: float = 0.0
    currency: str = "USD"


class EmployeeHrProfile(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    is_active: bool
    is_staff: bool = True
    daftra_id: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    roles: List[str] = []
    role_slugs: List[str] = []
    profile: Optional[StaffProfileOut] = None
    primary_contract: Optional[EmployeeContractOut] = None
    contracts: List[EmployeeContractOut] = []
    payslips: List[PayslipOut] = []
    attendance: List[AttendanceOut] = []
    attendance_summary: List[AttendanceBreakdown] = []
    requests: List[PendingHrRequestOut] = []
    projects: List[EmployeeProjectOut] = []
    activity: List[EmployeeHrActivity] = []
    payroll_totals: PayrollSummary
    payroll_overview: Optional[EmployeePayrollOverview] = None
