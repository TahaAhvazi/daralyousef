"""Aggregate v1 router."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    audit, auth, brand, catalog, conversations, crm, customers, dashboard, departments, daftra, files,
    finance, hr, inventory, notifications, order_notes, orders, sales_ops, tickets, users,
)


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["crm"])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(order_notes.router, prefix="/orders", tags=["orders"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(sales_ops.router, prefix="/sales", tags=["sales"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["support"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["messages"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
api_router.include_router(brand.router, prefix="/brand", tags=["brand"])
api_router.include_router(daftra.router, prefix="/integrations/daftra", tags=["integrations"])
