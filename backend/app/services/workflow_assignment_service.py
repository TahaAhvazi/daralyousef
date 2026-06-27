"""Per-order workflow stage assignees — who may advance each pipeline step."""
from __future__ import annotations

from typing import Dict, List, Optional, Sequence

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, ValidationError
from app.core.workflow import (
    ASSIGNMENT_STAGES,
    WORKFLOW_BOARD_STAGES,
    WORKFLOW_DEPARTMENT_SLUG,
    resolve_enabled_stages,
    skipped_workflow_stages,
)
from app.models.department import Department
from app.models.order import Order, OrderWorkflowAssignment
from app.models.user import User

EXEC_WORKFLOW_OVERRIDE_ROLE_SLUGS = frozenset({"ceo", "cto", "general_manager"})
LIFECYCLE_PRE_PRODUCTION_COLUMNS = frozenset({"intake", "approval", "confirmed"})


async def _user_role_slugs(db: AsyncSession, user: User) -> set[str]:
    from app.models.rbac import Role, UserRole

    role_ids = [ur.role_id for ur in user.roles]
    if role_ids:
        res = await db.execute(select(Role.slug).where(Role.id.in_(role_ids)))
        return set(res.scalars().all())

    res = await db.execute(
        select(Role.slug)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    return set(res.scalars().all())


async def user_can_override_assignments(db: AsyncSession, user: User) -> bool:
    """Executives may advance any order stage regardless of assignee."""
    if user.is_superuser:
        return True
    from app.core.deps import _user_permissions
    perms = await _user_permissions(user, db)
    if "*" in perms or "orders:admin" in perms:
        return True
    slugs = await _user_role_slugs(db, user)
    return bool(slugs & EXEC_WORKFLOW_OVERRIDE_ROLE_SLUGS)


def _assignment_field(entry, field: str):
    if isinstance(entry, dict):
        return entry.get(field)
    return getattr(entry, field, None)


def _resolved_assignee_ids_from_entry(entry) -> List[int]:
    if hasattr(entry, "resolved_assignee_ids"):
        return entry.resolved_assignee_ids()
    ids = _assignment_field(entry, "assignee_ids") or []
    if ids:
        return list(dict.fromkeys(ids))
    aid = _assignment_field(entry, "assignee_id")
    return [aid] if aid else []


def _group_by_stage(rows: Sequence[OrderWorkflowAssignment]) -> Dict[str, List[OrderWorkflowAssignment]]:
    out: Dict[str, List[OrderWorkflowAssignment]] = {}
    for row in rows:
        out.setdefault(row.workflow_status, []).append(row)
    return out


def assignments_ready_for_production(by_stage: Dict[str, List[OrderWorkflowAssignment]]) -> bool:
    """Every production stage is configured (skipped or has at least one assignee)."""
    if not by_stage:
        return False
    for stage in ASSIGNMENT_STAGES:
        rows = by_stage.get(stage, [])
        if not rows:
            return False
        if all(r.is_skipped for r in rows):
            continue
        active = [r for r in rows if not r.is_skipped]
        if not active:
            return False
    return True


def stage_has_assignees(by_stage: Dict[str, List[OrderWorkflowAssignment]], stage: str) -> bool:
    rows = by_stage.get(stage, [])
    active = [r for r in rows if not r.is_skipped]
    return bool(active)


def stage_is_skipped(by_stage: Dict[str, List[OrderWorkflowAssignment]], stage: str) -> bool:
    rows = by_stage.get(stage, [])
    return bool(rows) and all(r.is_skipped for r in rows)


def stages_with_assignees(by_stage: Dict[str, List[OrderWorkflowAssignment]]) -> List[str]:
    return [s for s in ASSIGNMENT_STAGES if stage_has_assignees(by_stage, s)]


def assert_board_move_to_production_allowed(
    order: Order,
    current_column: str,
    to_column: str,
    by_stage: Dict[str, List[OrderWorkflowAssignment]],
) -> None:
    """Allow entering a production column only when that stage has staff (not N/A)."""
    if to_column not in WORKFLOW_BOARD_STAGES:
        return

    if stage_is_skipped(by_stage, to_column):
        raise ValidationError(
            f"The '{to_column.replace('_', ' ')}' stage is marked N/A for this order — "
            "no staff is assigned. Ask a manager to update the project team before moving here.",
            code="board_stage_marked_na",
            details={"stage": to_column},
        )

    if not stage_has_assignees(by_stage, to_column):
        raise ValidationError(
            f"Assign at least one staff member for '{to_column.replace('_', ' ')}' "
            "before moving the order there (open the order detail page)",
            code="board_stage_no_assignees",
            details={"stage": to_column},
        )


def _validate_assignment_stages(raw: Sequence) -> None:
    seen: set[str] = set()
    for entry in raw:
        stage = _assignment_field(entry, "workflow_status")
        if stage not in ASSIGNMENT_STAGES:
            raise ValidationError(f"Invalid workflow stage for assignment: {stage}")
        if stage in seen:
            raise ValidationError(f"Duplicate assignment for stage '{stage}'")
        seen.add(stage)


async def _validate_assignees(db: AsyncSession, raw: Sequence) -> None:
    ids: set[int] = set()
    for entry in raw:
        if _assignment_field(entry, "is_skipped"):
            continue
        ids.update(_resolved_assignee_ids_from_entry(entry))
    if not ids:
        return
    res = await db.execute(
        select(User.id).where(
            User.id.in_(ids),
            User.is_active.is_(True),
            User.is_staff.is_(True),
        )
    )
    valid = set(res.scalars().all())
    missing = ids - valid
    if missing:
        raise ValidationError("One or more assignees are invalid or not active staff")


def _validate_release_assignments(assignments: Sequence) -> None:
    """Every stage must be explicitly skipped or have at least one assignee."""
    by_stage = {_assignment_field(a, "workflow_status"): a for a in assignments}
    missing = [s for s in ASSIGNMENT_STAGES if s not in by_stage]
    if missing:
        raise ValidationError(
            f"Configure every production stage (assign staff or mark N/A): {', '.join(missing)}"
        )
    for stage in ASSIGNMENT_STAGES:
        entry = by_stage[stage]
        if _assignment_field(entry, "is_skipped"):
            continue
        if not _resolved_assignee_ids_from_entry(entry):
            raise ValidationError(f"Assign staff for '{stage}' or mark the stage as not applicable")


async def replace_order_assignments(
    db: AsyncSession,
    order: Order,
    user: User,
    assignments: Sequence,
    *,
    require_all_stages: bool = False,
) -> None:
    if not assignments and require_all_stages:
        raise ValidationError("Assign a responsible staff member for each production stage")

    if assignments:
        _validate_assignment_stages(assignments)  # type: ignore[arg-type]
        await _validate_assignees(db, assignments)
        if require_all_stages:
            _validate_release_assignments(assignments)

    existing_res = await db.execute(
        select(OrderWorkflowAssignment.id)
        .where(OrderWorkflowAssignment.order_id == order.id)
        .limit(1)
    )
    had_existing = existing_res.scalar_one_or_none() is not None

    await db.execute(delete(OrderWorkflowAssignment).where(OrderWorkflowAssignment.order_id == order.id))
    await db.flush()

    notify_assignee_ids: set[int] = set()
    notify_stages: set[str] = set()

    for entry in assignments:
        stage = _assignment_field(entry, "workflow_status")
        is_skipped = bool(_assignment_field(entry, "is_skipped"))
        if is_skipped:
            assignee_id = _assignment_field(entry, "assignee_id") or user.id
            db.add(OrderWorkflowAssignment(
                order_id=order.id,
                workflow_status=stage,
                assignee_id=assignee_id,
                is_skipped=True,
                assigned_by_id=user.id,
            ))
            continue

        assignee_ids = _resolved_assignee_ids_from_entry(entry)
        if not assignee_ids:
            raise ValidationError(f"At least one assignee required for stage '{stage}'")
        notify_stages.add(stage)
        for assignee_id in assignee_ids:
            notify_assignee_ids.add(assignee_id)
            db.add(OrderWorkflowAssignment(
                order_id=order.id,
                workflow_status=stage,
                assignee_id=assignee_id,
                is_skipped=False,
                assigned_by_id=user.id,
            ))

    if notify_assignee_ids:
        from app.services.notification_service import notify_order_assignments

        await notify_order_assignments(
            db,
            order,
            sorted(notify_assignee_ids),
            actor=user,
            stages=sorted(notify_stages),
            is_update=had_existing,
        )


async def load_assignments_map(
    db: AsyncSession,
    order_ids: Sequence[int],
) -> Dict[int, Dict[str, List[OrderWorkflowAssignment]]]:
    if not order_ids:
        return {}
    res = await db.execute(
        select(OrderWorkflowAssignment)
        .where(OrderWorkflowAssignment.order_id.in_(order_ids))
        .options(selectinload(OrderWorkflowAssignment.assignee))
    )
    out: Dict[int, Dict[str, List[OrderWorkflowAssignment]]] = {}
    for row in res.scalars().all():
        out.setdefault(row.order_id, {}).setdefault(row.workflow_status, []).append(row)
    return out


async def get_order_stage_sets(
    db: AsyncSession,
    order_id: int,
) -> tuple[frozenset[str], tuple[str, ...]]:
    res = await db.execute(
        select(OrderWorkflowAssignment).where(OrderWorkflowAssignment.order_id == order_id)
    )
    by_stage = _group_by_stage(list(res.scalars().all()))
    return resolve_enabled_stages(by_stage), skipped_workflow_stages(by_stage)


async def get_stage_assignments(
    db: AsyncSession,
    order_id: int,
    workflow_status: str,
) -> List[OrderWorkflowAssignment]:
    res = await db.execute(
        select(OrderWorkflowAssignment)
        .where(
            OrderWorkflowAssignment.order_id == order_id,
            OrderWorkflowAssignment.workflow_status == workflow_status,
        )
        .options(selectinload(OrderWorkflowAssignment.assignee))
    )
    return list(res.scalars().all())


async def assert_assignee_can_advance(
    db: AsyncSession,
    user: User,
    order_id: int,
    current_stage: str,
) -> None:
    if current_stage not in ASSIGNMENT_STAGES:
        return
    if await user_can_override_assignments(db, user):
        return

    rows = await get_stage_assignments(db, order_id, current_stage)
    active = [r for r in rows if not r.is_skipped]
    if not active:
        raise ForbiddenError(
            "This stage is not active for this order — contact your manager (CEO / admin)"
        )
    if any(r.assignee_id == user.id for r in active):
        return

    names = [
        r.assignee.full_name for r in active
        if r.assignee and r.assignee.full_name
    ]
    if names:
        label = ", ".join(names[:3])
        if len(names) > 3:
            label += f" (+{len(names) - 3} more)"
    else:
        label = "other colleagues"
    raise ForbiddenError(
        f"This project is not assigned to you — {label} "
        f"are responsible for the {current_stage.replace('_', ' ')} stage"
    )


def compute_board_access(
    user: User,
    *,
    current_stage: str,
    assignments: List[OrderWorkflowAssignment],
    can_override: bool,
    enabled_stages: frozenset[str],
) -> tuple[bool, Optional[str], List[int], List[str]]:
    """Return (can_advance, read_only_reason, assignee_ids, assignee_names)."""
    if current_stage not in ASSIGNMENT_STAGES:
        return False, None, [], []

    if current_stage not in enabled_stages:
        return False, "This stage is not used for this order", [], []

    active = [r for r in assignments if not r.is_skipped]
    if assignments and not active:
        return False, "This stage is not used for this order", [], []

    assignee_ids = [r.assignee_id for r in active]
    assignee_names = [
        r.assignee.full_name for r in active
        if r.assignee and r.assignee.full_name
    ]

    if can_override:
        return True, None, assignee_ids, assignee_names

    if not active:
        return False, "No assignee set for this stage — contact your manager", [], []

    if user.id in assignee_ids:
        return True, None, assignee_ids, assignee_names

    label = ", ".join(assignee_names[:2]) if assignee_names else "other colleagues"
    if len(assignee_names) > 2:
        label += f" (+{len(assignee_names) - 2} more)"
    return (
        False,
        f"Not assigned to you — {label} own this stage",
        assignee_ids,
        assignee_names,
    )


async def list_staff_for_stage(
    db: AsyncSession,
    workflow_status: str,
) -> List[User]:
    if workflow_status not in ASSIGNMENT_STAGES:
        raise ValidationError(f"Invalid workflow stage: {workflow_status}")

    dept_slug = WORKFLOW_DEPARTMENT_SLUG.get(workflow_status)
    stmt = select(User).where(User.is_active.is_(True), User.is_staff.is_(True))
    if dept_slug:
        res = await db.execute(select(Department.id).where(Department.slug == dept_slug))
        dept_id = res.scalar_one_or_none()
        if dept_id:
            stmt = stmt.where(User.department_id == dept_id)

    stmt = stmt.order_by(User.full_name.asc())
    return list((await db.execute(stmt)).scalars().all())


async def serialize_assignments(
    db: AsyncSession,
    order: Order,
) -> List[dict]:
    if order.workflow_assignments:
        rows = order.workflow_assignments
    else:
        res = await db.execute(
            select(OrderWorkflowAssignment)
            .where(OrderWorkflowAssignment.order_id == order.id)
            .options(selectinload(OrderWorkflowAssignment.assignee))
            .order_by(OrderWorkflowAssignment.workflow_status)
        )
        rows = list(res.scalars().all())

    grouped = _group_by_stage(rows)
    out: List[dict] = []
    for stage in ASSIGNMENT_STAGES:
        stage_rows = grouped.get(stage, [])
        if not stage_rows:
            continue
        skipped = all(r.is_skipped for r in stage_rows)
        active = [r for r in stage_rows if not r.is_skipped]
        assignees = [
            {"id": r.assignee_id, "full_name": r.assignee.full_name if r.assignee else f"#{r.assignee_id}"}
            for r in active
        ]
        out.append({
            "workflow_status": stage,
            "assignee_id": None if skipped else (active[0].assignee_id if active else None),
            "assignee_name": None if skipped else (
                active[0].assignee.full_name if active and active[0].assignee else None
            ),
            "assignee_ids": [] if skipped else [r.assignee_id for r in active],
            "assignee_names": [] if skipped else assignee_names_from_rows(active),
            "assignees": [] if skipped else assignees,
            "department_slug": WORKFLOW_DEPARTMENT_SLUG.get(stage),
            "is_skipped": skipped,
        })
    return out


def assignee_names_from_rows(rows: List[OrderWorkflowAssignment]) -> List[str]:
    return [
        r.assignee.full_name for r in rows
        if r.assignee and r.assignee.full_name
    ]
