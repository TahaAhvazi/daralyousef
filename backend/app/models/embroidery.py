"""Embroidery projects."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


class EmbroideryProject(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "embroidery_projects"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    item_type: Mapped[str] = mapped_column(String(80), nullable=False)  # uniform, cap, jacket…
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stitch_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    machine: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
