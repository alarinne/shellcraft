"""CRUD helpers for :class:`LabProgress`."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.progress import LabProgress


async def list_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[LabProgress]:
    stmt = (
        select(LabProgress)
        .where(LabProgress.user_id == user_id)
        .order_by(LabProgress.lab_id)
    )
    return list((await db.execute(stmt)).scalars().all())


async def get(
    db: AsyncSession, user_id: uuid.UUID, lab_id: str
) -> LabProgress | None:
    stmt = select(LabProgress).where(
        LabProgress.user_id == user_id, LabProgress.lab_id == lab_id
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_or_create(
    db: AsyncSession, user_id: uuid.UUID, lab_id: str
) -> LabProgress:
    progress = await get(db, user_id, lab_id)
    if progress is None:
        progress = LabProgress(user_id=user_id, lab_id=lab_id)
        db.add(progress)
        await db.flush()
    return progress
