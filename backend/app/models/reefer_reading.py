import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, String, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReeferReading(Base):
    __tablename__ = "reefer_readings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"),
        nullable=False,
    )
    container_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("containers.id"),
        nullable=False, index=True,
    )
    set_temp_celsius: Mapped[float | None] = mapped_column(Float)
    actual_temp_celsius: Mapped[float | None] = mapped_column(
        Float,
    )
    supply_temp: Mapped[float | None] = mapped_column(Float)
    return_temp: Mapped[float | None] = mapped_column(Float)
    humidity_percent: Mapped[float | None] = mapped_column(Float)
    power_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="on",
    )  # on / off / alarm
    defrost_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    container = relationship("Container")
