import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { applyDesignSpec } from "../src/lib/design-spec-applicator.ts";
import { getScoringConfig, resetScoringConfigStore } from "../src/lib/scoring-config.ts";
import { getKPIConfig, resetKPIConfigStore } from "../src/lib/kpi-config.ts";
import { resetIngressStore, listIngressRules } from "../src/lib/ingress-engine.ts";
import { resetNicheConfigStore, resolveNicheConfig } from "../src/lib/niche-adapter.ts";
import { resetCreativeSchedulerStore, listCreativeJobs } from "../src/lib/creative-scheduler.ts";
import type { DesignSpec } from "../src/lib/design-spec.ts";

function buildMinimalSpec(overrides?: Partial<DesignSpec>): DesignSpec {
  return {
    niche: {
      name: "Test Niche",
      industry: "general",
      icp: {
        painPoints: ["Pain point A", "Pain point B"],
        urgencyTriggers: ["Trigger 1"],
        demographics: "Small business owners",
      },
    },
    ingress: {
      channels: [
        { type: "seo", intentLevel: "low", funnelType: "lead-magnet", keywords: ["test"] },
        { type: "paid-search", intentLevel: "high", funnelType: "qualification", budget: 500, keywords: ["buy test"] },
      ],
      defaultFunnel: "main-funnel",
    },
    funnels: [
      {
        id: "main-funnel",
        name: "Main Funnel",
        type: "direct-conversion",
        steps: [
          { id: "landing", type: "landing_page" },
          { id: "offer", type: "offer_page", action: "present-offer" },
        ],
        conversionGoal: "purchase",
      },
    ],
    psychology: {
      urgencyTriggers: [
        { type: "limited-slots", message: "Only 3 left", threshold: 3 },
      ],
      trustBuilders: [
        { type: "guarantee", content: "Money back guarantee" },
      ],
      objectionHandlers: [
        { objection: "Too expensive", response: "ROI in 30 days" },
      ],
      microCommitments: [
        { type: "quiz-step", label: "Take the quiz" },
      ],
    },
    offers: {
      core: {
        name: "Test Package",
        price: 997,
        description: "A great test package",
        deliverables: ["Item 1", "Item 2"],
      },
      upsells: [{ name: "Premium", price: 297, trigger: "post-purchase" }],
      leadMagnets: [{ name: "Free Guide", type: "ebook", deliveryMethod: "email" }],
      pricing: { model: "fixed", anchor: 1997, discount: 0.5 },
    },
    automation: {
      sms: { enabled: true, timing: [{ delay: "5m", message: "Thanks!" }] },
      email: {
        enabled: true,
        sequences: [
          {
            name: "Welcome",
            stages: [
              { day: 0, subject: "Welcome aboard", goal: "deliver-value" },
              { day: 3, subject: "Quick win", goal: "build-trust" },
            ],
          },
        ],
      },
      calls: { enabled: true, triggerScore: 75 },
    },
    kpis: {
      targetConversionRate: 0.08,
      targetCAC: 120,
      targetLTV: 5000,
      targetLeadsPerMonth: 300,
      targetRevenuePerMonth: 15000,
    },
    scoring: {
      intentWeight: 0.35,
      fitWeight: 0.20,
      engagementWeight: 0.25,
      urgencyWeight: 0.20,
      hotThreshold: 80,
      qualifiedThreshold: 55,
    },
    ...overrides,
  };
}

beforeEach(() => {
  resetScoringConfigStore();
  resetKPIConfigStore();
  resetIngressStore();
  resetNicheConfigStore();
  resetCreativeSchedulerStore();
});

// ---------------------------------------------------------------------------
// Scoring config
// ---------------------------------------------------------------------------

test("applyDesignSpec creates scoring config for the tenant", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-1", "spec-1", spec);

  const scoringStep = result.steps.find((s) => s.name === "register-scoring-weights");
  assert.equal(scoringStep?.status, "success");

  const cfg = getScoringConfig("t-1");
  assert.ok(cfg);
  assert.equal(cfg.intentWeight, 0.35);
  assert.equal(cfg.fitWeight, 0.20);
  assert.equal(cfg.engagementWeight, 0.25);
  assert.equal(cfg.urgencyWeight, 0.20);
});

