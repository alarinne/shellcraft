# Feature: Frontend & backend best practices + docs

- **Issue:** #31
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** docs

## Why

Codify and document the standards the app already follows, with tooling that
enforces them — the technical-quality / Linux-way criterion.

## What changed

- **Frontend:** Prettier config (`.prettierrc.json`, `.prettierignore`) and
  `format` / `format:check` npm scripts (Prettier was already a devDependency).
- **Backend:** `pyproject.toml` with Ruff, mypy, and pytest config, plus
  `requirements-dev.txt` (ruff, mypy, pytest, httpx).
- **Shared:** root `.editorconfig`.
- **Docs:** `frontend/docs/best-practices.md` and
  `backend/docs/best-practices.md`.

## Notes

In-flight code is **not** mass-reformatted here (it lives across the open PR
stack); the config + scripts are ready to apply once the stack lands. Frontend
`tsconfig` already runs Angular strict mode.

## Testing

Config/docs only — no source changes; the frontend build stays green.

## Follow-ups

- Add `format:check` (frontend) and `ruff check` (backend) steps to CI once the
  feature stack merges to `main`.
