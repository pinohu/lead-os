import test from "node:test";
import assert from "node:assert/strict";
import {
  getAIConfig,
  isAIEnabled,
  callLLM,
  type LLMMessage,
} from "../src/lib/ai-client.ts";

// ---------------------------------------------------------------------------
// getAIConfig
// ---------------------------------------------------------------------------

test("getAIConfig returns null when AI_API_KEY is not set", () => {
  const original = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const config = getAIConfig();
    assert.equal(config, null);
  } finally {
    if (original !== undefined) process.env.AI_API_KEY = original;
  }
});

test("getAIConfig returns null when AI_API_KEY is empty", () => {
  const original = process.env.AI_API_KEY;
  process.env.AI_API_KEY = "   ";
  try {
    const config = getAIConfig();
    assert.equal(config, null);
  } finally {
    if (original !== undefined) process.env.AI_API_KEY = original;
    else delete process.env.AI_API_KEY;
  }
});

test("getAIConfig returns config when AI_API_KEY is set", () => {
  const origKey = process.env.AI_API_KEY;
  const origProvider = process.env.AI_PROVIDER;
  const origModel = process.env.AI_MODEL;
  process.env.AI_API_KEY = "test-key-123";
  delete process.env.AI_PROVIDER;
  delete process.env.AI_MODEL;
  try {
    const config = getAIConfig();
    assert.ok(config !== null);
    assert.equal(config.provider, "anthropic");
    assert.equal(config.apiKey, "test-key-123");
    assert.equal(config.model, "claude-sonnet-4-20250514");
    assert.equal(config.maxTokens, 1024);
    assert.equal(config.temperature, 0.7);
  } finally {
    if (origKey !== undefined) process.env.AI_API_KEY = origKey;
    else delete process.env.AI_API_KEY;
    if (origProvider !== undefined) process.env.AI_PROVIDER = origProvider;
    if (origModel !== undefined) process.env.AI_MODEL = origModel;
  }
});

test("getAIConfig respects openai provider setting", () => {
  const origKey = process.env.AI_API_KEY;
  const origProvider = process.env.AI_PROVIDER;
  const origModel = process.env.AI_MODEL;
  process.env.AI_API_KEY = "sk-openai-test";
  process.env.AI_PROVIDER = "openai";
  delete process.env.AI_MODEL;
  try {
    const config = getAIConfig();
    assert.ok(config !== null);
    assert.equal(config.provider, "openai");
    assert.equal(config.model, "gpt-4o");
  } finally {
    if (origKey !== undefined) process.env.AI_API_KEY = origKey;
    else delete process.env.AI_API_KEY;
    if (origProvider !== undefined) process.env.AI_PROVIDER = origProvider;
    else delete process.env.AI_PROVIDER;
    if (origModel !== undefined) process.env.AI_MODEL = origModel;
  }
});

// ---------------------------------------------------------------------------
// isAIEnabled
// ---------------------------------------------------------------------------

test("isAIEnabled returns false when no API key is set", () => {
  const original = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    assert.equal(isAIEnabled(), false);
  } finally {
    if (original !== undefined) process.env.AI_API_KEY = original;
  }
});

test("isAIEnabled returns true when API key is set", () => {
  const origKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = "test-key";
  try {
    assert.equal(isAIEnabled(), true);
  } finally {
    if (origKey !== undefined) process.env.AI_API_KEY = origKey;
    else delete process.env.AI_API_KEY;
  }
});

// ---------------------------------------------------------------------------
// callLLM dry-run
// ---------------------------------------------------------------------------

test("callLLM returns dry-run response when AI is not configured", async () => {
  const original = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const messages: LLMMessage[] = [
      { role: "system", content: "You are a test assistant." },
      { role: "user", content: "Hello" },
    ];
    const result = await callLLM(messages);
    assert.equal(result.content, "[AI not configured]");
    assert.equal(result.model, "dry-run");
    assert.equal(result.usage.inputTokens, 0);
    assert.equal(result.usage.outputTokens, 0);
    assert.equal(result.durationMs, 0);
  } finally {
    if (original !== undefined) process.env.AI_API_KEY = original;
  }
});

// ---------------------------------------------------------------------------
// Message format validation
// ---------------------------------------------------------------------------

test("LLMMessage supports system, user, and assistant roles", () => {
  const messages: LLMMessage[] = [
    { role: "system", content: "System prompt" },
    { role: "user", content: "User message" },
    { role: "assistant", content: "Assistant response" },
  ];
  assert.equal(messages.length, 3);
  assert.equal(messages[0].role, "system");
  assert.equal(messages[1].role, "user");
  assert.equal(messages[2].role, "assistant");
});
