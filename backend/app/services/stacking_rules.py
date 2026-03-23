"""Stacking rules engine for container yard operations.

Based on international port practices and NR-29.
"""
from dataclasses import dataclass


@dataclass
class StackValidation:
    ok: bool
    level: str  # ok / warning / blocked
    reasons: list[str]


# Max stack heights by container category
_MAX_STACK = {
    "full_20": 5,
    "full_40": 4,
    "empty": 7,
    "imo": 2,
    "reefer": 3,
}


def _container_category(c: dict) -> str:
    """Determine stacking category for a container."""
    if c.get("cargo_type") == "imo":
        return "imo"
    if c.get("cargo_type") == "reefer" or c.get("is_reefer"):
        return "reefer"
    if c.get("cargo_type") == "empty":
        return "empty"
    iso = c.get("iso_type") or ""
    if iso.startswith("4"):
        return "full_40"
    return "full_20"


def _is_40ft(c: dict) -> bool:
    iso = c.get("iso_type") or ""
    return iso.startswith("4")


def _is_20ft(c: dict) -> bool:
    iso = c.get("iso_type") or ""
    return iso.startswith("2") or not iso


def validate_stack_placement(
    container: dict,
    stack: list[dict],
) -> StackValidation:
    """Validate placing container on top of a stack.

    container: dict with cargo_type, iso_type, weight_kg,
               is_reefer, imo_class, cargo_type
    stack: list of containers already in the stack,
           ordered by stack_level ascending (bottom first)
    """
    reasons = []
    cat = _container_category(container)

    # 1. Max height
    max_h = _MAX_STACK.get(cat, 5)
    new_level = len(stack)
    if new_level >= max_h:
        reasons.append(
            f"Altura máxima excedida: {new_level + 1} "
            f"> {max_h} para {cat}"
        )

    # 2. Weight-on-top: new container must be <= top of stack
    if stack:
        top = stack[-1]
        new_w = container.get("weight_kg") or 0
        top_w = top.get("weight_kg") or 0
        if new_w > 0 and top_w > 0 and new_w > top_w * 1.1:
            reasons.append(
                f"Peso superior maior que inferior: "
                f"{new_w:.0f}kg > {top_w:.0f}kg "
                f"(regra weight-on-top)"
            )

    # 3. 40ft cannot go on top of 20ft
    if _is_40ft(container) and stack:
        for s in stack:
            if _is_20ft(s):
                reasons.append(
                    "Container 40ft não pode ficar "
                    "sobre container 20ft"
                )
                break

    # 4. Empty/full mixing
    is_empty = cat == "empty"
    if stack and is_empty:
        for s in stack:
            if _container_category(s) != "empty":
                reasons.append(
                    "Container vazio não pode ser empilhado "
                    "com containers cheios"
                )
                break
    if stack and not is_empty:
        for s in stack:
            if _container_category(s) == "empty":
                reasons.append(
                    "Container cheio não pode ser empilhado "
                    "sobre container vazio"
                )
                break

    if not reasons:
        return StackValidation(ok=True, level="ok", reasons=[])

    # IMO/height violations are blocking; weight is warning
    has_blocking = any(
        "máxima" in r or "40ft" in r
        or "vazio" in r or "IMO" in r
        for r in reasons
    )
    return StackValidation(
        ok=not has_blocking,
        level="blocked" if has_blocking else "warning",
        reasons=reasons,
    )


def get_max_stack_for_category(
    cargo_type: str, iso_type: str = "",
    is_reefer: bool = False,
) -> int:
    """Return max stack height for a container category."""
    if cargo_type == "imo":
        return _MAX_STACK["imo"]
    if cargo_type == "reefer" or is_reefer:
        return _MAX_STACK["reefer"]
    if cargo_type == "empty":
        return _MAX_STACK["empty"]
    if iso_type and iso_type.startswith("4"):
        return _MAX_STACK["full_40"]
    return _MAX_STACK["full_20"]
