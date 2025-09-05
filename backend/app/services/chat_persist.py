'''
File: app/services/chat_persist.py
Purpose: Chat persistence service using Prisma client
Dependencies: prisma
Imports: prisma client
Exports: create_session, append_message
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from typing import Optional

from ..core.database import prisma


async def create_session(title: str = "New Chat") -> str:
    rec = await prisma.chatsession.create(
        data={"title": title},
        select={"id": True},
    )
    return rec["id"]


async def append_message(session_id: str, role: str, content: str) -> None:
    await prisma.message.create(
        data={
            "sessionId": session_id,
            "role": role.upper(),
            "content": content,
        }
    )


