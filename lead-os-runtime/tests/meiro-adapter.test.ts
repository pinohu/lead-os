import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveMeiroConfig,
  isMeiroDryRun,
  resolveIdentity,
  ingestEvent,
  ingestBulkEvents,
  getProfile,
  getProfileByEmail,
  listProfiles,
  mergeProfiles,
  registerDataSource,
  listDataSources,
  createSegment,
  getSegmentProfiles,
  listSegments,
  syncLeadToMeiro,
  getMeiroStats,
  meiroResult,
  resetMeiroStore,
} from "../src/lib/integrations/meiro-cdp-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearMeiroEnv() {
  delete process.env.MEIRO_API_KEY;
  delete process.env.MEIRO_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveMeiroConfig returns null when no API key", () => {
  clearMeiroEnv();
  const cfg = resolveMeiroConfig();
  assert.equal(cfg, null);
});

test("resolveMeiroConfig returns config when API key is set", () => {
  clearMeiroEnv();
  process.env.MEIRO_API_KEY = "mk-test-123";
  const cfg = resolveMeiroConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "mk-test-123");
  assert.equal(cfg.baseUrl, "https://api.meiro.io/v1");
  clearMeiroEnv();
});

test("resolveMeiroConfig uses custom base URL from env", () => {
  clearMeiroEnv();
  process.env.MEIRO_API_KEY = "mk-test";
  process.env.MEIRO_BASE_URL = "https://custom.meiro.io/v2";
  const cfg = resolveMeiroConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.meiro.io/v2");
  clearMeiroEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isMeiroDryRun returns true when no API key", () => {
  clearMeiroEnv();
  assert.equal(isMeiroDryRun(), true);
});

test("isMeiroDryRun returns false when API key is set", () => {
  clearMeiroEnv();
  process.env.MEIRO_API_KEY = "mk-test";
  assert.equal(isMeiroDryRun(), false);
  clearMeiroEnv();
});

// ---------------------------------------------------------------------------
// Identity Resolution
// ---------------------------------------------------------------------------

test("resolveIdentity creates new profile for unknown email", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile, resolution } = await resolveIdentity("new@example.com");
  assert.ok(profile.id);
  assert.equal(profile.primaryEmail, "new@example.com");
  assert.deepEqual(profile.emails, ["new@example.com"]);
  assert.equal(resolution.matchedOn, "new");
  assert.equal(resolution.confidence, 1.0);
});

test("resolveIdentity finds existing profile by email", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: first } = await resolveIdentity("exist@example.com");
  const { profile: second, resolution } = await resolveIdentity("exist@example.com");
  assert.equal(first.id, second.id);
  assert.equal(resolution.matchedOn, "email");
});

test("resolveIdentity matches by phone when email differs", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: first } = await resolveIdentity("a@example.com", "+15551234567");
  const { profile: second, resolution } = await resolveIdentity("b@example.com", "+15551234567");
  assert.equal(first.id, second.id);
  assert.equal(resolution.matchedOn, "phone");
  assert.equal(resolution.confidence, 0.85);
  assert.ok(second.emails.includes("b@example.com"));
});

test("resolveIdentity creates new profile when no match", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: first } = await resolveIdentity("a@example.com", "+1111");
  const { profile: second } = await resolveIdentity("b@example.com", "+2222");
  assert.notEqual(first.id, second.id);
});

test("resolveIdentity is case-insensitive for email", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: first } = await resolveIdentity("Test@Example.COM");
  const { profile: second } = await resolveIdentity("test@example.com");
  assert.equal(first.id, second.id);
});

test("resolveIdentity stores phone on new profile", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("phone@example.com", "+19998887777");
  assert.deepEqual(profile.phones, ["+19998887777"]);
});

// ---------------------------------------------------------------------------
// Event Ingestion
// ---------------------------------------------------------------------------

test("ingestEvent creates event with generated id", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("ev@example.com");
  const event = await ingestEvent({
    profileId: profile.id,
    source: "website",
    eventType: "page_view",
    properties: { url: "/pricing" },
    timestamp: new Date().toISOString(),
  });
  assert.ok(event.id);
  assert.equal(event.profileId, profile.id);
  assert.equal(event.eventType, "page_view");
});

test("ingestEvent increments profile totalInteractions", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("count@example.com");
  assert.equal(profile.totalInteractions, 0);
  await ingestEvent({
    profileId: profile.id,
    source: "form",
    eventType: "submit",
    properties: {},
    timestamp: new Date().toISOString(),
  });
  assert.equal(profile.totalInteractions, 1);
});

test("ingestEvent adds source to profile sources", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("src@example.com");
  await ingestEvent({
    profileId: profile.id,
    source: "chat",
    eventType: "message",
    properties: {},
    timestamp: new Date().toISOString(),
  });
  assert.ok(profile.sources.includes("chat"));
});

