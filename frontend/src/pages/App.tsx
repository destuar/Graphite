import React, { useMemo, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

export const App: React.FC = () => {
  const [text, setText] = useState('Hello Graphite!')
  const [model, setModel] = useState<string>('gpt-4o-mini')
  const [provider, setProvider] = useState<string>('openai')
  const [stream, setStream] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  const endpoint = useMemo(() => `${API_URL}/chat/stream`, [])

  const startStream = async () => {
    if (isLoading) return
    setStream('')
    setIsLoading(true)
    controllerRef.current = new AbortController()

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        provider,
        model,
        temperature: 0.2,
      }),
      signal: controllerRef.current.signal,
    })

    if (!res.ok || !res.body) {
      setIsLoading(false)
      return
    }

    const reader = res.body.getReader()
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
          setStream(prev => prev + (data.delta || ''))
        }
      }
    }
    setIsLoading(false)
  }

  const stopStream = () => {
    controllerRef.current?.abort()
    setIsLoading(false)
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Graphite MVP</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={provider} onChange={e => setProvider(e.target.value)}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
            <option value="perplexity">Perplexity</option>
          </select>
          <input value={model} onChange={e => setModel(e.target.value)} placeholder="model" />
          {!isLoading ? (
            <button onClick={startStream}>Start</button>
          ) : (
            <button onClick={stopStream}>Stop</button>
          )}
        </div>
        <div style={{ padding: 12, border: '1px solid #ddd', minHeight: 120, whiteSpace: 'pre-wrap' }}>
          {stream}
        </div>
      </div>
    </div>
  )
}




