# Feature: Hardened ephemeral Docker sandbox execution backend

- **Issue:** #9
- **PR:** (this PR)
- **Status:** Shipped (opt-in, disabled by default)
- **Area:** backend

## Why

The hybrid execution decision (ADR-0002) calls for a *real* Linux shell for
advanced/quest labs. This adds the `DockerSandboxBackend` half — the only place
real commands ever run — without compromising the safe-by-default MVP.

## What changed

- **`backend/app/sandbox.py`**:
  - `build_run_args()` / `build_command()` — **pure** functions that construct
    the hardened `docker run` argv (testable without Docker).
  - `DockerSandbox.run()` — runs one command in a fresh container and discards
    it; `subprocess` is always called with a **list** (never `shell=True`).
  - `SandboxConfig` — image, workdir, pids/memory/cpu limits, tmpfs size, exec
    timeout, max command length.
- **`backend/app/main.py`** — `GET /api/sandbox/status` and `POST
  /api/sandbox/run`, returning **503** unless explicitly enabled.
- Tests assert the hardening flags, the command-as-argument shape, disabled-by-
  default behavior, and the 503 responses.

## Safety / threat model (ADR-0002)

Disabled by default. Enable only with `SHELLCRAFT_SANDBOX=1` and a Docker daemon.
Every command runs with:

- `--network none` · `--read-only` rootfs + small `--tmpfs` workdir
- `--user 1000:1000` · `--cap-drop ALL` · `--security-opt no-new-privileges`
- `--pids-limit` · `--memory` · `--cpus` · per-exec timeout · `--rm`
- the host Docker socket is **never** mounted into the lab image

## Testing

5 sandbox tests (12 backend total) cover hardened args, command shaping,
disabled-by-default, the status endpoint, and the 503 path — all without
requiring Docker, so CI stays green. Verified in a local venv.

## Follow-ups

- Ship a pre-baked `shellcraft-lab` image and a per-session container lifecycle.
- Wire the Angular `ExecutionBackend` to call `/api/sandbox/run` for quest labs.
