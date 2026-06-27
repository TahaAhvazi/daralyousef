"""Outdoor advertising: Billboard, Vehicle, InstallationProject."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


class Billboard(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "billboards"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    size: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # billboard/signboard/lightbox
    monthly_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="available", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Vehicle(IntPK, TimestampMixin, Base):
    __tablename__ = "vehicles"

    plate: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    model: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    color: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class InstallationProject(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "installation_projects"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    billboard_id: Mapped[Optional[int]] = mapped_column(ForeignKey("billboards.id", ondelete="SET NULL"), nullable=True)
    vehicle_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[str] = mapped_column(String(40), default="billboard", nullable=False)
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    completed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    crew: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="scheduled", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
