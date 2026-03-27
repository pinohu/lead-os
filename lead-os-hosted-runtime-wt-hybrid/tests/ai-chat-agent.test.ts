import test from "node:test";
import assert from "node:assert/strict";
import {
  startChatSession,
  processMessage,
  getChatSession,
  extractLeadData,
  buildSystemPrompt,
  type ChatMessage,
} from "../src/lib/ai-chat-agent.ts";

// ---------------------------------------------------------------------------
// startChatSession
// ---------------------------------------------------------------------------

test("startChatSession creates a session with system prompt", () => {
  const session = startChatSession("tenant-1", "visitor-1", "dental", "SmileCo");
  assert.ok(session.id.startsWith("chat-"));
  assert.equal(session.tenantId, "tenant-1");
  assert.equal(session.visitorId, "visitor-1");
  assert.equal(session.messages.length, 1);
  assert.equal(session.messages[0].role, "system");
  assert.ok(session.messages[0].content.includes("SmileCo"));
  assert.ok(session.messages[0].content.includes("dental"));
  assert.equal(session.leadCaptured, false);
  assert.equal(session.score, 0);
  assert.equal(session.extractedData.niche, "dental");
});

test("startChatSession works without niche and brandName", () => {
  const session = startChatSession("tenant-2", "visitor-2");
  assert.ok(session.id.startsWith("chat-"));
  assert.equal(session.messages.length, 1);
  assert.equal(session.messages[0].role, "system");
  assert.ok(session.messages[0].content.includes("our team"));
});

// ---------------------------------------------------------------------------
// processMessage
// ---------------------------------------------------------------------------

test("processMessage adds user and assistant messages", async () => {
  const session = startChatSession("tenant-3", "visitor-3", "legal", "LawFirm");
  const { session: updated, response } = await processMessage(session.id, "I need help with my business");
  assert.ok(response.length > 0);
  const userMessages = updated.messages.filter((m) => m.role === "user");
  const assistantMessages = updated.messages.filter((m) => m.role === "assistant");
  assert.equal(userMessages.length, 1);
  assert.equal(assistantMessages.length, 1);
  assert.equal(userMessages[0].content, "I need help with my business");
});

test("processMessage returns rule-based greeting on first message", async () => {
  const session = startChatSession("tenant-4", "visitor-4");
  const { response } = await processMessage(session.id, "Hi there");
  assert.ok(response.includes("Hello") || response.includes("help"));
});

test("processMessage extracts email from user message", async () => {
  const session = startChatSession("tenant-5", "visitor-5");
  await processMessage(session.id, "Hello");
  const { session: updated } = await processMessage(session.id, "You can reach me at john@example.com");
  assert.equal(updated.extractedData.email, "john@example.com");
  assert.equal(updated.leadCaptured, true);
});

test("processMessage extracts phone from user message", async () => {
  const session = startChatSession("tenant-6", "visitor-6");
  await processMessage(session.id, "Hello");
  const { session: updated } = await processMessage(session.id, "My number is 555-123-4567");
  assert.equal(updated.extractedData.phone, "555-123-4567");
  assert.equal(updated.leadCaptured, true);
});

test("processMessage extracts name from user message", async () => {
  const session = startChatSession("tenant-7", "visitor-7");
  await processMessage(session.id, "Hello");
  const { session: updated } = await processMessage(session.id, "My name is John Smith");
  assert.equal(updated.extractedData.name, "John Smith");
});

test("processMessage detects urgency keywords", async () => {
  const session = startChatSession("tenant-8", "visitor-8");
  await processMessage(session.id, "Hello");
  const { session: updated } = await processMessage(session.id, "I need this done ASAP");
  assert.equal(updated.extractedData.urgency, "high");
});

test("processMessage throws for invalid session id", async () => {
  await assert.rejects(
    () => processMessage("nonexistent-session", "Hello"),
    { message: /not found/ },
  );
});

// ---------------------------------------------------------------------------
// getChatSession
// ---------------------------------------------------------------------------

test("getChatSession returns existing session", () => {
  const session = startChatSession("tenant-9", "visitor-9");
  const retrieved = getChatSession(session.id);
  assert.ok(retrieved !== undefined);
  assert.equal(retrieved.id, session.id);
});

test("getChatSession returns undefined for unknown session", () => {
  const retrieved = getChatSession("unknown-id");
  assert.equal(retrieved, undefined);
});

// ---------------------------------------------------------------------------
// extractLeadData
// ---------------------------------------------------------------------------

test("extractLeadData finds email and phone from messages", async () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "Hi, I'm Sarah from TechCorp", timestamp: new Date().toISOString() },
    { role: "user", content: "My email is sarah@techcorp.com", timestamp: new Date().toISOString() },
    { role: "user", content: "Call me at 555-987-6543", timestamp: new Date().toISOString() },
  ];
  const result = await extractLeadData(messages);
  assert.equal(result.email, "sarah@techcorp.com");
  assert.equal(result.phone, "555-987-6543");
});

test("extractLeadData extracts name from conversation text", async () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "My name is David Johnson", timestamp: new Date().toISOString() },
  ];
  const result = await extractLeadData(messages);
  assert.equal(result.name, "David Johnson");
});

test("extractLeadData returns empty when no data present", async () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "What services do you offer?", timestamp: new Date().toISOString() },
  ];
  const result = await extractLeadData(messages);
  assert.equal(result.email, undefined);
  assert.equal(result.phone, undefined);
});

// ---------------------------------------------------------------------------
// buildSystemPrompt
// ---------------------------------------------------------------------------

test("buildSystemPrompt includes tenant and niche", () => {
  const prompt = buildSystemPrompt("acme-tenant", "plumbing", "AcmePlumb");
  assert.ok(prompt.includes("AcmePlumb"));
  assert.ok(prompt.includes("plumbing"));
  assert.ok(prompt.includes("acme-tenant"));
  assert.ok(prompt.includes("150 words"));
});

// ---------------------------------------------------------------------------
// Score computation
// ---------------------------------------------------------------------------

test("processMessage increases session score with engagement", async () => {
  const session = startChatSession("tenant-10", "visitor-10");
  await processMessage(session.id, "Hello");
  await processMessage(session.id, "I need help growing my business");
  await processMessage(session.id, "My name is Alice Chen");
  const { session: updated } = await processMessage(session.id, "Email me at alice@company.com");
  assert.ok(updated.score > 0);
  assert.ok(updated.score >= 20); // email alone is +20
});
