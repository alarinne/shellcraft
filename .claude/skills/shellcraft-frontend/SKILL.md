---
name: shellcraft-frontend
description: Work on the ShellCraft Angular 21 frontend (frontend/). Use when adding or changing pages, the interactive terminal, visualizers, the lab engine/execution backends, progress, or auth — and whenever editing files under frontend/. Covers conventions, structure, commands, and testing.
---

# ShellCraft Frontend

Specialized guidance for the Angular 21 app under `frontend/`. Pair this with the
root [`CLAUDE.md`](../../../CLAUDE.md) and [`frontend/docs/`](../../../frontend/docs/).

## Conventions (non-negotiable)

- **Standalone components only** (no NgModules). Inject with `inject()`.
- **Signals** for state and derived values (`signal`, `computed`, `effect`).
- **Modern control flow** in templates (`@if`, `@for`, `@switch`) — never `*ngIf`/`*ngFor`.
- Component-scoped SCSS; shared look comes from global `src/styles.scss` (`.sc-*`).
- `protected readonly` for template-facing members; `private` for internals.
- **Every component/service ships a `*.spec.ts`.** Test rendered output and
  interactions, not implementation details.

## Structure

```
frontend/src/app/
  app.ts / app.shellcraft.html   shell: topbar + <router-outlet>
  app.routes.ts                  lazy routes (+ authGuard on protected ones)
  pages/                         routed screens (landing, path, lab, complete, auth, signals, pipes)
  components/                    terminal, visualizer (FHS/permission), signals, pipes
  core/
    execution/                   ExecutionBackend, SimulatedBackend, LabEngine, types
    labs/                        JSON-shaped lab data + registry
    progress/                    ProgressService (injectable storage)
    auth/                        AuthService + authGuard
```

## How to…

- **Add a page:** create `pages/<name>/<name>.page.ts` (+ `.html`), add a lazy
  route in `app.routes.ts` (`loadComponent`), add a `*.spec.ts`. Guard it with
  `canActivate: [authGuard]` if it needs a signed-in user.
- **Add a lab:** add a data file under `core/labs/` following
  `docs/lab-json-schema.md`, register it in `core/labs/index.ts`. The
  `SimulatedBackend` + `LabEngine` drive it automatically.
- **Add a visualizer:** an `OnPush` component bound to `LabEngine.state()` (a
  signal); keep parsing/logic in exported pure functions and unit-test them.
- **Execution backends:** depend on the `ExecutionBackend` interface +
  `EXECUTION_BACKEND` token, never a concrete backend (ADR-0002).

## Commands

```bash
cd frontend
npm install
npm start                      # dev server on :4200
npm run build                  # production build
npx ng test --watch=false      # Vitest unit tests
```

## Definition of done

Build + tests green, a `*.spec.ts` for new code, a `docs/features/<n>-<slug>.md`
entry, and the change follows the conventions above.
