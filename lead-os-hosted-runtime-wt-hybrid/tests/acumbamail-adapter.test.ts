import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveAcumbamailConfig,
  isAcumbamailDryRun,
  createSubscriber,
  getSubscriberByEmail,
  unsubscribe,
  createList,
  listLists,
  addSubscriberToList,
  createCampaign,
  sendCampaign,
  getCampaignStats,
  sendSms,
  listSmsSent,
  sendEmailViaAcumbamail,
  sendSmsViaAcumbamail,
  getAcumbamailStats,
  resetAcumbamailStore,
} from "../src/lib/integrations/acumbamail-adapter.ts";
import type {
  AcumbamailSubscriber,
  AcumbamailList,
  AcumbamailCampaign,
  AcumbamailSms,
  AcumbamailStats,
  CampaignStats,
} from "../src/lib/integrations/acumbamail-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearAcumbamailEnv() {
  delete process.env.ACUMBAMAIL_API_KEY;
  delete process.env.ACUMBAMAIL_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveAcumbamailConfig returns null when no API key is set", () => {
  clearAcumbamailEnv();
  const cfg = resolveAcumbamailConfig();
  assert.equal(cfg, null);
});

test("resolveAcumbamailConfig returns config when API key is set", () => {
  clearAcumbamailEnv();
  process.env.ACUMBAMAIL_API_KEY = "test-acm-key";
  const cfg = resolveAcumbamailConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-acm-key");
  assert.equal(cfg.baseUrl, "https://acumbamail.com/api/1");
  clearAcumbamailEnv();
});

test("resolveAcumbamailConfig uses custom base URL when set", () => {
  clearAcumbamailEnv();
  process.env.ACUMBAMAIL_API_KEY = "test-acm-key";
  process.env.ACUMBAMAIL_BASE_URL = "https://custom.acumbamail.com/api/2";
  const cfg = resolveAcumbamailConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.acumbamail.com/api/2");
  clearAcumbamailEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isAcumbamailDryRun returns true when no API key is set", () => {
  clearAcumbamailEnv();
  assert.equal(isAcumbamailDryRun(), true);
});

test("isAcumbamailDryRun returns false when API key is set", () => {
  clearAcumbamailEnv();
  process.env.ACUMBAMAIL_API_KEY = "test-acm-key";
  assert.equal(isAcumbamailDryRun(), false);
  clearAcumbamailEnv();
});

// ---------------------------------------------------------------------------
// Subscriber CRUD
// ---------------------------------------------------------------------------

test("createSubscriber creates a new subscriber in dry-run", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const sub = await createSubscriber({
    email: "alice@example.com",
    name: "Alice",
    phone: "+34600111222",
    listId: "list-1",
    tenantId: "t1",
  });

  assert.ok(sub.id.startsWith("acm-sub-"));
  assert.equal(sub.email, "alice@example.com");
  assert.equal(sub.name, "Alice");
  assert.equal(sub.phone, "+34600111222");
  assert.equal(sub.listId, "list-1");
  assert.equal(sub.status, "subscribed");
  assert.equal(sub.tenantId, "t1");
  assert.ok(sub.createdAt);
});

test("createSubscriber with customFields stores them", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const sub = await createSubscriber({
    email: "bob@example.com",
    listId: "list-1",
    customFields: { company: "Acme", role: "CTO" },
  });

  assert.equal(sub.customFields.company, "Acme");
  assert.equal(sub.customFields.role, "CTO");
});

test("createSubscriber deduplicates by email", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const first = await createSubscriber({ email: "dup@example.com", name: "First", listId: "list-1" });
  const second = await createSubscriber({ email: "dup@example.com", name: "Second", listId: "list-2" });

  assert.equal(first.id, second.id);
  assert.equal(second.name, "Second");
  assert.equal(second.listId, "list-2");
});

test("createSubscriber with no optional fields", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const sub = await createSubscriber({ email: "minimal@example.com", listId: "list-1" });
  assert.equal(sub.email, "minimal@example.com");
  assert.equal(sub.name, undefined);
  assert.equal(sub.phone, undefined);
  assert.deepEqual(sub.customFields, {});
});

test("getSubscriberByEmail finds subscriber by email", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createSubscriber({ email: "dave@example.com", name: "Dave", listId: "list-1" });
  const found = await getSubscriberByEmail("dave@example.com");

  assert.ok(found);
  assert.equal(found.name, "Dave");
});

