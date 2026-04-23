import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { applyAdjustment, type Adjustment } from "../src/lib/feedback-engine.ts";
import { getScoringConfig, setScoringConfig, resetScoringConfigStore } from "../src/lib/scoring-config.ts";
import { resetNicheConfigStore, createNicheConfig, resolveNicheConfig, type NicheConfig } from "../src/lib/niche-adapter.ts";

function buildTestNicheConfig(slug: string): NicheConfig {
  return {
    slug,
    name: "Test Niche",
    industry: "general",
    audience: {
      description: "Test audience",
      painPoints: ["Pain A"],
      urgencyType: "ongoing",
      avgDealValue: { min: 100, max: 1000 },
      decisionMakers: ["owner"],
    },
    scoring: {
      intentWeight: 0.3,
      fitWeight: 0.25,
      engagementWeight: 0.25,
      urgencyWeight: 0.2,
      sourceWeights: {},
      urgencyKeywords: ["urgent"],
      fitSignals: ["has-budget"],
    },
    offers: {
      primary: { name: "Test Offer", priceRange: { min: 100, max: 500 }, guarantee: "30-day" },
      upsells: [],
      leadMagnet: "Free guide",
      pricingModel: "per-project",
    },
    psychology: {
      primaryFear: "Wasting money",
      primaryDesire: "Growth",
      trustFactors: ["reviews"],
      objectionPatterns: ["Too expensive"],
      urgencyTriggers: ["Limited time"],
    },
    channels: {
      primary: ["seo"],
      secondary: ["email"],
      followUp: { sms: false, email: true, call: false, whatsapp: false },
      responseTimeTarget: 5,
    },
    funnels: {
      preferredFamily: "qualification",
      conversionPath: ["landing", "offer"],
      nurtureDuration: 30,
      touchFrequency: 3,
    },
    monetization: {
      model: "managed-service",
      leadValue: { min: 50, max: 200 },
      marginTarget: 40,
    },
    content: {
      headlines: { cold: "Discover", warm: "Next step?", hot: "Act now", burning: "Last chance" },
      ctas: ["Get Started"],
      emailSubjects: ["Welcome"],
      smsTemplates: ["Hi {{name}}"],
    },
  };
}

beforeEach(() => {
  resetScoringConfigStore();
  resetNicheConfigStore();
});

// ---------------------------------------------------------------------------
// Scoring weight adjustments
// ---------------------------------------------------------------------------

test("applyAdjustment writes scoring weight for intentWeight", async () => {
  setScoringConfig("t-1", {
    intentWeight: 0.3,
    fitWeight: 0.25,
    engagementWeight: 0.25,
    urgencyWeight: 0.2,
  });

  const adj: Adjustment = {
    type: "scoring-weight",
    target: "intentWeight",
    oldValue: 0.3,
    newValue: 0.25,
    reason: "Testing",
    autoApplied: true,
  };

  await applyAdjustment("t-1", adj);

  const cfg = getScoringConfig("t-1");
  assert.ok(cfg);
  assert.equal(cfg.intentWeight, 0.25);
});

test("applyAdjustment writes scoring weight for fitWeight", async () => {
  setScoringConfig("t-2", {
    intentWeight: 0.3,
    fitWeight: 0.25,
    engagementWeight: 0.25,
    urgencyWeight: 0.2,
  });

  const adj: Adjustment = {
    type: "scoring-weight",
    target: "fitWeight",
    oldValue: 0.25,
    newValue: 0.30,
    reason: "Increase fit importance",
    autoApplied: true,
  };

  await applyAdjustment("t-2", adj);

  const cfg = getScoringConfig("t-2");
  assert.ok(cfg);
  assert.equal(cfg.fitWeight, 0.30);
});

test("applyAdjustment creates scoring config if none exists", async () => {
  const adj: Adjustment = {
    type: "scoring-weight",
    target: "urgencyWeight",
    oldValue: 0.2,
    newValue: 0.15,
    reason: "Reduce urgency",
    autoApplied: true,
  };

  await applyAdjustment("t-new", adj);

  const cfg = getScoringConfig("t-new");
  assert.ok(cfg);
  assert.equal(cfg.urgencyWeight, 0.15);
  assert.equal(cfg.intentWeight, 0.3);
});

test("applied scoring adjustments are reflected in subsequent reads", async () => {
  setScoringConfig("t-3", {
    intentWeight: 0.3,
    fitWeight: 0.25,
    engagementWeight: 0.25,
    urgencyWeight: 0.2,
  });

  await applyAdjustment("t-3", {
    type: "scoring-weight",
    target: "intentWeight",
    oldValue: 0.3,
    newValue: 0.20,
    reason: "Step 1",
    autoApplied: true,
  });

  await applyAdjustment("t-3", {
    type: "scoring-weight",
    target: "fitWeight",
    oldValue: 0.25,
    newValue: 0.35,
    reason: "Step 2",
    autoApplied: true,
  });

  const cfg = getScoringConfig("t-3");
  assert.ok(cfg);
  assert.equal(cfg.intentWeight, 0.20);
  assert.equal(cfg.fitWeight, 0.35);
});

