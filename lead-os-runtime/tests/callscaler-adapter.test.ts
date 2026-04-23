import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveCallScalerConfig,
  isCallScalerDryRun,
  provisionNumber,
  listNumbers,
  getNumber,
  pauseNumber,
  resumeNumber,
  releaseNumber,
  recordCall,
  getCall,
  listCalls,
  getCallStats,
  getSourceAttribution,
  convertCallToLead,
  callScalerResult,
  resetCallScalerStore,
} from "../src/lib/integrations/callscaler-adapter.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveCallScalerConfig returns null when no API key is set", () => {
  delete process.env.CALLSCALER_API_KEY;
  const config = resolveCallScalerConfig();
  assert.equal(config, null);
});

test("resolveCallScalerConfig returns config when API key is present", () => {
  process.env.CALLSCALER_API_KEY = "test-key";
  const config = resolveCallScalerConfig();
  assert.ok(config);
  assert.equal(config.apiKey, "test-key");
  assert.equal(config.baseUrl, "https://api.callscaler.com/v1");
  delete process.env.CALLSCALER_API_KEY;
});

test("resolveCallScalerConfig uses custom base URL", () => {
  process.env.CALLSCALER_API_KEY = "test-key";
  process.env.CALLSCALER_BASE_URL = "https://custom.api.com/v2";
  const config = resolveCallScalerConfig();
  assert.ok(config);
  assert.equal(config.baseUrl, "https://custom.api.com/v2");
  delete process.env.CALLSCALER_API_KEY;
  delete process.env.CALLSCALER_BASE_URL;
});

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

test("isCallScalerDryRun returns true when no API key", () => {
  delete process.env.CALLSCALER_API_KEY;
  assert.equal(isCallScalerDryRun(), true);
});

test("isCallScalerDryRun returns false when API key present", () => {
  process.env.CALLSCALER_API_KEY = "test-key";
  assert.equal(isCallScalerDryRun(), false);
  delete process.env.CALLSCALER_API_KEY;
});

// ---------------------------------------------------------------------------
// Number Provisioning
// ---------------------------------------------------------------------------

test("provisionNumber creates a tracking number in dry-run", async () => {
  resetCallScalerStore();
  const number = await provisionNumber({
    forwardTo: "+15551234567",
    source: "google_ads",
    campaign: "summer-sale",
    tenantId: "t1",
  });

  assert.ok(number.id.startsWith("tn_"));
  assert.ok(number.number.startsWith("+1"));
  assert.equal(number.forwardTo, "+15551234567");
  assert.equal(number.source, "google_ads");
  assert.equal(number.campaign, "summer-sale");
  assert.equal(number.tenantId, "t1");
  assert.equal(number.status, "active");
  assert.ok(number.createdAt);
});

test("provisionNumber uses specified area code", async () => {
  resetCallScalerStore();
  const number = await provisionNumber({
    forwardTo: "+15551234567",
    source: "facebook",
    areaCode: "212",
  });

  assert.ok(number.number.startsWith("+1212"));
});

test("provisionNumber defaults to 555 area code when none specified", async () => {
  resetCallScalerStore();
  const number = await provisionNumber({
    forwardTo: "+15551234567",
    source: "organic",
  });

  assert.ok(number.number.startsWith("+1555"));
});

test("provisionNumber generates unique IDs", async () => {
  resetCallScalerStore();
  const n1 = await provisionNumber({ forwardTo: "+1111", source: "a" });
  const n2 = await provisionNumber({ forwardTo: "+2222", source: "b" });
  assert.notEqual(n1.id, n2.id);
});

// ---------------------------------------------------------------------------
// Number Listing
// ---------------------------------------------------------------------------

test("listNumbers returns all numbers", async () => {
  resetCallScalerStore();
  await provisionNumber({ forwardTo: "+1111", source: "a", tenantId: "t1" });
  await provisionNumber({ forwardTo: "+2222", source: "b", tenantId: "t2" });

  const all = await listNumbers();
  assert.equal(all.length, 2);
});

test("listNumbers filters by tenantId", async () => {
  resetCallScalerStore();
  await provisionNumber({ forwardTo: "+1111", source: "a", tenantId: "t1" });
  await provisionNumber({ forwardTo: "+2222", source: "b", tenantId: "t2" });
  await provisionNumber({ forwardTo: "+3333", source: "c", tenantId: "t1" });

  const t1 = await listNumbers("t1");
  assert.equal(t1.length, 2);
  const t2 = await listNumbers("t2");
  assert.equal(t2.length, 1);
});

// ---------------------------------------------------------------------------
// Number Lifecycle (pause/resume/release)
// ---------------------------------------------------------------------------

