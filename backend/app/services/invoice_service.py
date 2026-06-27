"""Load invoice data and build PDF context."""
from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import BASE_DIR, settings
from app.models.branding import BrandSettings
from app.models.customer import Company, Customer
from app.models.finance import Invoice
from app.models.order import Order
from app.services.invoice_pdf import InvoicePdfContext, InvoicePdfLine, generate_invoice_pdf


async def _load_invoice(db: AsyncSession, invoice_id: int) -> Invoice:
    res = await db.execute(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Invoice not found")
    return inv


def _default_logo_paths() -> list[Path]:
    return [
        BASE_DIR / "app" / "assets" / "logo.jpg",
        BASE_DIR.parent / "frontend" / "assets" / "logo.jpg",
        BASE_DIR.parent / "frontend" / "public" / "logo.jpg",
    ]


def _resolve_logo_path(logo_url: Optional[str]) -> Optional[Path]:
    if logo_url and logo_url.startswith("/uploads/"):
        uploaded = settings.UPLOAD_DIR / logo_url.removeprefix("/uploads/")
        if uploaded.exists():
            return uploaded
    for path in _default_logo_paths():
        if path.exists():
            return path
    return None


async def build_pdf_context(db: AsyncSession, invoice: Invoice, lang: str) -> InvoicePdfContext:
    cust_res = await db.execute(select(Customer).where(Customer.id == invoice.customer_id))
    customer = cust_res.scalar_one_or_none()
    company = None
    if customer and customer.company_id:
        c_res = await db.execute(select(Company).where(Company.id == customer.company_id))
        company = c_res.scalar_one_or_none()

    order_code = None
    if invoice.order_id:
        o_res = await db.execute(select(Order).where(Order.id == invoice.order_id))
        order = o_res.scalar_one_or_none()
        if order:
            order_code = order.code

    brand_res = await db.execute(select(BrandSettings).where(BrandSettings.id == 1))
    brand = brand_res.scalar_one_or_none()

    if lang == "ar":
        company_name = brand.app_name_ar if brand else "مطبعة دار اليوسف"
        tagline = brand.tagline_ar if brand else ""
    else:
        company_name = brand.app_name if brand else "Dar Al-Yousef Printing"
        tagline = brand.tagline if brand else ""

    addr_parts = []
    if company and company.address:
        addr_parts.append(company.address)
        if company.city:
            addr_parts.append(company.city)
        if company.country:
            addr_parts.append(company.country)
    elif customer:
        if customer.address:
            addr_parts.append(customer.address)
        if customer.city:
            addr_parts.append(customer.city)

    cust_addr_parts = []
    if customer:
        if customer.address:
            cust_addr_parts.append(customer.address)
        if customer.city:
            cust_addr_parts.append(customer.city)
        if customer.country:
            cust_addr_parts.append(customer.country)

    items = [
        InvoicePdfLine(
            name=it.name,
            description=it.description,
            quantity=it.quantity,
            unit=it.unit,
            unit_price=it.unit_price,
            discount_pct=it.discount_pct,
            tax_rate=it.tax_rate,
            line_total=it.line_total,
        )
        for it in invoice.items
    ]

    return InvoicePdfContext(
        lang=lang,
        invoice_code=invoice.code,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        status=invoice.status,
        currency=invoice.currency,
        subtotal=invoice.subtotal,
        discount_total=invoice.discount_total,
        tax_total=invoice.tax_total,
        grand_total=invoice.grand_total,
        paid_total=invoice.paid_total,
        balance=invoice.balance,
        notes=invoice.notes,
        order_code=order_code,
        customer_name=customer.full_name if customer else "—",
        customer_email=customer.email if customer else None,
        customer_phone=customer.phone if customer else None,
        customer_address=", ".join(cust_addr_parts) if cust_addr_parts else None,
        company_name=company_name,
        company_tagline=tagline,
        company_address=", ".join(addr_parts) if addr_parts else None,
        brand_color=brand.brand_color if brand else "#2D498A",
        logo_path=_resolve_logo_path(brand.logo_url if brand else None),
        items=items,
    )


async def render_invoice_pdf(db: AsyncSession, invoice_id: int, lang: str) -> bytes:
    inv = await _load_invoice(db, invoice_id)
    ctx = await build_pdf_context(db, inv, lang)
    return generate_invoice_pdf(ctx)


def default_due_date(issue: date, days: int = 30) -> date:
    return issue + timedelta(days=days)
