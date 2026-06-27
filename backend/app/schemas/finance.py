"""Finance schemas: Quotation, Invoice, Payment, Expense."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class LineItemIn(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: float = 1.0
    unit: str = "pcs"
    unit_price: float = 0.0
    discount_pct: float = 0.0
    tax_rate: float = 0.0


class LineItemOut(ORMModel, LineItemIn):
    id: int
    line_total: float


class QuotationBase(BaseModel):
    customer_id: int
    order_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    issue_date: date
    valid_until: Optional[date] = None
    currency: str = "USD"
    notes: Optional[str] = None


class QuotationCreate(QuotationBase):
    items: List[LineItemIn] = []


class QuotationOut(ORMModel, QuotationBase):
    id: int
    code: str
    status: str
    subtotal: float
    discount_total: float
    tax_total: float
    grand_total: float
    accepted_at: Optional[datetime] = None
    items: List[LineItemOut] = []
    created_at: datetime


class InvoiceBase(BaseModel):
    customer_id: int
    order_id: Optional[int] = None
    quotation_id: Optional[int] = None
    issue_date: date
    due_date: Optional[date] = None
    currency: str = "USD"
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    items: List[LineItemIn] = []


class InvoiceOut(ORMModel, InvoiceBase):
    id: int
    code: str
    status: str
    subtotal: float
    discount_total: float
    tax_total: float
    grand_total: float
    paid_total: float
    balance: float
    portal_visible: bool = False
    pdf_lang: Optional[str] = None
    issued_at: Optional[datetime] = None
    items: List[LineItemOut] = []
    created_at: datetime


class InvoiceDetailOut(InvoiceOut):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_code: Optional[str] = None


class InvoiceUpdate(BaseModel):
    portal_visible: Optional[bool] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    pdf_lang: Optional[str] = None


class InvoiceFromOrderIn(BaseModel):
    lang: str = "en"
    portal_visible: bool = False
    due_days: int = 30
    notes: Optional[str] = None


class PaymentCreate(BaseModel):
    invoice_id: Optional[int] = None
    customer_id: int
    method: str = "cash"
    amount: float
    currency: str = "USD"
    paid_at: datetime
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(ORMModel, PaymentCreate):
    id: int


class ExpenseCreate(BaseModel):
    category: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    spent_at: date
    receipt_url: Optional[str] = None


class ExpenseOut(ORMModel, ExpenseCreate):
    id: int
