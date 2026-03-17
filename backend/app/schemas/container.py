import uuid
from datetime import datetime

from pydantic import BaseModel


class ContainerCreate(BaseModel):
    code: str
    description: str | None = None
    weight_kg: float | None = None
    x_meters: float | None = None
    y_meters: float | None = None


class ContainerUpdate(BaseModel):
    code: str | None = None
    description: str | None = None
    weight_kg: float | None = None
    status: str | None = None
    x_meters: float | None = None
    y_meters: float | None = None


class ContainerResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    code: str
    description: str | None
    weight_kg: float | None
    status: str
    x_meters: float | None
    y_meters: float | None
    position_confidence: float | None
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
