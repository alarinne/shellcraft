# Feature: FastAPI labs & safe command-check API

- **Issue:** #8
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** backend

## Why

`docs/api-contract.md` specified a FastAPI backend. Implementing it lets the
front end move from mocks to a real API and gives the CI backend job something
to test — the technical-implementation and reproducibility criteria.

## What changed

- **`backend/app/main.py`** — FastAPI app implementing `GET /api/health`,
  `GET /api/labs`, `GET /api/labs/{id}`, `POST /api/commands/check`, with CORS for
  the Angular dev origins.
- **`backend/app/engine.py`** — deterministic command checking (normalize +
  whitelist match + next-step resolution). **Never executes a shell.**
- **`backend/app/labs/*.json`** — lab content as JSON (per the planned design),
  loaded at startup.
- **`backend/tests/test_api.py`** — `pytest` + FastAPI `TestClient` (httpx).
- **`backend/Dockerfile`** — enables `docker compose --profile full up`.
- Rewrote `backend/README.md` with endpoints, run, and test instructions.

## How it works

`POST /api/commands/check` finds the lab + step, matches the command via the
engine, and returns `{correct, output, explanation, nextStepId}` — mirroring the
frontend `SimulatedBackend` so behavior is consistent across the hybrid backends
(ADR-0002).

## Testing

7 `pytest` tests cover health, lab listing, lab fetch + 404, correct/wrong
command checks (with next-step + hint), unknown-lab 404, and the engine helpers.
Verified green in a local venv; the CI backend job (added in #11) runs them
automatically once it detects `backend/requirements.txt`.

## Follow-ups

- #9 adds the hardened Docker sandbox backend behind the same boundary.
- Wire the Angular `ExecutionBackend` to call this API as an alternative to the
  in-browser simulator.
