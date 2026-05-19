// erie-pro/src/lib/chatbot/llm-types.ts

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

export interface LlmTurnParams {
  systemPrompt: string
  messages: LlmMessage[]
  tools: import("@/lib/chatbot/tool-registry").ChatToolDefinition[]
}
