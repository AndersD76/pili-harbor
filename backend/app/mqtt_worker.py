import asyncio
import json
import logging

import aiomqtt

from app.config import get_settings
from app.services.mqtt_handler import (
    handle_forklift,
    handle_heartbeat,
    handle_rssi,
    handle_task_event,
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Topic format: geomesh/{tenant_slug}/{yard_id}/{type}
TOPIC_HANDLERS = {
    "rssi": handle_rssi,
    "heartbeat": handle_heartbeat,
    "forklift": handle_forklift,
    "task_event": handle_task_event,
}


async def mqtt_listener() -> None:
    """Main MQTT listener loop with reconnection."""
    while True:
        try:
            async with aiomqtt.Client(
                hostname=settings.MQTT_BROKER_URL,
                username=settings.MQTT_USERNAME or None,
                password=settings.MQTT_PASSWORD or None,
            ) as client:
                await client.subscribe("geomesh/#")
                logger.info("MQTT connected and subscribed to geomesh/#")

                async for message in client.messages:
                    try:
                        topic_parts = str(message.topic).split("/")
                        if len(topic_parts) < 4:
                            continue

                        _, tenant_slug, yard_id, msg_type = topic_parts[:4]
                        payload = json.loads(message.payload.decode())

                        handler = TOPIC_HANDLERS.get(msg_type)
                        if handler:
                            asyncio.create_task(handler(tenant_slug, yard_id, payload))
                        else:
                            logger.warning(f"Unknown MQTT topic type: {msg_type}")
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON payload on {message.topic}")
                    except Exception as e:
                        logger.error(f"Error processing MQTT message: {e}")

        except aiomqtt.MqttError as e:
            logger.error(f"MQTT connection error: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Unexpected MQTT error: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)
