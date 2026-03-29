import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveChatbaseConfig,
  isChatbaseDryRun,
  sendMessage,
  createBot,
  getConversation,
  listConversations,
  extractLeadFromConversation,
  getConversationStats,
  generateEmbedScript,
  chatViaChatbase,
  resetChatbaseStore,
  listBotConfigs,
} from "../src/lib/integrations/chatbase-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearChatbaseEnv() {
  delete process.env.CHATBASE_API_KEY;
  delete process.env.CHATBASE_BOT_ID;
  delete process.env.CHATBASE_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveChatbaseConfig returns config when env vars are set", () => {
  clearChatbaseEnv();
  process.env.CHATBASE_API_KEY = "cb-test-key";
  process.env.CHATBASE_BOT_ID = "bot-123";
  process.env.CHATBASE_BASE_URL = "https://custom.chatbase.co/api/v1";

  const cfg = resolveChatbaseConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "cb-test-key");
  assert.equal(cfg.botId, "bot-123");
  assert.equal(cfg.baseUrl, "https://custom.chatbase.co/api/v1");

  clearChatbaseEnv();
});

test("resolveChatbaseConfig uses default baseUrl when not set", () => {
  clearChatbaseEnv();
  process.env.CHATBASE_API_KEY = "cb-key";
  process.env.CHATBASE_BOT_ID = "bot-456";

  const cfg = resolveChatbaseConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://www.chatbase.co/api/v1");

  clearChatbaseEnv();
});

test("resolveChatbaseConfig returns null when no env vars set", () => {
  clearChatbaseEnv();
  const cfg = resolveChatbaseConfig();
  assert.equal(cfg, null);
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isChatbaseDryRun returns true when no API key", () => {
  clearChatbaseEnv();
  assert.equal(isChatbaseDryRun(), true);
});

test("isChatbaseDryRun returns false when API key is set", () => {
  clearChatbaseEnv();
  process.env.CHATBASE_API_KEY = "cb-live-key";
  assert.equal(isChatbaseDryRun(), false);
  clearChatbaseEnv();
});

// ---------------------------------------------------------------------------
// Send message — new conversation
// ---------------------------------------------------------------------------

test("sendMessage creates a new conversation in dry-run", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "Hello there!");
  assert.ok(response.conversationId);
  assert.ok(response.message.length > 0);
  assert.equal(response.leadCaptured, false);
});

test("sendMessage assigns a conversation ID when null is passed", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "Hi");
  assert.ok(response.conversationId.startsWith("conv-"));
});

test("sendMessage uses provided conversationId", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage("my-conv-123", "Hello");
  assert.equal(response.conversationId, "my-conv-123");
});

// ---------------------------------------------------------------------------
// Send message — existing conversation
// ---------------------------------------------------------------------------

test("sendMessage appends to existing conversation", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const first = await sendMessage(null, "Hi");
  const second = await sendMessage(first.conversationId, "Tell me about pricing");

  assert.equal(second.conversationId, first.conversationId);

  const conv = await getConversation(first.conversationId);
  assert.ok(conv);
  assert.equal(conv.messages.length, 4); // 2 user + 2 assistant
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — pricing
// ---------------------------------------------------------------------------

test("dry-run responds to pricing questions with qualification questions", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "What are your pricing plans?");
  assert.ok(response.message.toLowerCase().includes("pricing") || response.message.includes("quote") || response.message.includes("budget"));
  assert.deepEqual(response.suggestedActions, ["send-pricing-sheet"]);
});

test("dry-run responds to cost questions", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "How much does it cost?");
  assert.ok(response.message.length > 0);
});

test("dry-run responds to price questions", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "What is the price?");
  assert.ok(response.message.length > 0);
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — email detection
// ---------------------------------------------------------------------------

test("dry-run captures lead when email is provided", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "You can reach me at john@example.com");
  assert.equal(response.leadCaptured, true);
  assert.ok(response.capturedData);
  assert.equal(response.capturedData.email, "john@example.com");
  assert.ok(response.capturedData.qualificationScore > 0);
  assert.ok(response.suggestedActions?.includes("follow-up-email"));
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — phone detection
// ---------------------------------------------------------------------------

test("dry-run captures phone number", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "Call me at 555-123-4567");
  assert.equal(response.leadCaptured, true);
  assert.ok(response.capturedData);
  assert.ok(response.capturedData.phone);
  assert.ok(response.suggestedActions?.includes("schedule-call"));
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — name detection
// ---------------------------------------------------------------------------

test("dry-run captures name", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "My name is John Smith");
  assert.ok(response.message.includes("John Smith"));
  assert.equal(response.leadCaptured, false); // name alone doesn't capture lead
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — general message
// ---------------------------------------------------------------------------

test("dry-run responds to general messages", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "Tell me about your services");
  assert.ok(response.message.length > 0);
  assert.equal(response.leadCaptured, false);
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — demo request
// ---------------------------------------------------------------------------

test("dry-run responds to demo requests", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "I'd like to schedule a demo");
  assert.ok(response.message.length > 0);
  assert.ok(response.suggestedActions?.includes("schedule-demo"));
});

