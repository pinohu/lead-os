import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveTinyEmailConfig,
  isTinyEmailDryRun,
  createSubscriber,
  getSubscriber,
  getSubscriberByEmail,
  unsubscribeEmail,
  createAudience,
  listAudiences,
  addSubscriberToAudience,
  createCampaign,
  sendCampaign,
  getCampaignStats,
  listCampaigns,
  createAutomation,
  listAutomations,
  toggleAutomation,
  sendEmailViaTinyEmail,
  getTinyEmailStats,
  resetTinyEmailStore,
} from "../src/lib/integrations/tinyemail-adapter.ts";
import type {
  TinyEmailSubscriber,
  TinyEmailAudience,
  TinyEmailCampaign,
  TinyEmailAutomation,
  EmailCampaignStats,
  TinyEmailStats,
} from "../src/lib/integrations/tinyemail-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearTinyEmailEnv() {
  delete process.env.TINYEMAIL_API_KEY;
  delete process.env.TINYEMAIL_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveTinyEmailConfig returns null when no API key is set", () => {
  clearTinyEmailEnv();
  const cfg = resolveTinyEmailConfig();
  assert.equal(cfg, null);
});

test("resolveTinyEmailConfig returns config when API key is set", () => {
  clearTinyEmailEnv();
  process.env.TINYEMAIL_API_KEY = "test-te-key";
  const cfg = resolveTinyEmailConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-te-key");
  assert.equal(cfg.baseUrl, "https://api.tinyemail.com/v1");
  clearTinyEmailEnv();
});

test("resolveTinyEmailConfig uses custom base URL when set", () => {
  clearTinyEmailEnv();
  process.env.TINYEMAIL_API_KEY = "test-te-key";
  process.env.TINYEMAIL_BASE_URL = "https://custom.tinyemail.com/v1";
  const cfg = resolveTinyEmailConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.tinyemail.com/v1");
  clearTinyEmailEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isTinyEmailDryRun returns true when no API key is set", () => {
  clearTinyEmailEnv();
  assert.equal(isTinyEmailDryRun(), true);
});

test("isTinyEmailDryRun returns false when API key is set", () => {
  clearTinyEmailEnv();
  process.env.TINYEMAIL_API_KEY = "test-te-key";
  assert.equal(isTinyEmailDryRun(), false);
  clearTinyEmailEnv();
});

// ---------------------------------------------------------------------------
// Subscriber CRUD
// ---------------------------------------------------------------------------

test("createSubscriber creates a new subscriber in dry-run", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const subscriber = await createSubscriber({
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Smith",
    tenantId: "t1",
  });

  assert.ok(subscriber.id.startsWith("te-sub-"));
  assert.equal(subscriber.email, "alice@example.com");
  assert.equal(subscriber.firstName, "Alice");
  assert.equal(subscriber.lastName, "Smith");
  assert.equal(subscriber.status, "active");
  assert.equal(subscriber.tenantId, "t1");
  assert.ok(subscriber.createdAt);
});

test("createSubscriber with tags assigns tags", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const subscriber = await createSubscriber({
    email: "bob@example.com",
    tags: ["vip", "newsletter"],
  });

  assert.deepEqual(subscriber.tags, ["vip", "newsletter"]);
});

test("createSubscriber with audienceId sets audienceId", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const subscriber = await createSubscriber({
    email: "carol@example.com",
    audienceId: "aud-123",
  });

  assert.equal(subscriber.audienceId, "aud-123");
});

test("getSubscriber retrieves a stored subscriber by id", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const created = await createSubscriber({ email: "carol@example.com" });
  const retrieved = await getSubscriber(created.id);

  assert.ok(retrieved);
  assert.equal(retrieved.email, "carol@example.com");
});

test("getSubscriber returns null for unknown id", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const result = await getSubscriber("nonexistent-id");
  assert.equal(result, null);
});

test("getSubscriberByEmail finds subscriber by email", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "dave@example.com", firstName: "Dave" });
  const found = await getSubscriberByEmail("dave@example.com");

  assert.ok(found);
  assert.equal(found.firstName, "Dave");
});

test("getSubscriberByEmail returns null for unknown email", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const result = await getSubscriberByEmail("unknown@example.com");
  assert.equal(result, null);
});

test("unsubscribeEmail marks subscriber as unsubscribed", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "eve@example.com" });
  const result = await unsubscribeEmail("eve@example.com");
  assert.equal(result, true);

  const subscriber = await getSubscriberByEmail("eve@example.com");
  assert.ok(subscriber);
  assert.equal(subscriber.status, "unsubscribed");
});

