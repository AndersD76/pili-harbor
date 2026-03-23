"""Reefer monitoring — temperature readings and alerts."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.container import Container
from app.models.reefer_reading import ReeferReading
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.reefer_reading import (
    ReeferReadingCreate,
    ReeferReadingResponse,
)

router = APIRouter(
    prefix="/api/v1/yards/{yard_id}",
    tags=["reefer"],
)

TEMP_ALARM_THRESHOLD = 2.0  # °C deviation


@router.post(
    "/containers/{container_id}/reefer-reading",
    response_model=ReeferReadingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reefer_reading(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    body: ReeferReadingCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Record a reefer temperature/status reading."""
    result = await db.execute(
        select(Container).where(
            Container.id == container_id,
            Container.yard_id == yard_id,
            Container.tenant_id == tenant.id,
            Container.deleted_at.is_(None),
        )
    )
    container = result.scalar_one_or_none()
    if not container:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Container não encontrado",
        )
    if not container.is_reefer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Container não é reefer",
        )

    reading = ReeferReading(
        tenant_id=tenant.id,
        container_id=container_id,
        **body.model_dump(),
    )
    db.add(reading)
    await db.flush()
    await db.refresh(reading)

    # Check alarms
    alarms = []
    if (
        body.actual_temp_celsius is not None
        and body.set_temp_celsius is not None
    ):
        dev = abs(
            body.actual_temp_celsius - body.set_temp_celsius
        )
        if dev > TEMP_ALARM_THRESHOLD:
            alarms.append(
                f"Desvio de temperatura: "
                f"{body.actual_temp_celsius}°C "
                f"(set: {body.set_temp_celsius}°C, "
                f"desvio: {dev:.1f}°C)"
            )

    if body.power_status in ("off", "alarm"):
        alarms.append(
            f"Reefer power: {body.power_status.upper()}"
        )

    # Publish alarms via Redis/WebSocket if any
    if alarms:
        try:
            from app.redis_client import redis_publish
            await redis_publish(
                f"lokus:{tenant.id}:{yard_id}:events",
                {
                    "type": "reefer_alarm",
                    "container_id": str(container_id),
                    "container_code": container.code,
                    "alarms": alarms,
                },
            )
        except Exception:
            pass  # Redis not required

    return reading


@router.get(
    "/containers/{container_id}/reefer-history",
    response_model=list[ReeferReadingResponse],
)
async def reefer_history(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get reefer reading history for a container."""
    result = await db.execute(
        select(ReeferReading)
        .where(
            ReeferReading.container_id == container_id,
            ReeferReading.tenant_id == tenant.id,
        )
        .order_by(ReeferReading.recorded_at.desc())
        .limit(200)
    )
    return result.scalars().all()


@router.get("/reefer-status")
async def reefer_status(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Overview of all reefer containers and their latest readings."""
    # Get all reefer containers in yard
    result = await db.execute(
        select(Container).where(
            Container.yard_id == yard_id,
            Container.tenant_id == tenant.id,
            Container.is_reefer.is_(True),
            Container.deleted_at.is_(None),
        )
    )
    reefers = result.scalars().all()

    items = []
    for r in reefers:
        # Get latest reading
        lr = await db.execute(
            select(ReeferReading)
            .where(ReeferReading.container_id == r.id)
            .order_by(ReeferReading.recorded_at.desc())
            .limit(1)
        )
        latest = lr.scalar_one_or_none()

        alarm = False
        if latest:
            if latest.power_status in ("off", "alarm"):
                alarm = True
            if (
                latest.actual_temp_celsius is not None
                and latest.set_temp_celsius is not None
            ):
                dev = abs(
                    latest.actual_temp_celsius
                    - latest.set_temp_celsius
                )
                if dev > TEMP_ALARM_THRESHOLD:
                    alarm = True

        items.append({
            "container_id": str(r.id),
            "code": r.code,
            "cargo_description": r.cargo_description,
            "set_temp": r.reefer_temp_celsius,
            "block_label": r.block_label,
            "pti_status": r.pti_status,
            "pti_valid_until": (
                r.pti_valid_until.isoformat()
                if r.pti_valid_until else None
            ),
            "alarm": alarm,
            "latest_reading": {
                "actual_temp": latest.actual_temp_celsius,
                "power_status": latest.power_status,
                "recorded_at": (
                    latest.recorded_at.isoformat()
                ),
            } if latest else None,
        })

    alarm_count = sum(1 for i in items if i["alarm"])
    return {
        "total_reefers": len(items),
        "alarms": alarm_count,
        "items": items,
    }
