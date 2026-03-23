"""XML import/export for manifests.

Based on simplified COPRAR/BAPLIE standards.
Supports embarque (loading) and desembarque (discharge).
Compatible with Porto Sem Papel / ANTAQ SDP conventions.
"""
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any

from app.models.container import Container
from app.models.manifest import Manifest

logger = logging.getLogger(__name__)

NS = "urn:pili-harbor:manifest:v1"


# ── Export ──────────────────────────────────────────────


def generate_manifest_xml(
    manifest: Manifest,
    containers: list[Container],
    yard_name: str = "",
) -> str:
    """Generate XML for a manifest."""
    root = ET.Element("ManifestoPortuario")
    root.set("xmlns", NS)
    root.set("version", "1.0")

    # Header
    hdr = ET.SubElement(root, "Cabecalho")
    _add(hdr, "ManifestoId", str(manifest.id))
    _add(hdr, "Nome", manifest.name)
    _add(hdr, "TipoOperacao", _op_label(manifest.operation_type))
    _add(hdr, "Status", manifest.status)
    if manifest.created_at:
        _add(hdr, "DataCriacao", manifest.created_at.isoformat())
    if manifest.deadline_at:
        _add(hdr, "PrazoLimite", manifest.deadline_at.isoformat())

    # Vessel
    nav = ET.SubElement(root, "Navio")
    _add(nav, "Nome", manifest.vessel_name or "")
    _add(nav, "IMO", manifest.vessel_imo or "")
    _add(nav, "Viagem", manifest.voyage_number or "")

    # Port
    porto = ET.SubElement(root, "Porto")
    _add(porto, "LOCODE", manifest.port_locode or "")
    _add(porto, "Terminal", yard_name)

    # Containers
    cts = ET.SubElement(root, "Conteineres")
    cts.set("total", str(len(containers)))

    for c in containers:
        ct = ET.SubElement(cts, "Conteiner")
        _add(ct, "Numero", c.code)
        _add(ct, "TipoISO", c.iso_type or "")
        _add(ct, "PesoBrutoKg", str(c.weight_kg or 0))
        _add(ct, "Status", c.status)

        # Cargo
        cg = ET.SubElement(ct, "Carga")
        _add(cg, "Tipo", c.cargo_type or "general")
        _add(cg, "Descricao", c.cargo_description or "")
        if c.imo_class:
            _add(cg, "ClasseIMO", c.imo_class)
        if c.ncm_code:
            _add(cg, "NCM", c.ncm_code)
        if c.is_reefer:
            rf = ET.SubElement(cg, "Reefer")
            _add(rf, "TemperaturaCelsius",
                 str(c.reefer_temp_celsius or ""))

        # Position
        pos = ET.SubElement(ct, "Posicao")
        _add(pos, "Bloco", c.block_label or "")
        _add(pos, "Fila", str(c.row or ""))
        _add(pos, "Coluna", str(c.col or ""))
        _add(pos, "Nivel", str(c.stack_level))
        _add(pos, "X", str(c.x_meters or 0))
        _add(pos, "Y", str(c.y_meters or 0))

    # AI result summary
    if manifest.ai_optimization_result:
        ai = ET.SubElement(root, "OtimizacaoIA")
        r = manifest.ai_optimization_result
        _add(ai, "TotalMovimentos",
             str(r.get("total_movements", 0)))
        _add(ai, "RemanejamentosNecessarios",
             str(r.get("rearrangements_needed", 0)))
        _add(ai, "TempoEstimadoSegundos",
             str(r.get("total_estimated_time_seconds", 0)))
        _add(ai, "Observacoes",
             r.get("optimization_notes", ""))

    ET.indent(root)
    return ET.tostring(
        root, encoding="unicode", xml_declaration=True
    )


# ── Import ──────────────────────────────────────────────


