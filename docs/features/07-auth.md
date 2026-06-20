# Feature: Auth — login/register with route guard

- **Issue:** #7
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** auth, frontend

## Why

The product wants user accounts so progress is tied to a learner. This adds a
working front-end auth layer now, designed to swap for a real API later.

## What changed

- **`AuthService`** — register / login / logout backed by an injectable
  `AUTH_STORAGE` (localStorage with in-memory fallback). Exposes `currentUser`
  and `isAuthenticated` signals. On sign-in it calls
  `ProgressService.useNamespace(user.id)` so **progress is per-user**.
- **`authGuard`** (`CanActivateFn`) protects `/path`, `/lab/:id`, `/complete`,
  redirecting guests to `/login?redirect=…`.
- **Login & Register pages** (`pages/auth/`) with signal-bound forms and inline
  errors.
- **App shell** shows the signed-in display name + Sign out, or a Sign in button
  for guests.

## Security note

This is a **front-end mock**, not real authentication — passwords are only run
through a non-cryptographic hash for the demo. The seam (`AuthService`) is built
so a real API/JWT backend can replace it without touching pages or the guard.

## Testing

- `auth.service.spec.ts`: register+sign-in, duplicate rejection, login
  correct/wrong, session restore in a new instance, password not stored in
  plain text.
- `auth.guard.spec.ts`: redirect when unauthenticated, allow when authenticated.
- `login.page.spec.ts`: renders the form, shows an error for bad credentials.
- `app.spec.ts` route-walk authenticates before hitting guarded routes.
- `npm run build` + `npx ng test --watch=false` green (14 files, 45 tests).

## Follow-ups

- Replace the mock with the FastAPI backend (#8) auth once added there.
