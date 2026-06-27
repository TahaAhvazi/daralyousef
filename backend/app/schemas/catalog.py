"""Catalog schemas."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class CategoryBase(BaseModel):
    name: str
    name_ar: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: int = 0
    description: Optional[str] = None


class CategoryCreate(CategoryBase): ...
class CategoryUpdate(CategoryBase):
    name: Optional[str] = None  # type: ignore


class CategoryOut(ORMModel, CategoryBase):
    id: int


class ProductBase(BaseModel):
    sku: Optional[str] = None
    name: str
    name_ar: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[int] = None
    unit: str = "pcs"
    base_price: float = 0.0
    cost: float = 0.0
    tax_rate: float = 0.0
    image_url: Optional[str] = None
    description: Optional[str] = None
    description_ar: Optional[str] = None
    options: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_customizable: bool = True
    pricing_model: str = "variable"


class ProductCreate(ProductBase):
    department_ids: List[int] = []


class ProductUpdate(ProductBase):
    name: Optional[str] = None  # type: ignore
    department_ids: Optional[List[int]] = None


class PricingRuleOut(ORMModel):
    id: int
    attribute: str
    value: str
    multiplier: float
    addend: float


class MaterialBriefOut(ORMModel):
    id: int
    sku: str
    name: str
    unit: str
    on_hand: float
    cost: float
    reorder_level: float


class ProductMaterialOut(ORMModel):
    id: int
    product_id: int
    material_id: int
    quantity_per_unit: float
    material: Optional[MaterialBriefOut] = None


class ProductMaterialLine(BaseModel):
    material_id: int
    quantity_per_unit: float = 1.0


class ProductBomUpdate(BaseModel):
    lines: List[ProductMaterialLine]


class ProductOut(ORMModel, ProductBase):
    id: int
    sku: str
    slug: str
    pricing_rules: List[PricingRuleOut] = []
    required_departments: List["DepartmentOut"] = []
    materials: List[ProductMaterialOut] = []
    stock_status: Optional[str] = None


from app.schemas.department import DepartmentOut  # noqa: E402
ProductOut.model_rebuild()


class QuoteRequest(BaseModel):
    product_id: int
    quantity: float = 1.0
    options: Dict[str, str] = {}


class QuoteEstimate(BaseModel):
    unit_price: float
    line_total: float
    breakdown: Dict[str, float]
    currency: str = "USD"
