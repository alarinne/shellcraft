---
name: shellcraft-backend
description: Work on the ShellCraft FastAPI backend (backend/). Use when adding or changing API endpoints, lab JSON, the safe command engine, or the opt-in Docker sandbox — and whenever editing files under backend/. Covers conventions, the safety model, structure, commands, and testing.
---

# ShellCraft Backend

Specialized guidance for the FastAPI service under `backend/`. Pair this with the
root [`CLAUDE.md`](../../../CLAUDE.md) and [`backend/docs/`](../../../backend/docs/).

## Conventions

- Routes under `/api`; mirror [`docs/api-contract.md`](../../../docs/api-contract.md).
- App is built in `create_app()` (`app/main.py`); `app = create_app()` at module end.
- Pydantic models for request bodies; raise `HTTPException` for 4xx/5xx.
- Lab content is **data** in `app/labs/*.json`, loaded at startup.
- Tests with `pytest` + FastAPI `TestClient` (httpx). Every new module/route gets a test.

## Safety model (non-negotiable)

- Treat all command text as **untrusted strings**. The simulator path
  (`app/engine.py`) never executes a shell — it normalizes and matches against the
  step whitelist.
- Real execution happens **only** in the opt-in `DockerSandbox` (`app/sandbox.py`),
  which is **disabled by default** (`SHELLCRAFT_SANDBOX=1` to enable) and runs every
  command in a hardened, ephemeral container (ADR-0002):
  `--network none`, read-only rootfs + tmpfs workdir, non-root, `--cap-drop ALL`,
  `no-new-privileges`, pid/mem/cpu limits, exec timeout, `--rm`.
- `subprocess` is always called with a **list** of args — never `shell=True`,
  never interpolate user input into a host shell. The host Docker socket is never
  mounted into the lab image.

## Structure

```
backend/
  app/
    main.py        FastAPI app + routes (health, labs, commands/check, sandbox)
    engine.py      safe deterministic command checking
    sandbox.py     opt-in hardened Docker sandbox
    labs/*.json    lab content
  tests/           pytest + TestClient
  requirements.txt
  Dockerfile
```

## How to…

- **Add an endpoint:** define it inside `create_app()`, add a Pydantic model if it
  takes a body, and add a test in `tests/`.
- **Add a lab:** drop a JSON file in `app/labs/` (same shape as the frontend labs);
  it is picked up by `load_labs()` automatically.
- **Change command checking:** edit `app/engine.py` and keep it deterministic and
  shell-free; mirror the frontend `SimulatedBackend` so behavior is consistent.

## Commands

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # :8000  (docs at /docs)
pip install pytest httpx && pytest -q
```

## Definition of done

`pytest` green, a test for new code, the safety model upheld, and a
`docs/features/<n>-<slug>.md` entry.
