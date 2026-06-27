"""Instant pricing calculator."""
from __future__ import annotations

from typing import Dict, Iterable, Tuple

from app.models.catalog import PricingRule, Product


def calculate_price(
    product: Product,
    *,
    quantity: float,
    options: Dict[str, str],
    rules: Iterable[PricingRule] = (),
) -> Tuple[float, float, Dict[str, float]]:
    """Compute (unit_price, line_total, breakdown) for a configured product.

    - unit_price = base_price × Π(multiplier of matched rules) + Σ(addends).
    - line_total = unit_price × quantity.
    """
    unit = product.base_price
    breakdown: Dict[str, float] = {"base": product.base_price}

    multiplier = 1.0
    addend = 0.0

    for rule in rules:
        if options.get(rule.attribute) == rule.value:
            multiplier *= rule.multiplier
            addend += rule.addend
            breakdown[f"{rule.attribute}:{rule.value}"] = rule.multiplier * unit + rule.addend

    unit = unit * multiplier + addend

    qty = max(0.0, float(quantity or 0))
    # tiny volume discount: 5% for 100+, 10% for 500+
    if qty >= 500:
        unit *= 0.90
        breakdown["volume_discount"] = -0.10 * unit
    elif qty >= 100:
        unit *= 0.95
        breakdown["volume_discount"] = -0.05 * unit

    line_total = round(unit * qty, 2)
    return round(unit, 2), line_total, breakdown