def parse_manifest_xml(xml_content: bytes) -> dict[str, Any]:
    """Parse XML and extract manifest + container data."""
    parser = ET.XMLParser()
    parser.feed(xml_content)
    root = parser.close()

    # Header
    hdr = _find(root, "Cabecalho")
    nome = _txt(hdr, "Nome", "Manifesto Importado")
    tipo = _txt(hdr, "TipoOperacao", "embarque")
    operation_type = _parse_op_type(tipo)
    deadline_at = _parse_date(_txt(hdr, "PrazoLimite"))

    # Vessel
    nav = _find(root, "Navio")
    vessel_name = _txt(nav, "Nome")
    vessel_imo = _txt(nav, "IMO")
    voyage_number = _txt(nav, "Viagem")

    # Port
    porto = _find(root, "Porto")
    port_locode = _txt(porto, "LOCODE")

    # Containers
    cts_el = _find(root, "Conteineres")
    containers: list[dict[str, Any]] = []
    if cts_el is not None:
        items = (
            cts_el.findall("Conteiner")
            or cts_el.findall(f"{{{NS}}}Conteiner")
        )
        for ct in items:
            code = _txt(ct, "Numero", "")
            if not code:
                continue

            # Cargo info
            cg = _find(ct, "Carga")
            cargo_type = _txt(cg, "Tipo", "general")
            cargo_desc = _txt(cg, "Descricao")
            imo_class = _txt(cg, "ClasseIMO") or None
            ncm_code = _txt(cg, "NCM") or None
            rf = _find(cg, "Reefer") if cg is not None else None
            is_reefer = rf is not None
            reefer_temp = (
                _float(_txt(rf, "TemperaturaCelsius"))
                if rf is not None else None
            )

            pos = _find(ct, "Posicao")
            containers.append({
                "code": code,
                "iso_type": _txt(ct, "TipoISO") or None,
                "weight_kg": _float(_txt(ct, "PesoBrutoKg")),
                "cargo_type": cargo_type,
                "cargo_description": cargo_desc or None,
                "imo_class": imo_class,
                "ncm_code": ncm_code,
                "is_reefer": is_reefer,
                "reefer_temp_celsius": reefer_temp,
                "block_label": (
                    _txt(pos, "Bloco") or None
                    if pos is not None else None
                ),
                "row": (
                    _int(pos, "Fila")
                    if pos is not None else None
                ),
                "col": (
                    _int(pos, "Coluna")
                    if pos is not None else None
                ),
                "stack_level": (
                    _int(pos, "Nivel") or 0
                    if pos is not None else 0
                ),
            })

    return {
        "name": nome,
        "operation_type": operation_type,
        "vessel_name": vessel_name,
        "vessel_imo": vessel_imo,
        "voyage_number": voyage_number,
        "port_locode": port_locode,
        "deadline_at": deadline_at,
        "containers": containers,
    }


# ── Helpers ─────────────────────────────────────────────


def _add(parent: ET.Element, tag: str, text: str) -> None:
    ET.SubElement(parent, tag).text = text


def _find(
    parent: ET.Element | None, tag: str,
) -> ET.Element | None:
    """Find child with or without namespace."""
    if parent is None:
        return None
    el = parent.find(tag)
    if el is not None:
        return el
    return parent.find(f"{{{NS}}}{tag}")


def _txt(
    parent: ET.Element | None,
    tag: str,
    default: str = "",
) -> str:
    if parent is None:
        return default
    el = _find(parent, tag)
    if el is not None and el.text:
        return el.text.strip()
    return default


def _int(parent: ET.Element | None, tag: str) -> int | None:
    val = _txt(parent, tag)
    if not val:
        return None
    try:
        return int(val)
    except ValueError:
        return None


def _float(val: str) -> float | None:
    if not val:
        return None
    try:
        return float(val)
    except ValueError:
        return None


def _parse_date(val: str) -> datetime | None:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val)
    except ValueError:
        logger.warning("Invalid date in XML: %s", val)
        return None


_OP_LABELS = {
    "loading": "embarque",
    "discharge": "desembarque",
    "rearrange": "rearranjo",
}

_OP_TYPES = {
    "embarque": "loading",
    "loading": "loading",
    "desembarque": "discharge",
    "discharge": "discharge",
    "descarga": "discharge",
    "rearranjo": "rearrange",
    "rearrange": "rearrange",
}


def _op_label(op_type: str) -> str:
    return _OP_LABELS.get(op_type, op_type)


def _parse_op_type(label: str) -> str:
    return _OP_TYPES.get(label.strip().lower(), "loading")
