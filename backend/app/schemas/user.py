"""User response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import EmailStr

from .base import CamelModel


class UserPublic(CamelModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    xp: int
    level: int
    created_at: datetime
