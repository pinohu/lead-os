import { describe, it, expect } from "vitest";
import { niches, getNicheBySlug } from "../niches";
import { additionalNicheSlugs } from "../additional-niches";
import { getGlossaryTerms } from "../glossary-data";
import { getNicheContent } from "../niche-content";
import { getSeasonalGuide } from "../seasonal-data";

describe("niches", () => {
  it("has the base catalog plus all expansion niches", () => {
    expect(additionalNicheSlugs.length).toBe(68);
    expect(niches.length).toBe(112);
  });

  it("all niches have required fields", () => {
    for (const niche of niches) {
      expect(niche.slug).toBeTruthy();
      expect(niche.label).toBeTruthy();
      expect(niche.icon).toBeTruthy();
      expect(niche.description).toBeTruthy();
      expect(niche.searchTerms.length).toBeGreaterThan(0);
      expect(niche.avgProjectValue).toBeTruthy();
      expect(niche.monthlyFee).toBeGreaterThan(0);
      expect(typeof niche.exclusiveAvailable).toBe("boolean");
    }
  });

  it("all slugs are unique", () => {
    const slugs = niches.map((n) => n.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("slugs are lowercase and kebab-case", () => {
    for (const niche of niches) {
      expect(niche.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("includes key niches", () => {
    const slugs = niches.map((n) => n.slug);
    expect(slugs).toContain("plumbing");
    expect(slugs).toContain("hvac");
    expect(slugs).toContain("electrical");
    expect(slugs).toContain("roofing");
    expect(slugs).toContain("dental");
    expect(slugs).toContain("legal");
    expect(slugs).toContain("general-contractor");
    expect(slugs).toContain("mold-remediation");
    expect(slugs).toContain("marina-boat-winterization");
    expect(slugs).toContain("senior-home-care");
  });

  it("monthly fees are in reasonable range", () => {
    for (const niche of niches) {
      expect(niche.monthlyFee).toBeGreaterThanOrEqual(200);
      expect(niche.monthlyFee).toBeLessThanOrEqual(2000);
    }
  });

  it("registers every expansion niche in the main catalog", () => {
    const slugs = new Set(niches.map((n) => n.slug));

    for (const slug of additionalNicheSlugs) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("generates content resources for every niche", () => {
    for (const niche of niches) {
      const content = getNicheContent(niche.slug);

      expect(content, niche.slug).toBeDefined();
      expect(content!.faqItems.length, niche.slug).toBeGreaterThan(0);
      expect(content!.blogTopics.length, niche.slug).toBeGreaterThan(0);
      expect(content!.pricingRanges.length, niche.slug).toBeGreaterThan(0);
    }
  });

  it("generates seasonal and glossary resources for every niche", () => {
    for (const niche of niches) {
      expect(getSeasonalGuide(niche.slug), niche.slug).toBeDefined();
      expect(getGlossaryTerms(niche.slug).length, niche.slug).toBeGreaterThan(0);
    }
  });
});

describe("getNicheBySlug", () => {
  it("finds plumbing", () => {
    const niche = getNicheBySlug("plumbing");
    expect(niche).toBeDefined();
    expect(niche!.label).toBe("Plumbing");
  });

  it("finds auto-repair (kebab-case)", () => {
    const niche = getNicheBySlug("auto-repair");
    expect(niche).toBeDefined();
    expect(niche!.label).toBe("Auto Repair");
  });

  it("returns undefined for unknown niche", () => {
    expect(getNicheBySlug("underwater-welding")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getNicheBySlug("")).toBeUndefined();
  });
});
