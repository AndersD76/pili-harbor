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


OPTIMIZER_SYSTEM_PROMPT = """Você é um otimizador logístico industrial especializado em operações de pátio de containers.
Sua função é analisar manifestos de carga e otimizar a sequência de tarefas para empilhadeiras.

REGRAS CRÍTICAS:
- Responda SEMPRE em JSON válido, sem markdown, sem blocos de código
- ANALISE TODAS as movimentações necessárias ANTES de definir a sequência
- Se um container-alvo tem containers empilhados acima, INCLUA movimentações intermediárias para desempilhar
- Minimize o número TOTAL de movimentações (remanejamentos + carregamentos + descarregamentos)
- Quando desempilhar, escolha posições temporárias que NÃO bloqueiem outros containers da lista
- Balanceie a carga de trabalho entre as empilhadeiras disponíveis
- Respeite a capacidade máxima de empilhamento (max_stack) de cada posição
- Todas as instruções devem ser em português brasileiro

CONCEITOS:
- stack_level: nível na pilha (0=chão, 1=primeiro em cima, etc)
- block_label + row + col: posição no pátio (ex: Bloco A, Fila 3, Coluna 2)
- Para acessar container no nível N, TODOS os containers de nível > N devem ser removidos primeiro
- Movimentações intermediárias (desempilhar) devem ter type="rearrange"
- Movimentações do manifesto devem ter type="relocate" ou "load"/"unload"

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
