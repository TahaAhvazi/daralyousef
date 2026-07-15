"""Shared access rules for order chat + project notes."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.models.order import Order, OrderWorkflowAssignment
from app.models.rbac import Role, UserRole
from app.models.user import User

# Can leave notes on every project (hand-off / finance oversight).
GLOBAL_NOTE_ROLE_SLUGS = frozenset({"ceo", "accountant"})


async def _role_slugs(db: AsyncSession, user: User) -> set[str]:
    res = await db.execute(
        select(Role.slug)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    return set(res.scalars().all())


async def user_has_global_note_access(db: AsyncSession, user: User) -> bool:
    if user.is_superuser:
        return True
    slugs = await _role_slugs(db, user)
    return bool(slugs & GLOBAL_NOTE_ROLE_SLUGS)


async def user_is_order_assignee(db: AsyncSession, user: User, order_id: int) -> bool:
    res = await db.execute(
        select(OrderWorkflowAssignment.id)
        .where(
            OrderWorkflowAssignment.order_id == order_id,
            OrderWorkflowAssignment.assignee_id == user.id,
            OrderWorkflowAssignment.is_skipped.is_(False),
        )
        .limit(1)
    )
    return res.scalar_one_or_none() is not None


async def assert_can_access_order_collaboration(
    db: AsyncSession, user: User, order: Order,
) -> None:
    """Staff may open chat/notes if admin, reader, assignee, CEO, or accountant."""
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff only")
    if user.is_superuser:
        return

    from app.core.deps import _user_permissions

    perms = await _user_permissions(user, db)
    if "*" in perms or "orders:admin" in perms or "orders:read" in perms or "orders:update" in perms:
        return
    if await user_has_global_note_access(db, user):
        return
    if await user_is_order_assignee(db, user, order.id):
        return
    raise ForbiddenError("You do not have access to this project")


async def assert_can_write_order_note(db: AsyncSession, user: User, order: Order) -> None:
    """Assignees, CEO, and accountant can add notes."""
    if not (user.is_staff or user.is_superuser):
        raise ForbiddenError("Staff only")
    if user.is_superuser:
        return

    from app.core.deps import _user_permissions

    perms = await _user_permissions(user, db)
    if "*" in perms or "orders:admin" in perms:
        return
    if await user_has_global_note_access(db, user):
        return
    if await user_is_order_assignee(db, user, order.id):
        return
    raise ForbiddenError("Only assigned staff, CEO, or accountant can leave project notes")


async def ids_for_global_watchers(db: AsyncSession) -> set[int]:
    """CEO + accountant user ids (always invited to project groups)."""
    res = await db.execute(
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(
            Role.slug.in_(tuple(GLOBAL_NOTE_ROLE_SLUGS)),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    return set(res.scalars().all())
