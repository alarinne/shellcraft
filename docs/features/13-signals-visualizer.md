# Feature: Process & signals visualizer (SIGTERM vs SIGKILL)

- **Issue:** #13
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** visualization

## Why

The spec calls out a process manager that visually explains signals like
SIGKILL vs SIGTERM — a bonus interactivity/visualization win.

## What changed

- **`process-signals.ts`** — a deterministic model: `Proc`, the `SIGNALS` table
  (number + catchable), and a pure `applySignal(proc, signal)` returning the new
  state + an explanation.
- **`SignalsVisualizerComponent`** — pick a signal, send it to a process row,
  and watch the status change (running → stopped/terminated) with an explanation
  log. SIGTERM lets catchable processes exit gracefully; SIGKILL/SIGSTOP cannot
  be caught.
- **`SignalsPage`** at route `/signals`, linked from the shell nav.

## How it works

The component holds process and log signals; `send(pid)` maps the selected
signal through `applySignal` and prepends the outcome to the log. All logic is
pure and unit-tested independently of the UI.

## Testing

- `process-signals.spec.ts`: SIGKILL (forced), SIGTERM graceful vs uncatchable,
  SIGSTOP/SIGCONT, and the already-terminated no-op.
- `signals-visualizer.component.spec.ts`: renders the picker + 3 processes, and
  sending a signal terminates a process and logs it.
- `npm run build` + `npx ng test --watch=false` green (16 files, 52 tests).
