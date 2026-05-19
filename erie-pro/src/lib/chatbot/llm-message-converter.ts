// erie-pro/src/lib/chatbot/llm-message-converter.ts

import type { LlmMessage } from "@/lib/chatbot/llm-types"
import type { ChatToolDefinition } from "@/lib/chatbot/tool-registry"

export type OpenAiChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string }

export interface OpenAiToolCall {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

export function toOpenAiMessages(
  systemPrompt: string,
  messages: LlmMessage[],
): OpenAiChatMessage[] {
  const out: OpenAiChatMessage[] = [{ role: "system", content: systemPrompt }]

  for (const msg of messages) {
    if (msg.role === "user" && typeof msg.content === "string") {
      out.push({ role: "user", content: msg.content })
      continue
    }

    if (msg.role === "assistant" && typeof msg.content === "string") {
      out.push({ role: "assistant", content: msg.content })
      continue
    }

    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      const textParts: string[] = []
      const toolCalls: OpenAiToolCall[] = []
      for (const block of msg.content) {
        if (block.type === "text") textParts.push(block.text)
        if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            type: "function",
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          })
        }
      }
      out.push({
        role: "assistant",
        content: textParts.join("\n").trim() || null,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      })
      continue
    }

    if (msg.role === "user" && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "tool_result") {
          out.push({
            role: "tool",
            tool_call_id: block.tool_use_id,
            content: block.content,
          })
        }
      }
    }
  }

  return out
}

export function toOpenAiTools(tools: ChatToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))
}

export function parseOpenAiToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  return {}
}
