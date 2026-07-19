"""Production workflow constants and transition rules."""
from __future__ import annotations

from typing import Dict, FrozenSet, Iterable, Optional, Set, Tuple

# Item-level workflow stages (department pipeline)
ITEM_WORKFLOW_STATUSES: Tuple[str, ...] = (
    "pending",
    "design",
    "printing",
    "production",
    "finishing",
    "delivery",
    "completed",
    "on_hold",
    "cancelled",
)

# Map workflow stage → primary department slug (used for kanban filtering)
WORKFLOW_DEPARTMENT_SLUG: Dict[str, str] = {
    "pending": "sales",
    "design": "design",
    "printing": "printing",
    "production": "cnc",
    "finishing": "flex_uv",
    "delivery": "delivery",
    "completed": "delivery",
    "on_hold": "sales",
    "cancelled": "sales",
}

# Allowed transitions: from_status → set of to_status
ITEM_WORKFLOW_TRANSITIONS: Dict[str, FrozenSet[str]] = {
    "pending": frozenset({"design", "on_hold", "cancelled"}),
    "design": frozenset({"printing", "on_hold", "cancelled"}),
    "printing": frozenset({"production", "finishing", "on_hold", "cancelled"}),
    "production": frozenset({"finishing", "on_hold", "cancelled"}),
    "finishing": frozenset({"delivery", "on_hold", "cancelled"}),
    "delivery": frozenset({"completed", "on_hold", "cancelled"}),
    "on_hold": frozenset({"pending", "design", "printing", "production", "finishing", "delivery", "cancelled"}),
    "completed": frozenset(),
    "cancelled": frozenset(),
}

PRICING_MODELS: Tuple[str, ...] = ("fixed", "variable", "custom_quote")

# Main production pipeline (sequential — design before print, etc.)
PIPELINE_STATUSES: Tuple[str, ...] = (
    "pending",
    "design",
    "printing",
    "production",
    "finishing",
    "delivery",
    "completed",
)

# Stages that require a named assignee before release / advancement by department staff.
ASSIGNMENT_STAGES: Tuple[str, ...] = (
    "design",
    "printing",
    "production",
    "finishing",
    "delivery",
)

_PIPELINE_INDEX = {s: i for i, s in enumerate(PIPELINE_STATUSES)}

# Product department slug → assignable workflow stage
DEPARTMENT_SLUG_TO_WORKFLOW_STAGE: Dict[str, str] = {
    "design": "design",
    "printing": "printing",
    "cnc": "production",
    "flex_uv": "finishing",
    "delivery": "delivery",
}


def workflow_stages_from_department_slugs(slugs: Iterable[str]) -> FrozenSet[str]:
    """Derive which pipeline stages apply from product department slugs."""
    mapped = {
        DEPARTMENT_SLUG_TO_WORKFLOW_STAGE[s]
        for s in slugs
        if s in DEPARTMENT_SLUG_TO_WORKFLOW_STAGE
    }
    return frozenset(mapped) if mapped else frozenset(ASSIGNMENT_STAGES)


def _stage_rows(row: object) -> list:
    if row is None:
        return []
    if isinstance(row, list):
        return row
    return [row]


def _row_is_skipped(row: object) -> bool:
    if isinstance(row, dict):
        return bool(row.get("is_skipped", False))
    return bool(getattr(row, "is_skipped", False))


def resolve_enabled_stages(
    assignments_by_stage: Dict[str, object],
) -> FrozenSet[str]:
    """Active stages for an order. Empty config → all stages (legacy orders)."""
    if not assignments_by_stage:
        return frozenset(ASSIGNMENT_STAGES)
    enabled: Set[str] = set()
    for stage, row in assignments_by_stage.items():
        rows = _stage_rows(row)
        if not rows:
            continue
        if any(not _row_is_skipped(r) for r in rows):
            enabled.add(stage)
    return frozenset(enabled) if enabled else frozenset(ASSIGNMENT_STAGES)


def skipped_workflow_stages(assignments_by_stage: Dict[str, object]) -> Tuple[str, ...]:
    if not assignments_by_stage:
        return ()
    out = []
    for stage in ASSIGNMENT_STAGES:
        rows = _stage_rows(assignments_by_stage.get(stage))
        if not rows:
            continue
        if all(_row_is_skipped(r) for r in rows):
            out.append(stage)
    return tuple(out)


def first_enabled_pipeline_stage(enabled: FrozenSet[str]) -> Optional[str]:
    for stage in PIPELINE_STATUSES:
        if stage in enabled:
            return stage
    return None


def next_enabled_pipeline_status(current: str, enabled: FrozenSet[str]) -> Optional[str]:
    """Next pipeline step for this order, skipping N/A stages."""
    if current in ("on_hold", "cancelled", "completed"):
        return None
    if current == "pending":
        return first_enabled_pipeline_stage(enabled)
    idx = _PIPELINE_INDEX.get(current)
    if idx is None:
        return None
    for i in range(idx + 1, len(PIPELINE_STATUSES)):
        stage = PIPELINE_STATUSES[i]
        if stage == "completed":
            return "completed"
        if stage in enabled:
            return stage
    return "completed"


