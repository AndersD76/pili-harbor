"""Dwell time and free time calculations.

Based on ANTAQ regulations (Resolution 72/2022, 112/2024).
"""
from datetime import datetime, timedelta, timezone


def get_free_time_days(cargo_type: str) -> int:
    """Default free time by cargo type (ANTAQ standard)."""
    if cargo_type == "reefer":
        return 5
    return 7


def calculate_free_time_expiry(
    gate_in_at: datetime,
    cargo_type: str,
    custom_days: int | None = None,
) -> datetime:
    """Calculate when free time expires."""
    days = custom_days or get_free_time_days(cargo_type)
    return gate_in_at + timedelta(days=days)


def get_dwell_status(
    gate_in_at: datetime | None,
    free_time_expires_at: datetime | None,
    gate_out_at: datetime | None = None,
) -> dict:
    """Calculate current dwell time status.

    Returns dict with:
      dwell_days, is_over_free_time, demurrage_days,
      urgency (green/yellow/red)
    """
    if not gate_in_at:
        return {
            "dwell_days": 0,
            "is_over_free_time": False,
            "demurrage_days": 0,
            "urgency": "green",
        }

    now = gate_out_at or datetime.now(timezone.utc)
    dwell = (now - gate_in_at).total_seconds() / 86400
    dwell_days = round(dwell, 1)

    if not free_time_expires_at:
        return {
            "dwell_days": dwell_days,
            "is_over_free_time": False,
            "demurrage_days": 0,
            "urgency": "green",
        }

    over = (now - free_time_expires_at).total_seconds() / 86400
    is_over = over > 0
    demurrage_days = round(max(0, over), 1)

    # Urgency: green < 80% of free time, yellow >= 80%, red = over
    free_total = (
        free_time_expires_at - gate_in_at
    ).total_seconds() / 86400
    pct = dwell / free_total if free_total > 0 else 0

    if is_over:
        urgency = "red"
    elif pct >= 0.8:
        urgency = "yellow"
    else:
        urgency = "green"

    return {
        "dwell_days": dwell_days,
        "is_over_free_time": is_over,
        "demurrage_days": demurrage_days,
        "urgency": urgency,
    }
