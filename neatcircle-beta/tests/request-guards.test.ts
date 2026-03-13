import test from "node:test";
import assert from "node:assert/strict";
import {
  clampText,
  enforceRateLimit,
  getRequestIdentity,
  isLikelyBotRequest,
  isPlainObject,
  isValidEmail,
  isValidPhone,
} from "../src/lib/request-guards.ts";

test("email validation accepts normal addresses and rejects malformed values", () => {
  assert.equal(isValidEmail("ops@example.com"), true);
  assert.equal(isValidEmail("bad-email"), false);
  assert.equal(isValidEmail(undefined), false);
});

test("phone validation accepts realistic values", () => {
  assert.equal(isValidPhone("+1 (555) 222-4444"), true);
  assert.equal(isValidPhone("12345"), false);
});

test("clampText trims and limits length", () => {
  assert.equal(clampText("  hello world  ", 5), "hello");
  assert.equal(clampText(42, 10), "");
});

test("plain object guard distinguishes arrays and null", () => {
  assert.equal(isPlainObject({ ok: true }), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject(null), false);
});

test("request identity prefers forwarded headers", () => {
  const request = new Request("https://example.com/api/test", {
    headers: {
      "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      "x-real-ip": "198.51.100.20",
    },
  });

  assert.equal(getRequestIdentity(request), "203.0.113.1");
});

test("rate limit blocks after the configured threshold", () => {
  const first = enforceRateLimit("test-rate-limit", 2, 60_000);
  const second = enforceRateLimit("test-rate-limit", 2, 60_000);
  const third = enforceRateLimit("test-rate-limit", 2, 60_000);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
});

test("bot detection catches common crawler user agents", () => {
  const botRequest = new Request("https://example.com/api/track", {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
    },
  });
  const humanRequest = new Request("https://example.com/api/track", {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    },
  });

  assert.equal(isLikelyBotRequest(botRequest), true);
  assert.equal(isLikelyBotRequest(humanRequest), false);
});
