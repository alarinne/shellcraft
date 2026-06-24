"""Password hashing and opaque session-id generation.

Passwords are hashed with Argon2id. Session identifiers are random,
URL-safe tokens with no embedded state — the mapping to a user lives in Redis.
"""

from __future__ import annotations

import secrets

from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Return an Argon2id hash for ``password``."""
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Return ``True`` when ``password`` matches ``password_hash``."""
    try:
        return _hasher.verify(password_hash, password)
    except Argon2Error:
        return False


def generate_session_id() -> str:
    """Return a cryptographically random, opaque session identifier."""
    return secrets.token_urlsafe(32)
