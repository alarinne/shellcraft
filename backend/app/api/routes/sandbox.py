"""Opt-in Docker sandbox routes (ADR-0002)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, WebSocket
from pydantic import BaseModel

from ...labs_registry import get_labs
from ...lab_checker import check_lab_progress
from ...sandbox import (
    SANDBOX_LAB_IDS,
    SandboxError,
    read_live_lab_state,
    read_shell_cwd,
    resolve_live_cwd,
    sandbox_manager,
)
from ...terminal_ws import terminal_websocket

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])


class SandboxSessionRequest(BaseModel):
    labId: str


class SandboxExecRequest(BaseModel):
    command: str


@router.post("/sessions")
def create_sandbox_session(req: SandboxSessionRequest) -> dict[str, Any]:
    lab = get_labs().get(req.labId)
    if lab is None:
        raise HTTPException(status_code=404, detail="lab not found")
    if req.labId not in SANDBOX_LAB_IDS:
        raise HTTPException(
            status_code=400,
            detail=f"sandbox is not available for {req.labId!r}",
        )

    try:
        session = sandbox_manager.create_session(
            req.labId,
            lab.get("initialState", {}).get("cwd", "/home/guest/lab-01"),
        )
    except SandboxError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    return {
        "sessionId": session.session_id,
        "labId": session.lab_id,
        "cwd": session.cwd,
        "prompt": f"guest@shellcraft:{session.cwd}$",
    }


@router.post("/sessions/{session_id}/exec")
def sandbox_exec(session_id: str, req: SandboxExecRequest) -> dict[str, Any]:
    try:
        record = sandbox_manager.exec_command(session_id, req.command)
    except SandboxError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    lines = record.stdout if record.exit_code == 0 else record.stdout + record.stderr
    return {
        "stdout": record.stdout,
        "stderr": record.stderr,
        "output": lines,
        "exitCode": record.exit_code,
        "cwd": record.cwd,
        "prompt": f"guest@shellcraft:{record.cwd}$",
    }


@router.post("/sessions/{session_id}/check")
def sandbox_check(session_id: str) -> dict[str, Any]:
    try:
        session = sandbox_manager.get_session_info(session_id)
    except SandboxError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    lab = get_labs().get(session.lab_id)
    if lab is None:
        raise HTTPException(status_code=404, detail="lab not found")

    history, command_only = sandbox_manager.history_for_check(session)
    live_cwd = resolve_live_cwd(session.cwd, read_shell_cwd(session.container_name))
    session.cwd = live_cwd
    live_state = read_live_lab_state(session.container_name, session.lab_id)
    result = check_lab_progress(
        lab,
        history,
        live_cwd=live_cwd,
        live_state=live_state,
        command_only=command_only,
    )
    result["labId"] = session.lab_id
    result["cwd"] = live_cwd
    result["liveState"] = live_state
    return result


@router.delete("/sessions/{session_id}")
def destroy_sandbox_session(session_id: str) -> dict[str, bool]:
    try:
        sandbox_manager.destroy_session(session_id)
    except SandboxError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return {"ok": True}


@router.websocket("/sessions/{session_id}/terminal")
async def sandbox_terminal(websocket: WebSocket, session_id: str) -> None:
    await terminal_websocket(websocket, session_id)
