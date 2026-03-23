import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey,
    Index, Integer, String, func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Container(Base):
    __tablename__ = "containers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    yard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("yards.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    iso_type: Mapped[str | None] = mapped_column(String(10))  # ISO 6346 size-type: 22G1, 42G1, 45R1, etc.
    cargo_type: Mapped[str] = mapped_column(String(50), nullable=False, default="general")  # general, reefer, imo, bulk, empty
    cargo_description: Mapped[str | None] = mapped_column(String(500))
    imo_class: Mapped[str | None] = mapped_column(String(10))  # IMO/IMDG class: 1.1, 2.1, 3, 4.1, 5.1, 6.1, 7, 8, 9
    ncm_code: Mapped[str | None] = mapped_column(String(20))  # NCM (Nomenclatura Comum do Mercosul)
    is_reefer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reefer_temp_celsius: Mapped[float | None] = mapped_column(Float)  # target temperature for reefer
    description: Mapped[str | None] = mapped_column(String(500))
    weight_kg: Mapped[float | None] = mapped_column(Float)
    tare_kg: Mapped[float | None] = mapped_column(Float)
    vgm_kg: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="stored",
    )
    # Gate / EIR
    gate_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    gate_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    seal_number: Mapped[str | None] = mapped_column(String(50))
    seal_status: Mapped[str | None] = mapped_column(
        String(20),
    )  # ok/broken/missing/replaced
    damage_codes: Mapped[str | None] = mapped_column(
        String(500),
    )  # EIR: DE,HO,SC,ST
    # Customs
    customs_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="none",
    )  # none/pending/green/yellow/red/grey/released
    bonded_warehouse_code: Mapped[str | None] = mapped_column(
        String(20),
    )
    # Commercial
    shipping_line: Mapped[str | None] = mapped_column(String(100))
    booking_number: Mapped[str | None] = mapped_column(String(50))
    bl_number: Mapped[str | None] = mapped_column(String(100))
    consignee: Mapped[str | None] = mapped_column(String(255))
    shipper: Mapped[str | None] = mapped_column(String(255))
    # Dwell time
    free_time_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=7,
    )
    free_time_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    demurrage_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="none",
    )  # none/accruing/paid/exempt
    # PTI (reefer)
    pti_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    pti_valid_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    pti_status: Mapped[str | None] = mapped_column(
        String(20),
    )  # pending/passed/failed/expired
    x_meters: Mapped[float | None] = mapped_column(Float)
    y_meters: Mapped[float | None] = mapped_column(Float)
    # Stack/height tracking
    stack_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0=ground, 1=on top, etc.
    block_label: Mapped[str | None] = mapped_column(String(50))  # e.g. "A", "B", "C"
    row: Mapped[int | None] = mapped_column(Integer)  # row in the block
    col: Mapped[int | None] = mapped_column(Integer)  # column/bay in the block
    max_stack: Mapped[int] = mapped_column(Integer, nullable=False, default=5)  # max height for this position
    position_confidence: Mapped[float | None] = mapped_column(Float)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    yard = relationship("Yard", back_populates="containers")
    iot_node = relationship("IoTNode", back_populates="container", uselist=False)

    __table_args__ = (
        Index("ix_containers_yard_tenant_active", "yard_id", "tenant_id", postgresql_where=deleted_at.is_(None)),
    )
