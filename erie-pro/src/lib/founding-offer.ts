// ── Founding-Member Offer ───────────────────────────────────────────
// Launch Kit: first 40 Erie pros get a locked $39/month Pro rate for
// 24 months (normally $99). This module exposes the config and a
// read function for the live slot count. We keep it env-driven so the
// count can be bumped without a redeploy.
//
// Env:
//   NEXT_PUBLIC_FOUNDING_CLAIMED=7   // set to the current live count
//   NEXT_PUBLIC_FOUNDING_TOTAL=40
//   NEXT_PUBLIC_FOUNDING_PRICE=39
//   NEXT_PUBLIC_FOUNDING_NORMAL_PRICE=99
//   NEXT_PUBLIC_FOUNDING_LOCK_MONTHS=24
//
// The public-namespaced values intentionally render on the server
// during SSG, so a new build "bakes in" whatever count we set. The
// route is revalidated hourly so an ISR nudge is enough to refresh.

export interface FoundingOffer {
  /** Total number of founding slots available for the city launch */
  totalSlots: number;
  /** Slots already claimed (sourced from env or DB). */
  claimedSlots: number;
  /** Remaining slots */
  remainingSlots: number;
  /** Locked monthly price for founders (USD) */
  price: number;
  /** Regular monthly price after the promo ends */
  normalPrice: number;
  /** How many months the locked rate is guaranteed */
  lockMonths: number;
  /** Whether the offer is sold out */
  isSoldOut: boolean;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function getFoundingOffer(): FoundingOffer {
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
  };
}
