"""Sales ops API: credit notes, returns, recurring, installments, POS, purchases, settings, reports."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import current_user, require_permissions
from app.core.exceptions import NotFoundError, ValidationError
from app.db.base import get_db
from app.models.customer import Customer
from app.models.finance import Invoice, InvoiceItem, Payment, Expense
from app.models.inventory import Material, StockMovement
from app.models.order import Order
from app.models.sales_ops import (
    CreditNote, CreditNoteItem, DocumentTemplate, Installment, InstallmentPlan,
    PosSale, PosSession, PurchaseOrder, PurchaseOrderItem, RecurringInvoice,
    RecurringInvoiceItem, SalesReturn, SalesReturnItem, SalesSettings, Vendor,
)
from app.models.support import Ticket
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.schemas.finance import ExpenseOut
from app.schemas.sales_ops import (
    CreditNoteCreate, CreditNoteOut, CustomerSummaryOut, DocumentTemplateCreate,
    DocumentTemplateOut, InstallmentPlanCreate, InstallmentPlanOut, PosCheckout,
    PosSaleOut, PosSessionClose, PosSessionOpen, PosSessionOut, PurchaseOrderCreate,
    PurchaseOrderOut, RecurringCreate, RecurringOut, SalesReportOut, SalesReturnCreate,
    SalesReturnOut, SalesSettingsOut, SalesSettingsUpdate, VendorCreate, VendorOut,
)
from app.services.audit import record as audit
from app.utils.codes import invoice_code

router = APIRouter()


def _line_totals(qty: float, price: float, tax: float = 0.0) -> tuple[float, float]:
    base = qty * price
    tax_amt = base * (tax / 100.0)
    return base + tax_amt, tax_amt


def _code(prefix: str) -> str:
    return f"{prefix}-{datetime.now(timezone.utc).strftime('%y%m%d%H%M%S')}"


async def _settings(db: AsyncSession) -> SalesSettings:
    row = (await db.execute(select(SalesSettings).limit(1))).scalar_one_or_none()
    if not row:
        row = SalesSettings()
        db.add(row)
        await db.flush()
    return row


# ── Customer summary ──────────────────────────────────────────────────────────
@router.get("/customers/{customer_id}/summary", response_model=CustomerSummaryOut)
async def customer_summary(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("crm:read")),
):
    cust = await db.get(Customer, customer_id)
    if not cust or cust.deleted_at is not None:
        raise NotFoundError("Customer not found")

    async def count(model, extra=None):
        stmt = select(func.count()).select_from(model).where(
            model.customer_id == customer_id,
        )
        if hasattr(model, "deleted_at"):
            stmt = stmt.where(model.deleted_at.is_(None))
        if extra is not None:
            stmt = stmt.where(extra)
        return int(await db.scalar(stmt) or 0)

    orders_c = await count(Order)
    inv_c = await count(Invoice)
    from app.models.finance import Quotation
    quot_c = await count(Quotation)
    tick_c = await count(Ticket)
    pay_c = int(await db.scalar(
        select(func.count()).select_from(Payment).where(Payment.customer_id == customer_id)
    ) or 0)
    bal = float(await db.scalar(
        select(func.coalesce(func.sum(Invoice.balance), 0.0)).where(
            Invoice.customer_id == customer_id, Invoice.deleted_at.is_(None))
    ) or 0)
    paid = float(await db.scalar(
        select(func.coalesce(func.sum(Invoice.paid_total), 0.0)).where(
            Invoice.customer_id == customer_id, Invoice.deleted_at.is_(None))
    ) or 0)
    cur = (await db.execute(
        select(Invoice.currency).where(Invoice.customer_id == customer_id, Invoice.deleted_at.is_(None)).limit(1)
    )).scalar_one_or_none() or "IQD"

    return CustomerSummaryOut(
        customer_id=customer_id,
        orders_count=orders_c,
        invoices_count=inv_c,
        quotations_count=quot_c,
        tickets_count=tick_c,
        payments_count=pay_c,
        invoices_balance=bal,
        invoices_paid=paid,
        currency=cur,
    )


# ── Credit notes ──────────────────────────────────────────────────────────────
@router.get("/credit-notes", response_model=PaginatedResponse[CreditNoteOut])
async def list_credit_notes(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    customer_id: Optional[int] = None, q: Optional[str] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(CreditNote).where(CreditNote.deleted_at.is_(None))
    if customer_id:
        stmt = stmt.where(CreditNote.customer_id == customer_id)
    if q:
        needle = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                CreditNote.code.ilike(needle),
                CreditNote.reason.ilike(needle),
                CreditNote.notes.ilike(needle),
            )
        )
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(CreditNote.items)).order_by(CreditNote.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[CreditNoteOut](
        items=[CreditNoteOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/credit-notes", response_model=CreditNoteOut, status_code=201)
async def create_credit_note(
    data: CreditNoteCreate, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    settings = await _settings(db)
    cn = CreditNote(
        code=_code(settings.credit_note_prefix),
        customer_id=data.customer_id,
        invoice_id=data.invoice_id,
        issue_date=data.issue_date,
        currency=data.currency,
        reason=data.reason,
        notes=data.notes,
        actor_id=user.id,
        status="issued",
    )
    sub = tax = 0.0
    for raw in data.items:
        line, t = _line_totals(raw.quantity, raw.unit_price, raw.tax_rate)
        base = raw.quantity * raw.unit_price
        sub += base
        tax += t
        cn.items.append(CreditNoteItem(
            name=raw.name, quantity=raw.quantity, unit_price=raw.unit_price,
            tax_rate=raw.tax_rate, line_total=line,
        ))
    cn.subtotal = sub
    cn.tax_total = tax
    cn.grand_total = sub + tax
    db.add(cn)

    if data.invoice_id:
        inv = await db.get(Invoice, data.invoice_id)
        if inv and inv.deleted_at is None:
            _apply_invoice_credit(inv, cn.grand_total, reverse=False)

    await db.flush()
    await audit(db, action="create", module="finance", user=user, entity_type="credit_note",
                entity_id=cn.id, new={"code": cn.code}, request=request)
    await db.commit()
    res = await db.execute(
        select(CreditNote).where(CreditNote.id == cn.id).options(selectinload(CreditNote.items)))
    return CreditNoteOut.model_validate(res.scalar_one())


def _apply_invoice_credit(inv: Invoice, amount: float, *, reverse: bool = False) -> None:
    """Apply or reverse a credit-note amount against an invoice's paid/balance."""
    delta = -amount if reverse else amount
    inv.paid_total = max(0.0, (inv.paid_total or 0.0) + delta)
    # Cap paid at grand_total when applying (not when reversing)
    if not reverse:
        inv.paid_total = min(inv.grand_total, inv.paid_total)
    inv.balance = max(0.0, inv.grand_total - inv.paid_total)
    if inv.balance <= 0.01:
        inv.status = "paid"
        inv.balance = 0.0
    elif inv.paid_total > 0:
        inv.status = "partial"
    else:
        inv.status = "unpaid"


