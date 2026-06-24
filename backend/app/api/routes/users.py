"""User profile routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ...models.user import User
from ...schemas.user import UserPublic
from ..deps import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def get_me(user: User = Depends(get_current_user)) -> User:
    return user
