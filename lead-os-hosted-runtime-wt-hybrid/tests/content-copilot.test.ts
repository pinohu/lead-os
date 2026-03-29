import test from "node:test";
import assert from "node:assert/strict";
import {
  recordExperimentResult,
  getExperimentHistory,
  synthesizeLearnings,
  getContentSuggestions,
  getCopilotInsights,
  resetCopilotStore,
  type ContentExperimentResult,
} from "../src/lib/content-copilot.ts";
import { resetContentMemory } from "../src/lib/content-memory.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExperiment(
  overrides: Partial<Omit<ContentExperimentResult, "id">> = {},
): Omit<ContentExperimentResult, "id"> {
  return {
    tenantId: "tenant-test",
    contentType: "headline",
    variantA: "Are you leaving money on the table?",
    variantB: "Learn more about our product",
    winnerVariant: "A",
    liftPercent: 23,
    confidence: 0.95,
    sampleSize: 1000,
    testedAt: new Date().toISOString(),
    ...overrides,
  };
}

test.beforeEach(() => {
  resetCopilotStore();
  resetContentMemory();
});

// ---------------------------------------------------------------------------
// recordExperimentResult
// ---------------------------------------------------------------------------

test("recordExperimentResult returns result with generated id", async () => {
  const result = await recordExperimentResult(makeExperiment());
  assert.ok(typeof result.id === "string" && result.id.length > 0);
  assert.ok(result.id.startsWith("exp-"));
});

test("recordExperimentResult persists all fields", async () => {
  const input = makeExperiment({ liftPercent: 42, sampleSize: 5000 });
  const result = await recordExperimentResult(input);
  assert.equal(result.tenantId, "tenant-test");
  assert.equal(result.contentType, "headline");
  assert.equal(result.variantA, "Are you leaving money on the table?");
  assert.equal(result.winnerVariant, "A");
  assert.equal(result.liftPercent, 42);
  assert.equal(result.sampleSize, 5000);
});

test("recordExperimentResult stores inconclusive results", async () => {
  const result = await recordExperimentResult(makeExperiment({ winnerVariant: "inconclusive", liftPercent: 0 }));
  assert.equal(result.winnerVariant, "inconclusive");
});

// ---------------------------------------------------------------------------
// getExperimentHistory
// ---------------------------------------------------------------------------

test("getExperimentHistory returns all experiments for tenant", async () => {
  await recordExperimentResult(makeExperiment({ contentType: "headline" }));
  await recordExperimentResult(makeExperiment({ contentType: "cta" }));
  await recordExperimentResult(makeExperiment({ contentType: "email-subject" }));

  const history = await getExperimentHistory("tenant-test");
  assert.equal(history.length, 3);
});

test("getExperimentHistory returns empty array for unknown tenant", async () => {
  await recordExperimentResult(makeExperiment());
  const history = await getExperimentHistory("unknown-tenant");
  assert.equal(history.length, 0);
});

test("getExperimentHistory filters by content type", async () => {
  await recordExperimentResult(makeExperiment({ contentType: "headline" }));
  await recordExperimentResult(makeExperiment({ contentType: "headline" }));
  await recordExperimentResult(makeExperiment({ contentType: "cta" }));

  const headlines = await getExperimentHistory("tenant-test", "headline");
  assert.equal(headlines.length, 2);
  assert.ok(headlines.every((e) => e.contentType === "headline"));
});

test("getExperimentHistory content type filter excludes other types", async () => {
  await recordExperimentResult(makeExperiment({ contentType: "cta" }));
  const headlines = await getExperimentHistory("tenant-test", "headline");
  assert.equal(headlines.length, 0);
});

test("getExperimentHistory isolates experiments by tenant", async () => {
  await recordExperimentResult(makeExperiment({ tenantId: "tenant-a" }));
  await recordExperimentResult(makeExperiment({ tenantId: "tenant-b" }));

  const historyA = await getExperimentHistory("tenant-a");
  const historyB = await getExperimentHistory("tenant-b");
  assert.equal(historyA.length, 1);
  assert.equal(historyB.length, 1);
  assert.equal(historyA[0].tenantId, "tenant-a");
  assert.equal(historyB[0].tenantId, "tenant-b");
});