test("pauseNumber changes status to paused", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });
  assert.equal(n.status, "active");

  const paused = await pauseNumber(n.id);
  assert.equal(paused.status, "paused");
});

test("resumeNumber changes status back to active", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });
  await pauseNumber(n.id);

  const resumed = await resumeNumber(n.id);
  assert.equal(resumed.status, "active");
});

test("releaseNumber changes status to released", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });

  const released = await releaseNumber(n.id);
  assert.equal(released.status, "released");
});

test("releaseNumber throws when already released", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });
  await releaseNumber(n.id);

  await assert.rejects(() => releaseNumber(n.id), /already released/);
});

test("pauseNumber throws for released number", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });
  await releaseNumber(n.id);

  await assert.rejects(() => pauseNumber(n.id), /Cannot pause a released number/);
});

test("resumeNumber throws for released number", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });
  await releaseNumber(n.id);

  await assert.rejects(() => resumeNumber(n.id), /Cannot resume a released number/);
});

test("pauseNumber throws for unknown number", async () => {
  resetCallScalerStore();
  await assert.rejects(() => pauseNumber("tn_fake"), /not found/);
});

// ---------------------------------------------------------------------------
// getNumber
// ---------------------------------------------------------------------------

test("getNumber returns the number by id", async () => {
  resetCallScalerStore();
  const n = await provisionNumber({ forwardTo: "+1111", source: "a" });
  const found = await getNumber(n.id);
  assert.ok(found);
  assert.equal(found.id, n.id);
});

test("getNumber returns null for unknown id", async () => {
  resetCallScalerStore();
  const found = await getNumber("tn_nonexistent");
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// Call Recording
// ---------------------------------------------------------------------------

test("recordCall creates a call record", async () => {
  resetCallScalerStore();
  const call = await recordCall({
    trackingNumberId: "tn_1",
    callerNumber: "+15559876543",
    callerName: "John Doe",
    callerCity: "New York",
    callerState: "NY",
    duration: 120,
    status: "completed",
    source: "google_ads",
    campaign: "summer-sale",
    startedAt: "2026-03-29T10:00:00Z",
    tenantId: "t1",
  });

  assert.ok(call.id.startsWith("call_"));
  assert.equal(call.callerNumber, "+15559876543");
  assert.equal(call.callerName, "John Doe");
  assert.equal(call.duration, 120);
  assert.equal(call.status, "completed");
  assert.equal(call.source, "google_ads");
});

test("recordCall stores and retrieves via getCall", async () => {
  resetCallScalerStore();
  const call = await recordCall({
    trackingNumberId: "tn_1",
    callerNumber: "+15551111111",
    duration: 60,
    status: "missed",
    source: "organic",
    startedAt: "2026-03-29T12:00:00Z",
  });

  const found = await getCall(call.id);
  assert.ok(found);
  assert.equal(found.id, call.id);
  assert.equal(found.status, "missed");
});

test("getCall returns null for unknown id", async () => {
  resetCallScalerStore();
  const found = await getCall("call_nonexistent");
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// Call Listing with Filters
// ---------------------------------------------------------------------------

test("listCalls returns all calls without filter", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 20, status: "missed", source: "b", startedAt: "2026-03-29T11:00:00Z" });

  const calls = await listCalls();
  assert.equal(calls.length, 2);
});

test("listCalls filters by source", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "google", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 20, status: "missed", source: "facebook", startedAt: "2026-03-29T11:00:00Z" });

  const calls = await listCalls({ source: "google" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.source, "google");
});

test("listCalls filters by status", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 20, status: "missed", source: "b", startedAt: "2026-03-29T11:00:00Z" });
  await recordCall({ trackingNumberId: "tn_3", callerNumber: "+3333", duration: 30, status: "completed", source: "c", startedAt: "2026-03-29T12:00:00Z" });

  const calls = await listCalls({ status: "completed" });
  assert.equal(calls.length, 2);
});

test("listCalls filters by tenantId", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 20, status: "missed", source: "b", startedAt: "2026-03-29T11:00:00Z", tenantId: "t2" });

  const calls = await listCalls({ tenantId: "t1" });
  assert.equal(calls.length, 1);
});

test("listCalls filters by campaign", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "a", campaign: "summer", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 20, status: "missed", source: "b", campaign: "winter", startedAt: "2026-03-29T11:00:00Z" });

  const calls = await listCalls({ campaign: "summer" });
  assert.equal(calls.length, 1);
});

