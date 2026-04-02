import { describe, it, expect } from "vitest";
import { niches, getNicheBySlug } from "../niches";

describe("niches", () => {
  it("has exactly 44 niches", () => {
    expect(niches.length).toBe(44);
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
  });

  it("monthly fees are in reasonable range", () => {
    for (const niche of niches) {
      expect(niche.monthlyFee).toBeGreaterThanOrEqual(200);
      expect(niche.monthlyFee).toBeLessThanOrEqual(2000);
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
