"""Application configuration loaded from the environment.

All settings have safe local-dev defaults so the API boots without a ``.env``
file; production and Docker override them via environment variables.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed settings sourced from the environment / ``.env``."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Persistence
    database_url: str = "postgresql+asyncpg://shellcraft:shellcraft@localhost:5432/shellcraft"
    redis_url: str = "redis://localhost:6379/0"

    # Session cookie
    session_cookie_name: str = "shellcraft_session"
    session_ttl_seconds: int = 60 * 60 * 24 * 7  # 7 days
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"

    # Gameplay
    xp_per_level: int = 500

    # Completion certificates
    certificate_signing_secret: str = Field(
        default="dev-certificate-secret-change-me",
        validation_alias="SHELLCRAFT_CERTIFICATE_SECRET",
    )
    public_app_url: str = Field(
        default="http://localhost:4200",
        validation_alias="SHELLCRAFT_PUBLIC_APP_URL",
    )

    # CORS
    allowed_origins: list[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]


@lru_cache
def get_settings() -> Settings:
    """Return the cached settings instance."""
    return Settings()
