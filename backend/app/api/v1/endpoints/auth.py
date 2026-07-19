"""Authentication endpoints."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import current_user
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError
from app.core.security import (
    create_access_token, create_refresh_token, hash_password,
    safe_decode_token, verify_password,
)
from app.db.base import get_db
from app.models.customer import Customer, Company
from app.models.rbac import Role, RolePermission, UserPermission, UserRole, Permission
from app.models.user import RefreshToken, User
from app.schemas.auth import (
    ChangePasswordInput, ForgotPasswordInput, LoginInput, RefreshInput,
    RegisterInput, ResetPasswordInput, RoleOut, TokenResponse,
    UpdateProfileInput, UserOut,
)
from app.services.audit import record as audit
from app.utils.codes import customer_code


router = APIRouter()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def _serialize_user(db: AsyncSession, user: User) -> UserOut:
    # roles
    res = await db.execute(
        select(Role).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user.id)
    )
    roles = [RoleOut.model_validate(r) for r in res.scalars().all()]
    # permissions (role + user-level grants minus denies)
    role_ids = [r.id for r in roles]
    perms: set[str] = set()
    if role_ids:
        res = await db.execute(
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id.in_(role_ids))
        )
        perms.update(res.scalars().all())
    res = await db.execute(
        select(Permission.code, UserPermission.grant)
        .join(UserPermission, UserPermission.permission_id == Permission.id)
        .where(UserPermission.user_id == user.id)
    )
    for code, grant in res.all():
        if grant: perms.add(code)
        else: perms.discard(code)
    if user.is_superuser:
        perms.add("*")

    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name, phone=user.phone,
        avatar_url=user.avatar_url, department=user.department, title=user.title,
        is_active=user.is_active, is_staff=user.is_staff, is_superuser=user.is_superuser,
        theme=user.theme, locale=user.locale, last_login_at=user.last_login_at,
        roles=roles, permissions=sorted(perms),
    )


async def _issue_tokens(db: AsyncSession, user: User, request: Request) -> TokenResponse:
    extra = {"email": user.email, "name": user.full_name}
    access = create_access_token(str(user.id), extra)
    refresh = create_refresh_token(str(user.id), extra)
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    ))
    return TokenResponse(
        access_token=access, refresh_token=refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginInput, request: Request, db: AsyncSession = Depends(get_db)):
    from app.services.portal_access import find_user_by_login

    user = await find_user_by_login(db, data.email)
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        raise UnauthorizedError("Invalid email/phone or password")
    user.last_login_at = datetime.now(timezone.utc)
    user.last_seen_at = user.last_login_at
    user.last_login_ip = request.client.host if request.client else None
    tokens = await _issue_tokens(db, user, request)
    await audit(db, action="login", module="auth", user=user, request=request)
    await db.commit()
    return tokens


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterInput, request: Request, db: AsyncSession = Depends(get_db)):
    email = data.email.lower()
    res = await db.execute(select(User).where(User.email == email))
    if res.scalar_one_or_none():
        raise ConflictError("Email is already registered")

    user = User(
        email=email, full_name=data.full_name, phone=data.phone,
        password_hash=hash_password(data.password),
        is_active=True, is_staff=False, is_superuser=False,
    )
    db.add(user)
    await db.flush()

    # Attach Customer role
    res = await db.execute(select(Role).where(Role.slug == "customer"))
    role = res.scalar_one_or_none()
    if role:
        db.add(UserRole(user_id=user.id, role_id=role.id, is_primary=True))

    # Optional company
    company_id = None
    if data.company_name:
        company = Company(name=data.company_name)
        db.add(company); await db.flush()
        company_id = company.id

    customer = Customer(
        user_id=user.id, company_id=company_id,
        code=customer_code(), full_name=user.full_name,
        email=user.email, phone=user.phone,
    )
    db.add(customer)
    await db.flush()

    tokens = await _issue_tokens(db, user, request)
    await audit(db, action="register", module="auth", user=user, entity_type="user", entity_id=user.id, request=request)
    await db.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshInput, request: Request, db: AsyncSession = Depends(get_db)):
    payload = safe_decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token")

    token_hash = _hash_token(data.refresh_token)
    res = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    rt = res.scalar_one_or_none()
    if not rt or rt.revoked or rt.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Refresh token revoked or expired")

    # rotate: revoke current, issue new
    rt.revoked = True
    res = await db.execute(select(User).where(User.id == rt.user_id))
    user = res.scalar_one()
    tokens = await _issue_tokens(db, user, request)
    await db.commit()
    return tokens


@router.post("/logout")
async def logout(data: RefreshInput, db: AsyncSession = Depends(get_db),
                 user: User = Depends(current_user)):
    res = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == _hash_token(data.refresh_token))
    )
    rt = res.scalar_one_or_none()
    if rt and rt.user_id == user.id:
        rt.revoked = True
        await db.commit()
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordInput, db: AsyncSession = Depends(get_db)):
    # Mock-only: issue a JWT reset token (10-min). In prod, email it.
    res = await db.execute(select(User).where(User.email == data.email.lower()))
    user = res.scalar_one_or_none()
    if not user:
        return {"ok": True, "message": "If the account exists, instructions are sent."}
    token = secrets.token_urlsafe(32)
    user.password_hash = user.password_hash  # touch
    # Store reset token in OutboxEmail for visibility in dev.
    from app.models.audit import OutboxEmail
    db.add(OutboxEmail(
        to_email=user.email,
        subject="Reset your Atelier ERP password",
        body=f"Use this reset code (valid 10 min): {token}",
    ))
    # For dev: also return the token directly.
    user.password_hash = user.password_hash  # no-op
    user.last_login_ip = user.last_login_ip
    await db.commit()
    # Encode a JWT subject for reset
    from jose import jwt
    payload = {"sub": str(user.id), "type": "reset",
               "exp": int((datetime.now(timezone.utc) + timedelta(minutes=10)).timestamp())}
    reset_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"ok": True, "dev_reset_token": reset_jwt}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordInput, db: AsyncSession = Depends(get_db)):
    payload = safe_decode_token(data.token)
    if not payload or payload.get("type") != "reset":
        raise ValidationError("Invalid or expired reset token")
    res = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = res.scalar_one_or_none()
    if not user:
        raise ValidationError("User not found")
    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    return await _serialize_user(db, user)


@router.patch("/me", response_model=UserOut)
async def update_me(data: UpdateProfileInput, db: AsyncSession = Depends(get_db),
                    user: User = Depends(current_user)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    return await _serialize_user(db, user)


_AVATAR_ALLOWED = {"png", "jpg", "jpeg", "webp"}
_AVATAR_DIR = settings.UPLOAD_DIR / "avatars"
_AVATAR_MAX_BYTES = 3 * 1024 * 1024  # 3 MB


def _unlink_user_avatars(user_id: int) -> None:
    folder = _AVATAR_DIR
    if not folder.exists():
        return
    for old in folder.glob(f"user_{user_id}.*"):
        try:
            old.unlink()
        except OSError:
            pass


@router.post("/me/avatar", response_model=UserOut)
async def upload_my_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """Any authenticated user (any role) can set their profile photo."""
    from pathlib import Path

    ext = (Path(file.filename or "").suffix.lstrip(".") or "").lower()
    if ext == "jpeg":
        ext = "jpg"
    if ext not in _AVATAR_ALLOWED:
        raise ValidationError(
            f"Unsupported image type .{ext or '?'} (allowed: png, jpg, webp)"
        )

    content = await file.read()
    if not content:
        raise ValidationError("Empty file uploaded")
    if len(content) > _AVATAR_MAX_BYTES:
        raise ValidationError("Avatar must be 3 MB or smaller")

    _AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    _unlink_user_avatars(user.id)

    dest = _AVATAR_DIR / f"user_{user.id}.{ext}"
    dest.write_bytes(content)
    user.avatar_url = f"/uploads/avatars/user_{user.id}.{ext}?v={int(dest.stat().st_mtime)}"

    await audit(
        db, action="upload", module="auth", user=user,
        entity_type="user_avatar", entity_id=user.id,
        new={"avatar_url": user.avatar_url, "size": len(content)},
        request=request,
    )
    await db.commit()
    return await _serialize_user(db, user)


@router.delete("/me/avatar", response_model=UserOut)
async def remove_my_avatar(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    _unlink_user_avatars(user.id)
    user.avatar_url = None
    await audit(
        db, action="delete", module="auth", user=user,
        entity_type="user_avatar", entity_id=user.id, request=request,
    )
    await db.commit()
    return await _serialize_user(db, user)


@router.get("/users/{uid}/profile", response_model=UserOut)
async def public_profile(
    uid: int,
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(current_user),
):
    """Lightweight profile card — photo, name, role — for any logged-in user."""
    target = await db.get(User, uid)
    if not target or target.deleted_at is not None or not target.is_active:
        raise NotFoundError("User not found")
    # Staff can see staff; customers may only see their own profile here.
    if not (viewer.is_staff or viewer.is_superuser):
        if viewer.id != target.id:
            raise ForbiddenError("Not allowed")
    return await _serialize_user(db, target)


@router.post("/change-password")
async def change_password(data: ChangePasswordInput, db: AsyncSession = Depends(get_db),
                          user: User = Depends(current_user)):
    if not verify_password(data.current_password, user.password_hash):
        raise UnauthorizedError("Current password incorrect")
    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"ok": True}
