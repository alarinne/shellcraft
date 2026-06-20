# ADR-0002: Hybrid Pluggable Execution Backend

Date: 2026-06-21

## Status

Accepted

## Context

ShellCraft must feel like a *living* Linux trainer (interactivity is a judging
criterion) while also being safe, gradable, and runnable out of the box
(completeness + clean-run are also judged). These goals pull in opposite
directions:

- A pure **simulator** is safe, deterministic, gradable, and trivial to run, but
  commands are scripted — no free exploration, lower "wow."
- A real **per-session Docker container** gives an authentic shell and enables
  quest labs ("fix the server", "find the attacker's logs"), but adds a real
  security surface and requires a Docker daemon wired to the backend, which
  complicates the clean-run story.

We evaluated four options: simulator-only, Docker-sandbox-only, in-browser WASM
Linux, and a hybrid.

## Decision

Adopt a **hybrid** architecture behind a single `ExecutionBackend` interface:

```
ExecutionBackend.run(command, labState)
  -> { correct, output, explanation, nextStepId, newState }
```

- **`SimulatedBackend` (default).** Deterministic, never runs a real shell.
  Drives the guided, gradable labs. Guarantees safety, clean-run, and the
  completeness score. Ships first.
- **`DockerSandboxBackend` (opt-in, feature-flagged).** Runs real commands inside
  a hardened, ephemeral container for free exploration and quest labs. Added
  later; the system degrades gracefully to the simulator when Docker is absent.

The terminal and `LabEngine` depend only on the interface, never on a concrete
backend.

## Consequences

Positive:
- MVP is always runnable and gradable (simulator default).
- Real-shell "wow" is available without compromising the baseline.
- New backends (e.g. WASM) can be added behind the same seam.

Tradeoffs:
- Two execution paths to keep behaviorally consistent for shared labs.
- The Docker backend carries a real threat model that must be hardened.

## Docker sandbox threat model (for the opt-in backend)

The container that runs untrusted user commands MUST be locked down:

- `--network none` (no exfiltration / no crypto-mining reachability)
- read-only rootfs + a small writable `tmpfs` lab workdir
- non-root user, `--cap-drop ALL`, default seccomp profile, `--security-opt no-new-privileges`
- `--pids-limit`, `--memory`, `--cpus` caps and a per-exec timeout
- `--rm` and session-scoped lifecycle with forced cleanup
- never mount the host Docker socket into the lab image; the orchestrator owns Docker access

## Security Notes

The simulator path never executes user input. The sandbox path is the only place
real commands run, and only within the constraints above. Lab content is rendered
through framework bindings, never raw HTML.
