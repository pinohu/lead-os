// erie-pro/src/lib/__tests__/chatbot-llm.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getDefaultModelForProvider,
  resolveChatLlmConfig,
} from "@/lib/chatbot/llm-config"
import {
  parseOpenAiToolArguments,
  toOpenAiMessages,
  toOpenAiTools,
} from "@/lib/chatbot/llm-message-converter"
import { parsePromptToolResponse } from "@/lib/chatbot/llm-prompt-tools"
import { runChatLlmTurn } from "@/lib/chatbot/llm"
import type { LlmMessage } from "@/lib/chatbot/llm-types"

const ENV_KEYS = [
  "CHAT_LLM_PROVIDER",
  "CHAT_LLM_MODEL",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "ANTHROPIC_API_KEY",
  "OLLAMA_BASE_URL",
  "OLLAMA_API_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const

function clearChatLlmEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
}

describe("resolveChatLlmConfig", () => {
  beforeEach(() => clearChatLlmEnv())
  afterEach(() => clearChatLlmEnv())

  it("prefers OpenRouter when key is set and provider unset", () => {
    process.env.OPENROUTER_API_KEY = "or-test"
    const config = resolveChatLlmConfig()
    expect(config?.provider).toBe("openrouter")
    expect(config?.model).toBe(getDefaultModelForProvider("openrouter"))
  })

  it("uses Groq when only GROQ_API_KEY is set", () => {
    process.env.GROQ_API_KEY = "gq-test"
    const config = resolveChatLlmConfig()
    expect(config?.provider).toBe("groq")
    expect(config?.baseUrl).toContain("groq.com")
  })

  it("uses Anthropic only when CHAT_LLM_PROVIDER=anthropic", () => {
    process.env.ANTHROPIC_API_KEY = "ant-test"
    process.env.OPENROUTER_API_KEY = "or-test"
    const ignored = resolveChatLlmConfig()
    expect(ignored?.provider).toBe("openrouter")

    process.env.CHAT_LLM_PROVIDER = "anthropic"
    const config = resolveChatLlmConfig()
    expect(config?.provider).toBe("anthropic")
  })

  it("respects CHAT_LLM_MODEL override", () => {
    process.env.OPENROUTER_API_KEY = "or-test"
    process.env.CHAT_LLM_MODEL = "mistralai/mistral-small-3.1-24b-instruct"
    expect(resolveChatLlmConfig()?.model).toBe(
      "mistralai/mistral-small-3.1-24b-instruct",
    )
  })

  it("returns null when no provider credentials exist", () => {
    expect(resolveChatLlmConfig()).toBeNull()
  })
})

describe("toOpenAiMessages", () => {
  it("maps tool_use and tool_result blocks for OpenAI APIs", () => {
    const messages: LlmMessage[] = [
      { role: "user", content: "check status" },
      {
        role: "assistant",
        content: [
          { type: "text", text: "Looking up." },
          {
            type: "tool_use",
            id: "call_abc",
            name: "getRequestStatus",
            input: { requestId: "SR-1", token: "tok" },
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "call_abc",
            content: '{"ok":true}',
          },
        ],
      },
    ]

    const openAi = toOpenAiMessages("You are Erie assistant.", messages)
    expect(openAi[0]).toEqual({ role: "system", content: "You are Erie assistant." })
    expect(openAi[1]).toEqual({ role: "user", content: "check status" })
    expect(openAi[2].role).toBe("assistant")
    expect(openAi[3]).toEqual({
      role: "tool",
      tool_call_id: "call_abc",
      content: '{"ok":true}',
    })
  })
})

describe("parseOpenAiToolArguments", () => {
  it("parses JSON tool arguments", () => {
    expect(parseOpenAiToolArguments('{"niche":"plumbing"}')).toEqual({
      niche: "plumbing",
    })
  })

  it("returns empty object on invalid JSON", () => {
    expect(parseOpenAiToolArguments("not-json")).toEqual({})
  })
})

describe("parsePromptToolResponse", () => {
  it("extracts tool_calls from JSON content", () => {
    const result = parsePromptToolResponse(
      '{"tool_calls":[{"id":"c1","name":"searchProviders","input":{"niche":"hvac"}}]}',
    )
    expect(result?.toolCalls).toHaveLength(1)
    expect(result?.toolCalls[0]?.name).toBe("searchProviders")
  })
})

describe("toOpenAiTools", () => {
  it("wraps chat tool definitions as OpenAI functions", () => {
    const tools = toOpenAiTools([
      {
        name: "checkServiceArea",
        description: "ZIP check",
        input_schema: {
          type: "object",
          properties: { zip: { type: "string" } },
        },
      },
    ])
    expect(tools[0]?.function.name).toBe("checkServiceArea")
    expect(tools[0]?.type).toBe("function")
  })
})

describe("runChatLlmTurn", () => {
  beforeEach(() => {
    clearChatLlmEnv()
    vi.restoreAllMocks()
  })
  afterEach(() => {
    clearChatLlmEnv()
    vi.unstubAllGlobals()
  })

  it("returns parsed tool calls from mocked OpenRouter response", async () => {
    process.env.CHAT_LLM_PROVIDER = "openrouter"
    process.env.OPENROUTER_API_KEY = "test-key"

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "On it.",
              tool_calls: [
                {
                  id: "call_xyz",
                  type: "function",
                  function: {
                    name: "getRequestStatus",
                    arguments: '{"requestId":"SR-9","token":"abc"}',
                  },
                },
              ],
            },
          },
        ],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await runChatLlmTurn({
      systemPrompt: "sys",
      messages: [{ role: "user", content: "status?" }],
      tools: [
        {
          name: "getRequestStatus",
          description: "status",
          input_schema: {
            type: "object",
            properties: {
              requestId: { type: "string" },
              token: { type: "string" },
            },
            required: ["requestId", "token"],
          },
        },
      ],
    })

    expect(result?.toolCalls).toEqual([
      {
        id: "call_xyz",
        name: "getRequestStatus",
        input: { requestId: "SR-9", token: "abc" },
      },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns null when no LLM provider is configured", async () => {
    const result = await runChatLlmTurn({
      systemPrompt: "sys",
      messages: [{ role: "user", content: "hi" }],
      tools: [],
    })
    expect(result).toBeNull()
  })
})
