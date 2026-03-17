import asyncio
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
from app.schemas.manifest import ManifestCreate, ManifestResponse, ManifestUpdate
from app.schemas.task import TaskResponse
from app.services.ai_optimizer import optimize_manifest
from app.services.task_manager import assign_task_to_forklift

router = APIRouter(prefix="/api/v1/yards/{yard_id}/manifests", tags=["manifests"])


async def _get_yard(yard_id: uuid.UUID, tenant: Tenant, db: AsyncSession) -> Yard:
    result = await db.execute(select(Yard).where(Yard.id == yard_id, Yard.tenant_id == tenant.id))
    yard = result.scalar_one_or_none()
    if not yard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pátio não encontrado")
    return yard


@router.get("", response_model=list[ManifestResponse])
async def list_manifests(
    yard_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    await _get_yard(yard_id, tenant, db)
    result = await db.execute(
        select(Manifest).where(Manifest.yard_id == yard_id, Manifest.tenant_id == tenant.id)
        .order_by(Manifest.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ManifestResponse, status_code=status.HTTP_201_CREATED)
async def create_manifest(
    yard_id: uuid.UUID,
    body: ManifestCreate,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente")

    await _get_yard(yard_id, tenant, db)
    manifest = Manifest(
        tenant_id=tenant.id,
        yard_id=yard_id,
        created_by=user.id,
        **body.model_dump(),
    )
    db.add(manifest)
    await db.flush()
    await db.refresh(manifest)
    return manifest


@router.get("/{manifest_id}", response_model=dict)
async def get_manifest(
    yard_id: uuid.UUID,
    manifest_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Manifest).where(
            Manifest.id == manifest_id,
            Manifest.yard_id == yard_id,
            Manifest.tenant_id == tenant.id,
        )
    )
    manifest = result.scalar_one_or_none()
    if not manifest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manifesto não encontrado")

    tasks_result = await db.execute(
        select(Task).where(Task.manifest_id == manifest_id, Task.tenant_id == tenant.id)
    )
    tasks = tasks_result.scalars().all()
    total = len(tasks)
    done = sum(1 for t in tasks if t.status == "done")

    return {
        "manifest": ManifestResponse.model_validate(manifest),
        "tasks": [TaskResponse.model_validate(t) for t in tasks],
        "progress": {"total": total, "done": done, "percentage": round(done / total * 100, 1) if total else 0},
    }


@router.post("/{manifest_id}/optimize")
async def optimize(
    yard_id: uuid.UUID,
    manifest_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente")

    result = await db.execute(
        select(Manifest).where(
            Manifest.id == manifest_id,
            Manifest.yard_id == yard_id,
            Manifest.tenant_id == tenant.id,
        )
    )
    manifest = result.scalar_one_or_none()
    if not manifest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manifesto não encontrado")

    # Get containers from manifest
    container_ids = []
    if manifest.containers_data and "container_ids" in manifest.containers_data:
        container_ids = manifest.containers_data["container_ids"]

    containers_result = await db.execute(
        select(Container).where(
            Container.id.in_([uuid.UUID(cid) for cid in container_ids]),
            Container.tenant_id == tenant.id,
            Container.deleted_at.is_(None),
        )
    )
    containers = [
        {
            "id": str(c.id),
            "code": c.code,
            "x": c.x_meters,
            "y": c.y_meters,
            "weight_kg": c.weight_kg,
            "status": c.status,
        }
        for c in containers_result.scalars().all()
    ]

    forklifts_result = await db.execute(
        select(Forklift).where(
            Forklift.yard_id == yard_id,
            Forklift.tenant_id == tenant.id,
            Forklift.status.in_(["idle", "working"]),
        )
    )
    forklifts = [
        {
            "id": str(f.id),
            "code": f.code,
            "x": f.x_meters,
            "y": f.y_meters,
            "status": f.status,
        }
        for f in forklifts_result.scalars().all()
    ]

    # Launch AI optimization asynchronously
    asyncio.create_task(
        optimize_manifest(manifest_id, containers, forklifts, str(tenant.id), str(yard_id))
    )

    return {"status": "processing", "message": "Otimização em andamento. O resultado será enviado via WebSocket."}


@router.post("/{manifest_id}/activate")
async def activate_manifest(
    yard_id: uuid.UUID,
    manifest_id: uuid.UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente")

    result = await db.execute(
        select(Manifest).where(
            Manifest.id == manifest_id,
            Manifest.yard_id == yard_id,
            Manifest.tenant_id == tenant.id,
        )
    )
    manifest = result.scalar_one_or_none()
    if not manifest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manifesto não encontrado")

    if not manifest.ai_optimization_result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Execute a otimização antes de ativar o manifesto")

    ai_result = manifest.ai_optimization_result
    task_assignments = ai_result.get("task_assignments", [])

    created_tasks = []
    for assignment in task_assignments:
        container_id = uuid.UUID(assignment["container_id"])
        forklift_id = uuid.UUID(assignment["forklift_id"]) if assignment.get("forklift_id") else None

        task = Task(
            tenant_id=tenant.id,
            yard_id=yard_id,
            manifest_id=manifest_id,
            container_id=container_id,
            type="relocate",
            priority=assignment.get("priority", 5),
            status="pending",
            ai_instructions=assignment.get("instructions"),
            ai_route={"waypoints": assignment.get("waypoints", [])},
            estimated_duration_seconds=assignment.get("estimated_duration_seconds"),
        )
        db.add(task)
        await db.flush()

        if forklift_id:
            await assign_task_to_forklift(task.id, forklift_id, db)

        created_tasks.append(task)

    manifest.status = "active"
    await db.flush()

    return {
        "status": "activated",
        "tasks_created": len(created_tasks),
        "tasks": [TaskResponse.model_validate(t) for t in created_tasks],
    }
