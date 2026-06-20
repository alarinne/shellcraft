# Feature: Docker Compose + install script for clean run

- **Issue:** #10
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** infra

## Why

A mandatory requirement: experts must run the project out of the box with no
long manual setup. This delivers a one-command clean run.

## What changed

- **`frontend/Dockerfile`** — multi-stage: build the Angular app with
  `node:22-alpine`, serve the static bundle with `nginx:1.27-alpine`; includes a
  healthcheck.
- **`frontend/nginx.conf`** — SPA fallback (`try_files … /index.html`) so router
  deep links like `/lab/lab-02` resolve; long-cache for hashed assets.
- **`frontend/.dockerignore`** — keeps `node_modules`/`dist` out of the build
  context.
- **`docker-compose.yml`** — `frontend` on `:4200`; a profile-gated `backend`
  service ready for #8 (`docker compose --profile full up`).
- **`run.sh`** — one-command bootstrap: Docker if available, else a local npm
  dev server (`./run.sh [auto|docker|local]`).

## How it works

`docker compose up --build` builds the Angular bundle and serves it via nginx at
`http://localhost:4200`. The backend is profile-gated so the default `up` works
today and the full stack turns on once the backend Dockerfile exists.

## Testing

The build steps mirror the verified frontend build (`npm ci`, `npm run build`,
output `dist/frontend/browser`). Compose config is schema-valid; the backend
service is profile-gated to avoid building a not-yet-present image.

## Follow-ups

- #8 adds `backend/Dockerfile`, enabling `--profile full`.
- #12 documents the clean-run path in the README.
