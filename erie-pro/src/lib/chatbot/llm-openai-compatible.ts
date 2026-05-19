// erie-pro/src/lib/chatbot/llm-openai-compatible.ts

import { logger } from "@/lib/logger"
import type { ResolvedChatLlmConfig } from "@/lib/chatbot/llm-config"
import {
  parseOpenAiToolArguments,
  toOpenAiMessages,
  toOpenAiTools,
} from "@/lib/chatbot/llm-message-converter"
import { runPromptBasedToolTurn } from "@/lib/chatbot/llm-prompt-tools"
import type { LlmTurnParams, LlmTurnResult } from "@/lib/chatbot/llm-types"

const REQUEST_TIMEOUT_MS = 12000

function buildHeaders(config: ResolvedChatLlmConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }
  if (config.provider === "openrouter") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    if (appUrl) headers["HTTP-Referer"] = appUrl
    headers["X-Title"] = "Erie Pro Chatbot"
  }
  return headers
}

export async function runOpenAiCompatibleLlmTurn(
  config: ResolvedChatLlmConfig,
  params: LlmTurnParams,
): Promise<LlmTurnResult | null> {
  const native = await runNativeToolTurn(config, params)
  if (native) return native

  if (params.tools.length > 0) {
    return runPromptBasedToolTurn(config, params)
  }

  return null
}

async function runNativeToolTurn(
  config: ResolvedChatLlmConfig,
  params: LlmTurnParams,
): Promise<LlmTurnResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const body: Record<string, unknown> = {
      model: config.model,
      max_tokens: 1024,
      messages: toOpenAiMessages(params.systemPrompt, params.messages),
    }
    if (params.tools.length > 0) {
      body.tools = toOpenAiTools(params.tools)
      body.tool_choice = "auto"
    }

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      logger.warn("chatbot.llm.openai_compat non-2xx", {
        provider: config.provider,
        status: res.status,
        body: errText.slice(0, 300),
      })
      return null
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null
          tool_calls?: Array<{
            id: string
            type: string
            function?: { name?: string; arguments?: string }
          }>
        }
      }>
    }

    const message = data.choices?.[0]?.message
    if (!message) return null

    const toolCalls: LlmTurnResult["toolCalls"] = []
    for (const tc of message.tool_calls ?? []) {
      if (!tc.id || !tc.function?.name) continue
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        input: parseOpenAiToolArguments(tc.function.arguments ?? "{}"),
      })
    }

    const text =
      typeof message.content === "string" ? message.content.trim() || null : null

    if (toolCalls.length === 0 && !text && params.tools.length > 0) {
      return null
    }

    return { text, toolCalls }
  } catch (err) {
    clearTimeout(timer)
    logger.warn("chatbot.llm.openai_compat failed", {
      provider: config.provider,
      message: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}
