import { Bot, Sparkles } from 'lucide-react'
import AIChatInterface from '../components/AIChatInterface'

export default function AIChatbot() {
  return (
    <div className="h-full flex flex-col bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', boxShadow: '0 4px 12px rgba(90, 79, 207, 0.2)' }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-text-primary tracking-tight">AI Health Assistant</h2>
            <p className="text-[11px] font-medium text-text-secondary">MediVox · Your digital twin assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] uppercase text-primary-light bg-primary-50 px-3 py-1.5 rounded-full border border-border">
          <Sparkles className="w-3 h-3" />
          Gemini Powered
        </div>
      </div>

      {/* Chatbot Content */}
      <div className="flex-1 min-h-0 relative bg-bg-main">
        <AIChatInterface />
      </div>
    </div>
  )
}
