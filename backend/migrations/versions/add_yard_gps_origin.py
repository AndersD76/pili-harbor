"""Add GPS origin fields to yards for coordinate conversion

Revision ID: g8h9i0j1k2l3
Revises: f7g8h9i0j1k2
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa


revision = "g8h9i0j1k2l3"
down_revision = "f7g8h9i0j1k2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "yards",
        sa.Column("origin_lat", sa.Float(), nullable=True),
    )
    op.add_column(
        "yards",
        sa.Column("origin_lng", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("yards", "origin_lng")
    op.drop_column("yards", "origin_lat")
