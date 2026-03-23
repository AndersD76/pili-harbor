import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.tenant import get_current_tenant
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.manifest import Manifest
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


@router.get("/api/v1/forklifts/{forklift_id}/manifest-package")
async def manifest_package(
    forklift_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get offline manifest package for Eaze Android app.

    Returns manifest info + ordered tasks + container coords +
    yard GPS origin for coordinate conversion.
    """
    # Get forklift → yard
    fl_result = await db.execute(
        select(Forklift).where(
            Forklift.id == forklift_id,
            Forklift.tenant_id == tenant.id,
        )
    )
    forklift = fl_result.scalar_one_or_none()
    if not forklift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empilhadeira não encontrada",
        )

    yard_result = await db.execute(
        select(Yard).where(Yard.id == forklift.yard_id)
    )
    yard = yard_result.scalar_one_or_none()

    # Get tasks assigned to forklift
    tasks_result = await db.execute(
        select(Task).where(
            Task.forklift_id == forklift_id,
            Task.tenant_id == tenant.id,
            Task.status.in_(["assigned", "in_progress", "pending"]),
        ).order_by(Task.priority.desc(), Task.created_at.asc())
    )
    tasks = tasks_result.scalars().all()

    # Find manifest (from first task)
    manifest_info = None
    if tasks:
        first_task = tasks[0]
        if first_task.manifest_id:
            m_result = await db.execute(
                select(Manifest).where(
                    Manifest.id == first_task.manifest_id,
                )
            )
            m = m_result.scalar_one_or_none()
            if m:
                manifest_info = {
                    "id": str(m.id),
                    "name": m.name,
                    "operation_type": m.operation_type,
                    "vessel_name": m.vessel_name,
                }

    # Build task list with container coords
    task_list = []
    for i, t in enumerate(tasks):
        # Get container
        c_result = await db.execute(
            select(Container).where(
                Container.id == t.container_id,
            )
        )
        c = c_result.scalar_one_or_none()

        task_list.append({
            "id": str(t.id),
            "sequence": i + 1,
            "type": t.type,
            "priority": t.priority,
            "container_code": c.code if c else "?",
            "container_x": c.x_meters or 0 if c else 0,
            "container_y": c.y_meters or 0 if c else 0,
            "destination_label": t.destination_label,
            "destination_x": t.destination_x,
            "destination_y": t.destination_y,
            "ai_instructions": t.ai_instructions,
        })

    return {
        "forklift_id": str(forklift_id),
        "manifest": manifest_info,
        "tasks": task_list,
        "yard": {
            "name": yard.name if yard else None,
            "width_meters": yard.width_meters if yard else 200,
            "height_meters": yard.height_meters if yard else 150,
            "origin_lat": yard.origin_lat if yard else None,
            "origin_lng": yard.origin_lng if yard else None,
        } if yard else None,
    }
