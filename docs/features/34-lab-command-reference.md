# Feature: Lab command reference panel

- **Issue:** (direct to main)
- **PR:** TBD
- **Status:** Shipped
- **Area:** frontend

## Why

First-time learners opening a lab had tasks on the left and a visualizer on the
right, but no quick explanation of which commands to use or what they do. The
learning path cards listed command names without descriptions, and that context
was not shown on the lab workbench.

## What changed

- Extended the `Lab` model with a `commandGuide` array (`command`, `pattern`,
  `summary`, `detail[]`).
- Populated per-lab reference content in all five `lab-0X-*.ts` data files using
  abstract syntax (e.g. `cat <filename>`, `ls [flags]`).
- Added a **Command reference** inspector panel below the filesystem/visual map
  on the lab page, visible for every lab, with **Learn more** opening a dialog
  for flag breakdowns and deeper explanations.
- Documented `commandGuide` in `docs/lab-json-schema.md`.

## How it works

1. Each lab exports `commandGuide` alongside `steps` in
   `frontend/src/app/core/labs/`.
2. `LabPage` exposes `commandGuide()` as a computed signal from the active lab.
3. The inspector renders a `.sc-panel` with a green chip and clickable
   `.sc-command-guide-item` rows (abstract `pattern` + short `summary`).
4. Clicking **Learn more** opens `CommandGuideDialogComponent` with `detail[]`
   paragraphs (flags, signals, pipes, etc.).

## Testing

```bash
cd frontend && npx ng test --watch=false
cd frontend && npm run build
```

- `lab.page.spec.ts` asserts Lab 01 shows abstract patterns and opens the dialog.
- `command-guide-dialog.component.spec.ts` covers dialog rendering and close.

## Follow-ups

- Highlight the command relevant to the current step.
- Collapsible reference panel for smaller viewports.
- Sync `commandGuide` into backend `app/labs/*.json` if labs move to a shared API.
- Trap focus inside the dialog for full keyboard accessibility.
