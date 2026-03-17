import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, containers, forklifts, manifests, tasks, ws, yards

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start MQTT worker only if configured
    mqtt_task = None
    if settings.MQTT_BROKER_URL:
        from app.mqtt_worker import mqtt_listener
        mqtt_task = asyncio.create_task(mqtt_listener())
        logger.info("MQTT worker started")
    else:
        logger.info("MQTT not configured, skipping worker")
    yield
    if mqtt_task:
        mqtt_task.cancel()


app = FastAPI(
    title="PILI HARBOR API",
    description="Plataforma de localização e gestão operacional para pátios industriais",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else ["https://piliharbor.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(yards.router)
app.include_router(containers.router)
app.include_router(forklifts.router)
app.include_router(tasks.router)
app.include_router(manifests.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "pili-harbor"}
