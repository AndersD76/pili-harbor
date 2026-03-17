import json
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_redis = None


def _is_enabled() -> bool:
    return bool(settings.REDIS_URL)


def get_redis():
    global _redis
    if not _is_enabled():
        return None
    if _redis is None:
        import redis.asyncio as redis
        pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
        _redis = redis.Redis(connection_pool=pool)
    return _redis


async def redis_set_json(key: str, data: dict[str, Any], ttl: int | None = None) -> None:
    r = get_redis()
    if not r:
        return
    value = json.dumps(data)
    if ttl:
        await r.setex(key, ttl, value)
    else:
        await r.set(key, value)


async def redis_get_json(key: str) -> dict[str, Any] | None:
    r = get_redis()
    if not r:
        return None
    value = await r.get(key)
    if value:
        return json.loads(value)
    return None


async def redis_publish(channel: str, data: dict[str, Any]) -> None:
    r = get_redis()
    if not r:
        return
    await r.publish(channel, json.dumps(data))
