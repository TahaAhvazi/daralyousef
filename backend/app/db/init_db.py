"""Create tables and seed demo data."""
from __future__ import annotations

import asyncio
import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select, text

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base, SessionLocal, engine
from app.db.migrate import run_schema_migrations
from app.models import (  # noqa: F401  (register all)
    BrandSettings, Customer, Company, Department, Material, Order, OrderItem,
    OrderItemStatusHistory, OrderStatusEvent, OrderWorkflowAssignment,
    Permission, PricingRule, Product, ProductCategory, ProductMaterial, Role, RolePermission,
    Ticket, TicketMessage,
    Conversation, ConversationMember, ChatMessage,
    User, UserRole, Warehouse,
    EmployeeContract, HrRequest, Payslip, AttendanceRecord, Designation, StaffProfile,
    CreditNote, SalesReturn, RecurringInvoice, InstallmentPlan, PosSession,
    Vendor, PurchaseOrder, SalesSettings, DocumentTemplate,
)
from app.utils.product_departments import sync_product_departments
from app.models.branding import (
    DEFAULT_ACCENT_DARK, DEFAULT_ACCENT_LIGHT,
    DEFAULT_BRAND_DARK, DEFAULT_BRAND_LIGHT,
)

logger = logging.getLogger(__name__)


# Previous palettes — migrate unmodified rows to the fixed monochrome defaults.
LEGACY_BRAND_LIGHT = "#105C46"
LEGACY_BRAND_DARK = "#34A984"
LEGACY_ACCENT_LIGHT = "#C49A3C"
LEGACY_ACCENT_DARK = "#E0B860"
PREV_BRAND_LIGHT = "#2D498A"
PREV_BRAND_DARK = "#6C89C8"
PREV_ACCENT_LIGHT = "#FCE331"
PREV_ACCENT_DARK = "#FCE331"

_KNOWN_DEFAULT_PALETTES = (
    (LEGACY_BRAND_LIGHT, LEGACY_BRAND_DARK, LEGACY_ACCENT_LIGHT, LEGACY_ACCENT_DARK),
    (PREV_BRAND_LIGHT, PREV_BRAND_DARK, PREV_ACCENT_LIGHT, PREV_ACCENT_DARK),
)


# ── Role + permission catalog ────────────────────────────────────────────────
ROLES = [
    ("ceo",                "CEO",                "Chief Executive Officer"),
    ("cto",                "CTO",                "Chief Technology Officer"),
    ("general_manager",    "General Manager",    "Cross-department leadership"),
    ("department_manager", "Department Manager", "Manages a single department"),
    ("designer",           "Designer",           "Creative work"),
    ("printing_operator",  "Printing Operator",  "Runs production"),
    ("cnc_operator",       "CNC Operator",       "CNC laser cutting and production"),
    ("finishing_operator", "Finishing Operator", "Flex, UV, and finishing work"),
    ("delivery_operator",  "Delivery Operator",  "Packing and customer delivery"),
    ("accountant",         "Accountant",         "Finance & books"),
    ("marketing",          "Marketing Employee", "Campaigns and content"),
    ("warehouse",          "Warehouse Employee", "Stock movements"),
    ("sales",              "Sales Employee",     "Leads, deals, quotes"),
    ("support",            "Customer Support",   "Tickets and replies"),
    ("customer",           "Customer",           "End-user customer"),
]

DEPARTMENTS = [
    ("accounting", "Accounting", "Finance, invoicing, and payments", 1),
    ("sales", "Sales / Marketing", "Leads, quotes, and customer relations", 2),
    ("design", "Design", "Creative design and artwork", 3),
    ("printing", "Printing", "Offset, digital, and large-format printing", 4),
    ("cnc", "CNC", "Laser cutting, engraving, and CNC production", 5),
    ("flex_uv", "Flex / UV", "Flex banners, UV printing, and rollups", 6),
    ("warehouse", "Warehouse", "Materials and stock management", 7),
    ("delivery", "Delivery / Operations", "Finishing, packing, and delivery", 8),
]

PERMS = [
    ("users:read", "users", "read"),
    ("users:create", "users", "create"),
    ("users:update", "users", "update"),
    ("users:delete", "users", "delete"),
    ("crm:read", "crm", "read"),
    ("crm:create", "crm", "create"),
    ("crm:update", "crm", "update"),
    ("crm:delete", "crm", "delete"),
    ("catalog:manage", "catalog", "manage"),
    ("orders:read", "orders", "read"),
    ("orders:create", "orders", "create"),
    ("orders:update", "orders", "update"),
    ("orders:delete", "orders", "delete"),
    ("orders:admin", "orders", "admin"),
    ("finance:read", "finance", "read"),
    ("finance:create", "finance", "create"),
    ("finance:update", "finance", "update"),
    ("finance:delete", "finance", "delete"),
    ("inventory:read", "inventory", "read"),
    ("inventory:create", "inventory", "create"),
    ("inventory:update", "inventory", "update"),
    ("inventory:delete", "inventory", "delete"),
    ("production:read", "production", "read"),
    ("production:update", "production", "update"),
    ("design:create", "design", "create"),
    ("design:approve", "design", "approve"),
    ("support:read", "support", "read"),
    ("support:reply", "support", "reply"),
    ("messages:read", "messages", "read"),
    ("messages:send", "messages", "send"),
    ("marketing:manage", "marketing", "manage"),
    ("outdoor:manage", "outdoor", "manage"),
    ("embroidery:manage", "embroidery", "manage"),
    ("academic:manage", "academic", "manage"),
    ("audit:read", "audit", "read"),
    ("dashboard:read", "dashboard", "read"),
    ("hr:read", "hr", "read"),
    ("hr:manage", "hr", "manage"),
]

