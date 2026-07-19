"""Finance endpoints: Quotations, Invoices, Payments, Expenses."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import current_user, require_permissions
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.db.base import get_db
from app.models.audit import AuditLog
from app.models.customer import Customer
from app.models.finance import (
    Expense, Invoice, InvoiceItem, Payment, Quotation, QuotationItem,
)
from app.models.order import Order
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.schemas.finance import (
    ExpenseCreate, ExpenseOut, InvoiceActivityEvent, InvoiceActivityOut,
    InvoiceCreate, InvoiceDetailOut, InvoiceFromOrderIn, InvoiceOut,
    InvoiceStockIssueIn, InvoiceUpdate, PaymentCreate, PaymentOut,
    QuotationCreate, QuotationOut,
)
from app.services.audit import record as audit
from app.services.invoice_service import default_due_date, render_invoice_pdf
from app.utils.business_time import business_now, business_today
from app.utils.codes import invoice_code, quotation_code


router = APIRouter()

ORDER_INVOICE_PAID_STATUSES = frozenset({"paid", "in_production", "delivered", "closed"})


def _parse_note_field(notes: Optional[str], prefixes: tuple[str, ...]) -> Optional[str]:
    if not notes:
        return None
    for line in notes.splitlines():
        raw = line.strip()
        for prefix in prefixes:
            if raw.lower().startswith(prefix.lower()):
                return raw[len(prefix):].strip(" :：") or None
    return None


def _invoice_list_out(
    inv: Invoice,
    customer_name: Optional[str] = None,
    *,
    salesperson_name: Optional[str] = None,
) -> InvoiceOut:
    out = InvoiceOut.model_validate(inv)
    out.customer_name = customer_name
    out.sold_by = salesperson_name or _parse_note_field(
        inv.notes,
        ("Salesperson:", "مسؤول المبيعات:", "salesperson:"),
    )
    if inv.paid_total and inv.paid_total > 0:
        out.last_activity = "payment_added"
    else:
        out.last_activity = "created"
    return out


def _apply_invoice_bucket(stmt, bucket: Optional[str], today: date):
    if not bucket or bucket in ("all", "results"):
        return stmt
    if bucket == "late":
        return stmt.where(
            Invoice.balance > 0,
            Invoice.due_date.is_not(None),
            Invoice.due_date < today,
        )
    if bucket == "due":
        return stmt.where(
            Invoice.balance > 0,
            or_(Invoice.due_date.is_(None), Invoice.due_date >= today),
            Invoice.status.in_(("unpaid", "partial")),
        )
    if bucket == "unpaid":
        return stmt.where(Invoice.status == "unpaid")
    if bucket == "draft":
        return stmt.where(Invoice.status == "draft")
    if bucket == "overpaid":
        return stmt.where(Invoice.paid_total > Invoice.grand_total)
    if bucket == "paid":
        return stmt.where(Invoice.status == "paid")
    if bucket == "partial":
        return stmt.where(Invoice.status == "partial")
    return stmt

def _round(x: float) -> float:
    return round(float(x or 0), 2)


def _agg_quotation(q: Quotation) -> None:
    sub = 0.0; tax = 0.0
    for it in q.items:
        line = _round(it.unit_price * it.quantity * (1 - it.discount_pct / 100.0))
        it.line_total = line; sub += line; tax += line * (it.tax_rate / 100.0)
    q.subtotal = _round(sub); q.tax_total = _round(tax)
    q.grand_total = _round(sub + tax); q.discount_total = 0.0


def _agg_invoice(i: Invoice) -> None:
    sub = 0.0; tax = 0.0
    for it in i.items:
        line = _round(it.unit_price * it.quantity * (1 - it.discount_pct / 100.0))
        it.line_total = line; sub += line; tax += line * (it.tax_rate / 100.0)
    i.subtotal = _round(sub); i.tax_total = _round(tax)
    i.grand_total = _round(sub + tax)
    i.balance = _round(i.grand_total - i.paid_total)
    if i.paid_total <= 0: i.status = "unpaid"
    elif i.paid_total < i.grand_total: i.status = "partial"
    else: i.status = "paid"


def _sync_invoice_payment_from_order(i: Invoice, order: Order) -> None:
    """Invoice payment status mirrors the order's payment confirmation flag."""
    if order.status in ORDER_INVOICE_PAID_STATUSES:
        i.paid_total = i.grand_total
        i.balance = 0.0
        i.status = "paid"
    else:
        i.paid_total = 0.0
        i.balance = i.grand_total
        i.status = "unpaid"


