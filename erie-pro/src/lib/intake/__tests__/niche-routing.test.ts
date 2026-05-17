import { describe, it, expect } from "vitest";
import { decideNicheRouting } from "@/lib/intake/conversation";

describe("decideNicheRouting", () => {
  describe("when classifier returns a high-confidence primary", () => {
    it("uses the classifier primary (no hint)", () => {
      const r = decideNicheRouting(
        { primary: "plumbing", candidates: [{ slug: "plumbing", confidence: 0.8 }] },
        null
      );
      expect(r.primaryNiche).toBe("plumbing");
      expect(r.decision).toBe("classifier-primary");
    });

    it("uses the classifier primary even if it disagrees with the hint", () => {
      const r = decideNicheRouting(
        { primary: "plumbing", candidates: [{ slug: "plumbing", confidence: 0.8 }] },
        "dental"
      );
      expect(r.primaryNiche).toBe("plumbing");
      expect(r.decision).toBe("classifier-primary");
    });
  });

  describe("when classifier has sub-threshold candidates that disagree with the hint", () => {
    it("routes to the top candidate, NOT the hint (this is the bug we fixed)", () => {
      // Scenario: customer on /dental types "my toilet is leaking"
      // Classifier returns plumbing at 0.3 confidence — below the 0.4 threshold
      // for `primary`, but above the 0.25 candidate-override threshold.
      const r = decideNicheRouting(
        {
          primary: null,
          candidates: [{ slug: "plumbing", confidence: 0.3 }],
        },
        "dental"
      );
      expect(r.primaryNiche).toBe("plumbing");
      expect(r.decision).toBe("candidate-override");
    });

    it("does not override the hint if the top candidate is very weak (< 0.25)", () => {
      // Below the override floor — fall back to hint
      const r = decideNicheRouting(
        {
          primary: null,
          candidates: [{ slug: "plumbing", confidence: 0.1 }],
        },
        "dental"
      );
      expect(r.primaryNiche).toBe("dental");
      expect(r.decision).toBe("hint");
    });
  });

  describe("when hint matches a candidate", () => {
    it("uses the hint (consistent with the page context)", () => {
      const r = decideNicheRouting(
        {
          primary: null,
          candidates: [
            { slug: "plumbing", confidence: 0.35 },
            { slug: "dental", confidence: 0.3 },
          ],
        },
        "plumbing"
      );
      // Hint IS in candidates → use hint, not override
      expect(r.primaryNiche).toBe("plumbing");
      expect(r.decision).toBe("hint");
    });
  });

  describe("when classifier returns no signal", () => {
    it("falls back to the hint", () => {
      const r = decideNicheRouting(
        { primary: null, candidates: [] },
        "plumbing"
      );
      expect(r.primaryNiche).toBe("plumbing");
      expect(r.decision).toBe("hint");
    });

    it("returns ambiguous when there's no hint either", () => {
      const r = decideNicheRouting(
        { primary: null, candidates: [] },
        null
      );
      expect(r.primaryNiche).toBeNull();
      expect(r.decision).toBe("ambiguous");
    });
  });

  describe("edge cases", () => {
    it("handles empty candidates with no hint as ambiguous", () => {
      const r = decideNicheRouting(
        { primary: null, candidates: [] },
        null
      );
      expect(r.decision).toBe("ambiguous");
    });

    it("handles homepage (no hint) with high-confidence candidate via classifier-primary", () => {
      const r = decideNicheRouting(
        { primary: "hvac", candidates: [{ slug: "hvac", confidence: 0.7 }] },
        null
      );
      expect(r.primaryNiche).toBe("hvac");
      expect(r.decision).toBe("classifier-primary");
    });

    it("handles homepage with sub-threshold candidate as ambiguous (no hint to fall back to)", () => {
      const r = decideNicheRouting(
        { primary: null, candidates: [{ slug: "hvac", confidence: 0.3 }] },
        null
      );
      // No hint, no high-confidence primary — should be ambiguous
      // (the user gets a "did you mean?" prompt with candidate visible)
      expect(r.primaryNiche).toBeNull();
      expect(r.decision).toBe("ambiguous");
    });

    it("exactly at the 0.25 override threshold counts as override", () => {
      const r = decideNicheRouting(
        { primary: null, candidates: [{ slug: "plumbing", confidence: 0.25 }] },
        "dental"
      );
      expect(r.decision).toBe("candidate-override");
    });

    it("just below the 0.25 override threshold falls back to hint", () => {
      const r = decideNicheRouting(
        { primary: null, candidates: [{ slug: "plumbing", confidence: 0.24 }] },
        "dental"
      );
      expect(r.decision).toBe("hint");
      expect(r.primaryNiche).toBe("dental");
    });
  });
});
