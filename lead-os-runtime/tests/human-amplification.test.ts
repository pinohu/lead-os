import test from "node:test";
import assert from "node:assert/strict";
import {
  identifyHighValueOpportunities,
  calculateHumanROI,
  prioritizeQueue,
  generateCallScript,
  trackHumanPerformance,
  optimizeHumanAllocation,
  resetOutcomeStore,
  type HighValueOpportunity,
  type RepOutcome,
  type RepProfile,
} from "../src/lib/human-amplification.ts";
import {
  createContext,
  updateContext,
  addInteraction,
  addTouchpoint,
  resetContextStore,
  type LeadContext,
} from "../src/lib/context-engine.ts";
import { getNiche } from "../src/lib/catalog.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(): void {
  resetContextStore();
  resetOutcomeStore();
}

function createTestLead(
  leadKey: string,
  overrides: {
    temperature?: "cold" | "warm" | "hot" | "burning";
    composite?: number;
    intent?: number;
    fit?: number;
    company?: string;
    funnelStage?: string;
    identityType?: string;
    fearTriggers?: string[];
    objections?: string[];
    desireTriggers?: string[];
    name?: string;
    lastSeenHoursAgo?: number;
  } = {},
): LeadContext {
  const ctx = createContext(leadKey, "tenant-test", {
    niche: "legal",
    name: overrides.name,
    company: overrides.company,
  });

  const lastSeen = overrides.lastSeenHoursAgo
    ? new Date(Date.now() - overrides.lastSeenHoursAgo * 60 * 60 * 1000).toISOString()
    : new Date().toISOString();

  const updated = updateContext(leadKey, {
    scores: {
      temperature: overrides.temperature ?? "warm",
      composite: overrides.composite ?? 50,
      intent: overrides.intent ?? 50,
      fit: overrides.fit ?? 50,
      urgency: 50,
      engagement: 50,
    },
    funnelStage: overrides.funnelStage ?? "new",
    psychologyProfile: {
      trustLevel: 60,
      fearTriggers: overrides.fearTriggers ?? [],
      desireTriggers: overrides.desireTriggers ?? [],
      objections: overrides.objections ?? [],
      identityType: overrides.identityType ?? "decision-maker",
      emotionalStage: "curiosity",
    },
  });

  // updateContext always sets lastSeen to now, so we override after the fact.
  // The returned object is the same reference held in the in-memory store.
  if (overrides.lastSeenHoursAgo) {
    updated!.lastSeen = lastSeen;
  }

  return updated!;
}

// ---------------------------------------------------------------------------
// identifyHighValueOpportunities
// ---------------------------------------------------------------------------

test("identifyHighValueOpportunities finds cooling hot leads", async () => {
  setup();
  createTestLead("cooling-lead", {
    temperature: "hot",
    composite: 80,
    lastSeenHoursAgo: 72,
  });

  const opps = await identifyHighValueOpportunities("tenant-test");
  assert.ok(opps.length >= 1);
  const cooling = opps.find((o) => o.category === "cooling-hot-lead");
  assert.ok(cooling);
  assert.ok(cooling.urgency > 80);
});

test("identifyHighValueOpportunities finds stalled high-intent leads", async () => {
  setup();
  createTestLead("stalled-lead", {
    temperature: "warm",
    intent: 70,
    funnelStage: "qualified",
  });

  const opps = await identifyHighValueOpportunities("tenant-test");
  const stalled = opps.find((o) => o.category === "stalled-high-intent");
  assert.ok(stalled);
  assert.equal(stalled.leadKey, "stalled-lead");
});

test("identifyHighValueOpportunities finds enterprise opportunities", async () => {
  setup();
  createTestLead("enterprise-lead", {
    company: "Acme Corp",
    fit: 80,
  });

  const opps = await identifyHighValueOpportunities("tenant-test");
  const enterprise = opps.find((o) => o.category === "enterprise");
  assert.ok(enterprise);
  assert.ok(enterprise.estimatedValue > 10000);
});

