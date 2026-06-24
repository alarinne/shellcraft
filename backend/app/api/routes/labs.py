"""Static lab content routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from ...labs_registry import get_labs

router = APIRouter(prefix="/api/labs", tags=["labs"])


@router.get("")
def list_labs() -> list[dict[str, Any]]:
    return [
        {
            "id": lab["id"],
            "title": lab["title"],
            "level": lab["level"],
            "durationMinutes": lab["durationMinutes"],
            "xp": lab["xp"],
            "summary": lab["summary"],
        }
        for lab in get_labs().values()
    ]


@router.get("/{lab_id}")
def get_lab(lab_id: str) -> dict[str, Any]:
    lab = get_labs().get(lab_id)
    if lab is None:
        raise HTTPException(status_code=404, detail="lab not found")
    return lab
