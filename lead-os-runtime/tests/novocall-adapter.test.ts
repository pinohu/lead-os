import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveNovocallConfig,
  isNovocallDryRun,
  requestCallback,
  getCallbackRequest,
  listCallbackRequests,
  updateCallbackStatus,
  createWidget,
  getWidget,
  listWidgets,
  generateWidgetEmbed,
  createSchedule,
  getAvailableSlots,
  convertCallbackToLead,
  getNovocallStats,
  novocallResult,
  resetNovocallStore,
} from "../src/lib/integrations/novocall-adapter.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveNovocallConfig returns null when no API key is set", () => {
  delete process.env.NOVOCALL_API_KEY;
  const config = resolveNovocallConfig();
  assert.equal(config, null);
});

test("resolveNovocallConfig returns config when API key is present", () => {
  process.env.NOVOCALL_API_KEY = "test-key";
  const config = resolveNovocallConfig();
  assert.ok(config);
  assert.equal(config.apiKey, "test-key");
  assert.equal(config.baseUrl, "https://api.novocall.co/v1");
  delete process.env.NOVOCALL_API_KEY;
});

test("resolveNovocallConfig uses custom base URL and widget ID", () => {
  process.env.NOVOCALL_API_KEY = "test-key";
  process.env.NOVOCALL_BASE_URL = "https://custom.novocall.co/v2";
  process.env.NOVOCALL_WIDGET_ID = "wgt-custom";
  const config = resolveNovocallConfig();
  assert.ok(config);
  assert.equal(config.baseUrl, "https://custom.novocall.co/v2");
  assert.equal(config.widgetId, "wgt-custom");
  delete process.env.NOVOCALL_API_KEY;
  delete process.env.NOVOCALL_BASE_URL;
  delete process.env.NOVOCALL_WIDGET_ID;
});

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

test("isNovocallDryRun returns true when no API key", () => {
  delete process.env.NOVOCALL_API_KEY;
  assert.equal(isNovocallDryRun(), true);
});

test("isNovocallDryRun returns false when API key present", () => {
  process.env.NOVOCALL_API_KEY = "test-key";
  assert.equal(isNovocallDryRun(), false);
  delete process.env.NOVOCALL_API_KEY;
});

// ---------------------------------------------------------------------------
// Callback Requests
// ---------------------------------------------------------------------------

test("requestCallback creates a callback in dry-run", async () => {
  resetNovocallStore();
  const cb = await requestCallback({
    name: "John Doe",
    phone: "+15551234567",
    email: "john@example.com",
    company: "Acme Inc",
    source: "landing-page",
    page: "/pricing",
    tenantId: "t1",
  });

  assert.ok(cb.id.startsWith("cb_"));
  assert.equal(cb.name, "John Doe");
  assert.equal(cb.phone, "+15551234567");
  assert.equal(cb.email, "john@example.com");
  assert.equal(cb.company, "Acme Inc");
  assert.equal(cb.status, "pending");
  assert.equal(cb.source, "landing-page");
  assert.equal(cb.page, "/pricing");
  assert.equal(cb.tenantId, "t1");
  assert.ok(cb.createdAt);
});

test("requestCallback sets scheduled status when preferredTime provided", async () => {
  resetNovocallStore();
  const cb = await requestCallback({
    name: "Jane Smith",
    phone: "+15559876543",
    preferredTime: "2026-03-30T14:00:00Z",
  });

  assert.equal(cb.status, "scheduled");
  assert.equal(cb.preferredTime, "2026-03-30T14:00:00Z");
});

test("requestCallback defaults source to widget", async () => {
  resetNovocallStore();
  const cb = await requestCallback({
    name: "Test User",
    phone: "+15550000000",
  });

  assert.equal(cb.source, "widget");
});

test("requestCallback generates unique IDs", async () => {
  resetNovocallStore();
  const cb1 = await requestCallback({ name: "A", phone: "+1111" });
  const cb2 = await requestCallback({ name: "B", phone: "+2222" });
  assert.notEqual(cb1.id, cb2.id);
});

