"""Daftra integration request/response schemas."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DaftraSyncRequest(BaseModel):
    modules: Optional[List[str]] = Field(
        default=None,
        description=(
            "Subset of: clients, portal, products, subscriptions, invoices, "
            "payments, expenses, refund_receipts, designations, staff, payslips, work_orders"
        ),
    )


class DaftraModuleResultOut(BaseModel):
    module: str
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = Field(default_factory=list)
    pages_done: int = 0
    total_pages: Optional[int] = None


class DaftraSyncReportOut(BaseModel):
    ok: bool = True
    status: Optional[str] = None
    current_module: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    message: Optional[str] = None
    modules: List[DaftraModuleResultOut] = Field(default_factory=list)


class DaftraStatusOut(BaseModel):
    enabled: bool
    configured: bool
    base_url: str
    last_sync: Optional[Dict[str, Any]] = None
    mapped_counts: Dict[str, int] = Field(default_factory=dict)
    sync_running: bool = False


class DaftraTestOut(BaseModel):
    ok: bool
    message: str
    site: Optional[Dict[str, Any]] = None
