// erie-pro/src/lib/chatbot/prompt-builder.ts

import type { ChatPersona } from "@/lib/chatbot/personas"
import { getPolicyForPersona } from "@/lib/chatbot/policies"
import { getToolDefinitionsForPersona } from "@/lib/chatbot/tool-registry"

export function buildChatSystemPrompt(persona: ChatPersona, context?: Record<string, unknown>): string {
  const policy = getPolicyForPersona(persona)
  const tools = getToolDefinitionsForPersona(persona)
  const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")

  const contextBlock =
    context && Object.keys(context).length > 0
      ? `\nSession context (JSON):\n${JSON.stringify(context, null, 2)}`
      : ""

  return `You are the Erie.pro assistant (${persona} mode).

CRITICAL RULES:
- NEVER guess operational status (request status, notifications sent, subscription state, provisioning).
- When the user asks about status, timelines, or whether something was sent, you MUST call the appropriate tool first.
- If a tool returns no data or an error, say so honestly — do not fill gaps with assumptions.
- Stay within persona scope. Do not discuss topics forbidden for this mode: ${policy.forbiddenTopics.join(", ") || "none"}.
- Be concise, friendly, and plain-language.

Available tools:
${toolList}
${contextBlock}`
}
