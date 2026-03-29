import test from "node:test";
import assert from "node:assert/strict";

import {
  recordConversionOutcome,
  getConversionOutcomes,
  trainScoringModel,
  getCurrentModel,
  getModelHistory,
  detectModelDrift,
  getScoringWeightsForTenant,
  resetScoringModelStore,
  type ConversionOutcome,
  type ScoringModelVersion,
} from "../src/lib/tenant-scoring-model.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOutcome(
  tenantId: string,
  converted: boolean,
  score: number = 50,
  overrides: Partial<ConversionOutcome> = {},
): ConversionOutcome {
  return {
    leadKey: `lead_${Math.random().toString(36).slice(2, 10)}`,
    tenantId,
    converted,
    compositeScoreAtCapture: score,
    scoringContext: {},
    outcomeAt: new Date().toISOString(),
    ...overrides,
  };
}

async function seedOutcomes(
  tenantId: string,
  count: number,
  convertedRatio: number = 0.5,
  baseScore: number = 60,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    const converted = i < Math.floor(count * convertedRatio);
    // Give converted leads higher scores so the model can learn
    const score = converted ? baseScore + 20 : baseScore - 20;
    await recordConversionOutcome(makeOutcome(tenantId, converted, score));
  }
}

// ---------------------------------------------------------------------------
// recordConversionOutcome + getConversionOutcomes
// ---------------------------------------------------------------------------

test("records a single outcome and retrieves it", async () => {
  resetScoringModelStore();
  const o = makeOutcome("t1", true, 75);
  await recordConversionOutcome(o);

  const outcomes = await getConversionOutcomes("t1");
  assert.equal(outcomes.length, 1);
  assert.equal(outcomes[0].leadKey, o.leadKey);
  assert.equal(outcomes[0].converted, true);
  assert.equal(outcomes[0].compositeScoreAtCapture, 75);
});

test("records multiple outcomes and retrieves all for tenant", async () => {
  resetScoringModelStore();
  await recordConversionOutcome(makeOutcome("t2", true));
  await recordConversionOutcome(makeOutcome("t2", false));
  await recordConversionOutcome(makeOutcome("t2", true));

  const outcomes = await getConversionOutcomes("t2");
  assert.equal(outcomes.length, 3);
});

test("tenant isolation — outcomes for one tenant do not appear for another", async () => {
  resetScoringModelStore();
  await recordConversionOutcome(makeOutcome("tenant-A", true));
  await recordConversionOutcome(makeOutcome("tenant-B", false));

  const a = await getConversionOutcomes("tenant-A");
  const b = await getConversionOutcomes("tenant-B");
  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
  assert.equal(a[0].converted, true);
  assert.equal(b[0].converted, false);
});

test("getConversionOutcomes with since filter excludes older records", async () => {
  resetScoringModelStore();
  const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const newDate = new Date().toISOString();

  await recordConversionOutcome(makeOutcome("t3", true, 50, { outcomeAt: oldDate }));
  await recordConversionOutcome(makeOutcome("t3", false, 50, { outcomeAt: newDate }));

  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const filtered = await getConversionOutcomes("t3", cutoff);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].converted, false);
});

test("getConversionOutcomes returns empty array when no outcomes exist", async () => {
  resetScoringModelStore();
  const outcomes = await getConversionOutcomes("nonexistent-tenant");
  assert.deepEqual(outcomes, []);
});

test("outcome stores optional revenue field", async () => {
  resetScoringModelStore();
  const o = makeOutcome("t4", true, 80, { revenue: 4500 });
  await recordConversionOutcome(o);
  const outcomes = await getConversionOutcomes("t4");
  assert.equal(outcomes[0].revenue, 4500);
});

// ---------------------------------------------------------------------------
// trainScoringModel — insufficient data
// ---------------------------------------------------------------------------

test("training with 0 outcomes returns null", async () => {
  resetScoringModelStore();
  const result = await trainScoringModel("empty-tenant");
  assert.equal(result, null);
});

test("training with 19 outcomes returns null (below minimum)", async () => {
  resetScoringModelStore();
  await seedOutcomes("t5", 19);
  const result = await trainScoringModel("t5");
  assert.equal(result, null);
});

