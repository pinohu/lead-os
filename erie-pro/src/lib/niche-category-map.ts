/**
 * Niche → Google Places category mapping.
 *
 * Used by:
 *   - `scripts/scrape-google-places.ts` to filter scraped places before
 *     inserting them as directory listings. Prevents the "Walmart under
 *     bat-removal" pattern that plagued the earlier scrapes when
 *     broad-keyword search returned adjacent businesses.
 *   - `scripts/audit-directory-quality.ts` to identify already-stored
 *     listings whose Google categories don't match the niche they're
 *     filed under.
 *
 * Two maps:
 *
 *   EXPECTED_KEYWORDS — substrings that, if any of a place's Google
 *     categories contains any of these, the place is plausibly in the
 *     niche. Inclusive. Missing keywords just produces soft suspects
 *     (no auto-deactivation).
 *
 *   HARD_ANTI_PATTERNS — substrings that should NEVER appear in a
 *     place's Google categories if it belongs in the given niche.
 *     Used together with the no-positive-match filter to identify
 *     high-confidence mis-categorizations.
 *
 * A scraped place is considered RELEVANT to a niche if EITHER:
 *   (a) at least one Google category contains an expected keyword, AND
 *       no category contains a hard anti-pattern; OR
 *   (b) no expected keywords are defined for this niche (passthrough).
 *
 * It is considered IRRELEVANT (and dropped) if:
 *   (a) no Google category contains an expected keyword, AND
 *   (b) at least one Google category contains a hard anti-pattern, OR
 *   (c) it has Google categories at all but none match for niches that
 *       have keywords defined. (Configurable: see `strictMode`.)
 *
 * The default scrape filter uses non-strict mode (drop only on
 * anti-pattern + no positive match) to avoid losing borderline-OK
 * matches when keyword coverage is imperfect.
 */

