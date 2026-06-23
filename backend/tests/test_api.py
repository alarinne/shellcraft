from fastapi.testclient import TestClient

from app.engine import check_command, next_step_id, normalize_command
from app.lab_checker import check_lab_progress
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "shellcraft-api"
    assert "sandbox" in body


def test_list_labs():
    res = client.get("/api/labs")
    assert res.status_code == 200
    ids = [lab["id"] for lab in res.json()]
    assert ids == ["lab-01", "lab-02", "lab-03", "lab-04", "lab-05"]


def test_get_lab_and_404():
    assert client.get("/api/labs/lab-02").json()["title"] == "Permissions"
    assert client.get("/api/labs/nope").status_code == 404


def test_lab_01_has_five_steps():
    lab = client.get("/api/labs/lab-01").json()
    assert lab["title"] == "Filesystem Quest"
    assert len(lab["steps"]) == 5


def test_check_correct_advances_step():
    res = client.post(
        "/api/commands/check",
        json={"labId": "lab-02", "stepId": "step-01-inspect", "command": "ls -l"},
    )
    body = res.json()
    assert body["correct"] is True
    assert body["nextStepId"] == "step-02-chmod"
    assert body["output"] == ["-rw-r--r-- 1 guest guest 913 deploy.sh"]


def test_check_wrong_stays_on_step_with_hint():
    res = client.post(
        "/api/commands/check",
        json={"labId": "lab-02", "stepId": "step-02-chmod", "command": "rm -rf /"},
    )
    body = res.json()
    assert body["correct"] is False
    assert body["nextStepId"] == "step-02-chmod"
    assert "7 = rwx" in body["explanation"]


def test_check_unknown_lab_404():
    res = client.post(
        "/api/commands/check",
        json={"labId": "nope", "stepId": "x", "command": "ls"},
    )
    assert res.status_code == 404


def test_engine_helpers():
    assert normalize_command("  ls   -la ") == "ls -la"
    lab = {"steps": [{"id": "a"}, {"id": "b"}]}
    assert next_step_id(lab, "a") == "b"
    assert next_step_id(lab, "b") is None
    step = {"acceptedCommands": ["pwd"], "expectedOutput": ["/x"], "explanation": "e"}
    assert check_command(step, "pwd")["correct"] is True
    assert check_command(step, "ls")["correct"] is False


def test_lab_checker_lab_01_full_quest():
    lab = client.get("/api/labs/lab-01").json()
    history = [
        {"command": "pwd", "stdout": ["/home/guest/projects"], "stderr": [], "exitCode": 0, "cwd": "/home/guest/projects"},
        {
            "command": "ls -la",
            "stdout": ["total 0", "drwxr-xr-x 2 guest guest 4096 labs"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/projects",
        },
        {"command": "cd labs", "stdout": [], "stderr": [], "exitCode": 0, "cwd": "/home/guest/projects/labs"},
        {
            "command": "ls -la",
            "stdout": ["-rw-r--r-- 1 guest guest 160 mission.txt"],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/projects/labs",
        },
        {
            "command": "cat mission.txt",
            "stdout": ["MISSION_READY=filesystem", "You found the mission file. Next stop: permissions."],
            "stderr": [],
            "exitCode": 0,
            "cwd": "/home/guest/projects/labs",
        },
    ]
    result = check_lab_progress(lab, history)
    assert result["completed"] is True
    assert result["stepsCompleted"] == 5


def test_sandbox_routes_disabled_by_default():
    res = client.post("/api/sandbox/sessions", json={"labId": "lab-01"})
    assert res.status_code == 503