def _invoice_items_from_order(order: Order) -> list[InvoiceItem]:
    return [
        InvoiceItem(
            name=oi.name,
            description=oi.description,
            quantity=oi.quantity,
            unit=oi.unit,
            unit_price=oi.unit_price,
            discount_pct=oi.discount_pct,
            tax_rate=oi.tax_rate,
        )
        for oi in order.items
    ]


async def _upsert_invoice_from_order(
    db: AsyncSession,
    order: Order,
    data: InvoiceFromOrderIn,
) -> tuple[Invoice, bool]:
    """Create or refresh the single invoice for an order. Returns (invoice, created)."""
    now = business_now()
    issue = business_today()

    res = await db.execute(
        select(Invoice)
        .where(Invoice.order_id == order.id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items))
        .order_by(Invoice.id.desc())
    )
    rows = list(res.scalars().all())
    existing = rows[0] if rows else None

    if existing:
        for dup in rows[1:]:
            dup.deleted_at = datetime.now(timezone.utc)
        for item in list(existing.items):
            await db.delete(item)
        existing.issue_date = issue
        existing.issued_at = now
        existing.currency = order.currency
        existing.notes = data.notes or order.notes
        existing.portal_visible = data.portal_visible
        existing.pdf_lang = data.lang
        existing.due_date = default_due_date(issue, data.due_days)
        existing.customer_id = order.customer_id
        for raw in _invoice_items_from_order(order):
            existing.items.append(raw)
        _agg_invoice(existing)
        _sync_invoice_payment_from_order(existing, order)
        return existing, False

    i = Invoice(
        code=invoice_code(),
        status="unpaid",
        paid_total=0.0,
        customer_id=order.customer_id,
        order_id=order.id,
        issue_date=issue,
        issued_at=now,
        due_date=default_due_date(issue, data.due_days),
        currency=order.currency,
        notes=data.notes or order.notes,
        portal_visible=data.portal_visible,
        pdf_lang=data.lang,
    )
    for raw in _invoice_items_from_order(order):
        i.items.append(raw)
    _agg_invoice(i)
    _sync_invoice_payment_from_order(i, order)
    db.add(i)
    return i, True


def _own_customer(stmt, user: User, db: AsyncSession, attr_name: str):
    """Restrict by customer for portal users (returns async coroutine)."""
    if user.is_staff or user.is_superuser:
        return stmt
    async def _wrap():
        res = await db.execute(select(Customer).where(Customer.user_id == user.id))
        c = res.scalar_one_or_none()
        if not c: return stmt.where(False)
        return stmt.where(getattr(stmt.column_descriptions[0]["entity"], attr_name) == c.id)
    return _wrap()


