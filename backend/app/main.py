"""ShellCraft FastAPI service.

Composes the API from resource routers: static labs and the simulated command
engine, the opt-in Docker sandbox (ADR-0002), and the Postgres/Redis-backed
auth, progress, and settings features (ADR-0003).
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from . import __version__
from .api.routes import (
    auth,
    certificates,
    commands,
    labs,
    progress,
    sandbox,
    settings,
    users,
)
from .core.config import get_settings
from .labs_registry import get_labs
from .sandbox import sandbox_manager
from .terminal_ws import set_labs


def create_app() -> FastAPI:
    app = FastAPI(title="shellcraft-api", version=__version__)

    config = get_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # The terminal websocket shares the in-memory lab registry.
    set_labs(get_labs())

    @app.get("/api/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "shellcraft-api",
            "sandbox": sandbox_manager.status(),
        }

    app.include_router(labs.router)
    app.include_router(commands.router)
    app.include_router(sandbox.router)
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(progress.router)
    app.include_router(certificates.router)
    app.include_router(settings.router)

    @app.exception_handler(OperationalError)
    async def database_unavailable(_request: Request, _exc: OperationalError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={"detail": "database temporarily unavailable"},
        )

    return app


app = create_app()
