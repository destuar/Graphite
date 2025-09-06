import React, { useState } from 'react'

interface ChatSession {
  id: string
  title: string
  updatedAt: string
}

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const NavButton: React.FC<{
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    icon: React.ReactNode
    label: string
  }> = ({ onClick, icon, label }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 rounded-lg px-3 py-2 text-sm text-gray-800 transition-colors bg-[#f5f6f8] hover:bg-gray-200`}
      title={label}
      aria-label={label}
    >
      <span className="h-5 w-5 flex items-center justify-center">{icon}</span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  )

  return (
    <div
      className={`flex h-full ${isCollapsed ? 'w-16 cursor-pointer' : 'w-[260px]'} flex-col bg-[#f5f6f8] border-r border-gray-200`}
      onClick={() => {
        if (isCollapsed) setIsCollapsed(false)
      }}
    >
      {/* Header */}
      {!isCollapsed && (
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 ml-1">
            <img src="/graphite-logo.png" alt="Graphite" className="h-8 w-8 object-contain mt-0.5" />
            <span className="text-md font-normal text-gray-800 -ml-2">Graphite</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(true)
            }}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-200 hover:cursor-w-resize"
            aria-label="Collapse sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <rect x={3} y={4} width={18} height={16} rx={2} ry={2} strokeWidth={2} />
              <path d="M9 4v16" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      {isCollapsed && (
        <div className="flex h-16 items-center justify-center">
          <img src="/graphite-logo.png" alt="Graphite" className="h-8 w-8 object-contain" />
        </div>
      )}

      {/* Primary Nav */}
      <div className="p-3 space-y-2">
        <NavButton
          onClick={(e) => {
            e.stopPropagation()
            onNewChat()
            if (isCollapsed) setIsCollapsed(false)
          }}
          label="New chat"
          icon={(
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L13 14l-4 1 1-4 8.5-8.5z" />
            </svg>
          )}
        />
        <NavButton
          onClick={(e) => {
            e.stopPropagation()
            if (isCollapsed) setIsCollapsed(false)
          }}
          label="Search chats"
          icon={(
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        />
        <NavButton
          onClick={(e) => {
            e.stopPropagation()
            if (isCollapsed) setIsCollapsed(false)
          }}
          label="Library"
          icon={(
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12a1 1 0 011 1v14l-7-3-7 3V5a1 1 0 011-1z" />
            </svg>
          )}
        />
      </div>

      {/* Chat History */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="truncate flex-1">{session.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}