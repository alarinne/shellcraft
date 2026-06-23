"""Opt-in hardened Docker sandbox for real Linux lab sessions (ADR-0002).

Enabled with ``SHELLCRAFT_SANDBOX=1``. Commands run only inside ephemeral
containers — never on the API host.
"""

from __future__ import annotations

import atexit
import os
import subprocess
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

from .engine import normalize_command
from .lab_checker import resolve_path

SANDBOX_ENABLED = os.environ.get("SHELLCRAFT_SANDBOX", "0") == "1"
SANDBOX_IMAGE = os.environ.get("SHELLCRAFT_SANDBOX_IMAGE", "shellcraft-sandbox-lab-01:latest")
SANDBOX_LAB_IDS = frozenset({"lab-01", "lab-02", "lab-03", "lab-04", "lab-05"})
EXEC_TIMEOUT_SEC = int(os.environ.get("SHELLCRAFT_SANDBOX_EXEC_TIMEOUT", "5"))
SESSION_TTL_SEC = int(os.environ.get("SHELLCRAFT_SANDBOX_SESSION_TTL", "600"))
CONTAINER_NAME_PREFIX = "shellcraft-"


@dataclass
class ExecRecord:
    command: str
    stdout: list[str]
    stderr: list[str]
    exit_code: int
    cwd: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "command": self.command,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "exitCode": self.exit_code,
            "cwd": self.cwd,
        }


@dataclass
class SandboxSession:
    session_id: str
    lab_id: str
    container_name: str
    cwd: str
    history: list[ExecRecord] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_used_at: float = field(default_factory=time.time)