async def _invoice_detail(db: AsyncSession, inv: Invoice) -> InvoiceDetailOut:
    out = InvoiceDetailOut.model_validate(inv)
    cust_res = await db.execute(select(Customer).where(Customer.id == inv.customer_id))
    cust = cust_res.scalar_one_or_none()
    if cust:
        out.customer_name = cust.full_name
        out.customer_email = cust.email

    # Prefer FK staff from Daftra sync; fall back to notes / audit trail.
    if inv.created_by_id:
        creator = await db.get(User, inv.created_by_id)
        if creator:
            out.created_by_id = creator.id
            out.created_by_name = creator.full_name
    if inv.salesperson_id:
        seller = await db.get(User, inv.salesperson_id)
        if seller:
            out.salesperson_id = seller.id
            out.sold_by = seller.full_name
    if not out.sold_by:
        out.sold_by = _parse_note_field(
            inv.notes,
            ("Salesperson:", "مسؤول المبيعات:", "salesperson:"),
        )
    out.warehouse_name = _parse_note_field(
        inv.notes,
        ("Warehouse:", "المستودع:"),
    )
    out.last_activity = "payment_added" if inv.paid_total and inv.paid_total > 0 else "created"
    if inv.order_id:
        o_res = await db.execute(select(Order).where(Order.id == inv.order_id))
        order = o_res.scalar_one_or_none()
        if order:
            out.order_code = order.code

    # Creator from audit trail when FK missing (local creates)
    if not out.created_by_name:
        audit_res = await db.execute(
            select(AuditLog)
            .where(
                AuditLog.entity_type == "invoice",
                AuditLog.entity_id == inv.id,
            )
            .order_by(AuditLog.id.asc())
        )
        logs = list(audit_res.scalars().all())
        create_log = next((x for x in logs if x.action == "create"), logs[0] if logs else None)
        if create_log and create_log.user_id:
            u = await db.get(User, create_log.user_id)
            if u:
                out.created_by_id = u.id
                out.created_by_name = u.full_name
        stock_log = next((x for x in reversed(logs) if x.action == "stock_issue"), None)
        if stock_log:
            out.stock_issued = True
            out.stock_issue_at = stock_log.occurred_at
            nv = stock_log.new_values or {}
            out.stock_issue_code = str(nv.get("code") or f"STK-{inv.id:06d}")
            if nv.get("warehouse_name"):
                out.warehouse_name = str(nv["warehouse_name"])
    else:
        # Still resolve stock issue from audit when creator already known
        audit_res = await db.execute(
            select(AuditLog)
            .where(
                AuditLog.entity_type == "invoice",
                AuditLog.entity_id == inv.id,
                AuditLog.action == "stock_issue",
            )
            .order_by(AuditLog.id.desc())
            .limit(1)
        )
        stock_log = audit_res.scalar_one_or_none()
        if stock_log:
            out.stock_issued = True
            out.stock_issue_at = stock_log.occurred_at
            nv = stock_log.new_values or {}
            out.stock_issue_code = str(nv.get("code") or f"STK-{inv.id:06d}")
            if nv.get("warehouse_name"):
                out.warehouse_name = str(nv["warehouse_name"])
    return out


def _activity_title(action: str, inv: Invoice, user_name: Optional[str], locale_hint: str = "en") -> str:
    who = user_name or "System"
    if action == "create":
        return (
            f"{who} created unpaid invoice {inv.code} for customer "
            f"{inv.customer_id} totaling {inv.grand_total}"
        )
    if action == "payment":
        return f"{who} added a payment on invoice {inv.code}"
    if action == "stock_issue":
        return f"{who} added a warehouse issue voucher for invoice {inv.code}"
    if action == "stock_issue_void":
        return f"{who} cancelled the warehouse issue voucher for invoice {inv.code}"
    if action == "update":
        return f"{who} updated invoice {inv.code}"
    if action == "delete":
        return f"{who} deleted invoice {inv.code}"
    return f"{who} · {action} · {inv.code}"


async def _assert_invoice_access(db: AsyncSession, user: User, inv: Invoice) -> None:
    if user.is_staff or user.is_superuser:
        return
    res = await db.execute(select(Customer).where(Customer.user_id == user.id))
    c = res.scalar_one_or_none()
    if not c or inv.customer_id != c.id:
        raise ForbiddenError("Access denied")
    if not inv.portal_visible:
        raise ForbiddenError("This invoice is not shared with the customer portal")


