"""initial persistence: users, lab_progress, user_settings

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-24

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "lab_progress",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lab_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="not_started"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("best_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("xp_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "lab_id", name="uq_lab_progress_user_lab"),
    )
    op.create_index(
        op.f("ix_lab_progress_user_id"), "lab_progress", ["user_id"], unique=False
    )

    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("theme", sa.String(length=32), nullable=False, server_default="dark"),
        sa.Column(
            "terminal_font_size", sa.Integer(), nullable=False, server_default="14"
        ),
        sa.Column(
            "sound_enabled", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column(
            "reduced_motion", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("extras", sa.JSON(), nullable=False, server_default="{}"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_index(op.f("ix_lab_progress_user_id"), table_name="lab_progress")
    op.drop_table("lab_progress")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
