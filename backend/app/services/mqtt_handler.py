import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session
from app.models.anchor_node import AnchorNode
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.iot_node import IoTNode
from app.models.position_history import PositionHistory
from app.redis_client import get_redis, redis_get_json, redis_publish, redis_set_json
from app.services.position_engine import (
    Point,
    RSSIReading,
    calculate_confidence,
    smooth_position,
    trilaterate,
)

logger = logging.getLogger(__name__)
settings = get_settings()


async def handle_rssi(tenant_id: str, yard_id: str, payload: dict) -> None:
    """Process RSSI readings from gateway."""
    readings_raw = payload.get("readings", [])
    reporter_mac = payload.get("reporter_mac")

    async with async_session() as db:
        # Get all anchor nodes for this yard
        result = await db.execute(
            select(AnchorNode).where(AnchorNode.yard_id == yard_id, AnchorNode.active == True)
        )
        anchors = {a.mac_address: a for a in result.scalars().all()}

        # If reporter is an anchor, add it
        reporter_type = payload.get("reporter_type", "anchor")

        for reading in readings_raw:
            node_mac = reading.get("node_mac")
            rssi = reading.get("rssi")
            distance_est = reading.get("distance")

            # Find IoT node -> container mapping
            node_result = await db.execute(
                select(IoTNode).where(IoTNode.mac_address == node_mac, IoTNode.active == True)
            )
            iot_node = node_result.scalar_one_or_none()
            if not iot_node or not iot_node.container_id:
                continue

            # Update IoT node raw data
            iot_node.rssi_raw = reading
            iot_node.last_heartbeat_at = datetime.now(timezone.utc)

            # Collect RSSI readings from anchors for trilateration
            pos_key = f"lokus:{tenant_id}:{yard_id}:container:{iot_node.container_id}:rssi_buffer"
            r = get_redis()

            # Store this reading in a temporary buffer
            buffer_entry = json.dumps({
                "anchor_mac": reporter_mac,
                "rssi": rssi,
                "distance": distance_est,
                "ts": payload.get("timestamp", 0),
            })
            await r.lpush(pos_key, buffer_entry)
            await r.ltrim(pos_key, 0, 19)  # Keep last 20 readings
            await r.expire(pos_key, 30)

            # Get buffered readings and try trilateration
            raw_buffer = await r.lrange(pos_key, 0, -1)
            rssi_readings = []
            for entry_str in raw_buffer:
                entry = json.loads(entry_str)
                anchor_mac = entry.get("anchor_mac")
                if anchor_mac in anchors:
                    anchor = anchors[anchor_mac]
                    rssi_readings.append(RSSIReading(
                        anchor_x=anchor.x_meters,
                        anchor_y=anchor.y_meters,
                        rssi=entry.get("rssi"),
                        distance=entry.get("distance"),
                    ))

            if len(rssi_readings) >= 3:
                new_pos = trilaterate(rssi_readings)
                if new_pos:
                    # Get old position for smoothing
                    old_data = await redis_get_json(
                        f"lokus:{tenant_id}:{yard_id}:container:{iot_node.container_id}:pos"
                    )
                    old_pos = Point(x=old_data["x"], y=old_data["y"]) if old_data else None
                    smoothed = smooth_position(new_pos, old_pos)
                    confidence = calculate_confidence(rssi_readings)

                    now = datetime.now(timezone.utc).isoformat()
                    pos_data = {
                        "x": round(smoothed.x, 3),
                        "y": round(smoothed.y, 3),
                        "confidence": confidence,
                        "updated_at": now,
                    }

                    # Store in Redis with TTL
                    await redis_set_json(
                        f"lokus:{tenant_id}:{yard_id}:container:{iot_node.container_id}:pos",
                        pos_data,
                        ttl=settings.CONTAINER_TTL,
                    )

                    # Update container in DB
                    container_result = await db.execute(
                        select(Container).where(Container.id == iot_node.container_id)
                    )
                    container = container_result.scalar_one_or_none()
                    if container:
                        container.x_meters = smoothed.x
                        container.y_meters = smoothed.y
                        container.position_confidence = confidence
                        container.last_seen_at = datetime.now(timezone.utc)
                        if container.status == "missing":
                            container.status = "stored"

                    # Publish position update
                    await redis_publish(
                        f"lokus:{tenant_id}:{yard_id}:events",
                        {
                            "type": "position_update",
                            "entity_type": "container",
                            "entity_id": str(iot_node.container_id),
                            "data": pos_data,
                        },
                    )

        await db.commit()


async def handle_heartbeat(tenant_id: str, yard_id: str, payload: dict) -> None:
    """Process IoT node heartbeat."""
    mac = payload.get("mac")
    async with async_session() as db:
        result = await db.execute(
            select(IoTNode).where(IoTNode.mac_address == mac)
        )
        node = result.scalar_one_or_none()
        if node:
            node.battery_level = payload.get("battery_level")
            node.solar_charging = payload.get("solar_charging", False)
            node.firmware_version = payload.get("firmware_version")
            node.last_heartbeat_at = datetime.now(timezone.utc)
            await db.commit()


async def handle_forklift(tenant_id: str, yard_id: str, payload: dict) -> None:
    """Process forklift position update."""
    mac = payload.get("mac")
    x = payload.get("x")
    y = payload.get("y")
    heading = payload.get("heading")
    speed = payload.get("speed", 0)

    async with async_session() as db:
        result = await db.execute(
            select(Forklift).where(Forklift.code == mac, Forklift.yard_id == yard_id)
        )
        forklift = result.scalar_one_or_none()
        if not forklift:
            return

        forklift.x_meters = x
        forklift.y_meters = y
        forklift.heading_degrees = heading
        forklift.last_seen_at = datetime.now(timezone.utc)
        if forklift.status == "offline":
            forklift.status = "idle"

        now = datetime.now(timezone.utc).isoformat()
        pos_data = {
            "x": round(x, 3),
            "y": round(y, 3),
            "heading": heading,
            "speed": speed,
            "updated_at": now,
        }

        await redis_set_json(
            f"lokus:{tenant_id}:{yard_id}:forklift:{forklift.id}:pos",
            pos_data,
            ttl=settings.FORKLIFT_TTL,
        )

        await redis_publish(
            f"lokus:{tenant_id}:{yard_id}:events",
            {
                "type": "position_update",
                "entity_type": "forklift",
                "entity_id": str(forklift.id),
                "data": pos_data,
            },
        )

        await db.commit()


async def handle_task_event(tenant_id: str, yard_id: str, payload: dict) -> None:
    """Process task events from operator app."""
    from app.services.task_manager import update_task_status

    task_id = payload.get("task_id")
    event = payload.get("event")
    note = payload.get("note")

    status_map = {
        "started": "in_progress",
        "completed": "done",
        "problem": "pending",
    }

    new_status = status_map.get(event)
    if new_status and task_id:
        await update_task_status(task_id, new_status, note)