# ── Quotations ───────────────────────────────────────────────────────────────
@router.get("/quotations", response_model=PaginatedResponse[QuotationOut])
async def list_quotations(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db), user: User = Depends(current_user),
):
    stmt = select(Quotation).where(Quotation.deleted_at.is_(None))
    if q: stmt = stmt.where(or_(Quotation.code.ilike(f"%{q}%"), Quotation.notes.ilike(f"%{q}%")))
    if status: stmt = stmt.where(Quotation.status == status)
    if customer_id and (user.is_staff or user.is_superuser):
        stmt = stmt.where(Quotation.customer_id == customer_id)
    if not (user.is_staff or user.is_superuser):
        res = await db.execute(select(Customer).where(Customer.user_id == user.id))
        c = res.scalar_one_or_none()
        stmt = stmt.where(Quotation.customer_id == (c.id if c else -1))

    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(Quotation.items))
            .order_by(Quotation.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[QuotationOut](
        items=[QuotationOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/quotations", response_model=QuotationOut, status_code=201)
async def create_quotation(data: QuotationCreate, request: Request,
                           db: AsyncSession = Depends(get_db),
                           user: User = Depends(require_permissions("finance:create"))):
    q = Quotation(code=quotation_code(), status="draft",
                  **data.model_dump(exclude={"items"}))
    for raw in data.items:
        q.items.append(QuotationItem(**raw.model_dump()))
    _agg_quotation(q)
    db.add(q); await db.flush()
    await audit(db, action="create", module="finance", user=user, entity_type="quotation",
                entity_id=q.id, new={"code": q.code, "total": q.grand_total}, request=request)
    await db.commit()
    res = await db.execute(
        select(Quotation).where(Quotation.id == q.id).options(selectinload(Quotation.items)))
    return QuotationOut.model_validate(res.scalar_one())


@router.post("/quotations/{qid}/accept", response_model=QuotationOut)
async def accept_quotation(qid: int, request: Request,
                           db: AsyncSession = Depends(get_db),
                           user: User = Depends(current_user)):
    res = await db.execute(
        select(Quotation).where(Quotation.id == qid)
        .options(selectinload(Quotation.items)))
    q = res.scalar_one_or_none()
    if not q: raise NotFoundError("Quotation not found")
    if q.status == "accepted":
        return QuotationOut.model_validate(q)
    q.status = "accepted"
    q.accepted_at = datetime.now(timezone.utc)
    await audit(db, action="accept", module="finance", user=user, entity_type="quotation",
                entity_id=q.id, request=request)
    await db.commit()
    return QuotationOut.model_validate(q)


# ── Invoices ─────────────────────────────────────────────────────────────────
@router.get("/invoices", response_model=PaginatedResponse[InvoiceOut])
async def list_invoices(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None, status: Optional[str] = None,
    customer_id: Optional[int] = None,
    bucket: Optional[str] = Query(
        None,
        description="all|results|late|due|unpaid|draft|overpaid|paid|partial",
    ),
    sort: Optional[str] = Query("newest", description="newest|oldest|amount_desc|amount_asc|due_asc"),
    db: AsyncSession = Depends(get_db), user: User = Depends(current_user),
):
    today = business_today()
    stmt = (
        select(Invoice, Customer.full_name)
        .outerjoin(Customer, Customer.id == Invoice.customer_id)
        .where(Invoice.deleted_at.is_(None))
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(
            Invoice.code.ilike(like),
            Invoice.notes.ilike(like),
            Customer.full_name.ilike(like),
            Customer.code.ilike(like),
            Customer.phone.ilike(like),
            Customer.email.ilike(like),
            Customer.daftra_id.ilike(like),
        ))
    if status:
        stmt = stmt.where(Invoice.status == status)
    if customer_id and (user.is_staff or user.is_superuser):
        stmt = stmt.where(Invoice.customer_id == customer_id)
    if not (user.is_staff or user.is_superuser):
        res = await db.execute(select(Customer).where(Customer.user_id == user.id))
        c = res.scalar_one_or_none()
        stmt = stmt.where(Invoice.customer_id == (c.id if c else -1))
        stmt = stmt.where(Invoice.portal_visible.is_(True))

    stmt = _apply_invoice_bucket(stmt, bucket, today)

    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = await db.scalar(count_stmt)

    if sort == "oldest":
        stmt = stmt.order_by(Invoice.id.asc())
    elif sort == "amount_desc":
        stmt = stmt.order_by(Invoice.grand_total.desc(), Invoice.id.desc())
    elif sort == "amount_asc":
        stmt = stmt.order_by(Invoice.grand_total.asc(), Invoice.id.desc())
    elif sort == "due_asc":
        stmt = stmt.order_by(Invoice.due_date.asc().nulls_last(), Invoice.id.desc())
    else:
        stmt = stmt.order_by(Invoice.id.desc())

    rows = (await db.execute(
        stmt.options(selectinload(Invoice.items))
            .offset((page - 1) * page_size).limit(page_size)
    )).all()
    user_ids = {
        uid
        for inv, _name in rows
        for uid in (inv.salesperson_id, inv.created_by_id)
        if uid
    }
    names: dict[int, str] = {}
    if user_ids:
        urows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(list(user_ids))))
        ).all()
        names = {r.id: r.full_name for r in urows}
    items = [
        _invoice_list_out(
            inv,
            name,
            salesperson_name=names.get(inv.salesperson_id) if inv.salesperson_id else None,
        )
        for inv, name in rows
    ]
    return PaginatedResponse[InvoiceOut](
        items=items, total=total or 0, page=page, page_size=page_size,
    )

