import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class TaskCreate(BaseModel):
    container_id: uuid.UUID
    forklift_id: uuid.UUID | None = None
    assigned_user_id: uuid.UUID | None = None
    type: str = "relocate"
    priority: int = 5
    destination_x: float | None = None
    destination_y: float | None = None
    destination_label: str | None = None
    notes: str | None = None


class TaskStatusUpdate(BaseModel):
    status: str
    notes: str | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    manifest_id: uuid.UUID | None
    container_id: uuid.UUID
    forklift_id: uuid.UUID | None
    assigned_user_id: uuid.UUID | None
    type: str
    priority: int
    status: str
    destination_x: float | None
    destination_y: float | None
    destination_label: str | None
    ai_instructions: str | None
    ai_route: dict[str, Any] | None
    estimated_duration_seconds: int | None
    started_at: datetime | None
    completed_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
