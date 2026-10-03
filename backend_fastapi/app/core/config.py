import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Tulsi Mart API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database Settings (No hardcoded passwords or secrets in python code)
    DATABASE_URL: str = Field(
        default="",
        description="Database Connection String (MySQL for Vercel/Render Cloud, SQLite3 for Localhost)"
    )
    MYSQL_URL: str = Field(default="", description="Raw MySQL Connection URL")
    DB_NAME: str = Field(default="defaultdb")
    DB_USER: str = Field(default="avnadmin")
    DB_PASSWORD: str = Field(default="")
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=3306)
    DB_SSL_MODE: str = Field(default="REQUIRED")

    # Localhost SQLite Fallback Connection
    LOCAL_SQLITE_URL: str = "sqlite:///./tulsimart.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str, info) -> str:
        # 1. Detect if running in Cloud Hosted Environment (Vercel / Render / Production website/app)
        is_cloud_env = (
            os.getenv("VERCEL") is not None
            or os.getenv("RENDER") is not None
            or os.getenv("VERCEL_ENV") is not None
            or os.getenv("RENDER_SERVICE_ID") is not None
            or os.getenv("ENVIRONMENT", "").lower() in ["production", "prod", "cloud", "render", "vercel"]
        )

        # 2. If running on Cloud Website/App (Vercel / Render / Production), connect to MySQL (Aiven)
        if is_cloud_env:
            values = info.data if info else {}
            cloud_url = (
                values.get("MYSQL_URL")
                or os.getenv("MYSQL_URL")
                or (v if (v and not str(v).startswith("sqlite")) else "")
            )
            if cloud_url and isinstance(cloud_url, str) and cloud_url.strip() and not cloud_url.strip().startswith("sqlite"):
                url = cloud_url.strip()
                if url.startswith("mysql://"):
                    return url.replace("mysql://", "mysql+pymysql://", 1)
                elif url.startswith("mysql+aiomysql://"):
                    return url.replace("mysql+aiomysql://", "mysql+pymysql://", 1)
                return url

            db_user = values.get("DB_USER") or os.getenv("DB_USER", "avnadmin")
            db_pass = values.get("DB_PASSWORD") or os.getenv("DB_PASSWORD", "")
            db_host = values.get("DB_HOST") or os.getenv("DB_HOST", "tulsi-mart-08-zeelptl028-e556.e.aivencloud.com")
            db_port = values.get("DB_PORT") or os.getenv("DB_PORT", 18925)
            db_name = values.get("DB_NAME") or os.getenv("DB_NAME", "defaultdb")
            if db_pass:
                return f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

        # 3. If running locally from VS Code or local machine, connect to SQLite3
        if v and isinstance(v, str) and v.strip() and v.strip().startswith("sqlite"):
            return v.strip()

        return "sqlite:///./tulsimart.db"

    # Production-Safe Connection Pool Settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # JWT Security
    JWT_SECRET_KEY: str = Field(default="tulsimart_default_super_secret_key_change_me")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS Allowed Origins
    FRONTEND_URL: Union[str, List[str]] = Field(
        default=[
            "https://tulsi-mart.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000"
        ]
    )

    @field_validator("FRONTEND_URL", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return [
            "https://tulsi-mart.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000"
        ]

    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"


settings = Settings()


