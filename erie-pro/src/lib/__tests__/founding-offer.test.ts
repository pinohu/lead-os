// Tests for the static (env-only) founding-offer reader. The async
// getFoundingOffer() hits the DB so we don't exercise it here.

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { getFoundingOfferStatic } from "../founding-offer";

const ENV_KEYS = [
  "NEXT_PUBLIC_FOUNDING_TOTAL",
  "NEXT_PUBLIC_FOUNDING_CLAIMED",
  "NEXT_PUBLIC_FOUNDING_PRICE",
  "NEXT_PUBLIC_FOUNDING_NORMAL_PRICE",
  "NEXT_PUBLIC_FOUNDING_LOCK_MONTHS",
] as const;

const originalEnv: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) originalEnv[k] = process.env[k];

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

afterAll(() => {
  for (const k of ENV_KEYS) {
    if (originalEnv[k] !== undefined) process.env[k] = originalEnv[k];
    else delete process.env[k];
  }
});

describe("getFoundingOfferStatic", () => {
  it("defaults to 40 / 0 / $39 / $99 / 24mo", () => {
    const offer = getFoundingOfferStatic();
    expect(offer.totalSlots).toBe(40);
    expect(offer.claimedSlots).toBe(0);
    expect(offer.remainingSlots).toBe(40);
    expect(offer.price).toBe(39);
    expect(offer.normalPrice).toBe(99);
    expect(offer.lockMonths).toBe(24);
    expect(offer.isSoldOut).toBe(false);
    expect(offer.source).toBe("env");
  });

  it("respects env overrides", () => {
    process.env.NEXT_PUBLIC_FOUNDING_TOTAL = "25";
    process.env.NEXT_PUBLIC_FOUNDING_CLAIMED = "7";
    process.env.NEXT_PUBLIC_FOUNDING_PRICE = "49";
    const offer = getFoundingOfferStatic();
    expect(offer.totalSlots).toBe(25);
    expect(offer.claimedSlots).toBe(7);
    expect(offer.remainingSlots).toBe(18);
    expect(offer.price).toBe(49);
    expect(offer.isSoldOut).toBe(false);
  });

  it("clamps claimed above total and flips to sold out", () => {
    process.env.NEXT_PUBLIC_FOUNDING_TOTAL = "10";
    process.env.NEXT_PUBLIC_FOUNDING_CLAIMED = "999";
    const offer = getFoundingOfferStatic();
    expect(offer.claimedSlots).toBe(10);
    expect(offer.remainingSlots).toBe(0);
    expect(offer.isSoldOut).toBe(true);
  });
});
