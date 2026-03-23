import uuid
from datetime import datetime

from pydantic import BaseModel


class ReeferReadingCreate(BaseModel):
    set_temp_celsius: float | None = None
    actual_temp_celsius: float | None = None
    supply_temp: float | None = None
    return_temp: float | None = None
    humidity_percent: float | None = None
    power_status: str = "on"
    defrost_active: bool = False


class ReeferReadingResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    container_id: uuid.UUID
    set_temp_celsius: float | None
    actual_temp_celsius: float | None
    supply_temp: float | None
    return_temp: float | None
    humidity_percent: float | None
    power_status: str
    defrost_active: bool
    recorded_at: datetime

    model_config = {"from_attributes": True}
