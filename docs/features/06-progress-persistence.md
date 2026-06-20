# Feature: Progress & gamification persistence

- **Issue:** #6
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** frontend, gamification

## Why

XP/streak/badges were static numbers. Progress should persist and feel earned —
the gamification + completeness criteria.

## What changed

- **`ProgressService`** persists XP, completed labs, unlocked badges, and a daily
  streak. Behind an **injectable `PROGRESS_STORAGE`** (defaults to `localStorage`,
  falls back to an in-memory store when storage is unavailable). Exposes signals
  (`xp`, `completedCount`, `streak`, `badges`) and `isCompleted` / `isUnlocked` /
  `completeLab` / `reset`. Includes a `useNamespace()` hook for per-user scoping
  once auth lands (#7).
- **`LabPage`** records completion via an effect the moment `engine.completed()`
  flips true (idempotent — XP granted once).
- **`PathPage`** stats now come from `ProgressService` (labs completed, XP,
  streak), and lab cards show a "✓ Completed" badge.

## How it works

`completeLab(labId, xp)` adds the lab once, grants XP, unlocks the per-lab badge
plus a one-time **First Steps** badge, bumps the streak, and persists. Badges:
`first-steps`, `filesystem-explorer` (lab-01), `permission-core` (lab-02),
`pipe-plumber` (lab-03).

## Testing

- `progress.service.spec.ts`: empty start, XP+badges on completion, no
  double-count, prerequisite unlocking, persistence across instances (shared
  injected store), and reset.
- `npm run build` + `npx ng test --watch=false` green (11 files, 36 tests).

## Follow-ups

- #7 calls `useNamespace(userId)` so progress is per-account.
