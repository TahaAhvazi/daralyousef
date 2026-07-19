"""Auth schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class LoginInput(BaseModel):
    """Email (staff) or phone number (portal customers)."""
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = None
    company_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshInput(BaseModel):
    refresh_token: str


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class RoleOut(ORMModel):
    id: int
    name: str
    slug: str


class UserOut(ORMModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    title: Optional[str] = None
    is_active: bool
    is_staff: bool
    is_superuser: bool
    theme: str
    locale: str
    last_login_at: Optional[datetime] = None
    daftra_id: Optional[str] = None
    roles: List[RoleOut] = []
    permissions: List[str] = []


class UpdateProfileInput(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = None
    locale: Optional[str] = None


class ChangePasswordInput(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
