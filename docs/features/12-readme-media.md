# Feature: README screenshots/GIF, clean-run & architecture

- **Issue:** #12
- **PR:** (this PR)
- **Status:** Shipped
- **Area:** docs

## Why

The hackathon mandates a README with the idea, stack, step-by-step run, and
**visual media**. A clear README is also the first thing judges see.

## What changed

- Rewrote **`README.md`**: one-line pitch, feature table mapped to the judging
  axes, tech stack, three run paths (Docker / `run.sh` / local), build+test
  commands, an architecture section, project structure, the safety model, and a
  roadmap linking remaining issues.
- Added committed visual media in **`screenshots/`**:
  - `architecture.svg` — system diagram (frontend shell/engine/visualizers +
    pluggable execution backend + FastAPI + clean-run/CI).
  - `lab-screen.svg` — a styled view of the lab screen (terminal + permission
    grid) in the dark theme.
- Documented how to capture a live PNG/GIF from a running instance.

## Testing

Docs/media only — no code paths affected; build and tests remain green.

## Follow-ups

- Replace the SVG mockup with a live screen capture/GIF once a demo build is
  recorded.
