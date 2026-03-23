"""Gate-in / Gate-out operations — EIR workflow."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.container import Container
from app.models.gate_event import GateEvent
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard
from app.schemas.gate_event import (
    CustomsUpdateRequest,
    GateEventResponse,
    GateInRequest,
    GateOutRequest,
)
from app.services.dwell_time import (
    calculate_free_time_expiry,
    get_free_time_days,
)

router = APIRouter(
    prefix="/api/v1/yards/{yard_id}",
    tags=["gate"],
)


async def _get_container(
    container_id: uuid.UUID,
    yard_id: uuid.UUID,
    tenant: Tenant,
    db: AsyncSession,
) -> Container:
    result = await db.execute(
        select(Container).where(
            Container.id == container_id,
            Container.yard_id == yard_id,
            Container.tenant_id == tenant.id,
            Container.deleted_at.is_(None),
        )
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Container não encontrado",
        )
    return c


@router.post(
    "/containers/{container_id}/gate-in",
    response_model=GateEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def gate_in(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    body: GateInRequest,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Register container gate-in (EIR)."""
    container = await _get_container(
        container_id, yard_id, tenant, db,
    )

    if container.gate_in_at and not container.gate_out_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Container já está no terminal "
            "(gate-in sem gate-out)",
        )

    now = datetime.now(timezone.utc)

    # Update container
    container.gate_in_at = now
    container.gate_out_at = None
    container.status = "stored"
    container.seal_number = body.seal_number
    container.seal_status = body.seal_status
    container.damage_codes = body.damage_codes
    if body.vgm_kg:
        container.vgm_kg = body.vgm_kg
    if body.weight_kg:
        container.weight_kg = body.weight_kg
    if body.tare_kg:
        container.tare_kg = body.tare_kg
    if body.shipping_line:
        container.shipping_line = body.shipping_line
    if body.booking_number:
        container.booking_number = body.booking_number
    if body.bl_number:
        container.bl_number = body.bl_number
    if body.consignee:
        container.consignee = body.consignee
    if body.shipper:
        container.shipper = body.shipper

    # Dwell time
    days = body.free_time_days or get_free_time_days(
        container.cargo_type,
    )
    container.free_time_days = days
    container.free_time_expires_at = calculate_free_time_expiry(
        now, container.cargo_type, days,
    )
    container.demurrage_status = "none"

    # Create gate event
    event = GateEvent(
        tenant_id=tenant.id,
        yard_id=yard_id,
        container_id=container_id,
        event_type="gate_in",
        truck_plate=body.truck_plate,
        driver_name=body.driver_name,
        driver_doc=body.driver_doc,
        seal_number=body.seal_number,
        seal_status=body.seal_status,
        damage_codes=body.damage_codes,
        vgm_kg=body.vgm_kg,
        temperature_celsius=body.temperature_celsius,
        notes=body.notes,
        recorded_by=user.id,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


@router.post(
    "/containers/{container_id}/gate-out",
    response_model=GateEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def gate_out(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    body: GateOutRequest,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Register container gate-out (EIR)."""
    container = await _get_container(
        container_id, yard_id, tenant, db,
    )

    if not container.gate_in_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Container não tem gate-in registrado",
        )

    # Block gate-out for customs red/grey
    if container.customs_status in ("red", "grey"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Gate-out bloqueado: container em canal "
                f"{container.customs_status.upper()} "
                f"(inspeção/retenção aduaneira)"
            ),
        )

    now = datetime.now(timezone.utc)
    container.gate_out_at = now
    container.status = "gate_out"

    event = GateEvent(
        tenant_id=tenant.id,
        yard_id=yard_id,
        container_id=container_id,
        event_type="gate_out",
        truck_plate=body.truck_plate,
        driver_name=body.driver_name,
        driver_doc=body.driver_doc,
        seal_number=body.seal_number,
        seal_status=body.seal_status,
        damage_codes=body.damage_codes,
        notes=body.notes,
        recorded_by=user.id,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


@router.get(
    "/gate-events",
    response_model=list[GateEventResponse],
)
async def list_gate_events(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List gate events for a yard."""
    result = await db.execute(
        select(GateEvent)
        .where(
            GateEvent.yard_id == yard_id,
            GateEvent.tenant_id == tenant.id,
        )
        .order_by(GateEvent.recorded_at.desc())
        .limit(200)
    )
    return result.scalars().all()


@router.put(
    "/containers/{container_id}/customs",
)
async def update_customs(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    body: CustomsUpdateRequest,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Update container customs status (admin/supervisor)."""
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente",
        )

    valid = {
        "none", "pending", "green", "yellow",
        "red", "grey", "released",
    }
    if body.customs_status not in valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status inválido. Valores: {valid}",
        )

    container = await _get_container(
        container_id, yard_id, tenant, db,
    )
    container.customs_status = body.customs_status
    if body.bonded_warehouse_code is not None:
        container.bonded_warehouse_code = (
            body.bonded_warehouse_code
        )
    await db.flush()

    return {
        "status": "ok",
        "customs_status": container.customs_status,
    }
