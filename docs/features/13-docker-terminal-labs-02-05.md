# Feature: Docker terminal for Labs 02–05

- **Issue:** (branch `feat/docker-terminal-labs-02-05`)
- **PR:** https://github.com/alarinne/shellcraft/pull/42
- **Status:** Shipped on branch
- **Area:** frontend | backend | infra

## Why

Lab 01 proved the Docker PTY pattern works. Labs 02–05 extend the same Real Linux
experience across permissions, pipes/grep, processes, and signals — the rest of
the ShellCraft learning path.

## What changed

- **Unified sandbox image** (`backend/sandbox/Dockerfile`) — isolated trees per lab under `/home/guest/lab-01` … `lab-05`, seeded from `/opt/shellcraft-seeds` onto a **writable tmpfs** so `chmod` works.
- **`lab_checker.py`** — flexible graders for labs 02–05 (chmod, grep pipes,
  background jobs, pkill, SIGTERM).
- **Lab JSON + frontend TS** — `lab-03.json` … `lab-05.json` and matching
  `lab-03-pipes.ts` … `lab-05-signals.ts`.
- **API** — sandbox sessions allowed for `lab-01` … `lab-05`; container
  `--workdir` follows each lab's `initialState.cwd`.
- **Frontend** — `DOCKER_LAB_IDS` includes all labs; learning-path cards
  unlocked for labs 02–05.

## Lab topics

| Lab | Topic | Key commands |
|-----|-------|--------------|
| 02 | Permissions | `ls -l`, `stat`, `chmod 755` |
| 03 | Pipes & Grep | `cat`, `grep ERROR`, `\| wc -l` |
| 04 | Process Watch | `./worker.sh &`, `ps`, `pkill` |
| 05 | Signals | `./hang.sh &`, `kill -15`, `ps` verify |

## Run locally

```bash
docker build -t shellcraft-sandbox-lab-01:latest backend/sandbox
cd backend && SHELLCRAFT_SANDBOX=1 uvicorn app.main:app --reload
cd frontend && npm start
```

Open `/lab/lab-02` through `/lab/lab-05` — each shows **Real Linux** when the
sandbox is ready.

## Testing

```bash
cd backend && pytest -q
cd frontend && npx ng test --watch=false
```

## Follow-ups

- Per-lab sandbox images if unified image grows too large.
- Live output capture for richer grading (beyond command-only PTY log).
- Unlock progressive path gating (complete lab N before lab N+1).
