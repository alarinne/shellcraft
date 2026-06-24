"""Authentication request schemas."""

from __future__ import annotations

from pydantic import EmailStr, Field

from .base import CamelModel


class RegisterRequest(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(CamelModel):
    # Email address or display name.
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=1, max_length=128)
