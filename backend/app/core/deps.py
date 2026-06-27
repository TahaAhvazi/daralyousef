"""Reusable FastAPI dependencies: current user, RBAC."""
from __future__ import annotations

from typing import Iterable, List, Optional, Set

from fastapi import Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import safe_decode_token
from app.db.base import get_db
from app.models.rbac import Permission, UserPermission
from app.models.user import User


async def _user_from_token(token: str, db: AsyncSession) -> User:
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        raise UnauthorizedError("Invalid token subject")

    res = await db.execute(
        select(User)
        .where(User.id == user_id, User.deleted_at.is_(None))
        .options(
            selectinload(User.roles),
            selectinload(User.permissions).selectinload(UserPermission.permission),
        )
    )
    user = res.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


async def current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
) -> User:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise UnauthorizedError("Missing bearer token")
    user = await _user_from_token(token, db)
    request.state.user = user
    return user


async def current_active_staff(user: User = Depends(current_user)) -> User:
    if not user.is_staff and not user.is_superuser:
        raise ForbiddenError("Staff access required")
    return user


async def current_superuser(user: User = Depends(current_user)) -> User:
    """Restrict an endpoint to platform administrators only."""
    if not user.is_superuser:
        raise ForbiddenError("Administrator access required")
    return user


async def _user_permissions(user: User, db: AsyncSession) -> Set[str]:
    """Effective permission codes = role permissions union user grants minus user denies."""
    if user.is_superuser:
        return {"*"}
    role_ids = [ur.role_id for ur in user.roles]
    granted: Set[str] = set()
    if role_ids:
        from app.models.rbac import RolePermission
        res = await db.execute(
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id.in_(role_ids))
        )
        granted.update(res.scalars().all())
    # user-level overrides
    for up in user.permissions:
        code = up.permission.code if up.permission else None
        if not code:
            continue
        if up.grant:
            granted.add(code)
        else:
            granted.discard(code)
    return granted


def require_permissions(*required: str):
    """Dependency factory: ensures the current user has ALL listed permissions."""
    required_set = set(required)

    async def _checker(
        user: User = Depends(current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if user.is_superuser:
            return user
        perms = await _user_permissions(user, db)
        if "*" in perms:
            return user
        missing = required_set - perms
        if missing:
            raise ForbiddenError(f"Missing permissions: {', '.join(sorted(missing))}")
        return user

    return _checker


def require_any_permission(*required: str):
    """Dependency factory: user needs at least ONE of the listed permissions."""
    required_set = set(required)

    async def _checker(
        user: User = Depends(current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if user.is_superuser:
            return user
        perms = await _user_permissions(user, db)
        if "*" in perms:
            return user
        if required_set & perms:
            return user
        raise ForbiddenError(f"Missing one of: {', '.join(sorted(required_set))}")

    return _checker


def require_any_role(*role_slugs: str):
    """Dependency factory: user must hold at least one of the given role slugs."""
    wanted = set(role_slugs)

    async def _checker(
        user: User = Depends(current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if user.is_superuser:
            return user
        from app.models.rbac import Role, UserRole
        res = await db.execute(
            select(Role.slug)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        slugs = set(res.scalars().all())
        if not slugs & wanted:
            raise ForbiddenError(f"Requires role: {' or '.join(role_slugs)}")
        return user

    return _checker
