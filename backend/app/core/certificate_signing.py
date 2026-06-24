"""HMAC signing for verifiable completion certificates."""

from __future__ import annotations

import hmac
import uuid
from hashlib import sha256

from .config import get_settings


def sign_certificate(cert_id: uuid.UUID, user_id: uuid.UUID) -> str:
    """Return a hex HMAC-SHA256 signature for the certificate payload."""
    payload = f"{cert_id}:{user_id}"
    secret = get_settings().certificate_signing_secret.encode("utf-8")
    return hmac.new(secret, payload.encode("utf-8"), sha256).hexdigest()


def verify_signature(cert_id: uuid.UUID, user_id: uuid.UUID, signature: str) -> bool:
    expected = sign_certificate(cert_id, user_id)
    return hmac.compare_digest(expected, signature)


def build_verification_url(cert_id: uuid.UUID, signature: str) -> str:
    base = get_settings().public_app_url.rstrip("/")
    return f"{base}/verify?c={cert_id}&s={signature}"
