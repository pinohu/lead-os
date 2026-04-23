import test from "node:test";
import assert from "node:assert/strict";
import {
  IntakePayloadSchema,
  validateSafe,
  validateOrThrow,
} from "../src/lib/canonical-schema.ts";
import { createRateLimiter } from "../src/lib/rate-limiter.ts";

// ---------------------------------------------------------------------------
// API route handlers import NextResponse from next/server which requires the
// full Next.js runtime. We test the underlying functions that power the routes:
// - Request validation (canonical-schema)
// - Rate limiting (rate-limiter)
// - Plan enforcement (covered in plan-enforcer.test.ts)
// - Auth gating (covered in auth-middleware.test.ts)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// IntakePayloadSchema — validation (powers POST /api/intake)
// ---------------------------------------------------------------------------

test("intake validates valid lead with source and email", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "website",
    email: "lead@example.com",
    firstName: "Test",
    lastName: "Lead",
  });

  assert.equal(result.valid, true);
  assert.ok(result.data);
  assert.equal(result.data.source, "website");
  assert.equal(result.data.email, "lead@example.com");
});

test("intake validates valid lead with source and phone (no email)", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "api",
    phone: "+1234567890",
  });

  assert.equal(result.valid, true);
  assert.ok(result.data);
  assert.equal(result.data.source, "api");
  assert.equal(result.data.phone, "+1234567890");
});

test("intake requires either email or phone", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "website",
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors);
  assert.ok(result.errors.some((e: string) => e.includes("email") || e.includes("phone")));
});

test("intake rejects payload with missing source field", () => {
  const result = validateSafe(IntakePayloadSchema, {
    email: "lead@example.com",
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors);
  assert.ok(result.errors.length > 0);
});

test("intake rejects payload with empty source", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "",
  });

  assert.equal(result.valid, false);
});

test("intake rejects empty object", () => {
  const result = validateSafe(IntakePayloadSchema, {});

  assert.equal(result.valid, false);
});

test("intake rejects invalid email format", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "website",
    email: "not-an-email",
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors);
});

test("intake accepts payload with all optional fields", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "landing-page",
    email: "full@example.com",
    phone: "+1234567890",
    firstName: "Full",
    lastName: "Lead",
    company: "Acme Corp",
    service: "consulting",
    niche: "legal",
    message: "I need help with my case",
    score: 85,
    returning: true,
    askingForQuote: false,
    wantsBooking: true,
    wantsCheckout: false,
  });

  assert.equal(result.valid, true);
  assert.ok(result.data);
  assert.equal(result.data.score, 85);
  assert.equal(result.data.returning, true);
});

test("intake rejects score outside valid range", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "website",
    score: 150,
  });

  assert.equal(result.valid, false);
});

test("intake rejects negative score", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "website",
    score: -10,
  });

  assert.equal(result.valid, false);
});

test("intake rejects source exceeding max length", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "x".repeat(51),
  });

  assert.equal(result.valid, false);
});

test("intake rejects message exceeding max length", () => {
  const result = validateSafe(IntakePayloadSchema, {
    source: "website",
    message: "x".repeat(5001),
  });

  assert.equal(result.valid, false);
});

// ---------------------------------------------------------------------------
// validateOrThrow — used by route handlers for strict validation
// ---------------------------------------------------------------------------

test("validateOrThrow returns parsed data for valid input", () => {
  const data = validateOrThrow(IntakePayloadSchema, {
    source: "test",
    email: "valid@example.com",
  });

  assert.equal(data.source, "test");
  assert.equal(data.email, "valid@example.com");
});

test("validateOrThrow throws for invalid input", () => {
  assert.throws(
    () => validateOrThrow(IntakePayloadSchema, {}),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes("Validation failed"));
      return true;
    },
  );
});

test("validateOrThrow includes context in error message", () => {
  assert.throws(
    () => validateOrThrow(IntakePayloadSchema, {}, "intake endpoint"),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes("intake endpoint"));
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// Rate limiter behavior (powers /api/intake rate limiting)
// ---------------------------------------------------------------------------

test("intake rate limiter blocks after 30 requests per minute", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

  for (let i = 0; i < 30; i++) {
    const result = limiter.check("intake:test-ip");
    assert.equal(result.allowed, true);
  }

  const blocked = limiter.check("intake:test-ip");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});

test("intake rate limiter tracks different IPs independently", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

  const r1 = limiter.check("intake:ip-a");
  assert.equal(r1.allowed, true);

  const r2 = limiter.check("intake:ip-b");
  assert.equal(r2.allowed, true);
});

test("rate limited response includes resetAt timestamp", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

  limiter.check("intake:reset-test");
  const blocked = limiter.check("intake:reset-test");

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.resetAt > Date.now());

  const retryAfterSeconds = Math.ceil((blocked.resetAt - Date.now()) / 1000);
  assert.ok(retryAfterSeconds > 0);
  assert.ok(retryAfterSeconds <= 60);
});

// ---------------------------------------------------------------------------
// LeadSchema validation (represents stored lead structure)
// ---------------------------------------------------------------------------

import { LeadSchema } from "../src/lib/canonical-schema.ts";

test("LeadSchema validates a complete lead record", () => {
  const now = new Date().toISOString();
  const result = validateSafe(LeadSchema, {
    id: "lead-001",
    source: "website",
    lifecycleStage: "captured",
    intentScore: 70,
    trustScore: 50,
    urgencyScore: 30,
    engagementScore: 60,
    compositeScore: 52,
    temperature: "warm",
    niche: "legal",
    tenantId: "tenant-1",
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(result.valid, true);
});

test("LeadSchema rejects invalid lifecycle stage", () => {
  const now = new Date().toISOString();
  const result = validateSafe(LeadSchema, {
    id: "lead-002",
    source: "website",
    lifecycleStage: "invalid-stage",
    intentScore: 70,
    trustScore: 50,
    urgencyScore: 30,
    engagementScore: 60,
    compositeScore: 52,
    temperature: "warm",
    niche: "legal",
    tenantId: "tenant-1",
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(result.valid, false);
});

test("LeadSchema rejects scores outside 0-100 range", () => {
  const now = new Date().toISOString();
  const result = validateSafe(LeadSchema, {
    id: "lead-003",
    source: "website",
    lifecycleStage: "captured",
    intentScore: 150,
    trustScore: 50,
    urgencyScore: 30,
    engagementScore: 60,
    compositeScore: 52,
    temperature: "warm",
    niche: "legal",
    tenantId: "tenant-1",
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(result.valid, false);
});

test("LeadSchema rejects invalid temperature", () => {
  const now = new Date().toISOString();
  const result = validateSafe(LeadSchema, {
    id: "lead-004",
    source: "website",
    lifecycleStage: "captured",
    intentScore: 70,
    trustScore: 50,
    urgencyScore: 30,
    engagementScore: 60,
    compositeScore: 52,
    temperature: "lukewarm",
    niche: "legal",
    tenantId: "tenant-1",
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(result.valid, false);
});
