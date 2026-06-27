"""Human-friendly document codes."""
from __future__ import annotations

import secrets
from datetime import datetime


def _suffix() -> str:
    return secrets.token_hex(3).upper()


def make_code(prefix: str) -> str:
    """Returns e.g. ORD-20260604-9F4E1A."""
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{_suffix()}"


def order_code() -> str:        return make_code("ORD")
def quotation_code() -> str:    return make_code("QUO")
def invoice_code() -> str:      return make_code("INV")
def ticket_code() -> str:       return make_code("TCK")
def customer_code() -> str:     return make_code("CUS")
def install_code() -> str:      return make_code("INS")
def embroidery_code() -> str:   return make_code("EMB")
def academic_code() -> str:     return make_code("ACA")
def billboard_code() -> str:    return make_code("BLB")
