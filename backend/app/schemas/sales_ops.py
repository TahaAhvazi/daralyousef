"""Schemas for sales ops modules."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class LineIn(BaseModel):
    name: str
    quantity: float = 1.0
    unit_price: float = 0.0
    tax_rate: float = 0.0
    material_id: Optional[int] = None


class CreditNoteCreate(BaseModel):
    customer_id: int
    invoice_id: Optional[int] = None
    issue_date: date
    currency: str = "USD"
    reason: Optional[str] = None
    notes: Optional[str] = None
    items: List[LineIn] = Field(default_factory=list)


class CreditNoteItemOut(ORMModel):
    id: int
    name: str
    description: Optional[str] = None
    quantity: float
    unit_price: float
    tax_rate: float
    line_total: float


class CreditNoteOut(ORMModel):
    id: int
    code: str
    customer_id: int
    invoice_id: Optional[int] = None
    status: str
    issue_date: date
    currency: str
    subtotal: float
    tax_total: float
    grand_total: float
    reason: Optional[str] = None
    notes: Optional[str] = None
    daftra_id: Optional[str] = None
    items: List[CreditNoteItemOut] = []


class SalesReturnCreate(BaseModel):
    customer_id: int
    invoice_id: Optional[int] = None
    return_date: date
    currency: str = "USD"
    restock: bool = False
    notes: Optional[str] = None
    items: List[LineIn] = Field(default_factory=list)
    create_credit_note: bool = True


class SalesReturnItemOut(ORMModel):
    id: int
    name: str
    quantity: float
    unit_price: float
    line_total: float
    material_id: Optional[int] = None


class SalesReturnOut(ORMModel):
    id: int
    code: str
    customer_id: int
    invoice_id: Optional[int] = None
    credit_note_id: Optional[int] = None
    status: str
    return_date: date
    currency: str
    grand_total: float
    restock: bool
    notes: Optional[str] = None
    items: List[SalesReturnItemOut] = []


class RecurringCreate(BaseModel):
    customer_id: int
    title: str
    interval: str = "monthly"
    next_run: date
    end_date: Optional[date] = None
    currency: str = "USD"
    notes: Optional[str] = None
    items: List[LineIn] = Field(default_factory=list)


class RecurringItemOut(ORMModel):
    id: int
    name: str
    quantity: float
    unit_price: float
    tax_rate: float
    line_total: float


class RecurringOut(ORMModel):
    id: int
    code: str
    customer_id: int
    title: str
    interval: str
    next_run: date
    end_date: Optional[date] = None
    is_active: bool
    currency: str
    subtotal: float
    tax_total: float
    grand_total: float
    notes: Optional[str] = None
    last_invoice_id: Optional[int] = None
    daftra_id: Optional[str] = None
    items: List[RecurringItemOut] = []


class InstallmentPlanCreate(BaseModel):
    invoice_id: int
    count: int = Field(ge=2, le=36)
    first_due: date
    interval_days: int = 30
    notes: Optional[str] = None


class InstallmentOut(ORMModel):
    id: int
    sequence: int
    amount: float
    due_date: date
    status: str
    paid_at: Optional[datetime] = None
    payment_id: Optional[int] = None


class InstallmentPlanOut(ORMModel):
    id: int
    code: str
    invoice_id: int
    customer_id: int
    total_amount: float
    currency: str
    status: str
    notes: Optional[str] = None
    installments: List[InstallmentOut] = []


class PosSessionOpen(BaseModel):
    opening_float: float = 0.0
    notes: Optional[str] = None


class PosSessionClose(BaseModel):
    closing_cash: float
    notes: Optional[str] = None


class PosSessionOut(ORMModel):
    id: int
    code: str
    cashier_id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None
    opening_float: float
    closing_cash: Optional[float] = None
    status: str
    notes: Optional[str] = None


class PosCartLine(BaseModel):
    name: str
    quantity: float = 1.0
    unit_price: float
    tax_rate: float = 0.0
    product_id: Optional[int] = None


class PosCheckout(BaseModel):
    session_id: int
    customer_id: Optional[int] = None
    method: str = "cash"
    currency: str = "USD"
    items: List[PosCartLine]
    notes: Optional[str] = None


class PosSaleOut(ORMModel):
    id: int
    session_id: int
    invoice_id: Optional[int] = None
    payment_id: Optional[int] = None
    customer_id: Optional[int] = None
    total: float
    currency: str
    method: str


class VendorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class VendorOut(ORMModel):
    id: int
    code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class PurchaseItemIn(BaseModel):
    name: str
    quantity: float = 1.0
    unit_price: float = 0.0
    material_id: Optional[int] = None


class PurchaseOrderCreate(BaseModel):
    vendor_id: int
    order_date: date
    expected_date: Optional[date] = None
    currency: str = "USD"
    notes: Optional[str] = None
    items: List[PurchaseItemIn] = Field(default_factory=list)


class PurchaseOrderItemOut(ORMModel):
    id: int
    name: str
    quantity: float
    unit_price: float
    line_total: float
    material_id: Optional[int] = None
    received_qty: float


class PurchaseOrderOut(ORMModel):
    id: int
    code: str
    vendor_id: int
    status: str
    order_date: date
    expected_date: Optional[date] = None
    currency: str
    grand_total: float
    notes: Optional[str] = None
    items: List[PurchaseOrderItemOut] = []


class SalesSettingsOut(ORMModel):
    id: int
    default_currency: str
    default_tax_pct: float
    default_due_days: int
    invoice_prefix: str
    credit_note_prefix: str
    quotation_prefix: str
    payment_terms: Optional[str] = None


class SalesSettingsUpdate(BaseModel):
    default_currency: Optional[str] = None
    default_tax_pct: Optional[float] = None
    default_due_days: Optional[int] = None
    invoice_prefix: Optional[str] = None
    credit_note_prefix: Optional[str] = None
    quotation_prefix: Optional[str] = None
    payment_terms: Optional[str] = None


class DocumentTemplateCreate(BaseModel):
    name: str
    doc_type: str
    header_html: Optional[str] = None
    footer_html: Optional[str] = None
    is_default: bool = False
    locale: str = "en"


class DocumentTemplateOut(ORMModel):
    id: int
    code: str
    name: str
    doc_type: str
    header_html: Optional[str] = None
    footer_html: Optional[str] = None
    is_default: bool
    locale: str


class SalesReportOut(BaseModel):
    period_start: date
    period_end: date
    currency: str
    invoice_count: int
    invoice_total: float
    paid_total: float
    unpaid_balance: float
    credit_note_total: float
    payment_count: int
    by_status: List[dict]
    top_customers: List[dict]


class CustomerSummaryOut(BaseModel):
    customer_id: int
    orders_count: int
    invoices_count: int
    quotations_count: int
    tickets_count: int
    payments_count: int
    invoices_balance: float
    invoices_paid: float
    currency: str
