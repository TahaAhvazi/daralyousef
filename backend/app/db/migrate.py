"""Runtime schema migrations — safe for live deploy (SQLite + PostgreSQL).

`create_all` creates missing tables; this module adds missing columns / indexes
on existing production databases without Alembic or downtime scripts.
"""
from __future__ import annotations

import logging
from typing import Iterable, Sequence, Set, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.core.config import settings

logger = logging.getLogger(__name__)

# (table, [(column, SQL type with optional DEFAULT), ...])
ColumnSpec = Tuple[str, str]
TableMigrations = Sequence[Tuple[str, Sequence[ColumnSpec]]]

# Unique indexes for Daftra linkage (idempotent CREATE IF NOT EXISTS).
DAFTRA_UNIQUE_INDEXES: Sequence[Tuple[str, str, str]] = (
    # index_name, table, column
    ("uq_users_daftra_id", "users", "daftra_id"),
    ("uq_customers_daftra_id", "customers", "daftra_id"),
    ("uq_products_daftra_id", "products", "daftra_id"),
    ("uq_invoices_daftra_id", "invoices", "daftra_id"),
    ("uq_payments_daftra_id", "payments", "daftra_id"),
    ("uq_expenses_daftra_id", "expenses", "daftra_id"),
    ("uq_orders_daftra_id", "orders", "daftra_id"),
    ("uq_credit_notes_daftra_id", "credit_notes", "daftra_id"),
    ("uq_recurring_invoices_daftra_id", "recurring_invoices", "daftra_id"),
    ("uq_departments_daftra_id", "departments", "daftra_id"),
    ("uq_designations_daftra_id", "designations", "daftra_id"),
    ("uq_staff_profiles_daftra_id", "staff_profiles", "daftra_id"),
    ("uq_payslips_daftra_id", "payslips", "daftra_id"),
)


def _is_sqlite() -> bool:
    return settings.DATABASE_URL.startswith("sqlite")


def _is_postgres() -> bool:
    url = settings.DATABASE_URL.lower()
    return url.startswith("postgresql") or url.startswith("postgres")


async def _table_exists(conn: AsyncConnection, table: str) -> bool:
    if _is_sqlite():
        res = await conn.execute(
            text("SELECT 1 FROM sqlite_master WHERE type='table' AND name=:t LIMIT 1"),
            {"t": table},
        )
        return res.first() is not None
    if _is_postgres():
        res = await conn.execute(
            text(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = :t LIMIT 1"
            ),
            {"t": table},
        )
        return res.first() is not None
    # Fallback: try selecting zero rows
    try:
        await conn.execute(text(f"SELECT 1 FROM {table} WHERE 0=1"))
        return True
    except Exception:
        return False


async def _existing_columns(conn: AsyncConnection, table: str) -> Set[str]:
    if not await _table_exists(conn, table):
        return set()
    if _is_sqlite():
        res = await conn.execute(text(f"PRAGMA table_info({table})"))
        return {row[1] for row in res.fetchall()}
    if _is_postgres():
        res = await conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = :t"
            ),
            {"t": table},
        )
        return {row[0] for row in res.fetchall()}
    return set()


def _pg_typedef(typedef: str) -> str:
    """Map SQLite-ish typedefs to PostgreSQL-friendly ones where needed."""
    t = typedef.strip()
    upper = t.upper()
    # BOOLEAN stored as INTEGER on SQLite; keep INTEGER portable
    if upper.startswith("DATETIME"):
        return t.replace("DATETIME", "TIMESTAMP WITH TIME ZONE", 1) if "TIME ZONE" not in upper else t
    return t


async def ensure_columns(conn: AsyncConnection, migrations: TableMigrations) -> list[str]:
    """Add missing columns. Returns human-readable change log lines."""
    changes: list[str] = []
    for table, cols in migrations:
        try:
            if not await _table_exists(conn, table):
                # create_all will add the full table on next boot / same boot before this.
                continue
            existing = await _existing_columns(conn, table)
            for col, typedef in cols:
                if col in existing:
                    continue
                ddl_type = _pg_typedef(typedef) if _is_postgres() else typedef
                await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl_type}"))
                msg = f"+ {table}.{col}"
                changes.append(msg)
                logger.info("Schema migrate %s", msg)
        except Exception:
            logger.exception("Failed migrating columns on table %s", table)
    return changes