ROLE_PERMS = {
    "ceo": ["*"],
    "cto": [
        "users:read", "users:create", "users:update", "users:delete",
        "crm:read", "crm:create", "crm:update", "crm:delete",
        "orders:read", "orders:create", "orders:update", "orders:admin",
        "finance:read",
        "production:read", "production:update",
        "audit:read", "dashboard:read",
        "hr:read", "hr:manage",
        "messages:read", "messages:send",
    ],
    "general_manager": [
        "users:read", "users:create", "users:update", "users:delete",
        "crm:read", "crm:create", "crm:update",
        "orders:read", "orders:create", "orders:update", "orders:admin",
        "finance:read", "finance:create", "finance:update",
        "inventory:read", "inventory:create", "inventory:update",
        "production:read", "production:update",
        "catalog:manage", "audit:read", "support:read",
        "dashboard:read", "hr:read", "hr:manage",
        "messages:read", "messages:send",
    ],
    "department_manager": [
        "crm:read", "production:read", "production:update",
        "messages:read", "messages:send",
    ],
    "designer": ["design:create", "production:read", "production:update", "messages:read", "messages:send"],
    "printing_operator": ["production:read", "production:update", "messages:read", "messages:send"],
    "cnc_operator": ["production:read", "production:update", "messages:read", "messages:send"],
    "finishing_operator": ["production:read", "production:update", "messages:read", "messages:send"],
    "delivery_operator": [
        "production:read", "production:update",
        "messages:read", "messages:send",
    ],
    "accountant": ["finance:read", "finance:create", "finance:update", "crm:read", "orders:read", "orders:update", "messages:read", "messages:send"],
    "marketing": ["marketing:manage", "crm:read", "crm:update", "messages:read", "messages:send"],
    "warehouse": [
        "inventory:read", "inventory:create", "inventory:update",
        "catalog:manage",
        "orders:read", "production:read",
        "messages:read", "messages:send",
    ],
    "sales": [
        "crm:read", "crm:create", "crm:update",
        "orders:read", "orders:create", "orders:update",
        "finance:read", "finance:create",
        "messages:read", "messages:send",
    ],
    "support": ["support:read", "support:reply", "crm:read", "messages:read", "messages:send"],
    "customer": [],
}


USERS = [
    ("ceo@atelier.app",         "CEO",         "Executive", "CEO",          "ceo",                True,  True,  True),
    ("cto@atelier.app",         "Alex CTO",    "Executive", "CTO",          "cto",                True,  True,  False),
    ("gm@atelier.app",          "General Mgr", "Executive", "General Manager", "general_manager", True,  True,  False),
    ("design.lead@atelier.app", "Design Lead", "Design",    "Department Manager", "department_manager", True, True, False),
    ("designer@atelier.app",    "Aria Designer", "Design",  "Senior Designer",    "designer",      True,  True,  False),
    ("printop@atelier.app",     "Press Pro",   "Production","Print Operator",     "printing_operator", True, True, False),
    ("cnc@atelier.app",         "CNC Chris",   "CNC",       "CNC Operator",       "cnc_operator",      True, True, False),
    ("finishing@atelier.app",   "Flex Fay",    "Flex / UV", "Finishing Operator", "finishing_operator",True, True, False),
    ("delivery@atelier.app",    "Deli Very",   "Delivery",  "Delivery Lead",      "delivery_operator", True, True, False),
    ("accountant@atelier.app",  "Lena Books",  "Finance",   "Accountant",         "accountant",    True,  True,  False),
    ("marketing@atelier.app",   "Mark Eter",   "Marketing", "Marketing Specialist", "marketing",   True,  True,  False),
    ("warehouse@atelier.app",   "Stock Sam",   "Warehouse", "Warehouse Lead",     "warehouse",     True,  True,  False),
    ("sales@atelier.app",       "Sam Sales",   "Sales",     "Sales Rep",          "sales",         True,  True,  False),
    ("support@atelier.app",     "Sup Port",    "Support",   "Support Agent",      "support",       True,  True,  False),
    ("customer@atelier.app",    "Acme Customer", None,      "Buyer",              "customer",      True,  False, False),
]


CATEGORIES = [
    ("Printing",         "printing",    "printer",   1, "الطباعة"),
    ("Branding",         "branding",    "sparkles",  2, "الهوية البصرية"),
    ("Outdoor",          "outdoor",     "map",       3, "الإعلانات الخارجية"),
    ("Educational",      "educational", "book",      4, "الطباعة التعليمية"),
    ("Embroidery",       "embroidery",  "shirt",     5, "التطريز"),
    ("Marketing",        "marketing",   "megaphone", 6, "التسويق"),
    ("Promotional Gifts","gifts",       "gift",      7, "الهدايا الترويجية"),
]


