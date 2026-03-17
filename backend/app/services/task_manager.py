import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.forklift import Forklift
from app.models.task import Task
from app.redis_client import get_redis, redis_publish


async def update_task_status(task_id: str, new_status: str, note: str | None = None) -> None:
    """Update task status and handle side effects."""
    async with async_session() as db:
        result = await db.execute(select(Task).where(Task.id == uuid.UUID(task_id)))
        task = result.scalar_one_or_none()
        if not task:
            return

        old_status = task.status
        task.status = new_status
        if note:
            task.notes = note

        now = datetime.now(timezone.utc)
        if new_status == "in_progress" and not task.started_at:
            task.started_at = now
        elif new_status == "done":
            task.completed_at = now
            # Auto-assign next task from queue
            if task.forklift_id:
                await _promote_next_task(db, task.forklift_id, task.tenant_id, task.yard_id)

        await db.commit()

        # Publish task update via Redis
        await redis_publish(
            f"lokus:{task.tenant_id}:{task.yard_id}:events",
            {
                "type": "task_update",
                "task_id": str(task.id),
                "old_status": old_status,
                "new_status": new_status,
                "forklift_id": str(task.forklift_id) if task.forklift_id else None,
            },
        )


async def _promote_next_task(
    db: AsyncSession, forklift_id: uuid.UUID, tenant_id: uuid.UUID, yard_id: uuid.UUID
) -> None:
    """Promote the next assigned task to in_progress for a forklift."""
    result = await db.execute(
        select(Task)
        .where(
            Task.forklift_id == forklift_id,
            Task.tenant_id == tenant_id,
            Task.status == "assigned",
        )
        .order_by(Task.priority.desc(), Task.created_at.asc())
        .limit(1)
    )
    next_task = result.scalar_one_or_none()
    if next_task:
        next_task.status = "in_progress"
        next_task.started_at = datetime.now(timezone.utc)


async def assign_task_to_forklift(
    task_id: uuid.UUID, forklift_id: uuid.UUID, db: AsyncSession
) -> Task:
    """Assign a task to a forklift."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Tarefa não encontrada")

    task.forklift_id = forklift_id
    task.status = "assigned"

    # Check if forklift has any in_progress task
    active_result = await db.execute(
        select(Task).where(
            Task.forklift_id == forklift_id,
            Task.status == "in_progress",
        )
    )
    active_task = active_result.scalar_one_or_none()

    # If no active task, promote this one
    if not active_task:
        task.status = "in_progress"
        task.started_at = datetime.now(timezone.utc)

    # Update Redis queue
    r = get_redis()
    queue_key = f"lokus:{task.tenant_id}:{task.yard_id}:forklift:{forklift_id}:queue"
    await r.rpush(queue_key, str(task.id))

    return task


async def get_forklift_queue(
    forklift_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession
) -> list[Task]:
    """Get ordered task queue for a forklift."""
    result = await db.execute(
        select(Task)
        .where(
            Task.forklift_id == forklift_id,
            Task.tenant_id == tenant_id,
            Task.status.in_(["assigned", "in_progress"]),
        )
        .order_by(
            # in_progress first, then by priority desc
            Task.status.desc(),
            Task.priority.desc(),
            Task.created_at.asc(),
        )
    )
    return list(result.scalars().all())


async def reassign_forklift_tasks(
    forklift_id: uuid.UUID, tenant_id: uuid.UUID, yard_id: uuid.UUID
) -> None:
    """Reassign all tasks from an offline forklift to other available forklifts."""
    async with async_session() as db:
        # Get pending tasks for this forklift
        tasks_result = await db.execute(
            select(Task).where(
                Task.forklift_id == forklift_id,
                Task.tenant_id == tenant_id,
                Task.status.in_(["assigned", "in_progress"]),
            )
        )
        tasks = tasks_result.scalars().all()

        if not tasks:
            return

        # Get available forklifts
        forklifts_result = await db.execute(
            select(Forklift).where(
                Forklift.yard_id == yard_id,
                Forklift.tenant_id == tenant_id,
                Forklift.status.in_(["idle", "working"]),
                Forklift.id != forklift_id,
            )
        )
        available = forklifts_result.scalars().all()

        if not available:
            # No available forklifts, set tasks back to pending
            for task in tasks:
                task.forklift_id = None
                task.status = "pending"
        else:
            # Round-robin assignment
            for i, task in enumerate(tasks):
                target = available[i % len(available)]
                task.forklift_id = target.id
                task.status = "assigned"

        await db.commit()

        # Publish alert
        await redis_publish(
            f"lokus:{tenant_id}:{yard_id}:events",
            {
                "type": "alert",
                "code": "TASKS_REASSIGNED",
                "message": f"{len(tasks)} tarefas reatribuídas da empilhadeira offline",
            },
        )
