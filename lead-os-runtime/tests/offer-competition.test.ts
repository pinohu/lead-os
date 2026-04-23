import test from "node:test";
import assert from "node:assert/strict";
import {
  generateOfferVariants,
  deployOfferTest,
  trackOfferRevenue,
  trackRefund,
  trackComplaint,
  recordVisitor,
  analyzeOfferPerformance,
  promoteWinningOffer,
  getOfferEvolutionHistory,
  runOfferEvolutionCycle,
  _resetStores,
} from "../src/lib/offer-competition.ts";
import { experimentStore } from "../src/lib/experiment-store.ts";

const BASE_OFFER = {
  headline: "Get Your Free Estimate Today",
  price: 5000,
  guarantee: "30-day money-back guarantee",
  urgencyType: "deadline" as const,
  bonuses: ["Free consultation call"],
};

test.beforeEach(() => {
  _resetStores();
  experimentStore.clear();
});

// ---------------------------------------------------------------------------
// Variant Generation
// ---------------------------------------------------------------------------

test("generateOfferVariants returns the requested number of variants", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 4);
  assert.equal(variants.length, 4);
});

test("generateOfferVariants clamps count between 3 and 5", () => {
  const low = generateOfferVariants("construction", BASE_OFFER, 1);
  const high = generateOfferVariants("construction", BASE_OFFER, 10);
  assert.equal(low.length, 3);
  assert.equal(high.length, 5);
});

test("generateOfferVariants first variant is the control", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 4);
  assert.equal(variants[0].tweakedVariable, "control");
  assert.equal(variants[0].headline, BASE_OFFER.headline);
  assert.equal(variants[0].price, BASE_OFFER.price);
});

test("generateOfferVariants each non-control variant tweaks one variable", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 5);
  const tweaked = variants.slice(1).map((v) => v.tweakedVariable);
  for (const t of tweaked) {
    assert.ok(
      ["price", "guarantee", "urgency", "bonuses", "headline"].includes(t),
      `Unexpected tweaked variable: ${t}`,
    );
  }
});

test("generateOfferVariants assigns unique IDs", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 5);
  const ids = new Set(variants.map((v) => v.id));
  assert.equal(ids.size, 5);
});

test("generateOfferVariants tweaks different variables across variants", () => {
  const variants = generateOfferVariants("legal", BASE_OFFER, 5);
  const tweakedVars = new Set(variants.slice(1).map((v) => v.tweakedVariable));
  assert.ok(tweakedVars.size >= 3, "Should tweak at least 3 different variables");
  assert.ok(tweakedVars.has("price"));
  assert.ok(tweakedVars.has("guarantee"));
});

// ---------------------------------------------------------------------------
// Test Deployment
// ---------------------------------------------------------------------------

test("deployOfferTest creates a test and corresponding experiment", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 4);
  const offerTest = deployOfferTest("tenant-1", variants);

  assert.ok(offerTest.id.startsWith("ot_"));
  assert.equal(offerTest.tenantId, "tenant-1");
  assert.equal(offerTest.niche, "construction");
  assert.equal(offerTest.status, "running");
  assert.equal(offerTest.variantIds.length, 4);
  assert.ok(experimentStore.has(offerTest.experimentId));
});

test("deployOfferTest increments generation for same tenant+niche", () => {
  const v1 = generateOfferVariants("construction", BASE_OFFER, 3);
  const t1 = deployOfferTest("tenant-1", v1);
  assert.equal(t1.generation, 1);

  const v2 = generateOfferVariants("construction", BASE_OFFER, 3);
  const t2 = deployOfferTest("tenant-1", v2);
  assert.equal(t2.generation, 2);
});

// ---------------------------------------------------------------------------
// Revenue Tracking
// ---------------------------------------------------------------------------

test("trackOfferRevenue records revenue for a variant", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  const offerTest = deployOfferTest("tenant-1", variants);

  for (let i = 0; i < 40; i++) {
    recordVisitor(variants[0].id);
    if (i < 10) trackOfferRevenue(variants[0].id, 100);
  }

  const analysis = analyzeOfferPerformance(offerTest.id);
  const perf = analysis.performances.find((p) => p.variantId === variants[0].id);
  assert.ok(perf);
  assert.equal(perf.totalRevenue, 1000);
  assert.equal(perf.visitors, 50); // 40 manual + 10 from trackOfferRevenue
  assert.equal(perf.conversions, 10);
});

test("trackRefund and trackComplaint affect satisfaction proxy", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  const offerTest = deployOfferTest("tenant-1", variants);

  for (let i = 0; i < 10; i++) {
    trackOfferRevenue(variants[0].id, 100);
  }
  trackRefund(variants[0].id);
  trackRefund(variants[0].id);
  trackComplaint(variants[0].id);

  const analysis = analyzeOfferPerformance(offerTest.id);
  const perf = analysis.performances.find((p) => p.variantId === variants[0].id);
  assert.ok(perf);
  assert.equal(perf.refundCount, 2);
  assert.equal(perf.complaintCount, 1);
  assert.ok(perf.satisfactionProxy < 1);
  assert.ok(perf.satisfactionProxy > 0);
});

// ---------------------------------------------------------------------------
// Performance Analysis
// ---------------------------------------------------------------------------

test("analyzeOfferPerformance returns empty analysis for unknown test", () => {
  const analysis = analyzeOfferPerformance("nonexistent");
  assert.equal(analysis.performances.length, 0);
  assert.equal(analysis.winner, null);
  assert.equal(analysis.confidence, 0);
});

