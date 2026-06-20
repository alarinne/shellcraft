# Feature: Frontend & backend Claude skills + separated area docs

- **Issue:** #29
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** docs

## Why

Claude Code (and contributors) should get area-specific guidance, and docs should
live next to the code they describe instead of only at the root.

## What changed

- **Project Claude skills** under `.claude/skills/` (auto-discovered):
  - `shellcraft-frontend` — Angular 21 conventions, structure, how to add a
    page/lab/visualizer, testing, commands.
  - `shellcraft-backend` — FastAPI structure, the safe engine, the opt-in
    hardened Docker sandbox, testing, commands.
- **Separated docs**:
  - `frontend/docs/` — `README.md` + `architecture.md`.
  - `backend/docs/` — `README.md` + `architecture.md`.
  - The root `docs/` stays for cross-cutting material (ADRs, API contract, lab
    schema, per-feature change docs).
- Ignored user-local `.claude/settings.local.json` (skills stay tracked).

## Testing

Docs/tooling only — no source or build changes.

## Follow-ups

- Skills can be promoted into a shareable plugin if the team wants them outside
  this repo.
