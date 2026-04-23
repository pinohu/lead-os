import test from "node:test";
import assert from "node:assert/strict";
import {
  IntakePayloadSchema,
  LeadSchema,
  InteractionSchema,
  SessionSchema,
  ConversionEventSchema,
  DecisionSignalSchema,
  validateOrThrow,
  validateSafe,
} from "../src/lib/canonical-schema.ts";

const NOW = new Date().toISOString();

test("IntakePayloadSchema accepts valid payload with email", () => {
  const result = IntakePayloadSchema.safeParse({
    source: "chat",
    email: "test@example.com",
    firstName: "Alice",
  });
  assert.equal(result.success, true);
});

test("IntakePayloadSchema accepts valid payload with phone", () => {
  const result = IntakePayloadSchema.safeParse({
    source: "form",
    phone: "+15551234567",
    lastName: "Smith",
  });
  assert.equal(result.success, true);
});

test("IntakePayloadSchema requires email or phone", () => {
  const result = IntakePayloadSchema.safeParse({
    source: "web",
    firstName: "Bob",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    assert.ok(messages.some((m) => m.includes("email or phone")));
  }
});

test("IntakePayloadSchema rejects empty source", () => {
  const result = IntakePayloadSchema.safeParse({
    source: "",
    email: "a@b.com",
  });
  assert.equal(result.success, false);
});

test("IntakePayloadSchema rejects missing source", () => {
  const result = IntakePayloadSchema.safeParse({
    email: "a@b.com",
  });
  assert.equal(result.success, false);
});

test("IntakePayloadSchema validates score range 0-100", () => {
  const tooHigh = IntakePayloadSchema.safeParse({
    source: "web",
    email: "a@b.com",
    score: 150,
  });
  assert.equal(tooHigh.success, false);

  const tooLow = IntakePayloadSchema.safeParse({
    source: "web",
    email: "a@b.com",
    score: -5,
  });
  assert.equal(tooLow.success, false);

  const valid = IntakePayloadSchema.safeParse({
    source: "web",
    email: "a@b.com",
    score: 85,
  });
  assert.equal(valid.success, true);
});

test("IntakePayloadSchema rejects invalid email", () => {
  const result = IntakePayloadSchema.safeParse({
    source: "web",
    email: "not-an-email",
  });
  assert.equal(result.success, false);
});

test("LeadSchema validates all lifecycle stages", () => {
  const stages = [
    "anonymous", "engaged", "captured", "qualified", "nurturing",
    "booked", "offered", "converted", "onboarding", "active",
    "retention-risk", "referral-ready", "churned",
  ] as const;

  for (const stage of stages) {
    const result = LeadSchema.safeParse({
      id: "lead-1",
      source: "web",
      lifecycleStage: stage,
      intentScore: 50,
      trustScore: 50,
      urgencyScore: 50,
      engagementScore: 50,
      compositeScore: 50,
      temperature: "warm",
      niche: "plumbing",
      tenantId: "t-1",
      createdAt: NOW,
      updatedAt: NOW,
    });
    assert.equal(result.success, true, `Stage "${stage}" should be valid`);
  }
});

test("LeadSchema rejects invalid lifecycle stage", () => {
  const result = LeadSchema.safeParse({
    id: "lead-1",
    source: "web",
    lifecycleStage: "invalid-stage",
    intentScore: 50,
    trustScore: 50,
    urgencyScore: 50,
    engagementScore: 50,
    compositeScore: 50,
    temperature: "warm",
    niche: "plumbing",
    tenantId: "t-1",
    createdAt: NOW,
    updatedAt: NOW,
  });
  assert.equal(result.success, false);
});

test("LeadSchema rejects scores outside 0-100", () => {
  const result = LeadSchema.safeParse({
    id: "lead-1",
    source: "web",
    lifecycleStage: "captured",
    intentScore: 150,
    trustScore: 50,
    urgencyScore: 50,
    engagementScore: 50,
    compositeScore: 50,
    temperature: "warm",
    niche: "plumbing",
    tenantId: "t-1",
    createdAt: NOW,
    updatedAt: NOW,
  });
  assert.equal(result.success, false);
});

test("InteractionSchema validates all event types", () => {
  const types = [
    "page_view", "form_submit", "quiz_answer", "calculator_use",
    "chat_message", "email_open", "email_click", "sms_reply",
    "call_completed", "booking_made", "document_signed",
    "payment_made", "referral_sent", "widget_interaction",
  ] as const;

  for (const eventType of types) {
    const result = InteractionSchema.safeParse({
      id: "int-1",
      leadId: "lead-1",
      type: eventType,
      timestamp: NOW,
      metadata: {},
    });
    assert.equal(result.success, true, `Event type "${eventType}" should be valid`);
  }
});

test("InteractionSchema rejects invalid event type", () => {
  const result = InteractionSchema.safeParse({
    id: "int-1",
    leadId: "lead-1",
    type: "teleportation",
    timestamp: NOW,
    metadata: {},
  });
  assert.equal(result.success, false);
});

test("SessionSchema validates a complete session", () => {
  const result = SessionSchema.safeParse({
    sessionId: "sess-1",
    visitorId: "v-1",
    source: "organic",
    device: "mobile",
    startedAt: NOW,
    lastActivityAt: NOW,
    pageViews: 5,
    duration: 120,
  });
  assert.equal(result.success, true);
});

test("SessionSchema rejects negative pageViews", () => {
  const result = SessionSchema.safeParse({
    sessionId: "sess-1",
    visitorId: "v-1",
    source: "organic",
    device: "desktop",
    startedAt: NOW,
    lastActivityAt: NOW,
    pageViews: -1,
    duration: 0,
  });
  assert.equal(result.success, false);
});

test("ConversionEventSchema defaults currency to USD", () => {
  const result = ConversionEventSchema.safeParse({
    id: "conv-1",
    leadId: "lead-1",
    funnel: "main",
    revenue: 997,
    timestamp: NOW,
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.currency, "USD");
  }
});

test("DecisionSignalSchema validates minimal signal", () => {
  const result = DecisionSignalSchema.safeParse({
    source: "chat",
    hasEmail: true,
    hasPhone: false,
  });
  assert.equal(result.success, true);
});

test("validateOrThrow throws with context on failure", () => {
  assert.throws(
    () => validateOrThrow(LeadSchema, { id: "x" }, "lead-creation"),
    (err: Error) => {
      return (
        err.message.includes("Validation failed") &&
        err.message.includes("lead-creation")
      );
    },
  );
});

test("validateOrThrow returns data on success", () => {
  const input = {
    source: "chat",
    hasEmail: true,
    hasPhone: false,
  };
  const result = validateOrThrow(DecisionSignalSchema, input, "signal-check");
  assert.equal(result.source, "chat");
  assert.equal(result.hasEmail, true);
});

test("validateSafe returns errors array on failure", () => {
  const result = validateSafe(LeadSchema, { id: "x" });
  assert.equal(result.valid, false);
  assert.ok(result.errors);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors[0].includes(":"));
});

test("validateSafe returns data on success", () => {
  const input = {
    source: "form",
    hasEmail: false,
    hasPhone: true,
  };
  const result = validateSafe(DecisionSignalSchema, input);
  assert.equal(result.valid, true);
  assert.ok(result.data);
  assert.equal(result.data.source, "form");
});