test("getCallbackRequest returns the callback by id", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Test", phone: "+1111" });
  const found = await getCallbackRequest(cb.id);
  assert.ok(found);
  assert.equal(found.id, cb.id);
  assert.equal(found.name, "Test");
});

test("getCallbackRequest returns null for unknown id", async () => {
  resetNovocallStore();
  const found = await getCallbackRequest("cb_nonexistent");
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// Callback Listing with Filters
// ---------------------------------------------------------------------------

test("listCallbackRequests returns all callbacks without filter", async () => {
  resetNovocallStore();
  await requestCallback({ name: "A", phone: "+1111", source: "web" });
  await requestCallback({ name: "B", phone: "+2222", source: "app" });

  const all = await listCallbackRequests();
  assert.equal(all.length, 2);
});

test("listCallbackRequests filters by status", async () => {
  resetNovocallStore();
  await requestCallback({ name: "A", phone: "+1111" });
  await requestCallback({ name: "B", phone: "+2222", preferredTime: "2026-03-30T10:00:00Z" });

  const scheduled = await listCallbackRequests({ status: "scheduled" });
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0]!.name, "B");
});

test("listCallbackRequests filters by source", async () => {
  resetNovocallStore();
  await requestCallback({ name: "A", phone: "+1111", source: "google" });
  await requestCallback({ name: "B", phone: "+2222", source: "facebook" });

  const google = await listCallbackRequests({ source: "google" });
  assert.equal(google.length, 1);
  assert.equal(google[0]!.name, "A");
});

test("listCallbackRequests filters by tenantId", async () => {
  resetNovocallStore();
  await requestCallback({ name: "A", phone: "+1111", tenantId: "t1" });
  await requestCallback({ name: "B", phone: "+2222", tenantId: "t2" });
  await requestCallback({ name: "C", phone: "+3333", tenantId: "t1" });

  const t1 = await listCallbackRequests({ tenantId: "t1" });
  assert.equal(t1.length, 2);
});

test("listCallbackRequests filters by date range", async () => {
  resetNovocallStore();
  const cb1 = await requestCallback({ name: "A", phone: "+1111" });
  const cb2 = await requestCallback({ name: "B", phone: "+2222" });

  const now = new Date(cb1.createdAt).getTime();
  const before = new Date(now - 1000).toISOString();
  const after = new Date(now + 1000).toISOString();

  const filtered = await listCallbackRequests({ dateFrom: before, dateTo: after });
  assert.ok(filtered.length >= 1);
});

test("listCallbackRequests combines multiple filters", async () => {
  resetNovocallStore();
  await requestCallback({ name: "A", phone: "+1111", source: "web", tenantId: "t1" });
  await requestCallback({ name: "B", phone: "+2222", source: "web", tenantId: "t2" });
  await requestCallback({ name: "C", phone: "+3333", source: "app", tenantId: "t1" });

  const filtered = await listCallbackRequests({ source: "web", tenantId: "t1" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]!.name, "A");
});

// ---------------------------------------------------------------------------
// Callback Status Updates
// ---------------------------------------------------------------------------

test("updateCallbackStatus changes status to connected", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Test", phone: "+1111" });
  const updated = await updateCallbackStatus(cb.id, "connected");
  assert.equal(updated.status, "connected");
  assert.ok(updated.connectedAt);
});

test("updateCallbackStatus changes status to completed with duration", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Test", phone: "+1111" });
  await updateCallbackStatus(cb.id, "connected");
  const updated = await updateCallbackStatus(cb.id, "completed", 180);
  assert.equal(updated.status, "completed");
  assert.equal(updated.duration, 180);
  assert.ok(updated.completedAt);
});

test("updateCallbackStatus changes status to missed", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Test", phone: "+1111" });
  const updated = await updateCallbackStatus(cb.id, "missed");
  assert.equal(updated.status, "missed");
});

