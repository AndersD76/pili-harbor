"""Add container stack/position fields

Revision ID: a2b3c4d5e6f7
Revises: c47fde9e91a8
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa


revision = "a2b3c4d5e6f7"
down_revision = "c47fde9e91a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("containers", sa.Column("stack_level", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("containers", sa.Column("block_label", sa.String(50), nullable=True))
    op.add_column("containers", sa.Column("row", sa.Integer(), nullable=True))
    op.add_column("containers", sa.Column("col", sa.Integer(), nullable=True))
    op.add_column("containers", sa.Column("max_stack", sa.Integer(), nullable=False, server_default="5"))


def downgrade() -> None:
    op.drop_column("containers", "max_stack")
    op.drop_column("containers", "col")
    op.drop_column("containers", "row")
    op.drop_column("containers", "block_label")
    op.drop_column("containers", "stack_level")
