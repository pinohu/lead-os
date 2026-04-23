import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSendFoxConfig,
  isSendFoxDryRun,
  createContact,
  getContact,
  getContactByEmail,
  unsubscribeContact,
  createList,
  listLists,
  addContactToList,
  createCampaign,
  sendCampaign,
  getCampaignStats,
  listCampaigns,
  createAutomation,
  listAutomations,
  sendEmailViaSendFox,
  getSendFoxStats,
  resetSendFoxStore,
} from "../src/lib/integrations/sendfox-adapter.ts";
import type {
  SendFoxContact,
  SendFoxList,
  SendFoxCampaign,
  SendFoxAutomation,
  CampaignStats,
} from "../src/lib/integrations/sendfox-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearSendFoxEnv() {
  delete process.env.SENDFOX_API_KEY;
  delete process.env.SENDFOX_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveSendFoxConfig returns null when no API key is set", () => {
  clearSendFoxEnv();
  const cfg = resolveSendFoxConfig();
  assert.equal(cfg, null);
});

test("resolveSendFoxConfig returns config when API key is set", () => {
  clearSendFoxEnv();
  process.env.SENDFOX_API_KEY = "test-sf-key";
  const cfg = resolveSendFoxConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-sf-key");
  assert.equal(cfg.baseUrl, "https://api.sendfox.com");
  clearSendFoxEnv();
});

test("resolveSendFoxConfig uses custom base URL when set", () => {
  clearSendFoxEnv();
  process.env.SENDFOX_API_KEY = "test-sf-key";
  process.env.SENDFOX_BASE_URL = "https://custom.sendfox.com";
  const cfg = resolveSendFoxConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.sendfox.com");
  clearSendFoxEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isSendFoxDryRun returns true when no API key is set", () => {
  clearSendFoxEnv();
  assert.equal(isSendFoxDryRun(), true);
});

test("isSendFoxDryRun returns false when API key is set", () => {
  clearSendFoxEnv();
  process.env.SENDFOX_API_KEY = "test-sf-key";
  assert.equal(isSendFoxDryRun(), false);
  clearSendFoxEnv();
});

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

test("createContact creates a new contact in dry-run", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const contact = await createContact({
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Smith",
    tenantId: "t1",
  });

  assert.ok(contact.id.startsWith("sf-contact-"));
  assert.equal(contact.email, "alice@example.com");
  assert.equal(contact.firstName, "Alice");
  assert.equal(contact.lastName, "Smith");
  assert.equal(contact.status, "subscribed");
  assert.equal(contact.tenantId, "t1");
  assert.ok(contact.createdAt);
});

test("createContact with listIds assigns lists", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const contact = await createContact({
    email: "bob@example.com",
    listIds: ["list-a", "list-b"],
  });

  assert.deepEqual(contact.lists, ["list-a", "list-b"]);
});

test("getContact retrieves a stored contact by id", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const created = await createContact({ email: "carol@example.com" });
  const retrieved = await getContact(created.id);

  assert.ok(retrieved);
  assert.equal(retrieved.email, "carol@example.com");
});

test("getContact returns null for unknown id", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const result = await getContact("nonexistent-id");
  assert.equal(result, null);
});

test("getContactByEmail finds contact by email", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createContact({ email: "dave@example.com", firstName: "Dave" });
  const found = await getContactByEmail("dave@example.com");

  assert.ok(found);
  assert.equal(found.firstName, "Dave");
});

test("getContactByEmail returns null for unknown email", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const result = await getContactByEmail("unknown@example.com");
  assert.equal(result, null);
});

test("unsubscribeContact marks contact as unsubscribed", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createContact({ email: "eve@example.com" });
  const result = await unsubscribeContact("eve@example.com");
  assert.equal(result, true);

  const contact = await getContactByEmail("eve@example.com");
  assert.ok(contact);
  assert.equal(contact.status, "unsubscribed");
});

test("unsubscribeContact returns false for non-existent email", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const result = await unsubscribeContact("ghost@example.com");
  assert.equal(result, false);
});

test("createContact deduplicates by email", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const first = await createContact({ email: "dup@example.com", firstName: "First" });
  const second = await createContact({ email: "dup@example.com", firstName: "Second" });

  assert.equal(first.id, second.id);
  assert.equal(second.firstName, "Second");
});

// ---------------------------------------------------------------------------
// List management
// ---------------------------------------------------------------------------

test("createList creates a new list", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const list = await createList("Newsletter", "t1");

  assert.ok(list.id.startsWith("sf-list-"));
  assert.equal(list.name, "Newsletter");
  assert.equal(list.contactCount, 0);
  assert.equal(list.tenantId, "t1");
});

