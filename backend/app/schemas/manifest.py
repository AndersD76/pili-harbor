import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ManifestCreate(BaseModel):
    name: str
    operation_type: str = "loading"  # loading, discharge, rearrange
    vessel_name: str | None = None
    vessel_imo: str | None = None
    voyage_number: str | None = None
    port_locode: str | None = None
    deadline_at: datetime | None = None
    containers_data: dict[str, Any] | None = None


class ManifestUpdate(BaseModel):
    name: str | None = None
    operation_type: str | None = None
    vessel_name: str | None = None
    vessel_imo: str | None = None
    voyage_number: str | None = None
    port_locode: str | None = None
    status: str | None = None
    deadline_at: datetime | None = None
    containers_data: dict[str, Any] | None = None


class ManifestResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    name: str
    operation_type: str
    vessel_name: str | None
    vessel_imo: str | None
    voyage_number: str | None
    port_locode: str | None
    status: str
    deadline_at: datetime | None
    containers_data: dict[str, Any] | None
    ai_optimization_result: dict[str, Any] | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
