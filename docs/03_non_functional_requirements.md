# 03 — Non-Functional Requirements

| ID       | Requirement                                                          |
| -------- | -------------------------------------------------------------------- |
| NFR-PERF-1 | P95 API latency < 300 ms for CRUD endpoints on SQLite WAL.        |
| NFR-PERF-2 | List endpoints paginated (default 25, max 200).                   |
| NFR-PERF-3 | N+1 queries avoided via SQLAlchemy `selectinload` / `joinedload`. |
| NFR-SEC-1  | OWASP Top-10 mitigations: parameterized queries, output escaping, CSRF-safe (token-bound), JWT with rotation. |
| NFR-SEC-2  | Passwords hashed with bcrypt cost 12+.                            |
| NFR-SEC-3  | Rate-limit auth endpoints (10 / minute per IP).                   |
| NFR-SEC-4  | All file uploads validated by extension AND mime sniff.           |
| NFR-SEC-5  | RBAC enforced server-side; UI hiding is convenience only.         |
| NFR-AVAIL-1| Graceful shutdown; healthcheck endpoint `/api/v1/health`.         |
| NFR-OBS-1  | Structured JSON logs with request id correlation.                 |
| NFR-OBS-2  | Audit log immutable (append-only).                                |
| NFR-UX-1   | Mobile-first responsive layout from 360 px up.                    |
| NFR-UX-2   | Light + dark theme with persisted preference.                     |
| NFR-UX-3   | All async actions show skeleton or spinner < 100 ms.              |
| NFR-UX-4   | Empty + error states designed for every list view.                |
| NFR-A11Y-1 | WCAG 2.1 AA color contrast on both themes.                        |
| NFR-A11Y-2 | All interactive elements keyboard-navigable.                      |
| NFR-DEV-1  | Type-safe end-to-end (Pydantic ↔ TS interfaces).                  |
| NFR-DEV-2  | Linting + format on both stacks (ruff, eslint, prettier).         |
| NFR-DEPLOY-1 | Single `docker-compose up` brings the entire stack online.      |
