import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Container(Base):
    __tablename__ = "containers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    yard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("yards.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500))
    weight_kg: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="stored")
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