# (sku, name, cat_slug, unit, price, tax, desc, options, rules, pricing_model, dept_slugs, name_ar, desc_ar)
PRODUCTS = [
    ("PRINT-FLEX-3M",  "Flex Banner Print",     "printing",   "m²", 8.0,  0.0, "Outdoor flex banner printing.",
     {"sizes": ["3m", "6m", "12m"], "materials": ["flex", "mesh"], "complexity": ["low", "medium", "high"]},
     [("material", "mesh", 1.2, 0), ("complexity", "high", 1.3, 0), ("complexity", "medium", 1.1, 0)],
     "variable", ["design", "flex_uv", "delivery"],
     "طباعة بانر فلекс", "طباعة بانر فلекс للاستخدام الخارجي."),
    ("PRINT-UV-A2",    "UV Print A2",           "printing",   "pcs",18.0, 0.0, "High-quality UV printing.",
     {"sizes": ["A4", "A3", "A2", "A1"], "materials": ["paper", "acrylic", "metal"]},
     [("materials", "acrylic", 1.4, 0), ("materials", "metal", 1.8, 0)],
     "variable", ["design", "flex_uv", "delivery"],
     "طباعة UV مقاس A2", "طباعة UV عالية الجودة."),
    ("PRINT-CARD",     "Business Cards",        "printing",   "pcs", 0.6,  0.0, "Premium business card printing.",
     {"finish": ["matte", "gloss", "soft-touch"], "sides": ["single", "double"]},
     [("finish", "soft-touch", 1.3, 0), ("sides", "double", 1.5, 0)],
     "fixed", ["design", "printing", "delivery"],
     "بطاقات عمل", "طباعة بطاقات عمل فاخرة."),
    ("CNC-LASER",      "Laser Cutting",         "printing",   "pcs", 25.0, 0.0, "CNC laser cutting on acrylic, wood, MDF.",
     {"materials": ["acrylic", "wood", "mdf"], "complexity": ["low", "medium", "high"]},
     [("materials", "wood", 1.2, 0), ("complexity", "high", 1.5, 0)],
     "variable", ["design", "cnc", "delivery"],
     "قطع ليزر CNC", "قطع ليزر على أكريليك وخشب وMDF."),
    ("DESIGN-LOGO",    "Logo Design",           "branding",   "pcs", 250.0,0.0,"Bespoke logo design.",
     {"package": ["basic", "standard", "premium"]},
     [("package", "standard", 1.6, 0), ("package", "premium", 2.5, 0)],
     "custom_quote", ["design"],
     "تصميم شعار", "تصميم شعار مخصص."),
    ("DESIGN-BRAND",   "Brand Identity",        "branding",   "pkg", 1200.0,0.0,"Complete brand identity package.",
     {}, [], "custom_quote", ["design"],
     "الهوية البصرية", "باقة هوية بصرية متكاملة."),
    ("OUTDOOR-BB",     "Billboard Production",  "outdoor",    "pcs", 600.0, 0.0,"Billboard printing & installation.",
     {"size": ["small", "medium", "large", "xl"]},
     [("size", "medium", 1.4, 0), ("size", "large", 1.8, 0), ("size", "xl", 2.2, 0)],
     "variable", ["design", "flex_uv", "delivery"],
     "إنتاج لوحات إعلانية", "طباعة وتركيب لوحات إعلانية."),
    ("OUTDOOR-VEHWRAP","Vehicle Wrapping",      "outdoor",    "pcs", 900.0, 0.0,"Full vehicle wrap.",
     {"coverage": ["partial", "full"]}, [("coverage", "full", 1.5, 0)],
     "custom_quote", ["design", "flex_uv", "delivery"],
     "تغليف المركبات", "تغليف كامل للمركبات."),
    ("EDU-EXAM",       "Exam Printing",         "educational","pcs", 0.50, 0.0,"Bulk exam printing.",
     {"binding": ["staple", "thermal"]}, [("binding", "thermal", 1.2, 0.05)],
     "fixed", ["printing", "delivery"],
     "طباعة امتحانات", "طباعة امتحانات بالجملة."),
    ("EDU-BOOK",       "Book Printing",         "educational","pcs", 4.50, 0.0,"Book printing & binding.",
     {"binding": ["paperback", "hardcover"]}, [("binding", "hardcover", 1.6, 0.5)],
     "variable", ["design", "printing", "delivery"],
     "طباعة كتب", "طباعة وتجليد الكتب."),
    ("EMB-UNIFORM",    "Uniform Embroidery",    "embroidery", "pcs", 7.0,  0.0, "Logo embroidery on uniforms.",
     {"stitches": ["small", "medium", "large"]},
     [("stitches", "medium", 1.4, 0), ("stitches", "large", 1.8, 0)],
     "variable", ["design", "cnc", "delivery"],
     "تطريز الزي الموحد", "تطريز الشعار على الزي."),
    ("MKT-CAMPAIGN",   "Social Media Campaign", "marketing",  "month", 800.0, 0.0,"Monthly campaign management.",
     {"tier": ["starter", "growth", "premium"]},
     [("tier", "growth", 1.5, 0), ("tier", "premium", 2.2, 0)],
     "custom_quote", ["sales"],
     "حملة وسائل التواصل", "إدارة حملة شهرية."),
    ("GIFT-MUG",       "Promotional Mug",       "gifts",      "pcs", 4.5,  0.0,"Branded mug.", {}, [],
     "fixed", ["printing", "delivery"],
     "كوب ترويجي", "كوب مطبوع بالعلامة التجارية."),
    ("GIFT-PEN",       "Promotional Pen",       "gifts",      "pcs", 1.2,  0.0,"Branded pen.", {}, [],
     "fixed", ["printing", "delivery"],
     "قلم ترويجي", "قلم مطبوع بالعلامة التجارية."),
]


MATERIALS = [
    ("flex-3.2",     "Flex 3.2m Roll",   "m",  300, 1.20, 50, "flex"),
    ("mesh-3.2",     "Mesh 3.2m Roll",   "m",  120, 1.80, 30, "mesh"),
    ("ink-cyan",     "UV Ink Cyan 1L",   "L",   18, 45,    5, "ink"),
    ("ink-magenta",  "UV Ink Magenta 1L","L",   16, 45,    5, "ink"),
    ("ink-yellow",   "UV Ink Yellow 1L", "L",   12, 45,    5, "ink"),
    ("ink-black",    "UV Ink Black 1L",  "L",   22, 45,    5, "ink"),
    ("paper-a4",     "A4 Paper Pack",    "pack", 400, 4,  20, "paper"),
    ("paper-a3",     "A3 Paper Pack",    "pack", 80,  9,  10, "paper"),
    ("acrylic-3mm",  "Acrylic Sheet 3mm","pcs",  25, 22,   5, "acrylic"),
    ("thread-white", "Embroidery Thread White", "spool", 60, 3, 10, "thread"),
    ("thread-black", "Embroidery Thread Black", "spool", 50, 3, 10, "thread"),
]


# (product_sku, material_sku, quantity_per_unit)
PRODUCT_BOM = [
    ("PRINT-FLEX-3M", "flex-3.2", 6.0),
    ("PRINT-UV-A2", "acrylic-3mm", 1.0),
    ("PRINT-UV-A2", "ink-cyan", 0.05),
    ("PRINT-UV-A2", "ink-magenta", 0.05),
    ("PRINT-CARD", "paper-a4", 0.02),
    ("CNC-LASER", "acrylic-3mm", 1.0),
    ("OUTDOOR-BB", "flex-3.2", 12.0),
    ("OUTDOOR-BB", "mesh-3.2", 4.0),
    ("EDU-EXAM", "paper-a4", 0.05),
    ("EDU-BOOK", "paper-a3", 0.1),
]


