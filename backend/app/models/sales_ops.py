"""Sales extensions: credit notes, returns, recurring, installments, POS, purchases, settings."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


class CreditNote(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "credit_notes"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    invoice_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(40), default="issued", nullable=False, index=True)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)

    items: Mapped[List["CreditNoteItem"]] = relationship(
        back_populates="credit_note", cascade="all, delete-orphan", order_by="CreditNoteItem.id")


class CreditNoteItem(IntPK, TimestampMixin, Base):
    __tablename__ = "credit_note_items"

    credit_note_id: Mapped[int] = mapped_column(ForeignKey("credit_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    credit_note: Mapped[CreditNote] = relationship(back_populates="items")


class SalesReturn(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "sales_returns"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    invoice_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    credit_note_id: Mapped[Optional[int]] = mapped_column(ForeignKey("credit_notes.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="completed", nullable=False, index=True)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    restock: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    items: Mapped[List["SalesReturnItem"]] = relationship(
        back_populates="sales_return", cascade="all, delete-orphan", order_by="SalesReturnItem.id")


class SalesReturnItem(IntPK, TimestampMixin, Base):
    __tablename__ = "sales_return_items"

    sales_return_id: Mapped[int] = mapped_column(ForeignKey("sales_returns.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    material_id: Mapped[Optional[int]] = mapped_column(ForeignKey("materials.id", ondelete="SET NULL"), nullable=True)

    sales_return: Mapped[SalesReturn] = relationship(back_populates="items")


class RecurringInvoice(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "recurring_invoices"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    interval: Mapped[str] = mapped_column(String(20), default="monthly", nullable=False)  # weekly|monthly|yearly
    next_run: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_invoice_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)

    items: Mapped[List["RecurringInvoiceItem"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan", order_by="RecurringInvoiceItem.id")


class RecurringInvoiceItem(IntPK, TimestampMixin, Base):
    __tablename__ = "recurring_invoice_items"

    schedule_id: Mapped[int] = mapped_column(ForeignKey("recurring_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    schedule: Mapped[RecurringInvoice] = relationship(back_populates="items")


class InstallmentPlan(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "installment_plans"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    installments: Mapped[List["Installment"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="Installment.sequence")


class Installment(IntPK, TimestampMixin, Base):
    __tablename__ = "installments"

    plan_id: Mapped[int] = mapped_column(ForeignKey("installment_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)  # pending|paid|overdue
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)

    plan: Mapped[InstallmentPlan] = relationship(back_populates="installments")


class PosSession(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "pos_sessions"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    cashier_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    opening_float: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    closing_cash: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)  # open|closed
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PosSale(IntPK, TimestampMixin, Base):
    __tablename__ = "pos_sales"

    session_id: Mapped[int] = mapped_column(ForeignKey("pos_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    payment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    method: Mapped[str] = mapped_column(String(40), default="cash", nullable=False)


class Vendor(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "vendors"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PurchaseOrder(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "purchase_orders"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), default="draft", nullable=False, index=True)  # draft|ordered|received|cancelled
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    items: Mapped[List["PurchaseOrderItem"]] = relationship(
        back_populates="purchase_order", cascade="all, delete-orphan", order_by="PurchaseOrderItem.id")


class PurchaseOrderItem(IntPK, TimestampMixin, Base):
    __tablename__ = "purchase_order_items"

    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id: Mapped[Optional[int]] = mapped_column(ForeignKey("materials.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    received_qty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    purchase_order: Mapped[PurchaseOrder] = relationship(back_populates="items")


class SalesSettings(IntPK, TimestampMixin, Base):
    __tablename__ = "sales_settings"

    default_currency: Mapped[str] = mapped_column(String(8), default="IQD", nullable=False)
    default_tax_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    default_due_days: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    invoice_prefix: Mapped[str] = mapped_column(String(20), default="INV", nullable=False)
    credit_note_prefix: Mapped[str] = mapped_column(String(20), default="CN", nullable=False)
    quotation_prefix: Mapped[str] = mapped_column(String(20), default="QT", nullable=False)
    payment_terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class DocumentTemplate(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "document_templates"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)  # invoice|quotation|credit_note
    header_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    footer_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    locale: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
