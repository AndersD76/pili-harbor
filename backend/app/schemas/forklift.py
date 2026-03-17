import uuid
from datetime import datetime

from pydantic import BaseModel


class ForkliftCreate(BaseModel):
    code: str
    operator_id: uuid.UUID | None = None


class ForkliftUpdate(BaseModel):
    code: str | None = None
    operator_id: uuid.UUID | None = None
    status: str | None = None


class ForkliftResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    code: str
    operator_id: uuid.UUID | None
    status: str
    x_meters: float | None
    y_meters: float | None
    heading_degrees: float | None
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
