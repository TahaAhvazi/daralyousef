"""In-app notification creation and delivery helpers."""
from __future__ import annotations

from typing import Any, Dict, Iterable, Optional, Sequence

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatMessage, Conversation
from app.models.notification import Notification
from app.models.order import Order
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.user import User
from app.services.workflow_assignment_service import EXEC_WORKFLOW_OVERRIDE_ROLE_SLUGS

STAGE_LABELS: Dict[str, str] = {
    "design": "Design",
    "printing": "Printing",
    "production": "Production",
    "finishing": "Finishing",
    "delivery": "Delivery",
}


async def create_notification(
    db: AsyncSession,
    *,
    user_id: int,
    type: str,
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link,
        payload=payload or {},
    )
    db.add(n)
    await db.flush()

    # Desktop / mobile browser push (Chrome on Windows etc.) — non-blocking.
    try:
        from app.services.push_service import schedule_push_after_commit

        schedule_push_after_commit(
            user_id=user_id,
            title=title,
            body=body,
            url=link or "/app/notifications",
            tag=f"{type}-{n.id}",
            notif_type=type,
            notification_id=n.id,
        )
    except Exception:
        pass

    return n


async def notify_users(
    db: AsyncSession,
    user_ids: Iterable[int],
    *,
    type: str,
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    exclude_user_id: Optional[int] = None,
) -> None:
    seen: set[int] = set()
    for uid in user_ids:
        if not uid or uid == exclude_user_id or uid in seen:
            continue
        seen.add(uid)
        await create_notification(
            db,
            user_id=uid,
            type=type,
            title=title,
            body=body,
            link=link,
            payload=payload,
        )


async def get_manager_user_ids(db: AsyncSession) -> set[int]:
    """CEO / executives / platform admins who should see operational alerts."""
    res = await db.execute(
        select(User.id)
        .outerjoin(UserRole, UserRole.user_id == User.id)
        .outerjoin(Role, Role.id == UserRole.role_id)
        .where(
            User.is_active.is_(True),
            User.deleted_at.is_(None),
            or_(
                User.is_superuser.is_(True),
                Role.slug.in_(tuple(EXEC_WORKFLOW_OVERRIDE_ROLE_SLUGS)),
            ),
        )
        .distinct()
    )
    ids = set(res.scalars().all())

    perm_res = await db.execute(
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(RolePermission, RolePermission.role_id == UserRole.role_id)
        .join(Permission, Permission.id == RolePermission.permission_id)
        .where(
            User.is_active.is_(True),
            User.deleted_at.is_(None),
            Permission.code.in_(("orders:admin", "*")),
        )
        .distinct()
    )
    ids.update(perm_res.scalars().all())
    return ids


async def notify_chat_message(
    db: AsyncSession,
    conv: Conversation,
    msg: ChatMessage,
    sender: User,
) -> None:
    preview = (msg.body or "").strip()
    if len(preview) > 120:
        preview = preview[:117] + "…"
    title = conv.title or "Team chat"
    member_ids = [m.user_id for m in conv.members if m.user_id != sender.id]
    payload: Dict[str, Any] = {
        "conversation_id": conv.id,
        "message_id": msg.id,
        "sender_name": sender.full_name,
        "preview": preview,
        "kind": conv.kind,
    }
    if conv.order_id:
        payload["order_id"] = conv.order_id

    await notify_users(
        db,
        member_ids,
        type="chat.message",
        title=title,
        body=f"{sender.full_name}: {preview}" if preview else sender.full_name,
        link=f"/app/messages?c={conv.id}",
        payload=payload,
        exclude_user_id=sender.id,
    )


async def notify_order_assignments(
    db: AsyncSession,
    order: Order,
    assignee_ids: Sequence[int],
    *,
    actor: User,
    stages: Sequence[str],
    is_update: bool = False,
) -> None:
    if not assignee_ids:
        return

    stage_labels = [STAGE_LABELS.get(s, s.replace("_", " ").title()) for s in stages]
    stages_text = ", ".join(stage_labels) if stage_labels else "production"
    payload: Dict[str, Any] = {
        "order_id": order.id,
        "order_code": order.code,
        "order_title": order.title,
        "stages": list(stages),
        "actor_name": actor.full_name,
        "is_update": is_update,
    }

    for uid in assignee_ids:
        if uid == actor.id:
            continue
        await create_notification(
            db,
            user_id=uid,
            type="order.assigned" if not is_update else "order.assignment_updated",
            title=order.code,
            body=f"You were assigned to {stages_text}",
            link=f"/app/orders/board",
            payload={**payload, "target": "assignee"},
        )

    managers = await get_manager_user_ids(db)
    managers -= {actor.id, *assignee_ids}
    if not managers:
        return

    mgr_type = "order.assignments_changed"
    mgr_body = (
        f"{actor.full_name} updated team for {order.code} ({stages_text})"
        if is_update
        else f"{actor.full_name} assigned team for {order.code} ({stages_text})"
    )
    mgr_payload = {**payload, "target": "manager", "is_update": is_update}
    await notify_users(
        db,
        managers,
        type=mgr_type,
        title=order.code,
        body=mgr_body,
        link=f"/app/orders/board",
        payload=mgr_payload,
        exclude_user_id=actor.id,
    )


async def notify_order_released(
    db: AsyncSession,
    order: Order,
    actor: User,
    assignee_ids: Sequence[int],
) -> None:
    payload = {
        "order_id": order.id,
        "order_code": order.code,
        "order_title": order.title,
        "actor_name": actor.full_name,
    }
    await notify_users(
        db,
        assignee_ids,
        type="order.released",
        title=order.code,
        body="Order released to production — you are on the team",
        link=f"/app/orders/board",
        payload=payload,
        exclude_user_id=actor.id,
    )

    managers = await get_manager_user_ids(db)
    managers -= {actor.id, *assignee_ids}
    await notify_users(
        db,
        managers,
        type="order.released",
        title=order.code,
        body=f"{actor.full_name} released {order.code} to production",
        link=f"/app/orders/board",
        payload={**payload, "target": "manager"},
        exclude_user_id=actor.id,
    )
