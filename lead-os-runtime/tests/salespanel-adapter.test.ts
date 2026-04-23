import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSalespanelConfig,
  isSalespanelDryRun,
  createLead,
  getLead,
  getLeadByEmail,
  listLeads,
  trackEvent,
  trackPageView,
  scoreLead,
  createSegment,
  getSegmentLeads,
  createScoringRule,
  getLeadStats,
  syncLeadToLeadOS,
  salespanelResult,
  resetSalespanelStore,
} from "../src/lib/integrations/salespanel-adapter.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveSalespanelConfig returns null when no API key is set", () => {
  delete process.env.SALESPANEL_API_KEY;
  const config = resolveSalespanelConfig();
  assert.equal(config, null);
});

test("resolveSalespanelConfig returns config when API key is set", () => {
  process.env.SALESPANEL_API_KEY = "test-key-123";
  const config = resolveSalespanelConfig();
  assert.ok(config);
  assert.equal(config.apiKey, "test-key-123");
  assert.equal(config.baseUrl, "https://salespanel.io/api/v1");
  delete process.env.SALESPANEL_API_KEY;
});

test("resolveSalespanelConfig uses custom base URL when set", () => {
  process.env.SALESPANEL_API_KEY = "test-key";
  process.env.SALESPANEL_BASE_URL = "https://custom.api.com/v2";
  const config = resolveSalespanelConfig();
  assert.ok(config);
  assert.equal(config.baseUrl, "https://custom.api.com/v2");
  delete process.env.SALESPANEL_API_KEY;
  delete process.env.SALESPANEL_BASE_URL;
});

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

test("isSalespanelDryRun returns true when no API key", () => {
  delete process.env.SALESPANEL_API_KEY;
  assert.equal(isSalespanelDryRun(), true);
});

test("isSalespanelDryRun returns false when API key is set", () => {
  process.env.SALESPANEL_API_KEY = "key";
  assert.equal(isSalespanelDryRun(), false);
  delete process.env.SALESPANEL_API_KEY;
});

// ---------------------------------------------------------------------------
// Lead CRUD
// ---------------------------------------------------------------------------

test("createLead creates a lead with defaults", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "alice@example.com" });

  assert.ok(lead.id.startsWith("sp_lead_"));
  assert.equal(lead.email, "alice@example.com");
  assert.equal(lead.source, "website");
  assert.equal(lead.temperature, "cold");
  assert.ok(lead.firstSeen);
  assert.ok(lead.lastSeen);
  assert.deepEqual(lead.pageViews, []);
  assert.deepEqual(lead.events, []);
});

test("createLead sets provided fields correctly", async () => {
  resetSalespanelStore();
  const lead = await createLead({
    email: "bob@corp.com",
    firstName: "Bob",
    lastName: "Smith",
    company: "Corp Inc",
    source: "form",
    tenantId: "t1",
  });

  assert.equal(lead.firstName, "Bob");
  assert.equal(lead.lastName, "Smith");
  assert.equal(lead.company, "Corp Inc");
  assert.equal(lead.source, "form");
  assert.equal(lead.tenantId, "t1");
});

test("createLead calculates initial fit score based on fields", async () => {
  resetSalespanelStore();
  const lead = await createLead({
    email: "test@example.com",
    company: "TestCo",
  });

  // email = 30, company = 40, no phone = 0 -> fitScore = 70
  assert.equal(lead.fitScore, 70);
});

test("getLead retrieves a created lead", async () => {
  resetSalespanelStore();
  const created = await createLead({ email: "get@test.com" });
  const retrieved = await getLead(created.id);

  assert.ok(retrieved);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.email, "get@test.com");
});