test("unsubscribeEmail returns false for non-existent email", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const result = await unsubscribeEmail("ghost@example.com");
  assert.equal(result, false);
});

test("createSubscriber deduplicates by email", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const first = await createSubscriber({ email: "dup@example.com", firstName: "First" });
  const second = await createSubscriber({ email: "dup@example.com", firstName: "Second" });

  assert.equal(first.id, second.id);
  assert.equal(second.firstName, "Second");
});

test("createSubscriber deduplicates tags on merge", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "tags@example.com", tags: ["vip", "early"] });
  const merged = await createSubscriber({ email: "tags@example.com", tags: ["early", "premium"] });

  assert.deepEqual(merged.tags, ["vip", "early", "premium"]);
});

test("createSubscriber with no optional fields", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const subscriber = await createSubscriber({ email: "minimal@example.com" });
  assert.equal(subscriber.email, "minimal@example.com");
  assert.equal(subscriber.firstName, undefined);
  assert.equal(subscriber.lastName, undefined);
  assert.deepEqual(subscriber.tags, []);
});

// ---------------------------------------------------------------------------
// Audience management
// ---------------------------------------------------------------------------

test("createAudience creates a new audience", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const audience = await createAudience("Newsletter", "t1");

  assert.ok(audience.id.startsWith("te-aud-"));
  assert.equal(audience.name, "Newsletter");
  assert.equal(audience.subscriberCount, 0);
  assert.equal(audience.tenantId, "t1");
});

test("listAudiences returns all audiences", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createAudience("Audience A", "t1");
  await createAudience("Audience B", "t1");
  await createAudience("Audience C", "t2");

  const all = await listAudiences();
  assert.equal(all.length, 3);

  const filtered = await listAudiences("t1");
  assert.equal(filtered.length, 2);
});

test("addSubscriberToAudience adds subscriber to audience and increments count", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const audience = await createAudience("Promo");
  const subscriber = await createSubscriber({ email: "frank@example.com" });

  const result = await addSubscriberToAudience(subscriber.id, audience.id);
  assert.equal(result, true);

  const updatedSubscriber = await getSubscriber(subscriber.id);
  assert.ok(updatedSubscriber);
  assert.equal(updatedSubscriber.audienceId, audience.id);

  const audiences = await listAudiences();
  const updatedAudience = audiences.find((a) => a.id === audience.id);
  assert.ok(updatedAudience);
  assert.equal(updatedAudience.subscriberCount, 1);
});

test("addSubscriberToAudience returns false for unknown subscriber", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const audience = await createAudience("Test");
  const result = await addSubscriberToAudience("bad-id", audience.id);
  assert.equal(result, false);
});

test("addSubscriberToAudience returns false for unknown audience", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const subscriber = await createSubscriber({ email: "grace@example.com" });
  const result = await addSubscriberToAudience(subscriber.id, "bad-audience");
  assert.equal(result, false);
});

test("addSubscriberToAudience is idempotent", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const audience = await createAudience("Idempotent");
  const subscriber = await createSubscriber({ email: "henry@example.com" });

  await addSubscriberToAudience(subscriber.id, audience.id);
  await addSubscriberToAudience(subscriber.id, audience.id);

  const audiences = await listAudiences();
  const updated = audiences.find((a) => a.id === audience.id);
  assert.ok(updated);
  assert.equal(updated.subscriberCount, 1);
});

// ---------------------------------------------------------------------------
// Campaign lifecycle
// ---------------------------------------------------------------------------

test("createCampaign creates a draft campaign", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const campaign = await createCampaign({
    name: "Welcome Campaign",
    subject: "Welcome",
    htmlBody: "<p>Hello</p>",
    audienceIds: ["aud-1"],
    tenantId: "t1",
  });

  assert.ok(campaign.id.startsWith("te-camp-"));
  assert.equal(campaign.name, "Welcome Campaign");
  assert.equal(campaign.subject, "Welcome");
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.tenantId, "t1");
});

test("createCampaign with preheader sets preheader", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const campaign = await createCampaign({
    name: "Preheader Test",
    subject: "Subject",
    preheader: "Preview text here",
    htmlBody: "<p>Body</p>",
    audienceIds: [],
  });

  assert.equal(campaign.preheader, "Preview text here");
});

test("createCampaign sets scheduled status when scheduledAt provided", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const scheduled = "2026-04-01T10:00:00Z";
  const campaign = await createCampaign({
    name: "Scheduled",
    subject: "Scheduled",
    htmlBody: "<p>Later</p>",
    audienceIds: ["aud-1"],
    scheduledAt: scheduled,
  });

  assert.equal(campaign.status, "scheduled");
  assert.equal(campaign.scheduledAt, scheduled);
});

