"""Educational printing: School, Teacher, AcademicRequest."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin


class School(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "schools"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    type: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # school/university/center
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)


class Teacher(IntPK, TimestampMixin, Base):
    __tablename__ = "teachers"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    school_id: Mapped[Optional[int]] = mapped_column(ForeignKey("schools.id", ondelete="SET NULL"), nullable=True, index=True)
    subject: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class AcademicRequest(IntPK, TimestampMixin, Base):
    __tablename__ = "academic_requests"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    teacher_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    school_id: Mapped[Optional[int]] = mapped_column(ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    request_type: Mapped[str] = mapped_column(String(40), nullable=False)  # exam/book/research
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    copies: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