test("getLead returns null for non-existent lead", async () => {
  resetSalespanelStore();
  const result = await getLead("nonexistent-id");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Email lookup
// ---------------------------------------------------------------------------

test("getLeadByEmail finds a lead by email", async () => {
  resetSalespanelStore();
  await createLead({ email: "findme@example.com" });
  const lead = await getLeadByEmail("findme@example.com");

  assert.ok(lead);
  assert.equal(lead.email, "findme@example.com");
});

test("getLeadByEmail returns null when no match", async () => {
  resetSalespanelStore();
  const result = await getLeadByEmail("nothere@example.com");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

test("listLeads returns all leads when no filter", async () => {
  resetSalespanelStore();
  await createLead({ email: "a@test.com", source: "website" });
  await createLead({ email: "b@test.com", source: "email" });

  const leads = await listLeads();
  assert.equal(leads.length, 2);
});

test("listLeads filters by source", async () => {
  resetSalespanelStore();
  await createLead({ email: "a@test.com", source: "website" });
  await createLead({ email: "b@test.com", source: "email" });
  await createLead({ email: "c@test.com", source: "website" });

  const leads = await listLeads({ source: "website" });
  assert.equal(leads.length, 2);
});

test("listLeads filters by tenantId", async () => {
  resetSalespanelStore();
  await createLead({ email: "a@test.com", tenantId: "t1" });
  await createLead({ email: "b@test.com", tenantId: "t2" });
  await createLead({ email: "c@test.com", tenantId: "t1" });

  const leads = await listLeads({ tenantId: "t1" });
  assert.equal(leads.length, 2);
});

test("listLeads filters by temperature", async () => {
  resetSalespanelStore();
  await createLead({ email: "cold@test.com" });
  const leads = await listLeads({ temperature: "cold" });
  assert.ok(leads.length >= 1);
});

test("listLeads filters by minScore", async () => {
  resetSalespanelStore();
  await createLead({ email: "high@test.com", company: "BigCo" });
  await createLead({ email: "low@test.com" });

  const highScoreLeads = await listLeads({ minScore: 20 });
  const allLeads = await listLeads({ minScore: 0 });
  assert.ok(highScoreLeads.length <= allLeads.length);
});

// ---------------------------------------------------------------------------
// Event tracking with score recalculation
// ---------------------------------------------------------------------------

test("trackEvent adds event and recalculates scores", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "track@test.com" });
  const beforeScore = lead.behaviorScore;

  const updated = await trackEvent({
    leadId: lead.id,
    eventName: "button_click",
    eventValue: "signup",
  });

  assert.ok(updated);
  assert.equal(updated.events.length, 1);
  assert.equal(updated.events[0]!.name, "button_click");
  assert.equal(updated.events[0]!.value, "signup");
  assert.ok(updated.behaviorScore >= beforeScore);
});

test("trackEvent returns null for non-existent lead", async () => {
  resetSalespanelStore();
  const result = await trackEvent({
    leadId: "fake-id",
    eventName: "test",
  });
  assert.equal(result, null);
});

test("trackEvent updates lastSeen timestamp", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "time@test.com" });
  const originalLastSeen = lead.lastSeen;

  // Small delay to ensure timestamp differs
  await new Promise((resolve) => setTimeout(resolve, 10));

  const updated = await trackEvent({
    leadId: lead.id,
    eventName: "visit",
  });

  assert.ok(updated);
  assert.ok(updated.lastSeen >= originalLastSeen);
});

// ---------------------------------------------------------------------------
// Page view tracking
// ---------------------------------------------------------------------------

test("trackPageView adds a page view and recalculates scores", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "page@test.com" });

  const updated = await trackPageView(lead.id, "/pricing", 45);

  assert.ok(updated);
  assert.equal(updated.pageViews.length, 1);
  assert.equal(updated.pageViews[0]!.url, "/pricing");
  assert.equal(updated.pageViews[0]!.duration, 45);
});

test("trackPageView uses default duration of 0", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "nodur@test.com" });

  const updated = await trackPageView(lead.id, "/about");

  assert.ok(updated);
  assert.equal(updated.pageViews[0]!.duration, 0);
});

