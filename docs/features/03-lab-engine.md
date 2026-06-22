# Feature: JSON-driven labs + pluggable ExecutionBackend

- **Issue:** #3
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** frontend

## Why

Command behavior was hard-coded per demo. We need a real, safe core and a clean
seam for the hybrid execution strategy (ADR-0002) so the terminal (#4) and the
Docker sandbox (#9) can plug in without rewrites.

## What changed

- **Data-driven labs** under `core/labs/` (`lab-01-filesystem`,
  `lab-02-permissions`) following `docs/lab-json-schema.md`, with an `index.ts`
  registry (`getLab`, `LABS_BY_ID`).
- **`ExecutionBackend` interface** + `EXECUTION_BACKEND` DI token
  (`core/execution/execution-backend.ts`).
- **`SimulatedBackend`** (default): normalizes the typed command, matches it
  against the step whitelist, returns the scripted output, and computes a new
  state for `cd`/`chmod` so visualizers can react. Pure helpers
  (`normalizeCommand`, `resolvePath`, `octalToSymbolic`, `applyCommand`) are
  exported and unit-tested. **Never executes a shell.**
- **`LabEngine`** service: signals for the active lab, current step, simulated
  state, terminal history, `completed`, and `progress`; `submit()` evaluates a
  command via the active backend and advances on success.
- Registered the default backend in `app.config.ts`.

## How it works

```
LabEngine.submit(cmd)
  -> EXECUTION_BACKEND.run(cmd, { step, state })   // SimulatedBackend today
  -> { correct, output, explanation, newState }
  -> on correct: advance step; always: append to history
```

The terminal/UI depend only on `LabEngine` + the interface, never on a concrete
backend (ADR-0002).

## Testing

- `simulated-backend.spec.ts`: helpers (normalize, octal→symbolic, path resolve,
  cd/chmod state), and `run()` accept/reject + no-mutation.
- `lab-engine.spec.ts`: start state, wrong command doesn't advance, full
  step-through to completion, and reset.
- `npm run build` + `npx ng test --watch=false` green (7 files, 19 tests).

## Follow-ups

- #4 wires `LabEngine` into an interactive terminal component.
- #9 adds `DockerSandboxBackend` behind the same interface.
- The transitional `core/shellcraft-data.ts` can be retired once the pages
  consume `core/labs/` directly.
