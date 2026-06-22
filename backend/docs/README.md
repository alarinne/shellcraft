# Backend Docs

Documentation for the ShellCraft **FastAPI** service (`backend/`).

- [Architecture](architecture.md) — app structure, request flow, the safe
  engine, and the opt-in Docker sandbox.
- API surface is the root [`docs/api-contract.md`](../../docs/api-contract.md).
- Conventions live in the root [`CLAUDE.md`](../../CLAUDE.md) and the
  [`shellcraft-backend` skill](../../.claude/skills/shellcraft-backend/SKILL.md).

## Run & test

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://localhost:8000  (docs at /docs)
pip install pytest httpx && pytest -q
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET | `/api/labs` | lab summaries |
| GET | `/api/labs/{id}` | full lab |
| POST | `/api/commands/check` | validate a command against a step |
| GET | `/api/sandbox/status` | whether the Docker sandbox is enabled |
| POST | `/api/sandbox/run` | run in the sandbox (503 unless enabled) |

## Stack

FastAPI + Pydantic, lab content as JSON, pytest + `TestClient`. Containerized via
`backend/Dockerfile` for `docker compose --profile full up`.
