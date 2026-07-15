"""Project shift notes — handoff notes separate from chat."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


class OrderNote(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    """Shift / handoff note on an order — not a chat message."""

    __tablename__ = "order_notes"

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    author_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)

    order = relationship("Order", back_populates="project_notes")
    author = relationship("User")
