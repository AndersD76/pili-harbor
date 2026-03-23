"""Add container cargo/product type fields

Revision ID: c4d5e6f7g8h9
Revises: b3c4d5e6f7g8
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa


revision = "c4d5e6f7g8h9"
down_revision = "b3c4d5e6f7g8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "containers",
        sa.Column("iso_type", sa.String(10), nullable=True),
    )
    op.add_column(
        "containers",
        sa.Column(
            "cargo_type",
            sa.String(50),
            nullable=False,
            server_default="general",
        ),
    )
    op.add_column(
        "containers",
        sa.Column(
            "cargo_description", sa.String(500), nullable=True,
        ),
    )
    op.add_column(
        "containers",
        sa.Column("imo_class", sa.String(10), nullable=True),
    )
    op.add_column(
        "containers",
        sa.Column("ncm_code", sa.String(20), nullable=True),
    )
    op.add_column(
        "containers",
        sa.Column(
            "is_reefer",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "containers",
        sa.Column(
            "reefer_temp_celsius", sa.Float(), nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("containers", "reefer_temp_celsius")
    op.drop_column("containers", "is_reefer")
    op.drop_column("containers", "ncm_code")
    op.drop_column("containers", "imo_class")
    op.drop_column("containers", "cargo_description")
    op.drop_column("containers", "cargo_type")
    op.drop_column("containers", "iso_type")
