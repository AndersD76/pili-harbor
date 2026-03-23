"""IMDG Code 7.2.4 — Segregation engine for dangerous goods.

Levels:
  1 = Away from           (min 3m)
  2 = Separated from      (min 6m)
  3 = Separated by compartment (min 12m)
  4 = Separated longitudinally (min 24m)
  0 = No restriction
  X = Consult DG list (treated as level 2 by default)
"""
import math
from dataclasses import dataclass

# Segregation matrix — row=class_a, col=class_b
# Classes indexed: 1, 2.1, 2.2, 2.3, 3, 4.1, 4.2, 4.3,
#                  5.1, 5.2, 6.1, 6.2, 7, 8, 9
_CLASSES = [
    "1", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3",
    "5.1", "5.2", "6.1", "6.2", "7", "8", "9",
]
_IDX = {c: i for i, c in enumerate(_CLASSES)}

# fmt: off
_MATRIX = [
    #  1  2.1 2.2 2.3  3  4.1 4.2 4.3 5.1 5.2 6.1 6.2  7   8   9
    [  0,  4,  2,  4,  4,  4,  4,  4,  4,  4,  2,  4,  2,  4,  0],  # 1
    [  4,  0,  0,  0,  2,  1,  2,  0,  2,  2,  0,  0,  2,  1,  0],  # 2.1
    [  2,  0,  0,  0,  1,  0,  1,  0,  1,  1,  0,  0,  1,  0,  0],  # 2.2
    [  4,  0,  0,  0,  2,  0,  2,  0,  2,  2,  0,  0,  2,  0,  0],  # 2.3
    [  4,  2,  1,  2,  0,  0,  2,  1,  2,  2,  0,  0,  2,  0,  0],  # 3
    [  4,  1,  0,  0,  0,  0,  1,  0,  2,  2,  0,  0,  2,  1,  0],  # 4.1
    [  4,  2,  1,  2,  2,  1,  0,  1,  2,  2,  1,  0,  2,  1,  0],  # 4.2
    [  4,  0,  0,  0,  1,  0,  1,  0,  2,  2,  0,  0,  2,  1,  0],  # 4.3
    [  4,  2,  1,  2,  2,  2,  2,  2,  0,  2,  1,  0,  2,  2,  0],  # 5.1
    [  4,  2,  1,  2,  2,  2,  2,  2,  2,  0,  1,  0,  2,  2,  0],  # 5.2
    [  2,  0,  0,  0,  0,  0,  1,  0,  1,  1,  0,  0,  1,  0,  0],  # 6.1
    [  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  0,  0],  # 6.2
    [  2,  2,  1,  2,  2,  2,  2,  2,  2,  2,  1,  1,  0,  2,  0],  # 7
    [  4,  1,  0,  0,  0,  1,  1,  1,  2,  2,  0,  0,  2,  0,  0],  # 8
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],  # 9
]
# fmt: on

_LEVEL_DISTANCES = {0: 0, 1: 3, 2: 6, 3: 12, 4: 24}


@dataclass
class ValidationResult:
    ok: bool
    level: str  # ok / warning / blocked
    reason: str = ""
    min_distance_m: float = 0


def _normalize_class(cls: str) -> str:
    """Normalize IMO class string (e.g. '1.1' -> '1')."""
    if not cls:
        return ""
    cls = cls.strip()
    # Subclasses of class 1 all map to "1"
    if cls.startswith("1"):
        return "1"
    # Map subclasses like "2.1", "4.1" etc.
    if cls in _IDX:
        return cls
    # Try major class
    major = cls.split(".")[0]
    if major in _IDX:
        return major
    return cls


def get_segregation_level(
    class_a: str, class_b: str,
) -> int:
    """Return segregation level (0-4) between two classes."""
    a = _normalize_class(class_a)
    b = _normalize_class(class_b)
    if not a or not b:
        return 0
    ia = _IDX.get(a)
    ib = _IDX.get(b)
    if ia is None or ib is None:
        return 2  # unknown = cautious default
    return _MATRIX[ia][ib]


def get_min_distance_meters(level: int) -> float:
    """Minimum distance in meters for a segregation level."""
    return _LEVEL_DISTANCES.get(level, 6)


def _distance(x1, y1, x2, y2) -> float:
    dx = (x1 or 0) - (x2 or 0)
    dy = (y1 or 0) - (y2 or 0)
    return math.sqrt(dx * dx + dy * dy)


def validate_placement(
    imo_class: str,
    target_x: float,
    target_y: float,
    yard_containers: list[dict],
) -> ValidationResult:
    """Validate IMO container placement against all DG in yard.

    yard_containers: list of dicts with keys:
        imo_class, x_meters, y_meters, code
    """
    if not imo_class:
        return ValidationResult(ok=True, level="ok")

    violations = []
    for c in yard_containers:
        other_class = c.get("imo_class")
        if not other_class:
            continue
        seg = get_segregation_level(imo_class, other_class)
        if seg == 0:
            continue
        min_dist = get_min_distance_meters(seg)
        actual = _distance(
            target_x, target_y,
            c.get("x_meters", 0), c.get("y_meters", 0),
        )
        if actual < min_dist:
            violations.append(
                f"{c.get('code', '?')} (IMO {other_class}): "
                f"{actual:.1f}m < {min_dist}m mínimo "
                f"(segregação nível {seg})"
            )

    if violations:
        return ValidationResult(
            ok=False,
            level="blocked",
            reason=(
                "Violação IMDG 7.2.4: "
                + "; ".join(violations)
            ),
        )
    return ValidationResult(ok=True, level="ok")


def validate_stack_imo(
    container_imo: str,
    stack_containers: list[dict],
) -> ValidationResult:
    """IMO containers cannot stack with non-IMO and vice-versa.
    Different incompatible IMO classes cannot share a stack.
    """
    if not container_imo:
        # Non-IMO on stack with IMO?
        for c in stack_containers:
            if c.get("imo_class"):
                return ValidationResult(
                    ok=False,
                    level="blocked",
                    reason=(
                        "Não é permitido empilhar carga geral "
                        "sobre container IMO"
                    ),
                )
        return ValidationResult(ok=True, level="ok")

    # IMO container going on stack
    for c in stack_containers:
        other = c.get("imo_class")
        if not other:
            return ValidationResult(
                ok=False,
                level="blocked",
                reason=(
                    "Container IMO não pode ser empilhado "
                    "sobre carga geral"
                ),
            )
        seg = get_segregation_level(container_imo, other)
        if seg >= 2:
            return ValidationResult(
                ok=False,
                level="blocked",
                reason=(
                    f"IMO {container_imo} incompatível "
                    f"com IMO {other} na mesma pilha "
                    f"(segregação nível {seg})"
                ),
            )
    return ValidationResult(ok=True, level="ok")
