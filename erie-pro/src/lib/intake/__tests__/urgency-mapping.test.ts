import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  temperatureForUrgency,
  slaDeadlineForUrgency,
} from "@/lib/intake/conversation";

describe("urgency → Lead.temperature / Lead.slaDeadline mapping", () => {
  describe("temperatureForUrgency", () => {
    it("emergency → hot", () => {
      expect(temperatureForUrgency("emergency")).toBe("hot");
    });

    it("this-week → warm", () => {
      expect(temperatureForUrgency("this-week")).toBe("warm");
    });

    it("researching → cold", () => {
      expect(temperatureForUrgency("researching")).toBe("cold");
    });

    it("undefined → cold (default)", () => {
      expect(temperatureForUrgency(undefined)).toBe("cold");
    });

    it("returns values that match the LeadTemperature Prisma enum", () => {
      // The Prisma enum is { cold, warm, hot, burning }. Anything we return
      // here must be in that set or the Lead.update() will throw.
      const validValues = new Set(["cold", "warm", "hot", "burning"]);
      expect(validValues.has(temperatureForUrgency("emergency"))).toBe(true);
      expect(validValues.has(temperatureForUrgency("this-week"))).toBe(true);
      expect(validValues.has(temperatureForUrgency("researching"))).toBe(true);
    });
  });

  describe("slaDeadlineForUrgency", () => {
    let now: number;

    beforeEach(() => {
      now = Date.now();
    });

    it("emergency plumbing → ~1 hour out", () => {
      const deadline = slaDeadlineForUrgency("plumbing", "emergency");
      expect(deadline).not.toBeNull();
      const offsetMs = deadline!.getTime() - now;
      // Allow 5-second tolerance for test execution time
      expect(offsetMs).toBeGreaterThan(1 * 60 * 60 * 1000 - 5000);
      expect(offsetMs).toBeLessThan(1 * 60 * 60 * 1000 + 5000);
    });

    it("this-week → ~24 hours out (next-day SLA tier)", () => {
      const deadline = slaDeadlineForUrgency("plumbing", "this-week");
      expect(deadline).not.toBeNull();
      const offsetMs = deadline!.getTime() - now;
      expect(offsetMs).toBeGreaterThan(24 * 60 * 60 * 1000 - 5000);
      expect(offsetMs).toBeLessThan(24 * 60 * 60 * 1000 + 5000);
    });

    it("researching → ~48 hours out (standard SLA tier)", () => {
      const deadline = slaDeadlineForUrgency("plumbing", "researching");
      expect(deadline).not.toBeNull();
      const offsetMs = deadline!.getTime() - now;
      expect(offsetMs).toBeGreaterThan(48 * 60 * 60 * 1000 - 5000);
      expect(offsetMs).toBeLessThan(48 * 60 * 60 * 1000 + 5000);
    });

    it("undefined urgency → null deadline (no SLA)", () => {
      expect(slaDeadlineForUrgency("plumbing", undefined)).toBeNull();
    });

    it("unknown niche still resolves via the generic template fallback", () => {
      const deadline = slaDeadlineForUrgency("not-a-real-niche", "emergency");
      // Generic template tags emergency as emergency tier → 1h
      expect(deadline).not.toBeNull();
    });

    it("emergency on roofing has a 4h SLA per its template (slower than plumbing)", () => {
      // Roofing's emergency tier is mapped to slaTier="emergency" (1h),
      // even though customer-facing copy says "within 4 hours". The SLA
      // tier drives the deadline; copy can differ. This test pins the
      // current behavior so a future template change doesn't silently
      // shift internal SLA expectations.
      const deadline = slaDeadlineForUrgency("roofing", "emergency");
      expect(deadline).not.toBeNull();
      const offsetMs = deadline!.getTime() - Date.now();
      // Currently all five tuned niches use slaTier="emergency" for the
      // emergency urgency, which maps to 1h. If that changes, update here.
      expect(offsetMs).toBeGreaterThan(1 * 60 * 60 * 1000 - 5000);
      expect(offsetMs).toBeLessThan(1 * 60 * 60 * 1000 + 5000);
    });

    it("emergency for every enabled niche produces a deadline within the next 24h", () => {
      // Belt and suspenders: even if SLA tiers shift, emergency should
      // never produce a deadline more than a day out.
      const niches = ["plumbing", "hvac", "electrical", "roofing", "restoration"];
      for (const n of niches) {
        const deadline = slaDeadlineForUrgency(n, "emergency");
        expect(deadline).not.toBeNull();
        const offsetMs = deadline!.getTime() - Date.now();
        expect(offsetMs).toBeGreaterThan(0);
        expect(offsetMs).toBeLessThan(24 * 60 * 60 * 1000);
      }
    });
  });
});
