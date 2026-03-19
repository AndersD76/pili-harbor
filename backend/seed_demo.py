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
from app.models.manifest import Manifest
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

        # Check if full seed already ran (manifests exist)
        manifests_check = await db.execute(select(Manifest).where(Manifest.tenant_id == tenant.id))
        if manifests_check.scalars().first():
            print("Full seed already exists (manifests found), skipping")
            return

        # Delete existing partial data to re-seed completely
        from sqlalchemy import delete
        await db.execute(delete(Task).where(Task.tenant_id == tenant.id))
        await db.execute(delete(Forklift).where(Forklift.tenant_id == tenant.id))
        await db.execute(delete(Container).where(Container.tenant_id == tenant.id))
        await db.execute(delete(Yard).where(Yard.tenant_id == tenant.id))
        await db.execute(delete(User).where(User.tenant_id == tenant.id, User.role != "admin"))
        await db.flush()
        print("Cleared existing partial data")

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

        # === Create Manifests ===
        # Manifest 1: Embarque MSC Diana (active, with tasks)
        m1_containers = ["SEGU-1123456", "PONU-2234567", "UACU-3345678"]
        manifest1 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Embarque MSC Diana 14h",
            status="active",
            deadline_at=datetime(2026, 3, 20, 14, 0, tzinfo=timezone.utc),
            containers_data={"container_ids": [str(container_map[c].id) for c in m1_containers]},
            ai_optimization_result={
                "task_assignments": [
                    {"sequence": 1, "container_id": str(container_map["SEGU-1123456"].id), "type": "relocate", "priority": 8, "destination_label": "Doca 1 - Carregamento", "instructions": "Mover direto para Doca 1. Sem bloqueio.", "estimated_duration_seconds": 180},
                    {"sequence": 2, "container_id": str(container_map["PONU-2234567"].id), "type": "load", "priority": 7, "destination_label": "Doca 1 - Carregamento", "instructions": "Carregar no caminhão após SEGU-1123456.", "estimated_duration_seconds": 240},
                    {"sequence": 3, "container_id": str(container_map["UACU-3345678"].id), "type": "relocate", "priority": 6, "destination_label": "Doca 1 - Carregamento", "instructions": "Último container do lote MSC Diana.", "estimated_duration_seconds": 200},
                ],
                "total_movements": 3,
                "rearrangements_needed": 0,
                "total_estimated_time_seconds": 620,
                "optimization_notes": "Nenhum remanejamento necessário. Todos os containers estão no Bloco C, nível 0 (chão). Sequência direta para Doca 1.",
            },
            created_by=admin.id,
        )
        db.add(manifest1)
        await db.flush()
        print(f"  Manifest: {manifest1.name} (active)")

        # Manifest 2: Reorganização Bloco A (draft, needs AI optimization)
        m2_containers = ["MSCU-4471220", "TCLU-8912445", "CMAU-3125677"]
        manifest2 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Reorganização Bloco A",
            status="draft",
            containers_data={"container_ids": [str(container_map[c].id) for c in m2_containers]},
            created_by=admin.id,
        )
        db.add(manifest2)
        await db.flush()
        print(f"  Manifest: {manifest2.name} (draft - precisa otimizar)")

        # Manifest 3: Descarregamento Navio Yang Ming (draft, with AI result ready)
        m3_containers = ["YMLU-4456789", "OOLU-3345127", "HLXU-2033891"]
        manifest3 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Descarregamento Yang Ming",
            status="draft",
            deadline_at=datetime(2026, 3, 21, 8, 0, tzinfo=timezone.utc),
            containers_data={"container_ids": [str(container_map[c].id) for c in m3_containers]},
            ai_optimization_result={
                "task_assignments": [
                    {"sequence": 1, "container_id": str(container_map["WHLU-7789012"].id), "type": "rearrange", "priority": 10, "destination_label": "Bloco C, Fila 2, Col 1, N0", "instructions": "Desempilhar WHLU do Bloco D N3 para liberar YMLU.", "estimated_duration_seconds": 150},
                    {"sequence": 2, "container_id": str(container_map["KKFU-6678901"].id), "type": "rearrange", "priority": 9, "destination_label": "Bloco C, Fila 2, Col 2, N0", "instructions": "Desempilhar KKFU do Bloco D N2.", "estimated_duration_seconds": 150},
                    {"sequence": 3, "container_id": str(container_map["CSLU-5567890"].id), "type": "rearrange", "priority": 8, "destination_label": "Bloco C, Fila 2, Col 3, N0", "instructions": "Desempilhar CSLU do Bloco D N1. Após isso YMLU fica acessível.", "estimated_duration_seconds": 150},
                    {"sequence": 4, "container_id": str(container_map["YMLU-4456789"].id), "type": "relocate", "priority": 7, "destination_label": "Doca 2 - Descarga", "instructions": "YMLU agora acessível. Mover para área de descarga.", "estimated_duration_seconds": 200},
                    {"sequence": 5, "container_id": str(container_map["SUDU-6199034"].id), "type": "rearrange", "priority": 6, "destination_label": "Bloco D, Fila 1, Col 1, N0", "instructions": "Desempilhar SUDU do Bloco A para liberar HLXU.", "estimated_duration_seconds": 160},
                    {"sequence": 6, "container_id": str(container_map["HLXU-2033891"].id), "type": "relocate", "priority": 5, "destination_label": "Doca 2 - Descarga", "instructions": "HLXU acessível após remover SUDU. Mover para descarga.", "estimated_duration_seconds": 200},
                    {"sequence": 7, "container_id": str(container_map["NYKU-5567890"].id), "type": "rearrange", "priority": 4, "destination_label": "Bloco A, Fila 1, Col 2, N0", "instructions": "Desempilhar NYKU do Bloco B para liberar OOLU.", "estimated_duration_seconds": 160},
                    {"sequence": 8, "container_id": str(container_map["ECMU-9912345"].id), "type": "rearrange", "priority": 3, "destination_label": "Bloco A, Fila 2, Col 2, N0", "instructions": "Desempilhar ECMU do Bloco B N2.", "estimated_duration_seconds": 150},
                    {"sequence": 9, "container_id": str(container_map["OOLU-3345127"].id), "type": "relocate", "priority": 2, "destination_label": "Doca 2 - Descarga", "instructions": "OOLU agora acessível. Último container do manifesto.", "estimated_duration_seconds": 220},
                ],
                "total_movements": 9,
                "rearrangements_needed": 5,
                "total_estimated_time_seconds": 1540,
                "optimization_notes": "Operação complexa: 3 containers-alvo estão bloqueados por 5 containers acima. Sequência otimizada para desempilhar com mínimo de movimentos. Containers temporários relocados para Blocos C e A que têm espaço. Tempo estimado: 25 min com 2 empilhadeiras.",
            },
            created_by=admin.id,
        )
        db.add(manifest3)
        await db.flush()
        print(f"  Manifest: {manifest3.name} (draft - otimização pronta, 9 movimentos)")

        # Manifest 4: Completed manifest
        manifest4 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Embarque Maersk Concluído",
            status="completed",
            containers_data={"container_ids": []},
            created_by=admin.id,
        )
        db.add(manifest4)
        await db.flush()
        print(f"  Manifest: {manifest4.name} (completed)")

        # === Create Tasks (8 tasks in various states) ===
        tasks_data = [
            {"container": "SEGU-1123456", "forklift": 0, "type": "relocate", "priority": 8, "status": "in_progress", "dest": "Doca 1 - Carregamento", "manifest": "m1"},
            {"container": "PONU-2234567", "forklift": 0, "type": "load", "priority": 7, "status": "assigned", "dest": "Doca 1 - Carregamento", "manifest": "m1"},
            {"container": "FCIU-8890123", "forklift": 1, "type": "relocate", "priority": 9, "status": "in_progress", "dest": "Bloco B, Fila 2, Col 1"},
            {"container": "OOLU-3345127", "forklift": 1, "type": "unload", "priority": 6, "status": "assigned", "dest": "Bloco C, Fila 2, Col 1"},
            {"container": "UACU-3345678", "forklift": 2, "type": "relocate", "priority": 5, "status": "assigned", "dest": "Bloco A, Fila 3, Col 1"},
            {"container": "YMLU-4456789", "forklift": None, "type": "inspect", "priority": 3, "status": "pending", "dest": None},
            {"container": "MSCU-4471220", "forklift": None, "type": "relocate", "priority": 4, "status": "pending", "dest": "Bloco C, Fila 2, Col 2"},
            {"container": "TCLU-8912445", "forklift": None, "type": "relocate", "priority": 4, "status": "pending", "dest": "Bloco C, Fila 2, Col 3"},
        ]

        for td in tasks_data:
            c = container_map[td["container"]]
            manifest_id = manifest1.id if td.get("manifest") == "m1" else None
            task = Task(
                tenant_id=tenant.id,
                yard_id=yard.id,
                manifest_id=manifest_id,
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
