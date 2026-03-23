"""Create reefer_readings table

Revision ID: f7g8h9i0j1k2
Revises: e6f7g8h9i0j1
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "f7g8h9i0j1k2"
down_revision = "e6f7g8h9i0j1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reefer_readings",
        sa.Column("id", UUID(as_uuid=True),
                  primary_key=True),
        sa.Column("tenant_id", UUID(as_uuid=True),
                  sa.ForeignKey("tenants.id"),
                  nullable=False),
        sa.Column("container_id", UUID(as_uuid=True),
                  sa.ForeignKey("containers.id"),
                  nullable=False, index=True),
        sa.Column("set_temp_celsius", sa.Float()),
        sa.Column("actual_temp_celsius", sa.Float()),
        sa.Column("supply_temp", sa.Float()),
        sa.Column("return_temp", sa.Float()),
        sa.Column("humidity_percent", sa.Float()),
        sa.Column("power_status", sa.String(20),
                  nullable=False, server_default="on"),
        sa.Column("defrost_active", sa.Boolean(),
                  nullable=False, server_default="false"),
        sa.Column("recorded_at",
                  sa.DateTime(timezone=True),
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("reefer_readings")