async def _seed_departments(db) -> dict[str, Department]:
    dept_map: dict[str, Department] = {}
    for slug, name, desc, sort in DEPARTMENTS:
        res = await db.execute(select(Department).where(Department.slug == slug))
        d = res.scalar_one_or_none()
        if not d:
            d = Department(slug=slug, name=name, description=desc, sort_order=sort)
            db.add(d)
            await db.flush()
        dept_map[slug] = d
    return dept_map


async def _link_user_departments(db, users: dict[str, User], depts: dict[str, Department]) -> None:
    mapping = {
        "ceo@atelier.app": "sales",
        "cto@atelier.app": "sales",
        "gm@atelier.app": "sales",
        "design.lead@atelier.app": "design",
        "designer@atelier.app": "design",
        "printop@atelier.app": "printing",
        "cnc@atelier.app": "cnc",
        "finishing@atelier.app": "flex_uv",
        "delivery@atelier.app": "delivery",
        "accountant@atelier.app": "accounting",
        "marketing@atelier.app": "sales",
        "warehouse@atelier.app": "warehouse",
        "sales@atelier.app": "sales",
        "support@atelier.app": "sales",
    }
    for email, slug in mapping.items():
        u = users.get(email)
        d = depts.get(slug)
        if u and d:
            u.department_id = d.id
            u.department = d.name


async def _seed_roles_and_permissions(db) -> dict[str, Role]:
    role_map: dict[str, Role] = {}
    for slug, name, desc in ROLES:
        res = await db.execute(select(Role).where(Role.slug == slug))
        r = res.scalar_one_or_none()
        if not r:
            r = Role(slug=slug, name=name, description=desc, is_system=True)
            db.add(r); await db.flush()
        role_map[slug] = r

    perm_map: dict[str, Permission] = {}
    for code, module, action in PERMS:
        res = await db.execute(select(Permission).where(Permission.code == code))
        p = res.scalar_one_or_none()
        if not p:
            p = Permission(code=code, module=module, action=action)
            db.add(p); await db.flush()
        perm_map[code] = p

    from sqlalchemy import delete

    for slug, perms in ROLE_PERMS.items():
        role = role_map[slug]
        wanted = list(perm_map.values()) if perms == ["*"] else [perm_map[c] for c in perms if c in perm_map]
        wanted_ids = {p.id for p in wanted}
        existing = set(
            (await db.execute(
                select(RolePermission.permission_id).where(RolePermission.role_id == role.id))
            ).scalars().all()
        )
        for p in wanted:
            if p.id not in existing:
                db.add(RolePermission(role_id=role.id, permission_id=p.id))
        if perms != ["*"]:
            stale = existing - wanted_ids
            if stale:
                await db.execute(
                    delete(RolePermission).where(
                        RolePermission.role_id == role.id,
                        RolePermission.permission_id.in_(stale),
                    )
                )

    return role_map


async def _seed_users(db, roles: dict[str, Role]) -> dict[str, User]:
    """Idempotent demo login accounts (Login page «Try a demo role»).

    Always ensures @atelier.app users exist with Demo@1234 and the correct role,
    even when Daftra-synced staff already fill the DB.
    """
    users: dict[str, User] = {}
    pwd = hash_password("Demo@1234")
    for email, full_name, department, title, role_slug, is_active, is_staff, is_super in USERS:
        res = await db.execute(select(User).where(User.email == email))
        u = res.scalar_one_or_none()
        role = roles.get(role_slug)
        if u:
            # Revive / refresh demo accounts without touching Daftra-linked users
            if u.daftra_id is None:
                u.full_name = full_name
                u.department = department
                u.title = title
                u.password_hash = pwd
                u.is_active = is_active
                u.is_staff = is_staff
                u.is_superuser = is_super
                if u.deleted_at is not None:
                    u.deleted_at = None
                if role:
                    has_role = await db.scalar(
                        select(UserRole.id).where(
                            UserRole.user_id == u.id,
                            UserRole.role_id == role.id,
                        )
                    )
                    if not has_role:
                        db.add(UserRole(user_id=u.id, role_id=role.id, is_primary=True))
            users[email] = u
            continue
        u = User(
            email=email, full_name=full_name, department=department, title=title,
            password_hash=pwd, is_active=is_active, is_staff=is_staff, is_superuser=is_super,
        )
        db.add(u); await db.flush()
        if role:
            db.add(UserRole(user_id=u.id, role_id=role.id, is_primary=True))
        users[email] = u
    return users


async def _seed_customer(db, users: dict[str, User]) -> Customer:
    u = users.get("customer@atelier.app")
    if not u: return None  # type: ignore
    res = await db.execute(select(Customer).where(Customer.user_id == u.id))
    c = res.scalar_one_or_none()
    if c: return c
    company = Company(name="Acme Corp", industry="Retail", website="https://acme.test")
    db.add(company); await db.flush()
    c = Customer(
        user_id=u.id, company_id=company.id,
        code="CUS-20260101-DEMO1A",
        full_name=u.full_name, email=u.email, phone=u.phone,
        city="New York", country="USA", tags="vip",
    )
    db.add(c); await db.flush()
    return c


async def _seed_warehouse(db) -> Warehouse:
    res = await db.execute(select(Warehouse).where(Warehouse.code == "WH-MAIN"))
    w = res.scalar_one_or_none()
    if w: return w
    w = Warehouse(name="Main Warehouse", code="WH-MAIN", address="HQ — 1st Floor", is_main=1)
    db.add(w); await db.flush()
    return w


