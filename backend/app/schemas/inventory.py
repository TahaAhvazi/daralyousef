"""Inventory schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class WarehouseBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None


class WarehouseOut(ORMModel, WarehouseBase):
    id: int


class MaterialBase(BaseModel):
    sku: Optional[str] = None
    name: str
    unit: str = "pcs"
    on_hand: float = 0.0
    cost: float = 0.0
    reorder_level: float = 0.0
    warehouse_id: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class MaterialCreate(MaterialBase): ...
class MaterialUpdate(MaterialBase):
    name: Optional[str] = None  # type: ignore


class MaterialOut(ORMModel, MaterialBase):
    id: int
    sku: str


class StockMovementCreate(BaseModel):
    material_id: int
    warehouse_id: Optional[int] = None
    type: str
    quantity: float
    unit_cost: float = 0.0
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None


class StockMovementOut(ORMModel, StockMovementCreate):
    id: int
    actor_id: Optional[int] = None