test("updateCallbackStatus changes status to cancelled", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Test", phone: "+1111" });
  const updated = await updateCallbackStatus(cb.id, "cancelled");
  assert.equal(updated.status, "cancelled");
});

test("updateCallbackStatus throws for unknown callback", async () => {
  resetNovocallStore();
  await assert.rejects(() => updateCallbackStatus("cb_fake", "connected"), /not found/);
});

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

test("createWidget creates a callback widget", async () => {
  resetNovocallStore();
  const widget = await createWidget({
    name: "Sales Widget",
    buttonText: "Call Us Now",
    buttonColor: "#4CAF50",
    position: "bottom-right",
    businessHours: [
      { day: "Monday", start: "09:00", end: "17:00" },
      { day: "Tuesday", start: "09:00", end: "17:00" },
    ],
    greeting: "Hello! Request a callback and we will call you back.",
    fields: ["name", "phone", "email"],
    tenantId: "t1",
  });

  assert.ok(widget.id.startsWith("wgt_"));
  assert.equal(widget.name, "Sales Widget");
  assert.equal(widget.buttonText, "Call Us Now");
  assert.equal(widget.buttonColor, "#4CAF50");
  assert.equal(widget.position, "bottom-right");
  assert.equal(widget.businessHours.length, 2);
  assert.equal(widget.greeting, "Hello! Request a callback and we will call you back.");
  assert.deepEqual(widget.fields, ["name", "phone", "email"]);
  assert.equal(widget.tenantId, "t1");
});

test("getWidget returns the widget by id", async () => {
  resetNovocallStore();
  const widget = await createWidget({
    name: "Test",
    buttonText: "Click",
    buttonColor: "#000",
    position: "bottom-left",
    businessHours: [],
    greeting: "Hi",
    fields: ["name", "phone"],
  });

  const found = await getWidget(widget.id);
  assert.ok(found);
  assert.equal(found.id, widget.id);
});

test("getWidget returns null for unknown id", async () => {
  resetNovocallStore();
  const found = await getWidget("wgt_nonexistent");
  assert.equal(found, null);
});

test("listWidgets returns all widgets", async () => {
  resetNovocallStore();
  await createWidget({ name: "A", buttonText: "A", buttonColor: "#000", position: "bottom-right", businessHours: [], greeting: "Hi", fields: ["name", "phone"], tenantId: "t1" });
  await createWidget({ name: "B", buttonText: "B", buttonColor: "#000", position: "bottom-left", businessHours: [], greeting: "Hi", fields: ["name", "phone"], tenantId: "t2" });

  const all = await listWidgets();
  assert.equal(all.length, 2);
});

test("listWidgets filters by tenantId", async () => {
  resetNovocallStore();
  await createWidget({ name: "A", buttonText: "A", buttonColor: "#000", position: "bottom-right", businessHours: [], greeting: "Hi", fields: ["name", "phone"], tenantId: "t1" });
  await createWidget({ name: "B", buttonText: "B", buttonColor: "#000", position: "bottom-left", businessHours: [], greeting: "Hi", fields: ["name", "phone"], tenantId: "t2" });

  const t1 = await listWidgets("t1");
  assert.equal(t1.length, 1);
  assert.equal(t1[0]!.name, "A");
});

// ---------------------------------------------------------------------------
// Widget Embed
// ---------------------------------------------------------------------------

test("generateWidgetEmbed returns HTML snippet for valid widget", async () => {
  resetNovocallStore();
  const widget = await createWidget({
    name: "Embed Test",
    buttonText: "Request Callback",
    buttonColor: "#FF5722",
    position: "bottom-right",
    businessHours: [],
    greeting: "We will call you!",
    fields: ["name", "phone"],
  });

  const embed = generateWidgetEmbed(widget.id);
  assert.ok(embed);
  assert.ok(embed.includes(widget.id));
  assert.ok(embed.includes("Request Callback"));
  assert.ok(embed.includes("#FF5722"));
  assert.ok(embed.includes("bottom-right"));
  assert.ok(embed.includes("widget.js"));
});

