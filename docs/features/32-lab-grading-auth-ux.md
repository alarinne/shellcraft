# Feature: Docker lab grading fixes and auth UX

- **Issue:** (branch `fix/docker-lab-grading`)
- **PR:** (pending)
- **Status:** Shipped on branch
- **Area:** frontend | backend

## Why

Learners starting background workers with `bash worker.sh &` were marked incomplete
because the DEBUG trap omits `&` from logged commands. The path and auth screens also
showed static terminal previews, weak registration passwords were accepted, and
Settings cluttered the shell navigation.

## What changed

### Backend (`lab_checker.py`, `terminal_ws.py`)

- Accept `bash`/`sh` script launches without a trailing `&` in history logs.
- Mark the worker start step complete when `ps` shows the process.
- Harden lab-03 pipe grading when PTY capture omits short grep output.

### Backend (`password_policy.py`, `auth_service.py`, `main.py`)

- Registration passwords must include upper, lower, digit, and symbol (8–128 chars).
- Map Postgres `IntegrityError` on duplicate email to 409; `OperationalError` to 503.

### Frontend

- **Path page:** dynamic `whoami` and `ls learning_path` with all five labs and progress markers.
- **Auth page:** client-side validation, masked `echo $SHELLCRAFT_PASS` preview (length-accurate).
- **Shell:** remove Settings from top bar and footer (route remains for direct access).

## Testing

```bash
cd backend && pytest -q
cd frontend && npx ng test --watch=false
```

## Follow-ups

- Re-enable Settings in nav when preferences UI is product-ready.
- Auto re-check Docker labs after each command (optional UX toggle).
