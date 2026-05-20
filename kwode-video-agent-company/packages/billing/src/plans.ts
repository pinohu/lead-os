/**
 * Pricing plans — config-only in MVP. No live billing happens unless
 * SAFE_LIVE_BILLING_ENABLED=true AND a real billing connector is wired up.
 */

export interface PricingPlan {
  id: string;
  name: string;
  cadence: "one_time" | "monthly" | "quarterly" | "annual" | "usage";
  priceUSDCents: number;
  description?: string;
  features: string[];
  scope?: Record<string, unknown>;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter-video-pack",
    name: "Starter Video Pack",
    cadence: "one_time",
    priceUSDCents: 29900,
    description: "1 business intro video + 1 service explainer video, delivered as 16:9 and 9:16.",
    features: ["1× business-intro", "1× service-explainer", "captions", "client portal delivery"],
    scope: { videos: 2 },
  },
  {
    id: "monthly-visibility-pack",
    name: "Monthly Visibility Pack",
    cadence: "monthly",
    priceUSDCents: 79900,
    description: "4 short videos / month, captions, 1 GBP video, 1 directory listing refresh.",
    features: ["4× shorts", "captions", "1× gbp-post", "1× directory-listing refresh"],
    scope: { videosPerMonth: 4, listings: 1 },
  },
  {
    id: "premium-lead-growth-pack",
    name: "Premium Lead Growth Pack",
    cadence: "monthly",
    priceUSDCents: 150000, // anchor; range $1500-$2500
    description: "8-12 videos / month, landing page video, ad creatives, service-area videos, reporting.",
    features: [
      "8-12× videos",
      "1× landing-page video",
      "ad creative variants",
      "service-area videos",
      "monthly report",
    ],
    scope: { videosPerMonth: 12, reports: 1 },
  },
  {
    id: "erie-pro-directory-elite-bundle",
    name: "Erie.pro Directory Elite Bundle",
    cadence: "monthly",
    priceUSDCents: 99900, // anchor; range $999-$3000
    description:
      "Premium listing + video-enabled profile + lead tracking + monthly videos + provider reporting.",
    features: [
      "premium directory listing",
      "video-enabled profile",
      "lead tracking",
      "4× monthly videos",
      "provider monthly report",
    ],
    scope: { videosPerMonth: 4, listings: 1, reports: 1 },
  },
];

export function getPlan(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}