// ── Expected keyword set per niche ────────────────────────────────
// Substring match (case-insensitive). Each entry should cover the
// most common Google category strings (taxonomy at:
// https://developers.google.com/maps/documentation/places/web-service/supported_types).
export const NICHE_EXPECTED_CATEGORIES: Record<string, string[]> = {
  plumbing: ["plumb", "drain", "water heater", "septic"],
  hvac: ["hvac", "air conditioning", "heating", "furnace", "ventilation", "boiler"],
  electrical: ["electric"],
  roofing: ["roof", "gutter"],
  landscaping: [
    "landscap", "lawn", "garden", "tree service", "mulch", "sod",
    "snow removal", "irrigation", "arborist", "nursery",
  ],
  dental: ["dentist", "dental", "orthodont", "endodont", "periodontist", "oral surgeon"],
  legal: ["lawyer", "attorney", "legal", "law firm", "paralegal", "notary"],
  cleaning: ["clean", "janitor", "maid", "restoration"],
  "auto-repair": [
    "auto repair", "mechanic", "car repair", "tire", "oil change",
    "transmission", "brake", "body shop",
  ],
  "pest-control": ["pest", "exterminat", "termite", "wildlife", "bat", "rodent"],
  painting: ["paint"],
  "real-estate": ["real estate", "realtor", "property"],
  "garage-door": ["garage door", "door supplier"],
  fencing: ["fence", "fencing"],
  flooring: ["floor", "carpet", "tile", "hardwood", "rug store"],
  "windows-doors": ["window", "door", "glass"],
  moving: ["moving", "mover", "storage", "truck rental", "logistics"],
  "tree-service": ["tree", "arborist", "stump"],
  "appliance-repair": ["appliance"],
  foundation: ["foundation", "waterproof", "masonry", "concrete", "basement"],
  "home-security": ["security", "alarm", "surveillance", "camera"],
  concrete: ["concrete", "masonry", "paving", "driveway", "contractor", "construction"],
  septic: ["septic", "sewer", "drain", "plumb"],
  chimney: ["chimney", "fireplace", "masonry"],
  "pool-spa": ["pool", "spa", "hot tub"],
  locksmith: ["locksmith", "key", "lock"],
  towing: ["towing", "tow", "roadside"],
  "carpet-cleaning": ["carpet", "rug", "upholstery", "clean"],
  "pressure-washing": ["pressure wash", "power wash", "soft wash"],
  drywall: ["drywall", "plaster", "dry wall", "contractor"],
  insulation: ["insulation", "insulator"],
  solar: ["solar", "photovoltaic"],
  gutters: ["gutter", "roof", "siding"],
  handyman: ["handyman", "home repair", "general contractor", "remodeler"],
  veterinary: ["veterinar", "animal hospital"],
  chiropractic: ["chiropract"],
  accounting: ["accountant", "cpa", "bookkeep", "tax", "financial"],
  photography: ["photograph", "photo studio", "portrait"],
  "pet-grooming": ["pet groom", "dog groom", "cat groom", "pet wash"],
  "snow-removal": ["snow", "plow", "de-icing", "lawn", "landscap"],
  restoration: ["restoration", "cleanup", "water damage", "fire damage", "mold"],
  glass: ["glass", "glazing", "window"],
  irrigation: ["irrigation", "sprinkler", "landscap"],
  demolition: ["demolition", "excavation", "excavating", "wrecking"],
  "general-contractor": ["general contractor", "construction", "builder", "remodel", "contractor"],
  "home-remodeling": ["remodel", "renovation", "construction", "home improvement", "interior design"],
  "kitchen-remodeling": ["kitchen", "remodel", "cabinet", "countertop"],
  "bathroom-remodeling": ["bathroom", "remodel"],
  siding: ["siding"],
  "decks-patios": ["deck", "patio", "pergola", "construction", "general contractor"],
  "basement-finishing": ["basement", "remodel", "construction", "waterproof", "foundation", "contractor"],
  "mold-remediation": ["mold", "remediation", "restoration"],
  "fire-damage-restoration": ["fire", "restoration", "cleanup", "water damage"],
  "storm-damage-repair": ["storm", "restoration", "roofing", "damage", "tree service", "emergency"],
  "water-heater-services": ["water heater", "plumb", "heating contractor"],
  "drain-cleaning": ["drain", "plumb", "septic", "sewer"],
  "sewer-line-repair": ["sewer", "plumb", "septic", "drain", "excavat"],
  "ac-repair": ["air conditioning", "hvac", "cooling"],
  "furnace-repair": ["furnace", "hvac", "heating"],
  "duct-cleaning": ["duct", "hvac", "ventilation", "dryer vent"],
  "driveway-paving": ["paving", "asphalt", "concrete", "driveway"],
  "asphalt-sealing": ["asphalt", "paving", "sealing"],
  "junk-removal": ["junk", "waste", "rubbish", "hauling", "cleanout", "recycling", "garbage"],
  "dumpster-rental": ["dumpster", "waste", "container"],
  "home-inspection": ["home inspection", "inspector", "building inspection"],
  "property-management": ["property management", "real estate", "rental"],
  "rental-turnover-cleaning": ["clean", "janitor", "maid"],
  "commercial-cleaning": ["clean", "janitor", "commercial"],
  "commercial-snow-removal": ["snow", "plow", "commercial", "landscap"],
  "home-builders": ["home build", "construction", "builder", "general contractor"],
  "outdoor-lighting": ["lighting", "electric", "landscap"],
  "holiday-lighting": ["lighting", "holiday", "christmas", "event"],
  "fence-repair": ["fence"],
  "retaining-walls": ["retaining wall", "masonry", "concrete", "landscap", "construction"],
  "epoxy-flooring": ["epoxy", "floor", "concrete"],
  "closet-storage-systems": ["closet", "storage", "organize", "cabinet"],
  "cabinet-refinishing": ["cabinet", "refinish", "paint", "kitchen", "millwork", "carpent"],
  countertops: ["countertop", "kitchen", "granite", "quartz"],
  "tile-installation": ["tile", "flooring"],
  "smart-home-installation": ["smart home", "home automation", "electric", "security"],
  "ev-charger-installation": ["electric", "ev charging", "charging station"],
  "generator-installation": ["generator", "electric"],
  "radon-testing-mitigation": ["radon", "environmental", "home inspector"],
  "wildlife-removal": ["wildlife", "animal control", "pest"],
  "bat-removal": ["bat", "wildlife", "animal control", "pest"],
  "bee-wasp-removal": ["bee", "wasp", "pest", "exterminat", "animal control"],
  "septic-inspection": ["septic", "inspection", "plumb"],
  "well-water-testing": ["water", "well", "environmental", "testing"],
  "boat-repair-marine-services": ["boat", "marine", "marina", "shipbuilding"],
  "dock-installation-repair": ["dock", "marine", "marina", "boat"],
  "marina-boat-winterization": ["marina", "boat", "marine"],
  "ice-dam-removal": ["ice dam", "roof", "snow"],
  "emergency-board-up": ["board", "emergency", "restoration", "glass"],
  "basement-flood-cleanup": ["flood", "water damage", "restoration", "basement", "waterproof"],
  "lakefront-property-maintenance": ["property", "landscap", "lakefront", "lawn"],
  "vacation-rental-cleaning": ["clean", "maid", "janitor"],
  "airbnb-property-management": ["property management", "real estate", "rental", "airbnb"],
  "snow-plow-contractors": ["snow", "plow", "landscap"],
  "salt-deicing-services": ["snow", "salt", "de-icing"],
  "storm-window-repair": ["window", "glass", "storm"],
  optometry: ["optometr", "eye", "optical", "optician", "ophthalmolog", "vision"],
  dermatology: ["dermatolog", "skin"],
  "physical-therapy": ["physical therap", "rehab", "sports medicine"],
  "mental-health-counseling": ["mental health", "counselor", "therap", "psycholog", "psychiatr"],
  "senior-home-care": ["senior", "home care", "home health", "assisted living"],
  "home-health-care": ["home care", "home health", "nursing", "health care", "hospice"],
  "hearing-aids-audiology": ["hearing", "audiology", "audiologist", "otolaryngol"],
  "funeral-homes": ["funeral", "cremation", "mortuary"],
  "insurance-agents": ["insurance", "agent"],
  "financial-advisors": ["financial", "wealth", "investment", "advisor"],
  "mortgage-brokers": ["mortgage", "loan", "lending"],
  "estate-sale-services": ["estate sale", "estate liquidation", "auction"],
}