test("trackPageView returns null for non-existent lead", async () => {
  resetSalespanelStore();
  const result = await trackPageView("fake-id", "/page");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Scoring logic and temperature assignment
// ---------------------------------------------------------------------------

test("scoreLead calculates behavior score from page views and events", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "score@test.com" });

  await trackPageView(lead.id, "/home");
  await trackPageView(lead.id, "/pricing");
  await trackEvent({ leadId: lead.id, eventName: "click" });

  const scored = await scoreLead(lead.id);
  assert.ok(scored);
  // 2 page views * 5 = 10, 1 event * 10 = 10 -> behavior = 20
  assert.equal(scored.behaviorScore, 20);
});

test("scoreLead calculates fit score from profile completeness", async () => {
  resetSalespanelStore();
  const lead = await createLead({
    email: "fit@test.com",
    company: "FitCo",
  });

  const scored = await scoreLead(lead.id);
  assert.ok(scored);
  // email=30, company=40, no phone -> 70
  assert.equal(scored.fitScore, 70);
});

test("scoreLead assigns cold temperature for low scores", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "cold@test.com" });
  const scored = await scoreLead(lead.id);

  assert.ok(scored);
  assert.equal(scored.temperature, "cold");
});

test("scoreLead assigns warm temperature for moderate scores", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "warm@test.com", company: "WarmCo" });

  // Add enough activity to push into warm: need totalScore >= 25
  // fitScore = 70 (email + company). behaviorScore needs to push avg >= 25
  // No activity: totalScore = (0+70)/2 = 35 -> warm
  const scored = await scoreLead(lead.id);
  assert.ok(scored);
  assert.equal(scored.temperature, "warm");
});

test("scoreLead assigns hot temperature for high scores", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "hot@test.com", company: "HotCo" });

  // fitScore = 70. Need totalScore >= 50
  // Need behaviorScore >= 30 -> (30+70)/2=50
  // 6 page views = 30 behavior points
  for (let i = 0; i < 6; i++) {
    await trackPageView(lead.id, `/page-${i}`);
  }

  const scored = await scoreLead(lead.id);
  assert.ok(scored);
  assert.equal(scored.temperature, "hot");
});

test("scoreLead assigns burning temperature for very high scores", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "burn@test.com", company: "BurnCo" });

  // fitScore = 70, need totalScore >= 75 -> behaviorScore >= 80
  // 10 page views = 50, 3 events = 30 -> 80
  for (let i = 0; i < 10; i++) {
    await trackPageView(lead.id, `/page-${i}`);
  }
  for (let i = 0; i < 3; i++) {
    await trackEvent({ leadId: lead.id, eventName: `event-${i}` });
  }

  const scored = await scoreLead(lead.id);
  assert.ok(scored);
  assert.equal(scored.temperature, "burning");
});

