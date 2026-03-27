import test from "node:test";
import assert from "node:assert/strict";
import {
  shouldEscalate,
  classifyEscalationType,
  routeToSalesRep,
  createSalesHandoff,
  scheduleCallback,
  notifySalesTeam,
  notifyHighValueLead,
  recordEscalationOutcome,
  getEscalationMetrics,
  _resetStores,
  type LeadForEscalation,
  type SalesRep,
  type EscalationSignals,
  type Escalation,
} from "../src/lib/escalation-engine.ts";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.beforeEach(() => {
  _resetStores();
});

function makeLead(overrides: Partial<LeadForEscalation> = {}): LeadForEscalation {
  return {
    id: "lead-1",
    tenantId: "tenant-1",
    niche: "plumber",
    name: "John Smith",
    email: "john@example.com",
    ...overrides,
  };
}

function makeRep(overrides: Partial<SalesRep> = {}): SalesRep {
  return {
    id: "rep-1",
    name: "Alice",
    email: "alice@sales.com",
    phone: "+15551234567",
    niches: ["plumber"],
    timezone: "America/Chicago",
    maxDailyCapacity: 10,
    currentDailyLoad: 2,
    isAvailable: true,
    closingRate: 0.7,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// shouldEscalate
// ---------------------------------------------------------------------------

test("shouldEscalate returns true when composite score exceeds threshold (85)", () => {
  const lead = makeLead();
  const result = shouldEscalate(lead, 90, {});
  assert.equal(result.escalate, true);
  assert.ok(result.reasons.some((r) => r.includes("composite-score")));
});

test("shouldEscalate returns false when no signals are present", () => {
  const lead = makeLead();
  const result = shouldEscalate(lead, 50, {});
  assert.equal(result.escalate, false);
  assert.equal(result.reasons.length, 0);
});

test("shouldEscalate returns true for deal value above $5000", () => {
  const lead = makeLead();
  const result = shouldEscalate(lead, 40, { estimatedDealValue: 8000 });
  assert.equal(result.escalate, true);
  assert.ok(result.reasons.some((r) => r.includes("deal-value")));
});

test("shouldEscalate returns true for explicit phone request", () => {
  const lead = makeLead();
  const result = shouldEscalate(lead, 40, { hasPhoneRequest: true });
  assert.equal(result.escalate, true);
  assert.ok(result.reasons.some((r) => r.includes("phone-request")));
});

test("shouldEscalate returns true for competitor mention with high urgency", () => {
  const lead = makeLead();
  const result = shouldEscalate(lead, 40, { competitorMentioned: true, urgencyLevel: "high" });
  assert.equal(result.escalate, true);
  assert.ok(result.reasons.some((r) => r.includes("competitor")));
});

test("shouldEscalate returns true for enterprise company size", () => {
  const lead = makeLead({ companySize: "enterprise" });
  const result = shouldEscalate(lead, 40, { companySize: "enterprise" });
  assert.equal(result.escalate, true);
  assert.ok(result.reasons.some((r) => r.includes("enterprise")));
});

test("shouldEscalate accumulates multiple reasons", () => {
  const lead = makeLead({ companySize: "enterprise", estimatedDealValue: 10000 });
  const result = shouldEscalate(lead, 90, {
    estimatedDealValue: 10000,
    hasPhoneRequest: true,
    companySize: "enterprise",
  });
  assert.equal(result.escalate, true);
  assert.ok(result.reasons.length >= 3);
});

// ---------------------------------------------------------------------------
// classifyEscalationType
// ---------------------------------------------------------------------------

test("classifyEscalationType returns immediate-call for phone + high deal value", () => {
  const lead = makeLead({ phone: "+15551234567", estimatedDealValue: 10000 });
  assert.equal(classifyEscalationType(lead), "immediate-call");
});

test("classifyEscalationType returns vip-concierge for enterprise + deal >= 20k", () => {
  const lead = makeLead({ companySize: "enterprise", estimatedDealValue: 25000 });
  assert.equal(classifyEscalationType(lead), "vip-concierge");
});

test("classifyEscalationType returns partnership-inquiry for enterprise", () => {
  const lead = makeLead({ companySize: "enterprise", estimatedDealValue: 15000 });
  assert.equal(classifyEscalationType(lead), "partnership-inquiry");
});

test("classifyEscalationType returns scheduled-demo as default", () => {
  const lead = makeLead({ estimatedDealValue: 2000 });
  assert.equal(classifyEscalationType(lead), "scheduled-demo");
});

// ---------------------------------------------------------------------------
// routeToSalesRep
// ---------------------------------------------------------------------------

test("routeToSalesRep selects rep with matching niche and capacity", () => {
  const lead = makeLead({ niche: "plumber" });
  const team = [
    makeRep({ id: "rep-1", niches: ["lawyer"], currentDailyLoad: 0 }),
    makeRep({ id: "rep-2", niches: ["plumber"], currentDailyLoad: 1 }),
  ];
  const rep = routeToSalesRep(lead, team);
  assert.ok(rep !== null);
  assert.equal(rep.id, "rep-2");
});

test("routeToSalesRep returns null when all reps are at capacity", () => {
  const lead = makeLead();
  const team = [
    makeRep({ id: "rep-1", maxDailyCapacity: 5, currentDailyLoad: 5 }),
    makeRep({ id: "rep-2", maxDailyCapacity: 3, currentDailyLoad: 3 }),
  ];
  const rep = routeToSalesRep(lead, team);
  assert.equal(rep, null);
});

test("routeToSalesRep prefers rep with higher closing rate", () => {
  const lead = makeLead({ niche: "plumber" });
  const team = [
    makeRep({ id: "rep-1", niches: ["plumber"], closingRate: 0.3, currentDailyLoad: 0 }),
    makeRep({ id: "rep-2", niches: ["plumber"], closingRate: 0.9, currentDailyLoad: 0 }),
  ];
  const rep = routeToSalesRep(lead, team);
  assert.ok(rep !== null);
  assert.equal(rep.id, "rep-2");
});

// ---------------------------------------------------------------------------
// createSalesHandoff
// ---------------------------------------------------------------------------

test("createSalesHandoff generates complete handoff document", () => {
  const lead = makeLead({
    phone: "+15551234567",
    company: "Acme Plumbing",
    estimatedDealValue: 8000,
  });
  const rep = makeRep();
  const handoff = createSalesHandoff(lead, rep, {
    scoringBreakdown: [{ category: "intent", score: 85, factors: ["phone provided"] }],
    conversationHighlights: ["Asked about pricing"],
    estimatedValue: 8000,
  });

  assert.ok(handoff.escalationId.startsWith("esc-"));
  assert.equal(handoff.leadId, "lead-1");
  assert.equal(handoff.repId, "rep-1");
  assert.ok(handoff.leadSummary.includes("John Smith"));
  assert.ok(handoff.leadSummary.includes("Acme Plumbing"));
  assert.ok(handoff.recommendedApproach.length > 0);
  assert.ok(handoff.objectionPredictions.length > 0);
  assert.equal(handoff.estimatedValue, 8000);
});

// ---------------------------------------------------------------------------
// scheduleCallback
// ---------------------------------------------------------------------------

test("scheduleCallback creates a callback task with lead context", () => {
  const lead = makeLead({ name: "Bob Builder" });
  const task = scheduleCallback(lead, "rep-1", "2026-03-28T14:00:00Z");
  assert.ok(task.id.startsWith("cb-"));
  assert.equal(task.leadId, "lead-1");
  assert.equal(task.repId, "rep-1");
  assert.equal(task.preferredTime, "2026-03-28T14:00:00Z");
  assert.equal(task.status, "scheduled");
  assert.ok(task.leadContext.includes("Bob Builder"));
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

test("notifySalesTeam sends all channels for critical priority", () => {
  const escalation: Escalation = {
    id: "esc-1",
    leadId: "lead-1",
    tenantId: "tenant-1",
    type: "immediate-call",
    priority: "critical",
    assignedRepId: "rep-1",
    estimatedValue: 25000,
    signals: [],
    status: "assigned",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const result = notifySalesTeam(escalation);
  assert.ok(result.channels.includes("dashboard"));
  assert.ok(result.channels.includes("email"));
  assert.ok(result.channels.includes("sms"));
  assert.ok(result.channels.includes("slack"));
});

test("notifyHighValueLead sends all channels", () => {
  const lead = makeLead();
  const result = notifyHighValueLead(lead, 50000);
  assert.ok(result.channels.includes("sms"));
  assert.ok(result.channels.includes("slack"));
  assert.ok(result.escalationId.length > 0);
});

// ---------------------------------------------------------------------------
// Outcome Tracking & Metrics
// ---------------------------------------------------------------------------

test("recordEscalationOutcome stores outcome and updates escalation status", async () => {
  const lead = makeLead({ estimatedDealValue: 10000 });
  const rep = makeRep();
  const handoff = createSalesHandoff(lead, rep, { estimatedValue: 10000 });

  const outcome = await recordEscalationOutcome(handoff.escalationId, "won", 12000, "Closed after demo");
  assert.equal(outcome.outcome, "won");
  assert.equal(outcome.dealValue, 12000);
  assert.ok(outcome.recordedAt.length > 0);
});

test("getEscalationMetrics computes conversion rate and average deal size", async () => {
  const now = new Date().toISOString().slice(0, 7);
  const rep = makeRep();

  const h1 = createSalesHandoff(makeLead({ id: "l1" }), rep, { estimatedValue: 5000 });
  const h2 = createSalesHandoff(makeLead({ id: "l2" }), rep, { estimatedValue: 8000 });
  const h3 = createSalesHandoff(makeLead({ id: "l3" }), rep, { estimatedValue: 3000 });

  await recordEscalationOutcome(h1.escalationId, "won", 6000);
  await recordEscalationOutcome(h2.escalationId, "lost", 0);
  await recordEscalationOutcome(h3.escalationId, "won", 4000);

  const metrics = getEscalationMetrics("tenant-1", now);
  assert.equal(metrics.totalEscalations, 3);
  assert.ok(metrics.conversionRate > 0);
  assert.ok(metrics.averageDealSize > 0);
  assert.equal(metrics.outcomeBreakdown.won, 2);
  assert.equal(metrics.outcomeBreakdown.lost, 1);
  assert.ok(metrics.closeRateByRep["rep-1"] > 0);
});
