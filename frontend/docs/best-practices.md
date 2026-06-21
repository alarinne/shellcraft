# Frontend Best Practices

Standards for the ShellCraft Angular 21 app. Enforced by `tsconfig` strictness
and Prettier; see also the [`shellcraft-frontend` skill](../../.claude/skills/shellcraft-frontend/SKILL.md).

## Components

- **Standalone only** — no NgModules. List dependencies in `imports`.
- Use **`inject()`** over constructor parameters for DI.
- Prefer **`ChangeDetectionStrategy.OnPush`** for presentational components.
- Keep components small and presentational; push logic into `core/` services.
- Expose template members as `protected readonly`; keep internals `private`.

## State with signals

- Use `signal`, `computed`, and `effect` for state and derived values.
- Treat signals as the source of truth; avoid mixing in manual `BehaviorSubject`
  state unless interoping with RxJS (`toSignal`).
- Keep `computed` pure — no side effects. Side effects belong in `effect`.
- Avoid storing derived data; compute it.

## Templates

- Modern control flow only: `@if`, `@for` (always `track`), `@switch`.
- Bind, never inject raw HTML; rely on Angular's sanitization. No
  `[innerHTML]` with untrusted content.
- Add ARIA labels and use semantic elements (the app already does for screens,
  forms, and the terminal input).

## Routing & performance

- **Lazy-load** routes with `loadComponent`.
- Guard protected routes (`authGuard`); keep guards pure functional `CanActivateFn`.
- Bind route params via `withComponentInputBinding()` rather than reading
  `ActivatedRoute` imperatively where possible.

## Services & architecture

- One responsibility per service (`LabEngine`, `ProgressService`, `AuthService`).
- Depend on **interfaces/tokens** (`EXECUTION_BACKEND`) not concretions (ADR-0002).
- Make persistence injectable (`PROGRESS_STORAGE`, `AUTH_STORAGE`) for testability.

## Testing

- Every component/service ships a `*.spec.ts`.
- Test behavior (rendered text, interactions, service contracts), not internals.
- Use `RouterTestingHarness` for routing, `TestBed` for components, and call pure
  helpers directly.

## Tooling

```bash
npm run format        # apply Prettier
npm run format:check  # verify formatting (CI-friendly)
npm run build
npx ng test --watch=false
```

`tsconfig.json` runs Angular's strict mode (`strict`, `strictTemplates`,
`noImplicitReturns`, …) — keep it on.