test("scoreLead returns null for non-existent lead", async () => {
  resetSalespanelStore();
  const result = await scoreLead("fake-id");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Segments with condition matching
// ---------------------------------------------------------------------------

test("createSegment creates a segment with lead count", async () => {
  resetSalespanelStore();
  await createLead({ email: "seg1@test.com", source: "website" });
  await createLead({ email: "seg2@test.com", source: "email" });

  const segment = await createSegment({
    name: "Website Leads",
    conditions: [{ field: "source", operator: "equals", value: "website" }],
  });

  assert.ok(segment.id.startsWith("sp_seg_"));
  assert.equal(segment.name, "Website Leads");
  assert.equal(segment.leadCount, 1);
});

test("getSegmentLeads returns matching leads", async () => {
  resetSalespanelStore();
  await createLead({ email: "match1@test.com", source: "form" });
  await createLead({ email: "match2@test.com", source: "form" });
  await createLead({ email: "nomatch@test.com", source: "api" });

  const segment = await createSegment({
    name: "Form Leads",
    conditions: [{ field: "source", operator: "equals", value: "form" }],
  });

  const leads = await getSegmentLeads(segment.id);
  assert.equal(leads.length, 2);
});

test("getSegmentLeads returns empty for non-existent segment", async () => {
  resetSalespanelStore();
  const leads = await getSegmentLeads("fake-segment");
  assert.equal(leads.length, 0);
});

test("segment with contains operator matches partial strings", async () => {
  resetSalespanelStore();
  await createLead({ email: "alice@bigcorp.com", company: "BigCorp International" });
  await createLead({ email: "bob@smallco.com", company: "SmallCo" });

  const segment = await createSegment({
    name: "Corp Companies",
    conditions: [{ field: "company", operator: "contains", value: "Corp" }],
  });

  const leads = await getSegmentLeads(segment.id);
  assert.equal(leads.length, 1);
  assert.equal(leads[0]!.company, "BigCorp International");
});

test("segment with greater_than operator matches numeric fields", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "high@test.com", company: "HighCo" });
  await createLead({ email: "low@test.com" });

  // lead with company has higher fitScore
  const segment = await createSegment({
    name: "High Fit",
    conditions: [{ field: "fitScore", operator: "greater_than", value: 50 }],
  });

  const leads = await getSegmentLeads(segment.id);
  assert.ok(leads.length >= 1);
  assert.ok(leads.every((l) => l.fitScore > 50));
});

test("segment with multiple conditions requires all to match", async () => {
  resetSalespanelStore();
  await createLead({ email: "both@test.com", source: "website", company: "BothCo" });
  await createLead({ email: "source@test.com", source: "website" });
  await createLead({ email: "company@test.com", source: "email", company: "CompCo" });

  const segment = await createSegment({
    name: "Website + Company",
    conditions: [
      { field: "source", operator: "equals", value: "website" },
      { field: "fitScore", operator: "greater_than", value: 50 },
    ],
  });

  const leads = await getSegmentLeads(segment.id);
  // Only the one with source=website AND company (fitScore > 50) should match
  assert.equal(leads.length, 1);
  assert.equal(leads[0]!.email, "both@test.com");
});

// ---------------------------------------------------------------------------
// Scoring rules
// ---------------------------------------------------------------------------

test("createScoringRule creates and stores a rule", async () => {
  resetSalespanelStore();
  const rule = await createScoringRule({
    name: "Page visit bonus",
    type: "behavior",
    field: "pageViews",
    condition: "count > 5",
    points: 20,
    tenantId: "t1",
  });

  assert.ok(rule.id.startsWith("sp_rule_"));
  assert.equal(rule.name, "Page visit bonus");
  assert.equal(rule.type, "behavior");
  assert.equal(rule.points, 20);
  assert.equal(rule.tenantId, "t1");
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getLeadStats returns aggregate statistics", async () => {
  resetSalespanelStore();
  await createLead({ email: "s1@test.com", source: "website" });
  await createLead({ email: "s2@test.com", source: "website" });
  await createLead({ email: "s3@test.com", source: "email" });

  const stats = await getLeadStats();

  assert.equal(stats.totalLeads, 3);
  assert.equal(stats.bySource.website, 2);
  assert.equal(stats.bySource.email, 1);
  assert.equal(stats.bySource.form, 0);
});

test("getLeadStats filters by tenantId", async () => {
  resetSalespanelStore();
  await createLead({ email: "t1@test.com", tenantId: "tenant-1" });
  await createLead({ email: "t2@test.com", tenantId: "tenant-2" });

  const stats = await getLeadStats("tenant-1");
  assert.equal(stats.totalLeads, 1);
});

test("getLeadStats returns empty stats when no leads", async () => {
  resetSalespanelStore();
  const stats = await getLeadStats();

  assert.equal(stats.totalLeads, 0);
  assert.equal(stats.avgBehaviorScore, 0);
  assert.equal(stats.avgFitScore, 0);
  assert.equal(stats.topPages.length, 0);
});