test("listCalls filters by date range", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "a", startedAt: "2026-03-01T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 20, status: "missed", source: "b", startedAt: "2026-03-15T11:00:00Z" });
  await recordCall({ trackingNumberId: "tn_3", callerNumber: "+3333", duration: 30, status: "completed", source: "c", startedAt: "2026-03-28T12:00:00Z" });

  const calls = await listCalls({ dateFrom: "2026-03-10T00:00:00Z", dateTo: "2026-03-20T00:00:00Z" });
  assert.equal(calls.length, 1);
});

test("listCalls filters by trackingNumberId", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_100", callerNumber: "+1111", duration: 10, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_200", callerNumber: "+2222", duration: 20, status: "missed", source: "b", startedAt: "2026-03-29T11:00:00Z" });

  const calls = await listCalls({ trackingNumberId: "tn_100" });
  assert.equal(calls.length, 1);
});

// ---------------------------------------------------------------------------
// Call Stats
// ---------------------------------------------------------------------------

test("getCallStats returns correct aggregates", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 60, status: "completed", source: "google", campaign: "spring", startedAt: "2026-03-29T10:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+2222", duration: 120, status: "completed", source: "google", campaign: "spring", startedAt: "2026-03-29T10:30:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+3333", duration: 0, status: "missed", source: "facebook", startedAt: "2026-03-29T14:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_3", callerNumber: "+4444", duration: 30, status: "voicemail", source: "organic", startedAt: "2026-03-29T14:15:00Z", tenantId: "t1" });

  const stats = await getCallStats("t1");
  assert.equal(stats.totalCalls, 4);
  assert.equal(stats.completed, 2);
  assert.equal(stats.missed, 1);
  assert.equal(stats.voicemail, 1);
  assert.equal(stats.avgDuration, 53); // (60+120+0+30)/4 = 52.5 rounded to 53
  assert.equal(stats.bySource["google"], 2);
  assert.equal(stats.bySource["facebook"], 1);
  assert.equal(stats.bySource["organic"], 1);
  assert.equal(stats.byCampaign["spring"], 2);
  assert.equal(stats.uniqueCallers, 4);
});

test("getCallStats calculates peak hour", async () => {
  resetCallScalerStore();
  // 3 calls at hour 14, 1 call at hour 10
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 60, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+2222", duration: 30, status: "completed", source: "a", startedAt: "2026-03-29T14:00:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+3333", duration: 45, status: "missed", source: "a", startedAt: "2026-03-29T14:15:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+4444", duration: 90, status: "completed", source: "a", startedAt: "2026-03-29T14:30:00Z" });

  const stats = await getCallStats();
  assert.equal(stats.peakHour, 14);
});

test("getCallStats returns zeros for empty store", async () => {
  resetCallScalerStore();
  const stats = await getCallStats();
  assert.equal(stats.totalCalls, 0);
  assert.equal(stats.avgDuration, 0);
  assert.equal(stats.uniqueCallers, 0);
  assert.equal(stats.peakHour, 0);
});

test("getCallStats filters by tenantId", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 60, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 120, status: "completed", source: "b", startedAt: "2026-03-29T11:00:00Z", tenantId: "t2" });

  const t1Stats = await getCallStats("t1");
  assert.equal(t1Stats.totalCalls, 1);
  assert.equal(t1Stats.avgDuration, 60);
});

// ---------------------------------------------------------------------------
// Source Attribution
// ---------------------------------------------------------------------------

test("getSourceAttribution returns attribution by source", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 60, status: "completed", source: "google", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+2222", duration: 120, status: "completed", source: "google", startedAt: "2026-03-29T10:30:00Z" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+3333", duration: 0, status: "missed", source: "facebook", startedAt: "2026-03-29T14:00:00Z" });

  const attr = await getSourceAttribution();
  assert.equal(attr.length, 2);

  const google = attr.find((a) => a.source === "google");
  assert.ok(google);
  assert.equal(google.calls, 2);
  assert.equal(google.avgDuration, 90);
  assert.equal(google.conversionRate, 100);

  const facebook = attr.find((a) => a.source === "facebook");
  assert.ok(facebook);
  assert.equal(facebook.calls, 1);
  assert.equal(facebook.conversionRate, 0);
});

test("getSourceAttribution sorted by call count descending", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 60, status: "completed", source: "organic", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+2222", duration: 60, status: "completed", source: "google", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+3333", duration: 60, status: "completed", source: "google", startedAt: "2026-03-29T10:00:00Z" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+4444", duration: 60, status: "completed", source: "google", startedAt: "2026-03-29T10:00:00Z" });

  const attr = await getSourceAttribution();
  assert.equal(attr[0]!.source, "google");
  assert.equal(attr[0]!.calls, 3);
});

