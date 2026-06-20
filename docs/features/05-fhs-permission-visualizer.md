# Feature: Filesystem (FHS) & permission visualizer

- **Issue:** #5
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** frontend, visualization

## Why

The spec explicitly asks to *visualize* the filesystem and the permission model
instead of printing dry text. This is the UI/UX + visualization criterion.

## What changed

- **`PermissionGridComponent`** — renders a file's `rwx` model as owner/group/
  others rows of colored bit-cells. Reacts live to the simulated state, so a
  `chmod 755 deploy.sh` lights up the owner's `x` bit. Pure `parsePermissions()`
  helper is exported + tested.
- **`FilesystemMapComponent`** — an interactive FHS map: a breadcrumb of the
  current working directory (last segment highlighted) plus the entries inside
  it, reacting to `cd`/`ls`. Pure `pathSegments()` / `entriesIn()` helpers.
- **`LabPage`** shows the right visualizer based on the step's
  `visual.focus`: the permission grid for permission steps, the filesystem map
  otherwise.

## How it works

Both components are `OnPush` and bound to `LabEngine.state()` (a signal), so any
state change from a command re-renders them automatically.

## Testing

- `permission-grid.component.spec.ts`: `parsePermissions` for several modes; the
  component renders 9 cells with the correct ones enabled.
- `filesystem-map.component.spec.ts`: `pathSegments` / `entriesIn` helpers; the
  component renders the breadcrumb + direct children and highlights the cwd.
- `lab.page.spec.ts`: asserts the permission grid shows for the permissions lab.
- `npm run build` + `npx ng test --watch=false` green (10 files, 30 tests).

## Follow-ups

- #13 (signals) and #14 (pipes) add further visualizers behind the same pattern.
