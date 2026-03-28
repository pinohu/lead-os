import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../src/lib/rate-limiter.ts";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

test("createRateLimiter returns an object with check and reset functions", () => {
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 5 });

  assert.equal(typeof limiter.check, "function");
  assert.equal(typeof limiter.reset, "function");
});

// ---------------------------------------------------------------------------
// Requests under the limit
// ---------------------------------------------------------------------------

test("rate limiter allows requests under the limit", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

  const r1 = limiter.check("user-1");
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = limiter.check("user-1");
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = limiter.check("user-1");
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);
});

// ---------------------------------------------------------------------------
// Requests over the limit
// ---------------------------------------------------------------------------

test("rate limiter blocks requests over the limit", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });

  limiter.check("over-user");
  limiter.check("over-user");

  const blocked = limiter.check("over-user");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.resetAt > Date.now());
});

// ---------------------------------------------------------------------------
// Window expiry
// ---------------------------------------------------------------------------

test("rate limiter resets after the window expires", async () => {
  const limiter = createRateLimiter({ windowMs: 50, maxRequests: 1 });

  const r1 = limiter.check("expiry-key");
  assert.equal(r1.allowed, true);

  const r2 = limiter.check("expiry-key");
  assert.equal(r2.allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 60));

  const r3 = limiter.check("expiry-key");
  assert.equal(r3.allowed, true);
});

// ---------------------------------------------------------------------------
// Independent keys
// ---------------------------------------------------------------------------

test("multiple keys are tracked independently", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

  const r1 = limiter.check("key-a");
  assert.equal(r1.allowed, true);

  const r2 = limiter.check("key-b");
  assert.equal(r2.allowed, true);

  const r3 = limiter.check("key-a");
  assert.equal(r3.allowed, false);

  const r4 = limiter.check("key-b");
  assert.equal(r4.allowed, false);
});

// ---------------------------------------------------------------------------
// Reset function
// ---------------------------------------------------------------------------

test("reset clears a specific key", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

  limiter.check("reset-key");
  const blocked = limiter.check("reset-key");
  assert.equal(blocked.allowed, false);

  limiter.reset("reset-key");

  const afterReset = limiter.check("reset-key");
  assert.equal(afterReset.allowed, true);
});

test("reset does not affect other keys", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

  limiter.check("keep-key");
  limiter.check("clear-key");

  limiter.reset("clear-key");

  const keepResult = limiter.check("keep-key");
  assert.equal(keepResult.allowed, false);

  const clearResult = limiter.check("clear-key");
  assert.equal(clearResult.allowed, true);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("rate limiter with maxRequests of 1 allows exactly one request", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

  const r1 = limiter.check("single");
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 0);

  const r2 = limiter.check("single");
  assert.equal(r2.allowed, false);
});

test("rate limiter with very short window resets quickly", async () => {
  const limiter = createRateLimiter({ windowMs: 10, maxRequests: 1 });

  limiter.check("short-window");
  const blocked = limiter.check("short-window");
  assert.equal(blocked.allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 20));

  const allowed = limiter.check("short-window");
  assert.equal(allowed.allowed, true);
});

test("resetAt timestamp is in the future for blocked requests", () => {
  const limiter = createRateLimiter({ windowMs: 5000, maxRequests: 1 });

  limiter.check("future-reset");
  const blocked = limiter.check("future-reset");

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.resetAt > Date.now());
  assert.ok(blocked.resetAt <= Date.now() + 5000);
});

test("remaining count decreases correctly with each request", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

  for (let i = 4; i >= 0; i--) {
    const result = limiter.check("countdown");
    assert.equal(result.remaining, i);
  }
});

test("new key starts with full allowance", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

  const result = limiter.check("fresh-key");
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 9);
});
