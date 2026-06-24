"""CRUD helpers for :class:`User`."""

from __future__ import annotations

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User


async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await db.get(User, user_id)


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    stmt = select(User).where(func.lower(User.email) == email.lower())
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_by_identifier(db: AsyncSession, identifier: str) -> User | None:
    """Look a user up by email or display name (case-insensitive)."""
    needle = identifier.lower()
    stmt = select(User).where(
        or_(func.lower(User.email) == needle, func.lower(User.name) == needle)
    )
    return (await db.execute(stmt)).scalars().first()


async def create(
    db: AsyncSession,
    *,
    name: str,
    email: str,
    password_hash: str,
) -> User:
    user = User(name=name, email=email, password_hash=password_hash)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
