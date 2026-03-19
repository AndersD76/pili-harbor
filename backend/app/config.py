from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = ""
    MQTT_BROKER_URL: str = ""
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    ANTHROPIC_API_KEY: str = ""
    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = "*"
    ENVIRONMENT: str = "development"

    # Position engine defaults
    RSSI_1M: float = -40.0
    PATH_LOSS_EXPONENT: float = 2.5
    EMA_ALPHA: float = 0.3
    POSITION_HISTORY_INTERVAL: int = 30  # seconds
    CONTAINER_TTL: int = 300  # seconds
    FORKLIFT_TTL: int = 60  # seconds

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
