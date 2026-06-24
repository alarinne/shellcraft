"""Per-user settings: defaults, partial update, auth gating."""

from __future__ import annotations

from .conftest import register_user


async def test_settings_requires_auth(client):
    assert (await client.get("/api/settings")).status_code == 401


async def test_get_settings_returns_defaults(client):
    await register_user(client)
    res = await client.get("/api/settings")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["theme"] == "dark"
    assert body["terminalFontSize"] == 14
    assert body["soundEnabled"] is True
    assert body["reducedMotion"] is False
    assert body["extras"] == {}


async def test_update_settings_partial(client):
    await register_user(client)
    res = await client.put(
        "/api/settings",
        json={"theme": "light", "terminalFontSize": 18, "extras": {"accent": "purple"}},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["theme"] == "light"
    assert body["terminalFontSize"] == 18
    assert body["soundEnabled"] is True  # untouched
    assert body["extras"] == {"accent": "purple"}

    # Persisted across requests.
    again = await client.get("/api/settings")
    assert again.json()["theme"] == "light"


async def test_update_settings_validates_font_size(client):
    await register_user(client)
    res = await client.put("/api/settings", json={"terminalFontSize": 999})
    assert res.status_code == 422
