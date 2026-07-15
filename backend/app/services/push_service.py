"""Web Push (VAPID) delivery for Chrome / Edge / Firefox on Windows & mobile."""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)

_VAPID_CACHE_FILE = Path(__file__).resolve().parent.parent.parent / ".vapid.json"
_cached_keys: Optional[tuple[str, str]] = None


def _b64url_no_pad(raw: bytes) -> str:
    import base64

    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _generate_vapid_pair() -> tuple[str, str]:
    """Return (public_key_urlsafe, private_key_urlsafe) for Web Push."""
    from cryptography.hazmat.primitives.asymmetric import ec

    private_key = ec.generate_private_key(ec.SECP256R1())
    priv_bytes = private_key.private_numbers().private_value.to_bytes(32, "big")
    pub = private_key.public_key().public_numbers()
    x = pub.x.to_bytes(32, "big")
    y = pub.y.to_bytes(32, "big")
    pub_bytes = b"\x04" + x + y
    return _b64url_no_pad(pub_bytes), _b64url_no_pad(priv_bytes)


def get_vapid_keys() -> Optional[tuple[str, str]]:
    """
    Resolve VAPID key pair (public, private).
    Prefers env settings; otherwise loads/creates backend/.vapid.json for local use.
    """
    global _cached_keys
    if _cached_keys:
        return _cached_keys

    pub = (settings.VAPID_PUBLIC_KEY or "").strip()
    priv = (settings.VAPID_PRIVATE_KEY or "").strip()
    if pub and priv:
        _cached_keys = (pub, priv)
        return _cached_keys

    if _VAPID_CACHE_FILE.exists():
        try:
            data = json.loads(_VAPID_CACHE_FILE.read_text(encoding="utf-8"))
            pub2 = (data.get("public_key") or "").strip()
            priv2 = (data.get("private_key") or "").strip()
            if pub2 and priv2:
                _cached_keys = (pub2, priv2)
                return _cached_keys
        except Exception:
            logger.exception("Failed to read %s", _VAPID_CACHE_FILE)

    try:
        pub3, priv3 = _generate_vapid_pair()
        _VAPID_CACHE_FILE.write_text(
            json.dumps({"public_key": pub3, "private_key": priv3}, indent=2),
            encoding="utf-8",
        )
        logger.warning(
            "Generated VAPID keys at %s — set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in production",
            _VAPID_CACHE_FILE,
        )
        _cached_keys = (pub3, priv3)
        return _cached_keys
    except Exception:
        logger.exception("Could not generate VAPID keys")
        return None


def vapid_configured() -> bool:
    return get_vapid_keys() is not None


async def upsert_subscription(
    db: AsyncSession,
    *,
    user_id: int,
    endpoint: str,
    p256dh: str,
    auth: str,
    user_agent: Optional[str] = None,
) -> PushSubscription:
    res = await db.execute(select(PushSubscription).where(PushSubscription.endpoint == endpoint))
    row = res.scalar_one_or_none()
    if row:
        row.user_id = user_id
        row.p256dh = p256dh
        row.auth = auth
        if user_agent is not None:
            row.user_agent = user_agent
        await db.flush()
        return row

    row = PushSubscription(
        user_id=user_id,
        endpoint=endpoint,
        p256dh=p256dh,
        auth=auth,
        user_agent=user_agent,
    )
    db.add(row)
    await db.flush()
    return row


async def remove_subscription(db: AsyncSession, *, user_id: int, endpoint: str) -> bool:
    res = await db.execute(
        delete(PushSubscription).where(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == endpoint,
        )
    )
    return (res.rowcount or 0) > 0


async def remove_all_for_user(db: AsyncSession, user_id: int) -> int:
    res = await db.execute(delete(PushSubscription).where(PushSubscription.user_id == user_id))
    return int(res.rowcount or 0)


async def subscription_count(db: AsyncSession, user_id: int) -> int:
    return int(
        await db.scalar(
            select(func.count())
            .select_from(PushSubscription)
            .where(PushSubscription.user_id == user_id)
        )
        or 0
    )


def _send_one_sync(sub: Dict[str, Any], payload: Dict[str, Any], private_key: str) -> Optional[str]:
    """Send one push. Returns endpoint if it should be deleted (gone), else None."""
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.error("pywebpush is not installed")
        return None

    try:
        webpush(
            subscription_info={
                "endpoint": sub["endpoint"],
                "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
            },
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=private_key,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
            ttl=60 * 60 * 12,
            timeout=10,
        )
        return None
    except Exception as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        if status in (404, 410):
            return sub["endpoint"]
        # Import-local WebPushException check
        try:
            from pywebpush import WebPushException

            if isinstance(exc, WebPushException):
                code = getattr(exc.response, "status_code", None) if exc.response else None
                if code in (404, 410):
                    return sub["endpoint"]
                logger.warning("Web push failed (%s): %s", code, exc)
                return None
        except Exception:
            pass
        logger.warning("Web push failed: %s", exc)
        return None


async def send_push_to_user(
    db: AsyncSession,
    user_id: int,
    *,
    title: str,
    body: Optional[str] = None,
    url: Optional[str] = None,
    tag: Optional[str] = None,
    notif_type: Optional[str] = None,
    notification_id: Optional[int] = None,
) -> None:
    keys = get_vapid_keys()
    if not keys:
        return
    _, private_key = keys

    res = await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))
    rows = list(res.scalars().all())
    if not rows:
        return

    payload = {
        "title": title,
        "body": body or "",
        "url": url or "/app/notifications",
        "tag": tag or (f"notif-{notification_id}" if notification_id else "atelier"),
        "type": notif_type or "generic",
        "notification_id": notification_id,
    }

    subs = [
        {"endpoint": r.endpoint, "p256dh": r.p256dh, "auth": r.auth}
        for r in rows
    ]

    # Run sync webpush off the event loop
    dead: list[str] = []
    loop = asyncio.get_running_loop()
    results = await asyncio.gather(
        *[
            loop.run_in_executor(None, _send_one_sync, sub, payload, private_key)
            for sub in subs
        ]
    )
    for endpoint in results:
        if endpoint:
            dead.append(endpoint)

    if dead:
        await db.execute(delete(PushSubscription).where(PushSubscription.endpoint.in_(dead)))
        await db.flush()


def schedule_push_after_commit(
    *,
    user_id: int,
    title: str,
    body: Optional[str],
    url: Optional[str],
    tag: Optional[str],
    notif_type: Optional[str],
    notification_id: Optional[int],
) -> None:
    """
    Fire-and-forget push using a fresh DB session so chat/order handlers
    are not blocked if the push provider is slow.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return

    async def _run() -> None:
        from app.db.base import SessionLocal

        try:
            async with SessionLocal() as db:
                await send_push_to_user(
                    db,
                    user_id,
                    title=title,
                    body=body,
                    url=url,
                    tag=tag,
                    notif_type=notif_type,
                    notification_id=notification_id,
                )
                await db.commit()
        except Exception:
            logger.exception("Background web push failed for user %s", user_id)

    loop.create_task(_run())
