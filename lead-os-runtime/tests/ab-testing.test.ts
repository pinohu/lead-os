import test from "node:test";
import assert from "node:assert/strict";
import {
  createExperiment,
  getExperiment,
  listExperiments,
  startExperiment,
  stopExperiment,
  getVariation,
  trackConversion,
  analyzeExperiment,
  createFunnelExperiment,
  createOfferExperiment,
  resetABTestingStore,
  type Experiment,
} from "../src/lib/integrations/ab-testing.ts";

function makeExperimentInput(overrides: Partial<Omit<Experiment, "id" | "status">> = {}) {
  return {
    name: "Button Color Test",
    hypothesis: "A green CTA button will convert better than the control blue button.",
    variations: [
      { id: "control", name: "Control (Blue)", weight: 0.5 },
      { id: "variant-a", name: "Variant A (Green)", weight: 0.5 },
    ],
    metrics: ["conversion", "revenue"],
    ...overrides,
  };
}

test.beforeEach(() => {
  resetABTestingStore();
});

// ---------------------------------------------------------------------------
// createExperiment
// ---------------------------------------------------------------------------

test("createExperiment returns an Experiment with all required fields", async () => {
  const experiment = await createExperiment(makeExperimentInput());
  assert.ok(typeof experiment.id === "string" && experiment.id.length > 0);
  assert.equal(experiment.name, "Button Color Test");
  assert.ok(typeof experiment.hypothesis === "string");
  assert.ok(Array.isArray(experiment.variations));
  assert.ok(Array.isArray(experiment.metrics));
  assert.equal(experiment.status, "draft");
});

test("createExperiment sets initial status to draft", async () => {
  const experiment = await createExperiment(makeExperimentInput());
  assert.equal(experiment.status, "draft");
});

test("createExperiment persists name and hypothesis", async () => {
  const input = makeExperimentInput({ name: "Headline Copy Test", hypothesis: "Short headlines convert better." });
  const experiment = await createExperiment(input);
  assert.equal(experiment.name, "Headline Copy Test");
  assert.equal(experiment.hypothesis, "Short headlines convert better.");
});

test("createExperiment stores variations with correct weights", async () => {
  const experiment = await createExperiment(makeExperimentInput());
  const control = experiment.variations.find((v) => v.id === "control");
  const variantA = experiment.variations.find((v) => v.id === "variant-a");
  assert.ok(control !== undefined);
  assert.equal(control!.weight, 0.5);
  assert.ok(variantA !== undefined);
  assert.equal(variantA!.weight, 0.5);
});

// ---------------------------------------------------------------------------
// getExperiment
// ---------------------------------------------------------------------------

test("getExperiment retrieves an experiment that was created", async () => {
  const created = await createExperiment(makeExperimentInput());
  const retrieved = await getExperiment(created.id);
  assert.ok(retrieved !== undefined);
  assert.equal(retrieved!.id, created.id);
  assert.equal(retrieved!.name, created.name);
});

test("getExperiment returns undefined for unknown ID", async () => {
  const result = await getExperiment("does-not-exist");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// listExperiments
// ---------------------------------------------------------------------------

test("listExperiments returns all experiments when no status filter is given", async () => {
  await createExperiment(makeExperimentInput({ name: "Test A" }));
  await createExperiment(makeExperimentInput({ name: "Test B" }));
  const list = await listExperiments();
  assert.ok(list.length >= 2);
});

test("listExperiments filters by status", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const running = await listExperiments("running");
  const draft = await listExperiments("draft");
  assert.ok(running.some((e) => e.id === exp.id));
  assert.ok(!draft.some((e) => e.id === exp.id));
});

// ---------------------------------------------------------------------------
// startExperiment / stopExperiment
// ---------------------------------------------------------------------------

test("startExperiment changes status to running", async () => {
  const exp = await createExperiment(makeExperimentInput());
  const started = await startExperiment(exp.id);
  assert.equal(started.status, "running");
});

test("stopExperiment changes status to stopped", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const stopped = await stopExperiment(exp.id);
  assert.equal(stopped.status, "stopped");
});

test("startExperiment throws for unknown experiment ID", async () => {
  await assert.rejects(() => startExperiment("nonexistent-id"), /not found/i);
});

test("stopExperiment throws for unknown experiment ID", async () => {
  await assert.rejects(() => stopExperiment("nonexistent-id"), /not found/i);
});

// ---------------------------------------------------------------------------
// getVariation
// ---------------------------------------------------------------------------

test("getVariation returns a variation ID for a running experiment", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const variationId = await getVariation(exp.id, "user-1");
  assert.ok(typeof variationId === "string" && variationId.length > 0);
  const validIds = exp.variations.map((v) => v.id);
  assert.ok(validIds.includes(variationId), `${variationId} must be one of ${validIds.join(", ")}`);
});

test("getVariation returns the same variation for the same user (sticky assignment)", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const first = await getVariation(exp.id, "sticky-user");
  const second = await getVariation(exp.id, "sticky-user");
  assert.equal(first, second);
});