test("sendCampaign marks campaign as sent", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const campaign = await createCampaign({
    name: "Send Me",
    subject: "Send Me",
    htmlBody: "<p>Now</p>",
    audienceIds: ["aud-1"],
  });

  const sent = await sendCampaign(campaign.id);
  assert.equal(sent.status, "sent");
  assert.ok(sent.sentAt);
});

test("sendCampaign throws for unknown campaign", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await assert.rejects(
    () => sendCampaign("nonexistent"),
    { message: "Campaign not found: nonexistent" },
  );
});

test("getCampaignStats generates realistic stats in dry-run", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const campaign = await createCampaign({
    name: "Stats Test",
    subject: "Stats Test",
    htmlBody: "<p>Stats</p>",
    audienceIds: ["aud-1"],
  });

  const stats = await getCampaignStats(campaign.id);
  assert.ok(stats);
  assert.ok(stats.sent > 0);
  assert.ok(stats.openRate >= 22 && stats.openRate <= 38);
  assert.ok(stats.clickRate >= 3 && stats.clickRate <= 9);
  assert.ok(stats.opened >= 0);
  assert.ok(stats.clicked >= 0);
  assert.ok(stats.bounced >= 0);
  assert.ok(stats.unsubscribed >= 0);
});

test("getCampaignStats returns null for unknown campaign", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const stats = await getCampaignStats("bad-id");
  assert.equal(stats, null);
});

test("getCampaignStats returns cached stats on second call", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const campaign = await createCampaign({
    name: "Cache Test",
    subject: "Cache Test",
    htmlBody: "<p>Cache</p>",
    audienceIds: ["aud-1"],
  });

  const first = await getCampaignStats(campaign.id);
  const second = await getCampaignStats(campaign.id);
  assert.deepEqual(first, second);
});

test("listCampaigns filters by tenantId", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createCampaign({ name: "A", subject: "A", htmlBody: "a", audienceIds: [], tenantId: "t1" });
  await createCampaign({ name: "B", subject: "B", htmlBody: "b", audienceIds: [], tenantId: "t2" });

  const t1 = await listCampaigns("t1");
  assert.equal(t1.length, 1);
  assert.equal(t1[0].subject, "A");
});

test("createCampaign with empty audienceIds succeeds", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const campaign = await createCampaign({
    name: "Empty",
    subject: "Empty",
    htmlBody: "<p>No audiences</p>",
    audienceIds: [],
  });

  assert.deepEqual(campaign.audienceIds, []);
  assert.equal(campaign.status, "draft");
});

// ---------------------------------------------------------------------------
// Automations
// ---------------------------------------------------------------------------

test("createAutomation creates an automation", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const automation = await createAutomation({
    name: "Welcome Flow",
    trigger: "subscribe",
    emails: [
      { subject: "Welcome", body: "Hi there", delayHours: 0 },
      { subject: "Follow-up", body: "Still here?", delayHours: 48 },
    ],
    active: true,
    tenantId: "t1",
  });

  assert.ok(automation.id.startsWith("te-auto-"));
  assert.equal(automation.name, "Welcome Flow");
  assert.equal(automation.trigger, "subscribe");
  assert.equal(automation.emails.length, 2);
  assert.equal(automation.active, true);
});

test("listAutomations returns all automations", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createAutomation({
    name: "Auto A",
    trigger: "subscribe",
    emails: [],
    active: true,
    tenantId: "t1",
  });
  await createAutomation({
    name: "Auto B",
    trigger: "tag_added",
    emails: [],
    active: false,
    tenantId: "t2",
  });

  const all = await listAutomations();
  assert.equal(all.length, 2);

  const filtered = await listAutomations("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "Auto A");
});

test("toggleAutomation activates an automation", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const automation = await createAutomation({
    name: "Toggle Test",
    trigger: "subscribe",
    emails: [],
    active: false,
    tenantId: "t1",
  });

  const toggled = await toggleAutomation(automation.id, true);
  assert.ok(toggled);
  assert.equal(toggled.active, true);
});

test("toggleAutomation deactivates an automation", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const automation = await createAutomation({
    name: "Toggle Off",
    trigger: "subscribe",
    emails: [],
    active: true,
    tenantId: "t1",
  });

  const toggled = await toggleAutomation(automation.id, false);
  assert.ok(toggled);
  assert.equal(toggled.active, false);
});

