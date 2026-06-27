"""Shared line-total and order aggregate calculations."""
from __future__ import annotations

from app.models.order import Order, OrderItem


def round_money(x: float) -> float:
    return round(float(x or 0), 2)


def compute_line_total(item: OrderItem) -> float:
    sub = item.unit_price * item.quantity
    after_disc = sub * (1 - item.discount_pct / 100.0)
    item.line_total = round_money(after_disc)
    return item.line_total


def aggregate_order_totals(order: Order) -> None:
    subtotal = 0.0
    tax_total = 0.0
    for it in order.items:
        line = compute_line_total(it)
        subtotal += line
        tax_total += line * (it.tax_rate / 100.0)
    order.subtotal = round_money(subtotal)
    order.tax_total = round_money(tax_total)
    order.discount_total = 0.0
    order.grand_total = round_money(subtotal + tax_total)
