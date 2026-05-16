import { describe, it, expect } from "vitest";
import {
  getIntakeTemplate,
  ENABLED_INTAKE_NICHES,
  isIntakeEnabledForNiche,
} from "@/lib/intake/templates";

describe("intake templates", () => {
  describe("ENABLED_INTAKE_NICHES", () => {
    it("includes the v1 launch set of 5 niches", () => {
      expect(ENABLED_INTAKE_NICHES.size).toBe(5);
      expect(ENABLED_INTAKE_NICHES.has("plumbing")).toBe(true);
      expect(ENABLED_INTAKE_NICHES.has("hvac")).toBe(true);
      expect(ENABLED_INTAKE_NICHES.has("electrical")).toBe(true);
      expect(ENABLED_INTAKE_NICHES.has("roofing")).toBe(true);
      expect(ENABLED_INTAKE_NICHES.has("restoration")).toBe(true);
    });

    it("excludes non-launch niches", () => {
      expect(ENABLED_INTAKE_NICHES.has("dental")).toBe(false);
      expect(ENABLED_INTAKE_NICHES.has("legal")).toBe(false);
      expect(ENABLED_INTAKE_NICHES.has("cleaning")).toBe(false);
    });
  });

  describe("isIntakeEnabledForNiche", () => {
    it("returns true for enabled niches", () => {
      expect(isIntakeEnabledForNiche("plumbing")).toBe(true);
      expect(isIntakeEnabledForNiche("hvac")).toBe(true);
    });

    it("returns false for disabled niches", () => {
      expect(isIntakeEnabledForNiche("dental")).toBe(false);
      expect(isIntakeEnabledForNiche("unknown-niche-slug")).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isIntakeEnabledForNiche(null)).toBe(false);
      expect(isIntakeEnabledForNiche(undefined)).toBe(false);
      expect(isIntakeEnabledForNiche("")).toBe(false);
    });
  });

  describe("getIntakeTemplate", () => {
    it("returns the tuned template for an enabled niche", () => {
      const t = getIntakeTemplate("plumbing");
      expect(t.nicheSlug).toBe("plumbing");
      expect(t.nicheLabel).toBe("Plumbing");
      expect(t.enabled).toBe(true);
      expect(t.problemSuggestions.length).toBeGreaterThan(0);
      expect(t.priceHint.typical).toMatch(/\$\d+/);
    });

    it("returns a generic fallback template for an unknown niche", () => {
      const t = getIntakeTemplate("dental");
      expect(t.enabled).toBe(false);
      expect(t.nicheSlug).toBe("dental");
      expect(t.nicheLabel).toBe("Dental");
      expect(t.greeting).toContain("dental");
    });

    it("returns a generic fallback template for null", () => {
      const t = getIntakeTemplate(null);
      expect(t.enabled).toBe(false);
      expect(t.nicheSlug).toBe("unknown");
    });

    it("has all three urgency expectations for every enabled niche", () => {
      for (const slug of ENABLED_INTAKE_NICHES) {
        const t = getIntakeTemplate(slug);
        expect(t.urgencyExpectations.emergency).toBeDefined();
        expect(t.urgencyExpectations["this-week"]).toBeDefined();
        expect(t.urgencyExpectations.researching).toBeDefined();
        expect(t.urgencyExpectations.emergency.slaTier).toBe("emergency");
      }
    });

    it("urgency expectations have non-empty closing notes", () => {
      for (const slug of ENABLED_INTAKE_NICHES) {
        const t = getIntakeTemplate(slug);
        for (const u of ["emergency", "this-week", "researching"] as const) {
          expect(t.urgencyExpectations[u].closingNote.length).toBeGreaterThan(20);
          expect(t.urgencyExpectations[u].buttonLabel.length).toBeGreaterThan(5);
        }
      }
    });

    it("emergency expectations mention the concierge phone for unmatched lanes", () => {
      // Spot check: at least one enabled niche should reference the concierge
      const plumbing = getIntakeTemplate("plumbing");
      expect(plumbing.urgencyExpectations.emergency.closingNote).toContain("(814) 200-0328");
    });
  });
});
