// erie-pro/src/lib/chatbot/llm-anthropic.ts

import { logger } from "@/lib/logger"
import type { ResolvedChatLlmConfig } from "@/lib/chatbot/llm-config"
import type { LlmTurnParams, LlmTurnResult } from "@/lib/chatbot/llm-types"

const ANTHROPIC_API_VERSION = "2023-06-01"
const REQUEST_TIMEOUT_MS = 12000

export async function runAnthropicLlmTurn(
  config: ResolvedChatLlmConfig,
  params: LlmTurnParams,
): Promise<LlmTurnResult | null> {
  if (!config.apiKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        system: params.systemPrompt,
        messages: params.messages,
        tools: params.tools.map((t) => ({
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
      logger.warn("chatbot.llm.anthropic non-2xx", {
        status: res.status,
        body: errText.slice(0, 300),
      })
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
    logger.warn("chatbot.llm.anthropic failed", {
      message: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}
