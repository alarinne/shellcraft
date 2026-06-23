"""Validate learner command history against a lab definition.

Uses flexible output matching for real ``docker exec`` / PTY results.
History cwd values are re-derived on check by replaying ``cd`` commands.
"""

from __future__ import annotations

import re
from typing import Any

from .engine import normalize_command

_LABS_DIR = "/home/guest/projects/labs"
_PROJECTS_DIR = "/home/guest/projects"

_STEP_FAILURE_HINTS: dict[str, str] = {
    "step-01-orient": "Run `pwd` to confirm you start in /home/guest/projects.",
    "step-02-scan-projects": "Run `ls` or `ls -la` here and look for the labs folder.",
    "step-03-enter-labs": "Run `cd labs` to move into the labs directory.",
    "step-04-find-mission": "Inside labs, run `ls` to find mission.txt.",
    "step-05-read-mission": "Run `cat mission.txt` to read the mission file.",
}


def resolve_path(cwd: str, target: str) -> str:
    if not target or target == "~":
        return cwd
    base: list[str] = [] if target.startswith("/") else [p for p in cwd.split("/") if p]
    for part in target.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if base:
                base.pop()
        else:
            base.append(part)
    return "/" + "/".join(base)


def replay_history(history: list[dict[str, Any]], initial_cwd: str) -> list[dict[str, Any]]:
    """Re-derive cwd on each entry by replaying successful ``cd`` commands."""
    replayed: list[dict[str, Any]] = []
    cwd = initial_cwd
    for entry in history:
        fixed = dict(entry)
        fixed["recordedCwd"] = entry.get("cwd")
        cmd = normalize_command(entry.get("command", ""))
        if cmd.startswith("cd ") and entry.get("exitCode", 1) == 0:
            parts = cmd.split(" ", 1)
            target = parts[1] if len(parts) > 1 else "~"
            cwd = resolve_path(cwd, target)
        fixed["cwd"] = cwd
        replayed.append(fixed)
    return replayed


def _effective_cwd(entry: dict[str, Any], cmd: str) -> str:
    """Pick cwd for grading: replayed chain for ``cd``, else sandbox-recorded when trustworthy."""
    replayed = entry.get("cwd", "")
    recorded = entry.get("recordedCwd", replayed)
    if cmd.startswith("cd "):
        return replayed
    if recorded and replayed and recorded != replayed:
        if len(replayed) > len(recorded):
            return replayed
    return recorded or replayed


def _stdout_text(entry: dict[str, Any]) -> str:
    return "\n".join(entry.get("stdout", [])).strip()


def _is_listing_command(cmd: str) -> bool:
    normalized = normalize_command(cmd)
    return normalized == "ls" or normalized.startswith("ls ")


def _ls_path_args(cmd: str) -> list[str]:
    """Return non-flag arguments after ``ls`` (e.g. ``labs/``, ``./mission.txt``)."""
    parts = normalize_command(cmd).split()
    return [part for part in parts[1:] if not part.startswith("-")]


def _listing_resolves_to(cmd: str, cwd: str, target_dir: str) -> bool:
    for arg in _ls_path_args(cmd):
        if resolve_path(cwd, arg) == target_dir:
            return True
    return False


def _is_cd_to_labs(cmd: str, entry_cwd: str) -> bool:
    if not cmd.startswith("cd "):
        return False
    parts = cmd.split(" ", 1)
    target = parts[1] if len(parts) > 1 else "~"
    return resolve_path(entry_cwd, target) == _LABS_DIR


def _scan_projects_listing(cmd: str, entry_cwd: str, out: str, *, command_only: bool) -> bool:
    if entry_cwd != _PROJECTS_DIR or not _is_listing_command(cmd):
        return False
    if command_only:
        return True
    if re.search(r"\blabs\b", out):
        return True
    return _listing_resolves_to(cmd, entry_cwd, _LABS_DIR)


def _find_mission_listing(cmd: str, entry_cwd: str, out: str, *, command_only: bool) -> bool:
    if not _is_listing_command(cmd):
        return False
    in_labs = entry_cwd == _LABS_DIR
    lists_labs = _listing_resolves_to(cmd, entry_cwd, _LABS_DIR)
    if command_only:
        return in_labs or lists_labs
    if in_labs and "mission.txt" in out:
        return True
    if lists_labs and "mission.txt" in out:
        return True
    mission_paths = ("mission.txt", "./mission.txt", "labs/mission.txt", "labs/mission.txt/")
    return any(arg.rstrip("/") in mission_paths for arg in _ls_path_args(cmd)) and "mission.txt" in out


