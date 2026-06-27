"""Application configuration (Pydantic Settings)."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent

VERCEL_TMP_DB = "sqlite+aiosqlite:////tmp/atelier.db"
VERCEL_TMP_UPLOADS = Path("/tmp/uploads")


def _is_vercel() -> bool:
    return bool(os.getenv("VERCEL"))


def _default_database_url() -> str:
    return f"sqlite+aiosqlite:///{(BASE_DIR / 'atelier.db').as_posix()}"


def _default_upload_dir() -> Path:
    return BASE_DIR / "uploads"


def _default_cors_origins() -> List[str]:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ]
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        origins.append(f"https://{vercel_url}")
    return origins


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "Atelier ERP"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(default_factory=_default_database_url)
    DATABASE_ECHO: bool = False

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-change-in-prod-please-this-is-a-long-default-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8           # 8h staff session
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30    # 30d
    BCRYPT_ROUNDS: int = 12

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = Field(default_factory=_default_cors_origins)

    # ── Files ────────────────────────────────────────────────────────────────
    UPLOAD_DIR: Path = Field(default_factory=_default_upload_dir)
    MAX_UPLOAD_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = Field(
        default_factory=lambda: [
            "pdf", "psd", "ai", "svg", "png", "jpg", "jpeg",
            "zip", "docx", "xlsx", "txt", "webp",
        ]
    )

    # ── Rate limit ───────────────────────────────────────────────────────────
    AUTH_RATE_LIMIT: str = "10/minute"

    # ── Business calendar (invoice issue dates, etc.) ───────────────────────────
    BUSINESS_TIMEZONE: str = "Asia/Dubai"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                import json
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def apply_vercel_runtime_paths(self) -> Self:
        """Vercel serverless FS is read-only under /var/task — use /tmp."""
        if not _is_vercel():
            return self

        if self.DATABASE_URL.startswith("sqlite") and "/tmp/" not in self.DATABASE_URL:
            self.DATABASE_URL = VERCEL_TMP_DB

        upload = Path(self.UPLOAD_DIR)
        if not str(upload).startswith("/tmp"):
            self.UPLOAD_DIR = VERCEL_TMP_UPLOADS

        vercel_url = os.getenv("VERCEL_URL")
        if vercel_url:
            origin = f"https://{vercel_url}"
            if origin not in self.CORS_ORIGINS:
                self.CORS_ORIGINS = [*self.CORS_ORIGINS, origin]

        return self


def ensure_upload_dir(path: Path) -> None:
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError:
        if not _is_vercel():
            raise


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    ensure_upload_dir(settings.UPLOAD_DIR)
    return settings


settings = get_settings()
