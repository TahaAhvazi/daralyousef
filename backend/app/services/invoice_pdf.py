"""Clean formal A4 invoice PDF â€” matches on-screen invoice document (EN & AR)."""
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
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

FONTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

_FONTS_REGISTERED = False

# Soft formal palette (aligned with staff UI)
INK = colors.HexColor("#1C2434")
MUTED = colors.HexColor("#6B7280")
SOFT = colors.HexColor("#F3F4F6")
LINE = colors.HexColor("#E5E7EB")
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
        "title": "Invoice",
        "invoice_no": "Invoice number",
        "invoice_date": "Invoice date",
        "due_date": "Due date",
        "status": "Status",
        "currency": "Currency",
        "order_ref": "Order ref.",
        "sold_by": "Sold by",
        "warehouse": "Warehouse",
        "bill_to": "Bill to",
        "phone": "Phone",
        "email": "Email",
        "address": "Address",
        "item": "Item",
        "description": "Description",
        "unit_price": "Unit price",
        "qty": "Qty",
        "discount": "Discount",
        "tax_pct": "Tax %",
        "total": "Total",
        "subtotal": "Subtotal",
        "discount_total": "Discount",
        "tax_total": "Tax",
        "grand_total": "Total",
        "paid": "Paid",
        "balance": "Amount due",
        "notes": "Notes / terms",
        "thank_you": "Thank you for your business.",
        "statuses": {
            "unpaid": "Unpaid",
            "partial": "Partially paid",
            "paid": "Paid",
            "draft": "Draft",
            "overpaid": "Overpaid",
            "late": "Late",
        },
    },
    "ar": {
        "title": "ÙØ§ØªÙˆØ±Ø©",
        "invoice_no": "Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©",
        "invoice_date": "ØªØ§Ø±ÙŠØ® Ø§Ù„ÙØ§ØªÙˆØ±Ø©",
        "due_date": "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚",
        "status": "Ø§Ù„Ø­Ø§Ù„Ø©",
        "currency": "Ø§Ù„Ø¹Ù…Ù„Ø©",
        "order_ref": "Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨",
        "sold_by": "Ø¨ÙˆØ§Ø³Ø·Ø©",
        "warehouse": "Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹",
        "bill_to": "ÙØ§ØªÙˆØ±Ø© Ø¥Ù„Ù‰",
        "phone": "Ø§Ù„Ù‡Ø§ØªÙ",
        "email": "Ø§Ù„Ø¨Ø±ÙŠØ¯",
        "address": "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†",
        "item": "Ø§Ù„Ø¨Ù†Ø¯",
        "description": "Ø§Ù„ÙˆØµÙ",
        "unit_price": "Ø³Ø¹Ø± Ø§Ù„ÙˆØ­Ø¯Ø©",
        "qty": "Ø§Ù„ÙƒÙ…ÙŠØ©",
        "discount": "Ø§Ù„Ø®ØµÙ…",
        "tax_pct": "Ø§Ù„Ø¶Ø±ÙŠØ¨Ø© %",
        "total": "Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹",
        "subtotal": "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙØ±Ø¹ÙŠ",
        "discount_total": "Ø§Ù„Ø®ØµÙ…",
        "tax_total": "Ø§Ù„Ø¶Ø±ÙŠØ¨Ø©",
        "grand_total": "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ",
        "paid": "Ù…Ø¯ÙÙˆØ¹Ø©",
        "balance": "Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø³ØªØ­Ù‚",
        "notes": "Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª / Ø§Ù„Ø´Ø±ÙˆØ·",
        "thank_you": "Ø´ÙƒØ±Ø§Ù‹ Ù„ØªØ¹Ø§Ù…Ù„ÙƒÙ… Ù…Ø¹Ù†Ø§.",
        "statuses": {
            "unpaid": "ØºÙŠØ± Ù…Ø¯ÙÙˆØ¹Ø©",
            "partial": "Ù…Ø¯ÙÙˆØ¹Ø© Ø¬Ø²Ø¦ÙŠØ§Ù‹",
            "paid": "Ù…Ø¯ÙÙˆØ¹Ø©",
            "draft": "Ù…Ø³ÙˆØ¯Ø©",
            "overpaid": "Ù…Ø¯ÙÙˆØ¹ Ø¨Ø§Ù„Ø²ÙŠØ§Ø¯Ø©",
            "late": "Ù…ØªØ£Ø®Ø±",
        },
    },
}

