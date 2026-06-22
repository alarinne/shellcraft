# Backend Architecture

## Overview

A small FastAPI service that serves lab content and validates commands. It is the
server-side half of the hybrid execution strategy (ADR-0002): a deterministic
**safe engine** by default, plus an **opt-in hardened Docker sandbox** for real
execution.

```
HTTP /api ──> create_app() (main.py)
                ├─ GET  /api/health
                ├─ GET  /api/labs, /api/labs/{id}      ──> labs/*.json (load_labs)
                ├─ POST /api/commands/check            ──> engine.py (safe, no shell)
                └─ POST /api/sandbox/run               ──> sandbox.py (opt-in, hardened)
```

## Request flow: command check

`POST /api/commands/check` finds the lab + step, calls `engine.check_command`
(normalize + whitelist match), and resolves `nextStepId`. It never executes a
shell — the command is compared as a string. This mirrors the frontend
`SimulatedBackend` so behavior is consistent across the two backends.

## The Docker sandbox (safety)

`sandbox.py` is **disabled by default**. With `SHELLCRAFT_SANDBOX=1` and a Docker
daemon, each command runs in a fresh, hardened, ephemeral container:

- `--network none`, read-only rootfs + small `--tmpfs` workdir
- `--user 1000:1000`, `--cap-drop ALL`, `--security-opt no-new-privileges`
- `--pids-limit`, `--memory`, `--cpus`, per-exec timeout, `--rm`
- `subprocess` is always invoked with a **list** of args (never `shell=True`)
- the host Docker socket is never mounted into the lab image

`build_run_args` / `build_command` are pure and unit-tested, so the hardening is
verified without requiring Docker.

## Testing

`pytest` + FastAPI `TestClient` (httpx). Endpoints, the engine helpers, and the
sandbox hardening/disabled-by-default paths are covered without a Docker daemon,
so CI stays green.
