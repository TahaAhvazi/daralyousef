"""CRM schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class LeadBase(BaseModel):
    full_name: str
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: str = "new"
    score: int = 0
    estimated_value: float = 0.0
    notes: Optional[str] = None
    owner_id: Optional[int] = None


class LeadCreate(LeadBase): ...


class LeadUpdate(LeadBase):
    full_name: Optional[str] = None  # type: ignore


class LeadOut(ORMModel, LeadBase):
    id: int
    converted_customer_id: Optional[int] = None


class OpportunityBase(BaseModel):
    title: str
    customer_id: Optional[int] = None
    lead_id: Optional[int] = None
    expected_value: float = 0.0
    probability: int = 50
    stage: str = "proposal"
    close_date: Optional[date] = None
    owner_id: Optional[int] = None
    notes: Optional[str] = None


class OpportunityCreate(OpportunityBase): ...


class OpportunityUpdate(OpportunityBase):
    title: Optional[str] = None  # type: ignore


class OpportunityOut(ORMModel, OpportunityBase):
    id: int


class FollowUpBase(BaseModel):
    subject: str
    due_at: datetime
    done: bool = False
    owner_id: Optional[int] = None
    customer_id: Optional[int] = None
    lead_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    notes: Optional[str] = None


class FollowUpCreate(FollowUpBase): ...


class FollowUpOut(ORMModel, FollowUpBase):
    id: int