_META_NOTE_PREFIXES = (
    "salesperson:",
    "Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª",
    "warehouse:",
    "Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹",
    "invoice template:",
    "Ù‚Ø§Ù„Ø¨",
    "invoice date:",
    "ØªØ§Ø±ÙŠØ® Ø§Ù„ÙØ§ØªÙˆØ±Ø©",
    "invoice discount:",
    "Ø®ØµÙ…",
    "settlement:",
    "Ø§Ù„ØªØ³ÙˆÙŠØ©",
    "advance",
    "Ø§Ù„Ø¯ÙØ¹Ø©",
    "deposit",
    "Ø¥ÙŠØ¯Ø§Ø¹",
)


def _parse_note_field(notes: Optional[str], prefixes: tuple[str, ...]) -> Optional[str]:
    if not notes:
        return None
    for line in notes.splitlines():
        raw = line.strip()
        for prefix in prefixes:
            if raw.lower().startswith(prefix.lower()):
                return raw[len(prefix):].strip(" :ï¼š") or None
    return None


def _public_notes(notes: Optional[str]) -> Optional[str]:
    if not notes:
        return None
    kept = []
    for line in notes.splitlines():
        raw = line.strip()
        if not raw:
            continue
        lower = raw.lower()
        if any(lower.startswith(p) for p in _META_NOTE_PREFIXES):
            continue
        kept.append(raw)
    return "\n".join(kept) if kept else None


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
    sold_by: Optional[str] = None
    warehouse: Optional[str] = None


def _money(amount: float, currency: str, lang: str) -> str:
    sym = {"USD": "$", "IQD": "Ø¯.Ø¹", "EUR": "â‚¬"}.get(currency, currency + " ")
    val = f"{amount:,.2f}"
    if lang == "ar":
        return _shape_ar(f"{val} {sym}")
    if currency == "IQD":
        return f"{val} {sym}"
    return f"{sym}{val}"


def _fmt_date(d: Optional[date], lang: str) -> str:
    if not d:
        return "â€”"
    s = d.strftime("%d/%m/%Y") if lang == "ar" else d.strftime("%b %d, %Y")
    return _shape_ar(s) if lang == "ar" else s


def _escape(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _para(
    text: str,
    lang: str,
    *,
    size: float = 10,
    bold: bool = False,
    color=None,
    align=TA_LEFT,
    leading: Optional[float] = None,
) -> Paragraph:
    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        name=f"inv_{lang}_{size}_{int(bold)}_{align}_{id(color)}",
        parent=styles["Normal"],
        fontName=_font(lang, bold),
        fontSize=size,
        leading=leading or size * 1.45,
        alignment=align,
        textColor=color or INK,
    )
    safe = _escape(text).replace("\n", "<br/>")
    return Paragraph(_t(safe, lang), style)


def _hairline(width: float, color=LINE) -> HRFlowable:
    return HRFlowable(width=width, thickness=0.6, color=color, spaceBefore=0, spaceAfter=0)


def _logo_image(logo_path: Path, max_side_mm: float = 16) -> Image | None:
    """Embed a small logo; downscale large JPEGs so PDF stays light and fast."""
    try:
        from io import BytesIO as _BytesIO

        from PIL import Image as PILImage

        with PILImage.open(logo_path) as im:
            im = im.convert("RGB")
            im.thumbnail((220, 220))
            buf = _BytesIO()
            im.save(buf, format="JPEG", quality=82, optimize=True)
            buf.seek(0)
            return Image(buf, width=max_side_mm * mm, height=max_side_mm * mm, kind="proportional")
    except Exception:
        try:
            return Image(str(logo_path), width=max_side_mm * mm, height=max_side_mm * mm, kind="proportional")
        except Exception:
            return None


