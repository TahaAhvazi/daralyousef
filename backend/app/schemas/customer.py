"""Company / Customer schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, model_validator

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
    """CRM create. Optionally also opens a customer-portal login (staff sets password)."""
    create_portal_access: bool = False
    portal_password: Optional[str] = None

    @model_validator(mode="after")
    def _portal_fields(self) -> "CustomerCreate":
        if self.create_portal_access:
            if not self.email:
                raise ValueError("Email is required when creating portal access")
            if not self.portal_password or len(self.portal_password) < 8:
                raise ValueError("Portal password must be at least 8 characters")
        return self


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    title: Optional[str] = None
    company_id: Optional[int] = None
    tags: Optional[str] = None
    notes: Optional[str] = None
    # Optional: open or reset portal login for this CRM customer
    create_portal_access: bool = False
    portal_password: Optional[str] = None

    @model_validator(mode="after")
    def _portal_fields(self) -> "CustomerUpdate":
        if self.create_portal_access and (not self.portal_password or len(self.portal_password) < 8):
            raise ValueError("Portal password must be at least 8 characters")
        if self.portal_password is not None and len(self.portal_password) > 0 and len(self.portal_password) < 8:
            raise ValueError("Portal password must be at least 8 characters")
        return self


class CustomerOut(ORMModel, CustomerBase):
    id: int
    code: str
    user_id: Optional[int] = None

    @property
    def portal_enabled(self) -> bool:
        return self.user_id is not None
