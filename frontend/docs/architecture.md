# Frontend Architecture

## Overview

A thin **App shell** (persistent topbar + `<router-outlet>`) hosts lazy-loaded
standalone **page components**. Business logic lives in `core/` services; pages
and components are presentational and observe signals.

```
App shell ──> Router ──> page (landing | path | lab | complete | auth | signals | pipes)
                              │
                lab page ─────┼──> TerminalComponent ──┐
                              │                          ├─> LabEngine (signals)
                              ├──> FHS / permission viz ─┘        │
                              └──> Progress / Auth signals        ▼
                                                        ExecutionBackend (interface)
                                                        ├─ SimulatedBackend (default)
                                                        └─ DockerSandboxBackend (opt-in, via API)
```

## Routing

`app.routes.ts` declares lazy routes via `loadComponent`. Protected routes
(`/path`, `/lab/:id`, `/complete`) use `authGuard`. `withComponentInputBinding()`
maps `:id` to the `LabPage` `id` input.

## Execution model (ADR-0002)

Command evaluation sits behind the `ExecutionBackend` interface and the
`EXECUTION_BACKEND` token:

- **`SimulatedBackend`** (default) — deterministic, never runs a shell. Normalizes
  the command, matches the step whitelist, returns scripted output, and computes
  new state for `cd`/`chmod`.
- **`DockerSandboxBackend`** (opt-in) — calls the backend's hardened sandbox.

`LabEngine` holds the active lab, current step, simulated state, terminal history,
`progress`, and `completed` as signals, and advances on a correct command.

## Visualizers

`FilesystemMapComponent` and `PermissionGridComponent` are `OnPush` and bound to
`LabEngine.state()`, so any command effect re-renders them. The signals and pipes
visualizers are self-contained interactive components backed by pure, tested
logic (`process-signals.ts`, `pipeline.ts`).

## State persistence

- `ProgressService` — XP, badges, streak, completed labs behind an injectable
  `PROGRESS_STORAGE` (localStorage + in-memory fallback).
- `AuthService` — session + users behind `AUTH_STORAGE`; namespaces progress per
  user. Front-end mock today, swappable for a real API.

## Testing

Vitest via `@angular/build:unit-test`. Pure helpers are unit-tested directly;
components via `TestBed`; routing via `RouterTestingHarness`. Every component and
service ships a `*.spec.ts`.
