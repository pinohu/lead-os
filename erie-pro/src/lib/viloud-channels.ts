/**
 * Viloud TV channel ID mapping per niche.
 *
 * Each niche maps to a Viloud channel ID (32-char hex). Set to null until the
 * channel is created in Viloud's dashboard. The ViloudChannelEmbed component
 * gracefully skips rendering when a channel is unset, so this can be filled in
 * incrementally as channels go live.
 *
 * To populate: create the channel in Viloud → copy the channel ID from the
 * embed code (the hex string after `/channel/`) → replace null with the ID
 * (as a string) for the relevant niche slug.
 *
 * Curation docs: `docs/viloud-curation/{niche-slug}.md` for content guidance.
 *
 * Embed URL format:
 *   //app.viloud.tv/player/embed/channel/{CHANNEL_ID}?autoplay=1&volume=1&controls=1&title=1&share=1
 */

export const VILOUD_CHANNEL_IDS: Record<string, string | null> = {
  "plumbing": null, // PRIORITY
  "hvac": null, // PRIORITY
  "electrical": null, // PRIORITY
  "roofing": null, // PRIORITY
  "landscaping": null,
  "dental": null,
  "legal": null,
  "cleaning": null,
  "auto-repair": null,
  "pest-control": null,
  "painting": null,
  "real-estate": null,
  "garage-door": null,
  "fencing": null,
  "flooring": null,
  "windows-doors": null,
  "moving": null,
  "tree-service": null,
  "appliance-repair": null,
  "foundation": null,
  "home-security": null,
  "concrete": null,
  "septic": null,
  "chimney": null,
  "pool-spa": null,
  "locksmith": null,
  "towing": null,
  "carpet-cleaning": null,
  "pressure-washing": null,
  "drywall": null,
  "insulation": null,
  "solar": null,
  "gutters": null,
  "handyman": null,
  "veterinary": null,
  "chiropractic": null,
  "accounting": null,
  "photography": null,
  "pet-grooming": null,
  "snow-removal": null,
  "restoration": null, // PRIORITY
  "glass": null,
  "irrigation": null,
  "demolition": null,
  "general-contractor": null,
  "home-remodeling": null,
  "kitchen-remodeling": null,
  "bathroom-remodeling": null,
  "siding": null,
  "decks-patios": null,
  "basement-finishing": null,
  "mold-remediation": null,
  "fire-damage-restoration": null,
  "storm-damage-repair": null,
  "water-heater-services": null,
  "drain-cleaning": null,
  "sewer-line-repair": null,
  "ac-repair": null,
  "furnace-repair": null,
  "duct-cleaning": null,
  "driveway-paving": null,
  "asphalt-sealing": null,
  "junk-removal": null,
  "dumpster-rental": null,
  "home-inspection": null,
  "property-management": null,
  "rental-turnover-cleaning": null,
  "commercial-cleaning": null,
  "commercial-snow-removal": null,
  "home-builders": null,
  "outdoor-lighting": null,
  "holiday-lighting": null,
  "fence-repair": null,
  "retaining-walls": null,
  "epoxy-flooring": null,
  "closet-storage-systems": null,
  "cabinet-refinishing": null,
  "countertops": null,
  "tile-installation": null,
  "smart-home-installation": null,
  "ev-charger-installation": null,
  "generator-installation": null,
  "radon-testing-mitigation": null,
  "wildlife-removal": null,
  "bat-removal": null,
  "bee-wasp-removal": null,
  "septic-inspection": null,
  "well-water-testing": null,
  "boat-repair-marine-services": null,
  "dock-installation-repair": null,
  "marina-boat-winterization": null,
  "ice-dam-removal": null,
  "emergency-board-up": null,
  "basement-flood-cleanup": null,
  "lakefront-property-maintenance": null,
  "vacation-rental-cleaning": null,
  "airbnb-property-management": null,
  "snow-plow-contractors": null,
  "salt-deicing-services": null,
  "storm-window-repair": null,
  "optometry": null,
  "dermatology": null,
  "physical-therapy": null,
  "mental-health-counseling": null,
  "senior-home-care": null,
  "home-health-care": null,
  "hearing-aids-audiology": null,
  "funeral-homes": null,
  "insurance-agents": null,
  "financial-advisors": null,
  "mortgage-brokers": null,
  "estate-sale-services": null,
};

/**
 * Returns the Viloud channel ID for a niche slug, or null if not yet configured.
 */
export function getViloudChannelId(nicheSlug: string): string | null {
  return VILOUD_CHANNEL_IDS[nicheSlug] ?? null;
}

/**
 * Returns the full Viloud embed URL for a niche, or null if unset.
 */
export function getViloudEmbedUrl(nicheSlug: string): string | null {
  const id = getViloudChannelId(nicheSlug);
  if (!id) return null;
  return `https://app.viloud.tv/player/embed/channel/${id}?autoplay=1&volume=1&controls=1&title=1&share=1`;
}

/**
 * Priority niches — first 5 to launch. Curate these first; expand from here.
 */
export const VILOUD_PRIORITY_NICHES = ["plumbing", "hvac", "electrical", "roofing", "restoration"] as const;
