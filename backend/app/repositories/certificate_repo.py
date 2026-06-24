"""CRUD helpers for completion certificates."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.certificate import Certificate


async def get_by_user(db: AsyncSession, user_id: uuid.UUID) -> Certificate | None:
    stmt = select(Certificate).where(Certificate.user_id == user_id)
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_by_id(db: AsyncSession, cert_id: uuid.UUID) -> Certificate | None:
    stmt = select(Certificate).where(Certificate.id == cert_id)
    return (await db.execute(stmt)).scalar_one_or_none()
