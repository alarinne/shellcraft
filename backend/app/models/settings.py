"""Per-user settings model (one-to-one with ``User``)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base

if TYPE_CHECKING:
    from .user import User


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    theme: Mapped[str] = mapped_column(String(32), default="dark", nullable=False)
    terminal_font_size: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reduced_motion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    extras: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    user: Mapped["User"] = relationship(back_populates="settings")
