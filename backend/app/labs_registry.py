"""Static lab content loaded from ``app/labs/*.json`` at import time.

Lab definitions are data, not DB rows (only per-user progress is persisted).
Routers and the terminal websocket share this single in-memory registry.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

LABS_DIR = Path(__file__).parent / "labs"


def load_labs() -> dict[str, dict[str, Any]]:
    labs: dict[str, dict[str, Any]] = {}
    for path in sorted(LABS_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        labs[data["id"]] = data
    return labs


_labs: dict[str, dict[str, Any]] = load_labs()


def get_labs() -> dict[str, dict[str, Any]]:
    """Return the shared lab registry."""
    return _labs
