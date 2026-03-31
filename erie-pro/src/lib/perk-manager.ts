// ── Automatic Perk Management System ────────────────────────────────
// Activates/deactivates ALL premium benefits based on subscription status.
// When a provider stops paying, everything disables automatically.
// When a new provider claims the territory, everything activates for them.
// EVERY perk check is a function call — never hardcoded.

import { getProviderByNicheAndCity, type ProviderProfile } from "./provider-store";
import { TIER_BENEFITS, type ProviderTier } from "./premium-rewards";

// ── Types ──────────────────────────────────────────────────────────

export interface PerkSet {
  featuredBadge: boolean;
  nationalListing: boolean;
  reviewAutomation: boolean;
  brandedContent: boolean;
  gbpOptimization: boolean;
  socialMentions: boolean;
  competitorIntel: boolean;
  priorityPlacement: boolean;
}

export interface PerkStatus {
  niche: string;
  city: string;
  providerId: string | null;
  providerName: string | null;
  subscriptionActive: boolean;
  tier: ProviderTier | null;
  perks: PerkSet;
  activatedAt: string | null;
  deactivatedAt: string | null;
}

// ── In-Memory Territory Store ──────────────────────────────────────
// Key format: "niche::city" (lowercase)

interface TerritoryRecord {
  niche: string;
  city: string;
  providerId: string;
  providerName: string;
  tier: ProviderTier;
  activatedAt: string;
  deactivatedAt: string | null;
}

const territories: Map<string, TerritoryRecord> = new Map();

function territoryKey(niche: string, city: string): string {
  return `${niche.toLowerCase()}::${city.toLowerCase()}`;
}

// ── Perk Derivation ────────────────────────────────────────────────
// All perks are derived from tier — no manual flags anywhere.

function derivePerks(tier: ProviderTier): PerkSet {
  const benefits = TIER_BENEFITS[tier];
  return {
    featuredBadge: benefits.featured,
    nationalListing: benefits.nationalDirectoryListing,
    reviewAutomation: benefits.reviewAutomation,
    brandedContent: benefits.brandedContent,
    gbpOptimization: benefits.gbpOptimization,
    socialMentions: benefits.socialMediaMentions > 0,
    competitorIntel: benefits.competitorIntelligence,
    priorityPlacement: benefits.priorityPlacement,
  };
}

const EMPTY_PERKS: PerkSet = {
  featuredBadge: false,
  nationalListing: false,
  reviewAutomation: false,
  brandedContent: false,
  gbpOptimization: false,
  socialMentions: false,
  competitorIntel: false,
  priorityPlacement: false,
};

// ── Seed Territories from Provider Store ───────────────────────────
// On module load, sync active providers into the territory map.

function seedFromProviderStore(): void {
  // Import niches for niche slugs
  const nicheList = [
    "plumbing", "hvac", "electrical", "roofing", "landscaping", "dental",
    "legal", "cleaning", "auto-repair", "pest-control", "painting",
    "real-estate", "garage-door", "fencing", "flooring", "windows-doors",
    "moving", "tree-service", "appliance-repair", "foundation",
    "home-security", "concrete", "septic", "chimney",
  ];

  for (const niche of nicheList) {
    const provider = getProviderByNicheAndCity(niche, "erie");
    if (provider && provider.subscriptionStatus === "active") {
      const key = territoryKey(niche, "erie");
      // Map legacy tier names to ProviderTier
      const tier = mapProviderTier(provider);
      territories.set(key, {
        niche,
        city: "erie",
        providerId: provider.id,
        providerName: provider.businessName,
        tier,
        activatedAt: provider.claimedAt,
        deactivatedAt: null,
      });
    }
  }
}

function mapProviderTier(provider: ProviderProfile): ProviderTier {
  // The provider-store uses "primary"/"backup"/"overflow" as tier.
  // Map to premium-rewards tier system based on monthlyFee thresholds.
  if (provider.monthlyFee >= 800) return "elite";
  if (provider.monthlyFee >= 500) return "premium";
  return "standard";
}

// Run seed on module load
seedFromProviderStore();

// ── Core Functions ─────────────────────────────────────────────────

