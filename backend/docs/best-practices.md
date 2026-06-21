# Backend Best Practices

Standards for the ShellCraft FastAPI service. Enforced by Ruff + mypy; see also
the [`shellcraft-backend` skill](../../.claude/skills/shellcraft-backend/SKILL.md).

## Application structure

- Build the app in an **`create_app()` factory**; expose `app = create_app()` for
  ASGI servers. This keeps tests able to construct isolated app instances.
- Group routes under `/api`; keep handlers thin and push logic into modules
  (`engine.py`, `sandbox.py`).
- Load data (labs) once at startup, not per request.

## Typing & models

- Use **Pydantic models** for request/response bodies; never accept raw dicts for
  validated input.
- Add type hints everywhere; `from __future__ import annotations` for clean
  forward refs.
- Return explicit types from handlers.

## Errors

- Raise `HTTPException` with correct status codes (`404` not found, `503` when a
  feature is disabled) and chain with `from exc`.
- Don't leak internals (stack traces, env, host paths) in responses.

## Security (untrusted input)

- Treat all command text as **untrusted strings**. The default path
  (`engine.py`) never runs a shell — it normalizes and matches a whitelist.
- Real execution only in the opt-in, hardened `DockerSandbox` (disabled by
  default). Always call `subprocess` with a **list** of args — never
  `shell=True`; never interpolate input into a host shell.
- Restrict CORS to known origins. Never mount the host Docker socket into the lab
  image.

## Async

- Use `async def` for I/O-bound handlers; keep CPU/blocking work (like
  `subprocess`) off the event loop or bounded by timeouts (the sandbox uses a
  hard `timeout`).

## Testing

- `pytest` + FastAPI `TestClient` (httpx). Test endpoints, the engine helpers,
  and the sandbox hardening/disabled paths — **without** requiring Docker.
- Use `monkeypatch` for environment-dependent behavior (e.g. the sandbox flag).

## Tooling

```bash
pip install -r requirements-dev.txt
ruff check .          # lint
ruff format .         # format
mypy app              # type-check
pytest                # tests
```

Config lives in `pyproject.toml` (`[tool.ruff]`, `[tool.mypy]`,
`[tool.pytest.ini_options]`).
