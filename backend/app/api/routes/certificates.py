"""Completion certificate routes."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.session import get_db
from ...models.user import User
from ...schemas.certificate import CertificatePublic, CertificateVerifyResponse
from ...services import certificate_service
from ...services.progress_service import all_labs_completed
from ..deps import get_current_user

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


@router.get("/me", response_model=CertificatePublic)
async def get_my_certificate(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CertificatePublic:
    if not await all_labs_completed(db, user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="certificate not available until all labs are completed",
        )

    cert = await certificate_service.issue_certificate_if_eligible(db, user)
    if cert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="certificate not found",
        )
    return certificate_service.to_public(cert)


@router.get("/verify", response_model=CertificateVerifyResponse)
async def verify_certificate(
    c: uuid.UUID = Query(..., description="Certificate id"),
    s: str = Query(..., min_length=64, max_length=128, description="HMAC signature"),
    db: AsyncSession = Depends(get_db),
) -> CertificateVerifyResponse:
    return await certificate_service.verify_certificate(db, c, s)
