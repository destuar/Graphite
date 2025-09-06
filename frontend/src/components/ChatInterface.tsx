import React, { useState, useRef, useMemo } from 'react'
import { ChatSidebar } from './ChatSidebar'
import { ChatArea } from './ChatArea'
import { ModelSelector, ModelOption } from './ModelSelector'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

export const ChatInterface: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelOption>({
    id: 'gpt-5',
    name: 'GPT-5', 
    provider: 'openai'
  })
  const controllerRef = useRef<AbortController | null>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const endpoint = useMemo(() => `${API_URL}/chat/stream`, [])

  const generateSessionTitle = (firstMessage: string): string => {
    return firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage
  }

  const createNewSession = (): string => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      updatedAt: new Date().toISOString()
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    return newSession.id
  }

  const handleNewChat = () => {
    createNewSession()
  }

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId)
  }

  const handleSendMessage = async (messageContent: string) => {
    if (isLoading) return

    let sessionId = activeSessionId
    if (!sessionId) {
      sessionId = createNewSession()
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    }

    // Add user message to session
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedSession = {
          ...session,
          messages: [...session.messages, userMessage],
          updatedAt: new Date().toISOString()
        }
        // Update title if this is the first message
        if (session.messages.length === 0) {
          updatedSession.title = generateSessionTitle(messageContent)
        }
        return updatedSession
      }
      return session
    }))

    setIsLoading(true)
    controllerRef.current = new AbortController()

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...activeSession?.messages.map(m => ({ role: m.role, content: m.content })) || [],
            { role: 'user', content: messageContent }
          ],
          provider: selectedModel.provider,
          model: selectedModel.id,
          temperature: 0.2,
        }),
        signal: controllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      }

      // Add empty assistant message
      setSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: [...session.messages, assistantMessage],
            updatedAt: new Date().toISOString()
          }
        }
        return session
      }))

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const evt of events) {
          const [line1, line2] = evt.split('\n')
          if (!line1 || !line2) continue

          const type = line1.replace('event: ', '').trim()
          const data = JSON.parse(line2.replace('data: ', ''))

          if (type === 'message_delta') {
            setSessions(prev => prev.map(session => {
              if (session.id === sessionId) {
                return {
                  ...session,
                  messages: session.messages.map(msg => {
                    if (msg.id === assistantMessage.id) {
                      return {
                        ...msg,
                        content: msg.content + (data.delta || '')
                      }
                    }
                    return msg
                  }),
                  updatedAt: new Date().toISOString()
                }
              }
              return session
            }))
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error)
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date().toISOString()
        }
        
        setSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              messages: [...session.messages, errorMessage],
              updatedAt: new Date().toISOString()
            }
          }
          return session
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#fcfcfd]">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex flex-col">
        {/* Header with Model Selector */}
        <div className="flex items-center justify-between bg-white px-2 py-2">
          <div className="ml-2 mt-1">
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
              className="mt-0"
            />
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1">
          <ChatArea
            messages={activeSession?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}