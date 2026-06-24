"""User settings schemas."""

from __future__ import annotations

from typing import Any

from pydantic import Field

from .base import CamelModel


class SettingsPublic(CamelModel):
    theme: str
    terminal_font_size: int
    sound_enabled: bool
    reduced_motion: bool
    extras: dict[str, Any]


class SettingsUpdate(CamelModel):
    theme: str | None = Field(default=None, max_length=32)
    terminal_font_size: int | None = Field(default=None, ge=8, le=40)
    sound_enabled: bool | None = None
    reduced_motion: bool | None = None
    extras: dict[str, Any] | None = None
