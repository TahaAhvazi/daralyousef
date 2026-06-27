# 02 — Functional Requirements

Each requirement has an ID `FR-<module>-<n>`.

## FR-AUTH — Authentication

- FR-AUTH-1: Email + password login returning JWT access + refresh token.
- FR-AUTH-2: Refresh-token rotation endpoint.
- FR-AUTH-3: Logout invalidates the refresh token (server-side blacklist).
- FR-AUTH-4: Public registration creates **Customer** users only.
- FR-AUTH-5: Forgot-password generates a one-time reset token (email-mock).
- FR-AUTH-6: Reset-password endpoint consumes the token.
- FR-AUTH-7: All passwords hashed with bcrypt (cost ≥ 12).

## FR-RBAC — Roles & Permissions

- FR-RBAC-1: 11 system roles (CEO, GM, Dept Manager, Designer, Print Operator,
  Accountant, Marketing, Warehouse, Sales, Support, Customer).
- FR-RBAC-2: Permissions are strings `module:action` (e.g. `orders:create`).
- FR-RBAC-3: Role → Permission many-to-many.
- FR-RBAC-4: User → Role many-to-many (one primary, others optional).
- FR-RBAC-5: Per-user permission overrides (grant/deny).
- FR-RBAC-6: API endpoints declare required permissions via dependency.

## FR-CUST — Customers & Companies

- FR-CUST-1: CRUD for individuals & companies.
- FR-CUST-2: Link individuals to companies (employees of a company).
- FR-CUST-3: Customer documents, notes, communication history.
- FR-CUST-4: Soft-delete only.

## FR-LEAD — Leads / Opportunities (CRM)

- FR-LEAD-1: Lead pipeline (New → Contacted → Qualified → Proposal → Won/Lost).
- FR-LEAD-2: Convert lead → customer + opportunity.
- FR-LEAD-3: Opportunity has expected revenue, probability, close date.
- FR-LEAD-4: Follow-up tasks with reminders.

## FR-ORD — Orders

- FR-ORD-1: Orders can be created by staff or by customers via portal.
- FR-ORD-2: Each order has multiple line items (product/service + spec).
- FR-ORD-3: Order workflow: Draft → Confirmed → In Production → QA →
  Ready → Delivered → Closed.
- FR-ORD-4: Assignable to department & employees.
- FR-ORD-5: File attachments per line item (design references, source files).
- FR-ORD-6: Status changes are audited with timestamp & user.

## FR-PROD — Production

- FR-PROD-1: Print job queue with priority & due-date.
- FR-PROD-2: Material consumption record per job.
- FR-PROD-3: Operator start/stop/complete timestamps.
- FR-PROD-4: Delays captured with reason code.

## FR-QUOT — Quotations

- FR-QUOT-1: Generate quotation from cart / order / opportunity.
- FR-QUOT-2: Instant price calculator: service × material × size × quantity
  × complexity × extras.
- FR-QUOT-3: Quote PDF export.
- FR-QUOT-4: Customer can accept / reject / request revision via portal.

## FR-INV — Invoices & Payments

- FR-INV-1: Invoice generated from accepted quotation or completed order.
- FR-INV-2: Multi-line invoices with tax & discount.
- FR-INV-3: Payment records (cash, transfer, card, online).
- FR-INV-4: Customer balance auto-recomputed.
- FR-INV-5: Payment status: Unpaid, Partial, Paid, Overdue, Refunded.

## FR-PROD-CAT — Products & Services Catalog

- FR-PROD-CAT-1: Industry-specific catalog (printing, branding, embroidery,
  outdoor, educational, gifts, marketing).
- FR-PROD-CAT-2: Pricing rules per attribute (size, material, complexity).
- FR-PROD-CAT-3: Active / inactive flags, images, SEO slug.

## FR-INVT — Inventory & Materials

- FR-INVT-1: Items with SKU, unit, on-hand quantity per warehouse.
- FR-INVT-2: Stock movements: IN, OUT, TRANSFER, DAMAGED, ADJUSTMENT.
- FR-INVT-3: Reorder-level alerts.
- FR-INVT-4: Inventory snapshot reports.

## FR-TKT — Tickets

- FR-TKT-1: Customer + internal tickets with statuses Open, In Progress,
  Waiting Customer, Resolved, Closed.
- FR-TKT-2: Threaded replies with attachments.
- FR-TKT-3: Assignable to staff; SLA target visible.

## FR-FILE — File Management

- FR-FILE-1: Upload PDF, PSD, AI, SVG, PNG, JPG, ZIP, DOCX (≤ 50 MB).
- FR-FILE-2: Files stored on disk under `/uploads/<yyyy>/<mm>/<uuid>.<ext>`.
- FR-FILE-3: Logical association with any entity via polymorphic `attachments`.
- FR-FILE-4: Preview API returns inline content-disposition for safe types.

## FR-APPR — Design Approvals & Signatures

- FR-APPR-1: A design revision can be sent to customer for approval.
- FR-APPR-2: Customer Approves / Rejects / Requests-revision with comments.
- FR-APPR-3: Approval captures user, timestamp, IP, user-agent.
- FR-APPR-4: Optional digital signature (canvas SVG + hash).

## FR-NOT — Notifications

- FR-NOT-1: In-app notifications with type, payload, read flag.
- FR-NOT-2: SSE stream `/api/v1/notifications/stream` for live updates.
- FR-NOT-3: Email mock writes to `outbox/`.

## FR-AUDIT — Audit Log

- FR-AUDIT-1: Every C/U/D/Approve/Reject/Login records an audit row.
- FR-AUDIT-2: Stored values are JSON snapshots (old / new).
- FR-AUDIT-3: Searchable by user, module, entity, date range, action.

## FR-PORTAL — Customer Portal

- FR-PORTAL-1: Customer can only see their own data.
- FR-PORTAL-2: Place orders, upload files, see quotes/invoices/tickets.
- FR-PORTAL-3: Approve designs, sign quotes.

## FR-EXEC — Executive Command Center

- FR-EXEC-1: Live employee online list.
- FR-EXEC-2: Today / this-month revenue, active orders, delayed orders.
- FR-EXEC-3: Pending approvals, production status, inventory status.
- FR-EXEC-4: Recent audit log + security alerts.
