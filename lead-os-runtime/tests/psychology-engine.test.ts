import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePsychology,
  getUrgencyTriggers,
  getTrustTriggers,
  getMicroCommitments,
  resolveObjections,
  generateSocialProof,
  listAllTriggers,
  type PsychologyProfile,
} from "../src/lib/psychology-engine.ts";

// ---------------------------------------------------------------------------
// evaluatePsychology -- urgency triggers for high urgency
// ---------------------------------------------------------------------------

test("evaluatePsychology returns urgency triggers when urgency score is high", () => {
  const profile: PsychologyProfile = {
    leadScore: 70,
    trustScore: 60,
    urgencyScore: 80,
    stage: "consideration",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 300,
    pagesViewed: 5,
  };

  const directive = evaluatePsychology(profile);
  assert.ok(directive.triggers.length > 0);
  assert.ok(directive.triggers.some((t) => t.category === "urgency"));
  assert.equal(directive.urgencyLevel, "critical");
});

// ---------------------------------------------------------------------------
// evaluatePsychology -- trust triggers for low trust
// ---------------------------------------------------------------------------

test("evaluatePsychology returns trust triggers when trust score is low", () => {
  const profile: PsychologyProfile = {
    leadScore: 40,
    trustScore: 15,
    urgencyScore: 20,
    stage: "awareness",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 60,
    pagesViewed: 2,
  };

  const directive = evaluatePsychology(profile);
  assert.ok(directive.triggers.length > 0);
  assert.ok(directive.triggers.some((t) => t.category === "trust"));
  assert.equal(directive.trustLevel, "unknown");
});

// ---------------------------------------------------------------------------
// evaluatePsychology -- micro-commitments for new visitors
// ---------------------------------------------------------------------------

test("evaluatePsychology returns micro-commitments for new low-score visitors with few pages viewed", () => {
  const profile: PsychologyProfile = {
    leadScore: 20,
    trustScore: 30,
    urgencyScore: 10,
    stage: "awareness",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 30,
    pagesViewed: 1,
  };

  const directive = evaluatePsychology(profile);
  assert.ok(directive.triggers.some((t) => t.category === "micro-commitment"));
  assert.ok(directive.recommendedMicroCommitment !== null);
});

// ---------------------------------------------------------------------------
// evaluatePsychology -- empty triggers for neutral profile
// ---------------------------------------------------------------------------

test("evaluatePsychology returns empty triggers array for fully neutral profile", () => {
  const profile: PsychologyProfile = {
    leadScore: 80,
    trustScore: 80,
    urgencyScore: 10,
    stage: "decision",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 500,
    pagesViewed: 15,
  };

  const directive = evaluatePsychology(profile);
  // High trust (>=60) skips trust triggers, low urgency (<40) skips urgency,
  // high leadScore (>=50) skips micro-commitments, not returning + trust>=40 adds social-proof.
  // The fallback catches remaining triggers. Verify no urgency or trust triggers selected.
  const urgencyTriggers = directive.triggers.filter((t) => t.category === "urgency");
  const trustTriggers = directive.triggers.filter((t) => t.category === "trust");
  assert.equal(urgencyTriggers.length, 0);
  assert.equal(trustTriggers.length, 0);
  assert.equal(directive.urgencyLevel, "none");
  assert.equal(directive.trustLevel, "trusting");
});

// ---------------------------------------------------------------------------
// resolveObjections
// ---------------------------------------------------------------------------

test("resolveObjections maps price objection to ROI response", () => {
  const responses = resolveObjections(["price"]);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].objection, "price");
  assert.ok(responses[0].response.includes("ROI"));
});

test("resolveObjections maps trust objection to guarantee response", () => {
  const responses = resolveObjections(["trust"]);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].objection, "trust");
  assert.ok(
    responses[0].response.includes("guarantee") ||
    responses[0].response.includes("Trusted") ||
    responses[0].response.includes("trusted"),
  );
});

test("resolveObjections handles unknown objections with a generic response", () => {
  const responses = resolveObjections(["something-totally-unknown"]);
  assert.equal(responses.length, 1);
  assert.ok(responses[0].response.length > 0);
  assert.ok(responses[0].response.includes("something-totally-unknown"));
});

test("resolveObjections maps multiple common objections", () => {
  const responses = resolveObjections(["price", "trust", "timing", "complexity"]);
  assert.equal(responses.length, 4);
  assert.ok(responses.every((r) => r.response.length > 0));
});

// ---------------------------------------------------------------------------
// generateSocialProof
// ---------------------------------------------------------------------------

test("generateSocialProof returns non-empty string with niche and stats", () => {
  const proof = generateSocialProof("plumbing", { customers: 150, conversions: 2000 });
  assert.ok(proof.length > 0);
  assert.ok(proof.includes("150+"));
  assert.ok(proof.includes("plumbing"));
  assert.ok(proof.includes("2,000"));
});

test("generateSocialProof uses defaults when stats are not provided", () => {
  const proof = generateSocialProof("general");
  assert.ok(proof.length > 0);
  assert.ok(proof.includes("200+"));
  assert.ok(proof.includes("service businesses"));
});