test("identifyHighValueOpportunities finds competitor mentions", async () => {
  setup();
  createTestLead("competitor-lead", { temperature: "warm" });
  addInteraction("competitor-lead", {
    type: "chat",
    timestamp: new Date().toISOString(),
    channel: "web",
    metadata: { mentionsCompetitor: true },
  });

  const opps = await identifyHighValueOpportunities("tenant-test");
  const comp = opps.find((o) => o.category === "competitor-mention");
  assert.ok(comp);
});

test("identifyHighValueOpportunities finds high-interest blocked leads", async () => {
  setup();
  createTestLead("blocked-lead", { temperature: "cold", composite: 30 });
  for (let i = 0; i < 4; i++) {
    addTouchpoint("blocked-lead", {
      channel: "web",
      source: "return-visit",
      timestamp: new Date().toISOString(),
    });
  }

  const opps = await identifyHighValueOpportunities("tenant-test");
  const blocked = opps.find((o) => o.category === "high-interest-blocked");
  assert.ok(blocked);
  assert.ok(blocked.reason.includes("return visits"));
});

test("identifyHighValueOpportunities returns empty for tenant with no leads", async () => {
  setup();
  const opps = await identifyHighValueOpportunities("tenant-empty");
  assert.equal(opps.length, 0);
});

// ---------------------------------------------------------------------------
// calculateHumanROI
// ---------------------------------------------------------------------------

test("calculateHumanROI returns worth-it for hot lead with high deal value", () => {
  setup();
  const lead = createTestLead("roi-hot", { temperature: "hot" });
  const roi = calculateHumanROI(lead, 20000, 50);

  assert.equal(roi.recommendation, "worth-it");
  assert.ok(roi.roiRatio >= 3);
  assert.equal(roi.estimatedDealValue, 20000);
});

test("calculateHumanROI returns not-worth-it for cold lead with low deal value", () => {
  setup();
  const lead = createTestLead("roi-cold", { temperature: "cold" });
  const roi = calculateHumanROI(lead, 500, 100);

  assert.equal(roi.recommendation, "not-worth-it");
  assert.ok(roi.roiRatio < 1);
});

test("calculateHumanROI returns borderline for warm lead with moderate deal value", () => {
  setup();
  const lead = createTestLead("roi-warm", { temperature: "warm" });
  const roi = calculateHumanROI(lead, 5000, 50);

  assert.ok(roi.roiRatio >= 1);
  assert.ok(["worth-it", "borderline"].includes(roi.recommendation));
});

// ---------------------------------------------------------------------------
// prioritizeQueue
// ---------------------------------------------------------------------------

test("prioritizeQueue sorts by value * urgency * probability", () => {
  setup();
  const lead1 = createTestLead("pq-1", { temperature: "hot", composite: 80 });
  const lead2 = createTestLead("pq-2", { temperature: "cold", composite: 20 });

  const opps: HighValueOpportunity[] = [
    {
      leadKey: "pq-2",
      tenantId: "tenant-test",
      reason: "Low value",
      category: "stalled-high-intent",
      estimatedValue: 2000,
      urgency: 30,
      probability: 0.2,
      recommendedAction: "Nurture",
      leadSnapshot: lead2,
    },
    {
      leadKey: "pq-1",
      tenantId: "tenant-test",
      reason: "High value",
      category: "cooling-hot-lead",
      estimatedValue: 15000,
      urgency: 90,
      probability: 0.6,
      recommendedAction: "Call now",
      leadSnapshot: lead1,
    },
  ];

  const queue = prioritizeQueue(opps);
  assert.equal(queue.opportunities[0].leadKey, "pq-1");
  assert.equal(queue.opportunities[1].leadKey, "pq-2");
  assert.ok(queue.totalEstimatedValue > 0);
  assert.ok(queue.generatedAt.length > 0);
});

// ---------------------------------------------------------------------------
// generateCallScript
// ---------------------------------------------------------------------------

