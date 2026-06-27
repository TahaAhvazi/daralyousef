"""Seed 3 test accounts per role for QA / manual testing.

Run from backend/ (with venv active):

    python -m app.db.seed_test_accounts

All accounts use password: Demo@1234
Emails: {role_slug}1@test.atelier.app … {role_slug}3@test.atelier.app
"""
from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import SessionLocal
from app.db.init_db import ROLES, _seed_departments, _seed_roles_and_permissions
from app.models.customer import Company, Customer
from app.models.rbac import Role, UserRole
from app.models.user import User
from app.utils.codes import customer_code

TEST_PASSWORD = "Demo@1234"
EMAIL_DOMAIN = "test.atelier.app"
ACCOUNTS_PER_ROLE = 3

# department slug in DB → user.department label / title template
ROLE_PROFILE: dict[str, dict] = {
    "ceo":                {"dept_slug": "sales",      "department": "Executive",  "title": "CEO",                 "is_staff": True},
    "cto":                  {"dept_slug": "sales",      "department": "Executive",  "title": "CTO",                 "is_staff": True},
    "general_manager":      {"dept_slug": "sales",      "department": "Executive",  "title": "General Manager",     "is_staff": True},
    "department_manager":   {"dept_slug": "design",     "department": "Design",     "title": "Department Manager",  "is_staff": True},
    "designer":             {"dept_slug": "design",     "department": "Design",     "title": "Designer",            "is_staff": True},
    "printing_operator":    {"dept_slug": "printing",   "department": "Printing",   "title": "Printing Operator",   "is_staff": True},
    "cnc_operator":         {"dept_slug": "cnc",        "department": "CNC",        "title": "CNC Operator",        "is_staff": True},
    "finishing_operator":   {"dept_slug": "flex_uv",    "department": "Flex / UV",  "title": "Finishing Operator",  "is_staff": True},
    "delivery_operator":    {"dept_slug": "delivery",   "department": "Delivery",   "title": "Delivery Operator",   "is_staff": True},
    "accountant":           {"dept_slug": "accounting", "department": "Finance",    "title": "Accountant",          "is_staff": True},
    "marketing":            {"dept_slug": "sales",      "department": "Marketing",  "title": "Marketing",           "is_staff": True},
    "warehouse":            {"dept_slug": "warehouse",  "department": "Warehouse",  "title": "Warehouse",           "is_staff": True},
    "sales":                {"dept_slug": "sales",      "department": "Sales",      "title": "Sales Rep",           "is_staff": True},
    "support":              {"dept_slug": "sales",      "department": "Support",    "title": "Support Agent",       "is_staff": True},
    "customer":             {"dept_slug": None,         "department": None,         "title": "Customer",            "is_staff": False},
}


def _email(role_slug: str, index: int) -> str:
    return f"{role_slug}{index}@{EMAIL_DOMAIN}"


def _display_name(role_name: str, index: int) -> str:
    return f"{role_name} Test {index}"


async def _sync_test_user_departments(db, depts: dict) -> int:
    """Align department_id on existing test accounts with workflow stages."""
    updated = 0
    for role_slug, profile in ROLE_PROFILE.items():
        dept_slug = profile.get("dept_slug")
        if not dept_slug or dept_slug not in depts:
            continue
        dept = depts[dept_slug]
        for i in range(1, ACCOUNTS_PER_ROLE + 1):
            email = _email(role_slug, i)
            res = await db.execute(select(User).where(User.email == email))
            user = res.scalar_one_or_none()
            if not user:
                continue
            if user.department_id != dept.id:
                user.department_id = dept.id
                user.department = profile.get("department") or dept.name
                updated += 1
    return updated


async def seed_test_accounts() -> list[tuple[str, str, str]]:
    """Create missing test users. Returns (email, password, role_slug) rows."""
    created: list[tuple[str, str, str]] = []
    pwd_hash = hash_password(TEST_PASSWORD)
    role_names = {slug: name for slug, name, _ in ROLES}

    async with SessionLocal() as db:
        depts = await _seed_departments(db)
        roles = await _seed_roles_and_permissions(db)
        role_by_slug = {r.slug: r for r in roles.values()}

        for role_slug, _role_name, _desc in ROLES:
            profile = ROLE_PROFILE.get(role_slug, {})
            role = role_by_slug.get(role_slug)
            if not role:
                continue

            for i in range(1, ACCOUNTS_PER_ROLE + 1):
                email = _email(role_slug, i)
                res = await db.execute(select(User).where(User.email == email))
                if res.scalar_one_or_none():
                    continue

                label = role_names.get(role_slug, role_slug)
                user = User(
                    email=email,
                    full_name=_display_name(label, i),
                    department=profile.get("department"),
                    title=profile.get("title"),
                    password_hash=pwd_hash,
                    is_active=True,
                    is_staff=profile.get("is_staff", True),
                    is_superuser=False,
                )
                dept_slug = profile.get("dept_slug")
                if dept_slug and dept_slug in depts:
                    user.department_id = depts[dept_slug].id

                db.add(user)
                await db.flush()
                db.add(UserRole(user_id=user.id, role_id=role.id, is_primary=True))

                if role_slug == "customer":
                    company = Company(name=f"Test Co {i}", industry="Retail")
                    db.add(company)
                    await db.flush()
                    db.add(Customer(
                        user_id=user.id,
                        company_id=company.id,
                        code=customer_code(),
                        full_name=user.full_name,
                        email=user.email,
                        city="Baghdad",
                        country="Iraq",
                        tags="test-seed",
                    ))

                created.append((email, TEST_PASSWORD, role_slug))

        synced = await _sync_test_user_departments(db, depts)
        await db.commit()
        if synced:
            print(f"Synced department for {synced} existing test account(s).")

    return created


def _print_summary(created: list[tuple[str, str, str]]) -> None:
    print("\n=== Test accounts seed ===\n")
    if not created:
        print("Nothing new — all test accounts already exist.")
    else:
        print(f"Created {len(created)} account(s). Password for all: {TEST_PASSWORD}\n")
        by_role: dict[str, list[str]] = {}
        for email, _pwd, role_slug in created:
            by_role.setdefault(role_slug, []).append(email)
        for role_slug in sorted(by_role):
            print(f"  [{role_slug}]")
            for email in by_role[role_slug]:
                print(f"    {email}")
            print()

    print("Full pattern (3 per role):")
    for role_slug, name, _ in ROLES:
        emails = ", ".join(_email(role_slug, i) for i in range(1, ACCOUNTS_PER_ROLE + 1))
        print(f"  {name:22} {emails}")
    print(f"\nPassword: {TEST_PASSWORD}\n")


async def main() -> None:
    created = await seed_test_accounts()
    _print_summary(created)


if __name__ == "__main__":
    asyncio.run(main())
