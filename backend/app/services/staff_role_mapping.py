"""Map Daftra / HR job titles → local RBAC role slugs.

Runs during staff sync and on every DB boot (idempotent) so production
deploys pick up role assignment without a manual step.
"""
from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.rbac import Role, UserRole
from app.models.user import User

logger = logging.getLogger("atelier.staff_roles")

# First matching keyword wins. Arabic titles from Daftra designations.
TITLE_ROLE_RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("designer", ("مصمم", "designer")),
    ("accountant", ("محاسب", "حسابدار", "accountant")),
    # "فني" / "فنى" → General Manager (org convention)
    ("general_manager", ("فني", "فنى", "فنيّ", "general manager", "general_manager")),
)


def resolve_role_slug_from_title(title: Optional[str]) -> Optional[str]:
    """Return RBAC slug for a job title, or None if no rule matches."""
    if not title or not str(title).strip():
        return None
    raw = str(title).strip()
    low = raw.casefold()
    for slug, keys in TITLE_ROLE_RULES:
        for key in keys:
            if key.casefold() in low or key in raw:
                return slug
    return None


def _is_demo_login(email: str) -> bool:
    e = (email or "").lower()
    return e.endswith("@atelier.app") or e.endswith("@test.atelier.app")


async def ensure_user_has_role(db: AsyncSession, user: User, role_slug: str) -> bool:
    """Attach role_slug to user if missing. Returns True when a row was added."""
    if not user.id:
        await db.flush()
    role_res = await db.execute(select(Role).where(Role.slug == role_slug))
    role = role_res.scalar_one_or_none()
    if not role:
        logger.warning("Role slug %r not found — skip assign for user %s", role_slug, user.id)
        return False
    existing = await db.execute(
        select(UserRole.id).where(UserRole.user_id == user.id, UserRole.role_id == role.id)
    )
    if existing.scalar_one_or_none():
        return False
    db.add(UserRole(user_id=user.id, role_id=role.id))
    return True


async def apply_title_role_to_user(db: AsyncSession, user: User) -> Optional[str]:
    """Ensure user has the RBAC role implied by their job title. Returns slug or None."""
    slug = resolve_role_slug_from_title(user.title)
    if not slug:
        return None
    await ensure_user_has_role(db, user, slug)
    return slug


async def backfill_staff_roles_and_login(db: AsyncSession) -> dict[str, int]:
    """Idempotent boot helper for deploys / migrations.

    - Assign designer / accountant / general_manager from job title
    - Set default password (PORTAL_DEFAULT_PASSWORD / yousef123) for synced staff
      so they can log in with their email
    """
    settings = get_settings()
    default_password = settings.PORTAL_DEFAULT_PASSWORD or "yousef123"
    pwd_hash = hash_password(default_password)

    res = await db.execute(
        select(User).where(
            User.is_staff.is_(True),
            User.deleted_at.is_(None),
        )
    )
    users = list(res.scalars().all())

    roles_added = 0
    passwords_set = 0
    mapped = 0

    for user in users:
        user.is_staff = True
        if not user.is_active:
            # Keep inactive Daftra-deleted staff inactive; only ensure login for active
            pass

        slug = resolve_role_slug_from_title(user.title)
        if slug:
            mapped += 1
            if await ensure_user_has_role(db, user, slug):
                roles_added += 1

        if not user.is_active:
            continue
        if _is_demo_login(user.email or ""):
            continue
        # Synced staff (or title-mapped staff): email + default password
        if user.daftra_id or slug:
            user.password_hash = pwd_hash
            passwords_set += 1

    stats = {"mapped_titles": mapped, "roles_added": roles_added, "passwords_set": passwords_set}
    if roles_added or passwords_set or mapped:
        logger.info("Staff title→role backfill: %s", stats)
    return stats