test("generateCallScript generates all required sections", () => {
  setup();
  const lead = createTestLead("script-1", {
    name: "John",
    identityType: "decision-maker",
    objections: ["too expensive"],
  });
  const nicheConfig = getNiche("legal");

  const script = generateCallScript(lead, nicheConfig);

  assert.equal(script.leadKey, "script-1");
  assert.ok(script.opening.content.includes("John"));
  assert.ok(script.discovery.content.includes("challenge"));
  assert.ok(script.valueProposition.content.length > 0);
  assert.ok(script.objectionHandling.content.includes("too expensive"));
  assert.ok(script.close.content.length > 0);
  assert.ok(script.followUp.content.length > 0);
});

test("generateCallScript adapts opening to researcher identity", () => {
  setup();
  const lead = createTestLead("script-researcher", {
    name: "Jane",
    identityType: "researcher",
  });
  const nicheConfig = getNiche("legal");

  const script = generateCallScript(lead, nicheConfig);
  assert.ok(script.opening.content.includes("research"));
});

test("generateCallScript adapts close to hot lead temperature", () => {
  setup();
  const lead = createTestLead("script-hot", {
    temperature: "hot",
    name: "Mike",
  });
  const nicheConfig = getNiche("legal");

  const script = generateCallScript(lead, nicheConfig);
  assert.ok(script.close.content.includes("onboarding") || script.close.content.includes("started"));
});

test("generateCallScript adapts close to cold lead temperature", () => {
  setup();
  const lead = createTestLead("script-cold", {
    temperature: "cold",
    name: "Sarah",
  });
  const nicheConfig = getNiche("legal");

  const script = generateCallScript(lead, nicheConfig);
  assert.ok(script.close.content.includes("research") || script.close.content.includes("case studies"));
});

// ---------------------------------------------------------------------------
// trackHumanPerformance
// ---------------------------------------------------------------------------

test("trackHumanPerformance calculates correct metrics", () => {
  setup();
  const outcomes: RepOutcome[] = [
    { repId: "rep-1", leadKey: "l1", result: "won", dealValue: 5000, responseTimeMinutes: 10, notes: "", timestamp: new Date().toISOString() },
    { repId: "rep-1", leadKey: "l2", result: "won", dealValue: 8000, responseTimeMinutes: 5, notes: "", timestamp: new Date().toISOString() },
    { repId: "rep-1", leadKey: "l3", result: "lost", dealValue: 0, responseTimeMinutes: 30, notes: "", timestamp: new Date().toISOString() },
    { repId: "rep-1", leadKey: "l4", result: "no-answer", dealValue: 0, responseTimeMinutes: 15, notes: "", timestamp: new Date().toISOString() },
  ];

  const perf = trackHumanPerformance("rep-1", outcomes);

  assert.equal(perf.repId, "rep-1");
  assert.equal(perf.totalInteractions, 4);
  assert.equal(perf.wins, 2);
  assert.equal(perf.losses, 1);
  assert.equal(perf.closeRate, 0.5);
  assert.equal(perf.avgDealSize, 6500);
  assert.equal(perf.avgResponseTimeMinutes, 15);
  assert.ok(perf.performanceScore > 0);
});

test("trackHumanPerformance generates coaching recommendations for poor performance", () => {
  setup();
  const outcomes: RepOutcome[] = [
    { repId: "rep-poor", leadKey: "l1", result: "lost", dealValue: 0, responseTimeMinutes: 60, notes: "", timestamp: new Date().toISOString() },
    { repId: "rep-poor", leadKey: "l2", result: "lost", dealValue: 0, responseTimeMinutes: 45, notes: "", timestamp: new Date().toISOString() },
  ];

  const perf = trackHumanPerformance("rep-poor", outcomes);

  assert.ok(perf.coachingRecommendations.length > 0);
  assert.ok(perf.coachingRecommendations.some((r) => r.includes("response time") || r.includes("Close rate")));
});

test("trackHumanPerformance accumulates outcomes across calls", () => {
  setup();
  const batch1: RepOutcome[] = [
    { repId: "rep-accum", leadKey: "l1", result: "won", dealValue: 5000, responseTimeMinutes: 10, notes: "", timestamp: new Date().toISOString() },
  ];
  const batch2: RepOutcome[] = [
    { repId: "rep-accum", leadKey: "l2", result: "won", dealValue: 7000, responseTimeMinutes: 8, notes: "", timestamp: new Date().toISOString() },
  ];

  trackHumanPerformance("rep-accum", batch1);
  const perf = trackHumanPerformance("rep-accum", batch2);

  assert.equal(perf.totalInteractions, 2);
  assert.equal(perf.wins, 2);
});

