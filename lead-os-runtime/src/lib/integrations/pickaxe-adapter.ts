import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PickaxeConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Chatbot {
  id: string;
  tenantId: string;
  name: string;
  knowledgeBaseId: string;
  greeting: string;
  qualificationQuestions: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  chatbotId: string;
  visitorId: string;
  messages: ChatMessage[];
  capturedData: Record<string, string>;
  qualified: boolean;
  startedAt: string;
  endedAt?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface KnowledgeBase {
  id: string;
  tenantId: string;
  name: string;
  documentCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Pickaxe", "PICKAXE", "https://api.pickaxeproject.com/v1");

const chatbotStore = new Map<string, Chatbot>();
const sessionStore = new Map<string, ChatSession>();
const knowledgeBaseStore = new Map<string, KnowledgeBase>();

export function resetPickaxeStore(): void {
  chatbotStore.clear();
  sessionStore.clear();
  knowledgeBaseStore.clear();
  adapter.resetStore();
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: PickaxeConfig): Promise<{ ok: boolean; message: string }> {
  return adapter.healthCheck(config);
}

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------

export async function createKnowledgeBase(
  tenantId: string,
  name: string,
): Promise<KnowledgeBase> {
  const kb: KnowledgeBase = {
    id: `kb-${randomUUID()}`,
    tenantId,
    name,
    documentCount: 0,
    createdAt: new Date().toISOString(),
  };
  knowledgeBaseStore.set(kb.id, kb);
  return kb;
}

export async function getKnowledgeBase(kbId: string): Promise<KnowledgeBase | undefined> {
  return knowledgeBaseStore.get(kbId);
}

// ---------------------------------------------------------------------------
// Chatbot CRUD
// ---------------------------------------------------------------------------

export async function createChatbot(
  tenantId: string,
  name: string,
  knowledgeBaseId: string,
  greeting: string,
  qualificationQuestions: string[],
): Promise<Chatbot> {
  const now = new Date().toISOString();
  const chatbot: Chatbot = {
    id: `bot-${randomUUID()}`,
    tenantId,
    name,
    knowledgeBaseId,
    greeting,
    qualificationQuestions,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  chatbotStore.set(chatbot.id, chatbot);
  return chatbot;
}

export async function getChatbot(chatbotId: string): Promise<Chatbot | undefined> {
  return chatbotStore.get(chatbotId);
}

export async function listChatbots(tenantId: string): Promise<Chatbot[]> {
  return [...chatbotStore.values()].filter((b) => b.tenantId === tenantId);
}

export async function deleteChatbot(chatbotId: string): Promise<boolean> {
  return chatbotStore.delete(chatbotId);
}

// ---------------------------------------------------------------------------
// Embed script
// ---------------------------------------------------------------------------

export function generateEmbedScript(chatbotId: string, config?: PickaxeConfig): string {
  const cfg = adapter.resolveConfig(config);
  return `<script src="${cfg.baseUrl}/embed/${chatbotId}.js" data-pickaxe-key="${cfg.apiKey}" async></script>`;
}

// ---------------------------------------------------------------------------
// Chat sessions
// ---------------------------------------------------------------------------

export async function startSession(
  chatbotId: string,
  visitorId: string,
): Promise<ChatSession> {
  const session: ChatSession = {
    id: `sess-${randomUUID()}`,
    chatbotId,
    visitorId,
    messages: [],
    capturedData: {},
    qualified: false,
    startedAt: new Date().toISOString(),
  };
  sessionStore.set(session.id, session);
  return session;
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): Promise<ChatSession> {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  session.messages.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  return session;
}

export async function captureLeadData(
  sessionId: string,
  data: Record<string, string>,
): Promise<ChatSession> {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  Object.assign(session.capturedData, data);
  return session;
}

export async function markQualified(sessionId: string): Promise<ChatSession> {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  session.qualified = true;
  session.endedAt = new Date().toISOString();
  return session;
}

export async function getSession(sessionId: string): Promise<ChatSession | undefined> {
  return sessionStore.get(sessionId);
}

export async function listSessions(chatbotId: string): Promise<ChatSession[]> {
  return [...sessionStore.values()].filter((s) => s.chatbotId === chatbotId);
}
