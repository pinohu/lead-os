import { describe, it, expect } from "vitest";
import {
  makePrng,
  rngPick,
  rngWeightedPick,
  decideFunnelOutcome,
  buildConversation,
  generateCreatedAt,
  pickNiche,
  STEP_ORDER,
} from "@/lib/intake/demo-data";

describe("makePrng", () => {
  it("is deterministic for a given seed", () => {
    const a = makePrng(42);
    const b = makePrng(42);
    expect(a()).toBeCloseTo(b(), 10);
    expect(a()).toBeCloseTo(b(), 10);
    expect(a()).toBeCloseTo(b(), 10);
  });

  it("differs across seeds", () => {
    const a = makePrng(1);
    const b = makePrng(2);
    expect(a()).not.toBeCloseTo(b(), 5);
  });

  it("produces values in [0, 1)", () => {
    const rng = makePrng(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("rngWeightedPick", () => {
  it("favors heavier weights statistically", () => {
    const rng = makePrng(7);
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 10_000; i++) {
      const pick = rngWeightedPick(rng, ["a", "b", "c"], [1, 10, 100]);
      counts[pick]++;
    }
    // c should dominate, b should beat a
    expect(counts.c).toBeGreaterThan(counts.b);
    expect(counts.b).toBeGreaterThan(counts.a);
  });
});

describe("decideFunnelOutcome", () => {
  it("produces a realistic mix of outcomes over many trials", () => {
    const rng = makePrng(99);
    const stats: Record<string, number> = {
      completed: 0,
      abandoned: 0,
      in_progress: 0,
      error: 0,
    };
    for (let i = 0; i < 10_000; i++) {
      stats[decideFunnelOutcome(rng).outcomeStatus]++;
    }
    // Completion rate should be in the 25-45% band given the retention chain
    const completionRate = stats.completed / 10_000;
    expect(completionRate).toBeGreaterThan(0.20);
    expect(completionRate).toBeLessThan(0.50);
    // Error rate ~5%
    expect(stats.error / 10_000).toBeGreaterThan(0.03);
    expect(stats.error / 10_000).toBeLessThan(0.08);
    // Abandoned should be the biggest single bucket
    expect(stats.abandoned).toBeGreaterThan(stats.completed);
  });
});

describe("buildConversation", () => {
  it("builds a completed conversation with all steps + contact info", () => {
    const rng = makePrng(1);
    const c = buildConversation(rng, {
      niche: "plumbing",
      furthestStep: "complete",
      outcomeStatus: "completed",
      includeNicheSwitch: false,
      createdAt: new Date("2026-05-10T10:00:00Z"),
    });
    expect(c.currentStep).toBe("complete");
    expect(c.outcomeStatus).toBe("completed");
    expect(c.contact).toBeDefined();
    expect(c.contact!.email).toMatch(/@erie\.pro\.demo$/); // recognizable demo email
    expect(c.outcome.contact?.tcpaConsent).toBe(true);
    expect(c.messages.length).toBeGreaterThan(6);
  });

  it("builds an abandoned conversation that stops at the bail step", () => {
    const rng = makePrng(2);
    const c = buildConversation(rng, {
      niche: "hvac",
      furthestStep: "urgency",
      outcomeStatus: "abandoned",
      includeNicheSwitch: false,
      createdAt: new Date("2026-05-10T10:00:00Z"),
    });
    expect(c.currentStep).toBe("urgency");
    expect(c.outcomeStatus).toBe("abandoned");
    expect(c.contact).toBeUndefined();
    // problem text should still be set
    expect(c.outcome.problemDescription).toBeDefined();
  });

  it("includes a user-correction message when includeNicheSwitch is true", () => {
    const rng = makePrng(3);
    const c = buildConversation(rng, {
      niche: "dental",
      furthestStep: "complete",
      outcomeStatus: "completed",
      includeNicheSwitch: true,
      createdAt: new Date("2026-05-10T10:00:00Z"),
    });
    const switchMsg = c.messages.find(
      (m) => (m.meta as { classifierSource?: string } | undefined)?.classifierSource === "user-correction"
    );
    expect(switchMsg).toBeDefined();
    // The switch should have updated the primaryNiche away from the original
    expect(c.outcome.primaryNiche).not.toBe("dental");
    expect(c.outcome.primaryNicheConfidence).toBe(1.0);
  });

  it("occasionally produces orphan-completed (no lead) for analytics testing", () => {
    let orphanCount = 0;
    let completedCount = 0;
    for (let seed = 0; seed < 500; seed++) {
      const rng = makePrng(seed);
      const c = buildConversation(rng, {
        niche: "plumbing",
        furthestStep: "complete",
        outcomeStatus: "completed",
        includeNicheSwitch: false,
        createdAt: new Date("2026-05-10T10:00:00Z"),
      });
      completedCount++;
      if (c.isOrphan) orphanCount++;
    }
    // Orphan rate should be ~5% across many seeds
    expect(orphanCount).toBeGreaterThan(10); // at least some
    expect(orphanCount).toBeLessThan(50);    // not too many
  });

  it("timestamps messages monotonically (each later than previous)", () => {
    const rng = makePrng(5);
    const c = buildConversation(rng, {
      niche: "plumbing",
      furthestStep: "complete",
      outcomeStatus: "completed",
      includeNicheSwitch: false,
      createdAt: new Date("2026-05-10T10:00:00Z"),
    });
    for (let i = 1; i < c.messages.length; i++) {
      const prev = new Date(c.messages[i - 1].at!).getTime();
      const curr = new Date(c.messages[i].at!).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

describe("generateCreatedAt", () => {
  it("stays within the requested days-back window", () => {
    const rng = makePrng(7);
    const now = new Date("2026-05-17T12:00:00Z");
    for (let i = 0; i < 500; i++) {
      const d = generateCreatedAt(rng, 30, now);
      const ageMs = now.getTime() - d.getTime();
      const ageDays = ageMs / 86400000;
      expect(ageDays).toBeGreaterThanOrEqual(-0.5); // allow same-day with hour shift
      expect(ageDays).toBeLessThanOrEqual(30.5);
    }
  });

  it("skews recent (more samples in the last 7 days than the first 7)", () => {
    const rng = makePrng(11);
    const now = new Date("2026-05-17T12:00:00Z");
    const recent7 = now.getTime() - 7 * 86400000;
    const old7 = now.getTime() - 23 * 86400000;
    let recentCount = 0;
    let oldCount = 0;
    for (let i = 0; i < 1000; i++) {
      const d = generateCreatedAt(rng, 30, now).getTime();
      if (d >= recent7) recentCount++;
      else if (d <= old7) oldCount++;
    }
    expect(recentCount).toBeGreaterThan(oldCount);
  });
});

describe("pickNiche", () => {
  it("returns a valid niche from the weighted distribution", () => {
    const rng = makePrng(13);
    for (let i = 0; i < 100; i++) {
      const n = pickNiche(rng);
      expect(typeof n).toBe("string");
      expect(n.length).toBeGreaterThan(0);
    }
  });

  it("favors common niches (plumbing/HVAC) over rare ones", () => {
    const rng = makePrng(17);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      const n = pickNiche(rng);
      counts[n] = (counts[n] ?? 0) + 1;
    }
    expect(counts["plumbing"]).toBeGreaterThan(counts["fencing"]);
    expect(counts["hvac"]).toBeGreaterThan(counts["moving"]);
  });
});

describe("STEP_ORDER", () => {
  it("has the expected six steps in funnel order", () => {
    expect(STEP_ORDER).toEqual([
      "problem",
      "location",
      "urgency",
      "budget",
      "contact",
      "complete",
    ]);
  });
});
