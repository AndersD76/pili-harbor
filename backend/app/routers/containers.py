import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.container import Container
from app.models.position_history import PositionHistory
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard
from app.schemas.container import ContainerCreate, ContainerResponse, ContainerUpdate

router = APIRouter(prefix="/api/v1/yards/{yard_id}/containers", tags=["containers"])


async def _get_yard(yard_id: uuid.UUID, tenant: Tenant, db: AsyncSession) -> Yard:
    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")
    return yard


@router.get("", response_model=list[ContainerResponse])
async def list_containers(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    await _get_yard(yard_id, tenant, db)
    result = await db.execute(
        select(Container).where(
            Container.yard_id == yard_id,
            Container.tenant_id == tenant.id,
            Container.deleted_at.is_(None),
        )
    )
    return result.scalars().all()


@router.post("", response_model=ContainerResponse, status_code=status.HTTP_201_CREATED)
async def create_container(
    yard_id: uuid.UUID,
    body: ContainerCreate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    await _get_yard(yard_id, tenant, db)
    container = Container(tenant_id=tenant.id, yard_id=yard_id, **body.model_dump())
    db.add(container)
    await db.flush()
    await db.refresh(container)
    return container


@router.get("/{container_id}", response_model=dict)
async def get_container(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Container não encontrado")

    history_result = await db.execute(
        select(PositionHistory)
        .where(PositionHistory.entity_id == container_id, PositionHistory.entity_type == "container")
        .order_by(PositionHistory.recorded_at.desc())
        .limit(100)
    )

    return {
        "container": ContainerResponse.model_validate(container),
        "position_history": [
            {
                "x_meters": h.x_meters,
                "y_meters": h.y_meters,
                "confidence": h.confidence,
                "recorded_at": h.recorded_at.isoformat(),
            }
            for h in history_result.scalars().all()
        ],
    }


@router.put("/{container_id}", response_model=ContainerResponse)
async def update_container(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    body: ContainerUpdate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Container não encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(container, field, value)

    await db.flush()
    await db.refresh(container)
    return container


@router.delete("/{container_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_container(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Container não encontrado")

    container.deleted_at = datetime.now(timezone.utc)
    await db.flush()


@router.get("/{container_id}/stack", response_model=list[ContainerResponse])
async def get_stack(
    yard_id: uuid.UUID,
    container_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get all containers in the same stack position, ordered by level."""
    result = await db.execute(
        select(Container).where(
            Container.id == container_id,
            Container.tenant_id == tenant.id,
            Container.deleted_at.is_(None),
        )
    )
    container = result.scalar_one_or_none()
    if not container:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Container não encontrado")

    if not container.block_label or container.row is None or container.col is None:
        return [ContainerResponse.model_validate(container)]

    stack_result = await db.execute(
        select(Container)
        .where(
            Container.yard_id == yard_id,
            Container.tenant_id == tenant.id,
            Container.block_label == container.block_label,
            Container.row == container.row,
            Container.col == container.col,
            Container.deleted_at.is_(None),
        )
        .order_by(Container.stack_level.asc())
    )
    return stack_result.scalars().all()