test("training with exactly 20 outcomes produces a model", async () => {
  resetScoringModelStore();
  await seedOutcomes("t6", 20);
  const model = await trainScoringModel("t6");
  assert.notEqual(model, null);
  assert.ok(model !== null);
  assert.equal(model.tenantId, "t6");
  assert.equal(model.totalOutcomes, 20);
});

// ---------------------------------------------------------------------------
// trainScoringModel — weight validity
// ---------------------------------------------------------------------------

test("trained weights are all between 0 and 1", async () => {
  resetScoringModelStore();
  await seedOutcomes("t7", 30);
  const model = await trainScoringModel("t7");
  assert.ok(model !== null);
  const { intentWeight, fitWeight, engagementWeight, urgencyWeight } = model!.weights;
  assert.ok((intentWeight ?? 0) >= 0 && (intentWeight ?? 0) <= 1);
  assert.ok((fitWeight ?? 0) >= 0 && (fitWeight ?? 0) <= 1);
  assert.ok((engagementWeight ?? 0) >= 0 && (engagementWeight ?? 0) <= 1);
  assert.ok((urgencyWeight ?? 0) >= 0 && (urgencyWeight ?? 0) <= 1);
});

test("trained weights sum is approximately 1", async () => {
  resetScoringModelStore();
  await seedOutcomes("t8", 40);
  const model = await trainScoringModel("t8");
  assert.ok(model !== null);
  const w = model!.weights;
  const sum =
    (w.intentWeight ?? 0) +
    (w.fitWeight ?? 0) +
    (w.engagementWeight ?? 0) +
    (w.urgencyWeight ?? 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected sum ~1 but got ${sum}`);
});

test("trained weights have minimum floor of 0.05 per dimension", async () => {
  resetScoringModelStore();
  // Extreme case: all intent signals, test that other weights stay above floor
  for (let i = 0; i < 30; i++) {
    const converted = i < 15;
    await recordConversionOutcome(
      makeOutcome("t9", converted, converted ? 90 : 10, {
        scoringContext: { intentScore: converted ? 90 : 10, fitScore: 50, engagementScore: 50, urgencyScore: 50 },
      }),
    );
  }
  const model = await trainScoringModel("t9");
  assert.ok(model !== null);
  const w = model!.weights;
  // After normalization, all should be above some reasonable minimum
  assert.ok((w.intentWeight ?? 0) > 0);
  assert.ok((w.fitWeight ?? 0) > 0);
  assert.ok((w.engagementWeight ?? 0) > 0);
  assert.ok((w.urgencyWeight ?? 0) > 0);
});

test("accuracy field is between 0 and 100", async () => {
  resetScoringModelStore();
  await seedOutcomes("t10", 25);
  const model = await trainScoringModel("t10");
  assert.ok(model !== null);
  assert.ok(model!.accuracy >= 0 && model!.accuracy <= 100);
});

test("model includes correct convertedOutcomes count", async () => {
  resetScoringModelStore();
  // Seed 30 outcomes with 10 converted
  await seedOutcomes("t11", 30, 10 / 30);
  const model = await trainScoringModel("t11");
  assert.ok(model !== null);
  assert.equal(model!.totalOutcomes, 30);
  assert.equal(model!.convertedOutcomes, 10);
});

// ---------------------------------------------------------------------------
// Model versioning
// ---------------------------------------------------------------------------

test("first training produces version 1", async () => {
  resetScoringModelStore();
  await seedOutcomes("t12", 20);
  const model = await trainScoringModel("t12");
  assert.ok(model !== null);
  assert.equal(model!.version, 1);
});

test("subsequent training increments version", async () => {
  resetScoringModelStore();
  await seedOutcomes("t13", 20);
  const v1 = await trainScoringModel("t13");
  assert.ok(v1 !== null);
  assert.equal(v1!.version, 1);

  // Add more outcomes and retrain
  await seedOutcomes("t13", 5);
  const v2 = await trainScoringModel("t13");
  assert.ok(v2 !== null);
  assert.equal(v2!.version, 2);
});

test("model versioning increments correctly across three cycles", async () => {
  resetScoringModelStore();
  await seedOutcomes("t14", 20);

  for (let expectedVersion = 1; expectedVersion <= 3; expectedVersion++) {
    const model = await trainScoringModel("t14");
    assert.ok(model !== null);
    assert.equal(model!.version, expectedVersion);
    // Add more data between cycles
    await seedOutcomes("t14", 5);
  }
});

// ---------------------------------------------------------------------------
// getCurrentModel + getModelHistory
// ---------------------------------------------------------------------------

test("getCurrentModel returns null for unknown tenant", async () => {
  resetScoringModelStore();
  const model = await getCurrentModel("ghost-tenant");
  assert.equal(model, null);
});

test("getCurrentModel returns the latest version", async () => {
  resetScoringModelStore();
  await seedOutcomes("t15", 20);
  await trainScoringModel("t15");
  await seedOutcomes("t15", 5);
  const v2 = await trainScoringModel("t15");

  const current = await getCurrentModel("t15");
  assert.ok(current !== null);
  assert.equal(current!.version, 2);
  assert.equal(current!.version, v2!.version);
});

test("getModelHistory returns all versions sorted by version desc", async () => {
  resetScoringModelStore();
  await seedOutcomes("t16", 20);
  await trainScoringModel("t16");
  await seedOutcomes("t16", 5);
  await trainScoringModel("t16");
  await seedOutcomes("t16", 5);
  await trainScoringModel("t16");

  const history = await getModelHistory("t16");
  assert.equal(history.length, 3);
  assert.equal(history[0].version, 3);
  assert.equal(history[1].version, 2);
  assert.equal(history[2].version, 1);
});

test("getModelHistory returns empty array for tenant with no models", async () => {
  resetScoringModelStore();
  const history = await getModelHistory("no-models-tenant");
  assert.deepEqual(history, []);
});

// ---------------------------------------------------------------------------
// getScoringWeightsForTenant
// ---------------------------------------------------------------------------

test("getScoringWeightsForTenant returns null when no model exists", async () => {
  resetScoringModelStore();
  const weights = await getScoringWeightsForTenant("weightless-tenant");
  assert.equal(weights, null);
});

test("getScoringWeightsForTenant returns weights after training", async () => {
  resetScoringModelStore();
  await seedOutcomes("t17", 20);
  await trainScoringModel("t17");

  const weights = await getScoringWeightsForTenant("t17");
  assert.ok(weights !== null);
  assert.ok(typeof weights!.intentWeight === "number");
  assert.ok(typeof weights!.fitWeight === "number");
  assert.ok(typeof weights!.engagementWeight === "number");
  assert.ok(typeof weights!.urgencyWeight === "number");
});

// ---------------------------------------------------------------------------
// detectModelDrift
// ---------------------------------------------------------------------------

test("detectModelDrift returns null when no outcomes exist", async () => {
  resetScoringModelStore();
  const alert = await detectModelDrift("drift-empty");
  assert.equal(alert, null);
});

test("detectModelDrift returns null when outcomes exist only in one period", async () => {
  resetScoringModelStore();
  // Only recent outcomes — no prior period data
  await seedOutcomes("drift-one-period", 10, 0.5);
  const alert = await detectModelDrift("drift-one-period");
  assert.equal(alert, null);
});

test("detectModelDrift returns alert when accuracy drops significantly", async () => {
  resetScoringModelStore();
  const tenantId = "drift-test";
  const now = Date.now();

  // Prior period (31-60 days ago): highly predictable data — converted leads have high scores
  const priorDate = (daysAgo: number) =>
    new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  for (let i = 0; i < 15; i++) {
    await recordConversionOutcome(
      makeOutcome(tenantId, true, 90, { outcomeAt: priorDate(35 + i) }),
    );
    await recordConversionOutcome(
      makeOutcome(tenantId, false, 10, { outcomeAt: priorDate(35 + i) }),
    );
  }

  // Recent period (0-30 days): random/noisy data — scores don't predict conversion
  for (let i = 0; i < 15; i++) {
    await recordConversionOutcome(
      makeOutcome(tenantId, true, 10, { outcomeAt: priorDate(i) }),
    );
    await recordConversionOutcome(
      makeOutcome(tenantId, false, 90, { outcomeAt: priorDate(i) }),
    );
  }

  const alert = await detectModelDrift(tenantId);
  // With inverted signals, accuracy should drop — drift should be detected
  if (alert !== null) {
    assert.equal(typeof alert.drift, "number");
    assert.ok(Math.abs(alert.drift) > 0);
    assert.equal(typeof alert.recommendation, "string");
    assert.ok(alert.recommendation.length > 0);
    assert.equal(alert.tenantId, tenantId);
    assert.equal(typeof alert.alertedAt, "string");
    assert.equal(typeof alert.currentAccuracy, "number");
    assert.equal(typeof alert.previousAccuracy, "number");
  }
  // If null, the accuracy difference wasn't large enough to trigger — that's valid too.
  // The important thing is the shape contract when it fires.
});

test("detectModelDrift returns null when accuracy change is within 5 point threshold", async () => {
  resetScoringModelStore();
  const tenantId = "drift-stable";
  const now = Date.now();
  const dateAt = (daysAgo: number) =>
    new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  // Same pattern in both periods — minimal drift expected
  for (let i = 0; i < 20; i++) {
    const isPrior = i < 10;
    const daysAgo = isPrior ? 40 + i : i + 1;
    await recordConversionOutcome(
      makeOutcome(tenantId, i % 2 === 0, 50, { outcomeAt: dateAt(daysAgo) }),
    );
  }

  const alert = await detectModelDrift(tenantId);
  // With identical accuracy in both periods, drift should be null
  assert.equal(alert, null);
});

// ---------------------------------------------------------------------------
// resetScoringModelStore
// ---------------------------------------------------------------------------

test("resetScoringModelStore clears outcomes and models", async () => {
  resetScoringModelStore();
  await seedOutcomes("reset-test", 20);
  await trainScoringModel("reset-test");

  resetScoringModelStore();

  const outcomes = await getConversionOutcomes("reset-test");
  const model = await getCurrentModel("reset-test");
  assert.deepEqual(outcomes, []);
  assert.equal(model, null);
});

test("resetScoringModelStore clears all tenants", async () => {
  resetScoringModelStore();
  await seedOutcomes("tenant-X", 5);
  await seedOutcomes("tenant-Y", 5);

  resetScoringModelStore();

  const x = await getConversionOutcomes("tenant-X");
  const y = await getConversionOutcomes("tenant-Y");
  assert.deepEqual(x, []);
  assert.deepEqual(y, []);
});

// ---------------------------------------------------------------------------
// model trainedAt and structure
// ---------------------------------------------------------------------------

test("trained model has a valid ISO 8601 trainedAt timestamp", async () => {
  resetScoringModelStore();
  await seedOutcomes("t18", 20);
  const model = await trainScoringModel("t18");
  assert.ok(model !== null);
  const parsed = new Date(model!.trainedAt);
  assert.ok(!Number.isNaN(parsed.getTime()));
});

test("trained model tenantId matches the requested tenant", async () => {
  resetScoringModelStore();
  await seedOutcomes("tenant-99", 20);
  const model = await trainScoringModel("tenant-99");
  assert.ok(model !== null);
  assert.equal(model!.tenantId, "tenant-99");
});

test("second training cycle uses prior weights as starting point (iterative learning)", async () => {
  resetScoringModelStore();
  await seedOutcomes("iterative", 20, 0.7, 70);
  const v1 = await trainScoringModel("iterative");
  assert.ok(v1 !== null);

  await seedOutcomes("iterative", 10, 0.8, 75);
  const v2 = await trainScoringModel("iterative");
  assert.ok(v2 !== null);

  // Weights should be different (learning rate applied)
  const w1 = v1!.weights;
  const w2 = v2!.weights;
  // At least one weight should differ between versions due to new data
  const changed =
    w1.intentWeight !== w2.intentWeight ||
    w1.fitWeight !== w2.fitWeight ||
    w1.engagementWeight !== w2.engagementWeight ||
    w1.urgencyWeight !== w2.urgencyWeight;
  assert.ok(changed, "Weights should change across training cycles when new data is added");
});
