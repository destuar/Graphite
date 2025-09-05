'''
File: app/services/llm_router.py
Purpose: Provider-agnostic router for streaming chat across multiple LLM vendors
Dependencies: Provider adapters implementing stream_chat
Imports: Enum/typing (types)
Exports: Provider (enum), LLMRouter (router class)
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from enum import Enum
from typing import Any, AsyncIterator, Dict, Iterable, List, Optional


class Provider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    PERPLEXITY = "perplexity"


class LLMRouter:
    def __init__(
        self,
        adapters: Dict[Provider, Any],
        default_provider: Provider,
    ) -> None:
        self.adapters = adapters
        self.default_provider = default_provider

    def _resolve(self, provider: Optional[str]) -> Provider:
        if provider is None:
            return self.default_provider
        provider_lower = provider.lower()
        for p in Provider:
            if p.value == provider_lower:
                return p
        return self.default_provider

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        provider: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        p = self._resolve(provider)
        if p not in self.adapters:
            raise RuntimeError(f"Provider not configured: {p}")
        adapter = self.adapters[p]
        async for delta in adapter.stream_chat(messages=messages, model=model, **kwargs):
            yield delta


