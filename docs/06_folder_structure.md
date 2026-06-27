# 06 — Folder Structure

## Why this layout?

We use a **modular monolith** with **Clean Architecture** layering inside each
module:

```
HTTP (api/v1/endpoints) → service → repository → model
                       ↘ schema (in/out DTOs) ↗
```

The same module name (e.g. `orders`) appears in `models/`, `schemas/`,
`repositories/`, `services/`, `api/v1/endpoints/`. This makes vertical slicing
trivial and onboarding fast.

## Backend (`backend/app/`)

```
core/                  cross-cutting
├─ config.py           Settings (pydantic-settings)
├─ security.py         password hashing, JWT, deps
├─ logging.py          structured logging
└─ exceptions.py       AppException, http handlers

db/
├─ base.py             SQLAlchemy Base, async session
├─ session.py          get_db dependency
├─ init_db.py          create_all + seed
└─ seed.py             demo roles / users / catalog

models/                ORM models, one file per aggregate
├─ user.py             User, RefreshToken
├─ rbac.py             Role, Permission, UserRole, RolePermission, UserPermission
├─ customer.py         Company, Customer
├─ crm.py              Lead, Opportunity, FollowUp, Note
├─ catalog.py          ProductCategory, Product, PricingRule
├─ order.py            Order, OrderItem, OrderStatusEvent
├─ production.py       PrintJob, DesignRevision, DesignApproval, Signature
├─ inventory.py        Warehouse, Material, StockMovement, MaterialUsage
├─ finance.py          Quotation, QuotationItem, Invoice, InvoiceItem, Payment, Expense
├─ support.py          Ticket, TicketMessage, Message
├─ marketing.py        Campaign, ContentPost, SocialAccount
├─ outdoor.py          Billboard, Vehicle, InstallationProject
├─ embroidery.py       EmbroideryProject
├─ academic.py         School, Teacher, AcademicRequest
├─ attachment.py       Attachment (polymorphic)
├─ notification.py     Notification
└─ audit.py            AuditLog, OutboxEmail

schemas/               one file per module, mirrors models
api/v1/endpoints/      one file per module, mounted in api/v1/router.py
repositories/          data access; reusable across services
services/              business logic / orchestration
utils/                 ids, slug, pricing, mime, etc.
main.py                FastAPI app, CORS, lifespan, router includes
```

## Frontend (`frontend/src/`)

```
api/             typed axios clients, one file per backend module
components/
├─ ui/           design-system primitives (Button, Card, Input, …)
├─ layout/       Sidebar, Topbar, Breadcrumbs
├─ charts/       wrapped recharts components
└─ feature/      composed feature components (OrderTable, …)
layouts/
├─ AppShell.tsx  authenticated staff layout
├─ PortalLayout.tsx  customer portal layout
└─ AuthLayout.tsx    login/register layout
pages/           routes
├─ auth/         Login, Register, Forgot, Reset
├─ dashboard/    Executive dashboard
├─ crm/          Customers, Leads, Opportunities
├─ orders/       List, Detail, New
├─ quotations/   List, Detail, New
├─ invoices/     List, Detail
├─ inventory/    Materials, Movements
├─ tickets/      List, Detail
├─ audit/        AuditLog
├─ portal/       Customer-facing pages
└─ settings/     Users, Roles, Profile
hooks/           useAuth, useTheme, useNotifications
store/           zustand stores (auth, theme, ui)
lib/             cn, formatters, dayjs, http
styles/          globals.css, themes
types/           DTOs shared with backend
App.tsx          Routes
main.tsx         Entry
```
