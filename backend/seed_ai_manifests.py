"""Seed manifests with pre-calculated AI optimization results."""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from app.database import async_session
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.manifest import Manifest


async def seed():
    async with async_session() as db:
        result = await db.execute(select(Tenant).where(Tenant.slug == "pili"))
        tenant = result.scalar_one_or_none()
        if not tenant:
            # Try pili-demo
            result = await db.execute(select(Tenant).where(Tenant.slug == "pili-demo"))
            tenant = result.scalar_one_or_none()
        if not tenant:
            print("No tenant found!")
            return

        tid = tenant.id

        # Get yard
        result = await db.execute(select(Yard).where(Yard.tenant_id == tid).limit(1))
        yard = result.scalar_one_or_none()
        if not yard:
            print("No yard found!")
            return

        # Get admin user
        result = await db.execute(select(User).where(User.tenant_id == tid, User.role == "admin").limit(1))
        admin = result.scalar_one()

        # Get all containers
        result = await db.execute(select(Container).where(Container.yard_id == yard.id, Container.deleted_at.is_(None)))
        containers = result.scalars().all()

        # Get forklifts
        result = await db.execute(select(Forklift).where(Forklift.yard_id == yard.id))
        forklifts = result.scalars().all()

        if len(containers) < 6:
            print(f"Not enough containers ({len(containers)}), need at least 6")
            return

        idle_forklifts = [f for f in forklifts if f.status in ("idle", "working")]

        print(f"Tenant: {tenant.name}")
        print(f"Yard: {yard.name}")
        print(f"Containers: {len(containers)}")
        print(f"Forklifts: {len(forklifts)} ({len(idle_forklifts)} available)")

        # ═══════════════════════════════════════════════════
        # MANIFEST 1: Embarque urgente (otimizado pela IA)
        # ═══════════════════════════════════════════════════
        m1_containers = containers[:6]
        m1_forklifts = idle_forklifts[:3] if len(idle_forklifts) >= 3 else idle_forklifts

        m1_assignments = []
        seq = 1

        # Simula que containers[2] está bloqueado (nível 2, precisa desempilhar 2 acima)
        # Remanejamento 1: tirar o de cima
        m1_assignments.append({
            "sequence": seq,
            "container_id": str(m1_containers[4].id),
            "forklift_id": str(m1_forklifts[0].id) if m1_forklifts else None,
            "type": "rearrange",
            "priority": 10,
            "estimated_duration_seconds": 150,
            "destination_label": "Zona C - Posicao temporaria T1",
            "destination_x": 30.0,
            "destination_y": 100.0,
            "waypoints": [{"x": 30.0, "y": 80.0}, {"x": 30.0, "y": 100.0}],
            "instructions": f"Desempilhar {m1_containers[4].code} do nivel 2 para liberar acesso ao {m1_containers[2].code}. Mover para zona de transito temporaria."
        })
        seq += 1

        # Remanejamento 2: tirar outro de cima
        m1_assignments.append({
            "sequence": seq,
            "container_id": str(m1_containers[3].id),
            "forklift_id": str(m1_forklifts[0].id) if m1_forklifts else None,
            "type": "rearrange",
            "priority": 9,
            "estimated_duration_seconds": 160,
            "destination_label": "Zona C - Posicao temporaria T2",
            "destination_x": 35.0,
            "destination_y": 100.0,
            "waypoints": [{"x": 35.0, "y": 80.0}, {"x": 35.0, "y": 100.0}],
            "instructions": f"Desempilhar {m1_containers[3].code} do nivel 1. Apos isso, {m1_containers[2].code} fica acessivel no nivel 0."
        })
        seq += 1

        # Agora movimenta os containers do manifesto
        for i, c in enumerate(m1_containers[:4]):
            fl_idx = i % len(m1_forklifts) if m1_forklifts else 0
            dest_x = 170.0 + (i * 5)
            m1_assignments.append({
                "sequence": seq,
                "container_id": str(c.id),
                "forklift_id": str(m1_forklifts[fl_idx].id) if m1_forklifts else None,
                "type": "relocate",
                "priority": 8 - i,
                "estimated_duration_seconds": 180 + (i * 30),
                "destination_label": f"Doca 1 - Posicao de embarque E{i+1}",
                "destination_x": dest_x,
                "destination_y": 10.0,
                "waypoints": [{"x": c.x_meters, "y": 75.0}, {"x": dest_x, "y": 10.0}],
                "instructions": f"Mover {c.code} ({c.weight_kg}kg) para posicao de embarque E{i+1} na Doca 1. {'Prioridade maxima - primeiro da fila.' if i == 0 else 'Seguir sequencia do manifesto.'}"
            })
            seq += 1

        # Ultimos 2 containers - empilhadeira diferente
        for i, c in enumerate(m1_containers[4:6]):
            fl_idx = min(1, len(m1_forklifts) - 1)
            dest_x = 180.0 + (i * 5)
            m1_assignments.append({
                "sequence": seq,
                "container_id": str(c.id),
                "forklift_id": str(m1_forklifts[fl_idx].id) if m1_forklifts else None,
                "type": "relocate",
                "priority": 4 - i,
                "estimated_duration_seconds": 200 + (i * 20),
                "destination_label": f"Doca 1 - Posicao de embarque E{i+5}",
                "destination_x": dest_x,
                "destination_y": 10.0,
                "waypoints": [{"x": 100.0, "y": 50.0}, {"x": dest_x, "y": 10.0}],
                "instructions": f"Mover {c.code} para Doca 1 posicao E{i+5}. Ja foi desempilhado anteriormente."
            })
            seq += 1

        total_time = sum(a["estimated_duration_seconds"] for a in m1_assignments)
        manual_time = int(total_time * 1.72)  # 72% mais lento manualmente

        manifest1 = Manifest(
            id=uuid.uuid4(),
            tenant_id=tid,
            yard_id=yard.id,
            name="Embarque MSC Diana 14h - URGENTE",
            status="draft",
            deadline_at=datetime.now(timezone.utc) + timedelta(hours=3),
            containers_data={
                "container_ids": [str(c.id) for c in m1_containers],
                "sequence": list(range(1, len(m1_containers) + 1)),
            },
            ai_optimization_result={
                "task_assignments": m1_assignments,
                "total_movements": len(m1_assignments),
                "rearrangements_needed": 2,
                "total_estimated_time_seconds": total_time,
                "manual_estimated_time_seconds": manual_time,
                "savings_percentage": round((1 - total_time / manual_time) * 100, 1),
                "optimization_notes": (
                    f"Analise completa do patio ({len(containers)} containers, {len(forklifts)} empilhadeiras). "
                    f"Dois containers bloqueiam acesso ao {m1_containers[2].code}: necessario desempilhar "
                    f"{m1_containers[4].code} (nivel 2) e {m1_containers[3].code} (nivel 1) antes de movimentar. "
                    f"Containers temporarios relocados para Zona C que tem espaco livre. "
                    f"Carga balanceada entre {len(m1_forklifts)} empilhadeiras. "
                    f"Tempo estimado: {total_time // 60}min (vs {manual_time // 60}min manual = "
                    f"-{round((1 - total_time / manual_time) * 100)}% economia). "
                    f"Distancia total otimizada: 2.8km (vs 4.6km manual)."
                ),
            },
            created_by=admin.id,
        )
        db.add(manifest1)
        print(f"\n✓ Manifesto 1: {manifest1.name}")
        print(f"  {len(m1_assignments)} movimentacoes ({2} remanejamentos + {len(m1_assignments)-2} embarques)")
        print(f"  Tempo IA: {total_time//60}min | Manual: {manual_time//60}min | Economia: {round((1-total_time/manual_time)*100)}%")

        # ═══════════════════════════════════════════════════
        # MANIFEST 2: Reorganizacao proativa (complexo)
        # ═══════════════════════════════════════════════════
        m2_containers = containers[6:14] if len(containers) > 13 else containers[6:]
        m2_forklifts = idle_forklifts[:2] if len(idle_forklifts) >= 2 else idle_forklifts

        m2_assignments = []
        seq = 1

        # Simula 4 remanejamentos complexos
        rearrange_count = min(4, len(m2_containers) - 4)
        for i in range(rearrange_count):
            c = m2_containers[len(m2_containers) - 1 - i]
            fl_idx = i % len(m2_forklifts) if m2_forklifts else 0
            m2_assignments.append({
                "sequence": seq,
                "container_id": str(c.id),
                "forklift_id": str(m2_forklifts[fl_idx].id) if m2_forklifts else None,
                "type": "rearrange",
                "priority": 10 - i,
                "estimated_duration_seconds": 140 + (i * 20),
                "destination_label": f"Zona C - Temp R{i+1}",
                "destination_x": 40.0 + (i * 6),
                "destination_y": 110.0,
                "waypoints": [],
                "instructions": f"Desempilhar {c.code} do nivel {3-i} para liberar containers abaixo. Posicao temporaria na Zona C."
            })
            seq += 1

        # Relocacoes principais
        for i, c in enumerate(m2_containers[:4]):
            fl_idx = i % len(m2_forklifts) if m2_forklifts else 0
            new_x = 80.0 + (i * 8)
            new_y = 30.0 + (i * 5)
            m2_assignments.append({
                "sequence": seq,
                "container_id": str(c.id),
                "forklift_id": str(m2_forklifts[fl_idx].id) if m2_forklifts else None,
                "type": "relocate",
                "priority": 6 - i,
                "estimated_duration_seconds": 200 + (i * 25),
                "destination_label": f"Bloco B - Fila {i+1}, Col 1, Nivel 0",
                "destination_x": new_x,
                "destination_y": new_y,
                "waypoints": [{"x": new_x, "y": 75.0}],
                "instructions": f"Reorganizar {c.code} para Bloco B. Nova posicao otimizada para acesso rapido em futuros embarques."
            })
            seq += 1

        # Re-empilhar os temporarios
        for i in range(rearrange_count):
            c = m2_containers[len(m2_containers) - 1 - i]
            fl_idx = i % len(m2_forklifts) if m2_forklifts else 0
            m2_assignments.append({
                "sequence": seq,
                "container_id": str(c.id),
                "forklift_id": str(m2_forklifts[fl_idx].id) if m2_forklifts else None,
                "type": "rearrange",
                "priority": 3,
                "estimated_duration_seconds": 130,
                "destination_label": f"Bloco B - Fila {i+1}, Col 1, Nivel 1",
                "destination_x": 80.0 + (i * 8),
                "destination_y": 30.0 + (i * 5),
                "waypoints": [],
                "instructions": f"Re-empilhar {c.code} sobre o container reposicionado no Bloco B. Nivel 1 - dentro do limite de empilhamento."
            })
            seq += 1

        total_time2 = sum(a["estimated_duration_seconds"] for a in m2_assignments)
        manual_time2 = int(total_time2 * 1.85)

        manifest2 = Manifest(
            id=uuid.uuid4(),
            tenant_id=tid,
            yard_id=yard.id,
            name="Reorganizacao Bloco A - Otimizacao IA",
            status="draft",
            deadline_at=datetime.now(timezone.utc) + timedelta(hours=8),
            containers_data={
                "container_ids": [str(c.id) for c in m2_containers],
            },
            ai_optimization_result={
                "task_assignments": m2_assignments,
                "total_movements": len(m2_assignments),
                "rearrangements_needed": rearrange_count * 2,
                "total_estimated_time_seconds": total_time2,
                "manual_estimated_time_seconds": manual_time2,
                "savings_percentage": round((1 - total_time2 / manual_time2) * 100, 1),
                "optimization_notes": (
                    f"Reorganizacao proativa sugerida pela IA. {rearrange_count} containers empilhados precisam ser "
                    f"desempilhados temporariamente (Zona C) para reposicionar os {min(4, len(m2_containers))} containers "
                    f"do nivel 0 no Bloco B, criando acesso direto para futuros embarques. "
                    f"Apos reposicionamento, os containers temporarios sao re-empilhados no Bloco B. "
                    f"Total: {len(m2_assignments)} movimentacoes. "
                    f"Tempo estimado: {total_time2 // 60}min (vs {manual_time2 // 60}min sem otimizacao = "
                    f"-{round((1-total_time2/manual_time2)*100)}%). "
                    f"Beneficio: proximos 3 embarques previstos terao 0 remanejamentos."
                ),
            },
            created_by=admin.id,
        )
        db.add(manifest2)
        print(f"\n✓ Manifesto 2: {manifest2.name}")
        print(f"  {len(m2_assignments)} movimentacoes ({rearrange_count*2} remanejamentos)")
        print(f"  Tempo IA: {total_time2//60}min | Manual: {manual_time2//60}min | Economia: {round((1-total_time2/manual_time2)*100)}%")

        # ═══════════════════════════════════════════════════
        # MANIFEST 3: Descarga navio (sem otimizacao ainda)
        # ═══════════════════════════════════════════════════
        m3_containers = containers[14:20] if len(containers) > 19 else containers[-6:]

        manifest3 = Manifest(
            id=uuid.uuid4(),
            tenant_id=tid,
            yard_id=yard.id,
            name="Descarga Yang Ming Glory 08h",
            status="draft",
            deadline_at=datetime.now(timezone.utc) + timedelta(hours=12),
            containers_data={
                "container_ids": [str(c.id) for c in m3_containers],
            },
            ai_optimization_result=None,  # Not optimized yet
            created_by=admin.id,
        )
        db.add(manifest3)
        print(f"\n✓ Manifesto 3: {manifest3.name} (sem otimizacao - aguardando IA)")

        await db.commit()
        print("\n=== SEED COMPLETO ===")
        print(f"3 manifestos criados:")
        print(f"  1. {manifest1.name} - IA otimizado ({len(m1_assignments)} tarefas)")
        print(f"  2. {manifest2.name} - IA otimizado ({len(m2_assignments)} tarefas)")
        print(f"  3. {manifest3.name} - Aguardando otimizacao")


asyncio.run(seed())
