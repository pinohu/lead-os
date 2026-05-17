import { describe, it, expect } from "vitest";
import {
  evaluateIntakeAlerts,
  evaluateSlaAlerts,
  evaluateExperimentAlerts,
  evaluateAllAlerts,
  DEFAULT_THRESHOLDS,
} from "@/lib/alerts/thresholds";
import { buildSlackPayload } from "@/lib/alerts/slack";
import type { IntakeAnalytics } from "@/lib/intake/analytics";
import type { SlaAnalytics } from "@/lib/leads/sla-analytics";
import type { ExperimentAnalytics } from "@/lib/experiments/analytics";

function makeIntake(overrides: Partial<IntakeAnalytics> = {}): IntakeAnalytics {
  return {
    range: { startISO: "2026-05-01T00:00:00Z", endISO: "2026-05-30T00:00:00Z", days: 30 },
    totals: {
      conversations: 100,
      completed: 36,
      abandoned: 50,
      inProgress: 10,
      errored: 4,
      conversionRate: 0.36,
    },
    funnel: [],
    topNiches: [],
    dailyCounts: [],
    nicheSwitches: { rate: 0, topPairs: [] },
    classifierConfidence: { buckets: [] },
    orphanCompleted: 0,
    ...overrides,
  } as IntakeAnalytics;
}

function makeSla(overrides: Partial<SlaAnalytics> = {}): SlaAnalytics {
  return {
    range: { startISO: "2026-05-01T00:00:00Z", endISO: "2026-05-30T00:00:00Z", days: 30 },
    totals: {
      leads: 100,
      accepted: 70,
      declined: 5,
      expired: 0,
      awaiting: 10,
      completed: 15,
      exhausted: 0,
      unrouted: 0,
    },
    acceptRate: 0.85,
    responseTime: { medianSec: 600, p75Sec: 1200, meanSec: 700, sampleSize: 85 },
    topProviders: [],
    recentExpired: [],
    failoverPairs: [],
    ...overrides,
  };
}

function makeExperiment(overrides: Partial<ExperimentAnalytics> = {}): ExperimentAnalytics {
  return {
    experimentKey: "test_exp",
    description: "test",
    totalExposures: 1000,
    totalConversions: 200,
    overallConversionRate: 0.2,
    controlVariantKey: "control",
    variants: [
      {
        variantKey: "control",
        exposures: 500,
        conversions: 80,
        conversionRate: 0.16,
        isControl: true,
        zScoreVsControl: null,
        pValueVsControl: null,
        liftVsControl: null,
      },
      {
        variantKey: "treatment",
        exposures: 500,
        conversions: 120,
        conversionRate: 0.24,
        isControl: false,
        zScoreVsControl: 3.2,
        pValueVsControl: 0.001,
        liftVsControl: 0.5,
      },
    ],
    hasSignificantWinner: true,
    significantWinnerVariantKey: "treatment",
    ...overrides,
  };
}

describe("evaluateIntakeAlerts", () => {
  it("fires LOW conversion alert when below threshold with enough sample", () => {
    const alerts = evaluateIntakeAlerts(
      makeIntake({
        totals: {
          conversations: 100,
          completed: 10, // 10% < default 20% threshold
          abandoned: 80,
          inProgress: 5,
          errored: 5,
          conversionRate: 0.1,
        },
      })
    );
    expect(alerts.find((a) => a.key.startsWith("intake_low_conversion"))).toBeDefined();
    expect(alerts.find((a) => a.severity === "warning")).toBeDefined();
  });

  it("does NOT fire LOW conversion when sample is too small", () => {
    const alerts = evaluateIntakeAlerts(
      makeIntake({
        totals: {
          conversations: 5, // tiny sample
          completed: 0,
          abandoned: 5,
          inProgress: 0,
          errored: 0,
          conversionRate: 0,
        },
      })
    );
    expect(alerts.find((a) => a.key.startsWith("intake_low_conversion"))).toBeUndefined();
  });

  it("fires CRITICAL on any orphan-completed by default", () => {
    const alerts = evaluateIntakeAlerts(makeIntake({ orphanCompleted: 1 }));
    expect(alerts.find((a) => a.severity === "critical")).toBeDefined();
    expect(alerts.find((a) => a.key.startsWith("intake_orphan_completed"))).toBeDefined();
  });

  it("returns empty when everything is healthy", () => {
    const alerts = evaluateIntakeAlerts(makeIntake()); // defaults are healthy
    expect(alerts).toEqual([]);
  });
});

