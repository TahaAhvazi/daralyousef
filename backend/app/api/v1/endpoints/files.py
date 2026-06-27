"""File uploads + attachments."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.core.exceptions import NotFoundError
from app.db.base import get_db
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentOut
from app.services.audit import record as audit
from app.utils.files import save_upload


router = APIRouter()


@router.post("", response_model=AttachmentOut, status_code=201)
async def upload(
    request: Request,
    entity_type: str = Form(...), entity_id: int = Form(...),
    caption: Optional[str] = Form(None), kind: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    path, url, size, mime = await save_upload(file)
    att = Attachment(
        entity_type=entity_type, entity_id=entity_id,
        filename=path.name, original_name=file.filename or path.name,
        mime_type=mime, size_bytes=size, storage_path=str(path), url=url,
        uploader_id=user.id, caption=caption, kind=kind,
    )
    db.add(att); await db.flush()
    await audit(db, action="upload", module="files", user=user,
                entity_type=entity_type, entity_id=entity_id,
                new={"file": file.filename, "size": size}, request=request)
    await db.commit()
    return AttachmentOut.model_validate(att)


@router.get("", response_model=list[AttachmentOut])
async def list_attachments(
    entity_type: str = Query(...), entity_id: int = Query(...),
    db: AsyncSession = Depends(get_db), _: User = Depends(current_user),
):
    res = await db.execute(
        select(Attachment).where(
            Attachment.entity_type == entity_type,
            Attachment.entity_id == entity_id,
        ).order_by(Attachment.id.desc())
    )
    return [AttachmentOut.model_validate(r) for r in res.scalars().all()]


@router.delete("/{aid}")
async def delete_attachment(aid: int, request: Request,
                            db: AsyncSession = Depends(get_db),
                            user: User = Depends(current_user)):
    att = await db.get(Attachment, aid)
    if not att: raise NotFoundError("Attachment not found")
    await db.delete(att)
    await audit(db, action="delete", module="files", user=user,
                entity_type=att.entity_type, entity_id=att.entity_id, request=request)
    await db.commit()
    return {"ok": True}
