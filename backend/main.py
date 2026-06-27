"""Vercel FastAPI service entrypoint (see root vercel.json)."""
from app.main import app

__all__ = ["app"]
