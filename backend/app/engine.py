"""Safe, deterministic command checking.

This mirrors the frontend `SimulatedBackend`: a command is compared as a string
against the step's whitelist. User input is **never** executed as a shell
command. The hardened Docker sandbox (issue #9) is the only place real commands
run.
"""

from __future__ import annotations

import re
from typing import Any


def normalize_command(command: str) -> str:
    """Trim and collapse internal whitespace so ``ls   -la`` == ``ls -la``."""
    return re.sub(r"\s+", " ", command.strip())


def check_command(step: dict[str, Any], command: str) -> dict[str, Any]:
    """Evaluate ``command`` against ``step`` and return a result dict.

    The shape matches ``POST /api/commands/check`` in ``docs/api-contract.md``.
    """
    normalized = normalize_command(command)
    accepted = [normalize_command(c) for c in step.get("acceptedCommands", [])]
    correct = normalized in accepted

    if correct:
        return {
            "correct": True,
            "output": step.get("expectedOutput", []),
            "explanation": step.get("explanation"),
        }

    hint = step.get("hint") or "Try one of: " + ", ".join(step.get("acceptedCommands", []))
    return {
        "correct": False,
        "output": ["shellcraft: not the expected command for this step"],
        "explanation": hint,
    }


def next_step_id(lab: dict[str, Any], step_id: str) -> str | None:
    """Return the id of the step after ``step_id``, or ``None`` if it was last."""
    steps = lab.get("steps", [])
    for index, step in enumerate(steps):
        if step["id"] == step_id:
            return steps[index + 1]["id"] if index + 1 < len(steps) else None
    return None
