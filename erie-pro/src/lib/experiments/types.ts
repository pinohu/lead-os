// ── A/B testing framework: types ─────────────────────────────────────
// Pure data structures for defining experiments and recording exposures.
// No IO; runtime/persistence live in runtime.ts and analytics.ts.

/**
 * A single experiment definition. Experiments are configured in code
 * (not the database) so they can be code-reviewed, version-controlled,
 * and rolled out via deploy. The DB only tracks exposures + outcomes.
 */
export interface ExperimentDef {
  /** Stable, snake_case experiment identifier (used for storage). */
  key: string;
  /** Human-readable description for the admin dashboard. */
  description: string;
  /**
   * Variants this experiment can serve. Weights must sum to 100.
   * Variant keys should be snake_case and stable; rename = new experiment.
   */
  variants: Array<{ key: string; weight: number; description?: string }>;
  /**
   * Optional eligibility filter: experiment only applies when this
   * returns true. Use sparingly — most experiments should run for all
   * eligible visitors (defined by where the framework is called).
   */
  eligible?: (ctx: ExperimentContext) => boolean;
  /** When the experiment started. Used by analytics to scope queries. */
  startedAt: string; // ISO 8601
  /** When the experiment ended (analytics still works after end). */
  endedAt?: string; // ISO 8601
  /**
   * Default variant if the experiment is disabled (paused without
   * being ended). Useful for kill-switching a misbehaving experiment.
   */
  defaultVariant?: string;
  /** When true the experiment is paused — all visitors get defaultVariant. */
  paused?: boolean;
}

export interface ExperimentContext {
  /** Stable visitor identifier (e.g. cookie value). MUST be present. */
  visitorId: string;
  /** Niche the visitor is currently engaging with, if known. */
  nicheSlug?: string;
  /** Anything else relevant to eligibility. */
  [key: string]: unknown;
}

/**
 * Result of resolving an experiment for a visitor.
 */
export interface VariantAssignment {
  experimentKey: string;
  variantKey: string;
  /** True if this is the default (paused) variant rather than a bucketed one. */
  isDefault: boolean;
  /** True if the visitor was ineligible for the experiment. */
  isIneligible: boolean;
}

/**
 * Persistence shape: a single exposure record. One row per visitor
 * per experiment (idempotent — re-exposure to the same variant is a
 * no-op; switching variants for the same visitor would only happen
 * if the experiment definition changed mid-flight, which should not
 * happen normally).
 */
export interface ExperimentExposureRecord {
  visitorId: string;
  experimentKey: string;
  variantKey: string;
  /** First-seen timestamp. */
  exposedAt: Date;
  /** Optional niche context at exposure time. */
  nicheSlug: string | null;
}

/**
 * Outcome of a visitor's interaction, attributed to an experiment +
 * variant via the exposure record. The framework doesn't define what
 * "converted" means — that's per-experiment (e.g. completed an intake
 * conversation, clicked a CTA, called the concierge number).
 */
export interface ExperimentConversionRecord {
  visitorId: string;
  experimentKey: string;
  /** Was this visitor exposed before converting? Used to filter. */
  exposedFirst: boolean;
  convertedAt: Date;
  /** Optional payload (revenue, lead ID, etc.). */
  payload?: Record<string, unknown>;
}
