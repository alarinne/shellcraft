# ShellCraft Backend

FastAPI service that serves lab content, validates simulated commands, and
(since ADR-0003) persists accounts, experience, progress, and settings in
Postgres with Redis-backed sessions. It implements the contract in
[`../docs/api-contract.md`](../docs/api-contract.md) and **never executes
user-entered commands** on the host (see the safety model in
[`../CLAUDE.md`](../CLAUDE.md) and ADR-0002).

## Endpoints

| Method | Path                            | Purpose                              |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/api/health`                   | Liveness check                       |
| GET    | `/api/labs`                     | Lab summaries                        |
| GET    | `/api/labs/{id}`                | Full lab definition                  |
| POST   | `/api/commands/check`           | Validate a command against a step    |
| POST   | `/api/auth/register`            | Create an account, start a session   |
| POST   | `/api/auth/login`               | Log in (email or name), set session  |
| POST   | `/api/auth/logout`              | Revoke the current session           |
| GET    | `/api/auth/me`                  | Current user (session required)      |
| GET    | `/api/users/me`                 | Current user profile                 |
| GET    | `/api/progress`                 | The user's per-lab progress          |
| POST   | `/api/progress/{labId}/complete`| Mark a lab complete, award XP        |
| GET    | `/api/settings`                 | The user's settings                  |
| PUT    | `/api/settings`                 | Update settings                      |

Lab content lives in `app/labs/*.json`. Per-user data lives in Postgres; only
session state lives in Redis. See `docs/adr/ADR-0003` for the architecture.

## Architecture

```
app/
  core/         config (pydantic-settings) + security (argon2, session ids)
  db/           async engine + get_db, redis client + get_redis, Base
  models/       User, LabProgress, UserSettings
  schemas/      camelCase Pydantic request/response models
  repositories/ pure CRUD over the ORM
  services/     auth_service (register/login, XP), session_service (Redis)
  api/          deps.py + routes/ (auth, users, progress, settings, labs, ...)
  main.py       slim create_app() that includes the routers
alembic/        async migrations (alembic upgrade head)
```

## Run locally

Persistence needs Postgres and Redis. The simplest path is the Docker stack
(`docker compose --profile full up --build`). To run the API directly, point it
at running Postgres/Redis instances:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                # adjust DATABASE_URL / REDIS_URL
alembic upgrade head                # apply migrations
uvicorn app.main:app --reload       # http://localhost:8000
```

### Configuration

Environment variables (see `.env.example`): `DATABASE_URL` (async, e.g.
`postgresql+asyncpg://...`), `REDIS_URL`, `SESSION_COOKIE_NAME`,
`SESSION_TTL_SECONDS`, `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_SAMESITE`,
`XP_PER_LEVEL`.

### Database migrations

```bash
alembic upgrade head                 # apply
alembic revision --autogenerate -m "describe change"
alembic check                        # detect model/migration drift
```

### Real Linux sandbox (Lab 01)

```bash
docker build -t shellcraft-sandbox-lab-01:latest sandbox
SHELLCRAFT_SANDBOX=1 uvicorn app.main:app --reload
```

Interactive docs at `http://localhost:8000/docs`.

## Test

Tests run against in-memory SQLite + fake Redis, so no services are required:

```bash
pip install -r requirements-dev.txt
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