async def _seed_catalog(db, depts: dict[str, Department]) -> dict[str, ProductCategory]:
    cat_map: dict[str, ProductCategory] = {}
    for name, slug, icon, sort, name_ar in CATEGORIES:
        res = await db.execute(select(ProductCategory).where(ProductCategory.slug == slug))
        c = res.scalar_one_or_none()
        if not c:
            c = ProductCategory(name=name, name_ar=name_ar, slug=slug, icon=icon, sort_order=sort)
            db.add(c)
            await db.flush()
        elif not c.name_ar:
            c.name_ar = name_ar
        cat_map[slug] = c

    for sku, name, cat_slug, unit, price, tax, desc, options, rules, pricing_model, dept_slugs, name_ar, desc_ar in PRODUCTS:
        res = await db.execute(select(Product).where(Product.sku == sku))
        p = res.scalar_one_or_none()
        dept_ids = [depts[s].id for s in dept_slugs if s in depts]
        if not p:
            p = Product(
                sku=sku, name=name, name_ar=name_ar, slug=sku.lower(),
                category_id=cat_map[cat_slug].id, unit=unit,
                base_price=price, tax_rate=tax,
                description=desc, description_ar=desc_ar, options=options,
                pricing_model=pricing_model,
            )
            db.add(p)
            await db.flush()
            for attr, val, mult, addend in rules:
                db.add(PricingRule(product_id=p.id, attribute=attr, value=val,
                                   multiplier=mult, addend=addend))
        else:
            if pricing_model and (not getattr(p, "pricing_model", None) or p.pricing_model == "variable"):
                p.pricing_model = pricing_model
            if not p.name_ar:
                p.name_ar = name_ar
            if not p.description_ar:
                p.description_ar = desc_ar
        await sync_product_departments(db, p.id, dept_ids)
    return cat_map


async def _seed_materials(db, warehouse: Warehouse):
    for sku, name, unit, on_hand, cost, reorder, category in MATERIALS:
        res = await db.execute(select(Material).where(Material.sku == sku))
        if res.scalar_one_or_none():
            continue
        m = Material(
            sku=sku, name=name, unit=unit, on_hand=on_hand, cost=cost,
            reorder_level=reorder, category=category, warehouse_id=warehouse.id,
        )
        db.add(m)


async def _seed_product_bom(db) -> None:
    for product_sku, material_sku, qty in PRODUCT_BOM:
        pres = await db.execute(select(Product.id).where(Product.sku == product_sku))
        product_id = pres.scalar_one_or_none()
        mres = await db.execute(select(Material.id).where(Material.sku == material_sku))
        material_id = mres.scalar_one_or_none()
        if not product_id or not material_id:
            continue
        exists = await db.execute(
            select(ProductMaterial.id).where(
                ProductMaterial.product_id == product_id,
                ProductMaterial.material_id == material_id,
            )
        )
        if exists.scalar_one_or_none():
            continue
        db.add(ProductMaterial(
            product_id=product_id,
            material_id=material_id,
            quantity_per_unit=qty,
        ))


async def _seed_sample_order(db, users: dict[str, User], customer: Customer, depts: dict[str, Department]):
    res = await db.execute(select(Order).limit(1))
    if res.scalar_one_or_none():
        return
    if not customer:
        return
    sales = users.get("sales@atelier.app")
    design_dept = depts.get("design")
    printing_dept = depts.get("printing")
    o = Order(
        code="ORD-DEMO-0001", customer_id=customer.id, company_id=customer.company_id,
        owner_id=sales.id if sales else None, department="Sales",
        status="confirmed", placed_via="staff", priority="high",
        title="Welcome bundle: business cards + flex banner",
        notes="Customer wants delivery on Friday.",
        deadline=date.today() + timedelta(days=5),
        currency="USD",
    )
    item1 = OrderItem(
        name="Flex Banner 3×2m", quantity=1, unit="pcs", unit_price=48.0,
        tax_rate=0, spec={"size": "3m", "material": "flex"}, line_total=48.0,
        workflow_status="design", current_department_id=design_dept.id if design_dept else None,
    )
    item1.status_history.append(OrderItemStatusHistory(
        department_id=design_dept.id if design_dept else None,
        from_status=None, to_status="pending",
        occurred_at=datetime.now(timezone.utc), notes="Item created",
    ))
    item1.status_history.append(OrderItemStatusHistory(
        department_id=design_dept.id if design_dept else None,
        from_status="pending", to_status="design",
        occurred_at=datetime.now(timezone.utc), notes="Design in progress",
    ))
    item2 = OrderItem(
        name="Premium Business Cards (500)", quantity=500, unit="pcs",
        unit_price=0.6, tax_rate=0, line_total=300.0,
        workflow_status="design", current_department_id=design_dept.id if design_dept else None,
    )
    item2.status_history.append(OrderItemStatusHistory(
        department_id=design_dept.id if design_dept else None,
        from_status=None, to_status="pending",
        occurred_at=datetime.now(timezone.utc), notes="Item created",
    ))
    item2.status_history.append(OrderItemStatusHistory(
        department_id=design_dept.id if design_dept else None,
        from_status="pending", to_status="design",
        occurred_at=datetime.now(timezone.utc), notes="Awaiting artwork",
    ))
    o.items.extend([item1, item2])
    o.subtotal = 348.0
    o.grand_total = 348.0
    o.events.append(OrderStatusEvent(
        to_status="draft", occurred_at=datetime.now(timezone.utc), notes="Created"))
    o.events.append(OrderStatusEvent(
        from_status="draft", to_status="confirmed",
        occurred_at=datetime.now(timezone.utc), notes="Confirmed by sales"))
    db.add(o)
    await db.flush()
    await _seed_order_workflow_assignments(db, o, users)


async def _seed_order_workflow_assignments(db, order: Order, users: dict[str, User], *, design_only: bool = False) -> None:
    res = await db.execute(
        select(OrderWorkflowAssignment).where(OrderWorkflowAssignment.order_id == order.id).limit(1)
    )
    if res.scalar_one_or_none():
        return

    ceo = users.get("ceo@atelier.app")
    if design_only:
        specs = [
            ("design", users.get("designer@atelier.app"), False),
            ("printing", None, True),
            ("production", None, True),
            ("finishing", None, True),
            ("delivery", None, True),
        ]
    else:
        specs = [
            ("design", users.get("designer@atelier.app"), False),
            ("printing", users.get("printop@atelier.app"), False),
            ("production", users.get("cnc@atelier.app"), False),
            ("finishing", users.get("finishing@atelier.app"), False),
            ("delivery", users.get("delivery@atelier.app"), False),
        ]
    for stage, assignee, skipped in specs:
        placeholder = ceo or assignee
        if not placeholder:
            continue
        db.add(OrderWorkflowAssignment(
            order_id=order.id,
            workflow_status=stage,
            assignee_id=assignee.id if assignee else placeholder.id,
            is_skipped=skipped,
            assigned_by_id=ceo.id if ceo else None,
        ))


