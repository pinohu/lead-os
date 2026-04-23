// tests/pricing-safety.test.ts
import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  evaluateSafety,
  evaluateShadowStructuralSafety,
} from "../src/lib/pricing/safety-policy.ts";

afterEach(() => {
  delete process.env.PRICING_KILL_SWITCH;
  delete process.env.ENABLE_LIVE_PRICING;
});

describe("pricing safety policy", () => {
  it("blocks apply when kill switch enabled", () => {
    process.env.PRICING_KILL_SWITCH = "true";
    process.env.ENABLE_LIVE_PRICING = "true";
    const r = evaluateSafety({
      tenantId: "t1",
      skuKey: "sku",
      currentPriceCents: 1000,
      proposedPriceCents: 1100,
      basePriceCents: 1000,
      lastChangedAt: null,
      now: new Date("2026-01-01T12:00:00Z"),
    });
    assert.equal(r.allowed, false);
    assert.ok(r.blockedReasons.some((x) => x.includes("KILL_SWITCH")));
  });

  it("blocks full apply when ENABLE_LIVE_PRICING is off", () => {
    delete process.env.ENABLE_LIVE_PRICING;
    const r = evaluateSafety({
      tenantId: "t1",
      skuKey: "sku",
      currentPriceCents: 10_000,
      proposedPriceCents: 10_400,
      basePriceCents: 8000,
      lastChangedAt: new Date("2000-01-01T00:00:00Z"),
      now: new Date("2026-01-01T12:00:00Z"),
    });
    assert.equal(r.allowed, false);
    assert.ok(r.blockedReasons.some((x) => x.includes("ENABLE_LIVE_PRICING")));
  });

  it("allows structural shadow path when live is off but kill switch off", () => {
    delete process.env.ENABLE_LIVE_PRICING;
    const r = evaluateShadowStructuralSafety({
      tenantId: "t1",
      skuKey: "sku",
      currentPriceCents: 10_000,
      proposedPriceCents: 10_400,
      basePriceCents: 8000,
      lastChangedAt: new Date("2000-01-01T00:00:00Z"),
      now: new Date("2026-01-01T12:00:00Z"),
    });
    assert.equal(r.allowed, true);
  });

  it("allows bounded apply when live on and policy permits", () => {
    process.env.ENABLE_LIVE_PRICING = "true";
    const r = evaluateSafety({
      tenantId: "t1",
      skuKey: "sku",
      currentPriceCents: 10_000,
      proposedPriceCents: 10_400,
      basePriceCents: 8000,
      lastChangedAt: new Date("2000-01-01T00:00:00Z"),
      now: new Date("2026-01-01T12:00:00Z"),
    });
    assert.equal(r.allowed, true);
    assert.ok(r.finalPriceCents > 0);
  });
});
