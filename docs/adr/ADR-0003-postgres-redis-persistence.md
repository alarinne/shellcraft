# ADR-0003: Postgres + Redis Persistence and Server-Side Sessions

Date: 2026-06-24

## Status

Accepted

## Context

The MVP shipped with frontend-only accounts and progress: users, the session,
and completed labs all lived in browser `localStorage`
(`frontend/src/app/core/auth/auth.service.ts`,
`frontend/src/app/core/progress/lab-progress.ts`). That is fine for a guest demo
but cannot back real, durable accounts — progress is per-browser, passwords are
hashed client-side, and nothing is shared across devices.

We need server-side persistence for **users, experience (XP/level), per-lab
progress, and settings**, plus a real authentication flow. Two questions drove
the decision:

1. Where does durable data live? Lab *definitions* are static content
   (`backend/app/labs/*.json`) and should stay as files; only *per-user* data
   needs a database.
2. How are sessions tracked? Stateless JWTs vs. server-side sessions.

## Decision

- **Postgres** is the system of record for per-user data, accessed through
  **async SQLAlchemy 2.0** with **Alembic** migrations. Lab definitions remain
  static files; the database stores only progress/XP/settings keyed by user.
- **Redis** holds **server-side sessions**: login mints an opaque, random
  session id stored as `session:{id} -> user_id` with a sliding TTL, returned to
  the browser in an `httpOnly` cookie. No auth state lives in the cookie, so
  logout is a true server-side revocation (`DEL session:{id}`).
- Passwords are hashed with **Argon2id** on the backend; the client never sees a
  hash.
- The backend is organized in clear layers:
  `core` (config/security) -> `db` (engine/session/redis) -> `models` ->
  `repositories` (CRUD) -> `services` (auth/session domain logic) ->
  `api/routes` (HTTP). Routers depend on `api/deps.py` for `get_db`,
  `get_redis`, and `get_current_user`.

## Consequences

Positive:

- Durable, cross-device accounts and progress; XP is awarded once per lab.
- Sessions are revocable and expire server-side; cookies carry no secrets.
- The layered structure keeps HTTP, domain logic, and data access separable and
  testable; new resources slot in as a model + repo + schema + router.
- Portable column types (`Uuid`, `JSON`, non-native `Enum`) let the suite run on
  SQLite while production uses Postgres.

Tradeoffs:

- The backend now requires Postgres and Redis to run the full stack (added to
  `docker-compose` under the `full` profile with healthchecks).
- Two infrastructure dependencies to operate and migrate.

## Security Notes

- Argon2id password hashing; constant-ish time login that still verifies a dummy
  hash on unknown users.
- `httpOnly` session cookie; `Secure`/`SameSite` are configurable via settings.
- CORS allows credentials only for the configured frontend origins.
- This ADR does not change the command-execution safety model (ADR-0002): the
  simulator never runs user input, and the Docker sandbox stays hardened.
