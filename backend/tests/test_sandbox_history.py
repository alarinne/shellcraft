from unittest.mock import MagicMock

from app.sandbox import read_container_command_log, sandbox_manager


def test_read_container_command_log_parses_shell_history(monkeypatch):
    class Result:
        returncode = 0
        stdout = (
            "/home/guest/lab-01|ls\n"
            "/home/guest/lab-01|pwd\n"
            "/home/guest/lab-01|cd labs/\n"
            "/home/guest/lab-01/labs|cat mission.txt\n"
        )

    monkeypatch.setattr(
        "app.sandbox.subprocess.run",
        lambda *args, **kwargs: Result(),
    )

    entries = read_container_command_log("shellcraft-test")
    assert len(entries) == 4
    assert entries[2]["command"] == "cd labs/"
    assert entries[3]["cwd"] == "/home/guest/lab-01/labs"


def test_history_for_check_prefers_shell_log(monkeypatch):
    session = MagicMock()
    session.container_name = "shellcraft-test"
    session.history = []

    monkeypatch.setattr(
        "app.sandbox.read_container_command_log",
        lambda _name: [
            {
                "command": "pwd",
                "stdout": [],
                "stderr": [],
                "exitCode": 0,
                "cwd": "/home/guest/lab-01",
            }
        ],
    )

    history, command_only = sandbox_manager.history_for_check(session)
    assert command_only is True
    assert history[0]["command"] == "pwd"
