"""Seed demo data for admin@pilidemo.com"""
import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from app.database import async_session
from app.models.user import User
from app.models.tenant import Tenant
from app.models.yard import Yard
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.task import Task
from app.middleware.auth import hash_password


async def seed():
    async with async_session() as db:
        # Find the demo tenant
        result = await db.execute(select(Tenant).where(Tenant.slug == "pili-demo"))
        tenant = result.scalar_one_or_none()
        if not tenant:
            print("Tenant pili-demo not found!")
            return

        admin_result = await db.execute(select(User).where(User.email == "admin@pilidemo.com"))
        admin = admin_result.scalar_one_or_none()
        if not admin:
            print("Admin user not found!")
            return

        print(f"Tenant: {tenant.name} ({tenant.id})")
        print(f"Admin: {admin.full_name} ({admin.id})")

        # Check if yard already exists
        yards = await db.execute(select(Yard).where(Yard.tenant_id == tenant.id))
        if yards.scalars().first():
            print("Data already exists, skipping seed")
            return

        # === Create Yard ===
        yard = Yard(
            tenant_id=tenant.id,
            name="Pátio Santos Terminal 1",
            description="Terminal de containers - Porto de Santos - 200m x 150m",
            width_meters=200,
            height_meters=150,
            timezone="America/Sao_Paulo",
            active=True,
        )
        db.add(yard)
        await db.flush()
        print(f"Yard: {yard.name} ({yard.id})")

        # === Create Containers (20 containers in stacks) ===
        containers_data = [
            # Block A - 3 stacks
            {"code": "MSCU-4471220", "block": "A", "row": 1, "col": 1, "level": 0, "x": 20, "y": 30, "weight": 12000},
            {"code": "TCLU-8912445", "block": "A", "row": 1, "col": 1, "level": 1, "x": 20, "y": 30, "weight": 8500},
            {"code": "CMAU-3125677", "block": "A", "row": 1, "col": 1, "level": 2, "x": 20, "y": 30, "weight": 6200},
            {"code": "HLXU-2033891", "block": "A", "row": 1, "col": 2, "level": 0, "x": 25, "y": 30, "weight": 15000},
            {"code": "SUDU-6199034", "block": "A", "row": 1, "col": 2, "level": 1, "x": 25, "y": 30, "weight": 9800},
            {"code": "MSKU-1058823", "block": "A", "row": 2, "col": 1, "level": 0, "x": 20, "y": 40, "weight": 11000},
            {"code": "TCKU-7741556", "block": "A", "row": 2, "col": 1, "level": 1, "x": 20, "y": 40, "weight": 7300},
            # Block B - 2 stacks
            {"code": "OOLU-3345127", "block": "B", "row": 1, "col": 1, "level": 0, "x": 60, "y": 30, "weight": 13500},
            {"code": "NYKU-5567890", "block": "B", "row": 1, "col": 1, "level": 1, "x": 60, "y": 30, "weight": 10200},
            {"code": "ECMU-9912345", "block": "B", "row": 1, "col": 1, "level": 2, "x": 60, "y": 30, "weight": 5800},
            {"code": "TRLU-4478901", "block": "B", "row": 1, "col": 2, "level": 0, "x": 65, "y": 30, "weight": 14200},
            {"code": "GESU-7789012", "block": "B", "row": 1, "col": 2, "level": 1, "x": 65, "y": 30, "weight": 8900},
            # Block C - singles (staging area)
            {"code": "SEGU-1123456", "block": "C", "row": 1, "col": 1, "level": 0, "x": 100, "y": 60, "weight": 16000},
            {"code": "PONU-2234567", "block": "C", "row": 1, "col": 2, "level": 0, "x": 105, "y": 60, "weight": 9500},
            {"code": "UACU-3345678", "block": "C", "row": 1, "col": 3, "level": 0, "x": 110, "y": 60, "weight": 11500},
            # Block D - tall stack
            {"code": "YMLU-4456789", "block": "D", "row": 1, "col": 1, "level": 0, "x": 140, "y": 30, "weight": 18000},
            {"code": "CSLU-5567890", "block": "D", "row": 1, "col": 1, "level": 1, "x": 140, "y": 30, "weight": 12000},
            {"code": "KKFU-6678901", "block": "D", "row": 1, "col": 1, "level": 2, "x": 140, "y": 30, "weight": 7500},
            {"code": "WHLU-7789012", "block": "D", "row": 1, "col": 1, "level": 3, "x": 140, "y": 30, "weight": 4200},
            # Loose container (in transit)
            {"code": "FCIU-8890123", "block": None, "row": None, "col": None, "level": 0, "x": 90, "y": 100, "weight": 10500, "status": "in_transit"},
        ]

        container_map = {}
        for c in containers_data:
            container = Container(
                tenant_id=tenant.id,
                yard_id=yard.id,
                code=c["code"],
                weight_kg=c["weight"],
                status=c.get("status", "stored"),
                x_meters=c["x"],
                y_meters=c["y"],
                stack_level=c["level"],
                block_label=c["block"],
                row=c["row"],
                col=c["col"],
                position_confidence=0.95,
                last_seen_at=datetime.now(timezone.utc),
            )
            db.add(container)
            await db.flush()
            container_map[c["code"]] = container
            print(f"  Container: {c['code']} Block {c['block']}-{c['row']}/{c['col']} N{c['level']}")

        # === Create Forklifts (4) ===
        forklifts = []
        for i, (code, x, y, status) in enumerate([
            ("EMP-01", 30, 50, "idle"),
            ("EMP-02", 70, 40, "idle"),
            ("EMP-03", 120, 70, "idle"),
            ("EMP-04", 50, 90, "offline"),
        ]):
            fl = Forklift(
                tenant_id=tenant.id,
                yard_id=yard.id,
                code=code,
                status=status,
                x_meters=x,
                y_meters=y,
                heading_degrees=0,
                last_seen_at=datetime.now(timezone.utc),
            )
            db.add(fl)
            await db.flush()
            forklifts.append(fl)
            print(f"  Forklift: {code} ({status})")

        # === Create Operator User ===
        operator = User(
            tenant_id=tenant.id,
            email="operador@pilidemo.com",
            password_hash=hash_password("demo1234"),
            full_name="João Operador",
            role="operator",
            active=True,
        )
        db.add(operator)
        await db.flush()
        print(f"  Operator: {operator.email}")

        # === Create Supervisor User ===
        supervisor = User(
            tenant_id=tenant.id,
            email="supervisor@pilidemo.com",
            password_hash=hash_password("demo1234"),
            full_name="Maria Supervisora",
            role="supervisor",
            active=True,
        )
        db.add(supervisor)
        await db.flush()
        print(f"  Supervisor: {supervisor.email}")

        # === Create Tasks (8 tasks in various states) ===
        tasks_data = [
            {"container": "SEGU-1123456", "forklift": 0, "type": "relocate", "priority": 8, "status": "in_progress", "dest": "Doca 1 - Carregamento"},
            {"container": "PONU-2234567", "forklift": 0, "type": "load", "priority": 7, "status": "assigned", "dest": "Doca 1 - Carregamento"},
            {"container": "FCIU-8890123", "forklift": 1, "type": "relocate", "priority": 9, "status": "in_progress", "dest": "Bloco B, Fila 2, Col 1"},
            {"container": "OOLU-3345127", "forklift": 1, "type": "unload", "priority": 6, "status": "assigned", "dest": "Bloco C, Fila 2, Col 1"},
            {"container": "UACU-3345678", "forklift": 2, "type": "relocate", "priority": 5, "status": "assigned", "dest": "Bloco A, Fila 3, Col 1"},
            {"container": "YMLU-4456789", "forklift": None, "type": "inspect", "priority": 3, "status": "pending", "dest": None},
            {"container": "MSCU-4471220", "forklift": None, "type": "relocate", "priority": 4, "status": "pending", "dest": "Bloco C, Fila 2, Col 2"},
            {"container": "TCLU-8912445", "forklift": None, "type": "relocate", "priority": 4, "status": "pending", "dest": "Bloco C, Fila 2, Col 3"},
        ]

        for td in tasks_data:
            c = container_map[td["container"]]
            task = Task(
                tenant_id=tenant.id,
                yard_id=yard.id,
                container_id=c.id,
                forklift_id=forklifts[td["forklift"]].id if td["forklift"] is not None else None,
                type=td["type"],
                priority=td["priority"],
                status=td["status"],
                destination_label=td["dest"],
                started_at=datetime.now(timezone.utc) if td["status"] == "in_progress" else None,
            )
            db.add(task)
            await db.flush()
            print(f"  Task: {td['container']} -> {td['dest']} ({td['status']})")

        await db.commit()
        print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
