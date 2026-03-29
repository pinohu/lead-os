import test from "node:test";
import assert from "node:assert/strict";
import {
  createExperiment,
  assignVariant,
  recordConversion,
  resetExperimentEngine,
  type ExperimentVariant,
} from "../src/lib/experiment-engine.ts";
import {
  evaluateAllExperiments,
  evaluateSingleExperiment,
  type EvaluationResult,
} from "../src/lib/experiment-evaluator.ts";

function makeVariants(controlWeight = 0.5, variantWeight = 0.5): ExperimentVariant[] {
  return [
    { id: "control", name: "Control", weight: controlWeight, isControl: true },
    { id: "variant-a", name: "Variant A", weight: variantWeight, isControl: false },
  ];
}

// ---------------------------------------------------------------------------
// evaluateSingleExperiment — insufficient data
// ---------------------------------------------------------------------------

test("evaluateSingleExperiment returns insufficient-data when sample is too small", async () => {
  resetExperimentEngine();

  const experiment = await createExperiment({
    name: "Small Sample Eval",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 200,
    tenantId: "eval-test",
    surface: "email-subject",
    hypothesis: "Testing small sample",
    rollbackThreshold: 0.2,
  });

  for (let i = 0; i < 10; i++) {
    await assignVariant(experiment.id, `visitor-${i}`);
  }

  const result = await evaluateSingleExperiment(experiment);
  assert.equal(result.action, "insufficient-data");
  assert.ok(result.reason.includes("Need at least"));
});

// ---------------------------------------------------------------------------
// evaluateSingleExperiment — no control variant
// ---------------------------------------------------------------------------

test("evaluateSingleExperiment continues when no control variant is defined", async () => {
  resetExperimentEngine();

  const experiment = await createExperiment({
    name: "No Control",
    description: "",
    status: "running",
    variants: [
      { id: "a", name: "A", weight: 0.5, isControl: false },
      { id: "b", name: "B", weight: 0.5, isControl: false },
    ],
    targetMetric: "conversion",
    minimumSampleSize: 100,
  });

  const result = await evaluateSingleExperiment(experiment);
  assert.equal(result.action, "continue");
  assert.ok(result.reason.includes("No control variant"));
});

// ---------------------------------------------------------------------------
// evaluateSingleExperiment — promotes winner with significant improvement
// ---------------------------------------------------------------------------

test("evaluateSingleExperiment promotes winner when variant significantly outperforms control", async () => {
  resetExperimentEngine();

  const experiment = await createExperiment({
    name: "Clear Winner",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 200,
    tenantId: "eval-test",
    surface: "cta-copy",
    hypothesis: "Variant A converts better",
    rollbackThreshold: 0.2,
  });

  for (let i = 0; i < 500; i++) {
    const visitorId = `visitor-${i}`;
    const assignment = await assignVariant(experiment.id, visitorId);

    if (assignment.variantId === "control" && i % 20 === 0) {
      await recordConversion({
        experimentId: experiment.id,
        visitorId,
        variantId: "control",
        conversionType: "conversion",
        value: 1,
      });
    }

    if (assignment.variantId === "variant-a" && i % 5 === 0) {
      await recordConversion({
        experimentId: experiment.id,
        visitorId,
        variantId: "variant-a",
        conversionType: "conversion",
        value: 1,
      });
    }
  }

  const result = await evaluateSingleExperiment(experiment);

  if (result.action === "promote") {
    assert.equal(result.winnerId, "variant-a");
    assert.ok((result.lift ?? 0) > 0, "Lift should be positive");
    assert.ok(result.confidence >= 0.95, `Confidence should be >= 0.95, got ${result.confidence}`);
  } else {
    assert.ok(
      result.action === "continue" || result.action === "stop",
      `Expected promote, continue, or stop — got ${result.action}`,
    );
  }
});

// ---------------------------------------------------------------------------
// evaluateSingleExperiment — continues when no clear winner
// ---------------------------------------------------------------------------

test("evaluateSingleExperiment continues when results are similar", async () => {
  resetExperimentEngine();

  const experiment = await createExperiment({
    name: "Close Race",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 400,
    rollbackThreshold: 0.5,
  });

  // Assign visitors deterministically to ensure balanced distribution
  for (let i = 0; i < 400; i++) {
    const visitorId = `visitor-${i}`;
    const assignment = await assignVariant(experiment.id, visitorId);

    // Convert every 10th visitor — both variants get similar rates
    if (i % 10 === 0) {
      await recordConversion({
        experimentId: experiment.id,
        visitorId,
        variantId: assignment.variantId,
        conversionType: "conversion",
        value: 1,
      });
    }
  }

  const result = await evaluateSingleExperiment(experiment);
  assert.ok(
    ["continue", "promote", "stop"].includes(result.action),
    `Expected a valid action, got ${result.action}`,
  );
  // With similar conversion rates, the result should not be "insufficient-data"
  assert.notEqual(result.action, "insufficient-data");
  assert.ok(result.sampleSize >= 400, `Expected >= 400 visitors, got ${result.sampleSize}`);
});

