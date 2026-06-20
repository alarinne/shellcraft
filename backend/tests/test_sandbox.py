import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.sandbox import DockerSandbox, SandboxConfig, SandboxDisabled, build_command, build_run_args

client = TestClient(app)


def test_run_args_are_hardened():
    args = build_run_args(SandboxConfig())
    # Network isolation, read-only rootfs, dropped caps, no privilege escalation.
    assert "--network" in args and args[args.index("--network") + 1] == "none"
    assert "--read-only" in args
    assert args[args.index("--cap-drop") + 1] == "ALL"
    assert "no-new-privileges" in args
    assert args[args.index("--user") + 1] == "1000:1000"
    # Resource limits are present.
    assert "--pids-limit" in args and "--memory" in args and "--cpus" in args
    # The host docker socket is never mounted in.
    assert "/var/run/docker.sock" not in " ".join(args)


def test_build_command_passes_command_as_argument():
    argv = build_command(SandboxConfig(), "ls -la")
    # Command is an argument to /bin/sh -c, not interpolated into a host shell.
    assert argv[-3:] == ["/bin/sh", "-c", "ls -la"]


def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv("SHELLCRAFT_SANDBOX", raising=False)
    sandbox = DockerSandbox()
    assert sandbox.enabled is False
    with pytest.raises(SandboxDisabled):
        sandbox.run("ls")


def test_status_endpoint_reports_disabled(monkeypatch):
    monkeypatch.delenv("SHELLCRAFT_SANDBOX", raising=False)
    assert client.get("/api/sandbox/status").json() == {"enabled": False}


def test_run_endpoint_returns_503_when_disabled(monkeypatch):
    monkeypatch.delenv("SHELLCRAFT_SANDBOX", raising=False)
    res = client.post("/api/sandbox/run", json={"command": "ls"})
    assert res.status_code == 503