// ── Hard anti-patterns per niche ──────────────────────────────────
// Google category substrings that should NEVER appear in a place
// belonging to this niche. A place is rejected only if it has at
// least one anti-pattern match AND no positive expected-keyword
// match. This pair-rule prevents legit shops (e.g. an auto repair
// shop that lists "Car inspection station" alongside "Auto repair
// shop") from being false-positive rejected.
export const NICHE_HARD_ANTI_PATTERNS: Record<string, string[]> = {
  "storm-damage-repair": ["auto body shop", "car detailing service", "window tinting service", "car wash"],
  "pressure-washing": ["car wash"],
  "carpet-cleaning": ["car wash"],
  "pest-control": ["outdoor sports store", "sporting goods store", "ammunition supplier", "hunting and fishing store"],
  restoration: ["auto repair shop", "furniture repair shop", "pottery classes"],
  painting: ["pottery classes", "art museum", "trade school", "non-profit organization"],
  "pool-spa": ["hotel", "gym", "aquatic center", "meeting planning service", "wedding venue", "baby swimming school"],
  locksmith: ["towing service", "auto wrecker"],
  fencing: ["observation deck", "tourist attraction", "county government office", "city government office"],
  septic: ["water utility company", "water treatment plant", "sewage treatment plant", "city government office"],
  "septic-inspection": ["city government office"],
  "mental-health-counseling": ["public health department"],
  "emergency-board-up": ["public safety office"],
  "dock-installation-repair": ["tourist attraction", "storage facility", "warehouse"],
  "marina-boat-winterization": ["gas station"],
  "funeral-homes": ["cemetery", "monument maker"],
  "estate-sale-services": [
    "produce market", "farm", "farmers' market", "thrift store",
    "gift basket store", "antique store", "real estate agency",
  ],
  "wildlife-removal": ["nature preserve", "hiking area", "animal rescue service"],
  "lakefront-property-maintenance": [
    "apartment complex", "real estate agency", "city government office", "non-profit organization",
  ],
  "home-inspection": ["car inspection station"],
  "home-security": [
    "electronics store", "home theater store", "computer store",
    "video store", "video game store", "music store",
  ],
  "pet-grooming": ["pet supply store", "pet store"],
  cleaning: ["laundromat"],
  "boat-repair-marine-services": ["motorcycle repair shop"],
  siding: ["roofing supply store", "building materials supplier"],
  "tree-service": ["lawn mower store", "garden center"],
  "commercial-snow-removal": ["lawn mower store", "lawn mower repair service"],
  "salt-deicing-services": ["appliance parts supplier", "appliance repair service", "janitorial service"],
  chimney: ["air duct cleaning service", "dryer vent cleaning service"],
  "fire-damage-restoration": ["janitorial service"],
  "mold-remediation": ["plastic fabrication company"],
  "basement-flood-cleanup": ["bathroom remodeler"],
  photography: ["video production service", "film production company", "advertising agency"],
  gutters: ["handyman/handywoman/handyperson"],
  hvac: ["industrial equipment supplier", "air compressor repair service", "air compressor supplier", "electrician"],
  roofing: ["home builder"],
  "storm-window-repair": ["mobile home supply store"],
  "closet-storage-systems": ["material handling equipment supplier", "computer security service"],
  "outdoor-lighting": [
    "home goods store", "bedding store", "boutique", "furniture store",
    "picture frame shop", "rug store",
  ],
  "home-builders": ["mobile home dealer"],
  chiropractic: ["massage therapist", "massage spa", "spa", "wellness center"],
  accounting: ["notary public"],
  "hearing-aids-audiology": ["deaf service"],
  "senior-home-care": ["hospice", "corporate office"],
  "junk-removal": ["recycling center"],
  "mortgage-brokers": ["title company", "escrow service"],
}

