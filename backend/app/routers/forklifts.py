import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.forklift import Forklift
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard
from app.schemas.forklift import ForkliftCreate, ForkliftResponse, ForkliftUpdate

router = APIRouter(prefix="/api/v1/yards/{yard_id}/forklifts", tags=["forklifts"])
claim_router = APIRouter(prefix="/api/v1/forklifts", tags=["forklifts"])


async def _get_yard(yard_id: uuid.UUID, tenant: Tenant, db: AsyncSession) -> Yard:
    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")
    return yard


@router.get("", response_model=list[ForkliftResponse])
async def list_forklifts(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    await _get_yard(yard_id, tenant, db)
    result = await db.execute(
        select(Forklift).where(Forklift.yard_id == yard_id, Forklift.tenant_id == tenant.id)
    )
    return result.scalars().all()


@router.post("", response_model=ForkliftResponse, status_code=status.HTTP_201_CREATED)
async def create_forklift(
    yard_id: uuid.UUID,
    body: ForkliftCreate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente")

    await _get_yard(yard_id, tenant, db)
    forklift = Forklift(tenant_id=tenant.id, yard_id=yard_id, **body.model_dump())
    db.add(forklift)
    await db.flush()
    await db.refresh(forklift)
    return forklift


@router.put("/{forklift_id}", response_model=ForkliftResponse)
async def update_forklift(
    yard_id: uuid.UUID,
    forklift_id: uuid.UUID,
    body: ForkliftUpdate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Forklift).where(
            Forklift.id == forklift_id,
            Forklift.yard_id == yard_id,
            Forklift.tenant_id == tenant.id,
        )
    )
    forklift = result.scalar_one_or_none()
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empilhadeira não encontrada")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(forklift, field, value)

    await db.flush()
    await db.refresh(forklift)
    return forklift


@claim_router.post("/{forklift_id}/claim", response_model=ForkliftResponse)
async def claim_forklift(
    forklift_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Operator claims a forklift for their session."""
    result = await db.execute(
        select(Forklift).where(
            Forklift.id == forklift_id,
            Forklift.tenant_id == tenant.id,
        )
    )
    forklift = result.scalar_one_or_none()
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empilhadeira não encontrada")

    if forklift.operator_id and forklift.operator_id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Empilhadeira já atribuída a outro operador")

    forklift.operator_id = user.id
    forklift.status = "idle"
    await db.flush()
    await db.refresh(forklift)
    return forklift


@claim_router.post("/{forklift_id}/release", response_model=ForkliftResponse)
async def release_forklift(
    forklift_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Operator releases a forklift."""
    result = await db.execute(
        select(Forklift).where(
            Forklift.id == forklift_id,
            Forklift.tenant_id == tenant.id,
        )
    )
    forklift = result.scalar_one_or_none()
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empilhadeira não encontrada")

    forklift.operator_id = None
    forklift.status = "offline"
    await db.flush()
    await db.refresh(forklift)
    return forklift
