"""Add manifest vessel/operation fields for XML support

Revision ID: b3c4d5e6f7g8
Revises: a2b3c4d5e6f7
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa


revision = "b3c4d5e6f7g8"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "manifests",
        sa.Column(
            "operation_type",
            sa.String(50),
            nullable=False,
            server_default="loading",
        ),
    )
    op.add_column(
        "manifests",
        sa.Column("vessel_name", sa.String(255), nullable=True),
    )
    op.add_column(
        "manifests",
        sa.Column("vessel_imo", sa.String(20), nullable=True),
    )
    op.add_column(
        "manifests",
        sa.Column("voyage_number", sa.String(50), nullable=True),
    )
    op.add_column(
        "manifests",
        sa.Column("port_locode", sa.String(10), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("manifests", "port_locode")
    op.drop_column("manifests", "voyage_number")
    op.drop_column("manifests", "vessel_imo")
    op.drop_column("manifests", "vessel_name")
    op.drop_column("manifests", "operation_type")