// ---------------------------------------------------------------------------
// synthesizeLearnings
// ---------------------------------------------------------------------------

test("synthesizeLearnings returns empty learnings when no experiments", async () => {
  const learning = await synthesizeLearnings("tenant-empty", "fitness");
  assert.equal(learning.tenantId, "tenant-empty");
  assert.equal(learning.niche, "fitness");
  assert.equal(learning.learnings.winningPatterns.length, 0);
  assert.equal(learning.learnings.losingPatterns.length, 0);
  assert.ok(typeof learning.updatedAt === "string");
});

test("synthesizeLearnings identifies winning patterns from experiment winners", async () => {
  // Variant A uses a question — it wins
  await recordExperimentResult(makeExperiment({
    variantA: "Are you tired of slow results?",
    variantB: "Improve your results today",
    winnerVariant: "A",
    liftPercent: 25,
  }));
  await recordExperimentResult(makeExperiment({
    variantA: "What if you could double your leads?",
    variantB: "Generate more leads",
    winnerVariant: "A",
    liftPercent: 18,
  }));

  const learning = await synthesizeLearnings("tenant-test", "marketing");
  assert.ok(
    learning.learnings.winningPatterns.some((p) => p.toLowerCase().includes("question")),
    `Expected question pattern in: ${JSON.stringify(learning.learnings.winningPatterns)}`,
  );
});

test("synthesizeLearnings identifies losing patterns from experiment losers", async () => {
  // Variant B is a generic CTA and it loses
  await recordExperimentResult(makeExperiment({
    variantA: "Unlock your growth potential now",
    variantB: "click here",
    winnerVariant: "A",
    liftPercent: 15,
  }));

  const learning = await synthesizeLearnings("tenant-test", "saas");
  assert.ok(
    learning.learnings.losingPatterns.some((p) => p.toLowerCase().includes("generic")),
    `Expected generic CTA pattern in: ${JSON.stringify(learning.learnings.losingPatterns)}`,
  );
});

test("synthesizeLearnings computes average lift for winning patterns", async () => {
  await recordExperimentResult(makeExperiment({
    variantA: "Are you ready to grow?",
    variantB: "Grow your business",
    winnerVariant: "A",
    liftPercent: 20,
  }));
  await recordExperimentResult(makeExperiment({
    variantA: "Do you want faster results?",
    variantB: "Faster results available",
    winnerVariant: "A",
    liftPercent: 30,
  }));

  const learning = await synthesizeLearnings("tenant-test", "coaching");
  const questionPattern = learning.learnings.winningPatterns.find((p) => p.toLowerCase().includes("question"));
  assert.ok(questionPattern, "Question pattern should exist");
  // Average of 20 and 30 is 25
  assert.ok(questionPattern.includes("25"), `Expected 25% average lift, got: ${questionPattern}`);
});

test("synthesizeLearnings skips inconclusive experiments", async () => {
  await recordExperimentResult(makeExperiment({
    variantA: "Are you ready?",
    variantB: "Get ready",
    winnerVariant: "inconclusive",
    liftPercent: 0,
  }));

  const learning = await synthesizeLearnings("tenant-test", "ecommerce");
  // No winners to contribute to patterns
  assert.equal(learning.learnings.winningPatterns.length, 0);
});

test("synthesizeLearnings sets updatedAt timestamp", async () => {
  const before = Date.now();
  const learning = await synthesizeLearnings("tenant-test", "fintech");
  const after = Date.now();
  const ts = new Date(learning.updatedAt).getTime();
  assert.ok(ts >= before && ts <= after);
});

// ---------------------------------------------------------------------------
// getContentSuggestions (rule-based, no AI configured in test env)
// ---------------------------------------------------------------------------

test("getContentSuggestions returns suggestions without AI configured", async () => {
  await recordExperimentResult(makeExperiment({
    variantA: "Are you leaving money on the table?",
    variantB: "Learn more",
    winnerVariant: "A",
    liftPercent: 23,
  }));
  await synthesizeLearnings("tenant-test", "marketing");

  const response = await getContentSuggestions("tenant-test", "headline");
  assert.ok(Array.isArray(response.suggestions));
  assert.ok(response.suggestions.length > 0);
  assert.equal(response.aiGenerated, false);
});