test("listLists returns all lists", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createList("List A", "t1");
  await createList("List B", "t1");
  await createList("List C", "t2");

  const all = await listLists();
  assert.equal(all.length, 3);

  const filtered = await listLists("t1");
  assert.equal(filtered.length, 2);
});

test("addContactToList adds contact to list and increments count", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const list = await createList("Promo");
  const contact = await createContact({ email: "frank@example.com" });

  const result = await addContactToList(contact.id, list.id);
  assert.equal(result, true);

  const updatedContact = await getContact(contact.id);
  assert.ok(updatedContact);
  assert.ok(updatedContact.lists.includes(list.id));

  const lists = await listLists();
  const updatedList = lists.find((l) => l.id === list.id);
  assert.ok(updatedList);
  assert.equal(updatedList.contactCount, 1);
});

test("addContactToList returns false for unknown contact", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const list = await createList("Test");
  const result = await addContactToList("bad-id", list.id);
  assert.equal(result, false);
});

test("addContactToList returns false for unknown list", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const contact = await createContact({ email: "grace@example.com" });
  const result = await addContactToList(contact.id, "bad-list");
  assert.equal(result, false);
});

test("addContactToList is idempotent", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const list = await createList("Idempotent");
  const contact = await createContact({ email: "henry@example.com" });

  await addContactToList(contact.id, list.id);
  await addContactToList(contact.id, list.id);

  const lists = await listLists();
  const updated = lists.find((l) => l.id === list.id);
  assert.ok(updated);
  assert.equal(updated.contactCount, 1);
});

// ---------------------------------------------------------------------------
// Campaign lifecycle
// ---------------------------------------------------------------------------

test("createCampaign creates a draft campaign", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const campaign = await createCampaign({
    subject: "Welcome",
    body: "<p>Hello</p>",
    listIds: ["list-1"],
    tenantId: "t1",
  });

  assert.ok(campaign.id.startsWith("sf-camp-"));
  assert.equal(campaign.subject, "Welcome");
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.tenantId, "t1");
});

test("createCampaign sets scheduled status when scheduledAt provided", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const scheduled = "2026-04-01T10:00:00Z";
  const campaign = await createCampaign({
    subject: "Scheduled",
    body: "<p>Later</p>",
    listIds: ["list-1"],
    scheduledAt: scheduled,
  });

  assert.equal(campaign.status, "scheduled");
  assert.equal(campaign.scheduledAt, scheduled);
});

test("sendCampaign marks campaign as sent", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const campaign = await createCampaign({
    subject: "Send Me",
    body: "<p>Now</p>",
    listIds: ["list-1"],
  });

  const sent = await sendCampaign(campaign.id);
  assert.equal(sent.status, "sent");
  assert.ok(sent.sentAt);
});

test("sendCampaign throws for unknown campaign", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await assert.rejects(
    () => sendCampaign("nonexistent"),
    { message: "Campaign not found: nonexistent" },
  );
});

test("getCampaignStats generates realistic stats in dry-run", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const campaign = await createCampaign({
    subject: "Stats Test",
    body: "<p>Stats</p>",
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
});

test("getCampaignStats returns null for unknown campaign", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const stats = await getCampaignStats("bad-id");
  assert.equal(stats, null);
});

test("getCampaignStats returns cached stats on second call", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const campaign = await createCampaign({
    subject: "Cache Test",
    body: "<p>Cache</p>",
    listIds: ["list-1"],
  });

  const first = await getCampaignStats(campaign.id);
  const second = await getCampaignStats(campaign.id);
  assert.deepEqual(first, second);
});

test("listCampaigns filters by tenantId", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createCampaign({ subject: "A", body: "a", listIds: [], tenantId: "t1" });
  await createCampaign({ subject: "B", body: "b", listIds: [], tenantId: "t2" });

  const t1 = await listCampaigns("t1");
  assert.equal(t1.length, 1);
  assert.equal(t1[0].subject, "A");
});

// ---------------------------------------------------------------------------
// Automations
// ---------------------------------------------------------------------------

test("createAutomation creates an automation", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const automation = await createAutomation({
    name: "Welcome Flow",
    triggerType: "subscribe",
    steps: [
      { id: "", type: "email", subject: "Welcome", body: "Hi there" },
      { id: "", type: "delay", delayDays: 2 },
      { id: "", type: "email", subject: "Follow-up", body: "Still here?" },
    ],
    active: true,
    tenantId: "t1",
  });

  assert.ok(automation.id.startsWith("sf-auto-"));
  assert.equal(automation.name, "Welcome Flow");
  assert.equal(automation.triggerType, "subscribe");
  assert.equal(automation.steps.length, 3);
  assert.ok(automation.steps[0].id.startsWith("sf-step-"));
  assert.equal(automation.active, true);
});