def _entry_matches_step(
    step: dict[str, Any],
    entry: dict[str, Any],
    *,
    command_only: bool = False,
) -> bool:
    """Return True when a single history entry satisfies a lab step."""
    if entry.get("exitCode", 1) != 0:
        return False

    cmd = normalize_command(entry["command"])
    step_id = step.get("id", "")
    entry_cwd = _effective_cwd(entry, cmd)
    out = _stdout_text(entry)

    if step_id in ("step-01-orient", "step-01-pwd"):
        if cmd == "pwd":
            return command_only or _PROJECTS_DIR in out or not out
        return entry_cwd == _PROJECTS_DIR and cmd not in ("", "cd", "cd .")

    if step_id in ("step-02-scan-projects", "step-02-ls"):
        return _scan_projects_listing(cmd, entry_cwd, out, command_only=command_only)

    if step_id in ("step-03-enter-labs", "step-03-cd"):
        if not cmd.startswith("cd "):
            return False
        replayed_cwd = entry.get("cwd", "")
        if replayed_cwd == _LABS_DIR:
            return True
        return entry.get("exitCode", 1) == 0 and _is_cd_to_labs(cmd, replayed_cwd)

    if step_id == "step-04-find-mission":
        return _find_mission_listing(cmd, entry_cwd, out, command_only=command_only)

    if step_id == "step-05-read-mission":
        if cmd.startswith("cat ") and "mission.txt" in cmd:
            return command_only or "MISSION_READY=filesystem" in out or not out
        return "MISSION_READY=filesystem" in out

    accepted = [normalize_command(c) for c in step.get("acceptedCommands", [])]
    if cmd not in accepted:
        return False

    expected = [line.strip() for line in step.get("expectedOutput", [])]
    if not expected:
        return True
    actual = [line.strip() for line in entry.get("stdout", []) if line.strip()]
    return actual == expected


def _failure_reason(step: dict[str, Any]) -> str:
    step_id = step.get("id", "")
    if step_id in _STEP_FAILURE_HINTS:
        return _STEP_FAILURE_HINTS[step_id]
    hint = step.get("hint")
    prompt = step.get("prompt", "")
    if hint:
        return f"{prompt} — {hint}"
    return prompt or "This step is not complete yet."


def check_lab_progress(
    lab: dict[str, Any],
    history: list[dict[str, Any]],
    *,
    live_cwd: str | None = None,
    command_only: bool = False,
) -> dict[str, Any]:
    """Grade every lab step; return per-step status and feedback for incomplete work."""
    steps: list[dict[str, Any]] = lab.get("steps", [])
    initial_cwd = lab.get("initialState", {}).get("cwd", "/home/guest/projects")
    graded_history = replay_history(history, initial_cwd)

    if not steps:
        return {
            "completed": True,
            "stepsCompleted": 0,
            "totalSteps": 0,
            "completedStepIds": [],
            "nextStepId": None,
            "nextStepPrompt": None,
            "message": "This lab has no steps.",
            "stepStatuses": [],
        }

    step_statuses: list[dict[str, Any]] = []
    completed_ids: list[str] = []

    for step in steps:
        completed = any(
            _entry_matches_step(step, entry, command_only=command_only)
            for entry in graded_history
        )
        if (
            not completed
            and step.get("id") in ("step-03-enter-labs", "step-03-cd")
            and live_cwd == "/home/guest/projects/labs"
        ):
            completed = True

        reason = None if completed else _failure_reason(step)
        step_statuses.append(
            {
                "id": step["id"],
                "prompt": step.get("prompt", ""),
                "completed": completed,
                "reason": reason,
            }
        )
        if completed:
            completed_ids.append(step["id"])

    total = len(steps)
    done = len(completed_ids) >= total
    next_step = next((s for s in steps if s["id"] not in completed_ids), None)

    if done:
        message = "All lab steps are complete. Nice work!"
    else:
        pending_reasons = [s["reason"] for s in step_statuses if not s["completed"] and s["reason"]]
        message = "Not complete yet:\n• " + "\n• ".join(pending_reasons)

    return {
        "completed": done,
        "stepsCompleted": len(completed_ids),
        "totalSteps": total,
        "completedStepIds": completed_ids,
        "nextStepId": next_step["id"] if next_step else None,
        "nextStepPrompt": next_step.get("prompt") if next_step else None,
        "message": message,
        "stepStatuses": step_statuses,
    }
