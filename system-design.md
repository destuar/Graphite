# Streaming Chatbot System Design

## System Overview

A clean, ChatGPT-style streaming chatbot using OpenAI API with Pydantic AI, featuring real-time streaming responses and persistent chat history managed by Prisma ORM.

### Architecture Stack
- **Backend**: Python (FastAPI + Pydantic AI) + TypeScript (Prisma)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Streaming**: Server-Sent Events (SSE)
- **State Management**: React Context + Zustand

## File Documentation Standard

Every file must include a header comment block following this template:

```python
'''
File: filename.py
Purpose: Brief description of what this file does and its role in the system
Dependencies: List of external dependencies and internal modules
Imports: Key imports and their purposes
Exports: Functions, classes, and variables exported by this module
Author: Development team
Created: Date
Last Modified: Date
'''
```

## Project Structure

### Backend Structure (Python + Prisma)
```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   └── migrations/             # Database migrations
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Prisma client setup
│   │   └── dependencies.py    # FastAPI dependency injection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── chat.py           # Pydantic models for chat operations
│   │   ├── message.py        # Message schema validation
│   │   └── streaming.py      # Streaming response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_agent.py       # Pydantic AI integration
│   │   ├── chat_service.py   # Chat business logic
│   │   ├── database_service.py # Database operations with Prisma
│   │   └── streaming_service.py # SSE streaming logic
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── chat.py           # Chat API endpoints
│   │   ├── history.py        # Chat history endpoints
│   │   └── health.py         # Health check endpoints
│   └── utils/
│       ├── __init__.py
│       ├── logger.py         # Logging configuration
│       └── validators.py     # Custom validation functions
├── requirements.txt           # Python dependencies
└── pyproject.toml            # Project configuration
```

### Frontend Structure (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatInterface.tsx      # Main chat container
│   │   │   ├── MessageList.tsx        # Message display component
│   │   │   ├── MessageInput.tsx       # User input component
│   │   │   ├── StreamingMessage.tsx   # Real-time message streaming
│   │   │   └── TypingIndicator.tsx    # Typing animation
│   │   ├── Sidebar/
│   │   │   ├── ChatHistory.tsx        # Chat history sidebar
│   │   │   ├── SessionItem.tsx        # Individual session display
│   │   │   ├── SearchHistory.tsx      # History search functionality
│   │   │   └── NewChatButton.tsx      # New chat creation
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx          # Main application layout
│   │   │   ├── Header.tsx             # Application header
│   │   │   └── Sidebar.tsx            # Sidebar container
│   │   └── Common/
│   │       ├── LoadingSpinner.tsx     # Loading states
│   │       ├── ErrorBoundary.tsx      # Error handling
│   │       └── Toast.tsx              # Notification system
│   ├── hooks/
│   │   ├── useStreaming.ts            # SSE streaming logic
│   │   ├── useChatHistory.ts          # History management
│   │   ├── useLocalStorage.ts         # Browser storage
│   │   └── useDebounce.ts             # Input debouncing
│   ├── services/
│   │   ├── api.ts                     # API client configuration
│   │   ├── streaming.ts               # SSE event handling
│   │   └── storage.ts                 # Local storage utilities
│   ├── store/
│   │   ├── chatStore.ts               # Zustand chat state
│   │   └── uiStore.ts                 # UI state management
│   ├── types/
│   │   ├── chat.ts                    # Chat-related interfaces
│   │   ├── api.ts                     # API request/response types
│   │   └── common.ts                  # Shared type definitions
│   ├── utils/
│   │   ├── formatters.ts              # Data formatting utilities
│   │   ├── constants.ts               # Application constants
│   │   └── helpers.ts                 # General helper functions
│   └── styles/
│       ├── globals.css                # Global styles
│       └── components.css             # Component-specific styles
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Database Schema (Prisma)

### Prisma Schema Definition
```prisma
// prisma/schema.prisma
'''
File: schema.prisma
Purpose: Defines the database schema for the streaming chatbot application
Dependencies: Prisma ORM, PostgreSQL
Tables: ChatSession, Message
Relationships: One-to-many between sessions and messages
Author: Development team
'''

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ChatSession {
  id          String    @id @default(cuid())
  title       String    @default("New Chat")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  messages    Message[]
  
  @@map("chat_sessions")
}

model Message {
  id        String      @id @default(cuid())
  sessionId String      @map("session_id")
  role      MessageRole
  content   String      @db.Text
  createdAt DateTime    @default(now())
  
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
}
```

