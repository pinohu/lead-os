// src/lib/pricing/safety-policy.ts
// Hard limits, cooldown gates, kill switch, and ENABLE_LIVE_PRICING gate for applies.

export interface SafetyEvaluationInput {
  tenantId: string;
  skuKey: string;
  currentPriceCents: number;
  proposedPriceCents: number;
  basePriceCents: number;
  lastChangedAt: Date | null;
  now: Date;
  /** When false, caller should record shadow recommendations only (no apply). */
  livePricingEnabled?: boolean;
}

export interface SafetyEvaluationResult {
  allowed: boolean;
  finalPriceCents: number;
  blockedReasons: string[];
  policySnapshot: Record<string, unknown>;
}

function readMaxAbsChangeFraction(): number {
  const raw = Number(process.env.PRICING_MAX_ABS_CHANGE_PCT ?? 0.05);
  if (!Number.isFinite(raw) || raw <= 0 || raw > 0.5) return 0.05;
  return raw;
}

function readMinIntervalMs(): number {
  const raw = Number(process.env.PRICING_MIN_CHANGE_INTERVAL_MS ?? 3_600_000);
  if (!Number.isFinite(raw) || raw < 60_000) return 3_600_000;
  return Math.floor(raw);
}

function readKillSwitch(): boolean {
  return process.env.PRICING_KILL_SWITCH === "true";
}

export function readLivePricingFlag(input: SafetyEvaluationInput): boolean {
  if (input.livePricingEnabled === false) return false;
  if (input.livePricingEnabled === true) return true;
  if (process.env.ENABLE_LIVE_PRICING === "true" || process.env.ENABLE_LIVE_PRICING === "1") return true;
  return false;
}

function readFloorFractionOfBase(): number {
  const raw = Number(process.env.PRICING_FLOOR_OF_BASE_PCT ?? 0.5);
  if (!Number.isFinite(raw) || raw <= 0 || raw > 1) return 0.5;
  return raw;
}

function readCeilFractionOfBase(): number {
  const raw = Number(process.env.PRICING_CEIL_OF_BASE_PCT ?? 2.0);
  if (!Number.isFinite(raw) || raw < 1 || raw > 10) return 2.0;
  return raw;
}

function basePolicySnapshot(input: SafetyEvaluationInput): Record<string, unknown> {
  return {
    killSwitch: readKillSwitch(),
    enableLivePricing: readLivePricingFlag(input),
    maxAbsChangePct: readMaxAbsChangeFraction(),
    minIntervalMs: readMinIntervalMs(),
    floorOfBasePct: readFloorFractionOfBase(),
    ceilOfBasePct: readCeilFractionOfBase(),
  };
}

/** Structural + interval checks for shadow recommendations (ignores ENABLE_LIVE_PRICING). */
export function evaluateShadowStructuralSafety(input: SafetyEvaluationInput): SafetyEvaluationResult {
  const blockedReasons: string[] = [];
  const policySnapshot: Record<string, unknown> = {
    ...basePolicySnapshot(input),
    mode: "shadow_structural",
  };

  if (readKillSwitch()) {
    blockedReasons.push("PRICING_KILL_SWITCH=true");
    return {
      allowed: false,
      finalPriceCents: input.currentPriceCents,
      blockedReasons,
      policySnapshot,
    };
  }

  return applyStructuralConstraints(input, blockedReasons, policySnapshot);
}

/** Full gate including ENABLE_LIVE_PRICING — used before mutating production prices. */
export function evaluateSafety(input: SafetyEvaluationInput): SafetyEvaluationResult {
  const blockedReasons: string[] = [];
  const policySnapshot: Record<string, unknown> = {
    ...basePolicySnapshot(input),
    mode: "apply",
  };

  if (!readLivePricingFlag(input)) {
    blockedReasons.push("ENABLE_LIVE_PRICING_not_active_shadow_only");
    return {
      allowed: false,
      finalPriceCents: input.currentPriceCents,
      blockedReasons,
      policySnapshot,
    };
  }

  if (readKillSwitch()) {
    blockedReasons.push("PRICING_KILL_SWITCH=true");
    return {
      allowed: false,
      finalPriceCents: input.currentPriceCents,
      blockedReasons,
      policySnapshot,
    };
  }

  return applyStructuralConstraints(input, blockedReasons, policySnapshot);
}

function applyStructuralConstraints(
  input: SafetyEvaluationInput,
  blockedReasons: string[],
  policySnapshot: Record<string, unknown>,
): SafetyEvaluationResult {
  const floorCents = Math.max(1, Math.floor(input.basePriceCents * readFloorFractionOfBase()));
  const ceilCents = Math.max(floorCents, Math.ceil(input.basePriceCents * readCeilFractionOfBase()));

  let candidate = input.proposedPriceCents;
  if (candidate < floorCents) {
    candidate = floorCents;
    blockedReasons.push("floored_to_base_ratio");
  }
  if (candidate > ceilCents) {
    candidate = ceilCents;
    blockedReasons.push("capped_to_base_ratio");
  }

  const maxDelta = Math.floor(input.currentPriceCents * readMaxAbsChangeFraction());
  const lower = input.currentPriceCents - maxDelta;
  const upper = input.currentPriceCents + maxDelta;
  if (candidate < lower) {
    candidate = Math.max(floorCents, lower);
    blockedReasons.push("max_abs_change_pct_down");
  }
  if (candidate > upper) {
    candidate = Math.min(ceilCents, upper);
    blockedReasons.push("max_abs_change_pct_up");
  }

  if (input.lastChangedAt) {
    const elapsed = input.now.getTime() - input.lastChangedAt.getTime();
    if (elapsed < readMinIntervalMs()) {
      blockedReasons.push("min_change_interval");
      return {
        allowed: false,
        finalPriceCents: input.currentPriceCents,
        blockedReasons,
        policySnapshot: { ...policySnapshot, elapsedMs: elapsed },
      };
    }
  }

  if (candidate === input.currentPriceCents) {
    return {
      allowed: false,
      finalPriceCents: input.currentPriceCents,
      blockedReasons: blockedReasons.length ? blockedReasons : ["no_material_change"],
      policySnapshot,
    };
  }

  return {
    allowed: true,
    finalPriceCents: candidate,
    blockedReasons,
    policySnapshot,
  };
}
