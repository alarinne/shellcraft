"""Shared password strength rules for registration."""

from __future__ import annotations

import re

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128

PASSWORD_REQUIREMENTS_MSG = (
    "Password must be 8–128 characters and include uppercase, lowercase, "
    "a number, and a symbol."
)


def validate_password(password: str) -> str | None:
    """Return a user-facing error message, or ``None`` when the password is valid."""
    if len(password) < PASSWORD_MIN_LENGTH:
        return f"Password must be at least {PASSWORD_MIN_LENGTH} characters."
    if len(password) > PASSWORD_MAX_LENGTH:
        return f"Password must be at most {PASSWORD_MAX_LENGTH} characters."
    if not re.search(r"[A-Z]", password):
        return "Password must include at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must include at least one lowercase letter."
    if not re.search(r"\d", password):
        return "Password must include at least one number."
    if not re.search(r"[^\w\s]", password):
        return "Password must include at least one symbol."
    return None
