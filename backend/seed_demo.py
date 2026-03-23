"""Seed demo data for admin@pilidemo.com"""
import asyncio
from datetime import datetime, timezone

from sqlalchemy import delete, select

from app.database import async_session
from app.middleware.auth import hash_password
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.manifest import Manifest
from app.models.task import Task
from app.models.tenant import Tenant
from app.models.user import User
from app.models.yard import Yard


def _cid(cmap, code):
    """Get container UUID as string."""
    return str(cmap[code].id)


def _cids(cmap, codes):
    """Get list of container UUIDs as strings."""
    return [_cid(cmap, c) for c in codes]


# ── Container definitions ────────────────────────────


def _containers():
    """Return container seed data by block."""
    # Block A = Carga Geral
    # Block B = Químicos (IMO)
    # Block C = Staging
    # Block D = Reefer
    return [
        # Block A — Carga Geral (3 stacks)
        _ct("MSCU-4471220", "A", 1, 1, 0, 20, 30, 12000,
            iso="42G1", cargo_desc="Peças automotivas"),
        _ct("TCLU-8912445", "A", 1, 1, 1, 20, 30, 8500,
            iso="22G1", cargo_desc="Eletrodomésticos"),
        _ct("CMAU-3125677", "A", 1, 1, 2, 20, 30, 6200,
            iso="22G1", cargo_desc="Têxteis"),
        _ct("HLXU-2033891", "A", 1, 2, 0, 25, 30, 15000,
            iso="42G1", cargo_desc="Máquinas industriais",
            ncm="8479.89.99"),
        _ct("SUDU-6199034", "A", 1, 2, 1, 25, 30, 9800,
            iso="22G1",
            cargo_desc="Alimentos não perecíveis"),
        _ct("MSKU-1058823", "A", 2, 1, 0, 20, 40, 11000,
            iso="42G1", cargo_desc="Papel e celulose",
            ncm="4801.00.19"),
        _ct("TCKU-7741556", "A", 2, 1, 1, 20, 40, 7300,
            iso="22G1", cargo_desc="Calçados"),
        # Block B — Químicos / IMO (2 stacks)
        _ct("OOLU-3345127", "B", 1, 1, 0, 60, 30, 13500,
            iso="22G1", cargo="imo",
            cargo_desc="Ácido sulfúrico",
            imo_class="8", ncm="2807.00.10"),
        _ct("NYKU-5567890", "B", 1, 1, 1, 60, 30, 10200,
            iso="22G1", cargo="imo",
            cargo_desc="Solventes orgânicos",
            imo_class="3"),
        _ct("ECMU-9912345", "B", 1, 1, 2, 60, 30, 5800,
            iso="22G1", cargo="imo",
            cargo_desc="Fertilizante amônia",
            imo_class="5.1"),
        _ct("TRLU-4478901", "B", 1, 2, 0, 65, 30, 14200,
            iso="42G1", cargo="imo",
            cargo_desc="Tintas e vernizes",
            imo_class="3"),
        _ct("GESU-7789012", "B", 1, 2, 1, 65, 30, 8900,
            iso="22G1", cargo="imo",
            cargo_desc="Pesticidas", imo_class="6.1"),
        # Block C — Staging area (singles)
        _ct("SEGU-1123456", "C", 1, 1, 0, 100, 60, 16000,
            iso="42G1",
            cargo_desc="Equipamentos agrícolas"),
        _ct("PONU-2234567", "C", 1, 2, 0, 105, 60, 9500,
            iso="22G1", cargo_desc="Mobília"),
        _ct("UACU-3345678", "C", 1, 3, 0, 110, 60, 11500,
            iso="22G1", cargo="bulk",
            cargo_desc="Grãos de soja",
            ncm="1201.90.00"),
        # Block D — Reefer (tall stack)
        _ct("YMLU-4456789", "D", 1, 1, 0, 140, 30, 18000,
            iso="45R1", cargo="reefer",
            cargo_desc="Carne bovina congelada",
            reefer=True, temp=-18.0,
            ncm="0202.30.00"),
        _ct("CSLU-5567890", "D", 1, 1, 1, 140, 30, 12000,
            iso="45R1", cargo="reefer",
            cargo_desc="Frutas tropicais",
            reefer=True, temp=2.0,
            ncm="0804.50.00"),
        _ct("KKFU-6678901", "D", 1, 1, 2, 140, 30, 7500,
            iso="22R1", cargo="reefer",
            cargo_desc="Sucos concentrados",
            reefer=True, temp=-5.0),
        _ct("WHLU-7789012", "D", 1, 1, 3, 140, 30, 4200,
            iso="22R1", cargo="reefer",
            cargo_desc="Laticínios",
            reefer=True, temp=4.0),
        # Loose (in transit)
        _ct("FCIU-8890123", None, None, None, 0,
            90, 100, 10500,
            iso="22G1", cargo="empty",
            cargo_desc="Vazio - retorno",
            status="in_transit"),
    ]


