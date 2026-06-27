"""Professional A4 invoice PDF generation (English & Arabic)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from io import BytesIO
from pathlib import Path
from typing import Any, List, Optional

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

FONTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
PAGE_W, PAGE_H = A4
MARGIN = 16 * mm

_FONTS_REGISTERED = False

# Palette
INK = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F1F5F9")
LINE = colors.HexColor("#CBD5E1")
WHITE = colors.white


def _register_fonts() -> None:
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return
    latin = FONTS_DIR / "NotoSans-Regular.ttf"
    latin_b = FONTS_DIR / "NotoSans-Bold.ttf"
    arabic = FONTS_DIR / "NotoNaskhArabic-Regular.ttf"
    if not latin.exists() or not arabic.exists():
        raise FileNotFoundError(
            f"Invoice fonts missing in {FONTS_DIR}. "
            "Run: pip install -r requirements.txt and ensure Noto fonts are present."
        )
    pdfmetrics.registerFont(TTFont("NotoSans", str(latin)))
    if latin_b.exists():
        pdfmetrics.registerFont(TTFont("NotoSans-Bold", str(latin_b)))
    else:
        pdfmetrics.registerFont(TTFont("NotoSans-Bold", str(latin)))
    pdfmetrics.registerFont(TTFont("NotoArabic", str(arabic)))
    _FONTS_REGISTERED = True


def _shape_ar(text: str) -> str:
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(str(text)))


def _t(text: str, lang: str) -> str:
    return _shape_ar(text) if lang == "ar" else text


def _font(lang: str, bold: bool = False) -> str:
    if lang == "ar":
        return "NotoArabic"
    return "NotoSans-Bold" if bold else "NotoSans"


LABELS = {
    "en": {
        "title": "TAX INVOICE",
        "invoice_no": "Invoice No.",
        "issue_date": "Issue Date",
        "due_date": "Due Date",
        "order_ref": "Order Ref.",
        "bill_to": "Bill To",
        "item": "#",
        "description": "Description",
        "qty": "Qty",
        "unit": "Unit",
        "unit_price": "Unit Price",
        "tax": "Tax %",
        "amount": "Amount",
        "subtotal": "Subtotal",
        "discount": "Discount",
        "tax_total": "Tax",
        "grand_total": "Grand Total",
        "paid": "Amount Paid",
        "balance": "Balance Due",
        "notes": "Notes",
        "status": "Status",
        "thank_you": "Thank you for your business.",
        "statuses": {
            "unpaid": "Unpaid",
            "partial": "Partially Paid",
            "paid": "Paid",
        },
    },
    "ar": {
        "title": "فاتورة ضريبية",
        "invoice_no": "رقم الفاتورة",
        "issue_date": "تاريخ الإصدار",
        "due_date": "تاريخ الاستحقاق",
        "order_ref": "مرجع الطلب",
        "bill_to": "فاتورة إلى",
        "item": "#",
        "description": "الوصف",
        "qty": "الكمية",
        "unit": "الوحدة",
        "unit_price": "سعر الوحدة",
        "tax": "الضريبة %",
        "amount": "المبلغ",
        "subtotal": "المجموع الفرعي",
        "discount": "الخصم",
        "tax_total": "الضريبة",
        "grand_total": "الإجمالي",
        "paid": "المدفوع",
        "balance": "المستحق",
        "notes": "ملاحظات",
        "status": "الحالة",
        "thank_you": "شكراً لتعاملكم معنا.",
        "statuses": {
            "unpaid": "غير مدفوعة",
            "partial": "مدفوعة جزئياً",
            "paid": "مدفوعة",
        },
    },
}


@dataclass
class InvoicePdfLine:
    name: str
    description: Optional[str]
    quantity: float
    unit: str
    unit_price: float
    discount_pct: float
    tax_rate: float
    line_total: float


@dataclass
class InvoicePdfContext:
    lang: str
    invoice_code: str
    issue_date: date
    due_date: Optional[date]
    status: str
    currency: str
    subtotal: float
    discount_total: float
    tax_total: float
    grand_total: float
    paid_total: float
    balance: float
    notes: Optional[str]
    order_code: Optional[str]
    customer_name: str
    customer_email: Optional[str]
    customer_phone: Optional[str]
    customer_address: Optional[str]
    company_name: str
    company_tagline: str
    company_address: Optional[str]
    brand_color: str
    logo_path: Optional[Path]
    items: List[InvoicePdfLine]


def _money(amount: float, currency: str, lang: str) -> str:
    sym = {"USD": "$", "IQD": "د.ع", "EUR": "€"}.get(currency, currency + " ")
    val = f"{amount:,.2f}"
    if lang == "ar":
        return _shape_ar(f"{val} {sym}")
    return f"{sym}{val}"


def _fmt_date(d: Optional[date], lang: str) -> str:
    if not d:
        return "—"
    s = d.strftime("%Y-%m-%d")
    return _shape_ar(s) if lang == "ar" else s


def _para(
    text: str,
    lang: str,
    *,
    size: float = 10,
    bold: bool = False,
    color=None,
    align=TA_LEFT,
) -> Paragraph:
    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        name=f"inv_{lang}_{size}_{bold}_{align}",
        parent=styles["Normal"],
        fontName=_font(lang, bold),
        fontSize=size,
        leading=size * 1.4,
        alignment=align,
        textColor=color or INK,
    )
    safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(_t(safe, lang), style)


def _accent_bar(brand: colors.Color, width: float) -> Table:
    bar = Table([[""]], colWidths=[width], rowHeights=[3 * mm])
    bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), brand),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return bar


def _logo_block(ctx: InvoicePdfContext, lang: str, align: int) -> list[Any]:
    block: list[Any] = []
    if ctx.logo_path and ctx.logo_path.exists():
        try:
            block.append(Image(str(ctx.logo_path), width=44 * mm, height=18 * mm, kind="proportional"))
            block.append(Spacer(1, 5))
        except Exception:
            pass
    block.append(_para(ctx.company_name, lang, size=15, bold=True, color=colors.HexColor(ctx.brand_color or "#2D498A"), align=align))
    if ctx.company_tagline:
        block.append(_para(ctx.company_tagline, lang, size=9, color=MUTED, align=align))
    if ctx.company_address:
        block.append(_para(ctx.company_address, lang, size=8, color=colors.HexColor("#94A3B8"), align=align))
    return block


def _meta_row(label: str, value: str, lang: str, rtl: bool) -> list[Any]:
    label_p = _para(label, lang, size=8, color=MUTED, align=TA_RIGHT if rtl else TA_LEFT)
    value_p = _para(value, lang, size=10, bold=True, align=TA_LEFT if rtl else TA_RIGHT)
    return [value_p, label_p] if rtl else [label_p, value_p]


def _meta_card(rows: list[list[Any]], rtl: bool) -> Table:
    tbl = Table(rows, colWidths=[32 * mm, 48 * mm])
    tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT" if rtl else "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return tbl


def generate_invoice_pdf(ctx: InvoicePdfContext) -> bytes:
    _register_fonts()
    lang = ctx.lang if ctx.lang in LABELS else "en"
    L = LABELS[lang]
    rtl = lang == "ar"
    align_main = TA_RIGHT if rtl else TA_LEFT

    brand = colors.HexColor(ctx.brand_color or "#2D498A")
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=ctx.invoice_code,
    )
    story: list[Any] = []
    content_w = doc.width

    # Top accent stripe
    story.append(_accent_bar(brand, content_w))
    story.append(Spacer(1, 10))

    # Header: company + logo | meta card
    company_block = _logo_block(ctx, lang, TA_RIGHT if rtl else TA_LEFT)
    meta_rows = [
        _meta_row(L["invoice_no"], ctx.invoice_code, lang, rtl),
        _meta_row(L["issue_date"], _fmt_date(ctx.issue_date, lang), lang, rtl),
    ]
    if ctx.due_date:
        meta_rows.append(_meta_row(L["due_date"], _fmt_date(ctx.due_date, lang), lang, rtl))
    if ctx.order_code:
        meta_rows.append(_meta_row(L["order_ref"], ctx.order_code, lang, rtl))
    meta_rows.append(
        _meta_row(L["status"], L["statuses"].get(ctx.status, ctx.status), lang, rtl)
    )
    meta_card = _meta_card(meta_rows, rtl)

    if rtl:
        header = Table(
            [[meta_card, company_block]],
            colWidths=[content_w * 0.42, content_w * 0.58],
        )
        header.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (0, 0), "LEFT"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ]))
    else:
        header = Table(
            [[company_block, meta_card]],
            colWidths=[content_w * 0.58, content_w * 0.42],
        )
        header.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (0, 0), "LEFT"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ]))
    story.append(header)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1, color=brand, spaceAfter=12))

    # Title band
    title_tbl = Table(
        [[_para(L["title"], lang, size=22, bold=True, color=brand, align=align_main)]],
        colWidths=[content_w],
    )
    title_tbl.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(title_tbl)
    story.append(Spacer(1, 10))

    # Bill to
    bill_lines = [L["bill_to"], ctx.customer_name]
    if ctx.customer_email:
        bill_lines.append(ctx.customer_email)
    if ctx.customer_phone:
        bill_lines.append(ctx.customer_phone)
    if ctx.customer_address:
        bill_lines.append(ctx.customer_address)
    bill_body = "<br/>".join(_t(x, lang) for x in bill_lines)
    bill_style = ParagraphStyle(
        "bill", fontName=_font(lang, bold=False), fontSize=10, leading=15,
        alignment=align_main, textColor=INK,
    )
    bill_tbl = Table([[Paragraph(bill_body, bill_style)]], colWidths=[content_w * 0.55])
    bill_styles = [
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]
    if rtl:
        bill_styles.append(("LINEBEFORE", (0, 0), (0, 0), 3, brand))
    else:
        bill_styles.append(("LINEAFTER", (0, 0), (0, 0), 3, brand))
    bill_tbl.setStyle(TableStyle(bill_styles))
    bill_wrap = Table([[bill_tbl]], colWidths=[content_w])
    bill_wrap.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "RIGHT" if rtl else "LEFT")]))
    story.append(bill_wrap)
    story.append(Spacer(1, 14))

    # Line items
    col_headers = [L["item"], L["description"], L["qty"], L["unit"], L["unit_price"], L["tax"], L["amount"]]
    col_widths = [9 * mm, 54 * mm, 13 * mm, 13 * mm, 24 * mm, 14 * mm, 27 * mm]
    if rtl:
        col_headers = list(reversed(col_headers))
        col_widths = list(reversed(col_widths))

    header_align = TA_RIGHT if rtl else TA_LEFT
    table_data: list[list[Any]] = [
        [_para(h, lang, size=8, bold=True, color=WHITE, align=header_align) for h in col_headers]
    ]

    for idx, it in enumerate(ctx.items, start=1):
        name_t = _t((it.name or "").replace("&", "&amp;"), lang)
        if it.description:
            desc_t = _t((it.description or "").replace("&", "&amp;"), lang)
            desc = f"{name_t}<br/><font size='7' color='#64748B'>{desc_t}</font>"
        else:
            desc = name_t
        cell_align = align_main
        row = [
            _para(str(idx), lang, size=9, align=cell_align),
            Paragraph(
                desc,
                ParagraphStyle("d", fontName=_font(lang), fontSize=9, leading=13, alignment=cell_align),
            ),
            _para(f"{it.quantity:g}", lang, size=9, align=cell_align),
            _para(it.unit, lang, size=9, align=cell_align),
            _para(_money(it.unit_price, ctx.currency, lang), lang, size=9, align=cell_align),
            _para(f"{it.tax_rate:g}%", lang, size=9, align=cell_align),
            _para(_money(it.line_total, ctx.currency, lang), lang, size=9, bold=True, align=cell_align),
        ]
        if rtl:
            row = list(reversed(row))
        table_data.append(row)

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), brand),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, -1), _font(lang)),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAFBFC")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT" if rtl else "LEFT"),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 12))

    # Totals box
    totals_data = [
        (L["subtotal"], ctx.subtotal, False),
        (L["discount"], ctx.discount_total, False),
        (L["tax_total"], ctx.tax_total, False),
        (L["grand_total"], ctx.grand_total, True),
        (L["paid"], ctx.paid_total, False),
        (L["balance"], ctx.balance, True),
    ]
    total_rows = []
    for label, val, bold in totals_data:
        if rtl:
            total_rows.append([
                _para(_money(val, ctx.currency, lang), lang, size=10, bold=bold, align=TA_LEFT),
                _para(label, lang, size=10, bold=bold, align=TA_RIGHT),
            ])
        else:
            total_rows.append([
                _para(label, lang, size=10, bold=bold, align=TA_LEFT),
                _para(_money(val, ctx.currency, lang), lang, size=10, bold=bold, align=TA_RIGHT),
            ])

    totals_inner = Table(total_rows, colWidths=[42 * mm, 38 * mm])
    totals_style = [
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("LINEABOVE", (0, 3), (-1, 3), 1, brand),
        ("LINEABOVE", (0, 5), (-1, 5), 1.5, brand),
        ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#EEF2FF")),
        ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#EEF2FF")),
    ]
    totals_inner.setStyle(TableStyle(totals_style))
    totals_wrap = Table([[totals_inner]], colWidths=[content_w])
    totals_wrap.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "LEFT" if rtl else "RIGHT"),
    ]))
    story.append(totals_wrap)
    story.append(Spacer(1, 14))

    if ctx.notes:
        notes_tbl = Table(
            [[
                _para(L["notes"], lang, size=9, bold=True, align=align_main),
            ], [
                _para(ctx.notes, lang, size=9, color=MUTED, align=align_main),
            ]],
            colWidths=[content_w],
        )
        notes_tbl.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(notes_tbl)
        story.append(Spacer(1, 10))

    story.append(HRFlowable(width="100%", thickness=0.5, color=LINE, spaceBefore=4))
    story.append(Spacer(1, 6))
    story.append(_para(L["thank_you"], lang, size=9, color=MUTED, align=TA_CENTER))
    story.append(Spacer(1, 4))
    footer_bar = Table([[_accent_bar(brand, content_w * 0.3)]], colWidths=[content_w])
    footer_bar.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(footer_bar)

    doc.build(story)
    return buf.getvalue()
