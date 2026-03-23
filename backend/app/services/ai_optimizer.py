import json
import logging
import uuid

import anthropic

from app.config import get_settings
from app.database import async_session
from app.models.manifest import Manifest
from app.redis_client import redis_publish

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


OPTIMIZER_SYSTEM_PROMPT = """\
Você é um otimizador logístico portuário especializado em \
operações de pátio de containers, seguindo legislação \
brasileira (ANTAQ, NR-29) e padrões internacionais \
(IMDG Code, ISPS, SOLAS).

REGRAS CRÍTICAS:
- Responda SEMPRE em JSON válido, sem markdown
- ANALISE TODAS as movimentações necessárias ANTES de \
definir a sequência
- Se um container-alvo tem containers empilhados acima, \
INCLUA movimentações intermediárias para desempilhar
- Minimize o número TOTAL de movimentações
- Posições temporárias NÃO podem bloquear outros containers
- Balanceie carga de trabalho entre empilhadeiras
- Respeite max_stack de cada posição
- Instruções em português brasileiro

SEGREGAÇÃO IMDG (Code 7.2.4) — OBRIGATÓRIO:
Níveis de segregação e distâncias mínimas no pátio:
  Nível 1 (away from): mínimo 3 metros entre CTUs
  Nível 2 (separated from): mínimo 6 metros
  Nível 3 (compartimento): mínimo 12 metros
  Nível 4 (longitudinal): mínimo 24 metros

Incompatibilidades principais:
  Classe 1 (explosivos): nível 4 com quase tudo
  Classe 2.1 (gás inflamável) + Classe 5.1 (oxidante): nível 2
  Classe 3 (líquido inflamável) + Classe 5.1: nível 2
  Classe 3 + Classe 4.1 (sólido inflamável): nível 2
  Classe 4.2 (combustão espontânea) + 5.1: nível 2
  Classe 7 (radioativo): incompatível com todas
  Classe 9: compatível com todas
  IMO NUNCA empilhar sobre não-IMO e vice-versa
  IMO classes incompatíveis NUNCA na mesma pilha

REGRAS DE EMPILHAMENTO (práticas portuárias):
- Container cheio 20ft: máximo 5 tiers
- Container cheio 40ft: máximo 4 tiers
- Container vazio: máximo 7 tiers
- Container IMO: máximo 2 tiers
- Container reefer: máximo 3 tiers
- WEIGHT-ON-TOP: peso deve DIMINUIR de baixo para cima
- 40ft NUNCA sobre 20ft (inverso permitido com twist-locks)
- Vazio NUNCA misturado com cheio na mesma pilha

TIPOS DE CARGA:
- cargo_type="imo": carga perigosa. Segregação IMDG obrigatória
- cargo_type="reefer": refrigerado. Apenas blocos com tomada
- cargo_type="general": carga geral. Compatível com bulk
- cargo_type="bulk": granel. Compatível com general
- cargo_type="empty": vazio. Qualquer área de staging

RESTRIÇÕES ADUANEIRAS:
- customs_status="red": INSPEÇÃO FÍSICA — NÃO MOVER
- customs_status="grey": FRAUDE — NÃO MOVER
- Containers bloqueados devem ser excluídos da otimização

PRIORIZAÇÃO:
- Containers com free_time_expires_at próximo têm prioridade
- Reefer com alarme de temperatura: prioridade máxima
- Deadline do manifesto define urgência geral

CONCEITOS:
- stack_level: 0=chão, 1=primeiro em cima, etc.
- block_label + row + col: posição no pátio
- Para acessar nível N, remover TODOS os níveis > N
- type="rearrange": movimentação intermediária
- type="relocate"|"load"|"unload": movimentação do manifesto
- iso_type: ISO 6346 (22G1=20ft, 42G1=40ft, 45R1=40ft reefer)
- vgm_kg: Verified Gross Mass (SOLAS)

FORMATO DE RESPOSTA:
{
    "task_assignments": [
        {
            "sequence": 1,
            "container_id": "uuid",
            "forklift_id": "uuid",
            "type": "relocate|rearrange|load|unload",
            "priority": 1-10,
            "estimated_duration_seconds": int,
            "destination_label": "string - posição destino (ex: Bloco B, Fila 2, Col 1, Nível 0)",
            "destination_x": float or null,
            "destination_y": float or null,
            "waypoints": [{"x": float, "y": float}],
            "instructions": "string em português explicando o que fazer e por quê"
        }
    ],
    "total_movements": int,
    "rearrangements_needed": int,
    "total_estimated_time_seconds": int,
    "optimization_notes": "string em português explicando a estratégia global"
}"""