async def ensure_unique_indexes(conn: AsyncConnection, indexes: Iterable[Tuple[str, str, str]]) -> list[str]:
    """Create unique indexes for daftra_id (and similar) if missing."""
    changes: list[str] = []
    for index_name, table, column in indexes:
        try:
            if not await _table_exists(conn, table):
                continue
            cols = await _existing_columns(conn, table)
            if column not in cols:
                continue
            if _is_sqlite() or _is_postgres():
                await conn.execute(
                    text(
                        f"CREATE UNIQUE INDEX IF NOT EXISTS {index_name} "
                        f"ON {table} ({column})"
                    )
                )
                changes.append(f"index {index_name}")
        except Exception:
            # Duplicate data can block unique index — log and continue so app still boots.
            logger.warning(
                "Could not ensure unique index %s on %s.%s (non-fatal)",
                index_name, table, column,
                exc_info=True,
            )
    return changes


async def migrate_workflow_assignments_multi_assignee(conn: AsyncConnection) -> None:
    """SQLite-only table rebuild for multi-assignee unique constraint."""
    if not _is_sqlite():
        return
    if not await _table_exists(conn, "order_workflow_assignments"):
        return
    try:
        res = await conn.execute(text(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='order_workflow_assignments'"
        ))
        ddl = res.scalar()
        if not ddl or "uq_order_workflow_stage_assignee" in ddl:
            return
        if "uq_order_workflow_assignee" not in ddl:
            return

        await conn.execute(text("""
            CREATE TABLE order_workflow_assignments_new (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME NOT NULL DEFAULT (datetime('now')),
                updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                order_id INTEGER NOT NULL,
                workflow_status VARCHAR(40) NOT NULL,
                assignee_id INTEGER NOT NULL,
                is_skipped INTEGER NOT NULL DEFAULT 0,
                assigned_by_id INTEGER,
                FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE,
                FOREIGN KEY(assignee_id) REFERENCES users (id) ON DELETE RESTRICT,
                FOREIGN KEY(assigned_by_id) REFERENCES users (id) ON DELETE SET NULL,
                CONSTRAINT uq_order_workflow_stage_assignee UNIQUE (order_id, workflow_status, assignee_id)
            )
        """))
        await conn.execute(text("""
            INSERT INTO order_workflow_assignments_new
                (id, created_at, updated_at, order_id, workflow_status, assignee_id, is_skipped, assigned_by_id)
            SELECT id, created_at, updated_at, order_id, workflow_status, assignee_id, is_skipped, assigned_by_id
            FROM order_workflow_assignments
        """))
        await conn.execute(text("DROP TABLE order_workflow_assignments"))
        await conn.execute(text(
            "ALTER TABLE order_workflow_assignments_new RENAME TO order_workflow_assignments"
        ))
        logger.info("Rebuilt order_workflow_assignments for multi-assignee support")
    except Exception:
        logger.exception("Workflow assignment migration skipped (non-fatal)")


