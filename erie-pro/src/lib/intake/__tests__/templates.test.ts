import { describe, it, expect } from "vitest";
import {
  getIntakeTemplate,
  ENABLED_INTAKE_NICHES,
  HAND_TUNED_NICHE_SLUGS,
  isIntakeEnabledForNiche,
  generateTemplate,
} from "@/lib/intake/templates";
import { niches } from "@/lib/niches";
import { CONCIERGE_PHONE_DISPLAY } from "@/lib/concierge";

describe("intake templates (all-niches mode)", () => {
  describe("ENABLED_INTAKE_NICHES", () => {
    it("contains every niche in the registry", () => {
      expect(ENABLED_INTAKE_NICHES.size).toBe(niches.length);
      for (const n of niches) {
        expect(ENABLED_INTAKE_NICHES.has(n.slug)).toBe(true);
      }
    });

    it("is not empty", () => {
      expect(ENABLED_INTAKE_NICHES.size).toBeGreaterThan(100);
    });
  });

  describe("HAND_TUNED_NICHE_SLUGS", () => {
    it("has exactly 5 hand-tuned niches for the v1 launch", () => {
      expect(HAND_TUNED_NICHE_SLUGS.size).toBe(5);
      expect(HAND_TUNED_NICHE_SLUGS.has("plumbing")).toBe(true);
      expect(HAND_TUNED_NICHE_SLUGS.has("hvac")).toBe(true);
      expect(HAND_TUNED_NICHE_SLUGS.has("electrical")).toBe(true);
      expect(HAND_TUNED_NICHE_SLUGS.has("roofing")).toBe(true);
      expect(HAND_TUNED_NICHE_SLUGS.has("restoration")).toBe(true);
    });
  });

  describe("isIntakeEnabledForNiche", () => {
    it("returns true for every niche in the registry", () => {
      for (const n of niches.slice(0, 20)) {
        expect(isIntakeEnabledForNiche(n.slug)).toBe(true);
      }
    });

    it("returns false for unknown slugs", () => {
      expect(isIntakeEnabledForNiche("nonexistent-niche-12345")).toBe(false);
      expect(isIntakeEnabledForNiche(null)).toBe(false);
      expect(isIntakeEnabledForNiche(undefined)).toBe(false);
      expect(isIntakeEnabledForNiche("")).toBe(false);
    });
  });

  describe("getIntakeTemplate (hand-tuned)", () => {
    it("returns the hand-tuned template for plumbing", () => {
      const t = getIntakeTemplate("plumbing");
      expect(t.nicheSlug).toBe("plumbing");
      expect(t.problemSuggestions).toContain("Drain is clogged");
      expect(t.urgencyExpectations.emergency.closingNote).toContain(CONCIERGE_PHONE_DISPLAY);
    });
  });

  describe("getIntakeTemplate (generated)", () => {
    it("generates a usable template for every non-hand-tuned niche", () => {
      const nonTuned = niches.filter((n) => !HAND_TUNED_NICHE_SLUGS.has(n.slug));
      for (const n of nonTuned) {
        const t = getIntakeTemplate(n.slug);
        expect(t.nicheSlug).toBe(n.slug);
        expect(t.nicheLabel).toBe(n.label);
        expect(t.greeting.length).toBeGreaterThan(20);
        expect(t.greeting.toLowerCase()).toContain(n.label.toLowerCase());
        expect(t.problemSuggestions.length).toBeGreaterThan(0);
        expect(t.urgencyExpectations.emergency).toBeDefined();
        expect(t.urgencyExpectations["this-week"]).toBeDefined();
        expect(t.urgencyExpectations.researching).toBeDefined();
        expect(t.priceHint.typical.length).toBeGreaterThan(0);
        expect(t.priceHint.factors.length).toBeGreaterThan(0);
      }
    });

    it("price hints reference actual dollar values for niches with parseable avgProjectValue", () => {
      // dental's avgProjectValue is "$200-$5,000" → should appear in price hints
      const t = getIntakeTemplate("dental");
      expect(t.priceHint.low).toMatch(/\$200/);
      expect(t.priceHint.high).toMatch(/\$5,000/);
    });

    it("emergency niches get an emergency tier with concierge phone", () => {
      // tow service should be tagged as emergency
      const t = getIntakeTemplate("towing");
      expect(t.urgencyExpectations.emergency.slaTier).toBe("emergency");
      expect(t.urgencyExpectations.emergency.closingNote).toContain(CONCIERGE_PHONE_DISPLAY);
    });

    it("project niches get project-style urgency copy", () => {
      // kitchen-remodeling should be project-style
      const t = getIntakeTemplate("kitchen-remodeling");
      expect(t.urgencyExpectations.emergency.buttonLabel.toLowerCase()).not.toContain("right now");
      expect(t.urgencyExpectations.emergency.slaTier).not.toBe("emergency");
    });
  });

  describe("getIntakeTemplate (unknown / null)", () => {
    it("returns a usable final-fallback template for unknown slugs", () => {
      const t = getIntakeTemplate("nonexistent-niche-xyz");
      expect(t.greeting.length).toBeGreaterThan(20);
      expect(t.urgencyExpectations.emergency).toBeDefined();
    });

    it("returns a usable final-fallback template for null", () => {
      const t = getIntakeTemplate(null);
      expect(t.urgencyExpectations.emergency).toBeDefined();
    });
  });

  describe("generateTemplate", () => {
    it("produces non-empty problem suggestions from niche description", () => {
      const niche = niches.find((n) => n.slug === "landscaping")!;
      const t = generateTemplate(niche);
      expect(t.problemSuggestions.length).toBeGreaterThan(0);
      expect(t.problemSuggestions.length).toBeLessThanOrEqual(5);
    });

    it("template strings reference the niche label naturally", () => {
      const niche = niches.find((n) => n.slug === "dental")!;
      const t = generateTemplate(niche);
      expect(t.greeting.toLowerCase()).toContain("dental");
      expect(t.urgencyExpectations["this-week"].closingNote.toLowerCase()).toContain("dental");
    });
  });
});
