from unittest.mock import MagicMock, patch

from app.terminal_ws import _append_pty_history


def test_cd_history_uses_resolved_target_when_shell_cwd_file_is_stale():
    session = MagicMock()
    session.cwd = "/home/guest/projects"
    session.container_name = "shellcraft-test"
    session.lab_id = "lab-01"
    session.history = []

    with patch("app.terminal_ws.sandbox_manager") as mgr, patch(
        "app.terminal_ws.read_shell_cwd",
        return_value="/home/guest/projects",
    ):
        mgr.get_session_info.return_value = session
        result = _append_pty_history("session-1", "cd labs/", "")

    record = session.history[0]
    assert record.command == "cd labs/"
    assert record.cwd == "/home/guest/projects/labs"
    assert record.exit_code == 0
    assert result == {"cwd": "/home/guest/projects/labs"}


def test_non_cd_history_prefers_shell_cwd_file():
    session = MagicMock()
    session.cwd = "/home/guest/projects"
    session.container_name = "shellcraft-test"
    session.lab_id = "lab-01"
    session.history = []

    with patch("app.terminal_ws.sandbox_manager") as mgr, patch(
        "app.terminal_ws.read_shell_cwd",
        return_value="/home/guest/projects/labs",
    ):
        mgr.get_session_info.return_value = session
        _append_pty_history("session-1", "ls", "mission.txt\n")

    record = session.history[0]
    assert record.cwd == "/home/guest/projects/labs"
    assert record.stdout == ["mission.txt"]
