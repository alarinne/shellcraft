"""Server-side session storage backed by Redis.

A session is an opaque id (set as an httpOnly cookie) mapped to a user id with
a sliding TTL. No session state lives in the cookie itself.
"""

from __future__ import annotations

from redis.asyncio import Redis

from ..core.security import generate_session_id

_KEY_PREFIX = "session:"


class SessionService:
    def __init__(self, redis: Redis, ttl_seconds: int) -> None:
        self._redis = redis
        self._ttl = ttl_seconds

    @staticmethod
    def _key(session_id: str) -> str:
        return f"{_KEY_PREFIX}{session_id}"

    async def create(self, user_id: str) -> str:
        """Persist a new session for ``user_id`` and return its id."""
        session_id = generate_session_id()
        await self._redis.set(self._key(session_id), user_id, ex=self._ttl)
        return session_id

    async def get_user_id(self, session_id: str) -> str | None:
        """Return the user id for ``session_id``, refreshing its TTL."""
        if not session_id:
            return None
        key = self._key(session_id)
        user_id = await self._redis.get(key)
        if user_id is None:
            return None
        await self._redis.expire(key, self._ttl)
        return user_id

    async def delete(self, session_id: str) -> None:
        if session_id:
            await self._redis.delete(self._key(session_id))
