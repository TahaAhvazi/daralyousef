"""Atelier ERP — FastAPI entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import ensure_upload_dir, settings
from app.core.exceptions import install_exception_handlers
from app.core.logging import setup_logging
from app.db.base import SessionLocal, engine
from app.db.init_db import init_db


setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates missing tables + additive column migrations on every boot
    # (safe for live redeploy of a DB that pre-dates Daftra sync).
    await init_db()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs", redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
install_exception_handlers(app)


# Last-seen middleware: refresh `User.last_seen_at` on each authenticated call.
@app.middleware("http")
async def touch_last_seen(request: Request, call_next):
    response = await call_next(request)
    user = getattr(request.state, "user", None)
    if user is not None:
        try:
            async with SessionLocal() as db:
                u = await db.get(type(user), user.id)
                if u is not None:
                    u.last_seen_at = datetime.now(timezone.utc)
                    await db.commit()
        except Exception:
            pass
    return response


# Static uploads (/tmp on Vercel)
try:
    ensure_upload_dir(settings.UPLOAD_DIR)
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
except OSError:
    pass


# Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["root"])
async def root():
    return {
        "name": settings.APP_NAME, "version": settings.APP_VERSION,
        "docs": "/docs", "api": settings.API_V1_PREFIX,
    }


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["root"])
async def health():
    db_ok = False
    try:
        async with SessionLocal() as db:
            await db.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    daftra_configured = bool(
        (settings.DAFTRA_API_KEY or "").strip()
        or ((settings.DAFTRA_CLIENT_ID or "").strip() and (settings.DAFTRA_CLIENT_SECRET or "").strip())
    )
    return {
        "status": "ok" if db_ok else "degraded",
        "time": datetime.now(timezone.utc).isoformat(),
        "database": "ok" if db_ok else "error",
        "daftra_enabled": bool(settings.DAFTRA_ENABLED),
        "daftra_configured": daftra_configured,
        "env": settings.APP_ENV,
    }
