# Feature: Docker sandbox grading hardening

- **Issue:** (branch `fix/docker-sandbox-grading`)
- **PR:** (pending)
- **Status:** Shipped on branch
- **Area:** frontend | backend | infra

## Why

Real Linux labs 01–05 exposed gaps between what learners type in the PTY and what
the grader recorded: tab completion truncated `cd labs` to `cd la`, piped grep
(`cat access.log | grep ERROR`) was rejected, PTY output mixed prompts with
counts, and history merge collapsed repeated `ls` in different directories.

## What changed

### Interactive PTY & cwd tracking

- **`terminal_ws.py`** — `docker exec -it` + login shell; proper controlling TTY;
  ANSI stripped from captured output; escape sequences ignored in command logging.
- **`backend/sandbox/Dockerfile`** — `readline`, `bash-completion`, and
  `PROMPT_COMMAND` writing cwd to `/tmp/.shellcraft-cwd` after each command.
- **`resolve_live_cwd()`** — prefers the deeper path when session cwd and shell
  cwd disagree (fixes tab-completion cwd drift).

### Grading (`lab_checker.py`)

- **Lab 01** — mission listing passes when cwd is `labs` even if PTY capture
  omits short `ls` output; `cd` steps use replayed cwd chain.
- **Lab 03** — accepts **both** direct and piped forms:
  - `grep ERROR access.log` **or** `cat access.log | grep ERROR`
  - `grep … | wc -l` / `grep -c` **or** `cat access.log | grep ERROR | wc -l`
- Count detection scans stdout lines for a lone `2` (PTY prompts no longer break
  grading).

### History merge (`sandbox.py`)

- Shell DEBUG-trap log merged with PTY history **in order**, matching by command
  text without collapsing duplicate `ls` in different directories.

### Frontend

- **`SandboxLiveState`** — deploy mode, worker/hang flags from container probes;
  Lab 02 permission map updates after `chmod`.
- **PTY WebSocket** — pushes `cwd` and `liveState` after each command; lab page
  uses **Check my work** for step status (no auto-check spam).
- **Lab workbench layout** — flexible grid columns so the filesystem map stays
  visible beside the terminal.

## How it works

1. Learner runs commands in xterm.js → WebSocket PTY → Alpine bash.
2. On Enter, backend logs command + captured stdout, reads shell cwd file, probes
   live lab state (file modes, running processes).
3. **Check my work** merges PTY history with container command log, replays `cd`
   chain, and grades each step with output-aware matchers.
4. Frontend updates filesystem map cwd and Lab 02 permissions from `liveState`.

## Testing

```bash
cd backend && pytest -q    # 45 tests
cd frontend && npx ng test --watch=false
```

Rebuild the sandbox image after Dockerfile changes:

```bash
docker build -t shellcraft-sandbox-lab-01:latest backend/sandbox
```

## Follow-ups

- Auto re-check after Enter (optional UX toggle).
- WebSocket proxy through Angular dev server for single-origin dev.
