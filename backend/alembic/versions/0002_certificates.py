"""certificates table

Revision ID: 0002_certificates
Revises: 0001_initial
Create Date: 2026-06-24

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002_certificates"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "certificates",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("holder_name", sa.String(length=120), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("labs_completed", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("signature", sa.String(length=128), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        op.f("ix_certificates_user_id"), "certificates", ["user_id"], unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_certificates_user_id"), table_name="certificates")
    op.drop_table("certificates")
