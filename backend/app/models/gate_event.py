import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GateEvent(Base):
    __tablename__ = "gate_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"),
        nullable=False, index=True,
    )
    yard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("yards.id"),
        nullable=False,
    )
    container_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("containers.id"),
        nullable=False, index=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(20), nullable=False,
    )  # gate_in / gate_out
    truck_plate: Mapped[str | None] = mapped_column(String(20))
    driver_name: Mapped[str | None] = mapped_column(String(255))
    driver_doc: Mapped[str | None] = mapped_column(String(50))
    seal_number: Mapped[str | None] = mapped_column(String(50))
    seal_status: Mapped[str | None] = mapped_column(String(20))
    damage_codes: Mapped[str | None] = mapped_column(String(500))
    vgm_kg: Mapped[float | None] = mapped_column(Float)
    temperature_celsius: Mapped[float | None] = mapped_column(
        Float,
    )
    photos_data: Mapped[dict | None] = mapped_column(JSONB)
    notes: Mapped[str | None] = mapped_column(String(1000))
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"),
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    container = relationship("Container")
    recorder = relationship("User", foreign_keys=[recorded_by])