test("ingestEvent does not duplicate sources", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("dup@example.com");
  const ts = new Date().toISOString();
  await ingestEvent({ profileId: profile.id, source: "form", eventType: "a", properties: {}, timestamp: ts });
  await ingestEvent({ profileId: profile.id, source: "form", eventType: "b", properties: {}, timestamp: ts });
  assert.equal(profile.sources.filter((s) => s === "form").length, 1);
});

test("ingestEvent updates data source eventsCount", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const source = await registerDataSource({ name: "website", type: "website" });
  const { profile } = await resolveIdentity("ds@example.com");
  await ingestEvent({
    profileId: profile.id,
    source: "website",
    eventType: "visit",
    properties: {},
    timestamp: new Date().toISOString(),
  });
  assert.equal(source.eventsCount, 1);
});

test("ingestBulkEvents processes multiple events", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("bulk@example.com");
  const ts = new Date().toISOString();
  const results = await ingestBulkEvents([
    { profileId: profile.id, source: "web", eventType: "view", properties: {}, timestamp: ts },
    { profileId: profile.id, source: "web", eventType: "click", properties: {}, timestamp: ts },
    { profileId: profile.id, source: "web", eventType: "scroll", properties: {}, timestamp: ts },
  ]);
  assert.equal(results.length, 3);
  assert.equal(profile.totalInteractions, 3);
});

// ---------------------------------------------------------------------------
// Profile Operations
// ---------------------------------------------------------------------------

test("getProfile returns profile by id", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("get@example.com");
  const fetched = await getProfile(profile.id);
  assert.ok(fetched);
  assert.equal(fetched.id, profile.id);
});

test("getProfile returns null for unknown id", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const fetched = await getProfile("nonexistent-id");
  assert.equal(fetched, null);
});

test("getProfileByEmail returns profile by email", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("byemail@example.com");
  const fetched = await getProfileByEmail("byemail@example.com");
  assert.ok(fetched);
  assert.equal(fetched.id, profile.id);
});

test("getProfileByEmail is case-insensitive", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await resolveIdentity("case@example.com");
  const fetched = await getProfileByEmail("CASE@Example.COM");
  assert.ok(fetched);
});

test("getProfileByEmail returns null for unknown email", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const fetched = await getProfileByEmail("nobody@example.com");
  assert.equal(fetched, null);
});

test("listProfiles returns all profiles", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await resolveIdentity("list1@example.com");
  await resolveIdentity("list2@example.com");
  const profiles = await listProfiles();
  assert.equal(profiles.length, 2);
});

test("listProfiles filters by tenantId", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("t1@example.com");
  p1.tenantId = "tenant-a";
  const { profile: p2 } = await resolveIdentity("t2@example.com");
  p2.tenantId = "tenant-b";
  const filtered = await listProfiles("tenant-a");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].primaryEmail, "t1@example.com");
});

test("listProfiles respects limit", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await resolveIdentity("lim1@example.com");
  await resolveIdentity("lim2@example.com");
  await resolveIdentity("lim3@example.com");
  const profiles = await listProfiles(undefined, 2);
  assert.equal(profiles.length, 2);
});

// ---------------------------------------------------------------------------
// Profile Merging
// ---------------------------------------------------------------------------

test("mergeProfiles combines emails", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("merge1@example.com");
  const { profile: p2 } = await resolveIdentity("merge2@example.com");
  const merged = await mergeProfiles(p1.id, p2.id);
  assert.ok(merged);
  assert.ok(merged.emails.includes("merge1@example.com"));
  assert.ok(merged.emails.includes("merge2@example.com"));
});

test("mergeProfiles combines phones", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("mp1@example.com", "+1111");
  const { profile: p2 } = await resolveIdentity("mp2@example.com", "+2222");
  const merged = await mergeProfiles(p1.id, p2.id);
  assert.ok(merged);
  assert.ok(merged.phones.includes("+1111"));
  assert.ok(merged.phones.includes("+2222"));
});

test("mergeProfiles keeps earliest firstSeen", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("fs1@example.com");
  p1.firstSeen = "2024-01-01T00:00:00Z";
  const { profile: p2 } = await resolveIdentity("fs2@example.com");
  p2.firstSeen = "2023-06-15T00:00:00Z";
  const merged = await mergeProfiles(p1.id, p2.id);
  assert.ok(merged);
  assert.equal(merged.firstSeen, "2023-06-15T00:00:00Z");
});

test("mergeProfiles sums totalInteractions", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("ti1@example.com");
  p1.totalInteractions = 5;
  const { profile: p2 } = await resolveIdentity("ti2@example.com");
  p2.totalInteractions = 3;
  const merged = await mergeProfiles(p1.id, p2.id);
  assert.ok(merged);
  assert.equal(merged.totalInteractions, 8);
});

