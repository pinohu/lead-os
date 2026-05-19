// erie-pro/src/lib/chatbot/tools/types.ts

import type { ChatPersona } from "@/lib/chatbot/personas"

export interface ChatToolContext {
  persona: ChatPersona
  sessionId: string
  userId?: string | null
  providerId?: string | null
  serviceRequestId?: string | null
  statusToken?: string | null
  isAdmin?: boolean
}

export interface ToolResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}
