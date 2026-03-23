import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class GateInRequest(BaseModel):
    truck_plate: str | None = None
    driver_name: str | None = None
    driver_doc: str | None = None
    seal_number: str | None = None
    seal_status: str = "ok"
    damage_codes: str | None = None
    vgm_kg: float | None = None
    temperature_celsius: float | None = None
    notes: str | None = None
    # Optional container creation fields
    weight_kg: float | None = None
    tare_kg: float | None = None
    shipping_line: str | None = None
    booking_number: str | None = None
    bl_number: str | None = None
    consignee: str | None = None
    shipper: str | None = None
    free_time_days: int | None = None


class GateOutRequest(BaseModel):
    truck_plate: str | None = None
    driver_name: str | None = None
    driver_doc: str | None = None
    seal_number: str | None = None
    seal_status: str | None = None
    damage_codes: str | None = None
    notes: str | None = None


class GateEventResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    container_id: uuid.UUID
    event_type: str
    truck_plate: str | None
    driver_name: str | None
    driver_doc: str | None
    seal_number: str | None
    seal_status: str | None
    damage_codes: str | None
    vgm_kg: float | None
    temperature_celsius: float | None
    photos_data: dict[str, Any] | None
    notes: str | None
    recorded_by: uuid.UUID | None
    recorded_at: datetime

    model_config = {"from_attributes": True}


class CustomsUpdateRequest(BaseModel):
    customs_status: str  # pending/green/yellow/red/grey/released
    bonded_warehouse_code: str | None = None
    notes: str | None = None
