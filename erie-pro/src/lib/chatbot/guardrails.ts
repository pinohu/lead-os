// erie-pro/src/lib/chatbot/guardrails.ts

import { getPolicyForPersona } from "@/lib/chatbot/policies"
import type { ChatPersona } from "@/lib/chatbot/personas"

const STATUS_KEYWORDS =
  /\b(status|notified|sent|timeline|delivery|provider email|confirmation)\b/i

export function shouldBlockUngroundedStatusReply(
  persona: ChatPersona,
  userMessage: string,
  assistantDraft: string,
  toolsUsedThisTurn: boolean,
): string | null {
  const policy = getPolicyForPersona(persona)
  if (!policy.requireToolsForStatus) return null
  if (!STATUS_KEYWORDS.test(userMessage)) return null
  if (toolsUsedThisTurn) return null

  const claimsStatus =
    /\b(sent|delivered|notified|confirmed|completed|failed|queued)\b/i.test(assistantDraft) &&
    !/\b(tool|database|record|on file|I don't have)\b/i.test(assistantDraft)

  if (claimsStatus) {
    return "I need to check our system records before answering about status. Let me look that up."
  }
  return null
}

export function sanitizeUserMessage(text: string): string {
  return text.trim().slice(0, 4000)
}