async def _seed_logo_sample_order(db, users: dict[str, User], customer: Customer, depts: dict[str, Department]) -> None:
    res = await db.execute(select(Order).where(Order.code == "ORD-DEMO-LOGO"))
    if res.scalar_one_or_none():
        return
    if not customer:
        return
    sales = users.get("sales@atelier.app")
    design_dept = depts.get("design")
    o = Order(
        code="ORD-DEMO-LOGO", customer_id=customer.id, company_id=customer.company_id,
        owner_id=sales.id if sales else None, department="Sales",
        status="confirmed", placed_via="staff", priority="normal",
        title="Logo design — Acme rebrand",
        notes="Design-only project; no print or CNC.",
        deadline=date.today() + timedelta(days=10),
        currency="USD",
    )
    item = OrderItem(
        name="Logo Design", quantity=1, unit="pcs", unit_price=250.0,
        tax_rate=0, line_total=250.0,
        workflow_status="design", current_department_id=design_dept.id if design_dept else None,
    )
    item.status_history.append(OrderItemStatusHistory(
        department_id=design_dept.id if design_dept else None,
        from_status=None, to_status="pending",
        occurred_at=datetime.now(timezone.utc), notes="Item created",
    ))
    item.status_history.append(OrderItemStatusHistory(
        department_id=design_dept.id if design_dept else None,
        from_status="pending", to_status="design",
        occurred_at=datetime.now(timezone.utc), notes="Design in progress",
    ))
    o.items.append(item)
    o.subtotal = 250.0
    o.grand_total = 250.0
    o.events.append(OrderStatusEvent(
        to_status="draft", occurred_at=datetime.now(timezone.utc), notes="Created"))
    o.events.append(OrderStatusEvent(
        from_status="draft", to_status="confirmed",
        occurred_at=datetime.now(timezone.utc), notes="Confirmed"))
    db.add(o)
    await db.flush()
    await _seed_order_workflow_assignments(db, o, users, design_only=True)


async def _seed_existing_order_assignments(db, users: dict[str, User]) -> None:
    res = await db.execute(select(Order).where(Order.deleted_at.is_(None)))
    for order in res.scalars().all():
        await _seed_order_workflow_assignments(db, order, users)


async def _seed_sample_ticket(db, users: dict[str, User], customer: Customer):
    res = await db.execute(select(Ticket).limit(1))
    if res.scalar_one_or_none():
        return
    if not customer:
        return
    support = users.get("support@atelier.app")
    customer_user = users.get("customer@atelier.app")
    t = Ticket(
        code="TCK-DEMO-0001",
        customer_id=customer.id,
        opener_user_id=customer_user.id if customer_user else None,
        assignee_id=support.id if support else None,
        subject="Question about my order delivery",
        body="Hi, when will my welcome bundle be ready?",
        status="open",
        priority="normal",
        category="general",
    )
    t.messages.append(TicketMessage(
        author_user_id=customer_user.id if customer_user else None,
        author_kind="customer",
        body="Hi, when will my welcome bundle be ready?",
    ))
    db.add(t)


async def _seed_sample_conversation(db, users: dict[str, User]):
    res = await db.execute(select(Conversation).limit(1))
    if res.scalar_one_or_none():
        return
    ceo = users.get("ceo@atelier.app")
    sales = users.get("sales@atelier.app")
    if not ceo or not sales:
        return
    order_res = await db.execute(select(Order).where(Order.code == "ORD-DEMO-0001"))
    order = order_res.scalar_one_or_none()
    conv = Conversation(
        kind="group",
        title="Welcome bundle — production",
        order_id=order.id if order else None,
        created_by_id=ceo.id,
    )
    conv.members.extend([
        ConversationMember(user_id=ceo.id),
        ConversationMember(user_id=sales.id),
    ])
    conv.messages.append(ChatMessage(
        author_user_id=ceo.id,
        body="Let's align on the welcome bundle timeline before Friday.",
        order_id=order.id if order else None,
    ))
    conv.messages.append(ChatMessage(
        author_user_id=sales.id,
        body="Customer confirmed delivery for Friday — design is in progress.",
        order_id=order.id if order else None,
    ))
    db.add(conv)


async def _seed_brand_settings(db) -> None:
    """Ensure the singleton BrandSettings row (id=1) exists with defaults.

    Rows that still carry a known legacy/default palette are migrated in-place
    to the fixed monochrome values (invoice PDFs only — UI theme is CSS).
    Custom palettes are left untouched.
    """
    res = await db.execute(select(BrandSettings).where(BrandSettings.id == 1))
    row = res.scalar_one_or_none()
    if row is None:
        db.add(BrandSettings(id=1))
        return

    current = (
        row.brand_color,
        row.brand_color_dark,
        row.accent_color,
        row.accent_color_dark,
    )
    if current in _KNOWN_DEFAULT_PALETTES:
        row.brand_color = DEFAULT_BRAND_LIGHT
        row.brand_color_dark = DEFAULT_BRAND_DARK
        row.accent_color = DEFAULT_ACCENT_LIGHT
        row.accent_color_dark = DEFAULT_ACCENT_DARK


async def _migrate_schema_columns(conn) -> None:
    """Additive runtime migrations for live DBs (SQLite + PostgreSQL)."""
    report = await run_schema_migrations(
        conn,
        legacy_brand_light=LEGACY_BRAND_LIGHT,
        legacy_brand_dark=LEGACY_BRAND_DARK,
        legacy_accent_light=LEGACY_ACCENT_LIGHT,
        legacy_accent_dark=LEGACY_ACCENT_DARK,
    )
    # Attendance uniqueness (best-effort)
    try:
        await conn.execute(text(
            "DELETE FROM attendance_records WHERE id NOT IN ("
            "  SELECT MIN(id) FROM attendance_records GROUP BY employee_id, work_date"
            ")"
        ))
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_employee_date "
            "ON attendance_records (employee_id, work_date)"
        ))
    except Exception:
        pass
    # Payslip status backfill
    try:
        await conn.execute(text(
            "UPDATE payslips SET status = CASE WHEN paid = 1 THEN 'paid' ELSE 'draft' END "
            "WHERE status IS NULL OR status = ''"
        ))
    except Exception:
        pass
    if report.get("columns_added"):
        logger.info("Schema columns added: %s", ", ".join(report["columns_added"]))


