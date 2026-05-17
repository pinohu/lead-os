import { describe, it, expect } from "vitest";
import {
  getDiyVsProContent,
  getRedFlagsContent,
  getWhatToExpectContent,
} from "@/lib/niche/educational-content";
import { niches } from "@/lib/niches";

describe("educational content generator", () => {
  describe("getDiyVsProContent", () => {
    it("returns 3 tiers for every niche in the registry", () => {
      for (const n of niches) {
        const content = getDiyVsProContent(n.slug);
        expect(content.tiers.length).toBe(3);
        expect(content.tiers[0].toneSlug).toBe("diy");
        expect(content.tiers[1].toneSlug).toBe("skilled-diy");
        expect(content.tiers[2].toneSlug).toBe("pro-only");
      }
    });

    it("returns 5 FAQ items for every niche", () => {
      for (const n of niches) {
        const content = getDiyVsProContent(n.slug);
        expect(content.faq.length).toBe(5);
        for (const f of content.faq) {
          expect(f.q.length).toBeGreaterThan(10);
          expect(f.a.length).toBeGreaterThan(40);
        }
      }
    });

    it("plumbing has tuned content (mentions water shutoff or pipes)", () => {
      const c = getDiyVsProContent("plumbing");
      const flat = JSON.stringify(c).toLowerCase();
      expect(flat).toMatch(/water|pipe|valve|shutoff|faucet/);
    });

    it("electrical has tuned content (mentions breaker or panel)", () => {
      const c = getDiyVsProContent("electrical");
      const flat = JSON.stringify(c).toLowerCase();
      expect(flat).toMatch(/breaker|panel|circuit|outlet|wiring/);
    });

    it("hvac has tuned content (mentions refrigerant or furnace)", () => {
      const c = getDiyVsProContent("hvac");
      const flat = JSON.stringify(c).toLowerCase();
      expect(flat).toMatch(/refrigerant|furnace|filter|hvac|tune-up/);
    });

    it("falls back to generic for non-tuned niches without crashing", () => {
      const c = getDiyVsProContent("pet-grooming");
      expect(c.tiers.length).toBe(3);
      expect(c.faq.length).toBe(5);
      expect(c.intro.length).toBeGreaterThan(20);
    });

    it("returns non-empty examples in every tier", () => {
      for (const n of niches) {
        const content = getDiyVsProContent(n.slug);
        for (const tier of content.tiers) {
          expect(tier.examples.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("getRedFlagsContent", () => {
    it("returns the three severity tiers populated for every niche", () => {
      for (const n of niches) {
        const c = getRedFlagsContent(n.slug);
        expect(c.earlyWarnings.length).toBeGreaterThan(0);
        expect(c.midSeverity.length).toBeGreaterThan(0);
        expect(c.urgent.length).toBeGreaterThan(0);
        expect(c.faq.length).toBeGreaterThanOrEqual(4);
      }
    });

    it("each red-flag entry has sign + meaning + action", () => {
      const c = getRedFlagsContent("plumbing");
      for (const tier of [c.earlyWarnings, c.midSeverity, c.urgent]) {
        for (const flag of tier) {
          expect(flag.sign.length).toBeGreaterThan(5);
          expect(flag.meaning.length).toBeGreaterThan(10);
          expect(["watch", "schedule", "urgent"]).toContain(flag.action);
        }
      }
    });

    it("urgent tier always has at least 3 entries (real emergencies)", () => {
      for (const n of niches) {
        const c = getRedFlagsContent(n.slug);
        expect(c.urgent.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("cost-of-delay framing is non-trivial", () => {
      for (const n of niches) {
        const c = getRedFlagsContent(n.slug);
        expect(c.costOfDelay.length).toBeGreaterThan(50);
      }
    });
  });

  describe("getWhatToExpectContent", () => {
    it("returns four populated timeline steps for every niche", () => {
      for (const n of niches) {
        const c = getWhatToExpectContent(n.slug);
        for (const step of [
          c.beforeAppointment,
          c.atArrival,
          c.duringWork,
          c.afterCompletion,
        ]) {
          expect(step.title.length).toBeGreaterThan(5);
          expect(step.description.length).toBeGreaterThan(20);
          expect(step.bullets.length).toBeGreaterThanOrEqual(4);
        }
      }
    });

    it("pro red flags list is non-empty", () => {
      for (const n of niches) {
        const c = getWhatToExpectContent(n.slug);
        expect(c.proRedFlags.length).toBeGreaterThanOrEqual(4);
      }
    });

    it("pricing norms always populated", () => {
      for (const n of niches) {
        const c = getWhatToExpectContent(n.slug);
        expect(c.pricingNorms.length).toBeGreaterThan(50);
      }
    });

    it("faq has at least 5 entries with proper q/a shape", () => {
      for (const n of niches) {
        const c = getWhatToExpectContent(n.slug);
        expect(c.faq.length).toBeGreaterThanOrEqual(5);
        for (const f of c.faq) {
          expect(f.q.length).toBeGreaterThan(5);
          expect(f.a.length).toBeGreaterThan(30);
        }
      }
    });
  });
});
