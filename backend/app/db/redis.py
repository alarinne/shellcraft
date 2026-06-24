"""Async Redis client and FastAPI dependency for session storage."""

from __future__ import annotations

from redis.asyncio import Redis, from_url

from ..core.config import get_settings

_client: Redis | None = None


def get_redis_client() -> Redis:
    """Return a lazily-created, process-wide Redis client (decoded strings)."""
    global _client
    if _client is None:
        _client = from_url(get_settings().redis_url, decode_responses=True)
    return _client


async def get_redis() -> Redis:
    """FastAPI dependency yielding the shared Redis client."""
    return get_redis_client()
