# Feature: Project conventions & docs system

- **Issue:** #1
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** docs

## Why

The project needed an enforced structure so every contribution — human or
AI-assisted — stays consistent. Clean, modular, documented architecture is a
direct judging criterion (technical quality / Linux-way).

## What changed

- Added root **`CLAUDE.md`**: architecture principles (pluggable execution
  backend, data-driven labs, modular pages), Angular 21 conventions
  (standalone + signals + modern control flow), the safety model, testing rules
  (every component/service ships a unit test), and the git/PR workflow.
- Added **`CONTRIBUTING.md`**: the issue → branch → PR workflow and local dev
  commands.
- Added **`docs/features/`** with `_TEMPLATE.md` so every feature ships a doc.
- Added **`docs/adr/ADR-0002`** recording the hybrid execution-backend decision.

## How it works

`CLAUDE.md` is the single source of truth for conventions; `CONTRIBUTING.md`
points to it for workflow. Each subsequent feature PR copies
`docs/features/_TEMPLATE.md` to `docs/features/<n>-<slug>.md` and links any ADR.

## Testing

Docs-only change; no code paths affected. Existing build and unit tests remain
green.

## Follow-ups

Subsequent PRs (#2–#14) implement features under these conventions.
