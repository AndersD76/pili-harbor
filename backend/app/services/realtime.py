import asyncio
import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select, update
from starlette.websockets import WebSocket

from app.config import get_settings
from app.database import async_session
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.task import Task
from app.redis_client import get_redis, redis_publish

logger = logging.getLogger(__name__)
settings = get_settings()

# Active WebSocket connections per yard
active_connections: dict[str, list[WebSocket]] = {}


async def connect(yard_id: str, websocket: WebSocket) -> None:
    await websocket.accept()
    if yard_id not in active_connections:
        active_connections[yard_id] = []
    active_connections[yard_id].append(websocket)
    logger.info(f"WebSocket connected to yard {yard_id}. Total: {len(active_connections[yard_id])}")


async def disconnect(yard_id: str, websocket: WebSocket) -> None:
    if yard_id in active_connections:
        active_connections[yard_id].remove(websocket)
        if not active_connections[yard_id]:
            del active_connections[yard_id]
    logger.info(f"WebSocket disconnected from yard {yard_id}")


async def broadcast(yard_id: str, message: dict) -> None:
    """Send message to all connected clients for a yard."""
    if yard_id not in active_connections:
        return
    dead = []
    data = json.dumps(message)
    for ws in active_connections[yard_id]:
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections[yard_id].remove(ws)


async def redis_subscriber(tenant_id: str, yard_id: str) -> None:
    """Subscribe to Redis pub/sub channel and forward to WebSocket clients."""
    r = get_redis()
    pubsub = r.pubsub()
    channel = f"lokus:{tenant_id}:{yard_id}:events"
    await pubsub.subscribe(channel)

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await broadcast(yard_id, data)
    except asyncio.CancelledError:
        await pubsub.unsubscribe(channel)
        await pubsub.close()


async def check_missing_containers(tenant_id: str, yard_id: str) -> None:
    """Check for containers that have gone missing (Redis key expired)."""
    async with async_session() as db:
        result = await db.execute(
            select(Container).where(
                Container.yard_id == yard_id,
                Container.tenant_id == tenant_id,
                Container.status != "missing",
                Container.deleted_at.is_(None),
            )
        )
        containers = result.scalars().all()

        r = get_redis()
        for container in containers:
            key = f"lokus:{tenant_id}:{yard_id}:container:{container.id}:pos"
            exists = await r.exists(key)
            if not exists and container.last_seen_at:
                elapsed = (datetime.now(timezone.utc) - container.last_seen_at).total_seconds()
                if elapsed > settings.CONTAINER_TTL:
                    container.status = "missing"
                    await redis_publish(
                        f"lokus:{tenant_id}:{yard_id}:events",
                        {
                            "type": "alert",
                            "code": "CONTAINER_NOT_FOUND",
                            "entity_id": str(container.id),
                            "message": f"Container {container.code} sem sinal há mais de 5 minutos",
                        },
                    )

        await db.commit()


async def check_offline_forklifts(tenant_id: str, yard_id: str) -> None:
    """Check for forklifts that have gone offline."""
    async with async_session() as db:
        result = await db.execute(
            select(Forklift).where(
                Forklift.yard_id == yard_id,
                Forklift.tenant_id == tenant_id,
                Forklift.status != "offline",
                Forklift.status != "maintenance",
            )
        )
        forklifts = result.scalars().all()

        r = get_redis()
        for forklift in forklifts:
            key = f"lokus:{tenant_id}:{yard_id}:forklift:{forklift.id}:pos"
            exists = await r.exists(key)
            if not exists and forklift.last_seen_at:
                elapsed = (datetime.now(timezone.utc) - forklift.last_seen_at).total_seconds()
                if elapsed > settings.FORKLIFT_TTL:
                    forklift.status = "offline"
                    await redis_publish(
                        f"lokus:{tenant_id}:{yard_id}:events",
                        {
                            "type": "alert",
                            "code": "FORKLIFT_OFFLINE",
                            "entity_id": str(forklift.id),
                            "message": f"Empilhadeira {forklift.code} offline",
                        },
                    )

        await db.commit()


async def check_manifest_deadlines(tenant_id: str, yard_id: str) -> None:
    """Check manifests approaching deadline with pending tasks."""
    from app.models.manifest import Manifest

    async with async_session() as db:
        result = await db.execute(
            select(Manifest).where(
                Manifest.yard_id == yard_id,
                Manifest.tenant_id == tenant_id,
                Manifest.status == "active",
                Manifest.deadline_at.isnot(None),
            )
        )
        manifests = result.scalars().all()

        now = datetime.now(timezone.utc)
        for manifest in manifests:
            if manifest.deadline_at:
                remaining = (manifest.deadline_at - now).total_seconds()
                if 0 < remaining < 1800:  # Less than 30 minutes
                    # Check if there are pending tasks
                    tasks_result = await db.execute(
                        select(Task).where(
                            Task.manifest_id == manifest.id,
                            Task.status.notin_(["done", "cancelled"]),
                        )
                    )
                    pending_tasks = tasks_result.scalars().all()
                    if pending_tasks:
                        await redis_publish(
                            f"lokus:{tenant_id}:{yard_id}:events",
                            {
                                "type": "alert",
                                "code": "MANIFEST_DEADLINE",
                                "entity_id": str(manifest.id),
                                "message": f"Manifesto '{manifest.name}' com prazo em menos de 30 minutos e {len(pending_tasks)} tarefas pendentes",
                            },
                        )
