"""Application-wide exceptions + global handlers."""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    status_code: int = 400
    code: str = "app_error"
    message: str = "Something went wrong"

    def __init__(self, message: Optional[str] = None, *, code: Optional[str] = None,
                 status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        if message:
            self.message = message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    message = "Resource not found"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"
    message = "You don't have permission to perform this action"


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Authentication required"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"
    message = "Conflict with current state"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"
    message = "Validation failed"


def _payload(message: str, code: str, details: Any = None) -> Dict[str, Any]:
    body: Dict[str, Any] = {"error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return body


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code,
                            content=_payload(exc.message, exc.code, exc.details))

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_: Request, exc: StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code,
                            content=_payload(str(exc.detail), f"http_{exc.status_code}"))

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422,
                            content=_payload("Validation failed",
                                             "validation_error",
                                             jsonable_encoder(exc.errors())))

    @app.exception_handler(IntegrityError)
    async def integrity_handler(_: Request, exc: IntegrityError):
        return JSONResponse(status_code=409,
                            content=_payload("Database integrity error",
                                             "integrity_error",
                                             str(exc.orig) if exc.orig else None))

    @app.exception_handler(SQLAlchemyError)
    async def sa_handler(_: Request, exc: SQLAlchemyError):
        return JSONResponse(status_code=500,
                            content=_payload("Database error", "db_error"))