// ---------------------------------------------------------------------------
// Dry-run AI simulation — empty message
// ---------------------------------------------------------------------------

test("dry-run handles empty message", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const response = await sendMessage(null, "");
  assert.ok(response.message.includes("empty"));
  assert.equal(response.leadCaptured, false);
});

// ---------------------------------------------------------------------------
// Lead extraction from conversation
// ---------------------------------------------------------------------------

test("extractLeadFromConversation extracts email from messages", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "Hi there");
  await sendMessage(r1.conversationId, "My email is test@lead.com");

  const lead = await extractLeadFromConversation(r1.conversationId);
  assert.ok(lead);
  assert.equal(lead.email, "test@lead.com");
});

test("extractLeadFromConversation extracts phone from messages", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "Call me at 800-555-1234");
  const lead = await extractLeadFromConversation(r1.conversationId);
  assert.ok(lead);
  assert.ok(lead.phone);
});

test("extractLeadFromConversation extracts name from messages", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "My name is Jane Doe");
  const lead = await extractLeadFromConversation(r1.conversationId);
  assert.ok(lead);
  assert.equal(lead.name, "Jane Doe");
});

test("extractLeadFromConversation returns null for no conversation", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const lead = await extractLeadFromConversation("nonexistent-conv");
  assert.equal(lead, null);
});

test("extractLeadFromConversation returns null when no contact info found", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "just browsing");
  const lead = await extractLeadFromConversation(r1.conversationId);
  assert.equal(lead, null);
});

// ---------------------------------------------------------------------------
// Bot creation and configuration
// ---------------------------------------------------------------------------

test("createBot stores bot config locally", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const config = await createBot({
    botId: "my-bot",
    systemPrompt: "You are a helpful assistant",
    leadCaptureFields: ["email", "name", "phone"],
    qualificationQuestions: ["What is your budget?"],
    handoffThreshold: 80,
    greeting: "Hello! How can I help?",
    tenantId: "tenant-1",
  });

  assert.equal(config.botId, "my-bot");
  assert.equal(config.systemPrompt, "You are a helpful assistant");
  assert.equal(config.tenantId, "tenant-1");
});

test("createBot generates botId if empty", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const config = await createBot({
    botId: "",
    systemPrompt: "Helper",
    leadCaptureFields: ["email"],
    qualificationQuestions: [],
    handoffThreshold: 70,
    greeting: "Hi",
  });

  assert.ok(config.botId.startsWith("bot-"));
});

test("createBot stores config retrievable via listBotConfigs", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await createBot({
    botId: "bot-a",
    systemPrompt: "Prompt A",
    leadCaptureFields: [],
    qualificationQuestions: [],
    handoffThreshold: 50,
    greeting: "Hello",
    tenantId: "t-1",
  });

  await createBot({
    botId: "bot-b",
    systemPrompt: "Prompt B",
    leadCaptureFields: [],
    qualificationQuestions: [],
    handoffThreshold: 60,
    greeting: "Hi",
    tenantId: "t-2",
  });

  const allBots = listBotConfigs();
  assert.equal(allBots.length, 2);

  const t1Bots = listBotConfigs("t-1");
  assert.equal(t1Bots.length, 1);
  assert.equal(t1Bots[0].botId, "bot-a");
});

// ---------------------------------------------------------------------------
// Conversation retrieval
// ---------------------------------------------------------------------------

test("getConversation returns null for unknown ID", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const conv = await getConversation("unknown-conv");
  assert.equal(conv, null);
});

test("getConversation returns conversation with full history", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "Hello");
  const conv = await getConversation(r1.conversationId);

  assert.ok(conv);
  assert.equal(conv.id, r1.conversationId);
  assert.equal(conv.messages.length, 2); // user + assistant
  assert.equal(conv.messages[0].role, "user");
  assert.equal(conv.messages[0].content, "Hello");
  assert.equal(conv.messages[1].role, "assistant");
});

// ---------------------------------------------------------------------------
// Conversation listing
// ---------------------------------------------------------------------------

test("listConversations returns all conversations", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await sendMessage(null, "First conversation");
  await sendMessage(null, "Second conversation");

  const all = await listConversations();
  assert.equal(all.length, 2);
});

test("listConversations filters by botId", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await sendMessage(null, "Message to bot A", "bot-a");
  await sendMessage(null, "Message to bot B", "bot-b");

  const botA = await listConversations("bot-a");
  assert.equal(botA.length, 1);
  assert.equal(botA[0].botId, "bot-a");
});

test("listConversations filters by tenantId", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await createBot({
    botId: "tenant-bot",
    systemPrompt: "Help",
    leadCaptureFields: [],
    qualificationQuestions: [],
    handoffThreshold: 50,
    greeting: "Hi",
    tenantId: "tenant-x",
  });

  await sendMessage(null, "Hello from tenant", "tenant-bot");
  await sendMessage(null, "Hello from other", "other-bot");

  const tenantConvs = await listConversations(undefined, "tenant-x");
  assert.equal(tenantConvs.length, 1);
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getConversationStats returns zero stats when empty", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const stats = await getConversationStats();
  assert.equal(stats.totalConversations, 0);
  assert.equal(stats.leadsCaptured, 0);
  assert.equal(stats.avgMessages, 0);
  assert.equal(stats.conversionRate, 0);
  assert.deepEqual(stats.topQuestions, []);
});

