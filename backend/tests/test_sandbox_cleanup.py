from unittest.mock import MagicMock, call, patch

from app.sandbox import CONTAINER_NAME_PREFIX, SandboxManager


def test_destroy_session_removes_container():
    manager = SandboxManager.__new__(SandboxManager)
    manager._sessions = {
        "sess-1": MagicMock(container_name=f"{CONTAINER_NAME_PREFIX}abc123"),
    }
    manager._lock = MagicMock()

    with patch("app.sandbox.subprocess.run") as run:
        manager.destroy_session("sess-1")

    run.assert_called_once_with(
        ["docker", "rm", "-f", f"{CONTAINER_NAME_PREFIX}abc123"],
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert manager._sessions == {}


def test_destroy_all_sessions_clears_every_container():
    manager = SandboxManager.__new__(SandboxManager)
    manager._sessions = {
        "a": MagicMock(container_name=f"{CONTAINER_NAME_PREFIX}aaa"),
        "b": MagicMock(container_name=f"{CONTAINER_NAME_PREFIX}bbb"),
    }
    manager._lock = MagicMock()

    with patch("app.sandbox.subprocess.run") as run:
        manager.destroy_all_sessions()

    assert manager._sessions == {}
    assert run.call_count == 2
    run.assert_has_calls(
        [
            call(
                ["docker", "rm", "-f", f"{CONTAINER_NAME_PREFIX}aaa"],
                capture_output=True,
                text=True,
                timeout=15,
            ),
            call(
                ["docker", "rm", "-f", f"{CONTAINER_NAME_PREFIX}bbb"],
                capture_output=True,
                text=True,
                timeout=15,
            ),
        ],
        any_order=True,
    )


def test_cleanup_orphaned_containers_removes_untracked_names():
    tracked_name = f"{CONTAINER_NAME_PREFIX}tracked"
    manager = SandboxManager.__new__(SandboxManager)
    manager._sessions = {"sess": MagicMock(container_name=tracked_name)}
    manager._lock = MagicMock()

    def fake_run(cmd, **kwargs):
        result = MagicMock()
        result.returncode = 0
        if cmd[:3] == ["docker", "ps", "-aq"]:
            result.stdout = "cid-1\ncid-2\n"
        elif cmd[:3] == ["docker", "inspect", "--format"]:
            container_id = cmd[4]
            result.stdout = (
                f"/{tracked_name}\n"
                if container_id == "cid-1"
                else f"/{CONTAINER_NAME_PREFIX}orphan\n"
            )
        return result

    with patch.object(manager, "_docker_available", return_value=True), patch(
        "app.sandbox.subprocess.run",
        side_effect=fake_run,
    ), patch.object(manager, "_remove_container") as remove:
        manager._cleanup_orphaned_containers()

    remove.assert_called_once_with(f"{CONTAINER_NAME_PREFIX}orphan")


def test_run_container_uses_auto_remove_flag():
    manager = SandboxManager.__new__(SandboxManager)

    with patch("app.sandbox.subprocess.run") as run:
        run.return_value = MagicMock(returncode=0, stdout="", stderr="")
        manager._run_container(f"{CONTAINER_NAME_PREFIX}test123", "lab-02", "/home/guest/lab-02")

    args = run.call_args.args[0]
    assert "--rm" in args
    assert "/home/guest/lab-02" in args
