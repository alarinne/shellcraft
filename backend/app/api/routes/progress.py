"""Per-user lab progress routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.session import get_db
from ...labs_registry import get_labs
from ...models.user import User
from ...schemas.progress import (
    CompleteLabRequest,
    CompleteLabResponse,
    LabProgressPublic,
)
from ...services import auth_service
from ...repositories import progress_repo
from ..deps import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=list[LabProgressPublic])
async def list_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list:
    return await progress_repo.list_for_user(db, user.id)


@router.post("/{lab_id}/complete", response_model=CompleteLabResponse)
async def complete_lab(
    lab_id: str,
    payload: CompleteLabRequest | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CompleteLabResponse:
    lab = get_labs().get(lab_id)
    if lab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="lab not found",
        )

    score = payload.score if payload is not None else 100
    progress, refreshed_user, xp_gained = await auth_service.award_lab_completion(
        db,
        user=user,
        lab_id=lab_id,
        lab_xp=int(lab.get("xp", 0)),
        score=score,
    )
    return CompleteLabResponse(
        progress=LabProgressPublic.model_validate(progress),
        user=refreshed_user,
        xp_gained=xp_gained,
    )
