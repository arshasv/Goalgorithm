from pathlib import Path

from dotenv import load_dotenv

_env_file = Path(__file__).resolve().parent.parent / ".env"
if _env_file.exists():
    load_dotenv(_env_file, override=False)


import os  # noqa: E402 — load_dotenv must run first


class Settings:

    def __init__(self) -> None:
        self.app_name: str = os.environ.get("APP_NAME", "FIFA Scoring System")
        self.environment: str = os.environ.get("APP_ENV", "development")
        self.debug: bool = os.environ.get("DEBUG", "false").lower() == "true"

        self.api_prefix: str = os.environ.get("API_PREFIX", "/api/v1")
        self.api_version: str = os.environ.get("API_VERSION", "v1")
        self.host: str = os.environ.get("HOST", "0.0.0.0")
        self.port: int = int(os.environ.get("PORT", "8000"))

        self.database_url: str = os.environ.get(
            "DATABASE_URL",
            "postgresql://fifa_user:fifa_password@postgres:5432/fifa_scoring_db",
        )
        self.db_pool_size: int = int(os.environ.get("DB_POOL_SIZE", "5"))
        self.db_max_overflow: int = int(os.environ.get("DB_MAX_OVERFLOW", "10"))
        self.db_pool_pre_ping: bool = (
            os.environ.get("DB_POOL_PRE_PING", "true").lower() == "true"
        )
        self.db_pool_recycle: int = int(os.environ.get("DB_POOL_RECYCLE", "3600"))
        self.db_echo_sql: bool = (
            os.environ.get("DB_ECHO_SQL", "false").lower() == "true"
        )

        self.secret_key: str = os.environ.get("SECRET_KEY", "development_secret_key")
        self.access_token_expire_minutes: int = int(
            os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )


settings = Settings()
