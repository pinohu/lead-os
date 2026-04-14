import { describe, it, expect } from "vitest";
import {
  REQUESTER_TIERS,
  getAllRequesterTiers,
  getRequesterTier,
  REQUESTER_TIER_ORDER,
} from "../requester-tiers";

describe("requester tiers", () => {
  it("has free, concierge, and annual", () => {
    expect(REQUESTER_TIERS.free.price).toBe(0);
    expect(REQUESTER_TIERS.concierge.price).toBe(29);
    expect(REQUESTER_TIERS.annual.price).toBe(199);
  });

  it("lists them in order: free → concierge → annual", () => {
    expect(REQUESTER_TIER_ORDER).toEqual(["free", "concierge", "annual"]);
    const all = getAllRequesterTiers();
    expect(all.map((t) => t.id)).toEqual(["free", "concierge", "annual"]);
  });

  it("concierge is per-job and featured", () => {
    const c = getRequesterTier("concierge");
    expect(c.cadence).toBe("per-job");
    expect(c.featured).toBe(true);
    expect(c.stripePriceEnv).toBe("STRIPE_PRICE_CONCIERGE");
  });

  it("annual is yearly subscription", () => {
    const a = getRequesterTier("annual");
    expect(a.cadence).toBe("yearly");
    expect(a.stripePriceEnv).toBe("STRIPE_PRICE_ANNUAL");
  });

  it("every tier has at least 3 benefits and a CTA", () => {
    for (const tier of getAllRequesterTiers()) {
      expect(tier.benefits.length).toBeGreaterThanOrEqual(3);
      expect(tier.cta.length).toBeGreaterThan(0);
      expect(tier.blurb.length).toBeGreaterThan(0);
    }
  });
});
