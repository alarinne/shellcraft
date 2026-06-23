from app.lab_checker import check_lab_progress, replay_history, resolve_path


def test_resolve_path():
    assert resolve_path("/home/guest/lab-01", "labs") == "/home/guest/lab-01/labs"
    assert resolve_path("/home/guest/lab-01/labs", "..") == "/home/guest/lab-01"


def test_check_lab_progress_partial():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-01"},
        "steps": [
            {"id": "step-01-orient", "acceptedCommands": ["pwd"]},
            {"id": "step-02-scan-projects", "acceptedCommands": ["ls -la"]},
        ],
    }
    history = [
        {
            "command": "pwd",
            "stdout": ["/home/guest/lab-01"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["completed"] is False
    assert result["stepsCompleted"] == 1
    assert result["nextStepId"] == "step-02-scan-projects"


def test_check_lab_progress_accepts_ls_with_extra_flags():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-01"},
        "steps": [
            {"id": "step-04-find-mission", "acceptedCommands": ["ls -la"]},
        ],
    }
    history = [
        {
            "command": "cd labs",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
        {
            "command": "ls -lh",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01/labs",
        },
    ]
    result = check_lab_progress(lab, history, command_only=True)
    assert result["stepsCompleted"] == 1


def test_check_lab_progress_command_only_full_quest():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-01"},
        "steps": [
            {"id": "step-01-orient", "acceptedCommands": ["pwd"]},
            {"id": "step-02-scan-projects", "acceptedCommands": ["ls -la"]},
            {"id": "step-03-enter-labs", "acceptedCommands": ["cd labs"]},
            {"id": "step-04-find-mission", "acceptedCommands": ["ls -la"]},
            {"id": "step-05-read-mission", "acceptedCommands": ["cat mission.txt"]},
        ],
    }
    history = [
        {"command": "ls", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-01"},
        {"command": "pwd", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-01"},
        {"command": "cd labs/", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-01"},
        {"command": "ls", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-01/labs"},
        {
            "command": "cat mission.txt",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01/labs",
        },
    ]
    result = check_lab_progress(lab, history, command_only=True)
    assert result["stepsCompleted"] == 5
    assert result["completed"] is True


def test_check_lab_progress_accepts_plain_ls():
    lab = {
        "steps": [
            {"id": "step-01-orient", "acceptedCommands": ["pwd"]},
            {"id": "step-02-scan-projects", "acceptedCommands": ["ls -la"]},
            {"id": "step-03-enter-labs", "acceptedCommands": ["cd labs"]},
            {"id": "step-04-find-mission", "acceptedCommands": ["ls -la"]},
            {"id": "step-05-read-mission", "acceptedCommands": ["cat mission.txt"]},
        ],
    }
    history = [
        {
            "command": "ls",
            "stdout": ["labs"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
        {
            "command": "cd labs",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01/labs",
        },
        {
            "command": "ls",
            "stdout": ["mission.txt"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01/labs",
        },
        {
            "command": "cat mission.txt",
            "stdout": [
                "MISSION_READY=filesystem",
                "You found the mission file. Next stop: permissions.",
            ],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01/labs",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["stepsCompleted"] == 5
    assert result["completed"] is True


def test_replay_history_fixes_stale_cd_cwd():
    history = [
        {
            "command": "cd labs",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
        {
            "command": "ls",
            "stdout": ["mission.txt"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
    ]
    replayed = replay_history(history, "/home/guest/lab-01")
    assert replayed[0]["cwd"] == "/home/guest/lab-01/labs"
    assert replayed[1]["cwd"] == "/home/guest/lab-01/labs"


def test_check_returns_step_statuses_with_reasons():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-01"},
        "steps": [
            {"id": "step-01-orient", "prompt": "Check where this terminal session starts."},
            {"id": "step-02-scan-projects", "prompt": "List this directory and spot the labs folder."},
        ],
    }
    result = check_lab_progress(lab, [])
    assert result["completed"] is False
    assert len(result["stepStatuses"]) == 2
    assert result["stepStatuses"][0]["completed"] is False
    assert result["stepStatuses"][0]["reason"]
    assert "Not complete yet" in result["message"]


def test_step_03_matches_when_cd_entry_still_has_parent_cwd():
    lab = {
        "steps": [
            {"id": "step-03-enter-labs", "acceptedCommands": ["cd labs"]},
        ],
    }
    history = [
        {
            "command": "cd labs",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["stepsCompleted"] == 1


def test_step_03_matches_when_shell_cwd_is_labs_despite_partial_command():
    lab = {
        "steps": [
            {"id": "step-03-enter-labs", "acceptedCommands": ["cd labs"]},
        ],
    }
    history = [
        {
            "command": "cd la",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01/labs",
        },
    ]
    result = check_lab_progress(lab, history, live_cwd="/home/guest/lab-01/labs")
    assert result["stepsCompleted"] == 1


def test_step_02_accepts_ls_labs_path():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-01"},
        "steps": [{"id": "step-02-scan-projects"}],
    }
    for command in ("ls labs", "ls labs/", "ls ./labs", "ls  -la", "ls -l  labs"):
        stdout = (
            ["drwxr-xr-x 2 guest guest 4096 labs"]
            if "labs" in command.split()[-1] or command.endswith("-la")
            else ["labs"]
        )
        history = [
            {
                "command": command,
                "stdout": stdout,
                "stderr": [],
                "exitCode": 0,
                "cwd": "/home/guest/lab-01",
            },
        ]
        result = check_lab_progress(lab, history)
        assert result["stepsCompleted"] == 1, f"failed for: {command!r}"


def test_step_03_accepts_cd_labs_slash():
    lab = {"steps": [{"id": "step-03-enter-labs"}]}
    for command in ("cd labs/", "cd ./labs/", "cd  labs"):
        history = [
            {
                "command": command,
                "stdout": [],
                "stderr": [],
                "exitCode": 0,
                "cwd": "/home/guest/lab-01",
            },
        ]
        result = check_lab_progress(lab, history)
        assert result["stepsCompleted"] == 1, f"failed for: {command!r}"


def test_step_04_accepts_ls_mission_and_labs_path():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-01"},
        "steps": [{"id": "step-04-find-mission"}],
    }
    cases = [
        ("ls", "/home/guest/lab-01/labs", ["mission.txt"]),
        ("ls -l", "/home/guest/lab-01/labs", ["-rw-r--r-- 1 guest guest 160 mission.txt"]),
        ("ls mission.txt", "/home/guest/lab-01/labs", ["mission.txt"]),
        ("ls labs/", "/home/guest/lab-01", ["mission.txt"]),
        ("ls  -la", "/home/guest/lab-01/labs", ["drwxr-xr-x 2 guest guest 4096 .", "mission.txt"]),
    ]
    for command, cwd, stdout in cases:
        history = [
            {
                "command": command,
                "stdout": stdout,
                "stderr": [],
                "exitCode": 0,
                "cwd": cwd,
            },
        ]
        result = check_lab_progress(lab, history)
        assert result["stepsCompleted"] == 1, f"failed for: {command!r} @ {cwd}"


def test_check_lab_progress_out_of_order_history():
    lab = {
        "steps": [
            {"id": "step-01-orient", "acceptedCommands": ["pwd"]},
            {"id": "step-02-scan-projects", "acceptedCommands": ["ls -la"]},
        ],
    }
    history = [
        {
            "command": "ды",
            "stdout": [],
            "stderr": ["bash: line 1: ды: command not found"],
            "exitCode": 127,
            "cwd": "/home/guest/lab-01",
        },
        {
            "command": "ls -la",
            "stdout": ["drwxr-xr-x 2 guest guest 4096 labs"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
        {
            "command": "pwd",
            "stdout": ["/home/guest/lab-01"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-01",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["stepsCompleted"] == 2
    assert result["completed"] is True


def test_lab_02_permissions_quest():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-02"},
        "steps": [
            {"id": "step-01-inspect"},
            {"id": "step-02-chmod"},
        ],
    }
    history = [
        {
            "command": "ls -l deploy.sh",
            "stdout": ["-rw-r--r-- 1 learner learner 28 deploy.sh"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-02",
        },
        {
            "command": "chmod 755 deploy.sh",
            "stdout": [],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-02",
        },
    ]
    result = check_lab_progress(lab, history, command_only=True)
    assert result["completed"] is True


def test_lab_02_inspects_with_ls_lh_output():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-02"},
        "steps": [{"id": "step-01-inspect"}],
    }
    history = [
        {
            "command": "ls -lh deploy.sh",
            "stdout": ["-rw-r--r-- 1 learner learner 28 Jun  1 12:00 deploy.sh"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-02",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["stepsCompleted"] == 1


def test_lab_02_chmod_via_live_state():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-02"},
        "steps": [{"id": "step-02-chmod"}],
    }
    result = check_lab_progress(lab, [], live_state={"deployExecutable": True})
    assert result["completed"] is True


def test_lab_04_stop_when_worker_gone():
    lab = {
        "steps": [
            {"id": "step-02-find-worker"},
            {"id": "step-03-stop-worker"},
        ],
    }
    history = [
        {
            "command": "ps aux",
            "stdout": ["learner 37 /bin/sh ./worker.sh"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-04",
        },
    ]
    result = check_lab_progress(
        lab,
        history,
        live_state={"workerRunning": False},
    )
    assert result["stepsCompleted"] == 2


def test_lab_03_pipes_quest():
    lab = {
        "initialState": {"cwd": "/home/guest/lab-03/logs"},
        "steps": [
            {"id": "step-01-view-log"},
            {"id": "step-02-grep-errors"},
            {"id": "step-03-count-errors"},
        ],
    }
    history = [
        {
            "command": "cat access.log",
            "stdout": ["2026-06-01 ERROR disk full"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-03/logs",
        },
        {
            "command": "grep ERROR access.log",
            "stdout": ["2026-06-01 ERROR disk full", "2026-06-02 ERROR timeout"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-03/logs",
        },
        {
            "command": "grep ERROR access.log | wc -l",
            "stdout": ["2"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/lab-03/logs",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["completed"] is True


def test_lab_04_process_quest_command_only():
    lab = {
        "steps": [
            {"id": "step-01-start-worker"},
            {"id": "step-02-find-worker"},
            {"id": "step-03-stop-worker"},
        ],
    }
    history = [
        {"command": "./worker.sh &", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-04"},
        {"command": "ps aux | grep worker", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-04"},
        {"command": "pkill -f worker.sh", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-04"},
    ]
    result = check_lab_progress(lab, history, command_only=True)
    assert result["completed"] is True


def test_lab_05_signals_quest_command_only():
    lab = {
        "steps": [
            {"id": "step-01-start-hang"},
            {"id": "step-02-sigterm"},
            {"id": "step-03-verify-gone"},
        ],
    }
    history = [
        {"command": "./hang.sh &", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-05"},
        {"command": "kill -15 42", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-05"},
        {"command": "ps aux | grep hang", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/lab-05"},
    ]
    result = check_lab_progress(lab, history, command_only=True)
    assert result["completed"] is True

