"""Progressive lab unlock gating on completion."""

from __future__ import annotations

from .conftest import register_user


async def test_cannot_complete_lab_without_prior(client):
    await register_user(client)
    res = await client.post("/api/progress/lab-03/complete")
    assert res.status_code == 403
    assert "lab-02" in res.json()["detail"]


async def test_can_complete_labs_in_order(client):
    await register_user(client)
    for lab_id in ("lab-01", "lab-02", "lab-03"):
        res = await client.post(f"/api/progress/{lab_id}/complete")
        assert res.status_code == 200, res.text


async def test_can_review_already_completed_lab(client):
    await register_user(client)
    first = await client.post("/api/progress/lab-01/complete")
    assert first.status_code == 200
    second = await client.post("/api/progress/lab-01/complete")
    assert second.status_code == 200
