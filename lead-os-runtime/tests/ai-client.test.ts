import test from "node:test";
import assert from "node:assert/strict";
import { withEnv } from "./test-helpers.ts";
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
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const config = getAIConfig();
    assert.equal(config, null);
  } finally {
    restore();
  }
});

test("getAIConfig returns null when AI_API_KEY is empty", () => {
  const restore = withEnv({ AI_API_KEY: "   " });
  try {
    const config = getAIConfig();
    assert.equal(config, null);
  } finally {
    restore();
  }
});

test("getAIConfig returns config when AI_API_KEY is set", () => {
  const restore = withEnv({
    AI_API_KEY: "test-key-123",
    AI_PROVIDER: undefined,
    AI_MODEL: undefined,
  });
  try {
    const config = getAIConfig();
    assert.ok(config !== null);
    assert.equal(config.provider, "anthropic");
    assert.equal(config.apiKey, "test-key-123");
    assert.equal(config.model, "claude-sonnet-4-20250514");
    assert.equal(config.maxTokens, 1024);
    assert.equal(config.temperature, 0.7);
  } finally {
    restore();
  }
});

test("getAIConfig respects openai provider setting", () => {
  const restore = withEnv({
    AI_API_KEY: "sk-openai-test",
    AI_PROVIDER: "openai",
    AI_MODEL: undefined,
  });
  try {
    const config = getAIConfig();
    assert.ok(config !== null);
    assert.equal(config.provider, "openai");
    assert.equal(config.model, "gpt-4o");
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// isAIEnabled
// ---------------------------------------------------------------------------

test("isAIEnabled returns false when no API key is set", () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    assert.equal(isAIEnabled(), false);
  } finally {
    restore();
  }
});

test("isAIEnabled returns true when API key is set", () => {
  const restore = withEnv({ AI_API_KEY: "test-key" });
  try {
    assert.equal(isAIEnabled(), true);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// callLLM dry-run
// ---------------------------------------------------------------------------

test("callLLM returns dry-run response when AI is not configured", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
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
    restore();
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
