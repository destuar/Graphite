import React, { useState } from 'react'

export interface ModelOption {
  id: string
  name: string
  provider: string
}

interface ModelSelectorProps {
  selectedModel: ModelOption
  onModelSelect: (model: ModelOption) => void
  className?: string
}

const MODEL_OPTIONS: ModelOption[] = [
  // OpenAI Models (2025 - Curated Selection)
  { id: 'gpt-5', name: 'GPT-5', provider: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  
  // Claude Models (2025 - Latest Claude 4 Series)
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'anthropic' },
  { id: 'claude-sonnet-4-20250522', name: 'Claude Sonnet 4', provider: 'anthropic' },
  
  // Gemini Models (2025 - Latest 2.5 Series)
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
  
  // Perplexity Models (2025 - Core Sonar Series)
  { id: 'sonar-reasoning', name: 'Sonar Reasoning', provider: 'perplexity' },
  { id: 'sonar', name: 'Sonar', provider: 'perplexity' },
]

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-green-100 text-green-800',
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-blue-100 text-blue-800',
  perplexity: 'bg-purple-100 text-purple-800',
}

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google',
  perplexity: 'Perplexity',
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const groupedModels = MODEL_OPTIONS.reduce((acc, model) => {
    const provider = model.provider
    if (!acc[provider]) {
      acc[provider] = []
    }
    acc[provider].push(model)
    return acc
  }, {} as Record<string, ModelOption[]>)

  const handleModelSelect = (model: ModelOption) => {
    onModelSelect(model)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 pl-2.5 pr-2 py-1.5 bg-transparent rounded-md hover:bg-gray-200 transition-colors"
      >
        <span className="text-lg font-normal text-gray-700 whitespace-nowrap">
          {selectedModel.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-100 rounded-lg shadow z-20 max-h-96 overflow-y-auto">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {PROVIDER_NAMES[provider]}
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                      selectedModel.id === model.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="relative pr-7">
                      <div className="text-sm font-medium text-gray-900">
                        {model.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {model.id}
                      </div>
                      {selectedModel.id === model.id && (
                        <svg className="w-4 h-4 text-black absolute right-2 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}