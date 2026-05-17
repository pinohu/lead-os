import { describe, it, expect } from "vitest";
import {
  computeSlaAnalytics,
  type LeadAnalyticsRow,
} from "@/lib/leads/sla-analytics";

const RANGE_START = new Date("2026-05-01T00:00:00Z");
const RANGE_END = new Date("2026-05-30T00:00:00Z");
const SOMETIME = new Date("2026-05-15T12:00:00Z"); // mid-range
const FUTURE_AFTER_RANGE = new Date("2026-06-01T12:00:00Z"); // AFTER rangeEnd → not yet expired
const PAST_WITHIN_RANGE = new Date("2026-05-10T12:00:00Z"); // before rangeEnd → expired

function makeRow(overrides: Partial<LeadAnalyticsRow>): LeadAnalyticsRow {
  return {
    id: "lead-" + Math.random().toString(36).slice(2, 8),
    niche: "plumbing",
    city: "erie",
    routedToId: "p1",
    routedToName: "Provider One",
    slaDeadline: FUTURE_AFTER_RANGE, // default to "future relative to rangeEnd" → awaiting
    createdAt: SOMETIME,
    outcomes: [],
    ...overrides,
  };
}

describe("computeSlaAnalytics — totals", () => {
  it("classifies leads by inferred state", () => {
    const rows: LeadAnalyticsRow[] = [
      // accepted (responded outcome)
      makeRow({
        outcomes: [{ outcome: "responded", responseTimeSeconds: 120, createdAt: new Date() }],
      }),
      // completed (converted outcome)
      makeRow({
        outcomes: [{ outcome: "converted", responseTimeSeconds: 90, createdAt: new Date() }],
      }),
      // declined (one decline, attempts < max)
      makeRow({
        outcomes: [{ outcome: "declined", responseTimeSeconds: null, createdAt: new Date() }],
      }),
      // expired (no outcome, SLA past)
      makeRow({
        slaDeadline: PAST_WITHIN_RANGE,
        outcomes: [],
      }),
      // awaiting (no outcome, SLA future relative to rangeEnd)
      makeRow({
        slaDeadline: FUTURE_AFTER_RANGE,
        outcomes: [],
      }),
      // unrouted
      makeRow({
        routedToId: null,
        slaDeadline: null,
        outcomes: [],
      }),
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.totals.leads).toBe(6);
    expect(a.totals.accepted).toBe(1);
    expect(a.totals.completed).toBe(1);
    expect(a.totals.declined).toBe(1);
    expect(a.totals.expired).toBe(1);
    expect(a.totals.awaiting).toBe(1);
    expect(a.totals.unrouted).toBe(1);
  });

  it("handles empty input without dividing by zero", () => {
    const a = computeSlaAnalytics([], RANGE_START, RANGE_END);
    expect(a.totals.leads).toBe(0);
    expect(a.acceptRate).toBe(0);
    expect(a.responseTime.medianSec).toBe(0);
  });
});

describe("computeSlaAnalytics — acceptance rate", () => {
  it("computes accepted+completed / total", () => {
    const rows: LeadAnalyticsRow[] = [
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 100, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 100, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "converted", responseTimeSeconds: 100, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "declined", responseTimeSeconds: null, createdAt: new Date() }] }),
      makeRow({ slaDeadline: PAST_WITHIN_RANGE }), // expired
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.acceptRate).toBeCloseTo(3 / 5, 5);
  });
});

describe("computeSlaAnalytics — response time stats", () => {
  it("computes median + p75 + mean across responded/converted outcomes", () => {
    const rows: LeadAnalyticsRow[] = [
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 60, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 120, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 180, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 240, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 300, createdAt: new Date() }] }),
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.responseTime.medianSec).toBe(180);
    expect(a.responseTime.meanSec).toBe(180);
    expect(a.responseTime.sampleSize).toBe(5);
  });

  it("ignores outcomes without responseTimeSeconds", () => {
    const rows: LeadAnalyticsRow[] = [
      makeRow({ outcomes: [{ outcome: "responded", responseTimeSeconds: 60, createdAt: new Date() }] }),
      makeRow({ outcomes: [{ outcome: "declined", responseTimeSeconds: null, createdAt: new Date() }] }),
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.responseTime.sampleSize).toBe(1);
    expect(a.responseTime.medianSec).toBe(60);
  });
});

describe("computeSlaAnalytics — recent expired list", () => {
  it("surfaces leads in expired state, sorted by expiredAt desc", () => {
    const old = new Date("2026-05-05T12:00:00Z");
    const recent = new Date("2026-05-15T12:00:00Z");
    const rows: LeadAnalyticsRow[] = [
      makeRow({
        id: "lead-old",
        slaDeadline: old,
        outcomes: [],
      }),
      makeRow({
        id: "lead-recent",
        slaDeadline: recent,
        outcomes: [],
      }),
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.totals.expired).toBe(2);
    expect(a.recentExpired[0].leadId).toBe("lead-recent");
    expect(a.recentExpired[1].leadId).toBe("lead-old");
  });
});

describe("computeSlaAnalytics — null-safety", () => {
  it("handles rows with no routedToName gracefully", () => {
    const rows: LeadAnalyticsRow[] = [
      makeRow({
        routedToId: "p2",
        routedToName: null,
        slaDeadline: PAST_WITHIN_RANGE,
        outcomes: [],
      }),
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.recentExpired[0].routedToName).toBeNull();
  });

  it("handles rows with no outcomes and no routedToId (unrouted)", () => {
    const rows: LeadAnalyticsRow[] = [
      makeRow({
        routedToId: null,
        slaDeadline: null,
        outcomes: [],
      }),
    ];
    const a = computeSlaAnalytics(rows, RANGE_START, RANGE_END);
    expect(a.totals.unrouted).toBe(1);
  });
});