describe("evaluateSlaAlerts", () => {
  it("fires warning when expired exceeds threshold", () => {
    const alerts = evaluateSlaAlerts(
      makeSla({ totals: { ...makeSla().totals, expired: 10 } })
    );
    expect(alerts.find((a) => a.key.startsWith("sla_expired"))).toBeDefined();
    expect(alerts[0].severity).toBe("warning");
  });

  it("fires CRITICAL when ANY lead is exhausted", () => {
    const alerts = evaluateSlaAlerts(
      makeSla({ totals: { ...makeSla().totals, exhausted: 1 } })
    );
    expect(alerts.find((a) => a.key.startsWith("sla_exhausted"))).toBeDefined();
    expect(alerts.find((a) => a.severity === "critical")).toBeDefined();
  });

  it("returns empty when SLA is healthy", () => {
    expect(evaluateSlaAlerts(makeSla())).toEqual([]);
  });
});

describe("evaluateExperimentAlerts", () => {
  it("fires info alert for a significant winner with sufficient sample", () => {
    const alerts = evaluateExperimentAlerts([makeExperiment()]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("info");
    expect(alerts[0].context.winnerVariant).toBe("treatment");
  });

  it("does NOT fire when sample is too small", () => {
    const alerts = evaluateExperimentAlerts([
      makeExperiment({ totalExposures: 50 }),
    ]);
    expect(alerts).toEqual([]);
  });

  it("does NOT fire when no significant winner", () => {
    const alerts = evaluateExperimentAlerts([
      makeExperiment({ hasSignificantWinner: false, significantWinnerVariantKey: null }),
    ]);
    expect(alerts).toEqual([]);
  });
});

describe("evaluateAllAlerts", () => {
  it("sorts critical > warning > info", () => {
    const alerts = evaluateAllAlerts(
      makeIntake({
        orphanCompleted: 1, // critical
        totals: {
          conversations: 100,
          completed: 5, // warning (low conversion)
          abandoned: 90,
          inProgress: 0,
          errored: 5,
          conversionRate: 0.05,
        },
      }),
      makeSla(),
      [makeExperiment()] // info
    );
    const severities = alerts.map((a) => a.severity);
    // First should be critical, last should be info
    expect(severities[0]).toBe("critical");
    expect(severities[severities.length - 1]).toBe("info");
  });

  it("handles all-null inputs gracefully", () => {
    expect(evaluateAllAlerts(null, null, null)).toEqual([]);
  });
});

describe("buildSlackPayload", () => {
  it("includes severity emoji in the header", () => {
    const payload = buildSlackPayload(
      {
        key: "test",
        severity: "critical",
        title: "Critical issue",
        body: "Body",
        context: {},
      },
      "erie.pro"
    ) as { attachments: Array<{ blocks: Array<{ type: string; text?: { text: string } }> }> };
    const headerText = payload.attachments[0].blocks[0].text?.text ?? "";
    expect(headerText).toContain("🚨");
    expect(headerText).toContain("Critical issue");
  });

  it("uses red color for critical severity", () => {
    const payload = buildSlackPayload(
      { key: "test", severity: "critical", title: "T", body: "B", context: {} },
      "erie.pro"
    ) as { attachments: Array<{ color: string }> };
    expect(payload.attachments[0].color).toBe("#ef4444");
  });

  it("uses blue for info, amber for warning", () => {
    const i = buildSlackPayload(
      { key: "k", severity: "info", title: "T", body: "B", context: {} },
      "erie.pro"
    ) as { attachments: Array<{ color: string }> };
    const w = buildSlackPayload(
      { key: "k", severity: "warning", title: "T", body: "B", context: {} },
      "erie.pro"
    ) as { attachments: Array<{ color: string }> };
    expect(i.attachments[0].color).toBe("#3b82f6");
    expect(w.attachments[0].color).toBe("#f59e0b");
  });

  it("includes the alert key in the context block (for debugging)", () => {
    const payload = buildSlackPayload(
      { key: "intake_low_conversion_30d", severity: "warning", title: "T", body: "B", context: {} },
      "erie.pro"
    ) as { attachments: Array<{ blocks: Array<{ elements?: Array<{ text: string }> }> }> };
    const contextEl = payload.attachments[0].blocks[2].elements?.[0]?.text ?? "";
    expect(contextEl).toContain("intake_low_conversion_30d");
  });
});

describe("DEFAULT_THRESHOLDS", () => {
  it("has sensible defaults", () => {
    expect(DEFAULT_THRESHOLDS.intakeMinConversionRate).toBeGreaterThan(0);
    expect(DEFAULT_THRESHOLDS.intakeMinConversionRate).toBeLessThan(1);
    expect(DEFAULT_THRESHOLDS.intakeOrphanCompletedMax).toBe(0); // zero tolerance
    expect(DEFAULT_THRESHOLDS.slaExhaustedMax).toBe(1);
  });
});