test("getSubscriberByEmail returns null for unknown email", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const result = await getSubscriberByEmail("unknown@example.com");
  assert.equal(result, null);
});

test("unsubscribe marks subscriber as unsubscribed", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createSubscriber({ email: "eve@example.com", listId: "list-1" });
  const result = await unsubscribe("eve@example.com");
  assert.equal(result, true);

  const sub = await getSubscriberByEmail("eve@example.com");
  assert.ok(sub);
  assert.equal(sub.status, "unsubscribed");
});

test("unsubscribe returns false for non-existent email", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const result = await unsubscribe("ghost@example.com");
  assert.equal(result, false);
});

// ---------------------------------------------------------------------------
// List management
// ---------------------------------------------------------------------------

test("createList creates a new list", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const list = await createList("Newsletter", "t1");

  assert.ok(list.id.startsWith("acm-list-"));
  assert.equal(list.name, "Newsletter");
  assert.equal(list.subscriberCount, 0);
  assert.equal(list.tenantId, "t1");
});

test("listLists returns all lists", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createList("List A", "t1");
  await createList("List B", "t1");
  await createList("List C", "t2");

  const all = await listLists();
  assert.equal(all.length, 3);

  const filtered = await listLists("t1");
  assert.equal(filtered.length, 2);
});

test("addSubscriberToList moves subscriber to new list", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const list = await createList("Promo");
  const sub = await createSubscriber({ email: "frank@example.com", listId: "old-list" });

  const result = await addSubscriberToList(sub.id, list.id);
  assert.equal(result, true);

  const updated = await getSubscriberByEmail("frank@example.com");
  assert.ok(updated);
  assert.equal(updated.listId, list.id);

  const lists = await listLists();
  const updatedList = lists.find((l) => l.id === list.id);
  assert.ok(updatedList);
  assert.equal(updatedList.subscriberCount, 1);
});

test("addSubscriberToList returns false for unknown subscriber", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const list = await createList("Test");
  const result = await addSubscriberToList("bad-id", list.id);
  assert.equal(result, false);
});

test("addSubscriberToList returns false for unknown list", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const sub = await createSubscriber({ email: "grace@example.com", listId: "list-1" });
  const result = await addSubscriberToList(sub.id, "bad-list");
  assert.equal(result, false);
});

test("addSubscriberToList is idempotent when same list", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const list = await createList("Same");
  const sub = await createSubscriber({ email: "henry@example.com", listId: list.id });

  await addSubscriberToList(sub.id, list.id);
  await addSubscriberToList(sub.id, list.id);

  const lists = await listLists();
  const updated = lists.find((l) => l.id === list.id);
  assert.ok(updated);
  assert.equal(updated.subscriberCount, 1);
});

// ---------------------------------------------------------------------------
// Campaign lifecycle
// ---------------------------------------------------------------------------

test("createCampaign creates a draft campaign", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const campaign = await createCampaign({
    name: "Welcome Campaign",
    subject: "Welcome!",
    fromName: "Lead OS",
    fromEmail: "hello@lead-os.example",
    htmlBody: "<p>Hello</p>",
    listIds: ["list-1"],
    tenantId: "t1",
  });

  assert.ok(campaign.id.startsWith("acm-camp-"));
  assert.equal(campaign.name, "Welcome Campaign");
  assert.equal(campaign.subject, "Welcome!");
  assert.equal(campaign.fromName, "Lead OS");
  assert.equal(campaign.fromEmail, "hello@lead-os.example");
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.tenantId, "t1");
});

test("createCampaign with empty listIds succeeds", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const campaign = await createCampaign({
    name: "Empty",
    subject: "Empty",
    fromName: "Test",
    fromEmail: "test@test.com",
    htmlBody: "<p>No lists</p>",
    listIds: [],
  });

  assert.deepEqual(campaign.listIds, []);
  assert.equal(campaign.status, "draft");
});

test("sendCampaign marks campaign as sent", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const campaign = await createCampaign({
    name: "Send Me",
    subject: "Send Me",
    fromName: "Test",
    fromEmail: "test@test.com",
    htmlBody: "<p>Now</p>",
    listIds: ["list-1"],
  });

  const sent = await sendCampaign(campaign.id);
  assert.equal(sent.status, "sent");
  assert.ok(sent.sentAt);
});

