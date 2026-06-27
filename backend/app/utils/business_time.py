"""Business-local date/time helpers (invoice issue dates, etc.)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from functools import lru_cache
from zoneinfo import ZoneInfo

from app.core.config import settings

# Fallback when tzdata is unavailable (common on Windows without tzdata package).
_GULF_FALLBACK = timezone(timedelta(hours=4), name="Asia/Dubai")


@lru_cache
def business_tz() -> timezone:
    try:
        return ZoneInfo(settings.BUSINESS_TIMEZONE)
    except Exception:
        return _GULF_FALLBACK


def business_now() -> datetime:
    """Timezone-aware 'now' in the configured business timezone."""
    return datetime.now(timezone.utc).astimezone(business_tz())


def business_today():
    return business_now().date()
