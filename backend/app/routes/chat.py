'''
File: app/routes/chat.py
Purpose: Chat controller exposing SSE streaming endpoint for model responses
Dependencies: fastapi, config, llm_router, provider adapters, pydantic models
Imports: APIRouter/StreamingResponse, settings, LLMRouter, OpenAIAdapter, ChatStreamRequest
Exports: router (APIRouter)
Created: 2025-09-05
Last Modified: 2025-09-05
'''

import asyncio
import json
from typing import Any, AsyncIterator, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from ..core.config import get_settings
from ..services.llm_router import LLMRouter, Provider
from ..services.adapters.openai_adapter import OpenAIAdapter
from ..models.chat import ChatStreamRequest
from ..core.database import db_enabled
from ..services import chat_persist

router = APIRouter()


def _build_router() -> LLMRouter:
    settings = get_settings()
    adapters: Dict[Provider, Any] = {}

    if settings.openai_api_key:
        adapters[Provider.OPENAI] = OpenAIAdapter(
            api_key=settings.openai_api_key,
            default_model=settings.openai_model,
        )

    # Stubs for future providers can be added similarly

    if not adapters:
        raise RuntimeError("No LLM providers configured. Set OPENAI_API_KEY or other provider keys.")

    default_provider = Provider(settings.llm_provider) if settings.llm_provider in Provider._value2member_map_ else Provider.OPENAI
    return LLMRouter(adapters=adapters, default_provider=default_provider)


def get_router() -> LLMRouter:
    # For now, build a fresh router. Can be optimized to a singleton if desired.
    return _build_router()


def _sse(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


class ChatMessage(Dict[str, str]):
    pass


@router.post("/stream")
async def stream_chat(
    request: Request,
    payload: ChatStreamRequest,
    llm: LLMRouter = Depends(get_router),
) -> StreamingResponse:
    """
    Request body example:
    {
      "messages": [{"role": "user", "content": "Hello"}],
      "provider": "openai",
      "model": "gpt-4o-mini"
    }
    """

    messages = [m.model_dump() for m in payload.messages]
    provider: Optional[str] = payload.provider
    model: Optional[str] = payload.model

    async def event_generator() -> AsyncIterator[bytes]:
        # Optional: initial event
        yield _sse("message_start", {"ok": True}).encode("utf-8")
        try:
            # Optionally create session and persist user prompt
            session_id = None
            if db_enabled():
                try:
                    session_id = await chat_persist.create_session()
                    await chat_persist.append_message(session_id, role="user", content=messages[-1]["content"])  # last is user
                except Exception:
                    session_id = None
            async for delta in llm.stream_chat(messages=messages, provider=provider, model=model, temperature=payload.temperature):
                # If client disconnected, stop streaming
                if await request.is_disconnected():
                    break
                if delta:
                    yield _sse("message_delta", {"delta": delta}).encode("utf-8")
                await asyncio.sleep(0)  # cooperative yielding
        except Exception as exc:  # surface as error event
            yield _sse("error", {"message": str(exc)}).encode("utf-8")
        finally:
            yield _sse("message_complete", {}).encode("utf-8")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable proxy buffering
        },
    )


