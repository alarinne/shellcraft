"""Lab unlock rules and progressive path gating."""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.progress import ProgressStatus
from ..repositories import progress_repo

# Keep in sync with frontend `LAB_ORDER` in lab-progress.ts.
LAB_ORDER: tuple[str, ...] = (
    "lab-01",
    "lab-02",
    "lab-03",
    "lab-04",
    "lab-05",
)


def prerequisite_lab_id(lab_id: str) -> str | None:
    """Return the lab that must be completed before ``lab_id``, or None for lab-01."""
    try:
        index = LAB_ORDER.index(lab_id)
    except ValueError:
        return None
    if index == 0:
        return None
    return LAB_ORDER[index - 1]


async def is_lab_unlocked(
    db: AsyncSession, user_id: uuid.UUID, lab_id: str
) -> bool:
    """A lab is unlocked when it is lab-01, already completed, or the prior lab is done."""
    if lab_id not in LAB_ORDER:
        return False
    if lab_id == LAB_ORDER[0]:
        return True

    progress = await progress_repo.get(db, user_id, lab_id)
    if progress is not None and progress.status == ProgressStatus.completed:
        return True

    prior = prerequisite_lab_id(lab_id)
    if prior is None:
        return True

    prior_progress = await progress_repo.get(db, user_id, prior)
    return (
        prior_progress is not None
        and prior_progress.status == ProgressStatus.completed
    )


async def assert_lab_unlocked(
    db: AsyncSession, user_id: uuid.UUID, lab_id: str
) -> None:
    """Raise 403 when the user has not unlocked ``lab_id`` yet."""
    if await is_lab_unlocked(db, user_id, lab_id):
        return

    prior = prerequisite_lab_id(lab_id)
    detail = (
        f"complete {prior} before starting {lab_id}"
        if prior
        else f"lab {lab_id} is not available"
    )
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


async def all_labs_completed(db: AsyncSession, user_id: uuid.UUID) -> bool:
    for lab_id in LAB_ORDER:
        progress = await progress_repo.get(db, user_id, lab_id)
        if progress is None or progress.status != ProgressStatus.completed:
            return False
    return True