@router.post("/invoices", response_model=InvoiceOut, status_code=201)
async def create_invoice(data: InvoiceCreate, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("finance:create"))):
    i = Invoice(code=invoice_code(), status="unpaid", paid_total=0.0,
                created_by_id=user.id,
                **data.model_dump(exclude={"items"}))
    for raw in data.items:
        i.items.append(InvoiceItem(**raw.model_dump()))
    _agg_invoice(i)
    db.add(i); await db.flush()
    await audit(db, action="create", module="finance", user=user, entity_type="invoice",
                entity_id=i.id, new={"code": i.code, "total": i.grand_total}, request=request)
    await db.commit()
    res = await db.execute(
        select(Invoice).where(Invoice.id == i.id).options(selectinload(Invoice.items)))
    return InvoiceOut.model_validate(res.scalar_one())


@router.post("/invoices/from-quotation/{qid}", response_model=InvoiceOut, status_code=201)
async def invoice_from_quotation(qid: int, request: Request,
                                 db: AsyncSession = Depends(get_db),
                                 user: User = Depends(require_permissions("finance:create"))):
    res = await db.execute(
        select(Quotation).where(Quotation.id == qid)
        .options(selectinload(Quotation.items)))
    q = res.scalar_one_or_none()
    if not q: raise NotFoundError("Quotation not found")
    if q.status != "accepted":
        raise ValidationError("Quotation must be accepted before invoicing")

    i = Invoice(code=invoice_code(), status="unpaid", paid_total=0.0,
                customer_id=q.customer_id, quotation_id=q.id, order_id=q.order_id,
                issue_date=datetime.utcnow().date(),
                currency=q.currency, notes=q.notes)
    for it in q.items:
        i.items.append(InvoiceItem(
            name=it.name, description=it.description, quantity=it.quantity,
            unit=it.unit, unit_price=it.unit_price, discount_pct=it.discount_pct,
            tax_rate=it.tax_rate,
        ))
    _agg_invoice(i)
    db.add(i); await db.flush()
    await audit(db, action="create", module="finance", user=user, entity_type="invoice",
                entity_id=i.id, new={"from_quotation": q.id}, request=request)
    await db.commit()
    res = await db.execute(
        select(Invoice).where(Invoice.id == i.id).options(selectinload(Invoice.items)))
    return InvoiceOut.model_validate(res.scalar_one())


@router.get("/invoices/{invoice_id}", response_model=InvoiceDetailOut)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")
    await _assert_invoice_access(db, user, inv)
    return await _invoice_detail(db, inv)