async def _migrate_brand_settings_columns(conn) -> None:
    """Backward-compatible alias — palette columns live in _migrate_schema_columns."""
    await _migrate_schema_columns(conn)


async def _migrate_order_legacy_statuses(conn) -> None:
    try:
        await conn.execute(
            text("UPDATE orders SET status = 'in_production' WHERE status IN ('qa', 'ready')")
        )
    except Exception:
        pass


async def init_db() -> None:
    """Boot-time: create missing tables, migrate columns, seed essentials.

    Safe for production redeploys:
    - Never drops tables or wipes Daftra-synced rows
    - Additive column/index migrations only
    - Demo sample orders/HR skipped in production and when Daftra data exists
    """
    logger.info("DB init starting (env=%s, url=%s)", settings.APP_ENV, settings.DATABASE_URL.split("@")[-1])
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _migrate_brand_settings_columns(conn)
        # workflow rebuild is inside run_schema_migrations
        await _migrate_order_legacy_statuses(conn)

    is_prod = settings.APP_ENV.lower() in ("production", "prod")

    async with SessionLocal() as db:
        # System essentials only — never wipe or re-seed demo HR/users once
        # real Daftra data exists (daftra_id on users/customers).
        from sqlalchemy import func

        from app.models.customer import Customer
        from app.models.user import User

        has_daftra = bool(
            await db.scalar(
                select(func.count()).select_from(User).where(User.daftra_id.is_not(None))
            )
            or await db.scalar(
                select(func.count()).select_from(Customer).where(Customer.daftra_id.is_not(None))
            )
        )

        roles = await _seed_roles_and_permissions(db)
        await _seed_brand_settings(db)
        await _seed_sales_ops(db)

        # Always ensure RBAC demo logins + org structure exist (idempotent upserts).
        depts = await _seed_departments(db)
        users = await _seed_users(db, roles)
        await _link_user_departments(db, users, depts)
        await _seed_customer(db, users)
        warehouse = await _seed_warehouse(db)

        # Title → role + default staff login (email / yousef123) — safe on every boot
        from app.services.staff_role_mapping import backfill_staff_roles_and_login

        await backfill_staff_roles_and_login(db)

        if not has_daftra and not is_prod:
            # Local / first-time empty DB: optional demo scaffolding
            await _seed_catalog(db, depts)
            await _seed_materials(db, warehouse)
            await _seed_product_bom(db)
            customer = users and (await db.execute(
                select(Customer).where(Customer.email == "customer@atelier.app")
            )).scalar_one_or_none()
            if not customer:
                customer = await _seed_customer(db, users)
            if customer:
                await _seed_sample_order(db, users, customer, depts)
                await _seed_logo_sample_order(db, users, customer, depts)
                await _seed_sample_ticket(db, users, customer)
            await _seed_existing_order_assignments(db, users)
            await _seed_sample_conversation(db, users)
            await _seed_hr(db, users)
        elif not has_daftra and is_prod:
            # Production empty DB: catalog/materials only — no fake orders/HR payroll
            await _seed_catalog(db, depts)
            await _seed_materials(db, warehouse)
            await _seed_product_bom(db)
            logger.info("Production seed: roles/catalog only (awaiting Daftra sync)")
        else:
            logger.info("Existing Daftra-linked data detected — skipping demo sample seed")

        await db.commit()
    logger.info("DB init complete")


# Keep old multi-assignee helper name for any external callers / tests
async def _migrate_workflow_assignments_multi_assignee(conn) -> None:
    from app.db.migrate import migrate_workflow_assignments_multi_assignee
    await migrate_workflow_assignments_multi_assignee(conn)

async def _seed_sales_ops(db) -> None:
    from app.models.sales_ops import DocumentTemplate, SalesSettings

    existing = (await db.execute(select(SalesSettings).limit(1))).scalar_one_or_none()
    if not existing:
        db.add(SalesSettings(
            default_currency="IQD",
            default_tax_pct=0,
            default_due_days=14,
            invoice_prefix="INV",
            credit_note_prefix="CN",
            quotation_prefix="QT",
            payment_terms="Payment due within 14 days of invoice date.",
        ))

    tpl = (await db.execute(select(DocumentTemplate).limit(1))).scalar_one_or_none()
    if not tpl:
        db.add(DocumentTemplate(
            code="TPL-INV-EN",
            name="Standard Invoice",
            doc_type="invoice",
            header_html="Thank you for your business",
            footer_html="Dar Al-Yousef Printing",
            is_default=True,
            locale="en",
        ))
        db.add(DocumentTemplate(
            code="TPL-INV-AR",
            name="فاتورة قياسية",
            doc_type="invoice",
            header_html="شكراً لتعاملكم معنا",
            footer_html="مطبعة دار اليوسف",
            is_default=True,
            locale="ar",
        ))