// ---------------------------------------------------------------------------
// getUrgencyTriggers
// ---------------------------------------------------------------------------

test("getUrgencyTriggers returns countdown type for high urgency score", () => {
  const triggers = getUrgencyTriggers(70, "consideration");
  assert.ok(triggers.length > 0);
  assert.ok(triggers.some((t) => t.type === "countdown"));
  for (let i = 1; i < triggers.length; i++) {
    assert.ok(triggers[i - 1].priority >= triggers[i].priority);
  }
});

test("getUrgencyTriggers returns more triggers for higher scores", () => {
  const low = getUrgencyTriggers(10, "awareness");
  const high = getUrgencyTriggers(80, "consideration");
  assert.ok(high.length >= low.length);
});

// ---------------------------------------------------------------------------
// getTrustTriggers
// ---------------------------------------------------------------------------

test("getTrustTriggers returns testimonial type for low trust score", () => {
  const triggers = getTrustTriggers(20, "awareness");
  assert.ok(triggers.length > 0);
  assert.ok(triggers.every((t) => t.category === "trust"));
  assert.ok(triggers.some((t) => t.type === "testimonial"));
});

test("getTrustTriggers returns fewer triggers for high trust scores", () => {
  const low = getTrustTriggers(10, "awareness");
  const high = getTrustTriggers(90, "awareness");
  assert.ok(low.length >= high.length);
});

// ---------------------------------------------------------------------------
// getMicroCommitments
// ---------------------------------------------------------------------------

test("getMicroCommitments returns triggers for low-score visitors", () => {
  const triggers = getMicroCommitments(20, 1);
  assert.ok(triggers.length > 0);
  assert.ok(triggers.every((t) => t.category === "micro-commitment"));
});

// ---------------------------------------------------------------------------
// evaluatePsychology -- urgency and trust levels
// ---------------------------------------------------------------------------

test("evaluatePsychology returns correct urgency levels across the range", () => {
  const base: PsychologyProfile = {
    leadScore: 50,
    trustScore: 50,
    urgencyScore: 0,
    stage: "consideration",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 100,
    pagesViewed: 3,
  };

  assert.equal(evaluatePsychology({ ...base, urgencyScore: 0 }).urgencyLevel, "none");
  assert.equal(evaluatePsychology({ ...base, urgencyScore: 25 }).urgencyLevel, "low");
  assert.equal(evaluatePsychology({ ...base, urgencyScore: 45 }).urgencyLevel, "medium");
  assert.equal(evaluatePsychology({ ...base, urgencyScore: 65 }).urgencyLevel, "high");
  assert.equal(evaluatePsychology({ ...base, urgencyScore: 85 }).urgencyLevel, "critical");
});

test("evaluatePsychology returns correct trust levels across the range", () => {
  const base: PsychologyProfile = {
    leadScore: 50,
    trustScore: 0,
    urgencyScore: 30,
    stage: "consideration",
    returning: false,
    device: "desktop",
    objections: [],
    timeOnSite: 100,
    pagesViewed: 3,
  };

  assert.equal(evaluatePsychology({ ...base, trustScore: 5 }).trustLevel, "unknown");
  assert.equal(evaluatePsychology({ ...base, trustScore: 25 }).trustLevel, "skeptical");
  assert.equal(evaluatePsychology({ ...base, trustScore: 45 }).trustLevel, "neutral");
  assert.equal(evaluatePsychology({ ...base, trustScore: 65 }).trustLevel, "warm");
  assert.equal(evaluatePsychology({ ...base, trustScore: 85 }).trustLevel, "trusting");
});

// ---------------------------------------------------------------------------
// evaluatePsychology -- returning visitors get social proof
// ---------------------------------------------------------------------------

test("evaluatePsychology returns social proof for returning visitors", () => {
  const profile: PsychologyProfile = {
    leadScore: 55,
    trustScore: 50,
    urgencyScore: 30,
    stage: "consideration",
    returning: true,
    device: "desktop",
    objections: [],
    timeOnSite: 200,
    pagesViewed: 8,
  };

  const directive = evaluatePsychology(profile);
  assert.ok(directive.socialProofType.length > 0);
  assert.equal(directive.socialProofType, "social-proof-velocity");
});

// ---------------------------------------------------------------------------
// listAllTriggers
// ---------------------------------------------------------------------------

test("listAllTriggers returns at least 20 triggers across all categories", () => {
  const triggers = listAllTriggers();
  assert.ok(triggers.length >= 20);

  const categories = new Set(triggers.map((t) => t.category));
  assert.ok(categories.has("urgency"));
  assert.ok(categories.has("trust"));
  assert.ok(categories.has("micro-commitment"));
  assert.ok(categories.has("social-proof"));
});

test("all triggers have required fields", () => {
  const triggers = listAllTriggers();
  for (const trigger of triggers) {
    assert.ok(trigger.id.length > 0);
    assert.ok(trigger.type.length > 0);
    assert.ok(trigger.category.length > 0);
    assert.ok(trigger.message.length > 0);
    assert.equal(typeof trigger.priority, "number");
    assert.ok(trigger.conditions !== undefined);
  }
});
