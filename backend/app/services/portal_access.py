"""Portal login helpers for CRM customers (phone/email + default password)."""
from __future__ import annotations

import re
from typing import Optional, Set

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.customer import Customer
from app.models.rbac import Role, UserRole
from app.models.user import User


_BIDI_RE = re.compile(r"[\u200e\u200f\u202a-\u202e\u2066-\u2069]")


def normalize_phone(raw: Optional[str]) -> str:
    """Strip bidi marks and non-digits → digits-only phone key."""
    if not raw:
        return ""
    cleaned = _BIDI_RE.sub("", str(raw)).strip()
    digits = re.sub(r"\D+", "", cleaned)
    if digits.startswith("00"):
        digits = digits[2:]
    return digits


def phone_lookup_variants(raw: Optional[str]) -> Set[str]:
    """Possible stored forms for the same Iraqi/mobile number."""
    variants: Set[str] = set()
    if not raw:
        return variants
    original = _BIDI_RE.sub("", str(raw)).strip()
    if original:
        variants.add(original)
    digits = normalize_phone(raw)
    if not digits:
        return variants
    variants.add(digits)
    variants.add(f"+{digits}")
    if digits.startswith("964") and len(digits) >= 12:
        local = "0" + digits[3:]
        variants.add(local)
        variants.add(digits[3:])
        variants.add(f"+964{digits[3:]}")
    elif digits.startswith("0") and len(digits) >= 10:
        intl = "964" + digits[1:]
        variants.add(intl)
        variants.add(f"+{intl}")
        variants.add(digits[1:])
    elif len(digits) in (10, 11) and not digits.startswith("0"):
        variants.add("0" + digits)
        variants.add("964" + digits)
        variants.add(f"+964{digits}")
    return {v for v in variants if v}


def portal_email_for_customer(customer: Customer) -> str:
    """Stable unique login email for portal users (never collide across customers)."""
    if customer.daftra_id:
        return f"dft{customer.daftra_id}@portal.local"
    digits = normalize_phone(customer.phone)
    if digits:
        return f"{digits}@portal.local"
    return f"customer{customer.id}@portal.local"


async def ensure_customer_portal_user(
    db: AsyncSession,
    customer: Customer,
    *,
    password: Optional[str] = None,
    password_hash: Optional[str] = None,
    reset_password: bool = False,
) -> Optional[User]:
    """Ensure CRM customer has an active portal User linked (default password from settings)."""
    pwd_hash = password_hash
    if pwd_hash is None:
        pwd = (password or settings.PORTAL_DEFAULT_PASSWORD or "yousef123").strip()
        if len(pwd) < 8:
            pwd = "yousef123"
        pwd_hash = hash_password(pwd)

    # Already linked
    if customer.user_id:
        user = await db.get(User, customer.user_id)
        if user and user.deleted_at is None:
            if customer.phone:
                user.phone = customer.phone[:40]
            if reset_password:
                user.password_hash = pwd_hash
            user.is_active = True
            return user

    email = portal_email_for_customer(customer)
    phone = (customer.phone or None)
    if phone:
        phone = str(phone)[:40]

    # Prefer the dedicated synthetic email for this customer
    res = await db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
    existing = res.scalar_one_or_none()

    if existing:
        if existing.is_staff or existing.is_superuser:
            existing = None
        else:
            # Ensure this user isn't already linked to a different customer
            linked = await db.execute(
                select(Customer.id).where(
                    Customer.user_id == existing.id,
                    Customer.id != customer.id,
                    Customer.deleted_at.is_(None),
                )
            )
            if linked.scalar_one_or_none() is not None:
                # Phone collision / shared email — mint a unique email
                email = f"dft{customer.daftra_id or customer.id}-{customer.id}@portal.local"
                existing = None

    if existing:
        customer.user_id = existing.id
        if phone:
            existing.phone = phone
        if reset_password:
            existing.password_hash = pwd_hash
        existing.is_active = True
        existing.full_name = customer.full_name or existing.full_name
        return existing

    user = User(
        email=email,
        full_name=customer.full_name or email,
        phone=phone,
        password_hash=pwd_hash,
        is_active=True,
        is_staff=False,
        is_superuser=False,
    )
    db.add(user)
    await db.flush()

    role_res = await db.execute(select(Role).where(Role.slug == "customer"))
    role = role_res.scalar_one_or_none()
    if role:
        db.add(UserRole(user_id=user.id, role_id=role.id, is_primary=True))

    customer.user_id = user.id
    return user


async def find_user_by_login(db: AsyncSession, login: str) -> Optional[User]:
    """Resolve portal/staff user by email or phone number."""
    raw = (login or "").strip()
    if not raw:
        return None

    # Email path
    if "@" in raw:
        res = await db.execute(
            select(User).where(User.email == raw.lower(), User.deleted_at.is_(None))
        )
        return res.scalar_one_or_none()

    # Phone path
    variants = list(phone_lookup_variants(raw))
    if not variants:
        return None
    res = await db.execute(
        select(User).where(
            User.deleted_at.is_(None),
            or_(*[User.phone == v for v in variants[:16]]),
        )
    )
    user = res.scalars().first()
    if user:
        return user

    # Also try synthetic portal emails derived from digits
    digits = normalize_phone(raw)
    if digits:
        res = await db.execute(
            select(User).where(
                User.email == f"{digits}@portal.local",
                User.deleted_at.is_(None),
            )
        )
        return res.scalar_one_or_none()
    return None