test("applyDesignSpec uses default scoring when spec.scoring is undefined", async () => {
  const spec = buildMinimalSpec();
  delete (spec as Record<string, unknown>).scoring;
  const result = await applyDesignSpec("t-2", "spec-2", spec);

  const scoringStep = result.steps.find((s) => s.name === "register-scoring-weights");
  assert.equal(scoringStep?.status, "success");

  const cfg = getScoringConfig("t-2");
  assert.ok(cfg);
  assert.equal(cfg.intentWeight, 0.3);
});

test("scoring config is readable after application", async () => {
  const spec = buildMinimalSpec();
  await applyDesignSpec("t-read", "spec-read", spec);

  const cfg = getScoringConfig("t-read");
  assert.ok(cfg);
  assert.equal(typeof cfg.intentWeight, "number");
  assert.equal(typeof cfg.fitWeight, "number");
  assert.equal(typeof cfg.engagementWeight, "number");
  assert.equal(typeof cfg.urgencyWeight, "number");
});

// ---------------------------------------------------------------------------
// Ingress rules
// ---------------------------------------------------------------------------

test("applyDesignSpec creates ingress rules", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-3", "spec-3", spec);

  const ingressStep = result.steps.find((s) => s.name === "configure-ingress-routing");
  assert.equal(ingressStep?.status, "success");

  const rules = await listIngressRules("t-3");
  assert.equal(rules.length, 2);
  assert.ok(rules.some((r) => r.channel === "seo"));
  assert.ok(rules.some((r) => r.channel === "paid-search"));
});

test("ingress rules have correct intent levels and score boosts", async () => {
  const spec = buildMinimalSpec();
  await applyDesignSpec("t-3b", "spec-3b", spec);

  const rules = await listIngressRules("t-3b");
  const paidSearch = rules.find((r) => r.channel === "paid-search");
  assert.ok(paidSearch);
  assert.equal(paidSearch.intentLevel, "high");
  assert.equal(paidSearch.initialScoreBoost, 25);

  const seo = rules.find((r) => r.channel === "seo");
  assert.ok(seo);
  assert.equal(seo.intentLevel, "low");
  assert.equal(seo.initialScoreBoost, 5);
});

// ---------------------------------------------------------------------------
// Niche config
// ---------------------------------------------------------------------------

test("applyDesignSpec creates niche config", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-4", "spec-4", spec);

  const nicheStep = result.steps.find((s) => s.name === "generate-niche-config");
  assert.equal(nicheStep?.status, "success");

  const nicheConfig = resolveNicheConfig("test-niche");
  assert.ok(nicheConfig);
  assert.equal(nicheConfig.name, "Test Niche");
  assert.equal(nicheConfig.industry, "general");
});

test("niche config contains audience pain points from spec", async () => {
  const spec = buildMinimalSpec();
  await applyDesignSpec("t-4b", "spec-4b", spec);

  const nicheConfig = resolveNicheConfig("test-niche");
  assert.ok(nicheConfig);
  assert.ok(nicheConfig.audience.painPoints.includes("Pain point A"));
  assert.ok(nicheConfig.audience.painPoints.includes("Pain point B"));
});

// ---------------------------------------------------------------------------
// Creative jobs
// ---------------------------------------------------------------------------

test("applyDesignSpec creates creative jobs", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-5", "spec-5", spec);

  const creativeStep = result.steps.find((s) => s.name === "configure-creative-jobs");
  assert.equal(creativeStep?.status, "success");

  const jobs = await listCreativeJobs("t-5");
  assert.equal(jobs.length, 3);
  const types = jobs.map((j) => j.type).sort();
  assert.deepEqual(types, ["email-sequence-update", "landing-page-refresh", "weekly-video-recap"]);
});

test("creative jobs have correct schedules", async () => {
  const spec = buildMinimalSpec();
  await applyDesignSpec("t-5b", "spec-5b", spec);

  const jobs = await listCreativeJobs("t-5b");
  const weekly = jobs.find((j) => j.type === "weekly-video-recap");
  assert.equal(weekly?.schedule, "weekly");
  const monthly = jobs.find((j) => j.type === "landing-page-refresh");
  assert.equal(monthly?.schedule, "monthly");
});

// ---------------------------------------------------------------------------
// KPI targets
// ---------------------------------------------------------------------------

test("applyDesignSpec stores KPI targets", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-6", "spec-6", spec);

  const kpiStep = result.steps.find((s) => s.name === "set-kpi-targets");
  assert.equal(kpiStep?.status, "success");

  const kpi = getKPIConfig("t-6");
  assert.ok(kpi);
  assert.equal(kpi.targetConversionRate, 0.08);
  assert.equal(kpi.targetCAC, 120);
  assert.equal(kpi.targetLTV, 5000);
  assert.equal(kpi.targetLeadsPerMonth, 300);
  assert.equal(kpi.targetRevenuePerMonth, 15000);
});

