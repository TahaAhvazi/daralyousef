"""Singleton brand-settings model.

Stores the system display name (per locale), tagline, logo URL and the
organisation colour palette. Only the ``id == 1`` row is ever used; updates
mutate the same record.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IntPK, TimestampMixin


# Fixed monochrome palette — used only for invoice PDFs (UI theme is CSS-driven).
DEFAULT_BRAND_LIGHT = "#171717"
DEFAULT_BRAND_DARK = "#FAFAFA"
DEFAULT_ACCENT_LIGHT = "#525252"
DEFAULT_ACCENT_DARK = "#A3A3A3"


class BrandSettings(IntPK, TimestampMixin, Base):
    __tablename__ = "brand_settings"

    app_name: Mapped[str] = mapped_column(String(120), nullable=False, default="Dar Al-Yousef Printing")
    app_name_ar: Mapped[str] = mapped_column(String(120), nullable=False, default="مطبعة دار اليوسف")
    tagline: Mapped[str] = mapped_column(String(200), nullable=False, default="Print · Brand · Beyond")
    tagline_ar: Mapped[str] = mapped_column(String(200), nullable=False, default="طباعة · هوية · وأكثر")
    sidebar_subtitle: Mapped[str] = mapped_column(String(120), nullable=False, default="Enterprise Suite")
    sidebar_subtitle_ar: Mapped[str] = mapped_column(String(120), nullable=False, default="نظام إدارة المؤسسة")
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)

    # Legacy palette columns — kept for invoice PDFs; not exposed in admin UI.
    brand_color: Mapped[str] = mapped_column(String(7), nullable=False, default=DEFAULT_BRAND_LIGHT)
    brand_color_dark: Mapped[str] = mapped_column(String(7), nullable=False, default=DEFAULT_BRAND_DARK)
    accent_color: Mapped[str] = mapped_column(String(7), nullable=False, default=DEFAULT_ACCENT_LIGHT)
    accent_color_dark: Mapped[str] = mapped_column(String(7), nullable=False, default=DEFAULT_ACCENT_DARK)