test("mergeProfiles removes secondary profile", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("rm1@example.com");
  const { profile: p2 } = await resolveIdentity("rm2@example.com");
  await mergeProfiles(p1.id, p2.id);
  const gone = await getProfile(p2.id);
  assert.equal(gone, null);
});

test("mergeProfiles tracks mergedProfileIds", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("mid1@example.com");
  const { profile: p2 } = await resolveIdentity("mid2@example.com");
  const p2Id = p2.id;
  const merged = await mergeProfiles(p1.id, p2Id);
  assert.ok(merged);
  assert.ok(merged.mergedProfileIds.includes(p2Id));
});

test("mergeProfiles returns null for unknown ids", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const result = await mergeProfiles("fake-1", "fake-2");
  assert.equal(result, null);
});

test("mergeProfiles returns same profile when ids match", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("same@example.com");
  const merged = await mergeProfiles(profile.id, profile.id);
  assert.ok(merged);
  assert.equal(merged.id, profile.id);
});

test("mergeProfiles reassigns events from secondary to primary", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("ev1@example.com");
  const { profile: p2 } = await resolveIdentity("ev2@example.com");
  const event = await ingestEvent({
    profileId: p2.id,
    source: "web",
    eventType: "click",
    properties: {},
    timestamp: new Date().toISOString(),
  });
  await mergeProfiles(p1.id, p2.id);
  assert.equal(event.profileId, p1.id);
});

test("mergeProfiles combines names and companies", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("nc1@example.com");
  p1.names.push("Alice");
  p1.companies.push("Acme");
  const { profile: p2 } = await resolveIdentity("nc2@example.com");
  p2.names.push("Bob");
  p2.companies.push("Globex");
  const merged = await mergeProfiles(p1.id, p2.id);
  assert.ok(merged);
  assert.ok(merged.names.includes("Alice"));
  assert.ok(merged.names.includes("Bob"));
  assert.ok(merged.companies.includes("Acme"));
  assert.ok(merged.companies.includes("Globex"));
});

// ---------------------------------------------------------------------------
// Data Sources
// ---------------------------------------------------------------------------

test("registerDataSource creates a new source", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const source = await registerDataSource({ name: "Contact Form", type: "form" });
  assert.ok(source.id);
  assert.equal(source.name, "Contact Form");
  assert.equal(source.type, "form");
  assert.equal(source.eventsCount, 0);
});

test("registerDataSource returns existing source if name matches", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const s1 = await registerDataSource({ name: "Chat Widget", type: "chat" });
  const s2 = await registerDataSource({ name: "Chat Widget", type: "chat" });
  assert.equal(s1.id, s2.id);
});

test("listDataSources returns all sources", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await registerDataSource({ name: "Web", type: "website" });
  await registerDataSource({ name: "Phone", type: "phone" });
  const sources = await listDataSources();
  assert.equal(sources.length, 2);
});

test("listDataSources filters by tenantId", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await registerDataSource({ name: "Web", type: "website", tenantId: "t1" });
  await registerDataSource({ name: "Phone", type: "phone", tenantId: "t2" });
  const filtered = await listDataSources("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "Web");
});

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

test("createSegment creates segment and matches profiles", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("seg@example.com");
  profile.attributes.plan = "enterprise";
  const segment = await createSegment({
    name: "Enterprise Users",
    conditions: [{ attribute: "plan", operator: "equals", value: "enterprise" }],
  });
  assert.ok(segment.id);
  assert.equal(segment.profileCount, 1);
  assert.ok(profile.segments.includes(segment.id));
});

test("createSegment with gt operator", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("gt1@example.com");
  p1.attributes.score = 80;
  const { profile: p2 } = await resolveIdentity("gt2@example.com");
  p2.attributes.score = 30;
  const segment = await createSegment({
    name: "High Score",
    conditions: [{ attribute: "score", operator: "gt", value: 50 }],
  });
  assert.equal(segment.profileCount, 1);
});

test("createSegment with contains operator", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("cont@example.com");
  profile.attributes.industry = "financial services";
  const segment = await createSegment({
    name: "Finance",
    conditions: [{ attribute: "industry", operator: "contains", value: "financial" }],
  });
  assert.equal(segment.profileCount, 1);
});

test("createSegment with exists operator", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile: p1 } = await resolveIdentity("ex1@example.com");
  p1.attributes.vip = true;
  await resolveIdentity("ex2@example.com");
  const segment = await createSegment({
    name: "VIP",
    conditions: [{ attribute: "vip", operator: "exists", value: "" }],
  });
  assert.equal(segment.profileCount, 1);
});

