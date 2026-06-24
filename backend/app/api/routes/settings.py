"""Per-user settings routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.session import get_db
from ...models.user import User
from ...repositories import settings_repo
from ...schemas.settings import SettingsPublic, SettingsUpdate
from ..deps import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsPublic)
async def get_settings_route(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await settings_repo.get_or_create(db, user.id)
    await db.commit()
    return settings


@router.put("", response_model=SettingsPublic)
async def update_settings_route(
    payload: SettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    changes = payload.model_dump(exclude_unset=True)
    settings = await settings_repo.update(db, user.id, changes)
    await db.commit()
    await db.refresh(settings)
    return settings
