"""Authentication and gameplay business logic.

Keeps password hashing, account lookup, and XP/level math out of the routers.
Routers own HTTP concerns (cookies, status codes); these helpers own the domain.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import get_settings
from ..core.security import hash_password, verify_password
from ..models.progress import LabProgress, ProgressStatus
from ..models.user import User
from ..repositories import progress_repo, user_repo


class EmailAlreadyRegistered(Exception):
    """Raised when registering with an email that already exists."""


def level_for_xp(xp: int) -> int:
    """Derive a 1-based level from total XP."""
    xp_per_level = max(get_settings().xp_per_level, 1)
    return 1 + max(xp, 0) // xp_per_level


async def register(
    db: AsyncSession, *, name: str, email: str, password: str
) -> User:
    if await user_repo.get_by_email(db, email) is not None:
        raise EmailAlreadyRegistered(email)
    user = await user_repo.create(
        db,
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise EmailAlreadyRegistered(email) from exc
    await db.refresh(user)
    return user


async def authenticate(
    db: AsyncSession, *, identifier: str, password: str
) -> User | None:
    user = await user_repo.get_by_identifier(db, identifier)
    if user is None:
        # Hash a throwaway value to keep timing roughly constant.
        verify_password("$argon2id$v=19$m=65536,t=3,p=4$" + "A" * 22, password)
        return None
    if not verify_password(user.password_hash, password):
        return None
    return user


async def award_lab_completion(
    db: AsyncSession, *, user: User, lab_id: str, lab_xp: int, score: int
) -> tuple[LabProgress, User, int]:
    """Mark a lab complete, granting its XP only on the first completion.

    Returns the progress row, the refreshed user, and the XP gained this call.
    """
    progress = await progress_repo.get_or_create(db, user.id, lab_id)
    now = datetime.now(timezone.utc)

    progress.attempts += 1
    progress.best_score = max(progress.best_score, score)
    if progress.started_at is None:
        progress.started_at = now

    xp_gained = 0
    if progress.status != ProgressStatus.completed:
        progress.status = ProgressStatus.completed
        progress.completed_at = now
        progress.xp_awarded = lab_xp
        xp_gained = lab_xp
        user.xp += lab_xp
        user.level = level_for_xp(user.xp)

    await db.commit()
    await db.refresh(progress)
    await db.refresh(user)
    return progress, user, xp_gained
