// erie-pro/src/components/chat/use-chat-session.ts
"use client"

import { useCallback, useEffect, useState } from "react"
import type { ChatPersona } from "@/lib/chatbot/personas"

export interface ChatMessageView {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  createdAt: string
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr"
  const key = "erie_chat_visitor"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function useChatSession({
  pathname,
  persona,
  serviceRequestId,
  statusToken,
  enabled = true,
}: {
  pathname: string
  persona: ChatPersona
  serviceRequestId?: string
  statusToken?: string
  enabled?: boolean
}) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageView[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bootstrap = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname,
          visitorId: getVisitorId(),
          personaOverride: persona,
          serviceRequestId,
          statusToken,
        }),
      })
      const data = (await res.json()) as {
        success?: boolean
        sessionId?: string
        error?: string
      }
      if (!res.ok || !data.success || !data.sessionId) {
        throw new Error(data.error ?? "Could not start chat")
      }
      setSessionId(data.sessionId)
      const detail = await fetch(`/api/chat/session/${data.sessionId}`)
      const detailJson = (await detail.json()) as {
        success?: boolean
        session?: { messages: ChatMessageView[] }
      }
      if (detailJson.session?.messages) {
        setMessages(detailJson.session.messages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat unavailable")
    } finally {
      setIsLoading(false)
    }
  }, [enabled, pathname, persona, serviceRequestId, statusToken])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return
      setIsSending(true)
      setError(null)
      const optimistic: ChatMessageView = {
        id: `local-${Date.now()}`,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])
      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text.trim() }),
        })
        const data = (await res.json()) as {
          success?: boolean
          reply?: string
          error?: string
        }
        if (!res.ok || !data.success || !data.reply) {
          throw new Error(data.error ?? "Message failed")
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply!,
            createdAt: new Date().toISOString(),
          },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed")
      } finally {
        setIsSending(false)
      }
    },
    [sessionId],
  )

  const escalate = useCallback(
    async (reason: string) => {
      if (!sessionId) return
      await fetch("/api/chat/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, reason, requestId: serviceRequestId }),
      })
    },
    [sessionId, serviceRequestId],
  )

  return {
    sessionId,
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    escalate,
    retry: bootstrap,
  }
}