## Core Backend Files

### Database Configuration
```python
'''
File: app/core/database.py
Purpose: Initializes and configures Prisma client for database operations
Dependencies: prisma-client-py, asyncio
Imports: Prisma from prisma
Exports: get_db_client, close_db_client functions
Author: Development team
'''

from prisma import Prisma
from typing import Optional
import asyncio

class DatabaseManager:
    def __init__(self):
        self.client: Optional[Prisma] = None
    
    async def connect(self) -> Prisma:
        """Initialize and connect to database"""
        if self.client is None:
            self.client = Prisma()
            await self.client.connect()
        return self.client
    
    async def disconnect(self):
        """Disconnect from database"""
        if self.client:
            await self.client.disconnect()
            self.client = None

db_manager = DatabaseManager()

async def get_db_client() -> Prisma:
    """FastAPI dependency to get database client"""
    return await db_manager.connect()
```

### Chat Service
```python
'''
File: app/services/chat_service.py
Purpose: Handles chat business logic, session management, and message operations
Dependencies: Prisma client, Pydantic models, UUID generation
Imports: ChatSession, Message from prisma, UUID, datetime
Exports: ChatService class with CRUD operations
Author: Development team
'''

from prisma import Prisma
from prisma.models import ChatSession, Message
from typing import List, Optional
from uuid import uuid4
import datetime

class ChatService:
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_session(self, title: Optional[str] = None) -> ChatSession:
        """Create a new chat session"""
        session_title = title or f"Chat {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        return await self.db.chatsession.create({
            'title': session_title
        })
    
    async def get_sessions(self, limit: int = 50) -> List[ChatSession]:
        """Retrieve chat sessions with message counts"""
        return await self.db.chatsession.find_many(
            order={'updatedAt': 'desc'},
            take=limit,
            include={'messages': {'select': {'id': True}}}
        )
    
    async def get_session_messages(self, session_id: str) -> List[Message]:
        """Get all messages for a session"""
        return await self.db.message.find_many(
            where={'sessionId': session_id},
            order={'createdAt': 'asc'}
        )
    
    async def save_message(self, session_id: str, role: str, content: str) -> Message:
        """Save a message to the database"""
        return await self.db.message.create({
            'sessionId': session_id,
            'role': role.upper(),
            'content': content
        })
    
    async def update_session_timestamp(self, session_id: str):
        """Update session's updatedAt timestamp"""
        await self.db.chatsession.update(
            where={'id': session_id},
            data={'updatedAt': datetime.datetime.now()}
        )
```

### AI Agent Service
```python
'''
File: app/services/ai_agent.py
Purpose: Integrates Pydantic AI with OpenAI API for streaming chat responses
Dependencies: pydantic-ai, openai, asyncio
Imports: Agent from pydantic_ai, OpenAI configuration
Exports: AIAgentService class with streaming capabilities
Author: Development team
'''

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from typing import AsyncIterator, Dict, Any
import os
import asyncio

class AIAgentService:
    def __init__(self):
        self.model = OpenAIChatModel(
            'gpt-4',
            api_key=os.getenv('OPENAI_API_KEY')
        )
        
        self.agent = Agent(
            model=self.model,
            instructions="""You are a helpful AI assistant. 
            Provide clear, accurate, and engaging responses. 
            Keep responses conversational and friendly."""
        )
    
    async def stream_response(
        self, 
        message: str, 
        message_history: list = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream AI response using Pydantic AI"""
        
        try:
            # Format message history if provided
            conversation_context = self._format_history(message_history or [])
            
            # Stream response from agent
            async with self.agent.run_stream(
                message, 
                message_history=conversation_context
            ) as result:
                
                # Yield start event
                yield {
                    'event': 'message_start',
                    'data': {
                        'id': str(result.run_id),
                        'role': 'assistant'
                    }
                }
                
                # Stream text chunks
                async for chunk in result.stream_text():
                    yield {
                        'event': 'message_delta',
                        'data': {
                            'delta': chunk,
                            'id': str(result.run_id)
                        }
                    }
                
                # Get final content and yield completion
                final_content = await result.get_output()
                yield {
                    'event': 'message_complete',
                    'data': {
                        'id': str(result.run_id),
                        'content': final_content,
                        'usage': result.usage().model_dump() if result.usage() else None
                    }
                }
                
        except Exception as e:
            yield {
                'event': 'error',
                'data': {
                    'error': str(e),
                    'type': 'ai_generation_error'
                }
            }
    
    def _format_history(self, messages: list) -> list:
        """Format message history for Pydantic AI"""
        return [
            {
                'role': msg['role'],
                'content': msg['content']
            }
            for msg in messages
        ]
```

