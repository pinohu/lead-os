import { describe, it, expect } from "vitest";
import {
  assignVariant,
  assignVariants,
  hashToBucket,
} from "@/lib/experiments/bucketing";
import type { ExperimentDef } from "@/lib/experiments/types";

const EXP_50_50: ExperimentDef = {
  key: "exp_50_50",
  description: "test 50/50",
  variants: [
    { key: "control", weight: 50 },
    { key: "treatment", weight: 50 },
  ],
  startedAt: "2026-01-01T00:00:00Z",
};

const EXP_90_10: ExperimentDef = {
  key: "exp_90_10",
  description: "test 90/10",
  variants: [
    { key: "control", weight: 90 },
    { key: "treatment", weight: 10 },
  ],
  startedAt: "2026-01-01T00:00:00Z",
};

describe("hashToBucket", () => {
  it("returns deterministic values for the same input", () => {
    const a = hashToBucket("visitor-abc", "exp_x");
    const b = hashToBucket("visitor-abc", "exp_x");
    expect(a).toBe(b);
  });

  it("returns different buckets for the same visitor in different experiments", () => {
    // Salted hash — same visitor should bucket independently across experiments.
    // We can't guarantee they're different (collisions exist) but it's very likely
    // for any randomly-chosen pair.
    const buckets = ["exp_a", "exp_b", "exp_c", "exp_d", "exp_e"].map((k) =>
      hashToBucket("visitor-stable", k)
    );
    const unique = new Set(buckets);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("returns values in [0, 100)", () => {
    for (let i = 0; i < 1000; i++) {
      const b = hashToBucket(`v${i}`, "exp_x");
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(100);
    }
  });
});

describe("assignVariant — 50/50", () => {
  it("is consistent for the same visitor", () => {
    const a = assignVariant(EXP_50_50, { visitorId: "visitor-1" });
    const b = assignVariant(EXP_50_50, { visitorId: "visitor-1" });
    expect(a.variantKey).toBe(b.variantKey);
  });

  it("produces approximately 50/50 split across many visitors", () => {
    const counts: Record<string, number> = { control: 0, treatment: 0 };
    for (let i = 0; i < 10_000; i++) {
      const a = assignVariant(EXP_50_50, { visitorId: `v-${i}` });
      counts[a.variantKey]++;
    }
    // Allow ±2% margin — chi-square would say this is fine for n=10k
    expect(counts.control).toBeGreaterThan(4800);
    expect(counts.control).toBeLessThan(5200);
    expect(counts.treatment).toBeGreaterThan(4800);
    expect(counts.treatment).toBeLessThan(5200);
  });
});

describe("assignVariant — weighted 90/10", () => {
  it("produces approximately 90/10 split", () => {
    const counts: Record<string, number> = { control: 0, treatment: 0 };
    for (let i = 0; i < 10_000; i++) {
      const a = assignVariant(EXP_90_10, { visitorId: `v-${i}` });
      counts[a.variantKey]++;
    }
    expect(counts.control / 10_000).toBeGreaterThan(0.87);
    expect(counts.control / 10_000).toBeLessThan(0.93);
    expect(counts.treatment / 10_000).toBeGreaterThan(0.07);
    expect(counts.treatment / 10_000).toBeLessThan(0.13);
  });
});

describe("assignVariant — paused / ended / ineligible", () => {
  it("returns default variant when paused", () => {
    const paused: ExperimentDef = { ...EXP_50_50, paused: true, defaultVariant: "control" };
    const a = assignVariant(paused, { visitorId: "v-1" });
    expect(a.variantKey).toBe("control");
    expect(a.isDefault).toBe(true);
    expect(a.isIneligible).toBe(false);
  });

  it("returns default variant when ended in the past", () => {
    const ended: ExperimentDef = {
      ...EXP_50_50,
      endedAt: "2020-01-01T00:00:00Z",
      defaultVariant: "control",
    };
    const a = assignVariant(ended, { visitorId: "v-1" });
    expect(a.isDefault).toBe(true);
  });

  it("returns default + ineligible when eligibility check fails", () => {
    const restricted: ExperimentDef = {
      ...EXP_50_50,
      defaultVariant: "control",
      eligible: (ctx) => ctx.nicheSlug === "plumbing",
    };
    const a = assignVariant(restricted, { visitorId: "v-1", nicheSlug: "dental" });
    expect(a.isIneligible).toBe(true);
    expect(a.isDefault).toBe(true);
    const b = assignVariant(restricted, { visitorId: "v-1", nicheSlug: "plumbing" });
    expect(b.isIneligible).toBe(false);
  });
});

describe("assignVariant — validation", () => {
  it("throws when weights don't sum to 100", () => {
    const bad: ExperimentDef = {
      ...EXP_50_50,
      variants: [
        { key: "a", weight: 30 },
        { key: "b", weight: 30 },
      ],
    };
    expect(() => assignVariant(bad, { visitorId: "v-1" })).toThrow(/sum to/);
  });
});

describe("assignVariants — multi-experiment", () => {
  it("assigns each experiment independently", () => {
    const result = assignVariants([EXP_50_50, EXP_90_10], { visitorId: "v-1" });
    expect(result["exp_50_50"]).toBeDefined();
    expect(result["exp_90_10"]).toBeDefined();
    expect(["control", "treatment"]).toContain(result["exp_50_50"].variantKey);
    expect(["control", "treatment"]).toContain(result["exp_90_10"].variantKey);
  });
});
