"""Simulated command-check routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...engine import check_command, next_step_id
from ...labs_registry import get_labs

router = APIRouter(prefix="/api/commands", tags=["commands"])


class CommandCheckRequest(BaseModel):
    labId: str
    stepId: str
    command: str
    state: dict[str, Any] | None = None


@router.post("/check")
def check(req: CommandCheckRequest) -> dict[str, Any]:
    lab = get_labs().get(req.labId)
    if lab is None:
        raise HTTPException(status_code=404, detail="lab not found")
    step = next((s for s in lab["steps"] if s["id"] == req.stepId), None)
    if step is None:
        raise HTTPException(status_code=404, detail="step not found")

    result = check_command(step, req.command)
    result["nextStepId"] = (
        next_step_id(lab, req.stepId) if result["correct"] else req.stepId
    )
    return result