### Streaming API Route
```python
'''
File: app/routes/chat.py
Purpose: FastAPI routes for chat operations including streaming endpoints
Dependencies: FastAPI, Pydantic models, chat service, AI agent service
Imports: FastAPI, StreamingResponse, chat models, services
Exports: Chat router with streaming and history endpoints
Author: Development team
'''

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.core.database import get_db_client
from app.services.chat_service import ChatService
from app.services.ai_agent import AIAgentService
from app.models.chat import StreamRequest, ChatResponse
from prisma import Prisma
import json
import asyncio

router = APIRouter(prefix="/api/chat", tags=["chat"])

async def get_chat_service(db: Prisma = Depends(get_db_client)) -> ChatService:
    return ChatService(db)

ai_agent = AIAgentService()

@router.post("/stream")
async def stream_chat(
    request: StreamRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Stream chat response with real-time AI generation"""
    
    try:
        # Get or create session
        if not request.session_id:
            session = await chat_service.create_session()
            session_id = session.id
        else:
            session_id = request.session_id
            
        # Save user message
        await chat_service.save_message(session_id, "user", request.message)
        
        # Get message history for context
        history = await chat_service.get_session_messages(session_id)
        history_formatted = [
            {"role": msg.role.lower(), "content": msg.content}
            for msg in history[:-1]  # Exclude the just-saved user message
        ]
        
        async def generate_stream():
            assistant_message_content = ""
            
            async for event in ai_agent.stream_response(request.message, history_formatted):
                # Send SSE formatted event
                event_data = f"event: {event['event']}\ndata: {json.dumps(event['data'])}\n\n"
                yield event_data
                
                # Accumulate content for saving
                if event['event'] == 'message_delta':
                    assistant_message_content += event['data']['delta']
                elif event['event'] == 'message_complete':
                    # Save complete assistant message
                    await chat_service.save_message(
                        session_id, 
                        "assistant", 
                        event['data']['content']
                    )
                    # Update session timestamp
                    await chat_service.update_session_timestamp(session_id)
            
            # Send final done event with session info
            done_event = f"event: done\ndata: {json.dumps({'session_id': session_id})}\n\n"
            yield done_event
            
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Streaming error: {str(e)}")
```

## Core Frontend Files

### Streaming Hook
```typescript
'''
File: src/hooks/useStreaming.ts
Purpose: Custom React hook for handling Server-Sent Events streaming from chat API
Dependencies: React useState, useCallback, useRef
Imports: Message, StreamEvent types from types/chat
Exports: useStreaming hook with sendMessage function and streaming state
Author: Development team
'''

import { useState, useCallback, useRef } from 'react';
import { Message, StreamEvent } from '../types/chat';

interface UseStreamingOptions {
  onMessage: (message: Message) => void;
  onError?: (error: string) => void;
  apiUrl?: string;
}

export const useStreaming = ({
  onMessage,
  onError,
  apiUrl = '/api/chat'
}: UseStreamingOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingMessageRef = useRef<Message | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    sessionId?: string
  ) => {
    if (isStreaming) {
      console.warn('Already streaming, ignoring new message');
      return;
    }

    setIsStreaming(true);
    streamingMessageRef.current = null;

    try {
      // Create POST request to streaming endpoint
      const response = await fetch(`${apiUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create EventSource from response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      // Process streaming response
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              await handleStreamEvent(eventData);
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
      console.error('Streaming error:', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsStreaming(false);
      streamingMessageRef.current = null;
    }
  }, [isStreaming, onMessage, onError, apiUrl]);

  const handleStreamEvent = async (data: any) => {
    const event = data.event;
    const eventData = data.data;

    switch (event) {
      case 'message_start':
        streamingMessageRef.current = {
          id: eventData.id,
          sessionId: eventData.session_id || 'unknown',
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
          isStreaming: true,
        };
        if (streamingMessageRef.current) {
          onMessage(streamingMessageRef.current);
        }
        break;

      case 'message_delta':
        if (streamingMessageRef.current) {
          streamingMessageRef.current = {
            ...streamingMessageRef.current,
            content: streamingMessageRef.current.content + eventData.delta,
          };
          onMessage(streamingMessageRef.current);
        }
        break;

      case 'message_complete':
        if (streamingMessageRef.current) {
          streamingMessageRef.current = {
            ...streamingMessageRef.current,
            content: eventData.content,
            isStreaming: false,
          };
          onMessage(streamingMessageRef.current);
        }
        break;

      case 'done':
        // Stream completed successfully
        break;

      case 'error':
        console.error('Stream error:', eventData);
        onError?.(eventData.error || 'Unknown streaming error');
        break;

      default:
        console.warn('Unknown stream event:', event);
    }
  };

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    streamingMessageRef.current = null;
  }, []);

  return {
    sendMessage,
    isStreaming,
    stopStreaming,
  };
};
```

### Chat Store (Zustand)
```typescript
'''
File: src/store/chatStore.ts
Purpose: Global state management for chat sessions, messages, and UI state using Zustand
Dependencies: Zustand, immer for immutable updates
Imports: Message, ChatSession from types/chat
Exports: useChatStore hook and ChatStore interface
Author: Development team
'''

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Message, ChatSession } from '../types/chat';

