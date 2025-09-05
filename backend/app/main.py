'''
File: app/main.py
Purpose: FastAPI entry point for Graphite MVP; mounts routers and exposes health endpoints
Dependencies: fastapi
Imports: FastAPI, CORSMiddleware, settings, chat router, db lifespan
Exports: app (FastAPI application)
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .routes.chat import router as chat_router
from .core.database import lifespan as db_lifespan


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Graphite Backend", version="0.1.0", lifespan=db_lifespan)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.cors_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

    # Health
    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok"}

    @app.get("/ready")
    async def ready() -> dict:
        return {"status": "ready"}

    return app


app = create_app()