test("sendCampaign throws for unknown campaign", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await assert.rejects(
    () => sendCampaign("nonexistent"),
    { message: "Campaign not found: nonexistent" },
  );
});

test("getCampaignStats generates realistic stats in dry-run", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const campaign = await createCampaign({
    name: "Stats Test",
    subject: "Stats Test",
    fromName: "Test",
    fromEmail: "test@test.com",
    htmlBody: "<p>Stats</p>",
    listIds: ["list-1"],
  });

  const stats = await getCampaignStats(campaign.id);
  assert.ok(stats);
  assert.ok(stats.sent > 0);
  assert.ok(stats.openRate >= 20 && stats.openRate <= 35);
  assert.ok(stats.clickRate >= 2 && stats.clickRate <= 8);
  assert.ok(stats.opened >= 0);
  assert.ok(stats.clicked >= 0);
  assert.ok(stats.bounced >= 0);
  assert.ok(stats.unsubscribed >= 0);
  assert.ok(stats.complaints >= 0);
});

test("getCampaignStats returns null for unknown campaign", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const stats = await getCampaignStats("bad-id");
  assert.equal(stats, null);
});

test("getCampaignStats returns cached stats on second call", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const campaign = await createCampaign({
    name: "Cache Test",
    subject: "Cache",
    fromName: "Test",
    fromEmail: "test@test.com",
    htmlBody: "<p>Cache</p>",
    listIds: ["list-1"],
  });

  const first = await getCampaignStats(campaign.id);
  const second = await getCampaignStats(campaign.id);
  assert.deepEqual(first, second);
});

// ---------------------------------------------------------------------------
// SMS
// ---------------------------------------------------------------------------

test("sendSms creates an SMS record in dry-run", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const sms = await sendSms("+34600111222", "Hello from Lead OS", "t1");

  assert.ok(sms.id.startsWith("acm-sms-"));
  assert.equal(sms.to, "+34600111222");
  assert.equal(sms.body, "Hello from Lead OS");
  assert.equal(sms.status, "queued");
  assert.equal(sms.tenantId, "t1");
  assert.ok(sms.sentAt);
});

test("listSmsSent returns all SMS", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await sendSms("+34600111222", "msg1", "t1");
  await sendSms("+34600333444", "msg2", "t2");
  await sendSms("+34600555666", "msg3", "t1");

  const all = await listSmsSent();
  assert.equal(all.length, 3);

  const filtered = await listSmsSent("t1");
  assert.equal(filtered.length, 2);
});

// ---------------------------------------------------------------------------
// Email sending via ProviderResult
// ---------------------------------------------------------------------------

test("sendEmailViaAcumbamail returns dry-run result when no API key", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const result = await sendEmailViaAcumbamail({
    to: "user@example.com",
    subject: "Test",
    html: "<p>Test</p>",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Acumbamail");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.equal(result.payload.to, "user@example.com");
});

test("sendEmailViaAcumbamail includes subject in dry-run payload", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const result = await sendEmailViaAcumbamail({
    to: "user@example.com",
    subject: "Important",
    html: "<p>Read this</p>",
  });

  assert.ok(result.payload);
  assert.equal(result.payload.subject, "Important");
});

// ---------------------------------------------------------------------------
// SMS sending via ProviderResult
// ---------------------------------------------------------------------------

test("sendSmsViaAcumbamail returns dry-run result when no API key", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const result = await sendSmsViaAcumbamail("+34600111222", "Hello");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Acumbamail");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.equal(result.payload.to, "+34600111222");
  assert.equal(result.payload.body, "Hello");
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getAcumbamailStats computes aggregate stats", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createSubscriber({ email: "s1@example.com", listId: "list-1", tenantId: "t1" });
  await createSubscriber({ email: "s2@example.com", listId: "list-1", tenantId: "t1" });
  await createList("Newsletter", "t1");
  await sendSms("+34600111222", "hi", "t1");

  const c1 = await createCampaign({
    name: "C1",
    subject: "C1",
    fromName: "T",
    fromEmail: "t@t.com",
    htmlBody: "c1",
    listIds: [],
    tenantId: "t1",
  });
  await getCampaignStats(c1.id);

  const stats = await getAcumbamailStats("t1");
  assert.equal(stats.totalSubscribers, 2);
  assert.equal(stats.totalCampaigns, 1);
  assert.equal(stats.totalSmsSent, 1);
  assert.equal(stats.listCount, 1);
  assert.ok(stats.avgOpenRate > 0);
  assert.ok(stats.avgClickRate > 0);
});