def generate_invoice_pdf(ctx: InvoicePdfContext) -> bytes:
    _register_fonts()
    lang = ctx.lang if ctx.lang in LABELS else "en"
    L = LABELS[lang]
    rtl = lang == "ar"
    align_start = TA_RIGHT if rtl else TA_LEFT
    align_end = TA_LEFT if rtl else TA_RIGHT

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

    sold_by = ctx.sold_by or _parse_note_field(
        ctx.notes, ("Salesperson:", "Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª:", "salesperson:")
    )
    warehouse = ctx.warehouse or _parse_note_field(
        ctx.notes, ("Warehouse:", "Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹:")
    )
    status_label = L["statuses"].get(ctx.status, ctx.status)

    # â”€â”€ Header: brand | invoice title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    brand_cells: list[Any] = []
    if ctx.logo_path and ctx.logo_path.exists():
        logo_img = _logo_image(ctx.logo_path)
        if logo_img is not None:
            brand_cells.append(logo_img)
    brand_text = [
        _para(ctx.company_name, lang, size=13, bold=True, color=INK, align=align_start),
    ]
    if ctx.company_tagline:
        brand_text.append(_para(ctx.company_tagline, lang, size=8.5, color=MUTED, align=align_start))
    if ctx.company_address:
        brand_text.append(_para(ctx.company_address, lang, size=8, color=MUTED, align=align_start))

    if brand_cells:
        brand_block = Table(
            [[brand_cells[0], brand_text]],
            colWidths=[18 * mm, content_w * 0.42],
        )
        brand_block.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
    else:
        brand_block = brand_text

    meta_lines = [
        _para(L["title"], lang, size=20, bold=True, color=brand, align=align_end),
        Spacer(1, 4),
        _para(f"{L['invoice_no']}: {ctx.invoice_code}", lang, size=9.5, bold=True, color=INK, align=align_end),
        _para(f"{L['invoice_date']}: {_fmt_date(ctx.issue_date, lang)}", lang, size=9.5, color=MUTED, align=align_end),
        _para(f"{L['due_date']}: {_fmt_date(ctx.due_date, lang)}", lang, size=9.5, color=MUTED, align=align_end),
        _para(f"{L['status']}: {status_label}", lang, size=9.5, color=MUTED, align=align_end),
        _para(f"{L['currency']}: {ctx.currency}", lang, size=9.5, color=MUTED, align=align_end),
    ]
    if ctx.order_code:
        meta_lines.append(
            _para(f"{L['order_ref']}: {ctx.order_code}", lang, size=9.5, color=MUTED, align=align_end)
        )

    if rtl:
        header = Table([[meta_lines, brand_block]], colWidths=[content_w * 0.42, content_w * 0.58])
    else:
        header = Table([[brand_block, meta_lines]], colWidths=[content_w * 0.58, content_w * 0.42])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header)
    story.append(Spacer(1, 10))
    story.append(_hairline(content_w, brand))
    story.append(Spacer(1, 14))

    # â”€â”€ Bill to + meta side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    bill_bits = [
        _para(L["bill_to"], lang, size=8, bold=True, color=MUTED, align=align_start),
        Spacer(1, 2),
        _para(ctx.customer_name, lang, size=12, bold=True, color=INK, align=align_start),
    ]
    if ctx.customer_email:
        bill_bits.append(_para(f"{L['email']}: {ctx.customer_email}", lang, size=9, color=MUTED, align=align_start))
    if ctx.customer_phone:
        bill_bits.append(_para(f"{L['phone']}: {ctx.customer_phone}", lang, size=9, color=MUTED, align=align_start))
    if ctx.customer_address:
        bill_bits.append(_para(f"{L['address']}: {ctx.customer_address}", lang, size=9, color=MUTED, align=align_start))

    side_bits: list[Any] = []
    if sold_by:
        side_bits.append(_para(f"{L['sold_by']}: {sold_by}", lang, size=9.5, color=INK, align=align_end))
    if warehouse:
        side_bits.append(_para(f"{L['warehouse']}: {warehouse}", lang, size=9.5, color=MUTED, align=align_end))

    if side_bits:
        info = Table(
            [[bill_bits, side_bits]] if not rtl else [[side_bits, bill_bits]],
            colWidths=[content_w * 0.58, content_w * 0.42],
        )
    else:
        info = Table([[bill_bits]], colWidths=[content_w])
    info.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(info)
    story.append(Spacer(1, 16))

    # â”€â”€ Line items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    show_disc = any((it.discount_pct or 0) > 0 for it in ctx.items)
    show_tax = any((it.tax_rate or 0) > 0 for it in ctx.items) or abs(ctx.tax_total) > 0.005

    headers = [L["item"], L["description"], L["unit_price"], L["qty"]]
    widths = [36 * mm, 58 * mm, 28 * mm, 16 * mm]
    if show_disc:
        headers.append(L["discount"])
        widths.append(18 * mm)
    if show_tax:
        headers.append(L["tax_pct"])
        widths.append(16 * mm)
    headers.append(L["total"])
    widths.append(28 * mm)

    scale = content_w / sum(widths)
    widths = [w * scale for w in widths]
    if rtl:
        headers = list(reversed(headers))
        widths = list(reversed(widths))

    data: list[list[Any]] = [[
        _para(h, lang, size=8, bold=True, color=MUTED, align=align_start) for h in headers
    ]]

    for it in ctx.items:
        cells = [
            _para(it.name or "â€”", lang, size=9.5, bold=True, align=align_start),
            _para(it.description or "â€”", lang, size=9, color=MUTED, align=align_start),
            _para(_money(it.unit_price, ctx.currency, lang), lang, size=9.5, align=align_end),
            _para(f"{it.quantity:g}", lang, size=9.5, align=align_end),
        ]
        if show_disc:
            cells.append(_para(f"{it.discount_pct:g}%", lang, size=9, align=align_end))
        if show_tax:
            cells.append(_para(f"{it.tax_rate:g}%", lang, size=9, align=align_end))
        cells.append(
            _para(_money(it.line_total, ctx.currency, lang), lang, size=9.5, bold=True, align=align_end)
        )
        if rtl:
            cells = list(reversed(cells))
        data.append(cells)

    items = Table(data, colWidths=widths, repeatRows=1)
    items.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, LINE),
        ("LINEBELOW", (0, 1), (-1, -2), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT" if rtl else "LEFT"),
    ]))
    story.append(items)
    story.append(Spacer(1, 18))

    # â”€â”€ Notes + full totals (always complete) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    notes_clean = _public_notes(ctx.notes)
    notes_block: list[Any] = []
    if notes_clean:
        notes_block = [
            _para(L["notes"], lang, size=8, bold=True, color=MUTED, align=align_start),
            Spacer(1, 4),
            _para(notes_clean, lang, size=9.5, color=INK, align=align_start, leading=14),
        ]
    else:
        notes_block = [
            _para(L["notes"], lang, size=8, bold=True, color=MUTED, align=align_start),
            Spacer(1, 4),
            _para("â€”", lang, size=9.5, color=MUTED, align=align_start),
        ]

    total_rows_data = [
        (L["subtotal"], ctx.subtotal, False, False),
    ]
    if abs(ctx.discount_total) > 0.005:
        total_rows_data.append((L["discount_total"], ctx.discount_total, False, False))
    total_rows_data.extend([
        (L["tax_total"], ctx.tax_total, False, False),
        (L["grand_total"], ctx.grand_total, True, False),
        (L["paid"], ctx.paid_total, False, False),
        (L["balance"], ctx.balance, True, True),
    ])

    tot_cells = []
    for label, val, bold, emphasize in total_rows_data:
        color = brand if emphasize else INK
        label_color = brand if emphasize else MUTED
        if rtl:
            tot_cells.append([
                _para(_money(val, ctx.currency, lang), lang, size=10.5, bold=bold, color=color, align=TA_LEFT),
                _para(label, lang, size=9.5, bold=bold, color=label_color, align=TA_RIGHT),
            ])
        else:
            tot_cells.append([
                _para(label, lang, size=9.5, bold=bold, color=label_color, align=TA_LEFT),
                _para(_money(val, ctx.currency, lang), lang, size=10.5, bold=bold, color=color, align=TA_RIGHT),
            ])

    totals = Table(tot_cells, colWidths=[48 * mm, 40 * mm])
    totals.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("LINEABOVE", (0, -1), (-1, -1), 1.1, brand),
        ("TOPPADDING", (0, -1), (-1, -1), 9),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 9),
    ]))

    if rtl:
        bottom = Table([[totals, notes_block]], colWidths=[content_w * 0.42, content_w * 0.58])
    else:
        bottom = Table([[notes_block, totals]], colWidths=[content_w * 0.52, content_w * 0.48])
    bottom.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(bottom)
    story.append(Spacer(1, 28))

    # â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    story.append(_hairline(content_w))
    story.append(Spacer(1, 8))
    story.append(_para(L["thank_you"], lang, size=9, color=MUTED, align=TA_CENTER))
    story.append(Spacer(1, 6))
    accent = Table([[""]], colWidths=[36 * mm], rowHeights=[2.2 * mm])
    accent.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), brand),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    accent_wrap = Table([[accent]], colWidths=[content_w])
    accent_wrap.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(KeepTogether([accent_wrap]))

    doc.build(story)
    return buf.getvalue()