@router.get("/invoices/{invoice_id}/activity", response_model=InvoiceActivityOut)
async def invoice_activity(
    invoice_id: int,
    action: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")
    await _assert_invoice_access(db, user, inv)

    events: list[InvoiceActivityEvent] = []

    audit_stmt = select(AuditLog).where(
        AuditLog.entity_type == "invoice",
        AuditLog.entity_id == invoice_id,
    )
    if action:
        audit_stmt = audit_stmt.where(AuditLog.action == action)
    if from_date:
        audit_stmt = audit_stmt.where(AuditLog.occurred_at >= from_date)
    if to_date:
        audit_stmt = audit_stmt.where(AuditLog.occurred_at <= to_date)
    logs = (await db.execute(audit_stmt.order_by(AuditLog.id.desc()))).scalars().all()

    user_ids = {lg.user_id for lg in logs if lg.user_id}
    users_map: dict[int, User] = {}
    if user_ids:
        urows = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
        users_map = {u.id: u for u in urows}

    cust_name = None
    cust = await db.get(Customer, inv.customer_id)
    if cust:
        cust_name = cust.full_name

    for lg in logs:
        actor = users_map.get(lg.user_id) if lg.user_id else None
        uname = actor.full_name if actor else (lg.user_email or None)
        kind = lg.action if lg.action in (
            "create", "update", "delete", "stock_issue", "stock_issue_void",
        ) else "other"
        detail = None
        if lg.action == "create":
            detail = (
                f"Customer: {cust_name or inv.customer_id} · "
                f"Total: {inv.grand_total} · Due: {inv.balance}"
            )
        elif lg.action == "stock_issue" and lg.new_values:
            detail = str(lg.new_values.get("code") or "")
        elif lg.action == "stock_issue_void":
            code = (lg.old_values or {}).get("code") or (lg.new_values or {}).get("code")
            detail = f"Cancelled {code}" if code else "Cancelled stock issue"
        elif lg.new_values:
            detail = ", ".join(f"{k}={v}" for k, v in list(lg.new_values.items())[:6])
        events.append(InvoiceActivityEvent(
            id=f"audit-{lg.id}",
            kind=kind,
            action=lg.action,
            title=_activity_title(lg.action, inv, uname),
            detail=detail,
            occurred_at=lg.occurred_at,
            user_id=lg.user_id,
            user_name=uname,
            user_email=actor.email if actor else lg.user_email,
        ))

    # Payments as activity (unless filtered to non-payment action)
    if not action or action == "payment":
        pay_stmt = select(Payment).where(Payment.invoice_id == invoice_id)
        if from_date:
            pay_stmt = pay_stmt.where(Payment.paid_at >= from_date)
        if to_date:
            pay_stmt = pay_stmt.where(Payment.paid_at <= to_date)
        pays = (await db.execute(pay_stmt.order_by(Payment.id.desc()))).scalars().all()
        for p in pays:
            events.append(InvoiceActivityEvent(
                id=f"pay-{p.id}",
                kind="payment",
                action="payment",
                title=_activity_title("payment", inv, None),
                detail=f"{p.amount} {p.currency} · {p.method}"
                       + (f" · {p.reference}" if p.reference else ""),
                occurred_at=p.paid_at,
            ))

    # Fallback created event if no audit create
    if not any(e.kind == "create" for e in events) and (not action or action == "create"):
        if (not from_date or inv.created_at >= from_date) and (not to_date or inv.created_at <= to_date):
            events.append(InvoiceActivityEvent(
                id=f"created-{inv.id}",
                kind="created",
                action="create",
                title=_activity_title("create", inv, None),
                detail=(
                    f"Customer: {cust_name or inv.customer_id} · "
                    f"Total: {inv.grand_total} · Due: {inv.balance}"
                ),
                occurred_at=inv.created_at,
            ))

    events.sort(key=lambda e: e.occurred_at, reverse=True)
    return InvoiceActivityOut(items=events)


@router.post("/invoices/{invoice_id}/stock-issue", response_model=InvoiceDetailOut)
async def issue_invoice_stock(
    invoice_id: int,
    data: InvoiceStockIssueIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:update")),
):
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")

    # Prevent duplicate stock issues
    existing = await db.scalar(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.entity_type == "invoice",
            AuditLog.entity_id == invoice_id,
            AuditLog.action == "stock_issue",
        )
    )
    if existing:
        raise ValidationError("Stock issue voucher already exists for this invoice")

    wh = data.warehouse_name or _parse_note_field(
        inv.notes, ("Warehouse:", "المستودع:")
    ) or "Primary"
    code = f"STK-{invoice_id:06d}"
    await audit(
        db,
        action="stock_issue",
        module="inventory",
        user=user,
        entity_type="invoice",
        entity_id=inv.id,
        new={
            "code": code,
            "warehouse_name": wh,
            "items": [
                {"name": it.name, "quantity": it.quantity, "unit_price": it.unit_price}
                for it in inv.items
            ],
            "notes": data.notes,
        },
        request=request,
    )
    await db.commit()
    return await _invoice_detail(db, inv)