test("getSourceAttribution filters by tenantId", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 60, status: "completed", source: "google", startedAt: "2026-03-29T10:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+2222", duration: 60, status: "completed", source: "facebook", startedAt: "2026-03-29T10:00:00Z", tenantId: "t2" });

  const attr = await getSourceAttribution("t1");
  assert.equal(attr.length, 1);
  assert.equal(attr[0]!.source, "google");
});

// ---------------------------------------------------------------------------
// Call-to-Lead Conversion
// ---------------------------------------------------------------------------

test("convertCallToLead creates a lead from a call", async () => {
  resetCallScalerStore();
  const call = await recordCall({
    trackingNumberId: "tn_1",
    callerNumber: "+15559876543",
    callerName: "Jane Smith",
    callerCity: "Chicago",
    callerState: "IL",
    duration: 180,
    status: "completed",
    source: "google_ads",
    campaign: "fall-promo",
    startedAt: "2026-03-29T10:00:00Z",
    tenantId: "t1",
  });

  const lead = await convertCallToLead(call.id);
  assert.ok((lead.id as string).startsWith("lead_"));
  assert.equal(lead.source, "phone_call");
  assert.equal(lead.channel, "callscaler");
  assert.equal(lead.phone, "+15559876543");
  assert.equal(lead.name, "Jane Smith");
  assert.equal(lead.city, "Chicago");
  assert.equal(lead.state, "IL");
  assert.equal(lead.campaignSource, "google_ads");
  assert.equal(lead.campaign, "fall-promo");
  assert.equal(lead.callId, call.id);
  assert.equal(lead.callDuration, 180);
  assert.equal(lead.tenantId, "t1");
});

test("convertCallToLead throws for unknown call", async () => {
  resetCallScalerStore();
  await assert.rejects(() => convertCallToLead("call_fake"), /not found/);
});

test("convertCallToLead uses override tenantId", async () => {
  resetCallScalerStore();
  const call = await recordCall({
    trackingNumberId: "tn_1",
    callerNumber: "+1111",
    duration: 60,
    status: "completed",
    source: "organic",
    startedAt: "2026-03-29T10:00:00Z",
    tenantId: "t1",
  });

  const lead = await convertCallToLead(call.id, "t-override");
  assert.equal(lead.tenantId, "t-override");
});

// ---------------------------------------------------------------------------
// ProviderResult
// ---------------------------------------------------------------------------

test("callScalerResult returns dry-run mode without API key", () => {
  delete process.env.CALLSCALER_API_KEY;
  const result = callScalerResult("provisionNumber", "Provisioned +15551234567");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "CallScaler");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Provisioned +15551234567");
  assert.deepEqual(result.payload, { operation: "provisionNumber" });
});

test("callScalerResult returns live mode with API key", () => {
  process.env.CALLSCALER_API_KEY = "test-key";
  const result = callScalerResult("recordCall", "Recorded call");
  assert.equal(result.mode, "live");
  delete process.env.CALLSCALER_API_KEY;
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetCallScalerStore clears all stores", async () => {
  await provisionNumber({ forwardTo: "+1111", source: "a" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "a", startedAt: "2026-03-29T10:00:00Z" });

  const numbersBefore = await listNumbers();
  const callsBefore = await listCalls();
  assert.ok(numbersBefore.length > 0);
  assert.ok(callsBefore.length > 0);

  resetCallScalerStore();

  const numbersAfter = await listNumbers();
  const callsAfter = await listCalls();
  assert.equal(numbersAfter.length, 0);
  assert.equal(callsAfter.length, 0);
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

test("recordCall handles call with minimal fields", async () => {
  resetCallScalerStore();
  const call = await recordCall({
    trackingNumberId: "tn_1",
    callerNumber: "+15550000000",
    duration: 0,
    status: "busy",
    source: "unknown",
    startedAt: "2026-03-29T09:00:00Z",
  });

  assert.equal(call.status, "busy");
  assert.equal(call.duration, 0);
  assert.equal(call.callerName, undefined);
  assert.equal(call.callerCity, undefined);
  assert.equal(call.tenantId, undefined);
});

test("multiple filters combine correctly in listCalls", async () => {
  resetCallScalerStore();
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+1111", duration: 10, status: "completed", source: "google", campaign: "spring", startedAt: "2026-03-29T10:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_1", callerNumber: "+2222", duration: 20, status: "missed", source: "google", campaign: "spring", startedAt: "2026-03-29T11:00:00Z", tenantId: "t1" });
  await recordCall({ trackingNumberId: "tn_2", callerNumber: "+3333", duration: 30, status: "completed", source: "facebook", campaign: "spring", startedAt: "2026-03-29T12:00:00Z", tenantId: "t1" });

  const calls = await listCalls({ source: "google", status: "completed", tenantId: "t1" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.callerNumber, "+1111");
});