def column_migrations(legacy_brand_light: str, legacy_brand_dark: str,
                      legacy_accent_light: str, legacy_accent_dark: str) -> TableMigrations:
    return (
        ("brand_settings", [
            ("brand_color", f"VARCHAR(7) NOT NULL DEFAULT '{legacy_brand_light}'"),
            ("brand_color_dark", f"VARCHAR(7) NOT NULL DEFAULT '{legacy_brand_dark}'"),
            ("accent_color", f"VARCHAR(7) NOT NULL DEFAULT '{legacy_accent_light}'"),
            ("accent_color_dark", f"VARCHAR(7) NOT NULL DEFAULT '{legacy_accent_dark}'"),
        ]),
        ("users", [
            ("department_id", "INTEGER"),
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("products", [
            ("pricing_model", "VARCHAR(20) NOT NULL DEFAULT 'variable'"),
            ("name_ar", "VARCHAR(255)"),
            ("description_ar", "TEXT"),
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("product_categories", [
            ("name_ar", "VARCHAR(120)"),
        ]),
        ("orders", [
            ("daftra_id", "VARCHAR(40)"),
            ("daftra_number", "VARCHAR(40)"),
            ("daftra_workflow_type_id", "VARCHAR(40)"),
            ("stock_check_status", "VARCHAR(20)"),
            ("stock_checked_at", "DATETIME"),
            ("stock_checked_by_id", "INTEGER"),
            ("stock_check_notes", "TEXT"),
            ("materials_deducted", "INTEGER NOT NULL DEFAULT 0"),
        ]),
        ("order_items", [
            ("workflow_status", "VARCHAR(40) NOT NULL DEFAULT 'pending'"),
            ("current_department_id", "INTEGER"),
        ]),
        ("order_workflow_assignments", [
            ("is_skipped", "INTEGER NOT NULL DEFAULT 0"),
        ]),
        ("invoices", [
            ("portal_visible", "INTEGER NOT NULL DEFAULT 0"),
            ("pdf_lang", "VARCHAR(4)"),
            ("issued_at", "DATETIME"),
            ("daftra_id", "VARCHAR(40)"),
            ("created_by_id", "INTEGER"),
            ("salesperson_id", "INTEGER"),
        ]),
        ("customers", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("payments", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("expenses", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("recurring_invoices", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("credit_notes", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("credit_note_items", [
            ("description", "TEXT"),
        ]),
        ("departments", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("designations", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("staff_profiles", [
            ("daftra_id", "VARCHAR(40)"),
        ]),
        ("employee_contracts", [
            ("job_title", "VARCHAR(120)"),
            ("job_level", "VARCHAR(80)"),
            ("description", "TEXT"),
            ("join_date", "DATE"),
            ("signed_at", "DATE"),
            ("probation_end", "DATE"),
            ("salary_template", "VARCHAR(40)"),
            ("is_primary", "INTEGER NOT NULL DEFAULT 1"),
        ]),
        ("payslips", [
            ("daftra_id", "VARCHAR(40)"),
            ("base_salary", "FLOAT NOT NULL DEFAULT 0"),
            ("overtime", "FLOAT NOT NULL DEFAULT 0"),
            ("absence", "FLOAT NOT NULL DEFAULT 0"),
            ("bonus", "FLOAT NOT NULL DEFAULT 0"),
            ("status", "VARCHAR(20) NOT NULL DEFAULT 'paid'"),
            ("source", "VARCHAR(20) NOT NULL DEFAULT 'local'"),
        ]),
        ("attendance_records", [
            ("deduction_amount", "FLOAT"),
            ("marked_by_id", "INTEGER"),
        ]),
    )


async def run_schema_migrations(
    conn: AsyncConnection,
    *,
    legacy_brand_light: str,
    legacy_brand_dark: str,
    legacy_accent_light: str,
    legacy_accent_dark: str,
) -> dict:
    """Run all additive migrations. Never raises for non-fatal column/index issues."""
    await migrate_workflow_assignments_multi_assignee(conn)
    cols = await ensure_columns(
        conn,
        column_migrations(
            legacy_brand_light, legacy_brand_dark, legacy_accent_light, legacy_accent_dark,
        ),
    )
    indexes = await ensure_unique_indexes(conn, DAFTRA_UNIQUE_INDEXES)

    # Data backfills (best-effort)
    try:
        await conn.execute(text(
            "UPDATE employee_contracts SET job_title = COALESCE(job_title, title), "
            "job_level = COALESCE(job_level, title), "
            "salary_template = COALESCE(salary_template, 'monthly'), "
            "is_primary = COALESCE(is_primary, 1) "
            "WHERE job_title IS NULL OR salary_template IS NULL"
        ))
    except Exception:
        pass

    try:
        await conn.execute(text(
            "UPDATE payslips SET source = 'daftra' WHERE daftra_id IS NOT NULL "
            "AND (source IS NULL OR source = '' OR source = 'local')"
        ))
    except Exception:
        pass

    try:
        await conn.execute(text(
            "UPDATE orders SET status = 'in_production' WHERE status IN ('qa', 'ready')"
        ))
    except Exception:
        pass

    return {
        "dialect": "sqlite" if _is_sqlite() else ("postgresql" if _is_postgres() else "other"),
        "columns_added": cols,
        "indexes_ensured": indexes,
    }
