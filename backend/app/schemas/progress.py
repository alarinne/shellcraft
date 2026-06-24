"""Lab progress schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import Field

from ..models.progress import ProgressStatus
from .base import CamelModel
from .user import UserPublic


class LabProgressPublic(CamelModel):
    lab_id: str
    status: ProgressStatus
    attempts: int
    best_score: int
    xp_awarded: int
    started_at: datetime | None
    completed_at: datetime | None


class CompleteLabRequest(CamelModel):
    # Optional 0-100 score for the attempt; defaults to a full pass.
    score: int = Field(default=100, ge=0, le=100)


class CompleteLabResponse(CamelModel):
    progress: LabProgressPublic
    user: UserPublic
    xp_gained: int