def _ct(
    code, block, row, col, level, x, y, weight,
    *, iso=None, cargo="general", cargo_desc=None,
    imo_class=None, ncm=None, reefer=False,
    temp=None, status="stored",
):
    return {
        "code": code, "block": block,
        "row": row, "col": col, "level": level,
        "x": x, "y": y, "weight": weight,
        "iso": iso, "cargo": cargo,
        "cargo_desc": cargo_desc,
        "imo_class": imo_class, "ncm": ncm,
        "reefer": reefer, "temp": temp,
        "status": status,
    }


# ── AI optimization results ─────────────────────────


def _m1_ai(cmap):
    """Embarque MSC Diana — simple, no rearrangements."""
    def _t(seq, code, typ, pri, dest, instr, dur):
        return {
            "sequence": seq,
            "container_id": _cid(cmap, code),
            "type": typ, "priority": pri,
            "destination_label": dest,
            "instructions": instr,
            "estimated_duration_seconds": dur,
        }
    return {
        "task_assignments": [
            _t(1, "SEGU-1123456", "relocate", 8,
               "Doca 1 - Carregamento",
               "Mover direto para Doca 1. Sem bloqueio.",
               180),
            _t(2, "PONU-2234567", "load", 7,
               "Doca 1 - Carregamento",
               "Carregar no caminhão após SEGU.",
               240),
            _t(3, "UACU-3345678", "relocate", 6,
               "Doca 1 - Carregamento",
               "Último container do lote MSC Diana.",
               200),
        ],
        "total_movements": 3,
        "rearrangements_needed": 0,
        "total_estimated_time_seconds": 620,
        "optimization_notes": (
            "Nenhum remanejamento necessário. "
            "Todos no Bloco C, nível 0. "
            "Sequência direta para Doca 1."
        ),
    }


def _m3_ai(cmap):
    """Descarregamento Yang Ming — complex, 5 rearrangements."""
    def _t(seq, code, typ, pri, dest, instr, dur):
        return {
            "sequence": seq,
            "container_id": _cid(cmap, code),
            "type": typ, "priority": pri,
            "destination_label": dest,
            "instructions": instr,
            "estimated_duration_seconds": dur,
        }
    return {
        "task_assignments": [
            _t(1, "WHLU-7789012", "rearrange", 10,
               "Bloco C, Fila 2, Col 1, N0",
               "Desempilhar WHLU do Bloco D N3.",
               150),
            _t(2, "KKFU-6678901", "rearrange", 9,
               "Bloco C, Fila 2, Col 2, N0",
               "Desempilhar KKFU do Bloco D N2.",
               150),
            _t(3, "CSLU-5567890", "rearrange", 8,
               "Bloco C, Fila 2, Col 3, N0",
               "Desempilhar CSLU do Bloco D N1.",
               150),
            _t(4, "YMLU-4456789", "relocate", 7,
               "Doca 2 - Descarga",
               "YMLU acessível. Mover para descarga.",
               200),
            _t(5, "SUDU-6199034", "rearrange", 6,
               "Bloco D, Fila 1, Col 1, N0",
               "Desempilhar SUDU para liberar HLXU.",
               160),
            _t(6, "HLXU-2033891", "relocate", 5,
               "Doca 2 - Descarga",
               "HLXU acessível. Mover para descarga.",
               200),
            _t(7, "NYKU-5567890", "rearrange", 4,
               "Bloco A, Fila 1, Col 2, N0",
               "Desempilhar NYKU para liberar OOLU.",
               160),
            _t(8, "ECMU-9912345", "rearrange", 3,
               "Bloco A, Fila 2, Col 2, N0",
               "Desempilhar ECMU do Bloco B N2.",
               150),
            _t(9, "OOLU-3345127", "relocate", 2,
               "Doca 2 - Descarga",
               "OOLU acessível. Último do manifesto.",
               220),
        ],
        "total_movements": 9,
        "rearrangements_needed": 5,
        "total_estimated_time_seconds": 1540,
        "optimization_notes": (
            "Operação complexa: 3 containers-alvo "
            "bloqueados por 5 acima. Sequência "
            "otimizada para mínimo de movimentos. "
            "Tempo estimado: 25 min com 2 empilhadeiras."
        ),
    }


