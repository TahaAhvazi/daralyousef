"""User & role management (admin)."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import current_active_staff, require_permissions
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.db.base import get_db
from app.models.department import Department
from app.models.rbac import Role, UserRole
from app.models.user import User
from app.schemas.auth import RoleOut, UserOut
from app.schemas.common import OkResponse, PaginatedResponse
from app.services.audit import record as audit


router = APIRouter()


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    title: Optional[str] = None
    is_staff: bool = True
    is_superuser: bool = False
    role_slugs: List[str] = []


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    title: Optional[str] = None
    is_active: Optional[bool] = None
    is_staff: Optional[bool] = None
    is_superuser: Optional[bool] = None
    role_slugs: Optional[List[str]] = None
    password: Optional[str] = None


async def _resolve_department_label(
    db: AsyncSession,
    *,
    department_id: Optional[int],
    department: Optional[str],
) -> tuple[Optional[int], Optional[str]]:
    if department_id is not None:
        res = await db.execute(
            select(Department).where(Department.id == department_id)
        )
        dept = res.scalar_one_or_none()
        if dept:
            return dept.id, dept.name
        return None, department
    return None, department


async def _user_out(db: AsyncSession, u: User) -> UserOut:
    res = await db.execute(
        select(Role).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == u.id)
    )
    roles = [RoleOut.model_validate(r) for r in res.scalars().all()]
    dept_name = u.department
    if u.department_id:
        dres = await db.execute(select(Department.name).where(Department.id == u.department_id))
        name = dres.scalar_one_or_none()
        if name:
            dept_name = name
    return UserOut(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        phone=u.phone,
        avatar_url=u.avatar_url,
        department=dept_name,
        department_id=u.department_id,
        title=u.title,
        is_active=u.is_active,
        is_staff=u.is_staff,
        is_superuser=u.is_superuser,
        theme=u.theme,
        locale=u.locale,
        last_login_at=u.last_login_at,
        daftra_id=u.daftra_id,
        roles=roles,
        permissions=[],
    )


@router.get("", response_model=PaginatedResponse[UserOut])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    q: Optional[str] = None,
    is_staff: Optional[bool] = Query(None),
    department_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("users:read")),
):
    stmt = select(User).where(User.deleted_at.is_(None))
    if is_staff is not None:
        stmt = stmt.where(User.is_staff.is_(is_staff))
    if department_id is not None:
        stmt = stmt.where(User.department_id == department_id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(
            User.email.ilike(like),
            User.full_name.ilike(like),
            User.phone.ilike(like),
            User.title.ilike(like),
            User.department.ilike(like),
        ))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.options(selectinload(User.dept))
        .order_by(User.full_name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).scalars().all()

    items = [await _user_out(db, u) for u in rows]
    return PaginatedResponse[UserOut](items=items, total=total or 0, page=page, page_size=page_size)


@router.post("", response_model=UserOut, status_code=201)
async def create_user(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permissions("users:create")),
):
    res = await db.execute(select(User).where(User.email == data.email.lower()))
    if res.scalar_one_or_none():
        raise ConflictError("Email already exists")

    dept_id, dept_label = await _resolve_department_label(
        db, department_id=data.department_id, department=data.department,
    )
    u = User(
        email=data.email.lower(),
        full_name=data.full_name,
        phone=data.phone,
        department=dept_label or data.department,
        department_id=dept_id,
        title=data.title,
        is_staff=data.is_staff,
        is_superuser=data.is_superuser,
        password_hash=hash_password(data.password),
    )
    db.add(u)
    await db.flush()

    if data.role_slugs:
        res = await db.execute(select(Role).where(Role.slug.in_(data.role_slugs)))
        for r in res.scalars().all():
            db.add(UserRole(user_id=u.id, role_id=r.id))

    await audit(
        db, action="create", module="users", user=actor, entity_type="user",
        entity_id=u.id, new={"email": u.email, "full_name": u.full_name}, request=request,
    )
    await db.commit()
    await db.refresh(u)
    return await _user_out(db, u)


@router.patch("/{user_id}", response_model=OkResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permissions("users:update")),
):
    res = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    u = res.scalar_one_or_none()
    if not u:
        raise NotFoundError("User not found")

    payload = data.model_dump(exclude_unset=True)
    role_slugs = payload.pop("role_slugs", None)
    password = payload.pop("password", None)
    if "department_id" in payload:
        dept_id, dept_label = await _resolve_department_label(
            db,
            department_id=payload.pop("department_id"),
            department=payload.get("department", u.department),
        )
        u.department_id = dept_id
        if dept_label:
            u.department = dept_label
        elif "department" in payload:
            u.department = payload.pop("department")
    for k, v in payload.items():
        setattr(u, k, v)
    if password:
        u.password_hash = hash_password(password)
    if role_slugs is not None:
        await db.execute(delete(UserRole).where(UserRole.user_id == u.id))
        res = await db.execute(select(Role).where(Role.slug.in_(role_slugs)))
        for r in res.scalars().all():
            db.add(UserRole(user_id=u.id, role_id=r.id))

    await audit(
        db, action="update", module="users", user=actor, entity_type="user",
        entity_id=u.id, new=payload, request=request,
    )
    await db.commit()
    return OkResponse()


@router.delete("/{user_id}", response_model=OkResponse)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_permissions("users:delete")),
):
    from datetime import datetime, timezone

    res = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    u = res.scalar_one_or_none()
    if not u:
        raise NotFoundError("User not found")
    u.deleted_at = datetime.now(timezone.utc)
    u.is_active = False
    await audit(
        db, action="delete", module="users", user=actor, entity_type="user",
        entity_id=u.id, request=request,
    )
    await db.commit()
    return OkResponse()


@router.get("/roles/all", response_model=List[RoleOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(current_active_staff),
):
    rows = (await db.execute(select(Role).order_by(Role.id))).scalars().all()
    return [RoleOut.model_validate(r) for r in rows]
