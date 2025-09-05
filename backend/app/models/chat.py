'''
File: app/models/chat.py
Purpose: Pydantic request models for chat streaming API
Dependencies: pydantic
Imports: BaseModel/Field (validation), typing (types)
Exports: ChatMessage, ChatStreamRequest
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1)


class ChatStreamRequest(BaseModel):
    messages: List[ChatMessage] = Field(min_items=1)
    provider: Optional[str] = Field(default=None, description="openai|anthropic|gemini|perplexity")
    model: Optional[str] = Field(default=None)
    temperature: Optional[float] = Field(default=0.2, ge=0.0, le=2.0)


