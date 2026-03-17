import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.task import Task
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard
from app.schemas.container import ContainerResponse
from app.schemas.forklift import ForkliftResponse
from app.schemas.task import TaskResponse
from app.schemas.yard import YardCreate, YardResponse, YardUpdate

router = APIRouter(prefix="/api/v1/yards", tags=["yards"])


@router.get("", response_model=list[YardResponse])
async def list_yards(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Yard).where(Yard.tenant_id == tenant.id, Yard.active == True))
    return result.scalars().all()


@router.post("", response_model=YardResponse, status_code=status.HTTP_201_CREATED)
async def create_yard(
    body: YardCreate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente")

    yard_count = await db.execute(select(Yard).where(Yard.tenant_id == tenant.id, Yard.active == True))
    if len(yard_count.scalars().all()) >= tenant.max_yards:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Limite de pátios atingido para o plano atual")

    yard = Yard(tenant_id=tenant.id, **body.model_dump())
    db.add(yard)
    await db.flush()
    await db.refresh(yard)
    return yard


@router.get("/{yard_id}", response_model=YardResponse)
async def get_yard(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")
    return yard


@router.put("/{yard_id}", response_model=YardResponse)
async def update_yard(
    yard_id: uuid.UUID,
    body: YardUpdate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente")

    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(yard, field, value)

    await db.flush()
    await db.refresh(yard)
    return yard


@router.get("/{yard_id}/state")
async def get_yard_state(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")

    containers_result = await db.execute(
        select(Container).where(Container.yard_id == yard_id, Container.tenant_id == tenant.id, Container.deleted_at.is_(None))
    )
    forklifts_result = await db.execute(
        select(Forklift).where(Forklift.yard_id == yard_id, Forklift.tenant_id == tenant.id)
    )
    tasks_result = await db.execute(
        select(Task).where(
            Task.yard_id == yard_id,
            Task.tenant_id == tenant.id,
            Task.status.notin_(["done", "cancelled"]),
        )
    )

    return {
        "yard": YardResponse.model_validate(yard),
        "containers": [ContainerResponse.model_validate(c) for c in containers_result.scalars().all()],
        "forklifts": [ForkliftResponse.model_validate(f) for f in forklifts_result.scalars().all()],
        "tasks": [TaskResponse.model_validate(t) for t in tasks_result.scalars().all()],
    }
