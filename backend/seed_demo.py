"""Seed demo data for admin@pilidemo.com"""
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.database import async_session
from app.middleware.auth import hash_password
from app.models.container import Container
from app.models.forklift import Forklift
from app.models.gate_event import GateEvent
from app.models.manifest import Manifest
from app.models.reefer_reading import ReeferReading
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

        # Skip if already seeded (unless --force)
        import sys
        force = "--force" in sys.argv

        chk = await db.execute(
            select(Manifest).where(
                Manifest.tenant_id == tenant.id
            )
        )
        if chk.scalars().first() and not force:
            print("Already seeded, use --force to re-seed")
            return

        # Clean ALL existing data for this tenant
        for model in (
            Task, GateEvent, ReeferReading,
            Manifest, Forklift, Container, Yard,
        ):
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
        print("Cleared all demo data")

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
            origin_lat=-23.9536,
            origin_lng=-46.3323,
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

        # === Gate-in / dwell time / customs / commercial ===
        # Dwell-time variety: days_ago per container
        _g = dict  # shorthand for gate_data entries
        gate_data = {
            # Block A — arrived ~5 days ago
            "MSCU-4471220": _g(
                days=5, ship="MSC", bl="MSCBR2603001"),
            "TCLU-8912445": _g(
                days=5, ship="MSC", bl="MSCBR2603002"),
            "CMAU-3125677": _g(
                days=5, ship="CMA CGM", bl="CMABR2603010"),
            "HLXU-2033891": _g(
                days=8, ship="Hapag-Lloyd",
                bl="HLCUBR2602005"),
            "SUDU-6199034": _g(
                days=8, ship="Hamburg Süd",
                bl="SUDU2602018"),
            "MSKU-1058823": _g(
                days=2, ship="Maersk", bl="MAEBR2603045"),
            "TCKU-7741556": _g(
                days=2, ship="Maersk", bl="MAEBR2603046"),
            # Block B — IMO, arrived ~8 days ago
            "OOLU-3345127": _g(
                days=8, ship="OOCL", bl="OOLU2602077"),
            "NYKU-5567890": _g(
                days=5, ship="ONE", bl="NYKBR2603020"),
            "ECMU-9912345": _g(
                days=5, ship="Evergreen",
                bl="ECMU2603033"),
            "TRLU-4478901": _g(
                days=2, ship="Triton", bl="TRLU2603041"),
            "GESU-7789012": _g(
                days=2, ship="Gold Container", bl=None),
            # Block C — staging, mixed ages
            "SEGU-1123456": _g(
                days=8, ship="MSC", bl="MSCBR2602099"),
            "PONU-2234567": _g(
                days=5, ship="PIL", bl="PILBR2603015"),
            "UACU-3345678": _g(
                days=2, ship="ZIM", bl="ZIMBR2603060"),
            # Block D — reefer (free_time=5)
            "YMLU-4456789": _g(
                days=8, ship="Yang Ming",
                bl="YMLUBR2602040"),
            "CSLU-5567890": _g(
                days=5, ship="Cosco",
                bl="CSLUBR2603055"),
            "KKFU-6678901": _g(
                days=2, ship="K Line", bl="KKFU2603070"),
            "WHLU-7789012": _g(
                days=2, ship="Wan Hai", bl="WHLU2603080"),
            # Loose / in_transit
            "FCIU-8890123": _g(
                days=0, ship=None, bl=None),
        }

        # Customs status overrides (default = "released")
        customs_map = {
            "OOLU-3345127": "red",       # Chemical, held by customs
            "FCIU-8890123": "pending",    # In transit, not cleared
            "ECMU-9912345": "yellow",     # Under review
        }

        for code, gd in gate_data.items():
            c = cmap[code]
            days = gd["days"]
            if days > 0:
                c.gate_in_at = now - timedelta(days=days)
                ft = 5 if c.is_reefer else 7
                c.free_time_days = ft
                c.free_time_expires_at = (
                    c.gate_in_at + timedelta(days=ft)
                )
                # Demurrage: if free_time expired
                if c.free_time_expires_at < now:
                    c.demurrage_status = "accruing"
                else:
                    c.demurrage_status = "none"
            c.customs_status = customs_map.get(code, "released")
            c.shipping_line = gd["ship"]
            c.bl_number = gd["bl"]
            # Seal info for stored containers
            if days > 0:
                c.seal_number = f"SL{code[5:12].replace('-', '')}"
                c.seal_status = "ok"
        await db.flush()
        print("  Updated gate-in / dwell / customs data")

        # === Reefer Readings (Block D) ===
        reefer_readings_data = [
            # YMLU: frozen meat, stable at -18 (3 readings)
            ("YMLU-4456789", [
                {"hrs": 6, "set": -18.0, "actual": -18.1,
                 "supply": -20.0, "ret": -17.5, "hum": 85.0,
                 "pwr": "on", "defrost": False},
                {"hrs": 3, "set": -18.0, "actual": -18.0,
                 "supply": -19.8, "ret": -17.6, "hum": 84.0,
                 "pwr": "on", "defrost": False},
                {"hrs": 0, "set": -18.0, "actual": -17.9,
                 "supply": -19.5, "ret": -17.4, "hum": 85.0,
                 "pwr": "on", "defrost": False},
            ]),
            # CSLU: tropical fruits at +2, stable
            ("CSLU-5567890", [
                {"hrs": 4, "set": 2.0, "actual": 2.1,
                 "supply": 0.5, "ret": 3.0, "hum": 90.0,
                 "pwr": "on", "defrost": False},
                {"hrs": 1, "set": 2.0, "actual": 2.0,
                 "supply": 0.4, "ret": 2.8, "hum": 91.0,
                 "pwr": "on", "defrost": False},
            ]),
            # KKFU: juice at -5, brief defrost cycle
            ("KKFU-6678901", [
                {"hrs": 5, "set": -5.0, "actual": -4.8,
                 "supply": -7.0, "ret": -4.0, "hum": 80.0,
                 "pwr": "on", "defrost": False},
                {"hrs": 2, "set": -5.0, "actual": -2.0,
                 "supply": -3.0, "ret": -1.5, "hum": 78.0,
                 "pwr": "on", "defrost": True},
                {"hrs": 0, "set": -5.0, "actual": -4.9,
                 "supply": -6.8, "ret": -4.1, "hum": 80.0,
                 "pwr": "on", "defrost": False},
            ]),
            # WHLU: dairy at +4, TEMP ALARM (actual=-12 vs set=-18)
            ("WHLU-7789012", [
                {"hrs": 8, "set": -18.0, "actual": -17.8,
                 "supply": -20.0, "ret": -17.0, "hum": 82.0,
                 "pwr": "on", "defrost": False},
                {"hrs": 3, "set": -18.0, "actual": -14.0,
                 "supply": -16.0, "ret": -13.0, "hum": 75.0,
                 "pwr": "alarm", "defrost": False},
                {"hrs": 0, "set": -18.0, "actual": -12.0,
                 "supply": -14.0, "ret": -11.0, "hum": 70.0,
                 "pwr": "alarm", "defrost": False},
            ]),
        ]
        for code, readings in reefer_readings_data:
            c = cmap[code]
            for r in readings:
                rr = ReeferReading(
                    tenant_id=tenant.id,
                    container_id=c.id,
                    set_temp_celsius=r["set"],
                    actual_temp_celsius=r["actual"],
                    supply_temp=r["supply"],
                    return_temp=r["ret"],
                    humidity_percent=r["hum"],
                    power_status=r["pwr"],
                    defrost_active=r["defrost"],
                    recorded_at=now - timedelta(hours=r["hrs"]),
                )
                db.add(rr)
            await db.flush()
            alarm = " ALARM" if any(
                x["pwr"] == "alarm" for x in readings
            ) else ""
            print(
                f"  ReeferReadings: {code} "
                f"({len(readings)} readings){alarm}"
            )

        # === Gate Events ===
        gate_events_data = [
            ("MSCU-4471220", 5, "ABC-1234", "Carlos Silva",
             "123.456.789-00", "SL4471220"),
            ("HLXU-2033891", 8, "DEF-5678", "Roberto Santos",
             "987.654.321-00", "SL2033891"),
            ("OOLU-3345127", 8, "GHI-9012", "Pedro Oliveira",
             "456.789.123-00", "SL3345127"),
            ("YMLU-4456789", 8, "JKL-3456", "André Costa",
             "321.654.987-00", "SL4456789"),
            ("SEGU-1123456", 8, "MNO-7890", "Marcos Pereira",
             "654.321.987-00", "SL1123456"),
            ("MSKU-1058823", 2, "PQR-2345", "Luiz Ferreira",
             "789.123.456-00", "SL1058823"),
        ]
        for (code, days, plate,
             driver, doc, seal) in gate_events_data:
            c = cmap[code]
            ge = GateEvent(
                tenant_id=tenant.id,
                yard_id=yard.id,
                container_id=c.id,
                event_type="gate_in",
                truck_plate=plate,
                driver_name=driver,
                driver_doc=doc,
                seal_number=seal,
                seal_status="ok",
                vgm_kg=c.weight_kg,
                temperature_celsius=(
                    c.reefer_temp_celsius
                    if c.is_reefer else None
                ),
                notes=None,
                recorded_by=admin.id,
                recorded_at=now - timedelta(days=days),
            )
            db.add(ge)
        await db.flush()
        print(
            f"  GateEvents: {len(gate_events_data)} "
            f"gate_in records"
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
