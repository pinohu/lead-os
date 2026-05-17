// ── Experiment analytics ─────────────────────────────────────────────
// Pure aggregator: takes exposure + conversion records, returns per-
// variant conversion rates and a two-proportion z-test for statistical
// significance vs. the control variant.

import type {
  ExperimentDef,
  ExperimentExposureRecord,
  ExperimentConversionRecord,
} from "@/lib/experiments/types";

export interface VariantResult {
  variantKey: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
  /** Whether this is the designated control */
  isControl: boolean;
  /**
   * Two-proportion z-score vs control. null when this is the control
   * itself or when sample sizes are too small for the test to be
   * meaningful (< 30 in either group).
   */
  zScoreVsControl: number | null;
  /**
   * Two-tailed p-value. null when zScoreVsControl is null. Compare
   * against 0.05 for "significant" or 0.01 for "highly significant".
   */
  pValueVsControl: number | null;
  /**
   * Relative lift vs control (e.g. 0.15 = +15%). null for control or
   * when control's rate is 0 (can't divide by zero).
   */
  liftVsControl: number | null;
}

export interface ExperimentAnalytics {
  experimentKey: string;
  description: string;
  totalExposures: number;
  totalConversions: number;
  overallConversionRate: number;
  /**
   * The control variant key. Convention: the first variant in the
   * experiment definition. Configurable per analytics call.
   */
  controlVariantKey: string;
  /**
   * Per-variant rollup. Sorted by variantKey for deterministic output.
   */
  variants: VariantResult[];
  /**
   * Did at least one non-control variant reach statistical significance
   * (p<0.05) vs control? Useful flag for the admin dashboard.
   */
  hasSignificantWinner: boolean;
  /**
   * If a significant winner exists, the variantKey with the highest
   * conversionRate among those significantly better than control.
   */
  significantWinnerVariantKey: string | null;
}

// ── Statistics ───────────────────────────────────────────────────────

/**
 * Two-proportion z-test for whether two conversion rates differ.
 * Returns null when either sample is too small for the test to give
 * a meaningful answer (< 30).
 */
export function twoProportionZ(
  conversionsA: number,
  exposuresA: number,
  conversionsB: number,
  exposuresB: number
): number | null {
  if (exposuresA < 30 || exposuresB < 30) return null;
  if (exposuresA === 0 || exposuresB === 0) return null;
  const pA = conversionsA / exposuresA;
  const pB = conversionsB / exposuresB;
  const pPool = (conversionsA + conversionsB) / (exposuresA + exposuresB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / exposuresA + 1 / exposuresB));
  if (se === 0) return null;
  return (pA - pB) / se;
}

/**
 * Two-tailed p-value from a z-score. Uses an Abramowitz-Stegun
 * approximation for the standard normal CDF — accurate to ~1e-7,
 * which is more than enough for A/B test significance decisions.
 */
export function pValueFromZ(z: number): number {
  const absZ = Math.abs(z);
  // Standard normal PDF
  const pdf = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI);
  // A-S 26.2.17 approximation for the upper tail
  const t = 1 / (1 + 0.2316419 * absZ);
  const upper =
    pdf *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  // Two-tailed
  return Math.min(1, 2 * upper);
}

// ── Aggregation ──────────────────────────────────────────────────────

interface VariantStats {
  exposures: number;
  conversions: number;
}

export function computeExperimentAnalytics(
  exp: ExperimentDef,
  exposures: readonly ExperimentExposureRecord[],
  conversions: readonly ExperimentConversionRecord[],
  controlVariantKey?: string
): ExperimentAnalytics {
  const filteredExposures = exposures.filter((e) => e.experimentKey === exp.key);
  const filteredConversions = conversions.filter(
    (c) => c.experimentKey === exp.key && c.exposedFirst
  );

  // Map visitorId → variantKey for exposure attribution
  const visitorVariant = new Map<string, string>();
  for (const e of filteredExposures) {
    if (!visitorVariant.has(e.visitorId)) {
      visitorVariant.set(e.visitorId, e.variantKey);
    }
  }

  // Per-variant counters initialized for every defined variant (so
  // results always include all variants even with zero traffic)
  const perVariant = new Map<string, VariantStats>();
  for (const v of exp.variants) {
    perVariant.set(v.key, { exposures: 0, conversions: 0 });
  }
  for (const [, variantKey] of visitorVariant) {
    const stats = perVariant.get(variantKey);
    if (stats) stats.exposures++;
  }

  // Conversions: only count converted visitors who were exposed
  const convertedVisitors = new Set<string>();
  for (const c of filteredConversions) {
    if (visitorVariant.has(c.visitorId) && !convertedVisitors.has(c.visitorId)) {
      convertedVisitors.add(c.visitorId);
      const variantKey = visitorVariant.get(c.visitorId)!;
      const stats = perVariant.get(variantKey);
      if (stats) stats.conversions++;
    }
  }

  const totalExposures = Array.from(perVariant.values()).reduce(
    (s, v) => s + v.exposures,
    0
  );
  const totalConversions = Array.from(perVariant.values()).reduce(
    (s, v) => s + v.conversions,
    0
  );

  const control = controlVariantKey ?? exp.variants[0].key;
  const controlStats = perVariant.get(control) ?? { exposures: 0, conversions: 0 };

  const variants: VariantResult[] = Array.from(perVariant.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([variantKey, stats]) => {
      const isControl = variantKey === control;
      const conversionRate =
        stats.exposures > 0 ? stats.conversions / stats.exposures : 0;
      let z: number | null = null;
      let p: number | null = null;
      let lift: number | null = null;
      if (!isControl) {
        z = twoProportionZ(
          stats.conversions,
          stats.exposures,
          controlStats.conversions,
          controlStats.exposures
        );
        p = z != null ? pValueFromZ(z) : null;
        if (controlStats.exposures > 0 && controlStats.conversions > 0) {
          const controlRate = controlStats.conversions / controlStats.exposures;
          lift = controlRate > 0 ? (conversionRate - controlRate) / controlRate : null;
        }
      }
      return {
        variantKey,
        exposures: stats.exposures,
        conversions: stats.conversions,
        conversionRate,
        isControl,
        zScoreVsControl: z,
        pValueVsControl: p,
        liftVsControl: lift,
      };
    });

  // Significant winner: any non-control with p < 0.05 AND higher rate than control
  const controlRate =
    controlStats.exposures > 0 ? controlStats.conversions / controlStats.exposures : 0;
  const significantWinners = variants.filter(
    (v) =>
      !v.isControl &&
      v.pValueVsControl != null &&
      v.pValueVsControl < 0.05 &&
      v.conversionRate > controlRate
  );
  const significantWinnerVariantKey =
    significantWinners.length > 0
      ? significantWinners.reduce(
          (best, v) => (v.conversionRate > best.conversionRate ? v : best),
          significantWinners[0]
        ).variantKey
      : null;

  return {
    experimentKey: exp.key,
    description: exp.description,
    totalExposures,
    totalConversions,
    overallConversionRate:
      totalExposures > 0 ? totalConversions / totalExposures : 0,
    controlVariantKey: control,
    variants,
    hasSignificantWinner: significantWinnerVariantKey !== null,
    significantWinnerVariantKey,
  };
}
