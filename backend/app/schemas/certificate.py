"""Certificate API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from .base import CamelModel


class CertificatePublic(CamelModel):
    id: UUID
    holder_name: str
    issued_at: datetime
    labs_completed: int
    signature: str
    verification_url: str


class CertificateVerifyResponse(CamelModel):
    valid: bool
    holder_name: str | None = None
    issued_at: datetime | None = None
    labs_completed: int | None = None
