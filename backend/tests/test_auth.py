"""Auth flow: register, login, logout, session-protected routes."""

from __future__ import annotations

from .conftest import register_user


async def test_register_creates_user_and_sets_cookie(client):
    res = await client.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "supersecret"},
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
        json={"name": "Ada2", "email": "ada@example.com", "password": "supersecret"},
    )
    assert res.status_code == 409


async def test_login_with_email_and_with_name(client):
    await register_user(client, name="Linus", email="linus@example.com")
    client.cookies.clear()

    by_email = await client.post(
        "/api/auth/login",
        json={"identifier": "linus@example.com", "password": "supersecret"},
    )
    assert by_email.status_code == 200

    by_name = await client.post(
        "/api/auth/login",
        json={"identifier": "Linus", "password": "supersecret"},
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
