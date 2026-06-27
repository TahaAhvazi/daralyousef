"""Atelier ERP — FastAPI entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import install_exception_handlers
from app.core.logging import setup_logging
from app.db.base import SessionLocal, engine
from app.db.init_db import init_db


setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
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


# Static uploads
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")


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
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
