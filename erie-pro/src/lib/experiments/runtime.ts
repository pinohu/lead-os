// ── Experiment runtime helpers ───────────────────────────────────────
// DB-touching helpers for the A/B testing framework. The pure logic
// lives in bucketing.ts and analytics.ts; this file wires them to
// Prisma + the visitor cookie.
//
// Usage in a page or API route:
//
//   const visitorId = await getVisitorId();
//   const assignment = assignVariant(DID_YOU_MEAN_UI, { visitorId });
//   // Render based on assignment.variantKey
//   await recordExposure(visitorId, assignment);
//
//   // Later, when the conversion event happens:
//   await recordConversion(visitorId, "intake_did_you_mean_ui", { leadId });

import { prisma } from "@/lib/db";
import type {
  VariantAssignment,
  ExperimentExposureRecord,
  ExperimentConversionRecord,
} from "@/lib/experiments/types";
import { logger } from "@/lib/logger";

/**
 * Record that a visitor saw a specific variant. Idempotent — the unique
 * (visitorId, experimentKey) constraint ensures re-exposures are no-ops.
 *
 * We INTENTIONALLY don't update the variant if the visitor was already
 * exposed; the first variant assignment is sticky. This protects against
 * experiment-definition changes mid-flight from re-bucketing existing
 * visitors.
 */
export async function recordExposure(
  visitorId: string,
  assignment: VariantAssignment,
  nicheSlug?: string | null
): Promise<void> {
  // Don't record exposures for default/paused/ineligible variants —
  // those aren't actually part of the experiment for analytics purposes.
  if (assignment.isDefault || assignment.isIneligible) return;

  try {
    await prisma.experimentExposure.upsert({
      where: {
        visitorId_experimentKey: {
          visitorId,
          experimentKey: assignment.experimentKey,
        },
      },
      create: {
        visitorId,
        experimentKey: assignment.experimentKey,
        variantKey: assignment.variantKey,
        nicheSlug: nicheSlug ?? null,
      },
      update: {}, // sticky — never reassign
    });
  } catch (err) {
    // Exposure recording must never break the user experience.
    // Log and swallow.
    logger.warn(
      "experiments/runtime",
      `Failed to record exposure for ${assignment.experimentKey}/${visitorId}: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Record a conversion event. `exposedFirst` is determined automatically
 * by checking whether the visitor has an exposure row for this experiment
 * created BEFORE the conversion timestamp.
 *
 * Multiple conversion calls for the same visitor are recorded
 * separately (not deduplicated) so the analytics layer can count unique
 * visitors if needed.
 */
export async function recordConversion(
  visitorId: string,
  experimentKey: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const exposure = await prisma.experimentExposure.findUnique({
      where: {
        visitorId_experimentKey: { visitorId, experimentKey },
      },
      select: { exposedAt: true },
    });

    const exposedFirst = exposure !== null;

    await prisma.experimentConversion.create({
      data: {
        visitorId,
        experimentKey,
        exposedFirst,
        payload: (payload ?? undefined) as object | undefined,
      },
    });
  } catch (err) {
    logger.warn(
      "experiments/runtime",
      `Failed to record conversion for ${experimentKey}/${visitorId}: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Load all exposures + conversions for an experiment within a date range.
 * Used by the admin analytics page; the pure aggregator in
 * `analytics.ts` does the actual math.
 */
export async function loadExperimentData(
  experimentKey: string,
  rangeStart: Date,
  rangeEnd: Date = new Date()
): Promise<{
  exposures: ExperimentExposureRecord[];
  conversions: ExperimentConversionRecord[];
}> {
  const [rawExposures, rawConversions] = await Promise.all([
    prisma.experimentExposure.findMany({
      where: {
        experimentKey,
        exposedAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        visitorId: true,
        experimentKey: true,
        variantKey: true,
        nicheSlug: true,
        exposedAt: true,
      },
      take: 50_000, // safety cap
    }),
    prisma.experimentConversion.findMany({
      where: {
        experimentKey,
        convertedAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        visitorId: true,
        experimentKey: true,
        exposedFirst: true,
        convertedAt: true,
        payload: true,
      },
      take: 50_000,
    }),
  ]);

  return {
    exposures: rawExposures.map((e) => ({
      visitorId: e.visitorId,
      experimentKey: e.experimentKey,
      variantKey: e.variantKey,
      nicheSlug: e.nicheSlug,
      exposedAt: e.exposedAt,
    })),
    conversions: rawConversions.map((c) => ({
      visitorId: c.visitorId,
      experimentKey: c.experimentKey,
      exposedFirst: c.exposedFirst,
      convertedAt: c.convertedAt,
      payload: (c.payload as Record<string, unknown> | null) ?? undefined,
    })),
  };
}
