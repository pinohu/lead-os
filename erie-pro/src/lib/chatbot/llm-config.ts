// erie-pro/src/lib/chatbot/llm-config.ts

export type ChatLlmProvider = "openrouter" | "groq" | "anthropic" | "ollama"

export interface ResolvedChatLlmConfig {
  provider: ChatLlmProvider
  model: string
  apiKey: string | null
  baseUrl: string
}

const DEFAULT_MODELS: Record<ChatLlmProvider, string> = {
  openrouter: "meta-llama/llama-3.3-70b-instruct",
  groq: "llama-3.3-70b-versatile",
  anthropic: "claude-haiku-4-5-20251001",
  ollama: "llama3.2",
}

const OPENAI_COMPAT_BASE_URLS: Record<Exclude<ChatLlmProvider, "anthropic">, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  ollama: "http://127.0.0.1:11434",
}

function parseProvider(raw: string | undefined): ChatLlmProvider | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  if (
    normalized === "openrouter" ||
    normalized === "groq" ||
    normalized === "anthropic" ||
    normalized === "ollama"
  ) {
    return normalized
  }
  return null
}

function apiKeyForProvider(provider: ChatLlmProvider): string | null {
  switch (provider) {
    case "openrouter":
      return process.env.OPENROUTER_API_KEY?.trim() || null
    case "groq":
      return process.env.GROQ_API_KEY?.trim() || null
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY?.trim() || null
    case "ollama":
      return process.env.OLLAMA_API_KEY?.trim() || "ollama"
  }
}

function autoDetectProvider(): ChatLlmProvider | null {
  if (process.env.OPENROUTER_API_KEY?.trim()) return "openrouter"
  if (process.env.GROQ_API_KEY?.trim()) return "groq"
  if (process.env.OLLAMA_BASE_URL?.trim()) return "ollama"
  return null
}

export function resolveChatLlmConfig(): ResolvedChatLlmConfig | null {
  const explicit = parseProvider(process.env.CHAT_LLM_PROVIDER)
  const provider = explicit ?? autoDetectProvider()
  if (!provider) return null

  const apiKey = apiKeyForProvider(provider)
  if (provider !== "ollama" && !apiKey) return null
  if (provider === "anthropic" && !apiKey) return null

  const model =
    process.env.CHAT_LLM_MODEL?.trim() || DEFAULT_MODELS[provider]

  if (provider === "anthropic") {
    return {
      provider,
      model,
      apiKey,
      baseUrl: "https://api.anthropic.com/v1",
    }
  }

  const baseUrl =
    provider === "ollama"
      ? (process.env.OLLAMA_BASE_URL?.trim() || OPENAI_COMPAT_BASE_URLS.ollama).replace(
          /\/$/,
          "",
        )
      : OPENAI_COMPAT_BASE_URLS[provider]

  return {
    provider,
    model,
    apiKey: provider === "ollama" ? apiKey : apiKey!,
    baseUrl,
  }
}

export function getDefaultModelForProvider(provider: ChatLlmProvider): string {
  return DEFAULT_MODELS[provider]
}