test("generateWidgetEmbed returns null for unknown widget", () => {
  resetNovocallStore();
  const embed = generateWidgetEmbed("wgt_nonexistent");
  assert.equal(embed, null);
});

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

test("createSchedule creates a schedule", async () => {
  resetNovocallStore();
  const sched = await createSchedule({
    name: "Business Hours",
    availableSlots: [
      { day: "Monday", start: "09:00", end: "12:00" },
      { day: "Monday", start: "13:00", end: "17:00" },
      { day: "Wednesday", start: "09:00", end: "17:00" },
    ],
    timezone: "America/New_York",
    tenantId: "t1",
  });

  assert.ok(sched.id.startsWith("sched_"));
  assert.equal(sched.name, "Business Hours");
  assert.equal(sched.availableSlots.length, 3);
  assert.equal(sched.timezone, "America/New_York");
  assert.equal(sched.tenantId, "t1");
});

test("getAvailableSlots returns slots for the matching day", async () => {
  resetNovocallStore();
  const sched = await createSchedule({
    name: "Test",
    availableSlots: [
      { day: "Monday", start: "09:00", end: "12:00" },
      { day: "Monday", start: "13:00", end: "17:00" },
      { day: "Tuesday", start: "10:00", end: "16:00" },
    ],
    timezone: "UTC",
  });

  // 2026-03-30 is a Monday
  const slots = await getAvailableSlots(sched.id, "2026-03-30");
  assert.equal(slots.length, 2);
  assert.equal(slots[0]!.start, "09:00");
  assert.equal(slots[1]!.start, "13:00");
});

test("getAvailableSlots returns empty for a day with no slots", async () => {
  resetNovocallStore();
  const sched = await createSchedule({
    name: "Test",
    availableSlots: [
      { day: "Monday", start: "09:00", end: "17:00" },
    ],
    timezone: "UTC",
  });

  // 2026-03-31 is a Tuesday
  const slots = await getAvailableSlots(sched.id, "2026-03-31");
  assert.equal(slots.length, 0);
});

test("getAvailableSlots returns empty for unknown schedule", async () => {
  resetNovocallStore();
  const slots = await getAvailableSlots("sched_fake", "2026-03-30");
  assert.equal(slots.length, 0);
});

// ---------------------------------------------------------------------------
// Callback-to-Lead Conversion
// ---------------------------------------------------------------------------

test("convertCallbackToLead creates a lead from a callback", async () => {
  resetNovocallStore();
  const cb = await requestCallback({
    name: "Jane Smith",
    phone: "+15559876543",
    email: "jane@example.com",
    company: "Widgets Corp",
    source: "landing-page",
    page: "/demo",
    tenantId: "t1",
  });

  const lead = await convertCallbackToLead(cb.id);
  assert.ok((lead.id as string).startsWith("lead_"));
  assert.equal(lead.source, "callback");
  assert.equal(lead.channel, "novocall");
  assert.equal(lead.phone, "+15559876543");
  assert.equal(lead.name, "Jane Smith");
  assert.equal(lead.email, "jane@example.com");
  assert.equal(lead.company, "Widgets Corp");
  assert.equal(lead.callbackId, cb.id);
  assert.equal(lead.page, "/demo");
  assert.equal(lead.tenantId, "t1");
});

test("convertCallbackToLead throws for unknown callback", async () => {
  resetNovocallStore();
  await assert.rejects(() => convertCallbackToLead("cb_fake"), /not found/);
});

