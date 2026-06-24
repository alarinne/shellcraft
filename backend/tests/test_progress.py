"""Per-user progress: XP award is idempotent and gated by auth."""

from __future__ import annotations

from .conftest import register_user


async def test_progress_requires_auth(client):
    assert (await client.get("/api/progress")).status_code == 401


async def test_complete_unknown_lab_404(client):
    await register_user(client)
    res = await client.post("/api/progress/lab-999/complete")
    assert res.status_code == 404


async def test_complete_lab_awards_xp_and_updates_level(client):
    await register_user(client)
    res = await client.post("/api/progress/lab-01/complete", json={"score": 90})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["xpGained"] == 120
    assert body["progress"]["status"] == "completed"
    assert body["progress"]["bestScore"] == 90
    assert body["user"]["xp"] == 120

    listing = await client.get("/api/progress")
    assert listing.status_code == 200
    rows = listing.json()
    assert len(rows) == 1
    assert rows[0]["labId"] == "lab-01"
    assert rows[0]["status"] == "completed"


async def test_completing_twice_does_not_double_award(client):
    await register_user(client)
    first = await client.post("/api/progress/lab-01/complete")
    second = await client.post("/api/progress/lab-01/complete")
    assert first.json()["xpGained"] == 120
    assert second.json()["xpGained"] == 0
    assert second.json()["user"]["xp"] == 120
    assert second.json()["progress"]["attempts"] == 2