test("listAutomations returns all automations", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createAutomation({
    name: "Auto A",
    triggerType: "subscribe",
    steps: [],
    active: true,
    tenantId: "t1",
  });
  await createAutomation({
    name: "Auto B",
    triggerType: "manual",
    steps: [],
    active: false,
    tenantId: "t2",
  });

  const all = await listAutomations();
  assert.equal(all.length, 2);

  const filtered = await listAutomations("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "Auto A");
});

// ---------------------------------------------------------------------------
// Email sending via ProviderResult
// ---------------------------------------------------------------------------

test("sendEmailViaSendFox returns dry-run result when no API key", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const result = await sendEmailViaSendFox({
    to: "user@example.com",
    subject: "Test",
    body: "<p>Test</p>",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "SendFox");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.equal(result.payload.to, "user@example.com");
});

test("sendEmailViaSendFox includes subject in dry-run payload", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const result = await sendEmailViaSendFox({
    to: "user@example.com",
    subject: "Important",
    body: "<p>Read this</p>",
  });

  assert.ok(result.payload);
  assert.equal(result.payload.subject, "Important");
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getSendFoxStats computes aggregate stats", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createContact({ email: "s1@example.com", tenantId: "t1" });
  await createContact({ email: "s2@example.com", tenantId: "t1" });

  const c1 = await createCampaign({ subject: "C1", body: "c1", listIds: [], tenantId: "t1" });
  await getCampaignStats(c1.id);

  const stats = await getSendFoxStats("t1");
  assert.equal(stats.totalContacts, 2);
  assert.equal(stats.totalCampaigns, 1);
  assert.ok(stats.totalSent > 0);
  assert.ok(stats.avgOpenRate > 0);
  assert.ok(stats.avgClickRate > 0);
});

test("getSendFoxStats returns zeros when no data", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const stats = await getSendFoxStats();
  assert.equal(stats.totalContacts, 0);
  assert.equal(stats.totalCampaigns, 0);
  assert.equal(stats.totalSent, 0);
  assert.equal(stats.avgOpenRate, 0);
  assert.equal(stats.avgClickRate, 0);
});

test("getSendFoxStats without tenantId includes all data", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createContact({ email: "a@test.com", tenantId: "t1" });
  await createContact({ email: "b@test.com", tenantId: "t2" });
  await createCampaign({ subject: "X", body: "x", listIds: [], tenantId: "t1" });
  await createCampaign({ subject: "Y", body: "y", listIds: [], tenantId: "t2" });

  const stats = await getSendFoxStats();
  assert.equal(stats.totalContacts, 2);
  assert.equal(stats.totalCampaigns, 2);
});

// ---------------------------------------------------------------------------
// Store and reset
// ---------------------------------------------------------------------------

test("resetSendFoxStore clears all stores", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createContact({ email: "reset@example.com" });
  await createList("ResetList");
  await createCampaign({ subject: "Reset", body: "r", listIds: [] });
  await createAutomation({
    name: "Reset Auto",
    triggerType: "manual",
    steps: [],
    active: true,
  });

  resetSendFoxStore();

  assert.equal((await getContactByEmail("reset@example.com")), null);
  assert.equal((await listLists()).length, 0);
  assert.equal((await listCampaigns()).length, 0);
  assert.equal((await listAutomations()).length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("createCampaign with empty listIds succeeds", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const campaign = await createCampaign({
    subject: "Empty",
    body: "<p>No lists</p>",
    listIds: [],
  });

  assert.deepEqual(campaign.listIds, []);
  assert.equal(campaign.status, "draft");
});

test("createContact with no optional fields", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const contact = await createContact({ email: "minimal@example.com" });
  assert.equal(contact.email, "minimal@example.com");
  assert.equal(contact.firstName, undefined);
  assert.equal(contact.lastName, undefined);
  assert.deepEqual(contact.lists, []);
});

test("createAutomation with condition step", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  const automation = await createAutomation({
    name: "Conditional",
    triggerType: "tag",
    steps: [
      { id: "", type: "condition", condition: "opened_last_email" },
      { id: "", type: "email", subject: "Yes", body: "You opened!" },
    ],
    active: true,
  });

  assert.equal(automation.steps[0].type, "condition");
  assert.equal(automation.steps[0].condition, "opened_last_email");
});

test("multiple campaigns with different tenants are isolated", async () => {
  clearSendFoxEnv();
  resetSendFoxStore();

  await createCampaign({ subject: "T1 Camp", body: "a", listIds: [], tenantId: "t1" });
  await createCampaign({ subject: "T2 Camp", body: "b", listIds: [], tenantId: "t2" });
  await createCampaign({ subject: "T1 Camp 2", body: "c", listIds: [], tenantId: "t1" });

  const t1 = await listCampaigns("t1");
  const t2 = await listCampaigns("t2");
  assert.equal(t1.length, 2);
  assert.equal(t2.length, 1);
});
