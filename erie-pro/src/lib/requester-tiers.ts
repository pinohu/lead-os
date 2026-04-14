// ── Requester-side Tiers ────────────────────────────────────────────
// Launch Kit + Broker Strategy: matching is free for every requester
// by default. Concierge and Annual are optional upgrades that sit
// beside the match form — not in front of it.
//
//   Free         — post a request, we match one pro, done.
//   Concierge    — $29 per job. We call 2–3 pros on your behalf,
//                  confirm price + availability, and text you back
//                  with the one to book.
//   Annual       — $199/year. Unlimited Concierge jobs for a year,
//                  same-day priority, and a member-only reliability
//                  guarantee.
//
// These IDs are used as Stripe `metadata.plan` values so the
// webhook can grant access without a second mapping.

export type RequesterTier = "free" | "concierge" | "annual";

export interface RequesterTierConfig {
  id: RequesterTier;
  name: string;
  price: number;            // USD, 0 for free
  cadence: "free" | "per-job" | "yearly";
  tagline: string;
  blurb: string;
  benefits: string[];
  cta: string;
  stripePriceEnv?: string;  // env var holding the Stripe price ID
  featured?: boolean;
}

export const REQUESTER_TIERS: Record<RequesterTier, RequesterTierConfig> = {
  free: {
    id: "free",
    name: "Free Match",
    price: 0,
    cadence: "free",
    tagline: "The default. Always free.",
    blurb:
      "Post one request, we match one local pro, you book. No bidding, no spam, no credit card.",
    benefits: [
      "One request matched to one pro",
      "Typical match time: under 2 hours, 9am–7pm",
      "No credit card, no obligation",
      "Swap your match once if it isn't a fit",
    ],
    cta: "Get matched free",
  },
  concierge: {
    id: "concierge",
    name: "Concierge",
    price: 29,
    cadence: "per-job",
    tagline: "We do the calling for you.",
    blurb:
      "Perfect when you want it handled. We call 2–3 vetted pros, confirm price + availability, and text you the one to book.",
    benefits: [
      "We call 2–3 pros on your behalf",
      "Price + availability pre-confirmed before you hear back",
      "Same-day response on weekdays",
      "Refunded if we can't find a match",
    ],
    cta: "Upgrade to Concierge — $29",
    stripePriceEnv: "STRIPE_PRICE_CONCIERGE",
    featured: true,
  },
  annual: {
    id: "annual",
    name: "Annual Member",
    price: 199,
    cadence: "yearly",
    tagline: "Best if you'll use this a few times a year.",
    blurb:
      "Unlimited Concierge jobs for 12 months, same-day priority, and our reliability guarantee on every match.",
    benefits: [
      "Unlimited Concierge matches for 12 months",
      "Same-day priority on every request",
      "Reliability guarantee: if a pro no-shows, we replace + credit you $50",
      "Pays for itself after 7 jobs",
    ],
    cta: "Become a member — $199/yr",
    stripePriceEnv: "STRIPE_PRICE_ANNUAL",
  },
};

export const REQUESTER_TIER_ORDER: RequesterTier[] = [
  "free",
  "concierge",
  "annual",
];

export function getRequesterTier(tier: RequesterTier): RequesterTierConfig {
  return REQUESTER_TIERS[tier];
}

export function getAllRequesterTiers(): RequesterTierConfig[] {
  return REQUESTER_TIER_ORDER.map((id) => REQUESTER_TIERS[id]);
}
