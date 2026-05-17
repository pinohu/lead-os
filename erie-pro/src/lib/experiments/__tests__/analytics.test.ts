import { describe, it, expect } from "vitest";
import {
  twoProportionZ,
  pValueFromZ,
  computeExperimentAnalytics,
} from "@/lib/experiments/analytics";
import type {
  ExperimentDef,
  ExperimentExposureRecord,
  ExperimentConversionRecord,
} from "@/lib/experiments/types";

const TEST_EXPERIMENT: ExperimentDef = {
  key: "exp_test",
  description: "test experiment",
  variants: [
    { key: "control", weight: 50 },
    { key: "treatment", weight: 50 },
  ],
  startedAt: "2026-01-01T00:00:00Z",
};

function expose(visitorId: string, variant: string): ExperimentExposureRecord {
  return {
    visitorId,
    experimentKey: "exp_test",
    variantKey: variant,
    exposedAt: new Date(),
    nicheSlug: null,
  };
}

function convert(visitorId: string): ExperimentConversionRecord {
  return {
    visitorId,
    experimentKey: "exp_test",
    exposedFirst: true,
    convertedAt: new Date(),
  };
}

describe("twoProportionZ", () => {
  it("returns null for too-small samples", () => {
    expect(twoProportionZ(5, 20, 5, 20)).toBeNull();
    expect(twoProportionZ(5, 100, 5, 20)).toBeNull();
  });

  it("returns 0 when both proportions are equal", () => {
    expect(twoProportionZ(50, 500, 50, 500)).toBeCloseTo(0, 5);
  });

  it("returns positive z when A's rate is higher", () => {
    const z = twoProportionZ(60, 500, 40, 500);
    expect(z).toBeGreaterThan(0);
  });

  it("returns negative z when A's rate is lower", () => {
    const z = twoProportionZ(40, 500, 60, 500);
    expect(z).toBeLessThan(0);
  });
});

describe("pValueFromZ", () => {
  it("returns ~0.05 for |z|=1.96", () => {
    expect(pValueFromZ(1.96)).toBeCloseTo(0.05, 2);
  });
  it("returns ~0.01 for |z|=2.58", () => {
    expect(pValueFromZ(2.58)).toBeCloseTo(0.01, 2);
  });
  it("returns ~1.0 for z=0", () => {
    expect(pValueFromZ(0)).toBeCloseTo(1.0, 2);
  });
  it("is symmetric (two-tailed)", () => {
    expect(pValueFromZ(1.5)).toBeCloseTo(pValueFromZ(-1.5), 5);
  });
});

describe("computeExperimentAnalytics", () => {
  it("returns zeroed analytics for empty input", () => {
    const a = computeExperimentAnalytics(TEST_EXPERIMENT, [], []);
    expect(a.totalExposures).toBe(0);
    expect(a.totalConversions).toBe(0);
    expect(a.variants).toHaveLength(2);
    expect(a.variants[0].exposures).toBe(0);
    expect(a.hasSignificantWinner).toBe(false);
  });

  it("counts exposures and conversions by variant", () => {
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 100; i++) exposures.push(expose(`v-c${i}`, "control"));
    for (let i = 0; i < 100; i++) exposures.push(expose(`v-t${i}`, "treatment"));

    const conversions: ExperimentConversionRecord[] = [];
    for (let i = 0; i < 10; i++) conversions.push(convert(`v-c${i}`)); // 10/100 = 10%
    for (let i = 0; i < 20; i++) conversions.push(convert(`v-t${i}`)); // 20/100 = 20%

    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    const control = a.variants.find((v) => v.variantKey === "control")!;
    const treatment = a.variants.find((v) => v.variantKey === "treatment")!;
    expect(control.exposures).toBe(100);
    expect(control.conversions).toBe(10);
    expect(control.conversionRate).toBeCloseTo(0.1, 5);
    expect(treatment.exposures).toBe(100);
    expect(treatment.conversions).toBe(20);
    expect(treatment.conversionRate).toBeCloseTo(0.2, 5);
  });

  it("computes lift vs control", () => {
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 100; i++) exposures.push(expose(`v-c${i}`, "control"));
    for (let i = 0; i < 100; i++) exposures.push(expose(`v-t${i}`, "treatment"));
    const conversions: ExperimentConversionRecord[] = [];
    for (let i = 0; i < 10; i++) conversions.push(convert(`v-c${i}`));
    for (let i = 0; i < 15; i++) conversions.push(convert(`v-t${i}`));

    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    const treatment = a.variants.find((v) => v.variantKey === "treatment")!;
    // 15% vs 10% → +50% lift
    expect(treatment.liftVsControl).toBeCloseTo(0.5, 2);
  });

  it("detects significant winners with sufficient samples", () => {
    // Construct a difference large enough to be significant at p<0.05
    // 200 vs 100 conversions out of 1000 each → ~10pp diff
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 1000; i++) exposures.push(expose(`c${i}`, "control"));
    for (let i = 0; i < 1000; i++) exposures.push(expose(`t${i}`, "treatment"));
    const conversions: ExperimentConversionRecord[] = [];
    for (let i = 0; i < 100; i++) conversions.push(convert(`c${i}`));
    for (let i = 0; i < 200; i++) conversions.push(convert(`t${i}`));

    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    expect(a.hasSignificantWinner).toBe(true);
    expect(a.significantWinnerVariantKey).toBe("treatment");
    const t = a.variants.find((v) => v.variantKey === "treatment")!;
    expect(t.pValueVsControl).toBeLessThan(0.001); // very significant
  });

  it("does NOT mark winner when difference is small (noise)", () => {
    // 51 vs 50 conversions out of 1000 each — clearly noise
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 1000; i++) exposures.push(expose(`c${i}`, "control"));
    for (let i = 0; i < 1000; i++) exposures.push(expose(`t${i}`, "treatment"));
    const conversions: ExperimentConversionRecord[] = [];
    for (let i = 0; i < 50; i++) conversions.push(convert(`c${i}`));
    for (let i = 0; i < 51; i++) conversions.push(convert(`t${i}`));

    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    expect(a.hasSignificantWinner).toBe(false);
    expect(a.significantWinnerVariantKey).toBeNull();
  });

  it("ignores conversions from visitors that weren't exposed first", () => {
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 100; i++) exposures.push(expose(`c${i}`, "control"));
    for (let i = 0; i < 100; i++) exposures.push(expose(`t${i}`, "treatment"));
    const conversions: ExperimentConversionRecord[] = [
      {
        visitorId: "c0",
        experimentKey: "exp_test",
        exposedFirst: false, // converted BEFORE exposure
        convertedAt: new Date(),
      },
    ];
    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    expect(a.totalConversions).toBe(0);
  });

  it("ignores conversions from unexposed visitors entirely", () => {
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 100; i++) exposures.push(expose(`c${i}`, "control"));
    // Conversion from visitor we never exposed
    const conversions: ExperimentConversionRecord[] = [convert("never-exposed")];
    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    expect(a.totalConversions).toBe(0);
  });

  it("counts each visitor's conversion only once", () => {
    const exposures: ExperimentExposureRecord[] = [];
    for (let i = 0; i < 100; i++) exposures.push(expose(`c${i}`, "control"));
    // Same visitor recorded as converted twice
    const conversions: ExperimentConversionRecord[] = [
      convert("c0"),
      convert("c0"),
      convert("c0"),
    ];
    const a = computeExperimentAnalytics(TEST_EXPERIMENT, exposures, conversions);
    expect(a.totalConversions).toBe(1);
  });
});