@router.delete("/invoices/{invoice_id}/stock-issue", response_model=InvoiceDetailOut)
async def void_invoice_stock_issue(
    invoice_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:update")),
):
    """Undo / delete a mistaken warehouse stock-issue voucher for this invoice."""
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")

    logs_res = await db.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "invoice",
            AuditLog.entity_id == invoice_id,
            AuditLog.action == "stock_issue",
        ).order_by(AuditLog.id.asc())
    )
    logs = list(logs_res.scalars().all())
    if not logs:
        raise NotFoundError("No stock issue voucher found for this invoice")

    last = logs[-1]
    old = dict(last.new_values or {})
    old["voided_log_ids"] = [lg.id for lg in logs]

    await db.execute(
        delete(AuditLog).where(
            AuditLog.entity_type == "invoice",
            AuditLog.entity_id == invoice_id,
            AuditLog.action == "stock_issue",
        )
    )

    await audit(
        db,
        action="stock_issue_void",
        module="inventory",
        user=user,
        entity_type="invoice",
        entity_id=inv.id,
        old=old,
        new={"voided": True, "code": old.get("code")},
        request=request,
        notes="Stock issue voucher cancelled",
    )
    await db.commit()
    return await _invoice_detail(db, inv)


@router.patch("/invoices/{invoice_id}", response_model=InvoiceDetailOut)
async def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:update")),
):
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .options(selectinload(Invoice.items))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")
    patch = data.model_dump(exclude_unset=True)
    for k, v in patch.items():
        setattr(inv, k, v)
    await audit(db, action="update", module="finance", user=user, entity_type="invoice",
                entity_id=inv.id, new=patch, request=request)
    await db.commit()
    return await _invoice_detail(db, inv)


@router.delete("/invoices/{invoice_id}", response_model=OkResponse)
async def delete_invoice(
    invoice_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:update")),
):
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")
    inv.deleted_at = datetime.now(timezone.utc)
    await audit(
        db, action="delete", module="finance", user=user, entity_type="invoice",
        entity_id=inv.id, request=request,
    )
    await db.commit()
    return OkResponse(ok=True)


@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: int,
    lang: str = Query("en", pattern="^(en|ar)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    res = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Invoice not found")
    await _assert_invoice_access(db, user, inv)
    code = inv.code
    # Generate PDF without holding the request open on a blocked loop
    pdf_bytes = await render_invoice_pdf(db, invoice_id, lang)
    if user.is_staff or user.is_superuser:
        inv.pdf_lang = lang
        await db.commit()
    filename = f"{code}_{lang}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/invoices/from-order/{order_id}", response_model=InvoiceDetailOut)