def previous_enabled_pipeline_status(current: str, enabled: FrozenSet[str]) -> Optional[str]:
    """Previous pipeline step for this order, skipping N/A stages."""
    if current in ("on_hold", "cancelled", "completed", "pending"):
        return None
    idx = _PIPELINE_INDEX.get(current)
    if idx is None:
        return None
    for i in range(idx - 1, -1, -1):
        stage = PIPELINE_STATUSES[i]
        if stage == "pending":
            return "pending"
        if stage in enabled:
            return stage
    return "pending"


def previous_board_column(column: str) -> Optional[str]:
    if column in ("cancelled", "intake"):
        return None
    idx = _BOARD_COLUMN_INDEX.get(column)
    if idx is None or idx <= 0:
        return None
    return ORDER_BOARD_COLUMNS[idx - 1]


def is_backward_board_move(from_column: str, to_column: str) -> bool:
    a = _BOARD_COLUMN_INDEX.get(from_column)
    b = _BOARD_COLUMN_INDEX.get(to_column)
    if a is None or b is None:
        return False
    return b < a


def is_backward_workflow_move(from_status: str, to_status: str) -> bool:
    a = _PIPELINE_INDEX.get(from_status)
    b = _PIPELINE_INDEX.get(to_status)
    if a is None or b is None:
        return False
    return b < a


def allowed_order_transitions(current: str, enabled: FrozenSet[str]) -> FrozenSet[str]:
    """Valid forward transitions respecting per-order skipped stages."""
    opts: Set[str] = set()
    nxt = next_enabled_pipeline_status(current, enabled)
    if nxt and nxt != current:
        opts.add(nxt)
    base = ITEM_WORKFLOW_TRANSITIONS.get(current, frozenset())
    opts |= {"on_hold", "cancelled"} & base
    if current == "on_hold":
        opts |= set(enabled) & set(PIPELINE_STATUSES)
        opts.add("pending")
    return frozenset(opts)


def next_pipeline_status(current: str) -> Optional[str]:
    """Next stage in the main pipeline, or None if terminal / non-linear."""
    if current in ("on_hold", "cancelled", "completed"):
        return None
    idx = _PIPELINE_INDEX.get(current)
    if idx is None or idx + 1 >= len(PIPELINE_STATUSES):
        return None
    return PIPELINE_STATUSES[idx + 1]


def derive_order_pipeline_stage(statuses: set[str]) -> str:
    """Single board column for an order — bottleneck (earliest active pipeline stage)."""
    if not statuses:
        return "pending"
    if statuses <= {"cancelled"}:
        return "cancelled"
    if "on_hold" in statuses:
        return "on_hold"
    if statuses <= {"completed"}:
        return "completed"

    active = {s for s in statuses if s not in ("completed", "cancelled", "on_hold")}
    if not active:
        return "pending"

    pipeline = [s for s in active if s in _PIPELINE_INDEX]
    if pipeline:
        return min(pipeline, key=lambda s: _PIPELINE_INDEX[s])
    return sorted(active)[0]


# Full order lifecycle board (intake → delivery → completed / cancelled)
ORDER_BOARD_COLUMNS: Tuple[str, ...] = (
    "intake",
    "approval",
    "confirmed",
    "paid",
    "warehouse",
    "design",
    "printing",
    "production",
    "finishing",
    "delivery",
    "completed",
    "cancelled",
)

WORKFLOW_BOARD_STAGES: FrozenSet[str] = frozenset({
    "design", "printing", "production", "finishing", "delivery",
})

_BOARD_COLUMN_INDEX = {c: i for i, c in enumerate(ORDER_BOARD_COLUMNS)}


def derive_order_board_column(
    order_status: str,
    item_statuses: Iterable[str],
    *,
    stock_check_status: Optional[str] = None,
) -> str:
    """Map order + line items to a lifecycle kanban column."""
    if order_status == "cancelled":
        return "cancelled"
    if order_status in ("delivered", "closed"):
        return "completed"

    active = {s for s in item_statuses if s not in ("completed", "cancelled")}
    if not active and item_statuses and all(s == "completed" for s in item_statuses):
        return "completed"

    if order_status in ("draft", "pending_review"):
        return "intake"
    if order_status in ("awaiting_customer", "customer_approved"):
        return "approval"

    if order_status == "paid":
        # After payment → warehouse queue until stock is approved
        if stock_check_status == "approved":
            return "paid"  # stock OK — ready to enter production stages
        return "warehouse"

    if order_status in ("confirmed", "in_production"):
        if order_status == "confirmed":
            return "confirmed"
        if not active:
            return "confirmed"
        stage = derive_order_pipeline_stage(set(active))
        if stage == "on_hold":
            return "confirmed"
        if stage == "completed":
            return "completed"
        if stage in WORKFLOW_BOARD_STAGES:
            return stage
        if stage == "pending":
            return "confirmed"
        return "confirmed"

    return "intake"


def board_column_progress(column: str) -> int:
    """0–100 progress indicator for kanban cards."""
    if column == "cancelled":
        return 0
    if column == "completed":
        return 100
    idx = _BOARD_COLUMN_INDEX.get(column, 0)
    # Progress across intake → delivery (exclude completed/cancelled)
    span = max(1, len(ORDER_BOARD_COLUMNS) - 2)
    return min(100, max(0, int((idx / span) * 100)))
