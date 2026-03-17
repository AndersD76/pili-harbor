import json
from typing import Any

import redis.asyncio as redis

from app.config import get_settings

settings = get_settings()

pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=pool)


async def redis_set_json(key: str, data: dict[str, Any], ttl: int | None = None) -> None:
    r = get_redis()
    value = json.dumps(data)
    if ttl:
        await r.setex(key, ttl, value)
    else:
        await r.set(key, value)


async def redis_get_json(key: str) -> dict[str, Any] | None:
    r = get_redis()
    value = await r.get(key)
    if value:
        return json.loads(value)
    return None


async def redis_publish(channel: str, data: dict[str, Any]) -> None:
    r = get_redis()
    await r.publish(channel, json.dumps(data))