test("getConversationStats computes correct values", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await sendMessage(null, "Just browsing");
  await sendMessage(null, "My email is lead@test.com");
  await sendMessage(null, "What is the pricing?");

  const stats = await getConversationStats();
  assert.equal(stats.totalConversations, 3);
  assert.equal(stats.leadsCaptured, 1); // only the email one
  assert.ok(stats.avgMessages > 0);
  assert.ok(stats.conversionRate > 0);
});

test("getConversationStats tracks top questions", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await sendMessage(null, "What is the pricing?");
  await sendMessage(null, "What is the pricing?");
  await sendMessage(null, "How does it work?");

  const stats = await getConversationStats();
  assert.ok(stats.topQuestions.length > 0);
  assert.equal(stats.topQuestions[0], "What is the pricing?");
});

// ---------------------------------------------------------------------------
// Embed script generation
// ---------------------------------------------------------------------------

test("generateEmbedScript returns script tag with bot ID", () => {
  const script = generateEmbedScript("my-bot-id");
  assert.ok(script.includes("<script>"));
  assert.ok(script.includes("</script>"));
  assert.ok(script.includes("my-bot-id"));
  assert.ok(script.includes("chatbase.co/embed.min.js"));
});

test("generateEmbedScript uses default options", () => {
  const script = generateEmbedScript("bot-1");
  assert.ok(script.includes("bottom-right"));
  assert.ok(script.includes("#4F46E5"));
  assert.ok(script.includes("Hi there! How can I help you today?"));
});

test("generateEmbedScript respects custom options", () => {
  const script = generateEmbedScript("bot-2", {
    position: "bottom-left",
    primaryColor: "#FF0000",
    greeting: "Welcome!",
  });
  assert.ok(script.includes("bottom-left"));
  assert.ok(script.includes("#FF0000"));
  assert.ok(script.includes("Welcome!"));
});

// ---------------------------------------------------------------------------
// ProviderResult format
// ---------------------------------------------------------------------------

test("chatViaChatbase returns ProviderResult in dry-run", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const result = await chatViaChatbase("Hello");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Chatbase");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.ok(typeof result.payload.conversationId === "string");
  assert.ok(typeof result.payload.message === "string");
});

test("chatViaChatbase carries conversationId through", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const first = await chatViaChatbase("Hi");
  const convId = first.payload?.conversationId as string;

  const second = await chatViaChatbase("Follow up", convId);
  assert.equal(second.ok, true);
  assert.equal(second.payload?.conversationId, convId);
});

test("chatViaChatbase captures lead data in payload", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const result = await chatViaChatbase("My email is agent@lead.com");
  assert.equal(result.ok, true);
  assert.equal(result.payload?.leadCaptured, true);
  const captured = result.payload?.capturedData as Record<string, unknown>;
  assert.equal(captured.email, "agent@lead.com");
});

// ---------------------------------------------------------------------------
// Store reset
// ---------------------------------------------------------------------------

test("resetChatbaseStore clears all state", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  await sendMessage(null, "Before reset");
  await createBot({
    botId: "reset-bot",
    systemPrompt: "x",
    leadCaptureFields: [],
    qualificationQuestions: [],
    handoffThreshold: 50,
    greeting: "y",
  });

  let convs = await listConversations();
  assert.ok(convs.length > 0);
  assert.ok(listBotConfigs().length > 0);

  resetChatbaseStore();

  convs = await listConversations();
  assert.equal(convs.length, 0);
  assert.equal(listBotConfigs().length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("sendMessage with both email and name captures both", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "My name is Alice Brown");
  await sendMessage(r1.conversationId, "My email is alice@example.com");

  const lead = await extractLeadFromConversation(r1.conversationId);
  assert.ok(lead);
  assert.equal(lead.name, "Alice Brown");
  assert.equal(lead.email, "alice@example.com");
  assert.ok(lead.qualificationScore >= 40); // 10 for name + 30 for email
});

test("conversation tracks updatedAt on each message", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "First");
  const conv1 = await getConversation(r1.conversationId);
  const firstUpdated = conv1!.updatedAt;

  await sendMessage(r1.conversationId, "Second");
  const conv2 = await getConversation(r1.conversationId);

  assert.ok(conv2!.updatedAt >= firstUpdated);
});

test("multiple conversations maintain independent state", async () => {
  clearChatbaseEnv();
  resetChatbaseStore();

  const r1 = await sendMessage(null, "My email is a@b.com");
  const r2 = await sendMessage(null, "Just browsing");

  assert.notEqual(r1.conversationId, r2.conversationId);
  assert.equal(r1.leadCaptured, true);
  assert.equal(r2.leadCaptured, false);
});
