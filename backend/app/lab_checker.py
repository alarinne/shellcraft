"""Validate learner command history against a lab definition.

Uses flexible output matching for real ``docker exec`` / PTY results.
History cwd values are re-derived on check by replaying ``cd`` commands.
"""

from __future__ import annotations

import re
from typing import Any

from .engine import normalize_command

_LAB01_ROOT = "/home/guest/lab-01"
_LAB01_MISSION_DIR = "/home/guest/lab-01/labs"
_LAB03_LOGS_DIR = "/home/guest/lab-03/logs"

_STEP_FAILURE_HINTS: dict[str, str] = {
    "step-01-orient": "Run `pwd` to confirm you start in /home/guest/lab-01.",
    "step-02-scan-projects": "Run `ls` or `ls -la` here and look for the labs folder.",
    "step-03-enter-labs": "Run `cd labs` to move into the labs directory.",
    "step-04-find-mission": "Inside labs, run `ls` to find mission.txt.",
    "step-05-read-mission": "Run `cat mission.txt` to read the mission file.",
    "step-01-inspect": "Run `ls -l deploy.sh` or `stat deploy.sh` to read the current mode.",
    "step-02-chmod": "Run `chmod 755 deploy.sh` to make the script executable.",
    "step-01-view-log": "Run `cat access.log` or `head access.log` in the logs directory.",
    "step-02-grep-errors": "Run `grep ERROR access.log` or `cat access.log | grep ERROR`.",
    "step-03-count-errors": (
        "Run `grep ERROR access.log | wc -l`, `grep -c ERROR access.log`, "
        "or `cat access.log | grep ERROR | wc -l`."
    ),
    "step-01-start-worker": "Run `./worker.sh &` to start the worker in the background.",
    "step-02-find-worker": "Run `ps aux` or `pgrep -f worker` to locate the worker process.",
    "step-03-stop-worker": "Run `pkill -f worker.sh` or `kill` with the worker PID.",
    "step-01-start-hang": "Run `./hang.sh &` to launch the script in the background.",
    "step-02-sigterm": "Run `kill -15 <pid>` or `kill -TERM` to send SIGTERM to hang.sh.",
    "step-03-verify-gone": "Run `ps aux | grep hang` — hang.sh should no longer appear.",
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


def _output_has_error_lines(out: str) -> bool:
    return bool(re.search(r"\bERROR\b", out))


def _output_shows_count(out: str, count: str = "2") -> bool:
    for line in out.splitlines():
        stripped = line.strip()
        if stripped == count:
            return True
        if re.fullmatch(r"\d+", stripped) and stripped == count:
            return True
    return out.strip() == count


def _grep_filters_access_log(cmd: str) -> bool:
    lower = normalize_command(cmd).lower()
    if "access.log" not in lower:
        return False
    if "grep" not in lower:
        return False
    if "wc" in lower or "grep -c" in lower:
        return False
    return True


def _counts_access_log_errors(cmd: str) -> bool:
    lower = normalize_command(cmd).lower()
    if "access.log" not in lower and "access.log" not in cmd:
        return False
    if lower.startswith("grep -c ") and "access.log" in lower:
        return True
    if "|" in cmd and "grep" in lower and "wc" in lower:
        return True
    return False


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
    return resolve_path(entry_cwd, target) == _LAB01_MISSION_DIR


def _scan_projects_listing(cmd: str, entry_cwd: str, out: str, *, command_only: bool) -> bool:
    if entry_cwd != _LAB01_ROOT or not _is_listing_command(cmd):
        return False
    if command_only:
        return True
    if re.search(r"\blabs\b", out):
        return True
    return _listing_resolves_to(cmd, entry_cwd, _LAB01_MISSION_DIR)


def _find_mission_listing(cmd: str, entry_cwd: str, out: str, *, command_only: bool) -> bool:
    if not _is_listing_command(cmd):
        return False
    in_labs = entry_cwd == _LAB01_MISSION_DIR
    lists_labs = _listing_resolves_to(cmd, entry_cwd, _LAB01_MISSION_DIR)
    if command_only:
        return in_labs or lists_labs
    # mission.txt is always present in labs; PTY capture may miss short ls output.
    if in_labs:
        return True
    if lists_labs and "mission.txt" in out:
        return True
    mission_paths = ("mission.txt", "./mission.txt", "labs/mission.txt", "labs/mission.txt/")
    return any(arg.rstrip("/") in mission_paths for arg in _ls_path_args(cmd)) and "mission.txt" in out


def _mentions_deploy_sh(cmd: str) -> bool:
    return "deploy.sh" in cmd


def _inspect_deploy_permissions(cmd: str, out: str, *, command_only: bool) -> bool:
    if cmd.startswith("stat ") and _mentions_deploy_sh(cmd):
        return command_only or "rw-r--r--" in out or "644" in out
    if not _is_listing_command(cmd):
        return False
    if _mentions_deploy_sh(cmd):
        return command_only or "deploy.sh" in out or "rw-r--r--" in out or "rwx" in out
    return command_only or (
        "deploy.sh" in out and ("rw-r--r--" in out or "rwx" in out or "r-x" in out)
    )


def _chmod_deploy_executable(
    cmd: str,
    out: str,
    *,
    command_only: bool,
    live_state: dict[str, Any] | None = None,
) -> bool:
    live_state = live_state or {}
    if live_state.get("deployExecutable"):
        return True
    normalized = normalize_command(cmd)
    if normalized.startswith("chmod ") and "deploy.sh" in normalized:
        parts = normalized.split()
        mode = parts[1] if len(parts) > 1 else ""
        if mode in ("755", "0755", "+x", "u+x", "a+x"):
            return True
    if _is_listing_command(cmd) and _mentions_deploy_sh(cmd) and "rwxr-xr-x" in out:
        return True
    return "rwxr-xr-x" in out and "deploy.sh" in out


def _mentions_access_log(cmd: str) -> bool:
    return "access.log" in cmd


def _view_access_log(cmd: str, entry_cwd: str, out: str, *, command_only: bool) -> bool:
    if entry_cwd != _LAB03_LOGS_DIR and "/logs" not in entry_cwd:
        return False
    if _is_listing_command(cmd) and _mentions_access_log(cmd):
        return command_only or "access.log" in out or bool(out)
    if _is_listing_command(cmd) and "access.log" in out:
        return True
    if cmd.startswith("cat ") and _mentions_access_log(cmd):
        return command_only or "INFO" in out or "ERROR" in out
    if cmd.startswith("head") and _mentions_access_log(cmd):
        return command_only or bool(out)
    return False


def _grep_errors(cmd: str, out: str, *, command_only: bool) -> bool:
    if not _grep_filters_access_log(cmd):
        return False
    normalized = normalize_command(cmd)
    if "|" not in cmd and not normalized.startswith("grep"):
        return False
    if command_only:
        return "error" in normalized.lower()
    return _output_has_error_lines(out)


def _count_errors(cmd: str, out: str, *, command_only: bool) -> bool:
    if not _counts_access_log_errors(cmd):
        return False
    if command_only:
        return True
    return _output_shows_count(out, "2")


def _starts_background(cmd: str, script: str) -> bool:
    normalized = normalize_command(cmd)
    base = script.lstrip("./")
    return base in normalized and "&" in normalized


def _find_process(cmd: str, name: str, out: str, *, command_only: bool) -> bool:
    normalized = normalize_command(cmd)
    if normalized.startswith("pgrep"):
        return command_only or name in out or name in normalized
    if normalized == "ps" or normalized.startswith("ps "):
        return name in out or name in normalized
    if "grep" in normalized or "|" in cmd:
        return name in out or name in cmd
    return False


def _stop_process(cmd: str, name: str, *, command_only: bool) -> bool:
    normalized = normalize_command(cmd)
    base = name.split(".")[0]
    if normalized.startswith("pkill") or normalized.startswith("killall"):
        return base in normalized or name in normalized
    if normalized.startswith("kill "):
        parts = normalized.split()
        if len(parts) >= 2 and parts[1].lstrip("-").isdigit():
            return True
        if any(token in normalized for token in ("-15", "-TERM", "-9", "-KILL", "-SIGTERM")):
            return True
    return False


def _sigterm_hang(cmd: str, *, command_only: bool) -> bool:
    normalized = normalize_command(cmd)
    if normalized.startswith("pkill") and ("hang" in normalized or "TERM" in normalized):
        return True
    if not normalized.startswith("kill "):
        return False
    if command_only:
        return any(token in normalized for token in ("-15", "-TERM", "-SIGTERM"))
    return any(token in normalized for token in ("-15", "-TERM", "-SIGTERM", "hang"))


def _verify_process_gone(cmd: str, name: str, out: str, *, command_only: bool) -> bool:
    normalized = normalize_command(cmd)
    if not (normalized.startswith("ps") or normalized.startswith("pgrep") or "grep" in normalized):
        return False
    script = f"{name}.sh"
    if script in out or f"/bin/sh ./{script}" in out or f"./{script}" in out:
        return False
    if name in out and "grep" not in out:
        return False
    return True


def _entry_matches_step(
    step: dict[str, Any],
    entry: dict[str, Any],
    *,
    command_only: bool = False,
    live_state: dict[str, Any] | None = None,
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
            return command_only or _LAB01_ROOT in out or not out
        return entry_cwd == _LAB01_ROOT and cmd not in ("", "cd", "cd .")

    if step_id in ("step-02-scan-projects", "step-02-ls"):
        return _scan_projects_listing(cmd, entry_cwd, out, command_only=command_only)

    if step_id in ("step-03-enter-labs", "step-03-cd"):
        if not cmd.startswith("cd "):
            return False
        replayed_cwd = entry.get("cwd", "")
        if replayed_cwd == _LAB01_MISSION_DIR:
            return True
        return entry.get("exitCode", 1) == 0 and _is_cd_to_labs(cmd, replayed_cwd)

    if step_id == "step-04-find-mission":
        return _find_mission_listing(cmd, entry_cwd, out, command_only=command_only)

    if step_id == "step-05-read-mission":
        if cmd.startswith("cat ") and "mission.txt" in cmd:
            return command_only or "MISSION_READY=filesystem" in out or not out
        return "MISSION_READY=filesystem" in out

    if step_id == "step-01-inspect":
        return _inspect_deploy_permissions(cmd, out, command_only=command_only)

    if step_id == "step-02-chmod":
        return _chmod_deploy_executable(
            cmd, out, command_only=command_only, live_state=live_state
        )

    if step_id == "step-01-view-log":
        return _view_access_log(cmd, entry_cwd, out, command_only=command_only)

    if step_id == "step-02-grep-errors":
        return _grep_errors(cmd, out, command_only=command_only)

    if step_id == "step-03-count-errors":
        return _count_errors(cmd, out, command_only=command_only)

    if step_id == "step-01-start-worker":
        return _starts_background(cmd, "worker.sh")

    if step_id == "step-02-find-worker":
        return _find_process(cmd, "worker", out, command_only=command_only)

    if step_id == "step-03-stop-worker":
        return _stop_process(cmd, "worker", command_only=command_only)

    if step_id == "step-01-start-hang":
        return _starts_background(cmd, "hang.sh")

    if step_id == "step-02-sigterm":
        return _sigterm_hang(cmd, command_only=command_only)

    if step_id == "step-03-verify-gone":
        return _verify_process_gone(cmd, "hang", out, command_only=command_only)

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
    live_state: dict[str, Any] | None = None,
    command_only: bool = False,
) -> dict[str, Any]:
    """Grade every lab step; return per-step status and feedback for incomplete work."""
    steps: list[dict[str, Any]] = lab.get("steps", [])
    initial_cwd = lab.get("initialState", {}).get("cwd", _LAB01_ROOT)
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

    live_state = live_state or {}
    step_statuses: list[dict[str, Any]] = []
    completed_ids: list[str] = []

    worker_seen = any(
        _find_process("ps aux", "worker", _stdout_text(entry), command_only=False)
        for entry in graded_history
    )
    hang_sigterm = any(
        _sigterm_hang(normalize_command(entry.get("command", "")), command_only=False)
        for entry in graded_history
    )

    for step in steps:
        step_id = step.get("id", "")
        completed = any(
            _entry_matches_step(
                step,
                entry,
                command_only=command_only,
                live_state=live_state,
            )
            for entry in graded_history
        )
        if not completed and step_id in ("step-03-enter-labs", "step-03-cd"):
            if live_cwd == _LAB01_MISSION_DIR:
                completed = True
        if not completed and step_id == "step-04-find-mission":
            if live_cwd == _LAB01_MISSION_DIR and live_state.get("missionExists"):
                completed = True
        if not completed and step_id == "step-02-chmod" and live_state.get("deployExecutable"):
            completed = True
        if not completed and step_id == "step-01-start-worker":
            if any(
                _starts_background(normalize_command(entry.get("command", "")), "worker.sh")
                for entry in graded_history
            ):
                completed = True
        if not completed and step_id == "step-03-stop-worker":
            if worker_seen and not live_state.get("workerRunning"):
                completed = True
        if not completed and step_id == "step-01-start-hang":
            if any(
                _starts_background(normalize_command(entry.get("command", "")), "hang.sh")
                for entry in graded_history
            ):
                completed = True
        if not completed and step_id == "step-02-sigterm" and hang_sigterm:
            completed = True
        if not completed and step_id == "step-03-verify-gone":
            if hang_sigterm and not live_state.get("hangRunning"):
                completed = True
        if not completed and step_id == "step-01-view-log" and live_state.get("logExists"):
            if any(
                _view_access_log(
                    normalize_command(entry.get("command", "")),
                    entry.get("cwd", _LAB03_LOGS_DIR),
                    _stdout_text(entry),
                    command_only=command_only,
                )
                for entry in graded_history
            ):
                completed = True
            elif any(
                _is_listing_command(normalize_command(entry.get("command", "")))
                or normalize_command(entry.get("command", "")).startswith(("cat ", "head"))
                for entry in graded_history
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