@router.delete("/credit-notes/{cn_id}", response_model=OkResponse)
async def delete_credit_note(
    cn_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:update")),
):
    """Soft-delete a credit note and reverse any invoice credit applied by it."""
    res = await db.execute(
        select(CreditNote).where(CreditNote.id == cn_id, CreditNote.deleted_at.is_(None))
        .options(selectinload(CreditNote.items))
    )
    cn = res.scalar_one_or_none()
    if not cn:
        raise NotFoundError("Credit note not found")

    if cn.invoice_id:
        inv = await db.get(Invoice, cn.invoice_id)
        if inv and inv.deleted_at is None:
            _apply_invoice_credit(inv, cn.grand_total, reverse=True)

    # Detach linked sales returns (keep the return, clear CN link)
    linked = await db.execute(
        select(SalesReturn).where(SalesReturn.credit_note_id == cn.id)
    )
    for sr in linked.scalars().all():
        sr.credit_note_id = None

    cn.status = "cancelled"
    cn.deleted_at = datetime.now(timezone.utc)

    await audit(
        db, action="delete", module="finance", user=user,
        entity_type="credit_note", entity_id=cn.id,
        old={"code": cn.code, "grand_total": cn.grand_total, "invoice_id": cn.invoice_id},
        new={"voided": True},
        request=request,
        notes="Credit note cancelled",
    )
    await db.commit()
    return OkResponse()


