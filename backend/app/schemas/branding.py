"""Schemas for the brand-settings endpoint."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


HEX_COLOR_RE = r"^#[0-9A-Fa-f]{6}$"


class BrandSettingsOut(ORMModel):
    app_name: str
    app_name_ar: str
    tagline: str
    tagline_ar: str
    sidebar_subtitle: str
    sidebar_subtitle_ar: str
    logo_url: Optional[str] = None
    brand_color: str
    brand_color_dark: str
    accent_color: str
    accent_color_dark: str


class BrandSettingsUpdate(BaseModel):
    app_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    app_name_ar: Optional[str] = Field(default=None, min_length=1, max_length=120)
    tagline: Optional[str] = Field(default=None, min_length=1, max_length=200)
    tagline_ar: Optional[str] = Field(default=None, min_length=1, max_length=200)
    sidebar_subtitle: Optional[str] = Field(default=None, min_length=1, max_length=120)
    sidebar_subtitle_ar: Optional[str] = Field(default=None, min_length=1, max_length=120)
