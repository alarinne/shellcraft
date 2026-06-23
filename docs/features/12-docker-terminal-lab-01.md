# Feature: Docker terminal for Lab 01

- **Issue:** (branch `feat/docker-terminal-lab-01`)
- **PR:** https://github.com/alarinne/shellcraft/pull/41
- **Status:** Shipped on branch
- **Area:** frontend | backend | infra

## Why

Judges want authentic Linux interactivity without sacrificing safety. Lab 01 runs
commands in a tiny Alpine container (64 MB cap, no network, read-only root) while
the frontend and backend record history and validate progress.

## What changed

- **`backend/sandbox/Dockerfile`** — minimal Alpine image with Lab 01 filesystem.
- **`backend/app/sandbox.py`** — session manager: start/stop containers, track cwd + history.
- **`backend/app/terminal_ws.py`** — WebSocket PTY bridge for real shell I/O (Tab, Ctrl+C, history).
- **`backend/app/lab_checker.py`** — flexible per-step history scan; accepts plain `ls`, `ls labs/`, trailing slashes on `cd`, and extra whitespace in flags.
- **API** — `POST /api/sandbox/sessions`, `…/exec`, `…/check`, `WS …/terminal`, `DELETE …`.
- **Frontend** — `PtyTerminalComponent` (xterm.js), `DockerLabSession`; Lab 01 uses Real Linux mode.
- **UX** — auto-check after each command, **Check my work** button, no Run button, layout polish.

## How it works

1. Backend starts with `SHELLCRAFT_SANDBOX=1` and the sandbox image built.
2. Lab 01 probes `/api/health`; if sandbox is ready, it creates a session (one container per learner).
3. Browser opens a WebSocket PTY to `…/terminal` — xterm.js sends/receives raw terminal bytes.
4. After each Enter, the backend logs the command, runs auto-check, and pushes progress over WS.
5. **Check my work** re-runs grading manually; **Complete lab** unlocks when all steps pass.
6. Reset or leaving the page destroys the container.

## Accepted command variants (Lab 01)

Docker grading uses output-aware matching, not an exact whitelist. These all count when run in the right directory:

| Step | Goal | Examples that pass |
|------|------|-------------------|
| 1 | Confirm start path | `pwd` |
| 2 | Spot `labs` in projects | `ls`, `ls -la`, `ls -l`, `ls labs`, `ls labs/`, `ls ./labs`, extra spaces (`ls  -la`) |
| 3 | Enter labs | `cd labs`, `cd labs/`, `cd ./labs`, `cd ./labs/` |
| 4 | Find `mission.txt` | `ls` in labs, `ls -la`, `ls mission.txt`, or `ls labs/` from projects when output shows the file |
| 5 | Read mission | `cat mission.txt`, `cat ./mission.txt` |

Simulated mode (non-Docker) still uses the `acceptedCommands` list in `lab-01.json` / `lab-01-filesystem.ts`, which mirrors the table above.

## Run locally

```bash
docker build -t shellcraft-sandbox-lab-01:latest backend/sandbox
cd backend && SHELLCRAFT_SANDBOX=1 uvicorn app.main:app --reload
cd frontend && npm start
```

Open http://localhost:4200/lab/lab-01 — you should see a **Real Linux** badge and an xterm terminal.

**Note:** In local dev the terminal WebSocket connects directly to `ws://localhost:8000` (the Angular dev proxy does not upgrade WebSockets). Both servers must be running.

## Testing

```bash
cd backend && pytest -q
cd frontend && npx ng test --watch=false
```

## Follow-ups

- Rate limiting on WebSocket and exec endpoints.
- Lab 02 sandbox image.
- Share one container pool for demo deployments.
