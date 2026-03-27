export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  durationMs: number;
}

export interface LLMConfig {
  provider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseUrl?: string;
}

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const DRY_RUN_RESPONSE: LLMResponse = {
  content: "[AI not configured]",
  model: "dry-run",
  usage: { inputTokens: 0, outputTokens: 0 },
  durationMs: 0,
};

export function getAIConfig(): LLMConfig | null {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) return null;

  const provider = (process.env.AI_PROVIDER ?? "anthropic") as "anthropic" | "openai";
  if (provider !== "anthropic" && provider !== "openai") return null;

  const model = process.env.AI_MODEL ??
    (provider === "anthropic" ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);

  const maxTokens = parseFiniteInt(process.env.AI_MAX_TOKENS, DEFAULT_MAX_TOKENS);
  const temperature = parseFiniteFloat(process.env.AI_TEMPERATURE, DEFAULT_TEMPERATURE);
  const baseUrl = process.env.AI_BASE_URL ?? undefined;

  return { provider, apiKey, model, maxTokens, temperature, baseUrl };
}

export function isAIEnabled(): boolean {
  return getAIConfig() !== null;
}

export async function callLLM(
  messages: LLMMessage[],
  overrides?: Partial<LLMConfig>,
): Promise<LLMResponse> {
  const config = getAIConfig();
  if (!config) return DRY_RUN_RESPONSE;

  const merged: LLMConfig = {
    provider: overrides?.provider ?? config.provider,
    apiKey: overrides?.apiKey ?? config.apiKey,
    model: overrides?.model ?? config.model,
    maxTokens: overrides?.maxTokens ?? config.maxTokens,
    temperature: overrides?.temperature ?? config.temperature,
    baseUrl: overrides?.baseUrl ?? config.baseUrl,
  };

  const start = Date.now();

  if (merged.provider === "anthropic") {
    return callAnthropic(messages, merged, start);
  }

  return callOpenAI(messages, merged, start);
}

async function callAnthropic(
  messages: LLMMessage[],
  config: LLMConfig,
  startMs: number,
): Promise<LLMResponse> {
  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
  };

  if (systemMessages.length > 0) {
    body.system = systemMessages.map((m) => m.content).join("\n\n");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    model: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const textContent = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: textContent,
    model: data.model,
    usage: {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    },
    durationMs: Date.now() - startMs,
  };
}

async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig,
  startMs: number,
): Promise<LLMResponse> {
  const baseUrl = config.baseUrl ?? OPENAI_API_URL;

  const body = {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? "",
    model: data.model,
    usage: {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    },
    durationMs: Date.now() - startMs,
  };
}

function parseFiniteInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isFinite(parsed) ? parsed : fallback;
}

function parseFiniteFloat(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : fallback;
}
