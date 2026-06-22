# CLAUDE.md — ShellCraft Project Rules

Guidance for Claude (and humans) working in this repository. Keep changes consistent with the conventions below.

## What ShellCraft Is

An interactive, visually polished trainer for learning Linux (CLI, filesystem, permissions, processes, pipes). Hackathon theme: **"Linux Gamified & Visualized."** Judged on UI/UX, interactivity/gamification, technical quality (Linux-way), and a complete, bug-free MVP — plus mandatory clean-run (Docker/install script), CI, and a README with media.

## Repository Layout

```
shellcraft/
  frontend/        Angular 21 app (standalone components + signals)
  backend/         FastAPI service (labs + safe command-check API)
  docs/
    adr/           Architecture Decision Records
    features/      One doc per shipped feature (see _TEMPLATE.md)
    api-contract.md, lab-json-schema.md
  screenshots/     README media
```

## Architecture Principles

- **Pluggable execution backend.** Command execution sits behind an `ExecutionBackend` interface.
  - `SimulatedBackend` (default): deterministic, never runs a real shell — guarantees safety, clean-run, and gradable labs.
  - `DockerSandboxBackend` (opt-in, feature-flagged): runs real commands inside a hardened, ephemeral container for free exploration / quest labs.
  - The terminal and lab engine depend on the interface, never on a concrete backend. See `docs/adr/ADR-0002`.
- **Data-driven labs.** Labs are JSON/TS data following `docs/lab-json-schema.md`, not hard-coded component arrays.
- **Modular pages.** Each screen is a routed standalone component under `frontend/src/app/pages/`. Shared logic lives in services under `frontend/src/app/core/`.

## Frontend Conventions (Angular 21)

- **Standalone components only** (no NgModules). Use `inject()` for DI.
- **Signals** for component state and derived values (`signal`, `computed`, `effect`); avoid manual subscriptions where a signal fits.
- **Modern control flow** in templates (`@if`, `@for`, `@switch`), not `*ngIf`/`*ngFor`.
- **SCSS** per component; reuse the dark theme tokens (blue / purple / orange / terminal-green accents).
- Keep components presentational; put business logic in services.
- Prefer `protected readonly` for template-facing members; `private` for internals.

## Backend Conventions (FastAPI)

- Routes under `/api`; mirror `docs/api-contract.md`.
- Treat all command text as **untrusted strings**. Never `eval`/`shell=True` on user input in the simulator path.
- The Docker sandbox is the only place real commands run, and only inside a hardened container (see ADR-0002).
- Tests with `pytest` + `httpx`.

## Safety Model (non-negotiable)

- The simulator must **never** execute user-entered commands on the host.
- Render lab content via framework bindings; no raw HTML injection.
- The Docker sandbox must be hardened: no network, read-only rootfs + tmpfs workdir, non-root, dropped caps, seccomp, pid/cpu/mem limits, exec timeout, `--rm`.

## Testing Rules

- **Every new component and service ships with a unit test** (`*.spec.ts` via Vitest for the frontend, `pytest` for the backend).
- A change is not "done" until `npm run build` and `npx ng test --watch=false` pass (and backend `pytest` when touched).
- Test behavior (rendered output, interactions, service contracts), not implementation details.

## Git & PR Workflow

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `ci/<slug>`, `docs/<slug>`.
- One issue → one branch → one PR. Reference the issue with `Closes #N`.
- Conventional commit subjects: `feat(frontend): …`, `fix(backend): …`, `docs: …`.
- **Every feature PR includes a doc** in `docs/features/` describing the change (and an ADR if it makes an architectural decision).
- Keep the default branch (`main`) releasable; never commit directly to it.

## Commands

```bash
# frontend
cd frontend && npm install
npm start                      # dev server on :4200
npm run build                  # production build
npx ng test --watch=false      # unit tests

# clean run (once infra lands)
docker compose up
```

## Definition of Done

- [ ] Code follows the conventions above.
- [ ] Unit tests added and passing; build green.
- [ ] `docs/features/<n>-<slug>.md` added; ADR added if an architectural decision was made.
- [ ] PR references its issue and explains the change.