test("getAcumbamailStats returns zeros when no data", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const stats = await getAcumbamailStats();
  assert.equal(stats.totalSubscribers, 0);
  assert.equal(stats.totalCampaigns, 0);
  assert.equal(stats.totalSmsSent, 0);
  assert.equal(stats.avgOpenRate, 0);
  assert.equal(stats.avgClickRate, 0);
  assert.equal(stats.listCount, 0);
});

test("getAcumbamailStats without tenantId includes all data", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createSubscriber({ email: "a@test.com", listId: "list-1", tenantId: "t1" });
  await createSubscriber({ email: "b@test.com", listId: "list-1", tenantId: "t2" });
  await createCampaign({
    name: "X",
    subject: "X",
    fromName: "T",
    fromEmail: "t@t.com",
    htmlBody: "x",
    listIds: [],
    tenantId: "t1",
  });
  await createCampaign({
    name: "Y",
    subject: "Y",
    fromName: "T",
    fromEmail: "t@t.com",
    htmlBody: "y",
    listIds: [],
    tenantId: "t2",
  });

  const stats = await getAcumbamailStats();
  assert.equal(stats.totalSubscribers, 2);
  assert.equal(stats.totalCampaigns, 2);
});

// ---------------------------------------------------------------------------
// Store and reset
// ---------------------------------------------------------------------------

test("resetAcumbamailStore clears all stores", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createSubscriber({ email: "reset@example.com", listId: "list-1" });
  await createList("ResetList");
  await createCampaign({
    name: "Reset",
    subject: "Reset",
    fromName: "T",
    fromEmail: "t@t.com",
    htmlBody: "r",
    listIds: [],
  });
  await sendSms("+34600111222", "reset");

  resetAcumbamailStore();

  assert.equal((await getSubscriberByEmail("reset@example.com")), null);
  assert.equal((await listLists()).length, 0);
  assert.equal((await listSmsSent()).length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("createSubscriber merges customFields on dedup", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createSubscriber({
    email: "merge@example.com",
    listId: "list-1",
    customFields: { company: "Acme" },
  });
  const merged = await createSubscriber({
    email: "merge@example.com",
    listId: "list-1",
    customFields: { role: "CTO" },
  });

  assert.equal(merged.customFields.company, "Acme");
  assert.equal(merged.customFields.role, "CTO");
});

test("multiple campaigns with different tenants are isolated", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  await createCampaign({ name: "T1", subject: "T1", fromName: "T", fromEmail: "t@t.com", htmlBody: "a", listIds: [], tenantId: "t1" });
  await createCampaign({ name: "T2", subject: "T2", fromName: "T", fromEmail: "t@t.com", htmlBody: "b", listIds: [], tenantId: "t2" });
  await createCampaign({ name: "T1b", subject: "T1b", fromName: "T", fromEmail: "t@t.com", htmlBody: "c", listIds: [], tenantId: "t1" });

  const stats1 = await getAcumbamailStats("t1");
  const stats2 = await getAcumbamailStats("t2");
  assert.equal(stats1.totalCampaigns, 2);
  assert.equal(stats2.totalCampaigns, 1);
});

test("sendSms without tenantId works", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const sms = await sendSms("+34600111222", "no tenant");
  assert.equal(sms.tenantId, undefined);

  const all = await listSmsSent();
  assert.equal(all.length, 1);
});

test("createList without tenantId works", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const list = await createList("Global");
  assert.equal(list.tenantId, undefined);
  assert.equal(list.name, "Global");
});

test("subscriber count increments on createSubscriber with valid list", async () => {
  clearAcumbamailEnv();
  resetAcumbamailStore();

  const list = await createList("Counted");
  await createSubscriber({ email: "c1@test.com", listId: list.id });
  await createSubscriber({ email: "c2@test.com", listId: list.id });

  const lists = await listLists();
  const updated = lists.find((l) => l.id === list.id);
  assert.ok(updated);
  assert.equal(updated.subscriberCount, 2);
});