test("convertCallbackToLead uses override tenantId", async () => {
  resetNovocallStore();
  const cb = await requestCallback({
    name: "Test",
    phone: "+1111",
    tenantId: "t1",
  });

  const lead = await convertCallbackToLead(cb.id, "t-override");
  assert.equal(lead.tenantId, "t-override");
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getNovocallStats returns correct aggregates", async () => {
  resetNovocallStore();
  const cb1 = await requestCallback({ name: "A", phone: "+1111", source: "web", tenantId: "t1" });
  await updateCallbackStatus(cb1.id, "connected");
  await updateCallbackStatus(cb1.id, "completed", 120);

  const cb2 = await requestCallback({ name: "B", phone: "+2222", source: "web", tenantId: "t1" });
  await updateCallbackStatus(cb2.id, "missed");

  const cb3 = await requestCallback({ name: "C", phone: "+3333", source: "app", tenantId: "t1" });
  await updateCallbackStatus(cb3.id, "connected");
  await updateCallbackStatus(cb3.id, "completed", 60);

  const stats = await getNovocallStats("t1");
  assert.equal(stats.totalCallbacks, 3);
  assert.equal(stats.completed, 2);
  assert.equal(stats.missed, 1);
  assert.equal(stats.avgDuration, 90);
  assert.equal(stats.conversionRate, 67); // 2/3 = 66.67 rounded to 67
  assert.equal(stats.bySource["web"], 2);
  assert.equal(stats.bySource["app"], 1);
});

test("getNovocallStats returns zeros for empty store", async () => {
  resetNovocallStore();
  const stats = await getNovocallStats();
  assert.equal(stats.totalCallbacks, 0);
  assert.equal(stats.completed, 0);
  assert.equal(stats.avgWaitSeconds, 0);
  assert.equal(stats.avgDuration, 0);
  assert.equal(stats.conversionRate, 0);
  assert.equal(stats.peakHour, 0);
});

test("getNovocallStats filters by tenantId", async () => {
  resetNovocallStore();
  await requestCallback({ name: "A", phone: "+1111", tenantId: "t1" });
  await requestCallback({ name: "B", phone: "+2222", tenantId: "t2" });

  const t1Stats = await getNovocallStats("t1");
  assert.equal(t1Stats.totalCallbacks, 1);
});

// ---------------------------------------------------------------------------
// Provider Result
// ---------------------------------------------------------------------------

test("novocallResult returns dry-run mode without API key", () => {
  delete process.env.NOVOCALL_API_KEY;
  const result = novocallResult("requestCallback", "Callback requested for +1111");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Novocall");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Callback requested for +1111");
  assert.deepEqual(result.payload, { operation: "requestCallback" });
});

test("novocallResult returns live mode with API key", () => {
  process.env.NOVOCALL_API_KEY = "test-key";
  const result = novocallResult("createWidget", "Widget created");
  assert.equal(result.mode, "live");
  delete process.env.NOVOCALL_API_KEY;
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetNovocallStore clears all stores", async () => {
  await requestCallback({ name: "A", phone: "+1111" });
  await createWidget({ name: "W", buttonText: "Click", buttonColor: "#000", position: "bottom-right", businessHours: [], greeting: "Hi", fields: ["name", "phone"] });
  await createSchedule({ name: "S", availableSlots: [], timezone: "UTC" });

  const cbBefore = await listCallbackRequests();
  const wBefore = await listWidgets();
  assert.ok(cbBefore.length > 0);
  assert.ok(wBefore.length > 0);

  resetNovocallStore();

  const cbAfter = await listCallbackRequests();
  const wAfter = await listWidgets();
  assert.equal(cbAfter.length, 0);
  assert.equal(wAfter.length, 0);
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

test("requestCallback handles minimal fields", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Min", phone: "+1000" });
  assert.equal(cb.name, "Min");
  assert.equal(cb.phone, "+1000");
  assert.equal(cb.email, undefined);
  assert.equal(cb.company, undefined);
  assert.equal(cb.tenantId, undefined);
  assert.equal(cb.source, "widget");
});

test("updateCallbackStatus sets duration on non-completed status", async () => {
  resetNovocallStore();
  const cb = await requestCallback({ name: "Test", phone: "+1111" });
  const updated = await updateCallbackStatus(cb.id, "connected", 30);
  assert.equal(updated.duration, 30);
  assert.equal(updated.status, "connected");
});
