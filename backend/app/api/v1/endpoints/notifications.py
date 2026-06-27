"""In-app notifications + SSE stream."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db.base import SessionLocal, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import OkResponse, PaginatedResponse
from app.schemas.notification import NotificationOut


router = APIRouter()


async def _unread_count(db: AsyncSession, user_id: int) -> int:
    return int(
        await db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        )
        or 0
    )


@router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db), user: User = Depends(current_user)):
    return {"count": await _unread_count(db, user.id)}


@router.get("", response_model=PaginatedResponse[NotificationOut])
async def list_notifications(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db), user: User = Depends(current_user),
):
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only: stmt = stmt.where(Notification.read_at.is_(None))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await db.execute(
        stmt.order_by(Notification.id.desc()).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return PaginatedResponse[NotificationOut](
        items=[NotificationOut.model_validate(r) for r in rows],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/{nid}/read", response_model=OkResponse)
async def mark_read(nid: int, db: AsyncSession = Depends(get_db),
                    user: User = Depends(current_user)):
    n = await db.get(Notification, nid)
    if not n or n.user_id != user.id:
        return OkResponse(ok=False)
    n.read_at = datetime.now(timezone.utc)
    await db.commit()
    return OkResponse()


@router.post("/read-all", response_model=OkResponse)
async def mark_all_read(db: AsyncSession = Depends(get_db),
                        user: User = Depends(current_user)):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return OkResponse()


@router.get("/stream")
async def stream(user: User = Depends(current_user)):
    """Server-Sent Events stream of unread-count + recent notifications."""

    async def event_source() -> AsyncGenerator[bytes, None]:
        async with SessionLocal() as db:
            last_id = int(
                await db.scalar(
                    select(func.max(Notification.id)).where(Notification.user_id == user.id)
                )
                or 0
            )
            count = await _unread_count(db, user.id)

        yield (
            f"data: {json.dumps({'type': 'snapshot', 'unread_count': count})}\n\n"
        ).encode()

        while True:
            async with SessionLocal() as db:
                res = await db.execute(
                    select(Notification)
                    .where(Notification.user_id == user.id, Notification.id > last_id)
                    .order_by(Notification.id.asc())
                    .limit(20)
                )
                rows = res.scalars().all()
                if rows:
                    for n in rows:
                        last_id = max(last_id, n.id)
                    count = await _unread_count(db, user.id)
                    payload = {
                        "type": "notifications",
                        "unread_count": count,
                        "data": [
                            NotificationOut.model_validate(n).model_dump(mode="json")
                            for n in rows
                        ],
                    }
                    yield f"data: {json.dumps(payload, default=str)}\n\n".encode()
                else:
                    yield b": keep-alive\n\n"
            await asyncio.sleep(1.5)

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
