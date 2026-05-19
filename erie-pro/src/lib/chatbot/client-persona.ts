// erie-pro/src/lib/chatbot/client-persona.ts

import type { PageAudienceConfig } from "@/lib/audience-context"
import { resolveChatPersona, type ChatPersona, CHAT_PERSONA_UI } from "@/lib/chatbot/personas"

export function resolveClientChatPersona({
  pathname,
  audience,
  serviceRequestId,
}: {
  pathname: string
  audience: PageAudienceConfig["audience"]
  serviceRequestId?: string
}): ChatPersona {
  return resolveChatPersona({ pathname, audience, serviceRequestId })
}

export function getChatUi(persona: ChatPersona) {
  return CHAT_PERSONA_UI[persona]
}
