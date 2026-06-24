from unittest.mock import MagicMock

from app.sandbox import merge_command_histories, read_container_command_log, sandbox_manager


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


def test_merge_command_histories_combines_shell_and_pty():
    shell = [
        {"command": "./worker.sh &", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-04"},
        {"command": "pkill -f worker.sh", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-04"},
    ]
    pty = [
        {
            "command": "ps aux",
            "stdout": ["learner 37 /bin/sh ./worker.sh"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-04",
        },
    ]
    merged = merge_command_histories(pty, shell)
    commands = {entry["command"] for entry in merged}
    assert "./worker.sh &" in commands
    assert "pkill -f worker.sh" in commands
    assert "ps aux" in commands
    ps_entry = next(entry for entry in merged if entry["command"] == "ps aux")
    assert "worker.sh" in ps_entry["stdout"][0]


def test_history_for_check_prefers_pty_history(monkeypatch):
    session = MagicMock()
    session.container_name = "shellcraft-test"
    session.history = [
        MagicMock(
            as_dict=lambda: {
                "command": "ls -l deploy.sh",
                "stdout": ["-rw-r--r-- 1 learner learner 28 deploy.sh"],
                "stderr": [],
                "exitCode": 0,
                "cwd": "/home/guest/lab-02",
            }
        )
    ]

    monkeypatch.setattr(
        "app.sandbox.read_container_command_log",
        lambda _name: [{"command": "pwd", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/"}],
    )

    history, command_only = sandbox_manager.history_for_check(session)
    assert command_only is False
    ls_entry = next(entry for entry in history if entry["command"] == "ls -l deploy.sh")
    assert ls_entry["stdout"]


def test_history_for_check_falls_back_to_shell_log(monkeypatch):
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


def test_merge_command_histories_keeps_ls_in_different_directories():
    shell = [
        {"command": "ls", "stdout": [], "exitCode": 0, "cwd": "/home/guest/lab-01"},
        {"command": "cd labs/", "stdout": [], "exitCode": 0, "cwd": "/home/guest/lab-01"},
        {"command": "ls", "stdout": [], "exitCode": 0, "cwd": "/home/guest/lab-01/labs"},
    ]
    pty = [
        {"command": "ls", "stdout": ["labs"], "exitCode": 0, "cwd": "/home/guest/lab-01"},
        {"command": "cd labs/", "stdout": [], "exitCode": 0, "cwd": "/home/guest/lab-01/labs"},
        {"command": "ls", "stdout": ["mission.txt"], "exitCode": 0, "cwd": "/home/guest/lab-01/labs"},
    ]
    merged = merge_command_histories(pty, shell)
    assert len(merged) == 3
    assert merged[0]["stdout"] == ["labs"]
    assert merged[2]["stdout"] == ["mission.txt"]


def test_resolve_live_cwd_prefers_deeper_path():
    from app.sandbox import resolve_live_cwd

    assert resolve_live_cwd("/home/guest/lab-01/labs", "/home/guest/lab-01") == "/home/guest/lab-01/labs"
    assert resolve_live_cwd("/home/guest/lab-01", None) == "/home/guest/lab-01"