// ---------------------------------------------------------------------------
// Partial spec / missing sections
// ---------------------------------------------------------------------------

test("applyDesignSpec handles spec with no upsells or lead magnets", async () => {
  const spec = buildMinimalSpec();
  delete (spec.offers as Record<string, unknown>).upsells;
  delete (spec.offers as Record<string, unknown>).leadMagnets;

  const result = await applyDesignSpec("t-7", "spec-7", spec);
  assert.ok(result.success);
  assert.ok(result.steps.some((s) => s.name === "generate-niche-config" && s.status === "success"));
});

test("applyDesignSpec handles spec with no automation channels", async () => {
  const spec = buildMinimalSpec();
  spec.automation = {} as DesignSpec["automation"];

  const result = await applyDesignSpec("t-8", "spec-8", spec);
  assert.ok(result.success);
});

test("applyDesignSpec handles spec with no KPI optional fields", async () => {
  const spec = buildMinimalSpec();
  spec.kpis = { targetConversionRate: 0.05 };

  const result = await applyDesignSpec("t-9", "spec-9", spec);
  const kpiStep = result.steps.find((s) => s.name === "set-kpi-targets");
  assert.equal(kpiStep?.status, "success");

  const kpi = getKPIConfig("t-9");
  assert.ok(kpi);
  assert.equal(kpi.targetConversionRate, 0.05);
  assert.equal(kpi.targetCAC, undefined);
});

// ---------------------------------------------------------------------------
// Failure handling
// ---------------------------------------------------------------------------

test("applyDesignSpec continues after individual step failure", async () => {
  const spec = buildMinimalSpec();
  // Calling twice with same niche slug will cause niche config creation to fail (duplicate)
  await applyDesignSpec("t-10a", "spec-10a", spec);

  // Reset only non-niche stores so niche will collide
  resetScoringConfigStore();
  resetKPIConfigStore();
  resetIngressStore();
  resetCreativeSchedulerStore();

  const result = await applyDesignSpec("t-10b", "spec-10b", spec);

  const nicheStep = result.steps.find((s) => s.name === "generate-niche-config");
  assert.equal(nicheStep?.status, "failed");

  // Other steps should still succeed
  const scoringStep = result.steps.find((s) => s.name === "register-scoring-weights");
  assert.equal(scoringStep?.status, "success");

  const kpiStep = result.steps.find((s) => s.name === "set-kpi-targets");
  assert.equal(kpiStep?.status, "success");

  assert.equal(result.success, false);
});

test("applyDesignSpec result includes all step names", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-11", "spec-11", spec);

  const stepNames = result.steps.map((s) => s.name);
  assert.ok(stepNames.includes("register-scoring-weights"));
  assert.ok(stepNames.includes("configure-ingress-routing"));
  assert.ok(stepNames.includes("generate-niche-config"));
  assert.ok(stepNames.includes("configure-creative-jobs"));
  assert.ok(stepNames.includes("set-kpi-targets"));
  assert.ok(stepNames.includes("register-personalization-content"));
  assert.ok(stepNames.includes("update-tenant-record"));
});

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

test("applyDesignSpec returns correct tenantId and specId", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("tenant-abc", "spec-xyz", spec);

  assert.equal(result.tenantId, "tenant-abc");
  assert.equal(result.specId, "spec-xyz");
  assert.ok(result.appliedAt);
});

test("applyDesignSpec success is true when all steps succeed", async () => {
  const spec = buildMinimalSpec();
  const result = await applyDesignSpec("t-12", "spec-12", spec);
  assert.equal(result.success, true);
});

test("applyDesignSpec works with single ingress channel", async () => {
  const spec = buildMinimalSpec({
    ingress: {
      channels: [{ type: "direct", intentLevel: "high", funnelType: "qualification" }],
      defaultFunnel: "main",
    },
  });
  // Need a unique niche name to avoid slug collision
  spec.niche.name = "Solo Channel Niche";
  const result = await applyDesignSpec("t-13", "spec-13", spec);

  const ingressStep = result.steps.find((s) => s.name === "configure-ingress-routing");
  assert.equal(ingressStep?.status, "success");

  const rules = await listIngressRules("t-13");
  assert.equal(rules.length, 1);
  assert.equal(rules[0].channel, "direct");
});
