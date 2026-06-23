"""ShellCraft FastAPI service.

Implements the contract in ``docs/api-contract.md`` plus the opt-in Docker
sandbox (ADR-0002) for real Linux lab sessions.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import __version__
from .engine import check_command, next_step_id
from .lab_checker import check_lab_progress
from .sandbox import SANDBOX_LAB_IDS, SandboxError, read_live_lab_state, read_shell_cwd, sandbox_manager
from .terminal_ws import set_labs, terminal_websocket

LABS_DIR = Path(__file__).parent / "labs"

ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]


def load_labs() -> dict[str, dict[str, Any]]:
    labs: dict[str, dict[str, Any]] = {}
    for path in sorted(LABS_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        labs[data["id"]] = data
    return labs


class CommandCheckRequest(BaseModel):
    labId: str
    stepId: str
    command: str
    state: dict[str, Any] | None = None


class SandboxSessionRequest(BaseModel):
    labId: str


class SandboxExecRequest(BaseModel):
    command: str


def create_app() -> FastAPI:
    app = FastAPI(title="shellcraft-api", version=__version__)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    labs = load_labs()
    set_labs(labs)

    @app.get("/api/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "shellcraft-api",
            "sandbox": sandbox_manager.status(),
        }

    @app.get("/api/labs")
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
            for lab in labs.values()
        ]

    @app.get("/api/labs/{lab_id}")
    def get_lab(lab_id: str) -> dict[str, Any]:
        lab = labs.get(lab_id)
        if lab is None:
            raise HTTPException(status_code=404, detail="lab not found")
        return lab

    @app.post("/api/commands/check")
    def check(req: CommandCheckRequest) -> dict[str, Any]:
        lab = labs.get(req.labId)
        if lab is None:
            raise HTTPException(status_code=404, detail="lab not found")
        step = next((s for s in lab["steps"] if s["id"] == req.stepId), None)
        if step is None:
            raise HTTPException(status_code=404, detail="step not found")

        result = check_command(step, req.command)
        result["nextStepId"] = next_step_id(lab, req.stepId) if result["correct"] else req.stepId
        return result

    @app.post("/api/sandbox/sessions")
    def create_sandbox_session(req: SandboxSessionRequest) -> dict[str, Any]:
        lab = labs.get(req.labId)
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

    @app.post("/api/sandbox/sessions/{session_id}/exec")
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

    @app.post("/api/sandbox/sessions/{session_id}/check")
    def sandbox_check(session_id: str) -> dict[str, Any]:
        try:
            session = sandbox_manager.get_session_info(session_id)
        except SandboxError as exc:
            raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

        lab = labs.get(session.lab_id)
        if lab is None:
            raise HTTPException(status_code=404, detail="lab not found")

        history, command_only = sandbox_manager.history_for_check(session)
        live_cwd = read_shell_cwd(session.container_name) or session.cwd
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
        return result

    @app.delete("/api/sandbox/sessions/{session_id}")
    def destroy_sandbox_session(session_id: str) -> dict[str, bool]:
        try:
            sandbox_manager.destroy_session(session_id)
        except SandboxError as exc:
            raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
        return {"ok": True}

    @app.websocket("/api/sandbox/sessions/{session_id}/terminal")
    async def sandbox_terminal(websocket: WebSocket, session_id: str) -> None:
        await terminal_websocket(websocket, session_id)

    return app


app = create_app()
