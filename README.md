# Atelier ERP — Enterprise Platform for Printing, Advertising & Branding

> A premium SaaS-grade ERP + CRM + Order Management + Production + Accounting +
> Inventory + Customer Portal + Executive Monitoring platform designed for
> printing, publishing, branding, marketing, outdoor advertising, educational
> printing and embroidery businesses.

Inspired by Odoo Enterprise, NetSuite, Dynamics 365, HubSpot, Monday.com,
ClickUp, and Zoho One — but tailored to the printing & advertising industry.

---

## Tech Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite + TailwindCSS            |
| State        | TanStack Query (server) + Zustand (client)            |
| UI Design    | Custom design system, Glassmorphism, Framer Motion    |
| Charts       | Recharts                                              |
| Forms        | React Hook Form + Zod                                 |
| Backend      | FastAPI (Python 3.11+)                                |
| ORM          | SQLAlchemy 2.0 (async) + Alembic                      |
| Database     | SQLite (production-ready via WAL; swappable to PG)    |
| Auth         | JWT (access + refresh), Argon2/Bcrypt                 |
| Architecture | Clean / Hexagonal / Modular Monolith + RBAC + ABAC    |
| Deployment   | Docker + docker-compose, Nginx reverse proxy          |

---

## Repository Layout

```
marketingAgencyAutomation/
├─ docs/                       # Phase 1: business analysis, ERD, design system
│  ├─ 01_business_analysis.md
│  ├─ 02_functional_requirements.md
│  ├─ 03_non_functional_requirements.md
│  ├─ 04_user_stories.md
│  ├─ 05_erd.md
│  ├─ 06_folder_structure.md
│  └─ 07_design_system.md
├─ backend/                    # FastAPI service
│  ├─ app/
│  │  ├─ core/                 # config, security, logging, exceptions
│  │  ├─ db/                   # session, base, init, seed
│  │  ├─ models/               # SQLAlchemy ORM models (per domain)
│  │  ├─ schemas/              # Pydantic schemas (per domain)
│  │  ├─ repositories/         # data-access layer
│  │  ├─ services/             # business logic / use-cases
│  │  ├─ api/v1/endpoints/     # HTTP routers per module
│  │  ├─ utils/                # helpers (slug, ids, files…)
│  │  └─ main.py               # FastAPI entrypoint
│  ├─ tests/                   # pytest
│  ├─ alembic/                 # migrations (auto-generated)
│  ├─ uploads/                 # file storage (gitignored)
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/                   # React + TS + Vite
│  ├─ src/
│  │  ├─ api/                  # typed axios clients
│  │  ├─ components/           # design-system + feature components
│  │  ├─ layouts/              # AppShell, AuthLayout, PortalLayout
│  │  ├─ pages/                # route-level pages per module
│  │  ├─ hooks/                # custom hooks
│  │  ├─ lib/                  # utils, cn, formatters
│  │  ├─ store/                # zustand stores
│  │  ├─ styles/               # globals, themes
│  │  ├─ types/                # shared TS types
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ index.html
│  ├─ tailwind.config.ts
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  ├─ package.json
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

---

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m app.db.init_db    # creates tables + seeds demo data
uvicorn app.main:app --reload --port 8000
```

API: <http://localhost:8000>  ·  Swagger: <http://localhost:8000/docs>

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: <http://localhost:5173>

### Demo Credentials

| Role             | Email                       | Password   |
| ---------------- | --------------------------- | ---------- |
| CEO              | ceo@atelier.app             | Demo@1234  |
| General Manager  | gm@atelier.app              | Demo@1234  |
| Designer         | designer@atelier.app        | Demo@1234  |
| Accountant       | accountant@atelier.app      | Demo@1234  |
| Customer         | customer@atelier.app        | Demo@1234  |

---

## Documentation Index

- [01 — Business Analysis](docs/01_business_analysis.md)
- [02 — Functional Requirements](docs/02_functional_requirements.md)
- [03 — Non-Functional Requirements](docs/03_non_functional_requirements.md)
- [04 — User Stories](docs/04_user_stories.md)
- [05 — Entity Relationship Diagram](docs/05_erd.md)
- [06 — Folder Structure](docs/06_folder_structure.md)
- [07 — Design System](docs/07_design_system.md)

---

## Modules Status

| Module                          | Backend | Frontend | Notes                       |
| ------------------------------- | ------- | -------- | --------------------------- |
| Authentication & JWT            | DONE    | DONE     | Access + refresh tokens     |
| Users, Roles, Permissions (RBAC)| DONE    | DONE     | 11 built-in roles           |
| CRM (Customers, Companies, Leads, Opportunities) | DONE | DONE | Full CRUD + pipeline |
| Orders & Production             | DONE    | DONE     | Workflow + status tracking  |
| Quotations & Pricing            | DONE    | DONE     | Instant calculator          |
| Invoices & Payments             | DONE    | DONE     | Multi-currency ready        |
| Products / Services Catalog     | DONE    | DONE     | Industry-specific           |
| Inventory & Materials           | DONE    | DONE     | Stock in/out, transfers     |
| Tickets / Support               | DONE    | DONE     | 5 statuses, attachments     |
| File Management                 | DONE    | DONE     | PDF/PSD/AI/SVG/ZIP/DOCX     |
| Notifications                   | DONE    | DONE     | Real-time via SSE           |
| Audit Log                       | DONE    | DONE     | Complete change tracking    |
| Customer Portal                 | DONE    | DONE     | Self-service               |
| Executive Dashboard (CEO)       | DONE    | DONE     | Live metrics                |
| Design Approval + Signature     | SCAFFOLD| SCAFFOLD | Tables + endpoints ready    |
| Marketing / Campaigns           | SCAFFOLD| SCAFFOLD | Tables + endpoints ready    |
| Outdoor Advertising             | SCAFFOLD| SCAFFOLD | Tables + endpoints ready    |
| Embroidery                      | SCAFFOLD| SCAFFOLD | Tables + endpoints ready    |
| Educational Printing            | SCAFFOLD| SCAFFOLD | Tables + endpoints ready    |

`SCAFFOLD` = models + base CRUD endpoints exist, follow the established pattern
to extend with domain-specific business logic.

---

## License

Proprietary — © 2026 Atelier ERP.
