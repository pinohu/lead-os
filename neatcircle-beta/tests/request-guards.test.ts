import test from "node:test";
import assert from "node:assert/strict";
import {
  clampText,
  enforceRateLimit,
  getRequestIdentity,
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
