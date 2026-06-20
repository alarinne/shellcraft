# Feature: Interactive terminal with input, history & autocomplete

- **Issue:** #4
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** frontend

## Why

The previous "terminal" only showed canned output for preset demos. A living,
type-into terminal is the core interactivity criterion and turns the lab into a
real trainer.

## What changed

- New **`TerminalComponent`** (`components/terminal/`) bound to `LabEngine`:
  - type a command and press **Enter** to run it against the active step,
  - **↑ / ↓** to recall previously entered commands,
  - **Tab** to autocomplete against the step's accepted commands (longest common
    prefix when ambiguous),
  - scrollback that colors wrong attempts and shows a completion banner.
- **`LabPage` rewired** to be engine-driven: loads the lab from the route id via
  an `effect`, shows the live step prompt, a progress bar, a hint toggle, a
  reset, the embedded terminal, and a "Complete lab" button gated on completion.

## How it works

`TerminalComponent` injects the root `LabEngine`, calls `engine.submit()` on
Enter, and renders `engine.history()`. The prompt reflects `engine.state().cwd`.
`LabPage` no longer holds command data — it observes engine signals
(`currentStep`, `progress`, `completed`, `acceptedCommands`).

## Testing

- `terminal.component.spec.ts`: `commonPrefix` helper; run accepted command
  (advances + appends output), wrong command (error line, no advance), ↑ recall,
  Tab autocomplete.
- `lab.page.spec.ts`: loads default lab, renders first prompt + embeds the
  terminal, and the Complete button stays disabled until the lab finishes.
- `app.spec.ts` route-walk updated for the engine-driven prompt.
- `npm run build` + `npx ng test --watch=false` green (8 files, 24 tests).

## Follow-ups

- #5 adds the FHS/permission visualizers reacting to `engine.state()`.
- Unused `PERMISSION_ROWS`/`findLab` in `core/shellcraft-data.ts` can be pruned
  once all pages consume `core/labs/`.
