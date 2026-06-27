"""Ticket access control and serialization helpers."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import _user_permissions
from app.core.exceptions import ForbiddenError, ValidationError
from app.models.customer import Customer
from app.models.rbac import Role, UserRole
from app.models.support import Ticket
from app.models.user import User
from app.schemas.support import TicketMessageOut, TicketOut

CLOSED_STATUSES = frozenset({"closed", "resolved"})


async def resolve_customer(db: AsyncSession, user: User) -> Optional[Customer]:
    if user.is_staff or user.is_superuser:
        return None
    res = await db.execute(select(Customer).where(Customer.user_id == user.id))
    return res.scalar_one_or_none()


async def user_can_view_all_tickets(db: AsyncSession, user: User) -> bool:
    if user.is_superuser:
        return True
    perms = await _user_permissions(user, db)
    if "*" in perms:
        return True
    if "support:read" in perms and "support:reply" not in perms:
        return True
    return False


async def user_has_support_reply(db: AsyncSession, user: User) -> bool:
    if user.is_superuser:
        return True
    perms = await _user_permissions(user, db)
    return "*" in perms or "support:reply" in perms


def is_ticket_closed(ticket: Ticket) -> bool:
    return ticket.status in CLOSED_STATUSES


async def apply_ticket_list_scope(stmt, db: AsyncSession, user: User):
    if user.is_staff or user.is_superuser:
        if user.is_superuser or await user_can_view_all_tickets(db, user):
            return stmt
        if await user_has_support_reply(db, user):
            return stmt.where(Ticket.assignee_id == user.id)
        perms = await _user_permissions(user, db)
        if "support:read" in perms or "support:reply" in perms:
            raise ForbiddenError("Missing ticket access")
        raise ForbiddenError("Missing one of: support:read, support:reply")
    cust = await resolve_customer(db, user)
    if not cust:
        return stmt.where(Ticket.id == -1)
    return stmt.where(Ticket.customer_id == cust.id)


async def assert_ticket_view(db: AsyncSession, user: User, ticket: Ticket) -> None:
    if user.is_staff or user.is_superuser:
        if user.is_superuser or await user_can_view_all_tickets(db, user):
            return
        if ticket.assignee_id == user.id and await user_has_support_reply(db, user):
            return
        raise ForbiddenError("Not assigned to this ticket")
    cust = await resolve_customer(db, user)
    if not cust or cust.id != ticket.customer_id:
        raise ForbiddenError("Not your ticket")


async def assert_ticket_reply(db: AsyncSession, user: User, ticket: Ticket) -> None:
    await assert_ticket_view(db, user, ticket)
    if is_ticket_closed(ticket):
        raise ValidationError("Ticket is closed")
    if user.is_staff or user.is_superuser:
        if user.is_superuser or await user_can_view_all_tickets(db, user):
            if not await user_has_support_reply(db, user) and not user.is_superuser:
                if "support:read" in await _user_permissions(user, db):
                    raise ForbiddenError("Read-only access")
            return
        if ticket.assignee_id == user.id:
            return
        raise ForbiddenError("Not assigned to this ticket")


async def assert_ticket_close(db: AsyncSession, user: User, ticket: Ticket) -> None:
    if user.is_superuser:
        return
    if user.is_staff or user.is_superuser:
        if ticket.assignee_id == user.id and await user_has_support_reply(db, user):
            return
        if await user_can_view_all_tickets(db, user):
            raise ForbiddenError("Read-only access")
        raise ForbiddenError("Only the assignee or administrator can close this ticket")
    cust = await resolve_customer(db, user)
    if cust and cust.id == ticket.customer_id:
        return
    raise ForbiddenError("Not your ticket")


async def assert_ticket_assign(db: AsyncSession, user: User) -> None:
    if user.is_superuser:
        return
    if not await user_has_support_reply(db, user):
        raise ForbiddenError("Missing support:reply")


async def assert_ticket_update(db: AsyncSession, user: User, ticket: Ticket, payload: dict) -> None:
    await assert_ticket_view(db, user, ticket)
    if "status" in payload and payload["status"] in CLOSED_STATUSES:
        await assert_ticket_close(db, user, ticket)
    if "assignee_id" in payload:
        await assert_ticket_assign(db, user)
    if user.is_staff or user.is_superuser:
        if not user.is_superuser and not await user_has_support_reply(db, user):
            if await user_can_view_all_tickets(db, user):
                raise ForbiddenError("Read-only access")
            raise ForbiddenError("Missing support:reply")


async def load_user_names(db: AsyncSession, user_ids: set[int]) -> dict[int, str]:
    if not user_ids:
        return {}
    res = await db.execute(
        select(User.id, User.full_name).where(User.id.in_(user_ids))
    )
    return {row.id: row.full_name for row in res.all()}


async def serialize_ticket(db: AsyncSession, ticket: Ticket) -> TicketOut:
    ids: set[int] = set()
    if ticket.assignee_id:
        ids.add(ticket.assignee_id)
    for msg in ticket.messages:
        if msg.author_user_id:
            ids.add(msg.author_user_id)
    names = await load_user_names(db, ids)
    data = TicketOut.model_validate(ticket)
    data.assignee_name = names.get(ticket.assignee_id) if ticket.assignee_id else None
    data.messages = [
        TicketMessageOut.model_validate(m).model_copy(
            update={"author_name": names.get(m.author_user_id) if m.author_user_id else None},
        )
        for m in ticket.messages
    ]
    return data


async def list_support_assignees(db: AsyncSession) -> list[dict]:
    res = await db.execute(
        select(User.id, User.full_name, User.email)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(
            Role.slug == "support",
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
        .order_by(User.full_name)
    )
    return [{"id": r.id, "full_name": r.full_name, "email": r.email} for r in res.all()]
