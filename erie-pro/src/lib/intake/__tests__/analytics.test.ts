import { describe, it, expect } from "vitest";
import {
  computeIntakeAnalytics,
  type ConversationRow,
} from "@/lib/intake/analytics";

function makeRow(overrides: Partial<ConversationRow>): ConversationRow {
  return {
    id: "test-" + Math.random().toString(36).slice(2, 8),
    currentStep: "problem",
    outcomeStatus: "in_progress",
    startedFromNicheSlug: null,
    leadId: null,
    messages: [],
    outcome: {},
    createdAt: new Date("2026-05-10T12:00:00Z"),
    updatedAt: new Date("2026-05-10T12:00:00Z"),
    ...overrides,
  };
}

const RANGE_START = new Date("2026-05-01T00:00:00Z");
const RANGE_END = new Date("2026-05-30T00:00:00Z");

describe("computeIntakeAnalytics — totals", () => {
  it("counts by outcomeStatus", () => {
    const rows = [
      makeRow({ outcomeStatus: "completed" }),
      makeRow({ outcomeStatus: "completed" }),
      makeRow({ outcomeStatus: "abandoned" }),
      makeRow({ outcomeStatus: "in_progress" }),
      makeRow({ outcomeStatus: "error" }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.totals.conversations).toBe(5);
    expect(a.totals.completed).toBe(2);
    expect(a.totals.abandoned).toBe(1);
    expect(a.totals.inProgress).toBe(1);
    expect(a.totals.errored).toBe(1);
    expect(a.totals.conversionRate).toBeCloseTo(0.4, 5);
  });

  it("handles empty input without dividing by zero", () => {
    const a = computeIntakeAnalytics([], RANGE_START, RANGE_END);
    expect(a.totals.conversations).toBe(0);
    expect(a.totals.conversionRate).toBe(0);
  });
});

describe("computeIntakeAnalytics — funnel", () => {
  it("counts conversations that reached each step", () => {
    const rows = [
      // 5 reached problem, 4 location, 3 urgency, 2 budget, 1 contact, 1 complete
      makeRow({ currentStep: "problem", outcomeStatus: "abandoned" }),
      makeRow({ currentStep: "location", outcomeStatus: "abandoned" }),
      makeRow({ currentStep: "urgency", outcomeStatus: "abandoned" }),
      makeRow({ currentStep: "budget", outcomeStatus: "abandoned" }),
      makeRow({ currentStep: "complete", outcomeStatus: "completed" }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    const byStep = Object.fromEntries(a.funnel.map((f) => [f.step, f.reached]));
    expect(byStep.problem).toBe(5);
    expect(byStep.location).toBe(4);
    expect(byStep.urgency).toBe(3);
    expect(byStep.budget).toBe(2);
    expect(byStep.contact).toBe(1);
    expect(byStep.complete).toBe(1);
  });

  it("computes drop-off between steps correctly", () => {
    const rows = [
      makeRow({ currentStep: "problem", outcomeStatus: "abandoned" }),
      makeRow({ currentStep: "location", outcomeStatus: "abandoned" }),
      makeRow({ currentStep: "complete", outcomeStatus: "completed" }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    const location = a.funnel.find((f) => f.step === "location")!;
    expect(location.reached).toBe(2);
    expect(location.dropoffFromPrev).toBe(1); // problem(3) -> location(2)
    expect(location.dropoffPct).toBeCloseTo(1 / 3, 5);
  });
});

describe("computeIntakeAnalytics — niche aggregation", () => {
  it("groups by FINAL primaryNiche, falling back to hint", () => {
    const rows = [
      makeRow({
        startedFromNicheSlug: "plumbing",
        outcome: { primaryNiche: "plumbing" },
        outcomeStatus: "completed",
      }),
      makeRow({
        startedFromNicheSlug: "dental",
        outcome: { primaryNiche: "plumbing" }, // switched
        outcomeStatus: "completed",
      }),
      makeRow({
        startedFromNicheSlug: "plumbing",
        outcome: {},
        outcomeStatus: "abandoned",
      }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    const plumbing = a.topNiches.find((n) => n.slug === "plumbing");
    expect(plumbing).toBeDefined();
    expect(plumbing!.conversations).toBe(3);
    expect(plumbing!.completed).toBe(2);
    expect(plumbing!.conversionRate).toBeCloseTo(2 / 3, 5);
  });

  it("falls back to (unrouted) when no niche info available", () => {
    const rows = [
      makeRow({ startedFromNicheSlug: null, outcome: {} }),
      makeRow({ startedFromNicheSlug: null, outcome: {} }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.topNiches[0].slug).toBe("(unrouted)");
    expect(a.topNiches[0].conversations).toBe(2);
  });
});

describe("computeIntakeAnalytics — daily counts", () => {
  it("builds a continuous date axis with zeros for empty days", () => {
    const rows = [
      makeRow({ createdAt: new Date("2026-05-05T12:00:00Z") }),
      makeRow({ createdAt: new Date("2026-05-05T13:00:00Z") }),
      makeRow({
        createdAt: new Date("2026-05-10T08:00:00Z"),
        outcomeStatus: "completed",
      }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.dailyCounts.length).toBeGreaterThanOrEqual(29);
    const may5 = a.dailyCounts.find((d) => d.date === "2026-05-05");
    expect(may5?.total).toBe(2);
    const may10 = a.dailyCounts.find((d) => d.date === "2026-05-10");
    expect(may10?.total).toBe(1);
    expect(may10?.completed).toBe(1);
    // Empty days have zero counts (not undefined)
    const may7 = a.dailyCounts.find((d) => d.date === "2026-05-07");
    expect(may7?.total).toBe(0);
  });
});

describe("computeIntakeAnalytics — routing & did-you-mean usage", () => {
  it("detects niche switches via user-correction message meta", () => {
    const rows = [
      makeRow({
        messages: [
          { role: "user", content: "hi" },
          {
            role: "assistant",
            content: "Switched to plumbing",
            meta: {
              classifierSource: "user-correction",
              previousNiche: "dental",
              matchedNiche: "plumbing",
            },
          },
        ],
      }),
      makeRow({
        messages: [
          {
            role: "assistant",
            content: "Switched to hvac",
            meta: {
              classifierSource: "user-correction",
              previousNiche: "electrical",
              matchedNiche: "hvac",
            },
          },
        ],
      }),
      makeRow({ messages: [] }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.routing.nicheSwitches).toBe(2);
    expect(a.routing.switchRate).toBeCloseTo(2 / 3, 5);
    expect(a.routing.topSwitchPairs).toHaveLength(2);
    expect(a.routing.topSwitchPairs[0].count).toBe(1);
  });

  it("counts at most one switch per conversation in the headline", () => {
    // Two user-corrections in one conversation = 1 switch (for headline rate)
    const rows = [
      makeRow({
        messages: [
          {
            role: "assistant",
            content: "switch 1",
            meta: { classifierSource: "user-correction" },
          },
          {
            role: "assistant",
            content: "switch 2",
            meta: { classifierSource: "user-correction" },
          },
        ],
      }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.routing.nicheSwitches).toBe(1);
  });
});

describe("computeIntakeAnalytics — classifier confidence", () => {
  it("buckets confidences into ranges and computes average", () => {
    const rows = [
      makeRow({ outcome: { primaryNicheConfidence: 0.1 } }),
      makeRow({ outcome: { primaryNicheConfidence: 0.3 } }),
      makeRow({ outcome: { primaryNicheConfidence: 0.6 } }),
      makeRow({ outcome: { primaryNicheConfidence: 0.85 } }),
      makeRow({ outcome: { primaryNicheConfidence: 1.0 } }),
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    const counts = a.classifierConfidence.buckets.map((b) => b.count);
    expect(counts).toEqual([1, 1, 1, 1, 1]);
    expect(a.classifierConfidence.avg).toBeCloseTo((0.1 + 0.3 + 0.6 + 0.85 + 1.0) / 5, 5);
  });

  it("returns avg=0 when no confidences present", () => {
    const a = computeIntakeAnalytics([makeRow({})], RANGE_START, RANGE_END);
    expect(a.classifierConfidence.avg).toBe(0);
  });
});

describe("computeIntakeAnalytics — orphan completed detection", () => {
  it("flags completed conversations with no leadId", () => {
    const rows = [
      makeRow({ outcomeStatus: "completed", leadId: "lead_1" }),
      makeRow({ outcomeStatus: "completed", leadId: null }), // orphan
      makeRow({ outcomeStatus: "abandoned", leadId: null }), // not orphan (didn't complete)
    ];
    const a = computeIntakeAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.orphanCompleted).toBe(1);
  });
});
