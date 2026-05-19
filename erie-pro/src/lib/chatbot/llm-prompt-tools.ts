// erie-pro/src/lib/chatbot/llm-prompt-tools.ts

import { logger } from "@/lib/logger"
import type { ResolvedChatLlmConfig } from "@/lib/chatbot/llm-config"
import { toOpenAiMessages } from "@/lib/chatbot/llm-message-converter"
import type { LlmTurnParams, LlmTurnResult } from "@/lib/chatbot/llm-types"

const REQUEST_TIMEOUT_MS = 12000

const TOOL_PROMPT_SUFFIX = `
When you need data from Erie.Pro systems, respond with ONLY a JSON object (no markdown fences):
{"tool_calls":[{"id":"call_1","name":"<toolName>","input":{}}]}
Use tool names and schemas from the system prompt. If no tool is needed, respond with normal helpful text only.
`.trim()

function buildHeaders(config: ResolvedChatLlmConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
  return headers
}

function parsePromptToolResponse(content: string): LlmTurnResult | null {
  const trimmed = content.trim()
  const jsonStart = trimmed.indexOf("{")
  const jsonEnd = trimmed.lastIndexOf("}")
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null

  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
      tool_calls?: Array<{
        id?: string
        name?: string
        input?: Record<string, unknown>
      }>
    }
    const rawCalls = parsed.tool_calls ?? []
    if (rawCalls.length === 0) return null

    const toolCalls = rawCalls
      .filter((tc) => tc.name)
      .map((tc, i) => ({
        id: tc.id ?? `prompt_call_${i + 1}`,
        name: tc.name!,
        input: tc.input ?? {},
      }))

    if (toolCalls.length === 0) return null
    return { text: null, toolCalls }
  } catch {
    return null
  }
}

/** Fallback when the model API does not return native tool_calls (e.g. some Ollama models). */
export async function runPromptBasedToolTurn(
  config: ResolvedChatLlmConfig,
  params: LlmTurnParams,
): Promise<LlmTurnResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const systemPrompt = `${params.systemPrompt}\n\n${TOOL_PROMPT_SUFFIX}`

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        messages: toOpenAiMessages(systemPrompt, params.messages),
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      logger.warn("chatbot.llm.prompt_tools non-2xx", {
        provider: config.provider,
        status: res.status,
      })
      return null
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    return parsePromptToolResponse(content)
  } catch (err) {
    clearTimeout(timer)
    logger.warn("chatbot.llm.prompt_tools failed", {
      provider: config.provider,
      message: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

export { parsePromptToolResponse }