export function getPerkStatus(niche: string, city: string): PerkStatus {
  const key = territoryKey(niche, city);
  const record = territories.get(key);

  if (!record || record.deactivatedAt) {
    return {
      niche,
      city,
      providerId: null,
      providerName: null,
      subscriptionActive: false,
      tier: null,
      perks: { ...EMPTY_PERKS },
      activatedAt: null,
      deactivatedAt: record?.deactivatedAt ?? null,
    };
  }

  return {
    niche,
    city,
    providerId: record.providerId,
    providerName: record.providerName,
    subscriptionActive: true,
    tier: record.tier,
    perks: derivePerks(record.tier),
    activatedAt: record.activatedAt,
    deactivatedAt: null,
  };
}

export function activatePerks(
  niche: string,
  city: string,
  providerId: string,
  providerName: string,
  tier: ProviderTier
): PerkStatus {
  const key = territoryKey(niche, city);
  const now = new Date().toISOString();

  territories.set(key, {
    niche: niche.toLowerCase(),
    city: city.toLowerCase(),
    providerId,
    providerName,
    tier,
    activatedAt: now,
    deactivatedAt: null,
  });

  return getPerkStatus(niche, city);
}

export function deactivatePerks(niche: string, city: string): PerkStatus {
  const key = territoryKey(niche, city);
  const record = territories.get(key);

  if (record) {
    record.deactivatedAt = new Date().toISOString();
    territories.set(key, record);
  }

  return getPerkStatus(niche, city);
}

export function transferTerritory(
  niche: string,
  city: string,
  newProviderId: string,
  newProviderName: string,
  newTier: ProviderTier
): PerkStatus {
  // Deactivate old provider
  deactivatePerks(niche, city);
  // Activate new provider — new record replaces old
  return activatePerks(niche, city, newProviderId, newProviderName, newTier);
}

// ── Quick Query Helpers ────────────────────────────────────────────

export function isProviderFeatured(niche: string, city: string): boolean {
  const status = getPerkStatus(niche, city);
  return status.perks.featuredBadge;
}

export function getFeaturedProviderName(niche: string, city: string): string | null {
  const status = getPerkStatus(niche, city);
  if (!status.subscriptionActive) return null;
  return status.providerName;
}

export function getFeaturedProviderId(niche: string, city: string): string | null {
  const status = getPerkStatus(niche, city);
  if (!status.subscriptionActive) return null;
  return status.providerId;
}

export function hasPerk(
  niche: string,
  city: string,
  perk: keyof PerkSet
): boolean {
  const status = getPerkStatus(niche, city);
  return status.perks[perk];
}

export function getActiveTerritoryCount(): number {
  let count = 0;
  for (const record of territories.values()) {
    if (!record.deactivatedAt) count++;
  }
  return count;
}

export function getAllActivePerks(): PerkStatus[] {
  const active: PerkStatus[] = [];
  for (const record of territories.values()) {
    if (!record.deactivatedAt) {
      active.push(getPerkStatus(record.niche, record.city));
    }
  }
  return active;
}

// ── Webhook Handler ────────────────────────────────────────────────
// Called by Stripe webhook route when subscription status changes.

export interface SubscriptionChangeEvent {
  type: "subscription.activated" | "subscription.cancelled" | "subscription.updated" | "subscription.expired";
  niche: string;
  city: string;
  providerId: string;
  providerName: string;
  status: "active" | "past_due" | "cancelled" | "expired";
  tier?: ProviderTier;
}

export function handleSubscriptionChange(event: SubscriptionChangeEvent): PerkStatus {
  switch (event.type) {
    case "subscription.activated": {
      return activatePerks(
        event.niche,
        event.city,
        event.providerId,
        event.providerName,
        event.tier ?? "standard"
      );
    }

    case "subscription.updated": {
      // Tier change — re-activate with new tier
      if (event.tier) {
        return activatePerks(
          event.niche,
          event.city,
          event.providerId,
          event.providerName,
          event.tier
        );
      }
      return getPerkStatus(event.niche, event.city);
    }

    case "subscription.cancelled":
    case "subscription.expired": {
      return deactivatePerks(event.niche, event.city);
    }

    default:
      return getPerkStatus(event.niche, event.city);
  }
}