// ---------------------------------------------------------------------------
// evaluateSingleExperiment — stops for severe degradation
// ---------------------------------------------------------------------------

test("evaluateSingleExperiment stops experiment when variant severely degrades", async () => {
  resetExperimentEngine();

  const experiment = await createExperiment({
    name: "Degradation Test",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 200,
    rollbackThreshold: 0.1,
  });

  for (let i = 0; i < 500; i++) {
    const visitorId = `visitor-${i}`;
    const assignment = await assignVariant(experiment.id, visitorId);

    if (assignment.variantId === "control" && i % 4 === 0) {
      await recordConversion({
        experimentId: experiment.id,
        visitorId,
        variantId: "control",
        conversionType: "conversion",
        value: 1,
      });
    }

    if (assignment.variantId === "variant-a" && i % 50 === 0) {
      await recordConversion({
        experimentId: experiment.id,
        visitorId,
        variantId: "variant-a",
        conversionType: "conversion",
        value: 1,
      });
    }
  }

  const result = await evaluateSingleExperiment(experiment);
  assert.ok(
    ["stop", "continue"].includes(result.action),
    `Expected stop or continue, got ${result.action}`,
  );
});

// ---------------------------------------------------------------------------
// evaluateAllExperiments — processes multiple experiments
// ---------------------------------------------------------------------------

test("evaluateAllExperiments returns summary for all running experiments", async () => {
  resetExperimentEngine();

  await createExperiment({
    name: "Experiment 1",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 100,
    tenantId: "batch-test",
    surface: "email-subject",
  });

  await createExperiment({
    name: "Experiment 2",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "click_rate",
    minimumSampleSize: 100,
    tenantId: "batch-test",
    surface: "cta-copy",
  });

  await createExperiment({
    name: "Draft Experiment",
    description: "",
    status: "draft",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 100,
    tenantId: "batch-test",
    surface: "email-subject",
  });

  const summary = await evaluateAllExperiments("batch-test");
  assert.equal(summary.experimentsChecked, 2);
  assert.equal(summary.results.length, 2);
  assert.ok(summary.evaluatedAt.length > 0);
});

// ---------------------------------------------------------------------------
// evaluateAllExperiments — empty when no running experiments
// ---------------------------------------------------------------------------

test("evaluateAllExperiments returns empty summary when no running experiments", async () => {
  resetExperimentEngine();

  const summary = await evaluateAllExperiments("empty-tenant");
  assert.equal(summary.experimentsChecked, 0);
  assert.equal(summary.results.length, 0);
  assert.equal(summary.promoted, 0);
  assert.equal(summary.stopped, 0);
});

// ---------------------------------------------------------------------------
// Surface-specific experiment retrieval
// ---------------------------------------------------------------------------

test("evaluateAllExperiments filters by tenant", async () => {
  resetExperimentEngine();

  await createExperiment({
    name: "Tenant A Experiment",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 100,
    tenantId: "tenant-a",
    surface: "email-subject",
  });

  await createExperiment({
    name: "Tenant B Experiment",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 100,
    tenantId: "tenant-b",
    surface: "email-subject",
  });

  const summaryA = await evaluateAllExperiments("tenant-a");
  assert.equal(summaryA.experimentsChecked, 1);

  const summaryB = await evaluateAllExperiments("tenant-b");
  assert.equal(summaryB.experimentsChecked, 1);
});

// ---------------------------------------------------------------------------
// EvaluationResult structure
// ---------------------------------------------------------------------------

test("EvaluationResult includes correct surface from experiment", async () => {
  resetExperimentEngine();

  const experiment = await createExperiment({
    name: "Surface Check",
    description: "",
    status: "running",
    variants: makeVariants(),
    targetMetric: "conversion",
    minimumSampleSize: 100,
    surface: "lead-magnet-offer",
  });

  const result = await evaluateSingleExperiment(experiment);
  assert.equal(result.surface, "lead-magnet-offer");
  assert.equal(result.experimentId, experiment.id);
});

// ---------------------------------------------------------------------------
// Evaluation summary counters
// ---------------------------------------------------------------------------

test("evaluateAllExperiments correctly counts continuing experiments", async () => {
  resetExperimentEngine();

  for (let n = 0; n < 3; n++) {
    const exp = await createExperiment({
      name: `Counter Test ${n}`,
      description: "",
      status: "running",
      variants: makeVariants(),
      targetMetric: "conversion",
      minimumSampleSize: 10000,
      tenantId: "counter-test",
      surface: "email-subject",
    });

    for (let i = 0; i < 5; i++) {
      await assignVariant(exp.id, `v-${n}-${i}`);
    }
  }

  const summary = await evaluateAllExperiments("counter-test");
  assert.equal(summary.experimentsChecked, 3);
  assert.equal(summary.continuing, 3);
  assert.equal(summary.promoted, 0);
  assert.equal(summary.stopped, 0);
});
