"""Application configuration (Pydantic Settings)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent


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
    DATABASE_URL: str = f"sqlite+aiosqlite:///{(BASE_DIR / 'atelier.db').as_posix()}"
    DATABASE_ECHO: bool = False

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-change-in-prod-please-this-is-a-long-default-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8           # 8h staff session
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30    # 30d
    BCRYPT_ROUNDS: int = 12

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
        ]
    )

    # ── Files ────────────────────────────────────────────────────────────────
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
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


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
