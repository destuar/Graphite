'''
File: app/core/database.py
Purpose: Prisma client initialization and lifecycle management
Dependencies: prisma
Imports: Prisma (client)
Exports: prisma (singleton client), lifespan hooks
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from typing import AsyncIterator, Any
from contextlib import asynccontextmanager

import os
from prisma import Prisma
from .secrets import resolve_database_url

prisma = Prisma()
_db_enabled: bool = False


async def connect_db() -> None:
    # Set DATABASE_URL from AWS Secrets if provided
    resolved = resolve_database_url()
    if resolved:
        os.environ["DATABASE_URL"] = resolved
        global _db_enabled
        _db_enabled = True
        await prisma.connect()


async def disconnect_db() -> None:
    if _db_enabled:
        await prisma.disconnect()


@asynccontextmanager
async def lifespan(app: Any) -> AsyncIterator[None]:
    await connect_db()
    try:
        yield
    finally:
        await disconnect_db()


def db_enabled() -> bool:
    return _db_enabled


