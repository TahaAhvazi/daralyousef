"""Finance: Quotation, QuotationItem, Invoice, InvoiceItem, Payment, Expense."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


class Quotation(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "quotations"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    opportunity_id: Mapped[Optional[int]] = mapped_column(ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(40), default="draft", nullable=False, index=True)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    discount_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    items: Mapped[List["QuotationItem"]] = relationship(
        back_populates="quotation", cascade="all, delete-orphan", order_by="QuotationItem.id")


class QuotationItem(IntPK, TimestampMixin, Base):
    __tablename__ = "quotation_items"

    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="pcs", nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    discount_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    quotation: Mapped[Quotation] = relationship(back_populates="items")


class Invoice(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "invoices"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    quotation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(40), default="unpaid", nullable=False, index=True)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    discount_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    paid_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portal_visible: Mapped[bool] = mapped_column(default=False, server_default="0", nullable=False)
    pdf_lang: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)
    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    salesperson_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )

    items: Mapped[List["InvoiceItem"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceItem.id")
    payments: Mapped[List["Payment"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(IntPK, TimestampMixin, Base):
    __tablename__ = "invoice_items"

    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="pcs", nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    discount_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    invoice: Mapped[Invoice] = relationship(back_populates="items")


class Payment(IntPK, TimestampMixin, Base):
    __tablename__ = "payments"

    invoice_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    method: Mapped[str] = mapped_column(String(40), default="cash", nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)

    invoice: Mapped[Optional[Invoice]] = relationship(back_populates="payments")


class Expense(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "expenses"

    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    spent_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    daftra_id: Mapped[Optional[str]] = mapped_column(String(40), unique=True, index=True, nullable=True)
