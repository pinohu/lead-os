import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatbaseConfig {
  apiKey: string;
  botId: string;
  baseUrl: string;
}

export interface ChatbaseMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CapturedLeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interest?: string;
  qualificationScore: number;
}

export interface ChatbaseConversation {
  id: string;
  botId: string;
  messages: ChatbaseMessage[];
  leadCaptured: boolean;
  capturedData?: CapturedLeadData;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotConfig {
  botId: string;
  systemPrompt: string;
  leadCaptureFields: string[];
  qualificationQuestions: string[];
  handoffThreshold: number;
  greeting: string;
  tenantId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  leadCaptured: boolean;
  capturedData?: CapturedLeadData;
  suggestedActions?: string[];
}

export interface ConversationStats {
  totalConversations: number;
  leadsCaptured: number;
  avgMessages: number;
  conversionRate: number;
  topQuestions: string[];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const conversationStore = new Map<string, ChatbaseConversation>();
const botConfigStore = new Map<string, ChatbotConfig>();

export function resetChatbaseStore(): void {
  conversationStore.clear();
  botConfigStore.clear();
}

// ---------------------------------------------------------------------------
// DB schema (lazy init)
// ---------------------------------------------------------------------------

let schemaEnsured = false;

export async function ensureChatbaseSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_chatbase_conversations (
        id TEXT PRIMARY KEY,
        bot_id TEXT NOT NULL,
        tenant_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        lead_captured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch (err) {
    console.error("[chatbase] schema init error:", err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// DB persistence helper
// ---------------------------------------------------------------------------

async function persistConversation(conversation: ChatbaseConversation, tenantId?: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  await ensureChatbaseSchema();

  try {
    await pool.query(
      `INSERT INTO lead_os_chatbase_conversations (id, bot_id, tenant_id, payload, lead_captured, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         payload = EXCLUDED.payload,
         lead_captured = EXCLUDED.lead_captured,
         updated_at = EXCLUDED.updated_at`,
      [
        conversation.id,
        conversation.botId,
        tenantId ?? null,
        JSON.stringify(conversation),
        conversation.leadCaptured,
        conversation.createdAt,
        conversation.updatedAt,
      ],
    );
  } catch (err) {
    console.error("[chatbase] persist error:", err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveChatbaseConfig(): ChatbaseConfig | null {
  const apiKey = process.env.CHATBASE_API_KEY ?? "";
  const botId = process.env.CHATBASE_BOT_ID ?? "";
  const baseUrl = process.env.CHATBASE_BASE_URL ?? "https://www.chatbase.co/api/v1";

  if (!apiKey && !botId) return null;

  return { apiKey, botId, baseUrl };
}

export function isChatbaseDryRun(): boolean {
  const apiKey = process.env.CHATBASE_API_KEY ?? "";
  return !apiKey;
}

// ---------------------------------------------------------------------------
// Regex patterns for lead extraction
// ---------------------------------------------------------------------------

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const NAME_PATTERN = /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;

// ---------------------------------------------------------------------------
// Dry-run AI simulation
// ---------------------------------------------------------------------------

function simulateResponse(message: string, conversation: ChatbaseConversation): ChatResponse {
  const lowerMessage = message.toLowerCase();
  const capturedData: CapturedLeadData = { ...conversation.capturedData, qualificationScore: conversation.capturedData?.qualificationScore ?? 0 };
  let leadCaptured = conversation.leadCaptured;
  let responseMessage: string;
  const suggestedActions: string[] = [];

  const emailMatch = message.match(EMAIL_PATTERN);
  if (emailMatch) {
    capturedData.email = emailMatch[0];
    capturedData.qualificationScore = Math.min(100, (capturedData.qualificationScore ?? 0) + 30);
    leadCaptured = true;
    responseMessage = "Thank you for sharing your email! I'll make sure our team follows up with you. Is there anything specific you'd like to know in the meantime?";
    suggestedActions.push("follow-up-email", "assign-to-sales");
  } else if (PHONE_PATTERN.test(message)) {
    const phoneMatch = message.match(PHONE_PATTERN);
    capturedData.phone = phoneMatch?.[0];
    capturedData.qualificationScore = Math.min(100, (capturedData.qualificationScore ?? 0) + 20);
    leadCaptured = true;
    responseMessage = "Got your phone number! A team member will reach out to you shortly.";
    suggestedActions.push("schedule-call");
  } else if (NAME_PATTERN.test(message)) {
    const nameMatch = message.match(NAME_PATTERN);
    capturedData.name = nameMatch?.[1];
    capturedData.qualificationScore = Math.min(100, (capturedData.qualificationScore ?? 0) + 10);
    responseMessage = `Nice to meet you, ${capturedData.name}! How can I help you today?`;
  } else if (lowerMessage.includes("pricing") || lowerMessage.includes("cost") || lowerMessage.includes("price")) {
    capturedData.interest = "pricing";
    capturedData.qualificationScore = Math.min(100, (capturedData.qualificationScore ?? 0) + 25);
    responseMessage = "Great question about pricing! To give you the most accurate quote, could you tell me:\n1. What's the size of your team?\n2. What features are most important to you?\n3. What's your approximate budget range?";
    suggestedActions.push("send-pricing-sheet");
  } else if (lowerMessage.includes("demo") || lowerMessage.includes("trial")) {
    capturedData.interest = "demo";
    capturedData.qualificationScore = Math.min(100, (capturedData.qualificationScore ?? 0) + 20);
    responseMessage = "I'd love to set up a demo for you! Could you share your email address so we can schedule a time that works?";
    suggestedActions.push("schedule-demo");
  } else if (lowerMessage === "") {
    responseMessage = "It looks like your message was empty. How can I assist you today?";
  } else {
    responseMessage = "Thanks for your message! I'm here to help you learn more about our services. Feel free to ask about pricing, features, or request a demo.";
  }

  return {
    message: responseMessage,
    conversationId: conversation.id,
    leadCaptured,
    capturedData: leadCaptured ? capturedData : undefined,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
  };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function sendMessage(
  conversationId: string | null,
  message: string,
  botId?: string,
): Promise<ChatResponse> {
  const cfg = resolveChatbaseConfig();
  const resolvedBotId = botId ?? cfg?.botId ?? "default";
  const now = new Date().toISOString();

  let conversation: ChatbaseConversation;

  if (conversationId && conversationStore.has(conversationId)) {
    conversation = conversationStore.get(conversationId)!;
  } else {
    const newId = conversationId ?? `conv-${randomUUID()}`;
    conversation = {
      id: newId,
      botId: resolvedBotId,
      messages: [],
      leadCaptured: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  conversation.messages.push({ role: "user", content: message });
  conversation.updatedAt = now;

  if (isChatbaseDryRun()) {
    const response = simulateResponse(message, conversation);
    conversation.messages.push({ role: "assistant", content: response.message });
    conversation.leadCaptured = response.leadCaptured;
    if (response.capturedData) {
      conversation.capturedData = response.capturedData;
    }
    conversationStore.set(conversation.id, conversation);
    await persistConversation(conversation);
    return response;
  }

  try {
    const res = await fetch(`${cfg!.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg!.apiKey}`,
      },
      body: JSON.stringify({
        chatbotId: resolvedBotId,
        messages: conversation.messages,
        conversationId: conversation.id,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { text?: string; message?: string };
      const assistantMessage = data.text ?? data.message ?? "I'm sorry, I couldn't process that request.";
      conversation.messages.push({ role: "assistant", content: assistantMessage });

      const extracted = extractLeadDataFromMessages(conversation.messages);
      if (extracted) {
        conversation.leadCaptured = true;
        conversation.capturedData = extracted;
      }

      conversationStore.set(conversation.id, conversation);
      await persistConversation(conversation);

      return {
        message: assistantMessage,
        conversationId: conversation.id,
        leadCaptured: conversation.leadCaptured,
        capturedData: conversation.capturedData,
      };
    }
  } catch {
    // Fall through to dry-run simulation on API failure
  }

  const fallback = simulateResponse(message, conversation);
  conversation.messages.push({ role: "assistant", content: fallback.message });
  conversation.leadCaptured = fallback.leadCaptured;
  if (fallback.capturedData) {
    conversation.capturedData = fallback.capturedData;
  }
  conversationStore.set(conversation.id, conversation);
  await persistConversation(conversation);
  return fallback;
}

export async function createBot(config: ChatbotConfig): Promise<ChatbotConfig> {
  const resolvedConfig = { ...config, botId: config.botId || `bot-${randomUUID()}` };

  botConfigStore.set(resolvedConfig.botId, resolvedConfig);

  if (!isChatbaseDryRun()) {
    const cfg = resolveChatbaseConfig();
    try {
      await fetch(`${cfg!.baseUrl}/chatbots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg!.apiKey}`,
        },
        body: JSON.stringify(resolvedConfig),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // local store fallback
    }
  }

  return resolvedConfig;
}

export async function getConversation(conversationId: string): Promise<ChatbaseConversation | null> {
  const local = conversationStore.get(conversationId);
  if (local) return local;

  if (!isChatbaseDryRun()) {
    const cfg = resolveChatbaseConfig();
    try {
      const res = await fetch(`${cfg!.baseUrl}/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${cfg!.apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = (await res.json()) as ChatbaseConversation;
        conversationStore.set(conversationId, data);
        return data;
      }
    } catch {
      // return null on error
    }
  }

  return null;
}

export async function listConversations(botId?: string, tenantId?: string): Promise<ChatbaseConversation[]> {
  let results = [...conversationStore.values()];

  if (botId) {
    results = results.filter((c) => c.botId === botId);
  }

  if (tenantId) {
    const botConfigs = [...botConfigStore.values()].filter((b) => b.tenantId === tenantId);
    const tenantBotIds = new Set(botConfigs.map((b) => b.botId));
    results = results.filter((c) => tenantBotIds.has(c.botId));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Lead extraction
// ---------------------------------------------------------------------------

function extractLeadDataFromMessages(messages: ChatbaseMessage[]): CapturedLeadData | null {
  let email: string | undefined;
  let phone: string | undefined;
  let name: string | undefined;
  let company: string | undefined;
  let interest: string | undefined;
  let qualificationScore = 0;

  for (const msg of messages) {
    if (msg.role !== "user") continue;

    const emailMatch = msg.content.match(EMAIL_PATTERN);
    if (emailMatch && !email) {
      email = emailMatch[0];
      qualificationScore += 30;
    }

    const phoneMatch = msg.content.match(PHONE_PATTERN);
    if (phoneMatch && !phone) {
      phone = phoneMatch[0];
      qualificationScore += 20;
    }

    const nameMatch = msg.content.match(NAME_PATTERN);
    if (nameMatch && !name) {
      name = nameMatch[1];
      qualificationScore += 10;
    }

    const companyMatch = msg.content.match(/(?:work at|work for|company is|from)\s+([A-Z][a-zA-Z0-9\s&]+)/i);
    if (companyMatch && !company) {
      company = companyMatch[1].trim();
      qualificationScore += 15;
    }

    const lowerContent = msg.content.toLowerCase();
    if (!interest) {
      if (lowerContent.includes("pricing") || lowerContent.includes("cost") || lowerContent.includes("price")) {
        interest = "pricing";
        qualificationScore += 25;
      } else if (lowerContent.includes("demo") || lowerContent.includes("trial")) {
        interest = "demo";
        qualificationScore += 20;
      }
    }
  }

  if (!email && !phone && !name) return null;

  return {
    name,
    email,
    phone,
    company,
    interest,
    qualificationScore: Math.min(100, qualificationScore),
  };
}

export async function extractLeadFromConversation(conversationId: string): Promise<CapturedLeadData | null> {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return null;

  const extracted = extractLeadDataFromMessages(conversation.messages);
  if (extracted) {
    conversation.leadCaptured = true;
    conversation.capturedData = extracted;
    conversation.updatedAt = new Date().toISOString();
    conversationStore.set(conversationId, conversation);
    await persistConversation(conversation);
  }

  return extracted;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getConversationStats(botId?: string, tenantId?: string): Promise<ConversationStats> {
  const conversations = await listConversations(botId, tenantId);

  const totalConversations = conversations.length;
  const leadsCaptured = conversations.filter((c) => c.leadCaptured).length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const avgMessages = totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0;
  const conversionRate = totalConversations > 0 ? Math.round((leadsCaptured / totalConversations) * 100 * 10) / 10 : 0;

  const questionCounts = new Map<string, number>();
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      if (msg.role === "user" && msg.content.includes("?")) {
        const question = msg.content.trim();
        questionCounts.set(question, (questionCounts.get(question) ?? 0) + 1);
      }
    }
  }

  const topQuestions = [...questionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([question]) => question);

  return {
    totalConversations,
    leadsCaptured,
    avgMessages,
    conversionRate,
    topQuestions,
  };
}

// ---------------------------------------------------------------------------
// Embed script
// ---------------------------------------------------------------------------

export function generateEmbedScript(
  botId: string,
  options?: {
    position?: "bottom-right" | "bottom-left";
    primaryColor?: string;
    greeting?: string;
  },
): string {
  const position = options?.position ?? "bottom-right";
  const primaryColor = options?.primaryColor ?? "#4F46E5";
  const greeting = options?.greeting ?? "Hi there! How can I help you today?";

  return `<script>
  window.chatbaseConfig = {
    chatbotId: "${botId}",
    position: "${position}",
    primaryColor: "${primaryColor}",
    greeting: "${greeting}"
  };
  (function() {
    var s = document.createElement("script");
    s.src = "https://www.chatbase.co/embed.min.js";
    s.async = true;
    s.defer = true;
    s.setAttribute("chatbotId", "${botId}");
    document.head.appendChild(s);
  })();
</script>`;
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export async function chatViaChatbase(
  message: string,
  conversationId?: string,
): Promise<ProviderResult> {
  const mode = isChatbaseDryRun() ? "dry-run" : "live";

  try {
    const response = await sendMessage(conversationId ?? null, message);

    return {
      ok: true,
      provider: "Chatbase",
      mode,
      detail: isChatbaseDryRun()
        ? "Chat response simulated (Chatbase dry-run)"
        : "Chat response received via Chatbase",
      payload: {
        conversationId: response.conversationId,
        message: response.message,
        leadCaptured: response.leadCaptured,
        capturedData: response.capturedData,
      },
    };
  } catch (err) {
    return {
      ok: false,
      provider: "Chatbase",
      mode,
      detail: err instanceof Error ? err.message : "Chatbase chat failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Bot config listing (for API routes)
// ---------------------------------------------------------------------------

export function listBotConfigs(tenantId?: string): ChatbotConfig[] {
  const all = [...botConfigStore.values()];
  if (tenantId) {
    return all.filter((b) => b.tenantId === tenantId);
  }
  return all;
}
