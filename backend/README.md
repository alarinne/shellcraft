# ShellCraft Backend

FastAPI service that serves lab content and validates simulated commands. It
implements the contract in [`../docs/api-contract.md`](../docs/api-contract.md)
and **never executes user-entered commands** on the host (see the safety model
in [`../CLAUDE.md`](../CLAUDE.md) and ADR-0002).

## Endpoints

| Method | Path                  | Purpose                          |
| ------ | --------------------- | -------------------------------- |
| GET    | `/api/health`         | Liveness check                   |
| GET    | `/api/labs`           | Lab summaries                    |
| GET    | `/api/labs/{id}`      | Full lab definition              |
| POST   | `/api/commands/check` | Validate a command against a step |

Lab content lives in `app/labs/*.json`.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://localhost:8000
```

### Real Linux sandbox (Lab 01)

```bash
docker build -t shellcraft-sandbox-lab-01:latest sandbox
SHELLCRAFT_SANDBOX=1 uvicorn app.main:app --reload
```

Interactive docs at `http://localhost:8000/docs`.

## Test

```bash
pip install pytest httpx
pytest -q
```

## Docker

Part of the full clean-run stack:

```bash
docker compose --profile full up --build
```

## `POST /api/commands/check`

Request:

```json
{ "labId": "lab-02", "stepId": "step-01-inspect", "command": "ls -l" }
```

Response:

```json
{
  "correct": true,
  "output": ["-rw-r--r-- 1 guest guest 913 deploy.sh"],
  "explanation": "The first column is the permission triplet ...",
  "nextStepId": "step-02-chmod"
}
```
