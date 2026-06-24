"""Authentication routes: register, login, logout, current user."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import get_settings
from ...db.session import get_db
from ...models.user import User
from ...schemas.auth import LoginRequest, RegisterRequest
from ...schemas.user import UserPublic
from ...services import auth_service
from ...services.session_service import SessionService
from ..deps import get_current_user, get_session_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, session_id: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=get_settings().session_cookie_name,
        path="/",
    )


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    sessions: SessionService = Depends(get_session_service),
) -> User:
    try:
        user = await auth_service.register(
            db,
            name=payload.name,
            email=str(payload.email),
            password=payload.password,
        )
    except auth_service.EmailAlreadyRegistered as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="email already registered",
        ) from exc

    session_id = await sessions.create(str(user.id))
    _set_session_cookie(response, session_id)
    return user


@router.post("/login", response_model=UserPublic)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    sessions: SessionService = Depends(get_session_service),
) -> User:
    user = await auth_service.authenticate(
        db,
        identifier=payload.identifier,
        password=payload.password,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid credentials",
        )

    session_id = await sessions.create(str(user.id))
    _set_session_cookie(response, session_id)
    return user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    sessions: SessionService = Depends(get_session_service),
) -> dict[str, bool]:
    session_id = request.cookies.get(get_settings().session_cookie_name)
    if session_id:
        await sessions.delete(session_id)
    _clear_session_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)) -> User:
    return user