test("getVariation returns the control variation for a non-running experiment", async () => {
  const exp = await createExperiment(makeExperimentInput());
  // Experiment is in draft, not started
  const variationId = await getVariation(exp.id, "user-draft");
  assert.equal(variationId, exp.variations[0].id);
});

// ---------------------------------------------------------------------------
// trackConversion
// ---------------------------------------------------------------------------

test("trackConversion does not throw when called with valid parameters", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  await getVariation(exp.id, "user-conv");
  await assert.doesNotReject(() => trackConversion(exp.id, "user-conv", "conversion", 1));
});

test("trackConversion accepts optional value parameter", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  await getVariation(exp.id, "user-rev");
  await assert.doesNotReject(() => trackConversion(exp.id, "user-rev", "revenue", 99.99));
});

// ---------------------------------------------------------------------------
// analyzeExperiment
// ---------------------------------------------------------------------------

test("analyzeExperiment returns an ExperimentResult with required fields", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const result = await analyzeExperiment(exp.id);
  assert.equal(result.experimentId, exp.id);
  assert.ok(Array.isArray(result.variations));
  assert.ok(typeof result.significanceLevel === "number");
  assert.ok(["keep-running", "declare-winner", "stop-losing"].includes(result.recommendedAction));
});

test("analyzeExperiment throws for unknown experiment ID", async () => {
  await assert.rejects(() => analyzeExperiment("nonexistent-id"), /not found/i);
});

test("analyzeExperiment variation results include all required metrics", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const result = await analyzeExperiment(exp.id);
  for (const variation of result.variations) {
    assert.ok(typeof variation.id === "string");
    assert.ok(typeof variation.name === "string");
    assert.ok(typeof variation.visitors === "number");
    assert.ok(typeof variation.conversions === "number");
    assert.ok(typeof variation.conversionRate === "number");
    assert.ok(typeof variation.revenue === "number");
    assert.ok(typeof variation.revenuePerVisitor === "number");
    assert.ok(typeof variation.chanceToBeatControl === "number");
  }
});

test("analyzeExperiment recommends keep-running when there is no data", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);
  const result = await analyzeExperiment(exp.id);
  assert.equal(result.recommendedAction, "keep-running");
});

test("analyzeExperiment chanceToBeatControl is between 0 and 1 for all variations", async () => {
  const exp = await createExperiment(makeExperimentInput());
  await startExperiment(exp.id);

  // Simulate some traffic
  for (let i = 0; i < 10; i++) {
    const userId = `user-${i}`;
    await getVariation(exp.id, userId);
    if (i % 3 === 0) {
      await trackConversion(exp.id, userId, "conversion", 1);
    }
  }

  const result = await analyzeExperiment(exp.id);
  for (const variation of result.variations) {
    assert.ok(
      variation.chanceToBeatControl >= 0 && variation.chanceToBeatControl <= 1,
      `chanceToBeatControl ${variation.chanceToBeatControl} must be in [0, 1]`,
    );
  }
});

// ---------------------------------------------------------------------------
// createFunnelExperiment
// ---------------------------------------------------------------------------

test("createFunnelExperiment creates an experiment with correct name pattern", async () => {
  const exp = await createFunnelExperiment("tenant-x", "Lead Capture", [
    { name: "Original", config: { layout: "A" } },
    { name: "Variant", config: { layout: "B" } },
  ]);
  assert.ok(exp.name.includes("tenant-x"));
  assert.ok(exp.name.includes("Lead Capture"));
});

test("createFunnelExperiment creates one variation per input", async () => {
  const variations = [
    { name: "V1", config: {} },
    { name: "V2", config: {} },
    { name: "V3", config: {} },
  ];
  const exp = await createFunnelExperiment("tenant-y", "Checkout", variations);
  assert.equal(exp.variations.length, variations.length);
});

// ---------------------------------------------------------------------------
// createOfferExperiment
// ---------------------------------------------------------------------------

test("createOfferExperiment creates an experiment with offer test name", async () => {
  const exp = await createOfferExperiment("tenant-offer", [
    { name: "Free Trial", offer: { type: "trial", days: 14 } },
    { name: "Discount", offer: { type: "discount", percent: 20 } },
  ]);
  assert.ok(exp.name.includes("tenant-offer"));
  assert.ok(exp.name.toLowerCase().includes("offer"));
});

test("createOfferExperiment includes offer acceptance metric", async () => {
  const exp = await createOfferExperiment("tenant-metrics", [
    { name: "Offer A", offer: {} },
    { name: "Offer B", offer: {} },
  ]);
  assert.ok(exp.metrics.includes("offer_acceptance"));
});

// ---------------------------------------------------------------------------
// resetABTestingStore
// ---------------------------------------------------------------------------

test("resetABTestingStore clears all experiments from the store", async () => {
  await createExperiment(makeExperimentInput());
  resetABTestingStore();
  const list = await listExperiments();
  assert.equal(list.length, 0);
});
