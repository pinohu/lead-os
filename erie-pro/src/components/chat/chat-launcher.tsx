// erie-pro/src/components/chat/chat-launcher.tsx
"use client"

import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { usePageAudience } from "@/components/audience/audience-provider"
import { ChatPanel } from "@/components/chat/chat-panel"
import { useChatSession } from "@/components/chat/use-chat-session"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { resolveClientChatPersona, getChatUi } from "@/lib/chatbot/client-persona"

export function ChatLauncher() {
  const pathname = usePathname() ?? "/"
  const audience = usePageAudience()
  const [open, setOpen] = useState(false)

  const persona = useMemo(
    () => resolveClientChatPersona({ pathname, audience: audience.audience }),
    [pathname, audience.audience],
  )
  const ui = getChatUi(persona)

  const chat = useChatSession({
    pathname,
    persona,
    enabled: open,
  })

  if (persona === "admin_operations") return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-40 h-12 rounded-full px-4 shadow-lg md:bottom-8 md:right-8"
          aria-label={ui.launcherLabel}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          {ui.launcherLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[min(85vh,640px)] flex-col p-0 sm:max-w-lg sm:mx-auto">
        <ChatPanel
          title={ui.panelTitle}
          placeholder={ui.placeholder}
          messages={chat.messages}
          isLoading={chat.isLoading}
          isSending={chat.isSending}
          error={chat.error}
          onSend={chat.sendMessage}
          onRetry={chat.retry}
          onEscalate={() => void chat.escalate("User requested human help from launcher")}
          className="h-full"
        />
      </SheetContent>
    </Sheet>
  )
}