interface ChatStore {
  // State
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (sessionId: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  createNewSession: () => string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentSession: () => void;
}

export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    // Initial state
    sessions: [],
    currentSessionId: null,
    messages: {},
    isLoading: false,
    error: null,

    // Actions
    setSessions: (sessions) =>
      set((state) => {
        state.sessions = sessions;
      }),

    setCurrentSession: (sessionId) =>
      set((state) => {
        state.currentSessionId = sessionId;
        state.error = null;
      }),

    addMessage: (message) =>
      set((state) => {
        const sessionId = message.sessionId;
        
        if (!state.messages[sessionId]) {
          state.messages[sessionId] = [];
        }

        // Check if message already exists (for streaming updates)
        const existingIndex = state.messages[sessionId].findIndex(
          (m) => m.id === message.id
        );

        if (existingIndex >= 0) {
          // Update existing message
          state.messages[sessionId][existingIndex] = message;
        } else {
          // Add new message
          state.messages[sessionId].push(message);
        }
      }),

    updateMessage: (messageId, updates) =>
      set((state) => {
        // Find and update message across all sessions
        Object.keys(state.messages).forEach((sessionId) => {
          const messageIndex = state.messages[sessionId].findIndex(
            (m) => m.id === messageId
          );
          if (messageIndex >= 0) {
            Object.assign(state.messages[sessionId][messageIndex], updates);
          }
        });
      }),

    setMessages: (sessionId, messages) =>
      set((state) => {
        state.messages[sessionId] = messages;
      }),

    createNewSession: () => {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      set((state) => {
        const newSession: ChatSession = {
          id: newSessionId,
          title: 'New Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        };
        
        state.sessions.unshift(newSession);
        state.currentSessionId = newSessionId;
        state.messages[newSessionId] = [];
        state.error = null;
      });

      return newSessionId;
    },

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    clearCurrentSession: () =>
      set((state) => {
        state.currentSessionId = null;
        state.error = null;
      }),
  }))
);

// Selectors for commonly used derived state
export const useCurrentSessionMessages = () => {
  return useChatStore((state) => {
    if (!state.currentSessionId) return [];
    return state.messages[state.currentSessionId] || [];
  });
};

export const useCurrentSession = () => {
  return useChatStore((state) => {
    if (!state.currentSessionId) return null;
    return state.sessions.find((s) => s.id === state.currentSessionId) || null;
  });
};
```

This design provides:

1. **Clean Architecture**: Separation of concerns with clear service layers
2. **Prisma Integration**: Type-safe database operations with modern ORM
3. **Comprehensive Documentation**: Every file has detailed headers explaining purpose, dependencies, and exports
4. **Streaming Support**: Real-time SSE implementation with Pydantic AI
5. **State Management**: Zustand for predictable state updates
6. **Type Safety**: Full TypeScript integration across frontend and backend
7. **Error Handling**: Robust error management at all layers
8. **Scalability**: Modular structure supporting future enhancements

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze requirements and create system architecture", "status": "completed", "activeForm": "Analyzing requirements and creating system architecture"}, {"content": "Design backend API with streaming support using Prisma", "status": "completed", "activeForm": "Designing backend API with streaming support using Prisma"}, {"content": "Design frontend React components structure", "status": "completed", "activeForm": "Designing frontend React components structure"}, {"content": "Define Prisma schema and data models", "status": "completed", "activeForm": "Defining Prisma schema and data models"}, {"content": "Create integration specifications with documentation standards", "status": "completed", "activeForm": "Creating integration specifications with documentation standards"}]