async def _seed_hr(db, users: dict) -> None:
    """Rich HR demo data so every HR widget/capability is visible.

    Never run against a database that already has Daftra-synced staff —
    older versions wiped ALL EmployeeContract rows on every boot.
    """
    from sqlalchemy import delete, func

    from app.models.user import User

    synced = await db.scalar(
        select(func.count()).select_from(User).where(User.daftra_id.is_not(None))
    )
    if synced:
        return

    staff = [
        u for email, u in users.items()
        if getattr(u, "is_staff", False) and email != "customer@atelier.app"
    ]
    if not staff:
        return

    # Only clear demo rows for these seed users (never global wipe)
    staff_ids = [u.id for u in staff]
    await db.execute(delete(AttendanceRecord).where(AttendanceRecord.employee_id.in_(staff_ids)))
    await db.execute(delete(Payslip).where(Payslip.employee_id.in_(staff_ids)))
    await db.execute(delete(HrRequest).where(HrRequest.employee_id.in_(staff_ids)))
    await db.execute(delete(EmployeeContract).where(EmployeeContract.employee_id.in_(staff_ids)))
    await db.flush()

    today = date.today()
    titles = [
        "General Manager", "Senior Designer", "Print Operator", "CNC Operator",
        "Finishing Lead", "Delivery Lead", "Accountant", "Sales Executive",
        "Support Agent", "Warehouse Keeper", "Department Manager", "Technician",
    ]
    levels = ["Executive", "Senior", "Mid", "Junior", "Technician", "Lead"]
    templates = ["monthly", "weekly", "monthly", "monthly", "daily"]

    # Primary contracts — cover all statuses + several expiring soon
    status_plan = [
        "active", "active", "active", "active", "active",
        "expired", "under_review", "replacement", "cancelled", "suspended", "draft",
    ]
    for i, user in enumerate(staff):
        status = status_plan[i % len(status_plan)]
        start = today - timedelta(days=120 + i * 11)
        if status == "expired":
            end = today - timedelta(days=3 + (i % 5))
        elif status == "active" and i < 5:
            end = today + timedelta(days=5 + i * 6)  # expiring soon
        elif status == "draft":
            end = today + timedelta(days=365)
        else:
            end = today + timedelta(days=90 + i * 15)

        db.add(EmployeeContract(
            code=f"CTR-{user.id:06d}",
            employee_id=user.id,
            title=f"Employment · {titles[i % len(titles)]}",
            job_title=user.title or titles[i % len(titles)],
            job_level=levels[i % len(levels)],
            description="Standard full-time employment contract for printing & branding operations.",
            status=status if status != "active" or i >= 5 else "active",
            start_date=start,
            end_date=end,
            join_date=start - timedelta(days=60 + i * 3),
            signed_at=start + timedelta(days=2),
            probation_end=start + timedelta(days=90),
            salary=480_000 + i * 55_000,
            currency="IQD",
            salary_template=templates[i % len(templates)],
            is_primary=True,
            notes="Demo contract for HR showcase.",
        ))

    # Extra secondary contracts for first employees
    for i, user in enumerate(staff[:3]):
        db.add(EmployeeContract(
            code=f"CTR-SEC-{user.id:04d}",
            employee_id=user.id,
            title="Previous contract",
            job_title=user.title or "Staff",
            job_level="Mid",
            status="expired",
            start_date=today - timedelta(days=800),
            end_date=today - timedelta(days=400),
            join_date=today - timedelta(days=900),
            signed_at=today - timedelta(days=790),
            probation_end=today - timedelta(days=710),
            salary=350_000,
            currency="IQD",
            salary_template="monthly",
            is_primary=False,
        ))

    # Payslips — current + previous month for many staff
    for month_back in (0, 1, 2):
        period_end = today - timedelta(days=30 * month_back)
        period_start = period_end - timedelta(days=29)
        paid_at = datetime.now(timezone.utc) - timedelta(days=2 + month_back * 28)
        for i, user in enumerate(staff):
            gross = 700_000 + i * 45_000 + month_back * 10_000
            deductions = 95_000 + i * 8_000
            db.add(Payslip(
                employee_id=user.id,
                code=f"PAY-{period_end.strftime('%Y%m')}-{user.id:03d}",
                period_start=period_start,
                period_end=period_end,
                gross_pay=float(gross),
                deductions=float(deductions),
                net_pay=float(gross - deductions),
                currency="IQD",
                paid=month_back > 0 or i % 5 != 0,
                paid_at=paid_at if month_back > 0 or i % 5 != 0 else None,
                notes="Demo payslip",
            ))

    # HR requests — pending + history covering all types/statuses
    request_specs = [
        ("leave", "pending", "Annual leave request", 14, 16),
        ("leave", "pending", "Sick leave — 2 days", 2, 3),
        ("permission", "pending", "Permission to leave early", 0, 0),
        ("overtime", "pending", "Weekend overtime approval", 3, 3),
        ("document", "pending", "Request employment letter", None, None),
        ("other", "pending", "Update bank account details", None, None),
        ("leave", "approved", "Eid holiday leave", -20, -15),
        ("permission", "approved", "Doctor appointment", -10, -10),
        ("overtime", "rejected", "Night shift overtime", -8, -8),
        ("leave", "cancelled", "Cancelled travel leave", 20, 25),
        ("document", "pending", "Salary certificate for bank", None, None),
        ("leave", "pending", "Family emergency leave", 1, 2),
    ]
    for idx, (rtype, status, subject, start_off, end_off) in enumerate(request_specs):
        user = staff[idx % len(staff)]
        starts = today + timedelta(days=start_off) if start_off is not None else None
        ends = today + timedelta(days=end_off) if end_off is not None else None
        db.add(HrRequest(
            employee_id=user.id,
            request_type=rtype,
            status=status,
            subject=subject,
            body=f"Demo HR request: {subject}",
            starts_on=starts,
            ends_on=ends,
        ))

    # Attendance — last 45 calendar days, weekdays, varied statuses
    statuses_cycle = [
        "present", "present", "present", "present", "late",
        "present", "absent", "present", "on_leave", "present",
    ]
    for d_offset in range(45):
        day = today - timedelta(days=d_offset)
        if day.weekday() >= 5:
            continue
        for i, user in enumerate(staff):
            st = statuses_cycle[(d_offset + i) % len(statuses_cycle)]
            db.add(AttendanceRecord(
                employee_id=user.id,
                work_date=day,
                status=st,
                check_in="08:55" if st == "present" else ("09:25" if st == "late" else None),
                check_out="17:05" if st in ("present", "late") else None,
                notes="Demo attendance",
            ))

    await db.flush()
    count_c = await db.scalar(select(func.count()).select_from(EmployeeContract))
    count_r = await db.scalar(select(func.count()).select_from(HrRequest))
    count_p = await db.scalar(select(func.count()).select_from(Payslip))
    count_a = await db.scalar(select(func.count()).select_from(AttendanceRecord))
    print(f"[HR demo] contracts={count_c} requests={count_r} payslips={count_p} attendance={count_a}")


if __name__ == "__main__":
    asyncio.run(init_db())
    print("[OK] Database initialized and seeded.")
