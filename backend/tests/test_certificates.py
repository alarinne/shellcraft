"""Completion certificates with HMAC verification."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from .conftest import register_user

LABS = ("lab-01", "lab-02", "lab-03", "lab-04", "lab-05")


async def complete_all_labs(client) -> None:
    for lab_id in LABS:
        res = await client.post(f"/api/progress/{lab_id}/complete")
        assert res.status_code == 200, res.text


async def test_certificate_requires_all_labs(client):
    await register_user(client)
    res = await client.get("/api/certificates/me")
    assert res.status_code == 404


async def test_certificate_issued_after_all_labs(client):
    user = await register_user(client)
    await complete_all_labs(client)

    res = await client.get("/api/certificates/me")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["holderName"] == user["name"]
    assert body["labsCompleted"] == 5
    assert body["verificationUrl"].startswith("http://localhost:4200/verify?")
    assert len(body["signature"]) == 64


async def test_verify_valid_certificate(client):
    await register_user(client)
    await complete_all_labs(client)

    cert = (await client.get("/api/certificates/me")).json()
    parsed = urlparse(cert["verificationUrl"])
    params = parse_qs(parsed.query)
    cert_id = params["c"][0]
    signature = params["s"][0]

    verify = await client.get(
        "/api/certificates/verify",
        params={"c": cert_id, "s": signature},
    )
    assert verify.status_code == 200
    body = verify.json()
    assert body["valid"] is True
    assert body["holderName"] == "Ada"
    assert body["labsCompleted"] == 5


async def test_verify_rejects_tampered_signature(client):
    await register_user(client)
    await complete_all_labs(client)

    cert = (await client.get("/api/certificates/me")).json()
    parsed = urlparse(cert["verificationUrl"])
    cert_id = parse_qs(parsed.query)["c"][0]

    verify = await client.get(
        "/api/certificates/verify",
        params={"c": cert_id, "s": "0" * 64},
    )
    assert verify.status_code == 200
    assert verify.json()["valid"] is False
