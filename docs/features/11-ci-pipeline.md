# Feature: GitHub Actions build & test pipeline

- **Issue:** #11
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** ci

## Why

No CI existed. Automated build + test on every PR guards the technical-quality
and completeness criteria and keeps `main` releasable.

## What changed

- `.github/workflows/ci.yml` with two jobs:
  - **frontend** — `npm ci`, `npm run build`, `npx ng test --watch=false`
    (Node 22, npm cache keyed on `frontend/package-lock.json`).
  - **backend** — detects `backend/requirements.txt`/`pyproject.toml` and runs
    `pytest`; skips cleanly until the backend lands (#8).
- Runs on PRs and pushes to `main`/`dev`, with in-progress run cancellation.

## How it works

The backend job uses a detect step so the workflow is green now (frontend only)
and automatically starts testing the backend once it exists — no later workflow
edit required.

## Testing

Validated locally that the frontend commands the workflow runs are green
(`npm run build`, `npx ng test --watch=false`). The workflow itself is exercised
by GitHub Actions on this PR.

## Follow-ups

- #8 adds backend tests, which this workflow picks up automatically.
