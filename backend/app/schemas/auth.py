"""Authentication request schemas."""

from __future__ import annotations

from pydantic import EmailStr, Field, field_validator

from ..core.password_policy import validate_password
from .base import CamelModel


class RegisterRequest(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        error = validate_password(value)
        if error:
            raise ValueError(error)
        return value


class LoginRequest(CamelModel):
    # Email address or display name.
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=1, max_length=128)
