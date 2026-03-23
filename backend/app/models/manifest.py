import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Manifest(Base):
    __tablename__ = "manifests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    yard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("yards.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    operation_type: Mapped[str] = mapped_column(String(50), nullable=False, default="loading")  # loading=embarque, discharge=desembarque, rearrange=rearranjo
    vessel_name: Mapped[str | None] = mapped_column(String(255))
    vessel_imo: Mapped[str | None] = mapped_column(String(20))
    voyage_number: Mapped[str | None] = mapped_column(String(50))
    port_locode: Mapped[str | None] = mapped_column(String(10))  # UN/LOCODE e.g. BRSSZ
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    containers_data: Mapped[dict | None] = mapped_column(JSONB)
    ai_optimization_result: Mapped[dict | None] = mapped_column(JSONB)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tasks = relationship("Task", back_populates="manifest", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by])