async def optimize_manifest(
    manifest_id: uuid.UUID,
    containers: list[dict],
    forklifts: list[dict],
    tenant_id: str,
    yard_id: str,
    all_yard_containers: list[dict] | None = None,
) -> None:
    """
    Optimize manifest task assignments using Claude API.
    Considers ALL containers in the yard (stacking) before planning.
    Runs asynchronously - publishes result via WebSocket when done.
    """
    client = _get_client()

    data = {
        "manifest_id": str(manifest_id),
        "target_containers": containers,
        "available_forklifts": forklifts,
    }
    if all_yard_containers:
        data["all_yard_containers"] = all_yard_containers

    user_prompt = json.dumps(data, ensure_ascii=False)

    try:
        response = await client.messages.create(
            model="claude-sonnet-4-6-20250514",
            max_tokens=4096,
            system=OPTIMIZER_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Otimize este manifesto:\n{user_prompt}"}],
        )

        result_text = response.content[0].text
        result = json.loads(result_text)

        # Store result in DB
        async with async_session() as db:
            from sqlalchemy import select
            stmt = select(Manifest).where(Manifest.id == manifest_id)
            res = await db.execute(stmt)
            manifest = res.scalar_one_or_none()
            if manifest:
                manifest.ai_optimization_result = result
                await db.commit()

        # Publish result via WebSocket
        await redis_publish(
            f"lokus:{tenant_id}:{yard_id}:events",
            {
                "type": "ai_optimization_complete",
                "manifest_id": str(manifest_id),
                "result": result,
            },
        )

    except json.JSONDecodeError as e:
        logger.error(f"AI returned invalid JSON: {e}")
        await redis_publish(
            f"lokus:{tenant_id}:{yard_id}:events",
            {
                "type": "ai_optimization_error",
                "manifest_id": str(manifest_id),
                "error": "Resposta da IA em formato inválido",
            },
        )
    except Exception as e:
        logger.error(f"AI optimization error: {e}")
        await redis_publish(
            f"lokus:{tenant_id}:{yard_id}:events",
            {
                "type": "ai_optimization_error",
                "manifest_id": str(manifest_id),
                "error": str(e),
            },
        )


async def assign_forklift(
    task: dict,
    forklifts: list[dict],
) -> dict:
    """Use AI to determine the best forklift for a task."""
    client = _get_client()

    prompt = json.dumps({
        "task": task,
        "available_forklifts": forklifts,
    }, ensure_ascii=False)

    response = await client.messages.create(
        model="claude-sonnet-4-6-20250514",
        max_tokens=1024,
        system="""Você é um otimizador logístico. Dado uma tarefa e empilhadeiras disponíveis,
escolha a melhor empilhadeira. Responda em JSON válido sem markdown:
{"forklift_id": "uuid", "justification": "razão em português"}""",
        messages=[{"role": "user", "content": prompt}],
    )

    return json.loads(response.content[0].text)


async def suggest_relocation(
    yard_state: dict,
    manifest_history: list[dict],
) -> dict:
    """Suggest proactive relocations based on yard state and history."""
    client = _get_client()

    prompt = json.dumps({
        "current_state": yard_state,
        "recent_manifests": manifest_history,
    }, ensure_ascii=False)

    response = await client.messages.create(
        model="claude-sonnet-4-6-20250514",
        max_tokens=2048,
        system="""Você é um otimizador logístico. Analise o estado do pátio e o histórico de manifestos.
Sugira reorganizações proativas para facilitar futuras operações.
Responda em JSON válido sem markdown:
{
    "suggestions": [
        {"container_id": "uuid", "from": {"x": float, "y": float}, "to": {"x": float, "y": float}, "reason": "razão em português"}
    ],
    "analysis": "análise geral em português"
}""",
        messages=[{"role": "user", "content": prompt}],
    )

    return json.loads(response.content[0].text)
