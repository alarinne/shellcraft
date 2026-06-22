# Contributing to ShellCraft

Thanks for helping build ShellCraft. This guide covers the workflow; project rules live in [`CLAUDE.md`](./CLAUDE.md).

## Workflow: issue → branch → PR

1. **Issue** — every change starts as a GitHub issue describing context, scope, and acceptance criteria.
2. **Branch** off `main` using `feat/`, `fix/`, `chore/`, `ci/`, or `docs/` prefixes, e.g. `feat/interactive-terminal`.
3. **Implement** following [`CLAUDE.md`](./CLAUDE.md): standalone components + signals, data-driven labs, the pluggable execution backend, and the safety model.
4. **Document** the change in `docs/features/<n>-<slug>.md` (copy `docs/features/_TEMPLATE.md`). Add an ADR under `docs/adr/` if you make an architectural decision.
5. **Test** — add unit tests; keep the suite green.
6. **PR** — open a pull request that references the issue with `Closes #N` and summarizes the change. CI must pass.

## Local development

```bash
cd frontend
npm install
npm start                      # http://localhost:4200
npm run build                  # production build
npx ng test --watch=false      # unit tests
```

Backend (once present):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest
```

## Definition of Done

A change is done when:

- it follows the conventions in `CLAUDE.md`,
- it has unit tests and a green build,
- it ships a `docs/features/` doc (and an ADR if needed),
- the PR references its issue and CI is green.

## Clean run

The project must run out of the box. Once infra lands:

```bash
docker compose up
```
