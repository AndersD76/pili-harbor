"""Create gate_events table

Revision ID: e6f7g8h9i0j1
Revises: d5e6f7g8h9i0
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = "e6f7g8h9i0j1"
down_revision = "d5e6f7g8h9i0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gate_events",
        sa.Column("id", UUID(as_uuid=True),
                  primary_key=True),
        sa.Column("tenant_id", UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id"),
                  nullable=False, index=True),
        sa.Column("yard_id", UUID(as_uuid=True),
                  sa.ForeignKey("yards.id"),
                  nullable=False),
        sa.Column("container_id", UUID(as_uuid=True),
                  sa.ForeignKey("containers.id"),
                  nullable=False, index=True),
        sa.Column("event_type", sa.String(20),
                  nullable=False),
        sa.Column("truck_plate", sa.String(20)),
        sa.Column("driver_name", sa.String(255)),
        sa.Column("driver_doc", sa.String(50)),
        sa.Column("seal_number", sa.String(50)),
        sa.Column("seal_status", sa.String(20)),
        sa.Column("damage_codes", sa.String(500)),
        sa.Column("vgm_kg", sa.Float()),
        sa.Column("temperature_celsius", sa.Float()),
        sa.Column("photos_data", JSONB),
        sa.Column("notes", sa.String(1000)),
        sa.Column("recorded_by", UUID(as_uuid=True),
                  sa.ForeignKey("users.id")),
        sa.Column("recorded_at",
                  sa.DateTime(timezone=True),
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("gate_events")
