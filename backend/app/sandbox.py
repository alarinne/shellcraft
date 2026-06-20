"""Hardened, opt-in Docker sandbox for running real lab commands.

This is the `DockerSandboxBackend` half of the hybrid execution strategy in
ADR-0002. It is **disabled by default** and only ever runs commands inside a
locked-down, network-isolated, ephemeral container — never on the host.

Enable it explicitly:

    export SHELLCRAFT_SANDBOX=1     # and a Docker daemon must be available

Security model (see ADR-0002):
  --network none · --read-only rootfs + small tmpfs workdir · non-root user ·
  --cap-drop ALL · no-new-privileges · pids/memory/cpu limits · exec timeout ·
  --rm. The host Docker socket is never mounted into the lab image.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass


class SandboxDisabled(RuntimeError):
    """Raised when the sandbox is invoked while disabled or unavailable."""


@dataclass(frozen=True)
class SandboxConfig:
    image: str = "shellcraft-lab:latest"
    workdir: str = "/work"
    pids_limit: int = 64
    memory: str = "128m"
    cpus: str = "0.5"
    tmpfs_size: str = "16m"
    timeout_seconds: int = 5
    max_command_length: int = 500


def is_enabled() -> bool:
    return os.environ.get("SHELLCRAFT_SANDBOX", "0") == "1"


def docker_available() -> bool:
    return shutil.which("docker") is not None


def build_run_args(config: SandboxConfig) -> list[str]:
    """Construct the hardened ``docker run`` arguments (without the command).

    Pure and deterministic so the hardening can be unit-tested without Docker.
    """
    return [
        "docker",
        "run",
        "--rm",
        "--network",
        "none",
        "--read-only",
        "--tmpfs",
        f"{config.workdir}:rw,size={config.tmpfs_size},mode=1777",
        "--workdir",
        config.workdir,
        "--user",
        "1000:1000",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--pids-limit",
        str(config.pids_limit),
        "--memory",
        config.memory,
        "--cpus",
        config.cpus,
        config.image,
    ]


def build_command(config: SandboxConfig, command: str) -> list[str]:
    """Full argv for one ephemeral run. The command is passed as an *argument*
    to ``/bin/sh -c`` inside the container — never interpolated into a host
    shell (``subprocess`` is always called with a list, never ``shell=True``)."""
    return [*build_run_args(config), "/bin/sh", "-c", command]


class DockerSandbox:
    """Runs a single command in a fresh hardened container, then discards it."""

    def __init__(self, config: SandboxConfig | None = None) -> None:
        self.config = config or SandboxConfig()

    @property
    def enabled(self) -> bool:
        return is_enabled()

    def run(self, command: str) -> dict:
        if not self.enabled:
            raise SandboxDisabled("sandbox is disabled (set SHELLCRAFT_SANDBOX=1)")
        if not docker_available():
            raise SandboxDisabled("docker is not available on this host")

        command = (command or "").strip()
        if not command:
            return {"ok": False, "exitCode": None, "output": ["empty command"]}
        if len(command) > self.config.max_command_length:
            return {"ok": False, "exitCode": None, "output": ["command too long"]}

        try:
            proc = subprocess.run(  # noqa: S603 - list args, never shell=True
                build_command(self.config, command),
                capture_output=True,
                text=True,
                timeout=self.config.timeout_seconds,
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "exitCode": None, "output": ["timed out"]}

        output = (proc.stdout + proc.stderr).splitlines()
        return {"ok": proc.returncode == 0, "exitCode": proc.returncode, "output": output}
