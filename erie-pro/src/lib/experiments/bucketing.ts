// ── Variant bucketing ────────────────────────────────────────────────
// Pure function that maps a (visitorId, experimentKey) pair to a
// variant according to the experiment's weights. Consistent hashing
// ensures the same visitor always gets the same variant for a given
// experiment, across sessions and devices that share the cookie.

import type {
  ExperimentDef,
  ExperimentContext,
  VariantAssignment,
} from "@/lib/experiments/types";

/**
 * FNV-1a 32-bit hash. Fast, no dependencies, more than enough entropy
 * for variant bucketing. Output is uint32.
 */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Return a value in [0, 100) for (visitorId, experimentKey, nicheSlug).
 *
 * Salts: experimentKey isolates different experiments, nicheSlug isolates
 * niche-scoped variants of the same experiment. Global (cross-niche)
 * experiments should pass `null`/undefined for `nicheSlug` and will salt
 * with the literal "global" so all visitors fall into a single space.
 */
export function hashToBucket(
  visitorId: string,
  experimentKey: string,
  nicheSlug?: string | null
): number {
  const nicheSalt = nicheSlug ?? "global";
  return fnv1a32(`${experimentKey}::${visitorId}::${nicheSalt}`) % 10000 / 100;
}

/**
 * Resolve a variant for this visitor against the experiment definition.
 * Pure: same input always produces the same output.
 */
export function assignVariant(
  exp: ExperimentDef,
  ctx: ExperimentContext
): VariantAssignment {
  // Validate weights at runtime — fail loudly on misconfiguration
  const totalWeight = exp.variants.reduce((s, v) => s + v.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error(
      `Experiment "${exp.key}" weights sum to ${totalWeight}, expected 100`
    );
  }

  // Eligibility check
  if (exp.eligible && !exp.eligible(ctx)) {
    return {
      experimentKey: exp.key,
      variantKey: exp.defaultVariant ?? exp.variants[0].key,
      isDefault: true,
      isIneligible: true,
    };
  }

  // Paused → default
  if (exp.paused) {
    return {
      experimentKey: exp.key,
      variantKey: exp.defaultVariant ?? exp.variants[0].key,
      isDefault: true,
      isIneligible: false,
    };
  }

  // Already ended → default (analytics still works on past exposures)
  if (exp.endedAt && new Date(exp.endedAt).getTime() < Date.now()) {
    return {
      experimentKey: exp.key,
      variantKey: exp.defaultVariant ?? exp.variants[0].key,
      isDefault: true,
      isIneligible: false,
    };
  }

  // Bucket the visitor. nicheSlug is carried on the ExperimentContext
  // so cross-niche experiments can keep a single hash space ("global")
  // while niche-specific variants stay isolated per niche.
  const bucket = hashToBucket(
    ctx.visitorId,
    exp.key,
    (ctx as { nicheSlug?: string | null }).nicheSlug ?? null
  );
  let cumulative = 0;
  for (const v of exp.variants) {
    cumulative += v.weight;
    if (bucket < cumulative) {
      return {
        experimentKey: exp.key,
        variantKey: v.key,
        isDefault: false,
        isIneligible: false,
      };
    }
  }
  // Floating-point edge case at exactly 100; fall to last variant
  return {
    experimentKey: exp.key,
    variantKey: exp.variants[exp.variants.length - 1].key,
    isDefault: false,
    isIneligible: false,
  };
}

/**
 * Convenience: assign multiple experiments at once. Returns a map
 * keyed by experimentKey for the caller to look up.
 */
export function assignVariants(
  experiments: readonly ExperimentDef[],
  ctx: ExperimentContext
): Record<string, VariantAssignment> {
  const result: Record<string, VariantAssignment> = {};
  for (const exp of experiments) {
    result[exp.key] = assignVariant(exp, ctx);
  }
  return result;
}