// ── Decision: is a scraped place relevant to its target niche? ────

export type Relevance =
  | { relevant: true }
  | { relevant: false; reason: "hard-anti-pattern"; matchedAntiPattern: string }
  | { relevant: false; reason: "no-keyword-match-strict-mode" }

/**
 * Decide whether a scraped Google Places result is relevant to the
 * niche it was searched for.
 *
 * Default (non-strict) behaviour: reject only when there is at least
 * one hard anti-pattern AND no positive keyword match. This is the
 * intended scrape-time filter — it removes the obvious mismatches
 * (e.g. car wash returned for "pressure washing" query) without
 * losing borderline-OK shops that share categories.
 *
 * Strict mode (used by the audit script's read-only soft-suspect
 * pass): reject ANY listing whose categories don't include at least
 * one expected keyword. Higher recall, more false positives.
 */
export function evaluateNicheRelevance(
  categories: ReadonlyArray<string>,
  niche: string,
  options: { strict?: boolean } = {},
): Relevance {
  const lowered = categories.map((c) => String(c).toLowerCase()).filter(Boolean)
  const expected = NICHE_EXPECTED_CATEGORIES[niche]
  const anti = NICHE_HARD_ANTI_PATTERNS[niche]

  // No keywords defined for this niche — pass through.
  if (!expected) return { relevant: true }
  // No categories on the place — keep (don't punish missing data).
  if (lowered.length === 0) return { relevant: true }

  const positiveMatch = lowered.some((cat) =>
    expected.some((kw) => cat.includes(kw)),
  )

  if (anti) {
    const antiHit = lowered.find((cat) =>
      anti.some((bad) => cat.includes(bad)),
    )
    if (antiHit && !positiveMatch) {
      return {
        relevant: false,
        reason: "hard-anti-pattern",
        matchedAntiPattern: antiHit,
      }
    }
  }

  if (options.strict && !positiveMatch) {
    return { relevant: false, reason: "no-keyword-match-strict-mode" }
  }

  return { relevant: true }
}
