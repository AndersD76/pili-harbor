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


# Serve frontend static files (Next.js export)
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check multiple possible paths (local dev vs Docker)
_candidates = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "out",  # Docker
    Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "out",  # Local dev
]
FRONTEND_DIR = next((p for p in _candidates if p.exists()), _candidates[0])

if FRONTEND_DIR.exists():
    app.mount("/_next", StaticFiles(directory=FRONTEND_DIR / "_next"), name="next-static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Try exact file
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # Try with .html
        html_path = FRONTEND_DIR / f"{full_path}.html"
        if html_path.is_file():
            return FileResponse(html_path)
        # Try index.html in directory
        index_path = FRONTEND_DIR / full_path / "index.html"
        if index_path.is_file():
            return FileResponse(index_path)
        # Fallback to root index
        root_index = FRONTEND_DIR / "index.html"
        if root_index.is_file():
            return FileResponse(root_index)
        return {"detail": "Página não encontrada"}