test("getLeadStats computes topPages correctly", async () => {
  resetSalespanelStore();
  const lead1 = await createLead({ email: "p1@test.com" });
  const lead2 = await createLead({ email: "p2@test.com" });

  await trackPageView(lead1.id, "/pricing");
  await trackPageView(lead1.id, "/pricing");
  await trackPageView(lead2.id, "/pricing");
  await trackPageView(lead1.id, "/about");

  const stats = await getLeadStats();
  assert.equal(stats.topPages[0]!.url, "/pricing");
  assert.equal(stats.topPages[0]!.views, 3);
});

// ---------------------------------------------------------------------------
// Lead sync
// ---------------------------------------------------------------------------

test("syncLeadToLeadOS returns ProviderResult with lead data", async () => {
  resetSalespanelStore();
  const lead = await createLead({
    email: "sync@test.com",
    firstName: "Sync",
    company: "SyncCo",
    tenantId: "t1",
  });

  const result = await syncLeadToLeadOS(lead.id);

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Salespanel");
  assert.ok(result.payload);
  assert.equal(result.payload.email, "sync@test.com");
  assert.equal(result.payload.tenantId, "t1");
});

test("syncLeadToLeadOS uses override tenantId when provided", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "sync2@test.com", tenantId: "t1" });

  const result = await syncLeadToLeadOS(lead.id, "t-override");

  assert.ok(result.payload);
  assert.equal(result.payload.tenantId, "t-override");
});

test("syncLeadToLeadOS returns error for non-existent lead", async () => {
  resetSalespanelStore();
  const result = await syncLeadToLeadOS("fake-id");

  assert.equal(result.ok, false);
  assert.ok(result.detail.includes("not found"));
});

// ---------------------------------------------------------------------------
// ProviderResult
// ---------------------------------------------------------------------------

test("salespanelResult returns correctly shaped ProviderResult", () => {
  delete process.env.SALESPANEL_API_KEY;
  const result = salespanelResult("test-op", "some detail");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Salespanel");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "[test-op] some detail");
});

test("salespanelResult returns live mode when API key is set", () => {
  process.env.SALESPANEL_API_KEY = "key";
  const result = salespanelResult("op", "detail");

  assert.equal(result.mode, "live");
  delete process.env.SALESPANEL_API_KEY;
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("behavior score caps at 100", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "cap@test.com" });

  // Add many events and page views to exceed cap
  for (let i = 0; i < 20; i++) {
    await trackPageView(lead.id, `/page-${i}`);
    await trackEvent({ leadId: lead.id, eventName: `event-${i}` });
  }

  const scored = await scoreLead(lead.id);
  assert.ok(scored);
  assert.ok(scored.behaviorScore <= 100);
});

test("multiple events accumulate correctly", async () => {
  resetSalespanelStore();
  const lead = await createLead({ email: "multi@test.com" });

  await trackEvent({ leadId: lead.id, eventName: "e1" });
  await trackEvent({ leadId: lead.id, eventName: "e2" });
  await trackEvent({ leadId: lead.id, eventName: "e3" });

  const updated = await getLead(lead.id);
  assert.ok(updated);
  assert.equal(updated.events.length, 3);
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetSalespanelStore clears all stores", async () => {
  await createLead({ email: "before@test.com" });
  await createSegment({
    name: "Before",
    conditions: [{ field: "source", operator: "equals", value: "website" }],
  });
  await createScoringRule({
    name: "Before Rule",
    type: "behavior",
    field: "events",
    condition: "count > 0",
    points: 5,
  });

  resetSalespanelStore();

  const leads = await listLeads();
  const stats = await getLeadStats();

  assert.equal(leads.length, 0);
  assert.equal(stats.totalLeads, 0);
});
