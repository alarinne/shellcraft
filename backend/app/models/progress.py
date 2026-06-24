"""Per-user lab progress model."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base

if TYPE_CHECKING:
    from .user import User


class ProgressStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class LabProgress(Base):
    __tablename__ = "lab_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lab_id", name="uq_lab_progress_user_lab"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lab_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[ProgressStatus] = mapped_column(
        Enum(ProgressStatus, native_enum=False, length=20),
        default=ProgressStatus.not_started,
        nullable=False,
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="progress")