test("getContentSuggestions suggestions include expectedLift", async () => {
  await recordExperimentResult(makeExperiment({
    variantA: "Are you ready to double your revenue?",
    variantB: "Double your revenue today",
    winnerVariant: "A",
    liftPercent: 20,
  }));
  await synthesizeLearnings("tenant-test", "marketing");

  const response = await getContentSuggestions("tenant-test", "headline");
  assert.ok(
    response.suggestions.every((s) => typeof s.expectedLift === "number"),
    "Every suggestion must have expectedLift",
  );
});

test("getContentSuggestions suggestions include basedOn field", async () => {
  await recordExperimentResult(makeExperiment({
    variantA: "Are you ready?",
    variantB: "Get started",
    winnerVariant: "A",
    liftPercent: 15,
  }));
  await synthesizeLearnings("tenant-test", "marketing");

  const response = await getContentSuggestions("tenant-test", "headline");
  assert.ok(
    response.suggestions.every((s) => typeof s.basedOn === "string" && s.basedOn.length > 0),
    "Every suggestion must have basedOn",
  );
});

test("getContentSuggestions returns fallback suggestion when no learnings", async () => {
  const response = await getContentSuggestions("unknown-tenant", "headline");
  assert.ok(Array.isArray(response.suggestions));
  assert.ok(response.suggestions.length > 0);
  assert.equal(response.aiGenerated, false);
  assert.equal(response.tokenUsage.input, 0);
  assert.equal(response.tokenUsage.output, 0);
});

test("getContentSuggestions confidence reflects lift magnitude", async () => {
  await recordExperimentResult(makeExperiment({
    variantA: "Get 5X results faster with 10 proven techniques",
    variantB: "See results faster",
    winnerVariant: "A",
    liftPercent: 25,
  }));
  await synthesizeLearnings("tenant-test", "saas");

  const response = await getContentSuggestions("tenant-test", "headline");
  const highConfidence = response.suggestions.filter((s) => s.confidence === "high");
  // High lift (>=20) should produce at least one high confidence suggestion
  assert.ok(highConfidence.length > 0, "Should have at least one high confidence suggestion for 25% lift");
});

// ---------------------------------------------------------------------------
// getCopilotInsights
// ---------------------------------------------------------------------------

test("getCopilotInsights returns zero counts for empty tenant", async () => {
  const insights = await getCopilotInsights("empty-tenant");
  assert.equal(insights.tenantId, "empty-tenant");
  assert.equal(insights.experimentCount, 0);
  assert.equal(insights.hasLearnings, false);
  assert.ok(insights.summary.length > 0);
});

test("getCopilotInsights reflects recorded experiments", async () => {
  await recordExperimentResult(makeExperiment({ contentType: "headline" }));
  await recordExperimentResult(makeExperiment({ contentType: "cta" }));

  const insights = await getCopilotInsights("tenant-test");
  assert.equal(insights.experimentCount, 2);
});

test("getCopilotInsights identifies top content type", async () => {
  await recordExperimentResult(makeExperiment({ contentType: "headline" }));
  await recordExperimentResult(makeExperiment({ contentType: "headline" }));
  await recordExperimentResult(makeExperiment({ contentType: "cta" }));

  const insights = await getCopilotInsights("tenant-test");
  assert.equal(insights.topContentType, "headline");
});

// ---------------------------------------------------------------------------
// resetCopilotStore
// ---------------------------------------------------------------------------

test("resetCopilotStore clears all experiment data", async () => {
  await recordExperimentResult(makeExperiment());
  await recordExperimentResult(makeExperiment());

  resetCopilotStore();

  const history = await getExperimentHistory("tenant-test");
  assert.equal(history.length, 0);
});

test("resetCopilotStore clears synthesized learnings", async () => {
  await recordExperimentResult(makeExperiment());
  await synthesizeLearnings("tenant-test", "marketing");

  resetCopilotStore();

  const insights = await getCopilotInsights("tenant-test");
  assert.equal(insights.hasLearnings, false);
});