async def invoice_from_order(
    order_id: int,
    data: InvoiceFromOrderIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions("finance:create")),
):
    if data.lang not in ("en", "ar"):
        raise ValidationError("lang must be en or ar")
    res = await db.execute(
        select(Order).where(Order.id == order_id, Order.deleted_at.is_(None))
        .options(selectinload(Order.items))
    )
    order = res.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found")
    if not order.items:
        raise ValidationError("Order has no line items to invoice")

    i, created = await _upsert_invoice_from_order(db, order, data)
    await db.flush()
    await audit(
        db,
        action="create" if created else "update",
        module="finance",
        user=user,
        entity_type="invoice",
        entity_id=i.id,
        new={"code": i.code, "from_order": order_id, "lang": data.lang, "refreshed": not created},
        request=request,
    )
    await db.commit()
    res2 = await db.execute(
        select(Invoice).where(Invoice.id == i.id).options(selectinload(Invoice.items))
    )
    return await _invoice_detail(db, res2.scalar_one())


@router.get("/orders/{order_id}/invoices", response_model=PaginatedResponse[InvoiceOut])
async def list_order_invoices(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    stmt = select(Invoice).where(
        Invoice.order_id == order_id,
        Invoice.deleted_at.is_(None),
    )
    if not (user.is_staff or user.is_superuser):
        res = await db.execute(select(Customer).where(Customer.user_id == user.id))
        c = res.scalar_one_or_none()
        stmt = stmt.where(Invoice.customer_id == (c.id if c else -1))
        stmt = stmt.where(Invoice.portal_visible.is_(True))
    rows = (await db.execute(
        stmt.options(selectinload(Invoice.items)).order_by(Invoice.id.desc())
    )).scalars().all()
    return PaginatedResponse[InvoiceOut](
        items=[InvoiceOut.model_validate(r) for r in rows],
        total=len(rows),
        page=1,
        page_size=max(len(rows), 1),
    )


# ── Payments ─────────────────────────────────────────────────────────────────
@router.post("/payments", response_model=PaymentOut, status_code=201)
async def create_payment(data: PaymentCreate, request: Request,
                         db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("finance:create"))):
    p = Payment(actor_id=user.id, **data.model_dump())
    db.add(p); await db.flush()
    # Update invoice if linked
    if p.invoice_id:
        res = await db.execute(
            select(Invoice).where(Invoice.id == p.invoice_id)
            .options(selectinload(Invoice.items)))
        inv = res.scalar_one_or_none()
        if inv:
            inv.paid_total = _round(inv.paid_total + p.amount)
            _agg_invoice(inv)
    await audit(db, action="create", module="finance", user=user, entity_type="payment",
                entity_id=p.id, new={"amount": p.amount}, request=request)
    await db.commit()
    return PaymentOut.model_validate(p)


@router.get("/payments", response_model=PaginatedResponse[PaymentOut])
async def list_payments(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    invoice_id: Optional[int] = None, customer_id: Optional[int] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db), user: User = Depends(current_user),
):
    stmt = select(Payment)
    if invoice_id: stmt = stmt.where(Payment.invoice_id == invoice_id)
    if customer_id: stmt = stmt.where(Payment.customer_id == customer_id)
    if q:
        needle = f"%{q.strip()}%"
        stmt = stmt.outerjoin(Customer, Customer.id == Payment.customer_id).where(
            or_(
                Payment.reference.ilike(needle),
                Payment.method.ilike(needle),
                Payment.notes.ilike(needle),
                Customer.full_name.ilike(needle),
                Customer.code.ilike(needle),
            )
        )
    if not (user.is_staff or user.is_superuser):
        res = await db.execute(select(Customer).where(Customer.user_id == user.id))
        c = res.scalar_one_or_none()
        stmt = stmt.where(Payment.customer_id == (c.id if c else -1))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Payment.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[PaymentOut](
        items=[PaymentOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


# ── Expenses ─────────────────────────────────────────────────────────────────
@router.get("/expenses", response_model=PaginatedResponse[ExpenseOut])
async def list_expenses(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("finance:read")),
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
        stmt.order_by(Expense.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[ExpenseOut](
        items=[ExpenseOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
async def create_expense(data: ExpenseCreate, db: AsyncSession = Depends(get_db),
                         user: User = Depends(require_permissions("finance:create"))):
    e = Expense(actor_id=user.id, **data.model_dump())
    db.add(e); await db.commit()
    return ExpenseOut.model_validate(e)