// ---------------------------------------------------------------------------
// optimizeHumanAllocation
// ---------------------------------------------------------------------------

test("optimizeHumanAllocation assigns highest value opps to best reps", () => {
  setup();
  const lead1 = createTestLead("alloc-1", { temperature: "hot", composite: 80 });
  const lead2 = createTestLead("alloc-2", { temperature: "cold", composite: 20 });

  const reps: RepProfile[] = [
    { repId: "rep-a", name: "Alice", niches: ["legal"], timezone: "EST", currentLoad: 2, maxLoad: 10, performanceScore: 90 },
    { repId: "rep-b", name: "Bob", niches: ["home-services"], timezone: "PST", currentLoad: 5, maxLoad: 10, performanceScore: 50 },
  ];

  const opps: HighValueOpportunity[] = [
    {
      leadKey: "alloc-1",
      tenantId: "tenant-test",
      reason: "Hot lead",
      category: "cooling-hot-lead",
      estimatedValue: 15000,
      urgency: 90,
      probability: 0.6,
      recommendedAction: "Call now",
      leadSnapshot: lead1,
    },
    {
      leadKey: "alloc-2",
      tenantId: "tenant-test",
      reason: "Cold lead",
      category: "stalled-high-intent",
      estimatedValue: 3000,
      urgency: 30,
      probability: 0.2,
      recommendedAction: "Nurture",
      leadSnapshot: lead2,
    },
  ];

  const plan = optimizeHumanAllocation(reps, opps);

  assert.equal(plan.assignments.length, 2);
  const highValueAssignment = plan.assignments.find((a) => a.opportunity.leadKey === "alloc-1");
  assert.ok(highValueAssignment);
  assert.equal(highValueAssignment.repId, "rep-a");
});

test("optimizeHumanAllocation respects rep max load", () => {
  setup();
  const lead1 = createTestLead("load-1", { temperature: "hot", composite: 80 });

  const reps: RepProfile[] = [
    { repId: "rep-full", name: "Full", niches: ["legal"], timezone: "EST", currentLoad: 10, maxLoad: 10, performanceScore: 90 },
  ];

  const opps: HighValueOpportunity[] = [
    {
      leadKey: "load-1",
      tenantId: "tenant-test",
      reason: "Hot lead",
      category: "cooling-hot-lead",
      estimatedValue: 15000,
      urgency: 90,
      probability: 0.6,
      recommendedAction: "Call now",
      leadSnapshot: lead1,
    },
  ];

  const plan = optimizeHumanAllocation(reps, opps);

  assert.equal(plan.assignments.length, 0);
  assert.equal(plan.unassigned.length, 1);
});

test("optimizeHumanAllocation matches niche expertise", () => {
  setup();
  const lead = createTestLead("niche-match", { temperature: "warm" });

  const reps: RepProfile[] = [
    { repId: "rep-legal", name: "Legal Expert", niches: ["legal"], timezone: "EST", currentLoad: 0, maxLoad: 10, performanceScore: 70 },
    { repId: "rep-home", name: "Home Expert", niches: ["home-services"], timezone: "PST", currentLoad: 0, maxLoad: 10, performanceScore: 80 },
  ];

  const opps: HighValueOpportunity[] = [
    {
      leadKey: "niche-match",
      tenantId: "tenant-test",
      reason: "Legal lead",
      category: "enterprise",
      estimatedValue: 10000,
      urgency: 50,
      probability: 0.4,
      recommendedAction: "White-glove outreach",
      leadSnapshot: lead,
    },
  ];

  const plan = optimizeHumanAllocation(reps, opps);

  assert.equal(plan.assignments.length, 1);
  assert.equal(plan.assignments[0].repId, "rep-legal");
});
