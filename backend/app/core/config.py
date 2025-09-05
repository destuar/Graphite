'''
File: app/core/config.py
Purpose: Centralized application configuration via pydantic-settings
Dependencies: pydantic, pydantic-settings
Imports: BaseSettings/Field (config modeling), lru_cache (memoization)
Exports: Settings (config model), get_settings() (singleton accessor)
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    env: str = Field(default="dev", env=["NODE_ENV"])  # dev|staging|prod
    debug: bool = Field(default=True)  # default true locally
    port: int = Field(default=8000, env=["BACKEND_PORT", "PORT"])  # uvicorn port

    # DB and storage
    secrets_provider: Optional[str] = Field(default=None, env=["SECRETS_PROVIDER"]) 
    database_secret_name: Optional[str] = Field(default=None, env=["DATABASE_SECRET_NAME"])  
    db_host: Optional[str] = Field(default=None, env=["AWS_HOST_NAME"]) 
    db_port: int = Field(default=5432) 
    db_name: Optional[str] = Field(default="graphite-db") 
    db_sslmode: Optional[str] = Field(default="require")  # e.g., require, disable
    chroma_db_dir: str = Field(default=".chroma")  # local path for ChromaDB

    # AWS (S3 and RDS)
    aws_region: Optional[str] = Field(default=None, env=["AWS_REGION"]) 
    aws_access_key_id: Optional[str] = Field(default=None, env=["AWS_ACCESS_KEY_ID"]) 
    aws_secret_access_key: Optional[str] = Field(default=None, env=["AWS_SECRET_ACCESS_KEY"]) 
    s3_bucket: Optional[str] = Field(default=None, env=["S3_BUCKET"]) 

    # Auth/JWT
    jwt_secret: Optional[str] = Field(default=None, env=["JWT_SECRET"]) 
    jwt_refresh_secret: Optional[str] = Field(default=None, env=["JWT_REFRESH_SECRET"]) 
    jwt_expires_in: str = Field(default="15m", env=["JWT_EXPIRES_IN"]) 

    # CORS
    cors_origin: str = Field(default="http://localhost:3000", env=["CORS_ORIGIN", "FRONTEND_URL"]) 

    # LLM routing
    openai_api_key: Optional[str] = Field(default=None, env=["OPENAI_API_KEY"]) 
    anthropic_api_key: Optional[str] = Field(default=None, env=["ANTHROPIC_API_KEY"]) 
    gemini_api_key: Optional[str] = Field(default=None, env=["GEMINI_API_KEY"]) 
    perplexity_api_key: Optional[str] = Field(default=None, env=["PERPLEXITY_API_KEY"]) 

    # Default models (frontend may override via request payload)
    openai_model: str = Field(default="gpt-4o-mini") 
    anthropic_model: str = Field(default="claude-3-5-sonnet-20240620") 
    gemini_model: str = Field(default="gemini-1.5-flash") 
    perplexity_model: str = Field(default="llama-3.1-sonar-small-128k-online") 

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


