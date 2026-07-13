import os
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/frauddb",
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-secret-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS - kept as a plain string field so pydantic-settings doesn't try to
    # JSON-decode it (it auto-JSON-parses any field typed as list/dict when
    # the env var is set, which breaks on a plain comma-separated string).
    # alias="CORS_ORIGINS" keeps the env var name unchanged.
    CORS_ORIGINS_RAW: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS_RAW.split(",") if o.strip()]

    # App
    APP_NAME: str = "Fraud Detection API"
    ENV: str = os.getenv("ENV", "development")

    # Default admin (created on first boot)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@frauddetect.io")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin123!")

    class Config:
        env_file = ".env"


settings = Settings()
