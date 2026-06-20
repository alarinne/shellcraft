# Feature: Router-based navigation & page component split

- **Issue:** #2
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** frontend

## Why

The MVP swapped screens with a `signal<ScreenKey>` inside one ~280-line `App`
component. That blocked deep links, browser history, lazy loading, and
per-screen testing. Clean, modular architecture is a judging criterion.

## What changed

- Introduced **Angular Router** routes: `/` (landing), `/path`, `/lab/:id`,
  `/complete`, with a wildcard redirect.
- Split the monolith into four **standalone, lazy-loaded page components** under
  `src/app/pages/` (`landing`, `path`, `lab`, `complete`).
- `App` is now a thin **shell**: a persistent topbar (brand + nav with active
  highlighting via the router URL) plus a `<router-outlet>`.
- Moved shared mock data/types into `src/app/core/shellcraft-data.ts` (a
  transitional home; #3 replaces it with JSON-driven labs).
- Enabled `withComponentInputBinding()` so `LabPage` reads `:id` as a component
  input.

## How it works

`app.routes.ts` lazy-loads each page via `loadComponent`. The shell tracks the
active route with a `toSignal`-wrapped `NavigationEnd` stream to highlight nav
items. Page components own their own local state (e.g. `LabPage.selectedDemo`)
with signals. Global `styles.scss` (unscoped `.sc-*` classes) keeps every page
styled without per-component SCSS.

## Testing

- `app.spec.ts`: shell renders brand + nav; full route walk (landing → path →
  lab → complete) via `RouterTestingHarness`.
- One spec per page component (`landing`, `path`, `lab`, `complete`) covering
  render and key interaction (e.g. selecting a command updates the lab visual).
- `npm run build` and `npx ng test --watch=false` green (5 files, 8 tests).

## Follow-ups

- #3 replaces `core/shellcraft-data.ts` with JSON-driven labs behind the
  `ExecutionBackend` interface.
- Dead `app.html` / `app.scss` (unused alternate design) can be removed in a
  later cleanup.
