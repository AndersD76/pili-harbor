"""Add container port lifecycle fields (gate, customs, commercial, dwell, PTI)

Revision ID: d5e6f7g8h9i0
Revises: c4d5e6f7g8h9
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa


revision = "d5e6f7g8h9i0"
down_revision = "c4d5e6f7g8h9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Weight
    op.add_column("containers", sa.Column(
        "tare_kg", sa.Float(), nullable=True))
    op.add_column("containers", sa.Column(
        "vgm_kg", sa.Float(), nullable=True))
    # Gate / EIR
    op.add_column("containers", sa.Column(
        "gate_in_at", sa.DateTime(timezone=True),
        nullable=True))
    op.add_column("containers", sa.Column(
        "gate_out_at", sa.DateTime(timezone=True),
        nullable=True))
    op.add_column("containers", sa.Column(
        "seal_number", sa.String(50), nullable=True))
    op.add_column("containers", sa.Column(
        "seal_status", sa.String(20), nullable=True))
    op.add_column("containers", sa.Column(
        "damage_codes", sa.String(500), nullable=True))
    # Customs
    op.add_column("containers", sa.Column(
        "customs_status", sa.String(20),
        nullable=False, server_default="none"))
    op.add_column("containers", sa.Column(
        "bonded_warehouse_code", sa.String(20),
        nullable=True))
    # Commercial
    op.add_column("containers", sa.Column(
        "shipping_line", sa.String(100), nullable=True))
    op.add_column("containers", sa.Column(
        "booking_number", sa.String(50), nullable=True))
    op.add_column("containers", sa.Column(
        "bl_number", sa.String(100), nullable=True))
    op.add_column("containers", sa.Column(
        "consignee", sa.String(255), nullable=True))
    op.add_column("containers", sa.Column(
        "shipper", sa.String(255), nullable=True))
    # Dwell time
    op.add_column("containers", sa.Column(
        "free_time_days", sa.Integer(),
        nullable=False, server_default="7"))
    op.add_column("containers", sa.Column(
        "free_time_expires_at", sa.DateTime(timezone=True),
        nullable=True))
    op.add_column("containers", sa.Column(
        "demurrage_status", sa.String(20),
        nullable=False, server_default="none"))
    # PTI
    op.add_column("containers", sa.Column(
        "pti_date", sa.DateTime(timezone=True),
        nullable=True))
    op.add_column("containers", sa.Column(
        "pti_valid_until", sa.DateTime(timezone=True),
        nullable=True))
    op.add_column("containers", sa.Column(
        "pti_status", sa.String(20), nullable=True))


def downgrade() -> None:
    cols = [
        "pti_status", "pti_valid_until", "pti_date",
        "demurrage_status", "free_time_expires_at",
        "free_time_days", "shipper", "consignee",
        "bl_number", "booking_number", "shipping_line",
        "bonded_warehouse_code", "customs_status",
        "damage_codes", "seal_status", "seal_number",
        "gate_out_at", "gate_in_at", "vgm_kg", "tare_kg",
    ]
    for col in cols:
        op.drop_column("containers", col)
