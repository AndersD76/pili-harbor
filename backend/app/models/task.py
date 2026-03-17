import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    yard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("yards.id"), nullable=False)
    manifest_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("manifests.id"))
    container_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("containers.id"), nullable=False)
    forklift_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("forklifts.id"))
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="relocate")
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    destination_x: Mapped[float | None] = mapped_column(Float)
    destination_y: Mapped[float | None] = mapped_column(Float)
    destination_label: Mapped[str | None] = mapped_column(String(255))
    ai_instructions: Mapped[str | None] = mapped_column(Text)
    ai_route: Mapped[dict | None] = mapped_column(JSONB)
    estimated_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    manifest = relationship("Manifest", back_populates="tasks")
    container = relationship("Container")
    forklift = relationship("Forklift")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])

    __table_args__ = (
        Index("ix_tasks_forklift_active", "forklift_id", "status", postgresql_where=(status.notin_(["done", "cancelled"]))),
        Index("ix_tasks_manifest", "manifest_id"),
    )