test("toggleAutomation returns null for unknown id", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const result = await toggleAutomation("nonexistent", true);
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Email sending via ProviderResult
// ---------------------------------------------------------------------------

test("sendEmailViaTinyEmail returns dry-run result when no API key", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const result = await sendEmailViaTinyEmail({
    to: "user@example.com",
    subject: "Test",
    html: "<p>Test</p>",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "TinyEmail");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.equal(result.payload.to, "user@example.com");
});

test("sendEmailViaTinyEmail includes subject in dry-run payload", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const result = await sendEmailViaTinyEmail({
    to: "user@example.com",
    subject: "Important",
    html: "<p>Read this</p>",
  });

  assert.ok(result.payload);
  assert.equal(result.payload.subject, "Important");
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getTinyEmailStats computes aggregate stats", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "s1@example.com", tenantId: "t1" });
  await createSubscriber({ email: "s2@example.com", tenantId: "t1" });

  const c1 = await createCampaign({ name: "C1", subject: "C1", htmlBody: "c1", audienceIds: [], tenantId: "t1" });
  await getCampaignStats(c1.id);

  const stats = await getTinyEmailStats("t1");
  assert.equal(stats.totalSubscribers, 2);
  assert.equal(stats.totalCampaigns, 1);
  assert.ok(stats.avgOpenRate > 0);
  assert.ok(stats.avgClickRate > 0);
  assert.ok(stats.subscribersByStatus.active === 2);
});

test("getTinyEmailStats returns zeros when no data", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const stats = await getTinyEmailStats();
  assert.equal(stats.totalSubscribers, 0);
  assert.equal(stats.totalCampaigns, 0);
  assert.equal(stats.avgOpenRate, 0);
  assert.equal(stats.avgClickRate, 0);
  assert.deepEqual(stats.subscribersByStatus, {});
});

test("getTinyEmailStats without tenantId includes all data", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "a@test.com", tenantId: "t1" });
  await createSubscriber({ email: "b@test.com", tenantId: "t2" });
  await createCampaign({ name: "X", subject: "X", htmlBody: "x", audienceIds: [], tenantId: "t1" });
  await createCampaign({ name: "Y", subject: "Y", htmlBody: "y", audienceIds: [], tenantId: "t2" });

  const stats = await getTinyEmailStats();
  assert.equal(stats.totalSubscribers, 2);
  assert.equal(stats.totalCampaigns, 2);
});

test("getTinyEmailStats tracks subscribersByStatus correctly", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "active1@test.com", tenantId: "t1" });
  await createSubscriber({ email: "active2@test.com", tenantId: "t1" });
  await createSubscriber({ email: "unsub@test.com", tenantId: "t1" });
  await unsubscribeEmail("unsub@test.com");

  const stats = await getTinyEmailStats("t1");
  assert.equal(stats.subscribersByStatus.active, 2);
  assert.equal(stats.subscribersByStatus.unsubscribed, 1);
});

// ---------------------------------------------------------------------------
// Store and reset
// ---------------------------------------------------------------------------

test("resetTinyEmailStore clears all stores", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createSubscriber({ email: "reset@example.com" });
  await createAudience("ResetAudience");
  await createCampaign({ name: "Reset", subject: "Reset", htmlBody: "r", audienceIds: [] });
  await createAutomation({
    name: "Reset Auto",
    trigger: "subscribe",
    emails: [],
    active: true,
  });

  resetTinyEmailStore();

  assert.equal((await getSubscriberByEmail("reset@example.com")), null);
  assert.equal((await listAudiences()).length, 0);
  assert.equal((await listCampaigns()).length, 0);
  assert.equal((await listAutomations()).length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("multiple campaigns with different tenants are isolated", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  await createCampaign({ name: "T1 Camp", subject: "T1", htmlBody: "a", audienceIds: [], tenantId: "t1" });
  await createCampaign({ name: "T2 Camp", subject: "T2", htmlBody: "b", audienceIds: [], tenantId: "t2" });
  await createCampaign({ name: "T1 Camp 2", subject: "T1-2", htmlBody: "c", audienceIds: [], tenantId: "t1" });

  const t1 = await listCampaigns("t1");
  const t2 = await listCampaigns("t2");
  assert.equal(t1.length, 2);
  assert.equal(t2.length, 1);
});

test("createAutomation with empty emails array", async () => {
  clearTinyEmailEnv();
  resetTinyEmailStore();

  const automation = await createAutomation({
    name: "Empty Emails",
    trigger: "subscribe",
    emails: [],
    active: true,
  });

  assert.equal(automation.emails.length, 0);
  assert.equal(automation.active, true);
});
