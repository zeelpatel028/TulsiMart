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

    # Database Settings - Pure MySQL
    DATABASE_URL: str = Field(
        default="",
        description="MySQL Database Connection String"
    )
    MYSQL_URL: str = Field(default="", description="Raw MySQL Connection URL")
    DB_NAME: str = Field(default="defaultdb")
    DB_USER: str = Field(default="avnadmin")
    DB_PASSWORD: str = Field(default="")
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=3306)
    DB_SSL_MODE: str = Field(default="REQUIRED")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str, info) -> str:
        if v and isinstance(v, str) and v.strip():
            url = v.strip()
            # Normalize any existing mysql/postgres/aiomysql prefix to mysql+pymysql
            if url.startswith("mysql+aiomysql://"):
                url = url.replace("mysql+aiomysql://", "mysql+pymysql://", 1)
            elif url.startswith("mysql://"):
                url = url.replace("mysql://", "mysql+pymysql://", 1)
            elif url.startswith("postgresql://") or url.startswith("postgres://"):
                raise ValueError("PostgreSQL is not supported. Tulsi Mart backend requires MySQL.")
            elif url.startswith("sqlite"):
                raise ValueError("SQLite is not supported. Tulsi Mart backend requires MySQL.")
            return url

        values = info.data if info else {}
        mysql_url = values.get("MYSQL_URL")
        if mysql_url and isinstance(mysql_url, str) and mysql_url.strip():
            url = mysql_url.strip()
            if url.startswith("mysql://"):
                url = url.replace("mysql://", "mysql+pymysql://", 1)
            elif url.startswith("mysql+aiomysql://"):
                url = url.replace("mysql+aiomysql://", "mysql+pymysql://", 1)
            return url

        db_user = values.get("DB_USER", "avnadmin")
        db_pass = values.get("DB_PASSWORD", "")
        db_host = values.get("DB_HOST", "localhost")
        db_port = values.get("DB_PORT", 3306)
        db_name = values.get("DB_NAME", "defaultdb")
        
        return f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

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