test("getSegmentProfiles returns profiles in segment", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("sp@example.com");
  profile.attributes.tier = "gold";
  const segment = await createSegment({
    name: "Gold",
    conditions: [{ attribute: "tier", operator: "equals", value: "gold" }],
  });
  const profiles = await getSegmentProfiles(segment.id);
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].id, profile.id);
});

test("getSegmentProfiles returns empty for unknown segment", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const profiles = await getSegmentProfiles("nonexistent");
  assert.equal(profiles.length, 0);
});

test("listSegments returns all segments", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await createSegment({ name: "A", conditions: [] });
  await createSegment({ name: "B", conditions: [] });
  const segments = await listSegments();
  assert.equal(segments.length, 2);
});

test("listSegments filters by tenantId", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await createSegment({ name: "A", conditions: [], tenantId: "t1" });
  await createSegment({ name: "B", conditions: [], tenantId: "t2" });
  const filtered = await listSegments("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "A");
});

// ---------------------------------------------------------------------------
// Sync Lead to Meiro
// ---------------------------------------------------------------------------

test("syncLeadToMeiro creates profile and ingests event", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile, resolution } = await syncLeadToMeiro({
    email: "lead@example.com",
    name: "Jane Doe",
    company: "Acme Inc",
    source: "form",
  });
  assert.ok(profile.id);
  assert.equal(profile.primaryEmail, "lead@example.com");
  assert.ok(profile.names.includes("Jane Doe"));
  assert.ok(profile.companies.includes("Acme Inc"));
  assert.ok(profile.sources.includes("form"));
  assert.equal(profile.totalInteractions, 1);
  assert.ok(resolution.matchedOn === "new");
});

test("syncLeadToMeiro merges into existing profile", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await syncLeadToMeiro({ email: "repeat@example.com", name: "First" });
  const { profile } = await syncLeadToMeiro({ email: "repeat@example.com", name: "Second", company: "Corp" });
  assert.ok(profile.names.includes("First"));
  assert.ok(profile.names.includes("Second"));
  assert.ok(profile.companies.includes("Corp"));
  assert.equal(profile.totalInteractions, 2);
});

test("syncLeadToMeiro sets tenantId", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await syncLeadToMeiro(
    { email: "tenant@example.com" },
    "my-tenant",
  );
  assert.equal(profile.tenantId, "my-tenant");
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getMeiroStats returns zeroes on empty store", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const stats = await getMeiroStats();
  assert.equal(stats.totalProfiles, 0);
  assert.equal(stats.totalEvents, 0);
  assert.equal(stats.totalSources, 0);
  assert.equal(stats.totalSegments, 0);
  assert.equal(stats.avgInteractions, 0);
});

test("getMeiroStats aggregates correctly", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  await syncLeadToMeiro({ email: "s1@example.com", source: "form" });
  await syncLeadToMeiro({ email: "s2@example.com", source: "chat" });
  await registerDataSource({ name: "form", type: "form" });
  await createSegment({ name: "All", conditions: [] });
  const stats = await getMeiroStats();
  assert.equal(stats.totalProfiles, 2);
  assert.ok(stats.totalEvents >= 2);
  assert.equal(stats.totalSources, 1);
  assert.equal(stats.totalSegments, 1);
});

test("getMeiroStats computes topSources", async () => {
  resetMeiroStore();
  clearMeiroEnv();
  const { profile } = await resolveIdentity("top@example.com");
  const ts = new Date().toISOString();
  await ingestEvent({ profileId: profile.id, source: "web", eventType: "a", properties: {}, timestamp: ts });
  await ingestEvent({ profileId: profile.id, source: "web", eventType: "b", properties: {}, timestamp: ts });
  await ingestEvent({ profileId: profile.id, source: "email", eventType: "c", properties: {}, timestamp: ts });
  const stats = await getMeiroStats();
  assert.ok(stats.topSources.length > 0);
  assert.equal(stats.topSources[0].source, "web");
  assert.equal(stats.topSources[0].events, 2);
});

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

test("meiroResult returns dry-run mode without API key", () => {
  clearMeiroEnv();
  const result = meiroResult("ingest", "Event ingested");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "MeiroCDP");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Event ingested");
});

test("meiroResult returns live mode with API key", () => {
  clearMeiroEnv();
  process.env.MEIRO_API_KEY = "mk-test";
  const result = meiroResult("resolve", "Identity resolved");
  assert.equal(result.mode, "live");
  clearMeiroEnv();
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetMeiroStore clears all data", async () => {
  clearMeiroEnv();
  await syncLeadToMeiro({ email: "reset@example.com" });
  await registerDataSource({ name: "web", type: "website" });
  await createSegment({ name: "test", conditions: [] });
  resetMeiroStore();
  const profiles = await listProfiles();
  const sources = await listDataSources();
  const segments = await listSegments();
  assert.equal(profiles.length, 0);
  assert.equal(sources.length, 0);
  assert.equal(segments.length, 0);
});