# ── Main seed function ──────────────────────────────


async def seed():  # noqa: C901
    async with async_session() as db:
        result = await db.execute(
            select(Tenant).where(Tenant.slug == "pili-demo")
        )
        tenant = result.scalar_one_or_none()
        if not tenant:
            print("Tenant pili-demo not found!")
            return

        admin_r = await db.execute(
            select(User).where(
                User.email == "admin@pilidemo.com"
            )
        )
        admin = admin_r.scalar_one_or_none()
        if not admin:
            print("Admin user not found!")
            return

        print(f"Tenant: {tenant.name} ({tenant.id})")
        print(f"Admin: {admin.full_name} ({admin.id})")

        # Skip if already seeded
        chk = await db.execute(
            select(Manifest).where(
                Manifest.tenant_id == tenant.id
            )
        )
        if chk.scalars().first():
            print("Already seeded, skipping")
            return

        # Clean partial data
        for model in (Task, Forklift, Container, Yard):
            await db.execute(
                delete(model).where(
                    model.tenant_id == tenant.id
                )
            )
        await db.execute(
            delete(User).where(
                User.tenant_id == tenant.id,
                User.role != "admin",
            )
        )
        await db.flush()
        print("Cleared partial data")

        # === Yard ===
        yard = Yard(
            tenant_id=tenant.id,
            name="Pátio Santos Terminal 1",
            description=(
                "Terminal de containers - "
                "Porto de Santos - 200m x 150m"
            ),
            width_meters=200,
            height_meters=150,
            timezone="America/Sao_Paulo",
            active=True,
        )
        db.add(yard)
        await db.flush()
        print(f"Yard: {yard.name} ({yard.id})")

        # === Containers ===
        now = datetime.now(timezone.utc)
        cmap = {}
        for c in _containers():
            obj = Container(
                tenant_id=tenant.id,
                yard_id=yard.id,
                code=c["code"],
                iso_type=c["iso"],
                cargo_type=c["cargo"],
                cargo_description=c["cargo_desc"],
                imo_class=c["imo_class"],
                ncm_code=c["ncm"],
                is_reefer=c["reefer"],
                reefer_temp_celsius=c["temp"],
                weight_kg=c["weight"],
                status=c["status"],
                x_meters=c["x"],
                y_meters=c["y"],
                stack_level=c["level"],
                block_label=c["block"],
                row=c["row"],
                col=c["col"],
                position_confidence=0.95,
                last_seen_at=now,
            )
            db.add(obj)
            await db.flush()
            cmap[c["code"]] = obj
            blk = c["block"] or "?"
            print(
                f"  Container: {c['code']} "
                f"Block {blk} N{c['level']} "
                f"[{c['cargo']}]"
            )

        # === Forklifts ===
        forklifts = []
        fl_data = [
            ("EMP-01", 30, 50, "idle"),
            ("EMP-02", 70, 40, "idle"),
            ("EMP-03", 120, 70, "idle"),
            ("EMP-04", 50, 90, "offline"),
        ]
        for code, x, y, st in fl_data:
            fl = Forklift(
                tenant_id=tenant.id,
                yard_id=yard.id,
                code=code, status=st,
                x_meters=x, y_meters=y,
                heading_degrees=0,
                last_seen_at=now,
            )
            db.add(fl)
            await db.flush()
            forklifts.append(fl)
            print(f"  Forklift: {code} ({st})")

        # === Users ===
        for email, name, role in [
            ("operador@pilidemo.com",
             "João Operador", "operator"),
            ("supervisor@pilidemo.com",
             "Maria Supervisora", "supervisor"),
        ]:
            u = User(
                tenant_id=tenant.id,
                email=email,
                password_hash=hash_password("demo1234"),
                full_name=name,
                role=role, active=True,
            )
            db.add(u)
            await db.flush()
            print(f"  User: {email} ({role})")

        # === Manifests ===
        m1_codes = [
            "SEGU-1123456",
            "PONU-2234567",
            "UACU-3345678",
        ]
        m1 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Embarque MSC Diana 14h",
            operation_type="loading",
            vessel_name="MSC Diana",
            vessel_imo="9839284",
            voyage_number="MD2603E",
            port_locode="BRSSZ",
            status="active",
            deadline_at=datetime(
                2026, 3, 20, 14, 0, tzinfo=timezone.utc
            ),
            containers_data={
                "container_ids": _cids(cmap, m1_codes),
            },
            ai_optimization_result=_m1_ai(cmap),
            created_by=admin.id,
        )
        db.add(m1)
        await db.flush()
        print(f"  Manifest: {m1.name} (active)")

        m2_codes = [
            "MSCU-4471220",
            "TCLU-8912445",
            "CMAU-3125677",
        ]
        m2 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Reorganização Bloco A",
            operation_type="rearrange",
            status="draft",
            containers_data={
                "container_ids": _cids(cmap, m2_codes),
            },
            created_by=admin.id,
        )
        db.add(m2)
        await db.flush()
        print(f"  Manifest: {m2.name} (draft)")

        m3_codes = [
            "YMLU-4456789",
            "OOLU-3345127",
            "HLXU-2033891",
        ]
        m3 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Descarregamento Yang Ming",
            operation_type="discharge",
            vessel_name="Yang Ming Wisdom",
            vessel_imo="9462718",
            voyage_number="YM2603W",
            port_locode="BRSSZ",
            status="draft",
            deadline_at=datetime(
                2026, 3, 21, 8, 0, tzinfo=timezone.utc
            ),
            containers_data={
                "container_ids": _cids(cmap, m3_codes),
            },
            ai_optimization_result=_m3_ai(cmap),
            created_by=admin.id,
        )
        db.add(m3)
        await db.flush()
        print(f"  Manifest: {m3.name} (draft)")

        m4 = Manifest(
            tenant_id=tenant.id,
            yard_id=yard.id,
            name="Embarque Maersk Concluído",
            operation_type="loading",
            vessel_name="Maersk Sealand",
            vessel_imo="9778791",
            voyage_number="MK2602S",
            port_locode="BRSSZ",
            status="completed",
            containers_data={"container_ids": []},
            created_by=admin.id,
        )
        db.add(m4)
        await db.flush()
        print(f"  Manifest: {m4.name} (completed)")

        # === Tasks ===
        tasks = [
            ("SEGU-1123456", 0, "relocate", 8,
             "in_progress", "Doca 1", m1.id),
            ("PONU-2234567", 0, "load", 7,
             "assigned", "Doca 1", m1.id),
            ("FCIU-8890123", 1, "relocate", 9,
             "in_progress", "Bloco B, F2, C1", None),
            ("OOLU-3345127", 1, "unload", 6,
             "assigned", "Bloco C, F2, C1", None),
            ("UACU-3345678", 2, "relocate", 5,
             "assigned", "Bloco A, F3, C1", None),
            ("YMLU-4456789", None, "inspect", 3,
             "pending", None, None),
            ("MSCU-4471220", None, "relocate", 4,
             "pending", "Bloco C, F2, C2", None),
            ("TCLU-8912445", None, "relocate", 4,
             "pending", "Bloco C, F2, C3", None),
        ]
        for code, fl_i, typ, pri, st, dest, mid in tasks:
            c = cmap[code]
            fl_id = (
                forklifts[fl_i].id
                if fl_i is not None else None
            )
            started = now if st == "in_progress" else None
            t = Task(
                tenant_id=tenant.id,
                yard_id=yard.id,
                manifest_id=mid,
                container_id=c.id,
                forklift_id=fl_id,
                type=typ, priority=pri,
                status=st,
                destination_label=dest,
                started_at=started,
            )
            db.add(t)
            await db.flush()
            print(f"  Task: {code} -> {dest} ({st})")

        await db.commit()
        print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
