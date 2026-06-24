"""Shared FastAPI dependencies (session service, current user)."""

from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import get_settings
from ..db.redis import get_redis
from ..db.session import get_db
from ..models.user import User
from ..repositories import user_repo
from ..services.session_service import SessionService

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="not authenticated",
)


def get_session_service(redis: Redis = Depends(get_redis)) -> SessionService:
    return SessionService(redis, get_settings().session_ttl_seconds)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    sessions: SessionService = Depends(get_session_service),
) -> User:
    """Resolve the signed-in user from the session cookie, or raise 401."""
    cookie_name = get_settings().session_cookie_name
    session_id = request.cookies.get(cookie_name)
    if not session_id:
        raise _UNAUTHENTICATED

    user_id = await sessions.get_user_id(session_id)
    if user_id is None:
        raise _UNAUTHENTICATED

    try:
        user = await user_repo.get_by_id(db, uuid.UUID(user_id))
    except ValueError as exc:
        raise _UNAUTHENTICATED from exc
    if user is None:
        raise _UNAUTHENTICATED
    return user