// ---------------------------------------------------------------------------
// Funnel adjustments
// ---------------------------------------------------------------------------

test("applyAdjustment updates niche config for funnel-promote", async () => {
  createNicheConfig(buildTestNicheConfig("feedback-test-niche"));

  const adj: Adjustment = {
    type: "funnel-promote",
    target: "direct-conversion",
    oldValue: "normal",
    newValue: "promoted",
    reason: "Top performer",
    autoApplied: true,
  };

  await applyAdjustment("t-4", adj);

  const nicheConfig = resolveNicheConfig("feedback-test-niche");
  assert.ok(nicheConfig);
  assert.equal(nicheConfig.funnels.preferredFamily, "direct-conversion");
});

test("applyAdjustment updates niche config for funnel-disable", async () => {
  const cfg = buildTestNicheConfig("feedback-disable-niche");
  cfg.funnels.preferredFamily = "low-performer";
  createNicheConfig(cfg);

  const adj: Adjustment = {
    type: "funnel-disable",
    target: "low-performer",
    oldValue: "active",
    newValue: "disabled",
    reason: "Underperforming",
    autoApplied: false,
  };

  await applyAdjustment("t-5", adj);

  const updated = resolveNicheConfig("feedback-disable-niche");
  assert.ok(updated);
  assert.equal(updated.funnels.preferredFamily, "default");
});

// ---------------------------------------------------------------------------
// Nurture timing adjustments
// ---------------------------------------------------------------------------

test("applyAdjustment updates nurture timing", async () => {
  createNicheConfig(buildTestNicheConfig("feedback-nurture-niche"));

  const adj: Adjustment = {
    type: "nurture-timing",
    target: "email-send-time",
    oldValue: 9,
    newValue: 5,
    reason: "Increase touch frequency",
    autoApplied: true,
  };

  await applyAdjustment("t-6", adj);

  const nicheConfig = resolveNicheConfig("feedback-nurture-niche");
  assert.ok(nicheConfig);
  assert.equal(nicheConfig.funnels.touchFrequency, 5);
});

// ---------------------------------------------------------------------------
// Psychology trigger adjustments (log-only)
// ---------------------------------------------------------------------------

test("applyAdjustment handles psychology-trigger type without crashing", async () => {
  const adj: Adjustment = {
    type: "psychology-trigger",
    target: "booking-step",
    oldValue: "none",
    newValue: "trust-guarantee + micro-commitment",
    reason: "High drop-off",
    autoApplied: true,
  };

  await applyAdjustment("t-7", adj);
  // No assertion needed beyond not throwing
  assert.ok(true);
});

// ---------------------------------------------------------------------------
// Unknown adjustment types
// ---------------------------------------------------------------------------

test("applyAdjustment handles unknown adjustment types without crashing", async () => {
  const adj: Adjustment = {
    type: "routing-rule" as Adjustment["type"],
    target: "some-rule",
    oldValue: "old",
    newValue: "new",
    reason: "Testing unknown type",
    autoApplied: false,
  };

  await applyAdjustment("t-8", adj);
  assert.ok(true);
});

test("applyAdjustment handles source-deprioritize type without crashing", async () => {
  const adj: Adjustment = {
    type: "source-deprioritize" as Adjustment["type"],
    target: "organic-social",
    oldValue: "normal",
    newValue: "deprioritized",
    reason: "Low quality",
    autoApplied: false,
  };

  await applyAdjustment("t-9", adj);
  assert.ok(true);
});

test("applyAdjustment handles threshold-change type without crashing", async () => {
  const adj: Adjustment = {
    type: "threshold-change" as Adjustment["type"],
    target: "hotThreshold",
    oldValue: 75,
    newValue: 80,
    reason: "Too many false positives",
    autoApplied: false,
  };

  await applyAdjustment("t-10", adj);
  assert.ok(true);
});

// ---------------------------------------------------------------------------
// Multiple adjustments in sequence
// ---------------------------------------------------------------------------

test("multiple scoring adjustments accumulate correctly", async () => {
  setScoringConfig("t-multi", {
    intentWeight: 0.30,
    fitWeight: 0.25,
    engagementWeight: 0.25,
    urgencyWeight: 0.20,
  });

  await applyAdjustment("t-multi", {
    type: "scoring-weight",
    target: "intentWeight",
    oldValue: 0.30,
    newValue: 0.28,
    reason: "Reduce intent",
    autoApplied: true,
  });

  await applyAdjustment("t-multi", {
    type: "scoring-weight",
    target: "fitWeight",
    oldValue: 0.25,
    newValue: 0.27,
    reason: "Increase fit",
    autoApplied: true,
  });

  const cfg = getScoringConfig("t-multi");
  assert.ok(cfg);
  assert.equal(cfg.intentWeight, 0.28);
  assert.equal(cfg.fitWeight, 0.27);
  assert.equal(cfg.engagementWeight, 0.25);
  assert.equal(cfg.urgencyWeight, 0.20);
});
