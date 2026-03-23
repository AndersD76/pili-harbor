import uuid
from datetime import datetime

from pydantic import BaseModel


class ContainerCreate(BaseModel):
    code: str
    iso_type: str | None = None
    cargo_type: str = "general"
    cargo_description: str | None = None
    imo_class: str | None = None
    ncm_code: str | None = None
    is_reefer: bool = False
    reefer_temp_celsius: float | None = None
    description: str | None = None
    weight_kg: float | None = None
    tare_kg: float | None = None
    vgm_kg: float | None = None
    # Gate / commercial (optional at creation)
    shipping_line: str | None = None
    booking_number: str | None = None
    bl_number: str | None = None
    consignee: str | None = None
    shipper: str | None = None
    # Position
    x_meters: float | None = None
    y_meters: float | None = None
    stack_level: int = 0
    block_label: str | None = None
    row: int | None = None
    col: int | None = None


class ContainerUpdate(BaseModel):
    code: str | None = None
    iso_type: str | None = None
    cargo_type: str | None = None
    cargo_description: str | None = None
    imo_class: str | None = None
    ncm_code: str | None = None
    is_reefer: bool | None = None
    reefer_temp_celsius: float | None = None
    description: str | None = None
    weight_kg: float | None = None
    tare_kg: float | None = None
    vgm_kg: float | None = None
    status: str | None = None
    shipping_line: str | None = None
    booking_number: str | None = None
    bl_number: str | None = None
    consignee: str | None = None
    shipper: str | None = None
    customs_status: str | None = None
    demurrage_status: str | None = None
    pti_status: str | None = None
    pti_date: datetime | None = None
    pti_valid_until: datetime | None = None
    x_meters: float | None = None
    y_meters: float | None = None
    stack_level: int | None = None
    block_label: str | None = None
    row: int | None = None
    col: int | None = None


class ContainerResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    yard_id: uuid.UUID
    code: str
    iso_type: str | None
    cargo_type: str
    cargo_description: str | None
    imo_class: str | None
    ncm_code: str | None
    is_reefer: bool
    reefer_temp_celsius: float | None
    description: str | None
    weight_kg: float | None
    tare_kg: float | None
    vgm_kg: float | None
    status: str
    # Gate
    gate_in_at: datetime | None
    gate_out_at: datetime | None
    seal_number: str | None
    seal_status: str | None
    damage_codes: str | None
    # Customs
    customs_status: str
    bonded_warehouse_code: str | None
    # Commercial
    shipping_line: str | None
    booking_number: str | None
    bl_number: str | None
    consignee: str | None
    shipper: str | None
    # Dwell
    free_time_days: int
    free_time_expires_at: datetime | None
    demurrage_status: str
    # PTI
    pti_date: datetime | None
    pti_valid_until: datetime | None
    pti_status: str | None
    # Position
    x_meters: float | None
    y_meters: float | None
    stack_level: int
    block_label: str | None
    row: int | None
    col: int | None
    max_stack: int
    position_confidence: float | None
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
