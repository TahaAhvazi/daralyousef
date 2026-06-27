"""Shared schemas (pagination, etc.)."""
from __future__ import annotations

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field


T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginatedResponse(ORMModel, Generic[T]):
    items: List[T]
    total: int
    page: int = 1
    page_size: int = 25


class PageParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=200)
    q: Optional[str] = None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class IdResponse(BaseModel):
    id: int


class OkResponse(BaseModel):
    ok: bool = True
    message: Optional[str] = None
