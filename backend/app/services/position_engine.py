import math
from dataclasses import dataclass

from app.config import get_settings

settings = get_settings()


@dataclass
class Point:
    x: float
    y: float


@dataclass
class RSSIReading:
    anchor_x: float
    anchor_y: float
    rssi: float
    distance: float | None = None


def rssi_to_distance(rssi: float, rssi_1m: float = None, path_loss_exp: float = None) -> float:
    """Convert RSSI to distance using log-distance path loss model."""
    rssi_1m = rssi_1m or settings.RSSI_1M
    path_loss_exp = path_loss_exp or settings.PATH_LOSS_EXPONENT
    return 10 ** ((rssi_1m - rssi) / (10 * path_loss_exp))


def trilaterate(readings: list[RSSIReading]) -> Point | None:
    """
    Weighted least squares trilateration.
    Requires at least 3 anchor readings.
    """
    if len(readings) < 3:
        return None

    # Calculate distances from RSSI if not provided
    for r in readings:
        if r.distance is None:
            r.distance = rssi_to_distance(r.rssi)

    # Weight by inverse distance (closer = more reliable)
    weights = []
    for r in readings:
        w = 1.0 / max(r.distance, 0.1)  # Avoid division by zero
        weights.append(w)

    total_weight = sum(weights)
    weights = [w / total_weight for w in weights]

    # Use weighted least squares
    # Linearize the trilateration equations using the first anchor as reference
    ref = readings[0]
    A_rows = []
    b_rows = []

    for i in range(1, len(readings)):
        r = readings[i]
        a_x = 2 * (r.anchor_x - ref.anchor_x)
        a_y = 2 * (r.anchor_y - ref.anchor_y)
        b_val = (
            ref.distance**2 - r.distance**2
            + r.anchor_x**2 - ref.anchor_x**2
            + r.anchor_y**2 - ref.anchor_y**2
        )
        w = weights[i]
        A_rows.append((a_x * w, a_y * w))
        b_rows.append(b_val * w)

    if len(A_rows) < 2:
        return None

    # Solve Ax = b using pseudo-inverse (A^T A)^-1 A^T b
    # For 2D, A is Nx2, b is Nx1
    ata_00 = sum(a[0] * a[0] for a in A_rows)
    ata_01 = sum(a[0] * a[1] for a in A_rows)
    ata_11 = sum(a[1] * a[1] for a in A_rows)
    atb_0 = sum(A_rows[i][0] * b_rows[i] for i in range(len(A_rows)))
    atb_1 = sum(A_rows[i][1] * b_rows[i] for i in range(len(A_rows)))

    det = ata_00 * ata_11 - ata_01 * ata_01
    if abs(det) < 1e-10:
        return None

    x = (ata_11 * atb_0 - ata_01 * atb_1) / det
    y = (ata_00 * atb_1 - ata_01 * atb_0) / det

    return Point(x=x, y=y)


def smooth_position(
    new_pos: Point,
    old_pos: Point | None,
    alpha: float = None,
) -> Point:
    """Exponential moving average smoothing."""
    alpha = alpha or settings.EMA_ALPHA
    if old_pos is None:
        return new_pos
    return Point(
        x=alpha * new_pos.x + (1 - alpha) * old_pos.x,
        y=alpha * new_pos.y + (1 - alpha) * old_pos.y,
    )


def calculate_confidence(readings: list[RSSIReading]) -> float:
    """Calculate position confidence based on number and quality of readings."""
    if not readings:
        return 0.0

    n = min(len(readings) / 3.0, 1.0)  # More anchors = better
    avg_rssi = sum(r.rssi for r in readings) / len(readings)
    signal_quality = max(0.0, min(1.0, (avg_rssi + 80) / 40))  # Map -80...-40 to 0...1
    return round(n * 0.5 + signal_quality * 0.5, 3)


def calculate_bearing(from_point: Point, to_point: Point) -> float:
    """Calculate bearing in degrees from one point to another."""
    dx = to_point.x - from_point.x
    dy = to_point.y - from_point.y
    angle = math.degrees(math.atan2(dy, dx))
    return angle % 360


def calculate_distance(p1: Point, p2: Point) -> float:
    """Calculate Euclidean distance between two points."""
    return math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
