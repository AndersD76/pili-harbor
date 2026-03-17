import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Forklift(Base):
    __tablename__ = "forklifts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    yard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("yards.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    operator_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="idle")
    x_meters: Mapped[float | None] = mapped_column(Float)
    y_meters: Mapped[float | None] = mapped_column(Float)
    heading_degrees: Mapped[float | None] = mapped_column(Float)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    yard = relationship("Yard", back_populates="forklifts")
    operator = relationship("User", foreign_keys=[operator_id])
