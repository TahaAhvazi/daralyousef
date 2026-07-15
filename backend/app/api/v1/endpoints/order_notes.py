"""Order project notes endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.common import OkResponse
from app.schemas.order_note import OrderNoteCreate, OrderNoteOut, OrderNoteUpdate
from app.services import order_note_service as notes_svc
from app.services.audit import record as audit

router = APIRouter()


@router.get("/{oid}/notes", response_model=list[OrderNoteOut])
async def list_order_notes(
    oid: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    return await notes_svc.list_notes(db, user, oid)


@router.post("/{oid}/notes", response_model=OrderNoteOut, status_code=201)
async def create_order_note(
    oid: int,
    data: OrderNoteCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    note = await notes_svc.create_note(db, user, oid, data)
    await audit(
        db, action="create", module="orders", user=user, entity_type="order_note",
        entity_id=note.id, new={"order_id": oid}, request=request,
    )
    await db.commit()
    return note


@router.patch("/{oid}/notes/{nid}", response_model=OrderNoteOut)
async def update_order_note(
    oid: int,
    nid: int,
    data: OrderNoteUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    note = await notes_svc.update_note(db, user, oid, nid, data)
    await audit(
        db, action="update", module="orders", user=user, entity_type="order_note",
        entity_id=nid, request=request,
    )
    await db.commit()
    return note


@router.delete("/{oid}/notes/{nid}", response_model=OkResponse)
async def delete_order_note(
    oid: int,
    nid: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    await notes_svc.delete_note(db, user, oid, nid)
    await audit(
        db, action="delete", module="orders", user=user, entity_type="order_note",
        entity_id=nid, request=request,
    )
    await db.commit()
    return OkResponse()
