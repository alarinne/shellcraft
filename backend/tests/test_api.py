from fastapi.testclient import TestClient

from app.engine import check_command, next_step_id, normalize_command
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "shellcraft-api"}


def test_list_labs():
    res = client.get("/api/labs")
    assert res.status_code == 200
    ids = [lab["id"] for lab in res.json()]
    assert "lab-01" in ids and "lab-02" in ids


def test_get_lab_and_404():
    assert client.get("/api/labs/lab-02").json()["title"] == "Permissions"
    assert client.get("/api/labs/nope").status_code == 404


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