# ── Sales returns ─────────────────────────────────────────────────────────────
@router.get("/returns", response_model=PaginatedResponse[SalesReturnOut])
async def list_returns(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    customer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(SalesReturn).where(SalesReturn.deleted_at.is_(None))
    if customer_id:
        stmt = stmt.where(SalesReturn.customer_id == customer_id)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(SalesReturn.items)).order_by(SalesReturn.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[SalesReturnOut](
        items=[SalesReturnOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/returns", response_model=SalesReturnOut, status_code=201)
async def create_return(
    data: SalesReturnCreate, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    sr = SalesReturn(
        code=_code("RET"),
        customer_id=data.customer_id,
        invoice_id=data.invoice_id,
        return_date=data.return_date,
        currency=data.currency,
        restock=data.restock,
        notes=data.notes,
        actor_id=user.id,
        status="completed",
    )
    total = 0.0
    for raw in data.items:
        line = raw.quantity * raw.unit_price
        total += line
        sr.items.append(SalesReturnItem(
            name=raw.name, quantity=raw.quantity, unit_price=raw.unit_price,
            line_total=line, material_id=raw.material_id,
        ))
        if data.restock and raw.material_id:
            mat = await db.get(Material, raw.material_id)
            if mat:
                mat.on_hand = (mat.on_hand or 0) + raw.quantity
                db.add(StockMovement(
                    material_id=raw.material_id,
                    warehouse_id=mat.warehouse_id,
                    type="IN",
                    quantity=raw.quantity,
                    notes=f"Sales return restock",
                    actor_id=user.id,
                ))
    sr.grand_total = total
    db.add(sr)
    await db.flush()

    if data.create_credit_note and data.items:
        settings = await _settings(db)
        cn = CreditNote(
            code=_code(settings.credit_note_prefix),
            customer_id=data.customer_id,
            invoice_id=data.invoice_id,
            issue_date=data.return_date,
            currency=data.currency,
            reason="Sales return",
            actor_id=user.id,
            status="issued",
            subtotal=total,
            tax_total=0,
            grand_total=total,
        )
        for raw in data.items:
            cn.items.append(CreditNoteItem(
                name=raw.name, quantity=raw.quantity, unit_price=raw.unit_price,
                tax_rate=0, line_total=raw.quantity * raw.unit_price,
            ))
        db.add(cn)
        await db.flush()
        sr.credit_note_id = cn.id
        if data.invoice_id:
            inv = await db.get(Invoice, data.invoice_id)
            if inv:
                inv.paid_total = min(inv.grand_total, (inv.paid_total or 0) + total)
                inv.balance = max(0.0, inv.grand_total - inv.paid_total)

    await audit(db, action="create", module="finance", user=user, entity_type="sales_return",
                entity_id=sr.id, new={"code": sr.code}, request=request)
    await db.commit()
    res = await db.execute(
        select(SalesReturn).where(SalesReturn.id == sr.id).options(selectinload(SalesReturn.items)))
    return SalesReturnOut.model_validate(res.scalar_one())


# ── Recurring invoices ────────────────────────────────────────────────────────
@router.get("/recurring-invoices", response_model=PaginatedResponse[RecurringOut])
async def list_recurring(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(RecurringInvoice).where(RecurringInvoice.deleted_at.is_(None))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(RecurringInvoice.items)).order_by(RecurringInvoice.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[RecurringOut](
        items=[RecurringOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/recurring-invoices", response_model=RecurringOut, status_code=201)
async def create_recurring(
    data: RecurringCreate, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    sch = RecurringInvoice(
        code=_code("REC"),
        customer_id=data.customer_id,
        title=data.title,
        interval=data.interval,
        next_run=data.next_run,
        end_date=data.end_date,
        currency=data.currency,
        notes=data.notes,
        is_active=True,
    )
    sub = tax = 0.0
    for raw in data.items:
        line, t = _line_totals(raw.quantity, raw.unit_price, raw.tax_rate)
        sub += raw.quantity * raw.unit_price
        tax += t
        sch.items.append(RecurringInvoiceItem(
            name=raw.name, quantity=raw.quantity, unit_price=raw.unit_price,
            tax_rate=raw.tax_rate, line_total=line,
        ))
    sch.subtotal = sub
    sch.tax_total = tax
    sch.grand_total = sub + tax
    db.add(sch)
    await db.flush()
    await audit(db, action="create", module="finance", user=user, entity_type="recurring_invoice",
                entity_id=sch.id, new={"code": sch.code}, request=request)
    await db.commit()
    res = await db.execute(
        select(RecurringInvoice).where(RecurringInvoice.id == sch.id)
        .options(selectinload(RecurringInvoice.items)))
    return RecurringOut.model_validate(res.scalar_one())


@router.post("/recurring-invoices/{rid}/run", response_model=RecurringOut)
async def run_recurring(
    rid: int, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    res = await db.execute(
        select(RecurringInvoice).where(RecurringInvoice.id == rid, RecurringInvoice.deleted_at.is_(None))
        .options(selectinload(RecurringInvoice.items)))
    sch = res.scalar_one_or_none()
    if not sch:
        raise NotFoundError("Recurring schedule not found")
    if not sch.is_active:
        raise ValidationError("Schedule is inactive")

    inv = Invoice(
        code=invoice_code(),
        customer_id=sch.customer_id,
        status="unpaid",
        issue_date=date.today(),
        due_date=date.today() + timedelta(days=14),
        currency=sch.currency,
        paid_total=0.0,
        notes=f"Generated from {sch.code}: {sch.title}",
    )
    for it in sch.items:
        inv.items.append(InvoiceItem(
            name=it.name, quantity=it.quantity, unit_price=it.unit_price,
            tax_rate=it.tax_rate, line_total=it.line_total, discount_pct=0, unit="pcs",
        ))
    inv.subtotal = sch.subtotal
    inv.tax_total = sch.tax_total
    inv.discount_total = 0
    inv.grand_total = sch.grand_total
    inv.balance = sch.grand_total
    db.add(inv)
    await db.flush()
    sch.last_invoice_id = inv.id
    if sch.interval == "weekly":
        sch.next_run = sch.next_run + timedelta(days=7)
    elif sch.interval == "yearly":
        sch.next_run = date(sch.next_run.year + 1, sch.next_run.month, sch.next_run.day)
    else:
        month = sch.next_run.month + 1
        year = sch.next_run.year + (1 if month > 12 else 0)
        month = month if month <= 12 else 1
        day = min(sch.next_run.day, 28)
        sch.next_run = date(year, month, day)
    if sch.end_date and sch.next_run > sch.end_date:
        sch.is_active = False
    await audit(db, action="create", module="finance", user=user, entity_type="invoice",
                entity_id=inv.id, new={"from_recurring": sch.id}, request=request)
    await db.commit()
    res = await db.execute(
        select(RecurringInvoice).where(RecurringInvoice.id == sch.id)
        .options(selectinload(RecurringInvoice.items)))
    return RecurringOut.model_validate(res.scalar_one())


# ── Installments ──────────────────────────────────────────────────────────────
@router.get("/installments", response_model=PaginatedResponse[InstallmentPlanOut])
async def list_installment_plans(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    customer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(InstallmentPlan).where(InstallmentPlan.deleted_at.is_(None))
    if customer_id:
        stmt = stmt.where(InstallmentPlan.customer_id == customer_id)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(InstallmentPlan.installments)).order_by(InstallmentPlan.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[InstallmentPlanOut](
        items=[InstallmentPlanOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/installments", response_model=InstallmentPlanOut, status_code=201)
async def create_installment_plan(
    data: InstallmentPlanCreate, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    inv = await db.get(Invoice, data.invoice_id)
    if not inv or inv.deleted_at is not None:
        raise NotFoundError("Invoice not found")
    amount = inv.balance if inv.balance > 0 else inv.grand_total
    if amount <= 0:
        raise ValidationError("Invoice has no balance to schedule")
    per = round(amount / data.count, 2)
    plan = InstallmentPlan(
        code=_code("INS"),
        invoice_id=inv.id,
        customer_id=inv.customer_id,
        total_amount=amount,
        currency=inv.currency,
        status="active",
        notes=data.notes,
    )
    allocated = 0.0
    for i in range(data.count):
        amt = per if i < data.count - 1 else round(amount - allocated, 2)
        allocated += amt
        plan.installments.append(Installment(
            sequence=i + 1,
            amount=amt,
            due_date=data.first_due + timedelta(days=data.interval_days * i),
            status="pending",
        ))
    db.add(plan)
    await db.flush()
    await audit(db, action="create", module="finance", user=user, entity_type="installment_plan",
                entity_id=plan.id, new={"code": plan.code}, request=request)
    await db.commit()
    res = await db.execute(
        select(InstallmentPlan).where(InstallmentPlan.id == plan.id)
        .options(selectinload(InstallmentPlan.installments)))
    return InstallmentPlanOut.model_validate(res.scalar_one())


@router.post("/installments/{iid}/pay", response_model=InstallmentPlanOut)
async def pay_installment(
    iid: int, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    inst = await db.get(Installment, iid)
    if not inst:
        raise NotFoundError("Installment not found")
    if inst.status == "paid":
        raise ValidationError("Already paid")
    plan = await db.get(InstallmentPlan, inst.plan_id)
    if not plan:
        raise NotFoundError("Plan not found")
    pay = Payment(
        invoice_id=plan.invoice_id,
        customer_id=plan.customer_id,
        method="installment",
        amount=inst.amount,
        currency=plan.currency,
        paid_at=datetime.now(timezone.utc),
        reference=f"{plan.code}-{inst.sequence}",
        actor_id=user.id,
    )
    db.add(pay)
    await db.flush()
    inst.status = "paid"
    inst.paid_at = pay.paid_at
    inst.payment_id = pay.id
    inv = await db.get(Invoice, plan.invoice_id)
    if inv:
        inv.paid_total = (inv.paid_total or 0) + inst.amount
        inv.balance = max(0.0, inv.grand_total - inv.paid_total)
        inv.status = "paid" if inv.balance <= 0.01 else "partial"
    unpaid = [x for x in (await db.execute(
        select(Installment).where(Installment.plan_id == plan.id)
    )).scalars().all() if x.status != "paid"]
    if not unpaid:
        plan.status = "completed"
    await db.commit()
    res = await db.execute(
        select(InstallmentPlan).where(InstallmentPlan.id == plan.id)
        .options(selectinload(InstallmentPlan.installments)))
    return InstallmentPlanOut.model_validate(res.scalar_one())


# ── POS ───────────────────────────────────────────────────────────────────────
@router.get("/pos/sessions", response_model=PaginatedResponse[PosSessionOut])
async def list_pos_sessions(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(PosSession).where(PosSession.deleted_at.is_(None))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(PosSession.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[PosSessionOut](
        items=[PosSessionOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/pos/sessions", response_model=PosSessionOut, status_code=201)
async def open_pos_session(
    data: PosSessionOpen, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    open_existing = (await db.execute(
        select(PosSession).where(PosSession.cashier_id == user.id, PosSession.status == "open",
                                 PosSession.deleted_at.is_(None))
    )).scalar_one_or_none()
    if open_existing:
        raise ValidationError("You already have an open POS session")
    s = PosSession(
        code=_code("POS"),
        cashier_id=user.id,
        opened_at=datetime.now(timezone.utc),
        opening_float=data.opening_float,
        status="open",
        notes=data.notes,
    )
    db.add(s)
    await db.flush()
    await audit(db, action="create", module="pos", user=user, entity_type="pos_session",
                entity_id=s.id, new={"code": s.code}, request=request)
    await db.commit()
    return PosSessionOut.model_validate(s)


@router.post("/pos/sessions/{sid}/close", response_model=PosSessionOut)
async def close_pos_session(
    sid: int, data: PosSessionClose, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    s = await db.get(PosSession, sid)
    if not s or s.deleted_at is not None:
        raise NotFoundError("Session not found")
    if s.status != "open":
        raise ValidationError("Session already closed")
    s.status = "closed"
    s.closed_at = datetime.now(timezone.utc)
    s.closing_cash = data.closing_cash
    if data.notes:
        s.notes = data.notes
    await db.commit()
    return PosSessionOut.model_validate(s)


@router.post("/pos/checkout", response_model=PosSaleOut, status_code=201)
async def pos_checkout(
    data: PosCheckout, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    session = await db.get(PosSession, data.session_id)
    if not session or session.status != "open":
        raise ValidationError("Open POS session required")
    if not data.items:
        raise ValidationError("Cart is empty")

    customer_id = data.customer_id
    if not customer_id:
        # walk-in customer
        walk = (await db.execute(
            select(Customer).where(Customer.code == "WALK-IN", Customer.deleted_at.is_(None))
        )).scalar_one_or_none()
        if not walk:
            walk = Customer(code="WALK-IN", full_name="Walk-in Customer", tags="pos")
            db.add(walk)
            await db.flush()
        customer_id = walk.id

    inv = Invoice(
        code=invoice_code(),
        customer_id=customer_id,
        status="paid",
        issue_date=date.today(),
        currency=data.currency,
        notes=data.notes or f"POS sale · {session.code}",
        paid_total=0,
        portal_visible=False,
    )
    sub = tax = 0.0
    for raw in data.items:
        line, t = _line_totals(raw.quantity, raw.unit_price, raw.tax_rate)
        base = raw.quantity * raw.unit_price
        sub += base
        tax += t
        inv.items.append(InvoiceItem(
            name=raw.name, quantity=raw.quantity, unit_price=raw.unit_price,
            tax_rate=raw.tax_rate, line_total=line, discount_pct=0, unit="pcs",
        ))
    inv.subtotal = sub
    inv.tax_total = tax
    inv.discount_total = 0
    inv.grand_total = sub + tax
    inv.paid_total = inv.grand_total
    inv.balance = 0
    db.add(inv)
    await db.flush()

    pay = Payment(
        invoice_id=inv.id,
        customer_id=customer_id,
        method=data.method,
        amount=inv.grand_total,
        currency=data.currency,
        paid_at=datetime.now(timezone.utc),
        reference=session.code,
        actor_id=user.id,
    )
    db.add(pay)
    await db.flush()

    sale = PosSale(
        session_id=session.id,
        invoice_id=inv.id,
        payment_id=pay.id,
        customer_id=customer_id,
        total=inv.grand_total,
        currency=data.currency,
        method=data.method,
    )
    db.add(sale)
    await db.flush()
    await audit(db, action="create", module="pos", user=user, entity_type="pos_sale",
                entity_id=sale.id, new={"invoice": inv.code, "total": inv.grand_total}, request=request)
    await db.commit()
    return PosSaleOut.model_validate(sale)


# ── Vendors & Purchases ───────────────────────────────────────────────────────
@router.get("/vendors", response_model=PaginatedResponse[VendorOut])
async def list_vendors(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("inventory:read")),
):
    stmt = select(Vendor).where(Vendor.deleted_at.is_(None))
    if q:
        stmt = stmt.where(Vendor.name.ilike(f"%{q}%"))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Vendor.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[VendorOut](
        items=[VendorOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/vendors", response_model=VendorOut, status_code=201)
async def create_vendor(
    data: VendorCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("inventory:create")),
):
    v = Vendor(code=_code("VEN"), **data.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return VendorOut.model_validate(v)


@router.get("/purchases", response_model=PaginatedResponse[PurchaseOrderOut])
async def list_purchases(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("inventory:read")),
):
    stmt = select(PurchaseOrder).where(PurchaseOrder.deleted_at.is_(None))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(PurchaseOrder.items)).order_by(PurchaseOrder.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[PurchaseOrderOut](
        items=[PurchaseOrderOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/purchases", response_model=PurchaseOrderOut, status_code=201)
async def create_purchase(
    data: PurchaseOrderCreate, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("inventory:create")),
):
    po = PurchaseOrder(
        code=_code("PO"),
        vendor_id=data.vendor_id,
        status="ordered",
        order_date=data.order_date,
        expected_date=data.expected_date,
        currency=data.currency,
        notes=data.notes,
        actor_id=user.id,
    )
    total = 0.0
    for raw in data.items:
        line = raw.quantity * raw.unit_price
        total += line
        po.items.append(PurchaseOrderItem(
            name=raw.name, quantity=raw.quantity, unit_price=raw.unit_price,
            line_total=line, material_id=raw.material_id, received_qty=0,
        ))
    po.grand_total = total
    db.add(po)
    await db.flush()
    await audit(db, action="create", module="inventory", user=user, entity_type="purchase_order",
                entity_id=po.id, new={"code": po.code}, request=request)
    await db.commit()
    res = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po.id).options(selectinload(PurchaseOrder.items)))
    return PurchaseOrderOut.model_validate(res.scalar_one())


@router.post("/purchases/{pid}/receive", response_model=PurchaseOrderOut)
async def receive_purchase(
    pid: int, request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("inventory:update")),
):
    res = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == pid, PurchaseOrder.deleted_at.is_(None))
        .options(selectinload(PurchaseOrder.items)))
    po = res.scalar_one_or_none()
    if not po:
        raise NotFoundError("Purchase order not found")
    if po.status == "received":
        raise ValidationError("Already received")
    for it in po.items:
        it.received_qty = it.quantity
        if it.material_id:
            mat = await db.get(Material, it.material_id)
            if mat:
                mat.on_hand = (mat.on_hand or 0) + it.quantity
                db.add(StockMovement(
                    material_id=it.material_id,
                    warehouse_id=mat.warehouse_id,
                    type="IN",
                    quantity=it.quantity,
                    notes=f"PO {po.code}",
                    actor_id=user.id,
                ))
    po.status = "received"
    await db.commit()
    res = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po.id).options(selectinload(PurchaseOrder.items)))
    return PurchaseOrderOut.model_validate(res.scalar_one())


# ── Expenses (staff UI wrapper already has list/create on finance; duplicate list for sales router) ─
@router.get("/expenses", response_model=PaginatedResponse[ExpenseOut])
async def list_expenses_ops(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(Expense).where(Expense.deleted_at.is_(None))
    if q:
        needle = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Expense.category.ilike(needle),
                Expense.description.ilike(needle),
            )
        )
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Expense.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[ExpenseOut](
        items=[ExpenseOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


# ── Settings & templates & reports ────────────────────────────────────────────
@router.get("/sales-settings", response_model=SalesSettingsOut)
async def get_sales_settings(
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    return SalesSettingsOut.model_validate(await _settings(db))


@router.patch("/sales-settings", response_model=SalesSettingsOut)
async def update_sales_settings(
    data: SalesSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("finance:update")),
):
    row = await _settings(db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return SalesSettingsOut.model_validate(row)


@router.get("/templates", response_model=PaginatedResponse[DocumentTemplateOut])
async def list_templates(
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), _: User = Depends(require_permissions("finance:read")),
):
    stmt = select(DocumentTemplate).where(DocumentTemplate.deleted_at.is_(None))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(DocumentTemplate.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[DocumentTemplateOut](
        items=[DocumentTemplateOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/templates", response_model=DocumentTemplateOut, status_code=201)
async def create_template(
    data: DocumentTemplateCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("finance:update")),
):
    t = DocumentTemplate(code=_code("TPL"), **data.model_dump())
    if data.is_default:
        existing = (await db.execute(
            select(DocumentTemplate).where(
                DocumentTemplate.doc_type == data.doc_type,
                DocumentTemplate.is_default.is_(True),
                DocumentTemplate.deleted_at.is_(None),
            )
        )).scalars().all()
        for e in existing:
            e.is_default = False
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return DocumentTemplateOut.model_validate(t)


@router.get("/reports/sales", response_model=SalesReportOut)
async def sales_report(
    days: int = Query(30, ge=1, le=365),
    currency: str = Query("IQD"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("finance:read")),
):
    end = date.today()
    start = end - timedelta(days=days - 1)
    inv_stmt = select(Invoice).where(
        Invoice.deleted_at.is_(None),
        Invoice.issue_date >= start,
        Invoice.issue_date <= end,
        Invoice.currency == currency,
    )
    invs = (await db.execute(inv_stmt)).scalars().all()
    by_status: dict[str, int] = {}
    inv_total = paid = bal = 0.0
    cust_totals: dict[int, float] = {}
    for i in invs:
        by_status[i.status] = by_status.get(i.status, 0) + 1
        inv_total += i.grand_total or 0
        paid += i.paid_total or 0
        bal += i.balance or 0
        cust_totals[i.customer_id] = cust_totals.get(i.customer_id, 0) + (i.grand_total or 0)
    cn_total = float(await db.scalar(
        select(func.coalesce(func.sum(CreditNote.grand_total), 0.0)).where(
            CreditNote.deleted_at.is_(None),
            CreditNote.issue_date >= start,
            CreditNote.issue_date <= end,
            CreditNote.currency == currency,
        )
    ) or 0)
    pay_count = int(await db.scalar(
        select(func.count()).select_from(Payment).where(
            Payment.paid_at >= datetime.combine(start, datetime.min.time()).replace(tzinfo=timezone.utc),
            Payment.currency == currency,
        )
    ) or 0)
    top = sorted(cust_totals.items(), key=lambda x: -x[1])[:5]
    top_out = []
    for cid, amt in top:
        c = await db.get(Customer, cid)
        top_out.append({"customer_id": cid, "name": c.full_name if c else str(cid), "total": amt})
    return SalesReportOut(
        period_start=start,
        period_end=end,
        currency=currency,
        invoice_count=len(invs),
        invoice_total=inv_total,
        paid_total=paid,
        unpaid_balance=bal,
        credit_note_total=cn_total,
        payment_count=pay_count,
        by_status=[{"status": k, "count": v} for k, v in by_status.items()],
        top_customers=top_out,
    )
