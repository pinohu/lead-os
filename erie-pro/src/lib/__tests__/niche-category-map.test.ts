/**
 * Unit tests for the niche → Google-category relevance map.
 *
 * The map is used by both:
 *   - scrape-google-places.ts to filter out adjacent businesses
 *     returned by Outscraper's broad-keyword search (e.g. a Walmart
 *     for the "bat removal" query, a car wash for the "pressure
 *     washing" query).
 *   - audit-directory-quality.ts to identify already-stored listings
 *     whose categories don't match the niche.
 *
 * These tests pin down the public contract: which (categories, niche)
 * pairs are deemed relevant vs. irrelevant, and why.
 */

import { describe, expect, it } from "vitest"
import { evaluateNicheRelevance } from "../niche-category-map"

describe("evaluateNicheRelevance — relevant cases", () => {
  it("accepts a clean positive match", () => {
    const r = evaluateNicheRelevance(["Plumber"], "plumbing")
    expect(r.relevant).toBe(true)
  })

  it("accepts a place with multiple categories where one matches", () => {
    const r = evaluateNicheRelevance(
      ["Auto body shop", "Auto repair shop", "Brake shop"],
      "auto-repair",
    )
    expect(r.relevant).toBe(true)
  })

  it("passes through niches not in the map", () => {
    const r = evaluateNicheRelevance(["Some Random Category"], "made-up-niche")
    expect(r.relevant).toBe(true)
  })

  it("passes through places with no categories", () => {
    const r = evaluateNicheRelevance([], "plumbing")
    expect(r.relevant).toBe(true)
  })

  it("accepts a place whose category contains the keyword as a substring", () => {
    // "Plumbing supply store" contains "plumb" — matches.
    const r = evaluateNicheRelevance(["Plumbing supply store"], "plumbing")
    expect(r.relevant).toBe(true)
  })

  it("accepts a borderline case in non-strict mode", () => {
    // A general contractor in `decks-patios` — no perfect match but
    // not anti-pattern either. Non-strict mode lets it through.
    const r = evaluateNicheRelevance(["General contractor"], "decks-patios")
    expect(r.relevant).toBe(true)
  })

  it("does NOT reject auto repair shops that also offer inspection", () => {
    // This is the bug from the first run of audit-directory-quality.
    // "Car inspection station" is NOT a hard anti-pattern for
    // auto-repair, and the listing has a positive "Auto repair shop"
    // match anyway.
    const r = evaluateNicheRelevance(
      ["Auto repair shop", "Car inspection station", "Brake shop"],
      "auto-repair",
    )
    expect(r.relevant).toBe(true)
  })

  it("does NOT reject a real auto body shop where storm-damage-repair is not the niche", () => {
    // The auto body shop categories trip the storm-damage-repair
    // anti-pattern, but NOT the (correct) auto-repair niche.
    const r = evaluateNicheRelevance(
      ["Auto body shop", "Auto repair shop"],
      "auto-repair",
    )
    expect(r.relevant).toBe(true)
  })
})

describe("evaluateNicheRelevance — hard-anti-pattern rejections", () => {
  it("rejects a car wash returned for the pressure-washing query", () => {
    const r = evaluateNicheRelevance(["Car wash"], "pressure-washing")
    expect(r.relevant).toBe(false)
    if (!r.relevant && r.reason === "hard-anti-pattern") {
      expect(r.matchedAntiPattern).toContain("car wash")
    } else {
      throw new Error("Expected hard-anti-pattern rejection")
    }
  })

  it("rejects an auto body shop returned for the storm-damage-repair query", () => {
    const r = evaluateNicheRelevance(["Auto body shop"], "storm-damage-repair")
    expect(r.relevant).toBe(false)
    if (!r.relevant) {
      expect(r.reason).toBe("hard-anti-pattern")
    }
  })

  it("rejects a hotel returned for the pool-spa query", () => {
    const r = evaluateNicheRelevance(
      ["Hotel", "Meeting planning service", "Wedding venue"],
      "pool-spa",
    )
    expect(r.relevant).toBe(false)
  })

  it("rejects an apartment complex returned for lakefront-property-maintenance", () => {
    const r = evaluateNicheRelevance(["Apartment complex"], "lakefront-property-maintenance")
    expect(r.relevant).toBe(false)
  })

  it("rejects a public-health-department for mental-health-counseling", () => {
    const r = evaluateNicheRelevance(["Public health department"], "mental-health-counseling")
    expect(r.relevant).toBe(false)
  })

  it("rejects a pet supply store for pet-grooming", () => {
    const r = evaluateNicheRelevance(["Pet supply store", "Pet store"], "pet-grooming")
    expect(r.relevant).toBe(false)
  })
})

describe("evaluateNicheRelevance — anti-pattern + positive match keeps the listing", () => {
  // Critical: a place can have an anti-pattern category AND a positive
  // category. The filter is supposed to KEEP these (the positive
  // category dominates). The audit-directory-quality script relies on
  // this to avoid deactivating legit shops.

  it("keeps a place that has both an anti-pattern and a positive match", () => {
    // A car wash that also happens to offer pressure washing would
    // include both "Car wash" and "Pressure washing service" in its
    // categories. The positive match keeps it.
    const r = evaluateNicheRelevance(
      ["Car wash", "Pressure washing service"],
      "pressure-washing",
    )
    expect(r.relevant).toBe(true)
  })

  it("keeps Lou's Auto Body in auto-repair (positive match dominates)", () => {
    // Real data from the directory: "Lou's Auto Body" has
    // ["Auto body shop", "Auto repair shop"]. In auto-repair niche,
    // there's no anti-pattern for "auto body shop", AND there's a
    // positive match on "auto repair". Relevant.
    const r = evaluateNicheRelevance(
      ["Auto body shop", "Auto repair shop"],
      "auto-repair",
    )
    expect(r.relevant).toBe(true)
  })
})

describe("evaluateNicheRelevance — strict mode", () => {
  it("rejects in strict mode when no positive keyword match", () => {
    // "Construction company" doesn't match any of the dental-niche
    // expected keywords. In strict mode, this gets rejected.
    const r = evaluateNicheRelevance(["Construction company"], "dental", { strict: true })
    expect(r.relevant).toBe(false)
    if (!r.relevant) expect(r.reason).toBe("no-keyword-match-strict-mode")
  })

  it("accepts in strict mode when there IS a positive keyword match", () => {
    const r = evaluateNicheRelevance(["Dentist"], "dental", { strict: true })
    expect(r.relevant).toBe(true)
  })

  it("anti-pattern still rejects in strict mode", () => {
    const r = evaluateNicheRelevance(["Car wash"], "pressure-washing", { strict: true })
    expect(r.relevant).toBe(false)
    if (!r.relevant) expect(r.reason).toBe("hard-anti-pattern")
  })
})

describe("evaluateNicheRelevance — case-insensitivity", () => {
  it("matches regardless of category casing", () => {
    expect(evaluateNicheRelevance(["PLUMBER"], "plumbing").relevant).toBe(true)
    expect(evaluateNicheRelevance(["plumber"], "plumbing").relevant).toBe(true)
    expect(evaluateNicheRelevance(["Plumber"], "plumbing").relevant).toBe(true)
  })

  it("rejects anti-patterns regardless of casing", () => {
    expect(evaluateNicheRelevance(["CAR WASH"], "pressure-washing").relevant).toBe(false)
    expect(evaluateNicheRelevance(["car wash"], "pressure-washing").relevant).toBe(false)
  })
})
