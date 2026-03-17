import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from app.config import get_settings
from app.services.realtime import connect, disconnect, redis_subscriber

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])
settings = get_settings()


@router.websocket("/ws/yard/{yard_id}")
async def yard_websocket(websocket: WebSocket, yard_id: str, token: str = ""):
    # Validate JWT token
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            await websocket.close(code=4001, reason="Token inválido")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Token inválido ou expirado")
        return

    await connect(yard_id, websocket)

    # Start Redis subscriber for this yard
    subscriber_task = asyncio.create_task(redis_subscriber(tenant_id, yard_id))

    try:
        while True:
            data = await websocket.receive_text()
            # Client can send subscribe/unsubscribe messages
            # For now, just keep the connection alive
    except WebSocketDisconnect:
        pass
    finally:
        subscriber_task.cancel()
        await disconnect(yard_id, websocket)
