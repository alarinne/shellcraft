# Feature: Postgres + Redis Persistence (backend auth, progress, settings)

- **Issue:** #<n>
- **PR:** #<n>
- **Status:** Shipped
- **Area:** backend | infra

## Why

The MVP stored accounts and progress only in browser `localStorage`, so nothing
was durable or shared across devices and passwords were hashed client-side. To
support real accounts and persistent gamification (XP, levels, completed labs,
settings), the backend needs a database and a real authentication flow. This
strengthens the technical-quality and completeness judging criteria.

## What changed

- **Postgres** (async SQLAlchemy 2.0 + Alembic) is now the system of record for
  per-user data: users, experience (XP/level), per-lab progress, and settings.
  Lab definitions stay as static files; only per-user data is persisted.
- **Redis** stores server-side sessions; login sets an `httpOnly` session cookie
  mapped to a Redis key with a sliding TTL. Logout revokes the session.
- New endpoints under `/api`:
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
    `GET /api/auth/me`
  - `GET /api/users/me`
  - `GET /api/progress`, `POST /api/progress/{labId}/complete` (awards XP once)
  - `GET /api/settings`, `PUT /api/settings`
- `docker-compose.yml` gains `postgres` and `redis` services (healthchecked,
  `full` profile); the backend runs `alembic upgrade head` on startup.
- The FastAPI app was refactored into a layered package; existing labs/commands/
  sandbox routes moved into routers with identical paths.

## How it works

Layered backend (see `docs/adr/ADR-0003`):

```
core/        config (pydantic-settings), security (argon2, session ids)
db/          async engine + get_db, redis client + get_redis, declarative Base
models/      User, LabProgress, UserSettings (portable types)
schemas/     camelCase Pydantic request/response models
repositories/ pure CRUD over the ORM
services/    auth_service (register/login, XP award), session_service (Redis)
api/deps.py  get_db / get_redis / get_session_service / get_current_user
api/routes/  auth, users, progress, settings, labs, commands, sandbox
main.py      slim create_app() that includes the routers
```

Auth flow: `register`/`login` verify with Argon2id, mint an opaque session id in
Redis (`session:{id} -> user_id`, TTL refreshed on use), and set it as an
`httpOnly` cookie. `get_current_user` reads the cookie, resolves the session in
Redis, then loads the user from Postgres. `POST /progress/{labId}/complete`
grants the lab's XP only on first completion and recomputes the user's level.

Configuration is environment-driven (`backend/.env.example`): `DATABASE_URL`,
`REDIS_URL`, session cookie settings, and `XP_PER_LEVEL`. Migrations live in
`backend/alembic/`.

## Testing

Async tests run against in-memory SQLite (`aiosqlite`) with `fakeredis`, via
`httpx.AsyncClient` and FastAPI dependency overrides
(`backend/tests/conftest.py`):

- `test_auth.py` — register/login (email or name)/logout, session cookie,
  401 on protected routes, password validation, duplicate-email conflict.
- `test_progress.py` — auth gating, unknown-lab 404, XP award, idempotent
  re-completion (no double XP, attempts increment).
- `test_settings.py` — defaults, partial update + persistence, validation.

Run:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```

The migration is validated with `alembic upgrade head` / `alembic check`
(no drift against the models). Existing simulator/sandbox tests stay green.

## Follow-ups

- Wire the Angular frontend to these endpoints (replace the `localStorage` auth
  and progress mocks with API calls; send cookies with `withCredentials`).
- Persist richer attempt/score history and badges.
- Rotate session ids on login and add rate limiting for auth endpoints.
