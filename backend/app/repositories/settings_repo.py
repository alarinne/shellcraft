"""CRUD helpers for :class:`UserSettings`."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.settings import UserSettings


async def get(db: AsyncSession, user_id: uuid.UUID) -> UserSettings | None:
    return await db.get(UserSettings, user_id)


async def get_or_create(db: AsyncSession, user_id: uuid.UUID) -> UserSettings:
    settings = await get(db, user_id)
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.flush()
        await db.refresh(settings)
    return settings


async def update(
    db: AsyncSession, user_id: uuid.UUID, changes: dict[str, Any]
) -> UserSettings:
    settings = await get_or_create(db, user_id)
    for field, value in changes.items():
        setattr(settings, field, value)
    await db.flush()
    await db.refresh(settings)
    return settings
