"""Auth flow: register, login, logout, session-protected routes."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.services import auth_service

from .conftest import TEST_PASSWORD, register_user


async def test_register_creates_user_and_sets_cookie(client):
    res = await client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": TEST_PASSWORD},
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["email"] == "ada@example.com"
    assert body["xp"] == 0
    assert body["level"] == 1
    assert "passwordHash" not in body
    assert "shellcraft_session" in res.cookies


async def test_register_duplicate_email_conflicts(client):
    await register_user(client)
    res = await client.post(
        "/api/auth/register",
        json={"name": "Ada2", "email": "ada@example.com", "password": TEST_PASSWORD},
    )
    assert res.status_code == 409


async def test_login_with_email_and_with_name(client):
    await register_user(client, name="Linus", email="linus@example.com")
    client.cookies.clear()

    by_email = await client.post(
        "/api/auth/login",
        json={"identifier": "linus@example.com", "password": TEST_PASSWORD},
    )
    assert by_email.status_code == 200

    by_name = await client.post(
        "/api/auth/login",
        json={"identifier": "Linus", "password": TEST_PASSWORD},
    )
    assert by_name.status_code == 200


async def test_login_wrong_password_rejected(client):
    await register_user(client)
    client.cookies.clear()
    res = await client.post(
        "/api/auth/login",
        json={"identifier": "ada@example.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


async def test_me_requires_authentication(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


async def test_me_returns_current_user_when_authenticated(client):
    await register_user(client)
    res = await client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "ada@example.com"


async def test_logout_clears_session(client):
    await register_user(client)
    assert (await client.get("/api/auth/me")).status_code == 200

    logout = await client.post("/api/auth/logout")
    assert logout.status_code == 200
    client.cookies.clear()
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_short_password_rejected(client):
    res = await client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "short"},
    )
    assert res.status_code == 422


async def test_weak_password_missing_symbol_rejected(client):
    res = await client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "weak@example.com", "password": "Secret12"},
    )
    assert res.status_code == 422
    assert "symbol" in res.text.lower()


async def test_weak_password_missing_uppercase_rejected(client):
    res = await client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "weak2@example.com", "password": "secret12!"},
    )
    assert res.status_code == 422
    assert "uppercase" in res.text.lower()


async def test_register_maps_integrity_error_to_conflict(monkeypatch):
    db = AsyncMock()
    db.commit = AsyncMock(side_effect=IntegrityError("stmt", {}, Exception("duplicate key")))
    db.rollback = AsyncMock()
    db.refresh = AsyncMock()

    monkeypatch.setattr(auth_service.user_repo, "get_by_email", AsyncMock(return_value=None))
    monkeypatch.setattr(auth_service.user_repo, "create", AsyncMock(return_value=object()))

    with pytest.raises(auth_service.EmailAlreadyRegistered):
        await auth_service.register(
            db,
            name="Ada",
            email="race@example.com",
            password=TEST_PASSWORD,
        )

    db.rollback.assert_awaited_once()
