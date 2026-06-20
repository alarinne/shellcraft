"""ShellCraft FastAPI service.

Implements the contract in ``docs/api-contract.md``:

    GET  /api/health
    GET  /api/labs
    GET  /api/labs/{id}
    POST /api/commands/check

Lab content is loaded from JSON files in ``app/labs``. Command checking is
deterministic and never executes a real shell (see ``app/engine.py``).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import __version__
from .engine import check_command, next_step_id

LABS_DIR = Path(__file__).parent / "labs"

# Angular dev server origins allowed to call the API.
ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]


def load_labs() -> dict[str, dict[str, Any]]:
    """Load every lab JSON file keyed by lab id."""
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


def create_app() -> FastAPI:
    app = FastAPI(title="shellcraft-api", version=__version__)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    labs = load_labs()

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "shellcraft-api"}

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

    return app


app = create_app()
