// erie-pro/src/components/chat/chat-panel.tsx
"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ChatMessageView } from "@/components/chat/use-chat-session"

interface ChatPanelProps {
  title: string
  placeholder: string
  messages: ChatMessageView[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  onSend: (text: string) => Promise<void>
  onRetry?: () => void
  onEscalate?: () => void
  className?: string
}

export function ChatPanel({
  title,
  placeholder,
  messages,
  isLoading,
  isSending,
  error,
  onSend,
  onRetry,
  onEscalate,
  className,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return
    setDraft("")
    await onSend(text)
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">
          Answers use live system data — not guesses about status or delivery.
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading assistant…
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      {error && (
        <div className="mx-4 mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
          {onRetry && (
            <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading || isSending}
          aria-label="Chat message"
        />
        <Button type="submit" size="icon" disabled={isLoading || isSending || !draft.trim()}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      {onEscalate && (
        <div className="px-3 pb-3">
          <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={onEscalate}>
            Talk to a human
          </Button>
        </div>
      )}
    </div>
  )
}