test("analyzeOfferPerformance calculates RPV correctly", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  const offerTest = deployOfferTest("tenant-1", variants);

  for (let i = 0; i < 50; i++) {
    recordVisitor(variants[0].id);
    recordVisitor(variants[1].id);
  }
  for (let i = 0; i < 20; i++) {
    trackOfferRevenue(variants[0].id, 100);
  }
  for (let i = 0; i < 5; i++) {
    trackOfferRevenue(variants[1].id, 50);
  }

  const analysis = analyzeOfferPerformance(offerTest.id);
  const perf0 = analysis.performances.find((p) => p.variantId === variants[0].id);
  const perf1 = analysis.performances.find((p) => p.variantId === variants[1].id);

  assert.ok(perf0);
  assert.ok(perf1);
  assert.ok(perf0.revenuePerVisitor > perf1.revenuePerVisitor);
});

test("analyzeOfferPerformance declares winner when significant", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  const offerTest = deployOfferTest("tenant-1", variants);

  for (let i = 0; i < 50; i++) {
    recordVisitor(variants[0].id);
    recordVisitor(variants[1].id);
    recordVisitor(variants[2].id);
  }

  for (let i = 0; i < 40; i++) {
    trackOfferRevenue(variants[0].id, 200);
  }
  for (let i = 0; i < 5; i++) {
    trackOfferRevenue(variants[1].id, 10);
  }
  for (let i = 0; i < 3; i++) {
    trackOfferRevenue(variants[2].id, 5);
  }

  const analysis = analyzeOfferPerformance(offerTest.id);
  assert.ok(analysis.isSignificant);
  assert.equal(analysis.winner, variants[0].id);
});

// ---------------------------------------------------------------------------
// Winner Promotion
// ---------------------------------------------------------------------------

test("promoteWinningOffer returns null when no winner", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  const offerTest = deployOfferTest("tenant-1", variants);

  const result = promoteWinningOffer(offerTest.id);
  assert.equal(result.promoted, null);
  assert.equal(result.nextVariants.length, 0);
});

test("promoteWinningOffer promotes and generates next-gen variants", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  const offerTest = deployOfferTest("tenant-1", variants);

  for (let i = 0; i < 50; i++) {
    recordVisitor(variants[0].id);
    recordVisitor(variants[1].id);
    recordVisitor(variants[2].id);
  }
  for (let i = 0; i < 40; i++) {
    trackOfferRevenue(variants[0].id, 200);
  }
  for (let i = 0; i < 2; i++) {
    trackOfferRevenue(variants[1].id, 10);
  }

  const result = promoteWinningOffer(offerTest.id);
  assert.ok(result.promoted);
  assert.equal(result.promoted.id, variants[0].id);
  assert.ok(result.nextVariants.length >= 3);
  assert.ok(result.archivedCount > 0);
  for (const nv of result.nextVariants) {
    assert.equal(nv.generation, 2);
  }
});

// ---------------------------------------------------------------------------
// Evolution History
// ---------------------------------------------------------------------------

test("getOfferEvolutionHistory returns ordered generations", () => {
  const v1 = generateOfferVariants("construction", BASE_OFFER, 3);
  deployOfferTest("tenant-1", v1);

  const v2 = generateOfferVariants("construction", BASE_OFFER, 3);
  deployOfferTest("tenant-1", v2);

  const history = getOfferEvolutionHistory("tenant-1", "construction");
  assert.equal(history.length, 2);
  assert.equal(history[0].generation, 1);
  assert.equal(history[1].generation, 2);
});

test("getOfferEvolutionHistory returns empty for unknown tenant", () => {
  const history = getOfferEvolutionHistory("unknown", "construction");
  assert.equal(history.length, 0);
});

// ---------------------------------------------------------------------------
// Evolution Cycle
// ---------------------------------------------------------------------------

test("runOfferEvolutionCycle returns null when no active test", () => {
  const result = runOfferEvolutionCycle("tenant-1", "construction");
  assert.equal(result.analyzed, null);
  assert.equal(result.promoted, null);
  assert.equal(result.nextTest, null);
});

test("runOfferEvolutionCycle does not promote when not significant", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  deployOfferTest("tenant-1", variants);

  const result = runOfferEvolutionCycle("tenant-1", "construction");
  assert.ok(result.analyzed);
  assert.equal(result.promoted, null);
  assert.equal(result.nextTest, null);
});

test("runOfferEvolutionCycle promotes winner and creates next test", () => {
  const variants = generateOfferVariants("construction", BASE_OFFER, 3);
  deployOfferTest("tenant-1", variants);

  for (let i = 0; i < 50; i++) {
    recordVisitor(variants[0].id);
    recordVisitor(variants[1].id);
    recordVisitor(variants[2].id);
  }
  for (let i = 0; i < 40; i++) {
    trackOfferRevenue(variants[0].id, 200);
  }
  for (let i = 0; i < 2; i++) {
    trackOfferRevenue(variants[1].id, 10);
  }

  const result = runOfferEvolutionCycle("tenant-1", "construction");
  assert.ok(result.analyzed);
  assert.ok(result.analyzed.isSignificant);
  assert.ok(result.promoted);
  assert.ok(result.nextTest);
  assert.equal(result.nextTest.status, "running");
});