class SandboxError(Exception):
    def __init__(self, message: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.status_code = status_code


class SandboxManager:
    def __init__(self) -> None:
        self._sessions: dict[str, SandboxSession] = {}
        self._lock = threading.Lock()
        self._cleanup_orphaned_containers()
        self._start_cleanup_thread()
        atexit.register(self.destroy_all_sessions)

    def is_enabled(self) -> bool:
        return SANDBOX_ENABLED

    def image_ready(self) -> bool:
        if not self._docker_available():
            return False
        result = subprocess.run(
            ["docker", "image", "inspect", SANDBOX_IMAGE],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.returncode == 0

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.is_enabled(),
            "imageReady": self.image_ready() if self.is_enabled() else False,
            "image": SANDBOX_IMAGE,
            "activeSessions": len(self._sessions),
        }

    def create_session(self, lab_id: str, initial_cwd: str) -> SandboxSession:
        if not self.is_enabled():
            raise SandboxError("Docker sandbox is disabled. Set SHELLCRAFT_SANDBOX=1.", 503)
        if lab_id not in SANDBOX_LAB_IDS:
            raise SandboxError(f"Sandbox is not available for lab {lab_id!r}.", 400)
        if not self.image_ready():
            raise SandboxError(
                f"Sandbox image {SANDBOX_IMAGE!r} not found. "
                "Build it with: docker build -t shellcraft-sandbox-lab-01 backend/sandbox",
                503,
            )

        session_id = uuid.uuid4().hex
        container_name = f"{CONTAINER_NAME_PREFIX}{session_id[:12]}"
        self._run_container(container_name, initial_cwd)

        session = SandboxSession(
            session_id=session_id,
            lab_id=lab_id,
            container_name=container_name,
            cwd=initial_cwd,
        )
        with self._lock:
            self._sessions[session_id] = session
        return session

    def exec_command(self, session_id: str, command: str) -> ExecRecord:
        session = self._get_session(session_id)
        session.last_used_at = time.time()
        normalized = normalize_command(command)
        if not normalized:
            record = ExecRecord(command=command, stdout=[], stderr=[], exit_code=0, cwd=session.cwd)
            session.history.append(record)
            return record

        if normalized.startswith("cd "):
            record = self._exec_cd(session, normalized)
        else:
            record = self._exec_in_container(session, normalized)

        session.history.append(record)
        return record

    def get_history(self, session_id: str) -> list[dict[str, Any]]:
        session = self._get_session(session_id)
        return [entry.as_dict() for entry in session.history]

    def get_session_info(self, session_id: str) -> SandboxSession:
        return self._get_session(session_id)

    def history_for_check(self, session: SandboxSession) -> tuple[list[dict[str, Any]], bool]:
        """Prefer the live shell command log; fall back to API-recorded PTY history."""
        shell_log = read_container_command_log(session.container_name)
        if shell_log:
            return shell_log, True
        return [entry.as_dict() for entry in session.history], False

    def destroy_session(self, session_id: str) -> None:
        with self._lock:
            session = self._sessions.pop(session_id, None)
        if session is None:
            return
        self._remove_container(session.container_name)

    def destroy_all_sessions(self) -> None:
        with self._lock:
            sessions = list(self._sessions.values())
            self._sessions.clear()
        for session in sessions:
            self._remove_container(session.container_name)

    def _get_session(self, session_id: str) -> SandboxSession:
        with self._lock:
            session = self._sessions.get(session_id)
        if session is None:
            raise SandboxError("Sandbox session not found.", 404)
        return session

    def _remove_container(self, name: str) -> None:
        subprocess.run(
            ["docker", "rm", "-f", name],
            capture_output=True,
            text=True,
            timeout=15,
        )

    def _cleanup_orphaned_containers(self) -> None:
        """Remove leftover sandbox containers after a backend restart or crash."""
        if not self._docker_available():
            return
        result = subprocess.run(
            [
                "docker",
                "ps",
                "-aq",
                "--filter",
                f"name={CONTAINER_NAME_PREFIX}",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode != 0:
            return
        tracked = {session.container_name for session in self._sessions.values()}
        for container_id in _lines(result.stdout):
            inspect = subprocess.run(
                ["docker", "inspect", "--format", "{{.Name}}", container_id],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if inspect.returncode != 0:
                continue
            name = inspect.stdout.strip().lstrip("/")
            if name.startswith(CONTAINER_NAME_PREFIX) and name not in tracked:
                self._remove_container(name)

    def _run_container(self, name: str, workdir: str = "/home/guest/lab-01") -> None:
        result = subprocess.run(
            [
                "docker",
                "run",
                "-d",
                "--rm",
                "--name",
                name,
                "--hostname",
                "linux-lab",
                "--network",
                "none",
                "--memory",
                "64m",
                "--memory-swap",
                "64m",
                "--pids-limit",
                "64",
                "--cpus",
                "0.5",
                "--read-only",
                "--tmpfs",
                "/tmp:exec,size=8m",
                "--security-opt",
                "no-new-privileges",
                "--cap-drop",
                "ALL",
                "--user",
                "learner",
                "--workdir",
                workdir,
                SANDBOX_IMAGE,
                "sleep",
                "infinity",
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise SandboxError(
                f"Failed to start sandbox container: {result.stderr.strip() or result.stdout.strip()}",
                503,
            )

    def _exec_in_container(self, session: SandboxSession, command: str) -> ExecRecord:
        result = subprocess.run(
            [
                "docker",
                "exec",
                "-w",
                session.cwd,
                session.container_name,
                "bash",
                "-c",
                command,
            ],
            capture_output=True,
            text=True,
            timeout=EXEC_TIMEOUT_SEC,
        )
        return ExecRecord(
            command=command,
            stdout=_lines(result.stdout),
            stderr=_lines(result.stderr),
            exit_code=result.returncode,
            cwd=session.cwd,
        )

    def _exec_cd(self, session: SandboxSession, command: str) -> ExecRecord:
        parts = command.split(" ", 1)
        target = parts[1] if len(parts) > 1 else "~"
        new_cwd = resolve_path(session.cwd, target)
        check = subprocess.run(
            [
                "docker",
                "exec",
                session.container_name,
                "test",
                "-d",
                new_cwd,
            ],
            capture_output=True,
            text=True,
            timeout=EXEC_TIMEOUT_SEC,
        )
        if check.returncode != 0:
            return ExecRecord(
                command=command,
                stdout=[],
                stderr=[f"bash: cd: {target}: No such file or directory"],
                exit_code=1,
                cwd=session.cwd,
            )

        session.cwd = new_cwd
        return ExecRecord(command=command, stdout=[], stderr=[], exit_code=0, cwd=session.cwd)

    def _docker_available(self) -> bool:
        result = subprocess.run(
            ["docker", "version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.returncode == 0

    def _start_cleanup_thread(self) -> None:
        def _loop() -> None:
            while True:
                time.sleep(60)
                self._cleanup_stale_sessions()

        thread = threading.Thread(target=_loop, daemon=True, name="sandbox-cleanup")
        thread.start()

    def _cleanup_stale_sessions(self) -> None:
        now = time.time()
        stale: list[str] = []
        with self._lock:
            for session_id, session in self._sessions.items():
                if now - session.last_used_at > SESSION_TTL_SEC:
                    stale.append(session_id)
        for session_id in stale:
            self.destroy_session(session_id)


def read_shell_cwd(container_name: str) -> str | None:
    """Read the interactive PTY shell cwd (written by PROMPT_COMMAND in the sandbox image)."""
    result = subprocess.run(
        ["docker", "exec", container_name, "cat", "/tmp/.shellcraft-cwd"],
        capture_output=True,
        text=True,
        timeout=2,
    )
    if result.returncode != 0:
        return None
    path = result.stdout.strip()
    return path if path.startswith("/") else None


def read_container_command_log(container_name: str) -> list[dict[str, Any]]:
    """Read commands executed in the interactive shell (DEBUG trap log)."""
    result = subprocess.run(
        ["docker", "exec", container_name, "cat", "/tmp/.shellcraft-history"],
        capture_output=True,
        text=True,
        timeout=2,
    )
    if result.returncode != 0:
        return []

    entries: list[dict[str, Any]] = []
    for line in result.stdout.splitlines():
        if "|" not in line:
            continue
        cwd, command = line.split("|", 1)
        command = command.strip()
        if not command:
            continue
        entries.append(
            {
                "command": command,
                "stdout": [],
                "stderr": [],
                "exitCode": 0,
                "cwd": cwd.strip(),
            }
        )
    return entries


def _lines(text: str) -> list[str]:
    if not text:
        return []
    return text.splitlines()


sandbox_manager = SandboxManager()
