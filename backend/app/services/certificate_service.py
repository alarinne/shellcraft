"""Issue and verify completion certificates."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.certificate_signing import (
    build_verification_url,
    sign_certificate,
    verify_signature,
)
from ..models.certificate import Certificate
from ..models.user import User
from ..repositories import certificate_repo
from ..schemas.certificate import CertificatePublic, CertificateVerifyResponse
from .progress_service import LAB_ORDER, all_labs_completed


async def issue_certificate_if_eligible(
    db: AsyncSession, user: User
) -> Certificate | None:
    """Create a certificate when all labs are complete; idempotent per user."""
    if not await all_labs_completed(db, user.id):
        return None

    existing = await certificate_repo.get_by_user(db, user.id)
    if existing is not None:
        return existing

    issued_at = datetime.now(timezone.utc)
    cert = Certificate(
        user_id=user.id,
        holder_name=user.name,
        issued_at=issued_at,
        labs_completed=len(LAB_ORDER),
        signature="",
    )
    db.add(cert)
    await db.flush()
    cert.signature = sign_certificate(cert.id, user.id)
    await db.commit()
    await db.refresh(cert)
    return cert


def to_public(cert: Certificate) -> CertificatePublic:
    return CertificatePublic(
        id=cert.id,
        holder_name=cert.holder_name,
        issued_at=cert.issued_at,
        labs_completed=cert.labs_completed,
        signature=cert.signature,
        verification_url=build_verification_url(cert.id, cert.signature),
    )


async def verify_certificate(
    db: AsyncSession, cert_id: uuid.UUID, signature: str
) -> CertificateVerifyResponse:
    cert = await certificate_repo.get_by_id(db, cert_id)
    if cert is None:
        return CertificateVerifyResponse(valid=False)

    if not verify_signature(cert.id, cert.user_id, signature):
        return CertificateVerifyResponse(valid=False)

    if cert.signature != signature:
        return CertificateVerifyResponse(valid=False)

    return CertificateVerifyResponse(
        valid=True,
        holder_name=cert.holder_name,
        issued_at=cert.issued_at,
        labs_completed=cert.labs_completed,
    )
