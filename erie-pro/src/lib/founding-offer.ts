// ── Founding-Member Offer ───────────────────────────────────────────
// Launch Kit: first 40 Erie pros get a locked $39/month Pro rate for
// 24 months (normally $99).
//
// Two sources of truth in priority order:
//   1. Setting table (admin UI mutable, no redeploy)
//   2. NEXT_PUBLIC_FOUNDING_* env vars (fallback for fresh installs)
//
// We expose TWO reader APIs:
//   - getFoundingOfferStatic(): sync, env-only. Safe at build time
//     and in edge middleware. Used for bundling hints.
//   - getFoundingOffer(): async, DB-backed with env fallback. Used
//     by server components that want the live count.

export interface FoundingOffer {
  totalSlots: number;
  claimedSlots: number;
  remainingSlots: number;
  price: number;
  normalPrice: number;
  lockMonths: number;
  isSoldOut: boolean;
  /** "db" if any field came from the Setting table; "env" if pure env fallback. */
  source: "db" | "env";
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Env-only synchronous read. Safe at build time. */
export function getFoundingOfferStatic(): FoundingOffer {
  const totalSlots = envInt("NEXT_PUBLIC_FOUNDING_TOTAL", 40);
  const claimedSlots = Math.min(
    envInt("NEXT_PUBLIC_FOUNDING_CLAIMED", 0),
    totalSlots,
  );
  const remainingSlots = Math.max(0, totalSlots - claimedSlots);

  return {
    totalSlots,
    claimedSlots,
    remainingSlots,
    price: envInt("NEXT_PUBLIC_FOUNDING_PRICE", 39),
    normalPrice: envInt("NEXT_PUBLIC_FOUNDING_NORMAL_PRICE", 99),
    lockMonths: envInt("NEXT_PUBLIC_FOUNDING_LOCK_MONTHS", 24),
    isSoldOut: remainingSlots === 0,
    source: "env",
  };
}

/**
 * DB-backed read with env fallback. Server-only.
 *
 * The settings module is imported lazily so this file stays safe to
 * import from pure-unit tests that don't have DATABASE_URL set.
 */
export async function getFoundingOffer(): Promise<FoundingOffer> {
  const fallback = getFoundingOfferStatic();
  const { getSetting, SETTING_KEYS } = await import("@/lib/settings");

  const [
    dbClaimed,
    dbTotal,
    dbPrice,
    dbNormal,
    dbLock,
  ] = await Promise.all([
    getSetting<number | null>(SETTING_KEYS.foundingClaimed, null),
    getSetting<number | null>(SETTING_KEYS.foundingTotal, null),
    getSetting<number | null>(SETTING_KEYS.foundingPrice, null),
    getSetting<number | null>(SETTING_KEYS.foundingNormalPrice, null),
    getSetting<number | null>(SETTING_KEYS.foundingLockMonths, null),
  ]);

  const touchedDb =
    dbClaimed !== null ||
    dbTotal !== null ||
    dbPrice !== null ||
    dbNormal !== null ||
    dbLock !== null;

  const totalSlots = typeof dbTotal === "number" ? dbTotal : fallback.totalSlots;
  const claimedRaw =
    typeof dbClaimed === "number" ? dbClaimed : fallback.claimedSlots;
  const claimedSlots = Math.min(Math.max(0, claimedRaw), totalSlots);
  const remainingSlots = Math.max(0, totalSlots - claimedSlots);

  return {
    totalSlots,
    claimedSlots,
    remainingSlots,
    price: typeof dbPrice === "number" ? dbPrice : fallback.price,
    normalPrice:
      typeof dbNormal === "number" ? dbNormal : fallback.normalPrice,
    lockMonths: typeof dbLock === "number" ? dbLock : fallback.lockMonths,
    isSoldOut: remainingSlots === 0,
    source: touchedDb ? "db" : "env",
  };
}
