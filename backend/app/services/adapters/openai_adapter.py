'''
File: app/services/adapters/openai_adapter.py
Purpose: OpenAI provider adapter implementing streaming chat completions
Dependencies: openai
Imports: AsyncOpenAI (OpenAI SDK)
Exports: OpenAIAdapter (streaming adapter)
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from typing import Any, AsyncIterator, Dict, List, Optional

from openai import AsyncOpenAI


class OpenAIAdapter:
    def __init__(self, api_key: str, default_model: str) -> None:
        self.client = AsyncOpenAI(api_key=api_key)
        self.default_model = default_model

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        model_name = model or self.default_model
        # The OpenAI Chat Completions API supports streaming token deltas
        stream = await self.client.chat.completions.create(
            model=model_name,
            messages=messages,
            stream=True,
            temperature=kwargs.get("temperature", 0.2),
        )

        async for event in stream:
            try:
                delta = event.choices[0].delta.content or ""
            except Exception:
                delta = ""
            if delta:
                yield delta


