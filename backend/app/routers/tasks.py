import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.container import Container
from app.models.task import Task
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate
from app.services.task_manager import assign_task_to_forklift, get_forklift_queue, update_task_status

router = APIRouter(tags=["tasks"])


async def _get_yard(yard_id: uuid.UUID, tenant: Tenant, db: AsyncSession) -> Yard:
    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")
    return yard


@router.get("/api/v1/yards/{yard_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    yard_id: uuid.UUID,
    status_filter: str | None = None,
    forklift_id: uuid.UUID | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    await _get_yard(yard_id, tenant, db)
    query = select(Task).where(Task.yard_id == yard_id, Task.tenant_id == tenant.id)

    if status_filter:
        query = query.where(Task.status == status_filter)
    if forklift_id:
        query = query.where(Task.forklift_id == forklift_id)

    query = query.order_by(Task.priority.desc(), Task.created_at.asc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/v1/yards/{yard_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    yard_id: uuid.UUID,
    body: TaskCreate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    await _get_yard(yard_id, tenant, db)

    # Check if container is blocked by containers stacked above it
    container_result = await db.execute(
        select(Container).where(Container.id == body.container_id, Container.tenant_id == tenant.id)
    )
    container = container_result.scalar_one_or_none()
    if not container:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Container não encontrado")

    if container.block_label and container.row is not None and container.col is not None:
        # Find containers stacked above this one at same position
        blocking = await db.execute(
            select(Container).where(
                Container.yard_id == yard_id,
                Container.tenant_id == tenant.id,
                Container.block_label == container.block_label,
                Container.row == container.row,
                Container.col == container.col,
                Container.stack_level > container.stack_level,
                Container.deleted_at.is_(None),
            )
        )
        blockers = blocking.scalars().all()
        if blockers:
            blocker_codes = ", ".join(b.code for b in blockers)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Container bloqueado. Remova primeiro: {blocker_codes} (nível{'s' if len(blockers) > 1 else ''} acima)",
            )

    task = Task(
        tenant_id=tenant.id,
        yard_id=yard_id,
        container_id=body.container_id,
        type=body.type,
        priority=body.priority,
        destination_x=body.destination_x,
        destination_y=body.destination_y,
        destination_label=body.destination_label,
        notes=body.notes,
    )
    db.add(task)
    await db.flush()

    if body.forklift_id:
        await assign_task_to_forklift(task.id, body.forklift_id, db)
        await db.refresh(task)

    return task


@router.put("/api/v1/yards/{yard_id}/tasks/{task_id}/status", response_model=TaskResponse)
async def update_status(
    yard_id: uuid.UUID,
    task_id: uuid.UUID,
    body: TaskStatusUpdate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.yard_id == yard_id,
            Task.tenant_id == tenant.id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")

    valid_transitions = {
        "pending": ["assigned", "cancelled"],
        "assigned": ["in_progress", "cancelled", "pending"],
        "in_progress": ["done", "pending", "cancelled"],
    }

    allowed = valid_transitions.get(task.status, [])
    if body.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transição de '{task.status}' para '{body.status}' não permitida",
        )

    await update_task_status(str(task_id), body.status, body.notes)

    await db.refresh(task)
    return task


@router.get("/api/v1/forklifts/{forklift_id}/queue", response_model=list[TaskResponse])
async def forklift_queue(
    forklift_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    tasks = await get_forklift_queue(forklift_id, tenant.id, db)
    return tasks
