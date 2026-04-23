import test from "node:test";
import assert from "node:assert/strict";
import {
  computeAttribution,
  type AttributionTouch,
  type AttributionModel,
} from "../src/lib/attribution.ts";

function makeTouches(channels: string[], dayOffsets: number[]): AttributionTouch[] {
  const now = Date.now();
  return channels.map((channel, i) => ({
    id: `touch-${i}`,
    leadKey: "lead-attr-test",
    channel,
    source: `source-${channel}`,
    medium: "web",
    campaign: "",
    content: "",
    referrer: "",
    landingPage: "/",
    createdAt: new Date(now - (dayOffsets[i] ?? 0) * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function sumCredits(result: { touches: { credit: number }[] }): number {
  return result.touches.reduce((sum, t) => sum + t.credit, 0);
}

// ---------------------------------------------------------------------------
// Empty touches
// ---------------------------------------------------------------------------

test("all attribution models handle empty touch array", () => {
  const models: AttributionModel[] = ["first-touch", "last-touch", "linear", "time-decay", "position-based"];
  for (const model of models) {
    const result = computeAttribution([], model, 100);
    assert.equal(result.touches.length, 0);
    assert.equal(result.leadKey, "");
  }
});

// ---------------------------------------------------------------------------
// first-touch
// ---------------------------------------------------------------------------

test("first-touch assigns 100% credit to the first touchpoint", () => {
  const touches = makeTouches(["organic", "paid", "email"], [10, 5, 0]);
  const result = computeAttribution(touches, "first-touch", 1000);

  const firstTouch = result.touches.find((t) => t.credit === 1);
  assert.ok(firstTouch, "One touch should have credit = 1");
  assert.equal(firstTouch.channel, "organic");
  assert.equal(firstTouch.value, 1000);

  const others = result.touches.filter((t) => t.credit === 0);
  assert.equal(others.length, 2);
});

test("first-touch credit sums to 1.0", () => {
  const touches = makeTouches(["a", "b", "c", "d"], [30, 20, 10, 0]);
  const result = computeAttribution(touches, "first-touch", 500);
  assert.ok(Math.abs(sumCredits(result) - 1.0) < 0.001);
});

// ---------------------------------------------------------------------------
// last-touch
// ---------------------------------------------------------------------------

test("last-touch assigns 100% credit to the last touchpoint", () => {
  const touches = makeTouches(["organic", "paid", "email"], [10, 5, 0]);
  const result = computeAttribution(touches, "last-touch", 1000);

  const lastTouch = result.touches.find((t) => t.credit === 1);
  assert.ok(lastTouch, "One touch should have credit = 1");
  assert.equal(lastTouch.channel, "email");
  assert.equal(lastTouch.value, 1000);
});

test("last-touch credit sums to 1.0", () => {
  const touches = makeTouches(["a", "b", "c"], [20, 10, 0]);
  const result = computeAttribution(touches, "last-touch", 500);
  assert.ok(Math.abs(sumCredits(result) - 1.0) < 0.001);
});

// ---------------------------------------------------------------------------
// linear
// ---------------------------------------------------------------------------

test("linear distributes credit equally across all touchpoints", () => {
  const touches = makeTouches(["organic", "paid", "email"], [10, 5, 0]);
  const result = computeAttribution(touches, "linear", 900);

  for (const t of result.touches) {
    assert.ok(
      Math.abs(t.credit - 1 / 3) < 0.001,
      `Expected credit ~0.333, got ${t.credit}`,
    );
    assert.ok(
      Math.abs(t.value - 300) < 0.01,
      `Expected value ~300, got ${t.value}`,
    );
  }
});

test("linear credit sums to 1.0", () => {
  const touches = makeTouches(["a", "b", "c", "d", "e"], [40, 30, 20, 10, 0]);
  const result = computeAttribution(touches, "linear", 500);
  assert.ok(Math.abs(sumCredits(result) - 1.0) < 0.001);
});

test("linear with single touch assigns full credit", () => {
  const touches = makeTouches(["organic"], [0]);
  const result = computeAttribution(touches, "linear", 100);
  assert.equal(result.touches[0].credit, 1);
  assert.equal(result.touches[0].value, 100);
});

// ---------------------------------------------------------------------------
// time-decay
// ---------------------------------------------------------------------------

test("time-decay gives more credit to recent touchpoints", () => {
  const touches = makeTouches(["organic", "paid", "email"], [14, 7, 0]);
  const result = computeAttribution(touches, "time-decay", 1000);

  const sorted = result.touches
    .slice()
    .sort((a, b) => new Date(touches.find((t) => t.id === a.touchId)!.createdAt).getTime() -
                     new Date(touches.find((t) => t.id === b.touchId)!.createdAt).getTime());

  assert.ok(
    sorted[sorted.length - 1].credit > sorted[0].credit,
    "Most recent touch should have highest credit",
  );
});

test("time-decay credit sums to 1.0", () => {
  const touches = makeTouches(["a", "b", "c", "d"], [21, 14, 7, 0]);
  const result = computeAttribution(touches, "time-decay", 500);
  assert.ok(Math.abs(sumCredits(result) - 1.0) < 0.001, `Sum was ${sumCredits(result)}`);
});

test("time-decay with single touch assigns full credit", () => {
  const touches = makeTouches(["organic"], [0]);
  const result = computeAttribution(touches, "time-decay", 100);
  assert.ok(Math.abs(result.touches[0].credit - 1.0) < 0.001);
});

// ---------------------------------------------------------------------------
// position-based
// ---------------------------------------------------------------------------

test("position-based assigns 40/20/40 split for 3+ touches", () => {
  const touches = makeTouches(["organic", "paid", "social", "email"], [30, 20, 10, 0]);
  const result = computeAttribution(touches, "position-based", 1000);

  const sorted = result.touches
    .slice()
    .sort((a, b) => {
      const aTouch = touches.find((t) => t.id === a.touchId)!;
      const bTouch = touches.find((t) => t.id === b.touchId)!;
      return new Date(aTouch.createdAt).getTime() - new Date(bTouch.createdAt).getTime();
    });

  assert.ok(Math.abs(sorted[0].credit - 0.4) < 0.001, `First should be 0.4, got ${sorted[0].credit}`);
  assert.ok(Math.abs(sorted[sorted.length - 1].credit - 0.4) < 0.001, `Last should be 0.4, got ${sorted[sorted.length - 1].credit}`);

  const middleCredits = sorted.slice(1, -1);
  const expectedMiddle = 0.2 / middleCredits.length;
  for (const m of middleCredits) {
    assert.ok(Math.abs(m.credit - expectedMiddle) < 0.001, `Middle should be ~${expectedMiddle}, got ${m.credit}`);
  }
});

test("position-based credit sums to 1.0", () => {
  const touches = makeTouches(["a", "b", "c", "d", "e"], [40, 30, 20, 10, 0]);
  const result = computeAttribution(touches, "position-based", 500);
  assert.ok(Math.abs(sumCredits(result) - 1.0) < 0.001, `Sum was ${sumCredits(result)}`);
});

test("position-based with single touch assigns full credit", () => {
  const touches = makeTouches(["organic"], [0]);
  const result = computeAttribution(touches, "position-based", 100);
  assert.equal(result.touches[0].credit, 1);
  assert.equal(result.touches[0].value, 100);
});

test("position-based with two touches splits 50/50", () => {
  const touches = makeTouches(["organic", "email"], [7, 0]);
  const result = computeAttribution(touches, "position-based", 200);

  for (const t of result.touches) {
    assert.equal(t.credit, 0.5);
    assert.equal(t.value, 100);
  }
});

// ---------------------------------------------------------------------------
// Cross-model: credit always sums to 1.0
// ---------------------------------------------------------------------------

test("all models sum credits to 1.0 for multi-touch journeys", () => {
  const models: AttributionModel[] = ["first-touch", "last-touch", "linear", "time-decay", "position-based"];
  const touches = makeTouches(["organic", "paid", "social", "email", "referral"], [28, 21, 14, 7, 0]);

  for (const model of models) {
    const result = computeAttribution(touches, model, 1000);
    const total = sumCredits(result);
    assert.ok(
      Math.abs(total - 1.0) < 0.01,
      `${model}: credit sum should be ~1.0, got ${total}`,
    );
  }
});

test("all models preserve totalValue in result", () => {
  const models: AttributionModel[] = ["first-touch", "last-touch", "linear", "time-decay", "position-based"];
  const touches = makeTouches(["organic", "email"], [7, 0]);

  for (const model of models) {
    const result = computeAttribution(touches, model, 999);
    assert.equal(result.totalValue, 999);
    assert.equal(result.model, model);
    assert.equal(result.leadKey, "lead-attr-test");
  }
});
