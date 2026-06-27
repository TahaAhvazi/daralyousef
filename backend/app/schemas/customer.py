"""Company / Customer schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr

from app.schemas.common import ORMModel


class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(CompanyBase):
    name: Optional[str] = None  # type: ignore


class CompanyOut(ORMModel, CompanyBase):
    id: int


class CustomerBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    title: Optional[str] = None
    company_id: Optional[int] = None
    tags: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    full_name: Optional[str] = None  # type: ignore


class CustomerOut(ORMModel, CustomerBase):
    id: int
    code: str
    user_id: Optional[int] = None
