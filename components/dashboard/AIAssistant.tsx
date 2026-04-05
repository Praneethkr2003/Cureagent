'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { aiAssist } from '@/lib/api'
import { useActiveCase } from '@/lib/ActiveCaseContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Trash2, Bot, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIMessage } from '@/lib/types'
import { format } from 'date-fns'

export function AIAssistant() {
  const { activeCase } = useActiveCase()
  const [messages, setMessages] = useState<(AIMessage & { timestamp: Date })[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Add system message when case changes
  useEffect(() => {
    if (activeCase) {
      const systemMessage: AIMessage & { timestamp: Date } = {
        role: 'assistant',
        content: `Case loaded: ${activeCase.patient_name}, ${activeCase.age}y ${activeCase.sex}, ${activeCase.top_symptoms.slice(0, 3).join(', ')}. How can I help?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [systemMessage, ...prev.filter(m => m.content !== systemMessage.content)])
    }
  }, [activeCase])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: AIMessage & { timestamp: Date } = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const conversationHistory: AIMessage[] = [
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: 'user', content: userMessage.content },
      ]

      const response = await aiAssist(session.access_token, {
        session_id: activeCase?.session_id,
        conversation_history: conversationHistory,
      })

      const assistantMessage: AIMessage & { timestamp: Date } = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: AIMessage & { timestamp: Date } = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <aside className="flex h-full w-[360px] flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            Phi-3
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Context Indicator */}
      {activeCase && (
        <div className="border-b border-border px-4 py-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Discussing: {activeCase.patient_name}
          </Badge>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Ask me anything about diagnoses, treatments, or patient cases.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col gap-1',
                message.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-primary text-primary-foreground'
                    : 'rounded-tl-sm bg-muted text-foreground'
                )}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'user' && (
                    <User className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                  )}
                </div>
              </div>
              <span className="px-2 text-xs text-muted-foreground">
                {format(message.timestamp, 'HH:mm')}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this case..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </aside>
  )
}
