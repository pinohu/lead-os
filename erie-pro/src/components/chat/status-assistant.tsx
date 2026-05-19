// erie-pro/src/components/chat/status-assistant.tsx
"use client"

import { useMemo } from "react"
import { ChatPanel } from "@/components/chat/chat-panel"
import { useChatSession } from "@/components/chat/use-chat-session"
import { getChatUi } from "@/lib/chatbot/client-persona"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusAssistantProps {
  requestId: string
  statusToken: string
}

export function StatusAssistant({ requestId, statusToken }: StatusAssistantProps) {
  const persona = "consumer_status" as const
  const ui = getChatUi(persona)
  const pathname = useMemo(
    () => `/request-status/${encodeURIComponent(requestId)}`,
    [requestId],
  )

  const chat = useChatSession({
    pathname,
    persona,
    serviceRequestId: requestId,
    statusToken,
    enabled: true,
  })

  return (
    <Card className="mt-8 border-primary/20">
      <CardHeader>
        <CardTitle className="text-base">{ui.panelTitle}</CardTitle>
        <CardDescription>{ui.openingMessage}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[min(420px,55vh)]">
          <ChatPanel
            title={ui.panelTitle}
            placeholder={ui.placeholder}
            messages={chat.messages}
            isLoading={chat.isLoading}
            isSending={chat.isSending}
            error={chat.error}
            onSend={chat.sendMessage}
            onRetry={chat.retry}
            onEscalate={() =>
              void chat.escalate("Consumer requested help on request status page")
            }
            className="h-full rounded-b-lg"
          />
        </div>
      </CardContent>
    </Card>
  )
}
