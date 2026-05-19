// erie-pro/src/lib/chatbot/llm.ts

import { runAnthropicLlmTurn } from "@/lib/chatbot/llm-anthropic"
import { resolveChatLlmConfig } from "@/lib/chatbot/llm-config"
import { runOpenAiCompatibleLlmTurn } from "@/lib/chatbot/llm-openai-compatible"
import type { LlmMessage, LlmTurnResult } from "@/lib/chatbot/llm-types"
import type { ChatToolDefinition } from "@/lib/chatbot/tool-registry"

export type { LlmMessage, LlmTurnResult } from "@/lib/chatbot/llm-types"
export {
  resolveChatLlmConfig,
  getDefaultModelForProvider,
  type ChatLlmProvider,
  type ResolvedChatLlmConfig,
} from "@/lib/chatbot/llm-config"

export async function runChatLlmTurn({
  systemPrompt,
  messages,
  tools,
}: {
  systemPrompt: string
  messages: LlmMessage[]
  tools: ChatToolDefinition[]
}): Promise<LlmTurnResult | null> {
  const config = resolveChatLlmConfig()
  if (!config) return null

  if (config.provider === "anthropic") {
    return runAnthropicLlmTurn(config, { systemPrompt, messages, tools })
  }

  return runOpenAiCompatibleLlmTurn(config, { systemPrompt, messages, tools })
}
