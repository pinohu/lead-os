// erie-pro/src/lib/chatbot/llm.ts

import { logger } from "@/lib/logger"
import type { ChatToolDefinition } from "@/lib/chatbot/tool-registry"

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const ANTHROPIC_API_VERSION = "2023-06-01"
const DEFAULT_MODEL = "claude-haiku-4-5-20251001"
const REQUEST_TIMEOUT_MS = 12000

export type LlmMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | {
      role: "assistant"
      content: Array<
        | { type: "text"; text: string }
        | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
      >
    }
  | {
      role: "user"
      content: Array<{ type: "tool_result"; tool_use_id: string; content: string }>
    }

export interface LlmTurnResult {
  text: string | null
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>
}

export async function runChatLlmTurn({
  systemPrompt,
  messages,
  tools,
}: {
  systemPrompt: string
  messages: LlmMessage[]
  tools: ChatToolDefinition[]
}): Promise<LlmTurnResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      logger.warn("chatbot.llm non-2xx", { status: res.status, body: errText.slice(0, 300) })
      return null
    }

    const data = (await res.json()) as {
      content?: Array<{
        type: string
        text?: string
        id?: string
        name?: string
        input?: Record<string, unknown>
      }>
    }

    const toolCalls: LlmTurnResult["toolCalls"] = []
    const textParts: string[] = []

    for (const block of data.content ?? []) {
      if (block.type === "text" && block.text) textParts.push(block.text)
      if (block.type === "tool_use" && block.id && block.name) {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input ?? {},
        })
      }
    }

    return {
      text: textParts.join("\n").trim() || null,
      toolCalls,
    }
  } catch (err) {
    clearTimeout(timer)
    logger.warn("chatbot.llm failed", {
      message: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}
