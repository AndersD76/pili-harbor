import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ManifestCreate(BaseModel):
    name: str
    deadline_at: datetime | None = None
    containers_data: dict[str, Any] | None = None


class ManifestUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    deadline_at: datetime | None = None
    containers_data: dict[str, Any] | None = None


class ManifestResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    name: str
    status: str
    deadline_at: datetime | None
    containers_data: dict[str, Any] | None
    ai_optimization_result: dict[str, Any] | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
