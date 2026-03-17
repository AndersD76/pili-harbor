import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class YardCreate(BaseModel):
    name: str
    description: str | None = None
    width_meters: float
    height_meters: float
    grid_config: dict[str, Any] | None = None
    timezone: str = "America/Sao_Paulo"


class YardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    width_meters: float | None = None
    height_meters: float | None = None
    grid_config: dict[str, Any] | None = None
    timezone: str | None = None
    active: bool | None = None


class YardResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    description: str | None
    width_meters: float
    height_meters: float
    grid_config: dict[str, Any] | None
    timezone: str
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
