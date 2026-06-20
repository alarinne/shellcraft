# Frontend Docs

Documentation for the ShellCraft **Angular 21** app (`frontend/`).

- [Architecture](architecture.md) — shell, routing, pages, core services, the
  pluggable execution backend, and visualizers.
- Conventions live in the root [`CLAUDE.md`](../../CLAUDE.md) and the
  [`shellcraft-frontend` skill](../../.claude/skills/shellcraft-frontend/SKILL.md).
- Cross-cutting docs (ADRs, API contract, lab schema) stay in the root
  [`docs/`](../../docs); per-feature change docs are in
  [`docs/features/`](../../docs/features).

## Run & test

```bash
cd frontend
npm install
npm start                      # http://localhost:4200
npm run build                  # production build
npx ng test --watch=false      # Vitest unit tests
```

## Stack

Angular 21 (standalone components + signals + modern control flow), SCSS dark
theme, Vitest. State is signal-based; there are no NgModules.

## Where things live

| Area | Path |
| --- | --- |
| Shell + routing | `src/app/app.ts`, `src/app/app.routes.ts` |
| Pages | `src/app/pages/` |
| Terminal & visualizers | `src/app/components/` |
| Lab engine + backends | `src/app/core/execution/` |
| Labs (data) | `src/app/core/labs/` |
| Progress / Auth | `src/app/core/progress/`, `src/app/core/auth/` |
