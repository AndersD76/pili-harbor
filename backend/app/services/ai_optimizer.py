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


OPTIMIZER_SYSTEM_PROMPT = """Você é um otimizador logístico industrial especializado em operações de pátio.
Sua função é analisar manifestos de carga e otimizar a sequência de tarefas para empilhadeiras.

REGRAS:
- Responda SEMPRE em JSON válido, sem markdown, sem blocos de código
- Minimize a distância total percorrida pelas empilhadeiras
- Respeite a sequência obrigatória do manifesto quando especificada
- Balanceie a carga de trabalho entre as empilhadeiras disponíveis
- Priorize containers que bloqueiam o acesso a outros containers
- Todas as instruções devem ser em português brasileiro

FORMATO DE RESPOSTA:
{
    "task_assignments": [
        {
            "container_id": "uuid",
            "forklift_id": "uuid",
            "priority": 1-10,
            "estimated_duration_seconds": int,
            "waypoints": [{"x": float, "y": float}],
            "instructions": "string em português"
        }
    ],
    "total_estimated_time_seconds": int,
    "optimization_notes": "string em português com observações sobre a otimização"
}"""


async def optimize_manifest(
    manifest_id: uuid.UUID,
    containers: list[dict],
    forklifts: list[dict],
    tenant_id: str,
    yard_id: str,
) -> None:
    """
    Optimize manifest task assignments using Claude API.
    Runs asynchronously - publishes result via WebSocket when done.
    """
    client = _get_client()

    user_prompt = json.dumps({
        "manifest_id": str(manifest_id),
        "containers": containers,
        "forklifts": forklifts,
    }, ensure_ascii=False)

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
