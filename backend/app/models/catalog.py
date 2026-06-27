"""Catalog models: ProductCategory, Product, PricingRule, ProductMaterial."""
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.inventory import Material


class ProductCategory(IntPK, TimestampMixin, Base):
    __tablename__ = "product_categories"

    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    name_ar: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    icon: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_categories.id"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship(back_populates="category")


class Product(IntPK, TimestampMixin, SoftDeleteMixin, Base):
    """A sellable service / product (printing job type, design service, etc.)."""
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    name_ar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True, index=True)

    unit: Mapped[str] = mapped_column(String(20), default="pcs", nullable=False)
    base_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_ar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    """JSON of configurable attributes, e.g. {sizes: [...], materials: [...]}."""

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_customizable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    pricing_model: Mapped[str] = mapped_column(String(20), default="variable", nullable=False)
    """fixed | variable | custom_quote"""

    category: Mapped[Optional[ProductCategory]] = relationship(back_populates="products")
    pricing_rules: Mapped[List["PricingRule"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    required_departments: Mapped[List["Department"]] = relationship(
        secondary="product_departments", back_populates="products"
    )
    materials: Mapped[List["ProductMaterial"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductMaterial(IntPK, TimestampMixin, Base):
    """Bill of materials — how much of each material one product unit consumes."""
    __tablename__ = "product_materials"
    __table_args__ = (UniqueConstraint("product_id", "material_id", name="uq_product_material"),)

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity_per_unit: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)

    product: Mapped["Product"] = relationship(back_populates="materials")
    material: Mapped["Material"] = relationship()


class PricingRule(IntPK, TimestampMixin, Base):
    """Multiplicative or additive rule based on attribute values.

    Example: {attribute: 'material', value: 'mesh', multiplier: 1.25}
    Example: {attribute: 'complexity', value: 'high', addend: 80}
    """
    __tablename__ = "pricing_rules"

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[str] = mapped_column(String(80), nullable=False)
    multiplier: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    addend: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    product: Mapped[Product] = relationship(back_populates="pricing_rules")
