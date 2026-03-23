import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Yard(Base):
    __tablename__ = "yards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    width_meters: Mapped[float] = mapped_column(Float, nullable=False)
    height_meters: Mapped[float] = mapped_column(Float, nullable=False)
    grid_config: Mapped[dict | None] = mapped_column(JSONB)
    timezone: Mapped[str] = mapped_column(String(100), default="America/Sao_Paulo")
    origin_lat: Mapped[float | None] = mapped_column(Float)
    origin_lng: Mapped[float | None] = mapped_column(Float)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="yards")
    containers = relationship("Container", back_populates="yard", lazy="selectin")
    forklifts = relationship("Forklift", back_populates="yard", lazy="selectin")
    anchor_nodes = relationship("AnchorNode", back_populates="yard", lazy="selectin")
