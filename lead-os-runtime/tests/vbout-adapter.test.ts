import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveVboutConfig,
  isVboutDryRun,
  createContact,
  getContact,
  getContactByEmail,
  updateContact,
  tagContact,
  scoreContact,
  createList,
  listLists,
  addContactToList,
  createCampaign,
  sendCampaign,
  getCampaignStats,
  createAutomation,
  listAutomations,
  toggleAutomation,
  executeAutomation,
  getVboutStats,
  sendEmailViaVbout,
  resetVboutStore,
} from "../src/lib/integrations/vbout-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearVboutEnv() {
  delete process.env.VBOUT_API_KEY;
  delete process.env.VBOUT_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveVboutConfig returns null when no API key", () => {
  clearVboutEnv();
  const cfg = resolveVboutConfig();
  assert.equal(cfg, null);
});

test("resolveVboutConfig returns config when API key is set", () => {
  clearVboutEnv();
  process.env.VBOUT_API_KEY = "vb-test-key";
  const cfg = resolveVboutConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "vb-test-key");
  assert.equal(cfg.baseUrl, "https://api.vbout.com/1");
  clearVboutEnv();
});

test("resolveVboutConfig uses custom base URL from env", () => {
  clearVboutEnv();
  process.env.VBOUT_API_KEY = "vb-test";
  process.env.VBOUT_BASE_URL = "https://custom.vbout.com/2";
  const cfg = resolveVboutConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.vbout.com/2");
  clearVboutEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isVboutDryRun returns true when no API key", () => {
  clearVboutEnv();
  assert.equal(isVboutDryRun(), true);
});

test("isVboutDryRun returns false when API key is set", () => {
  clearVboutEnv();
  process.env.VBOUT_API_KEY = "vb-key";
  assert.equal(isVboutDryRun(), false);
  clearVboutEnv();
});

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

test("createContact creates a new contact with defaults", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "alice@example.com" });
  assert.ok(contact.id.startsWith("vbc_"));
  assert.equal(contact.email, "alice@example.com");
  assert.equal(contact.status, "active");
  assert.deepEqual(contact.tags, []);
  assert.deepEqual(contact.lists, []);
  assert.equal(contact.score, 0);
  assert.ok(contact.createdAt);
});

test("createContact populates optional fields", async () => {
  resetVboutStore();
  const contact = await createContact({
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Smith",
    phone: "+1234567890",
    company: "Acme",
    tags: ["lead", "vip"],
    listIds: ["list-1"],
    tenantId: "t1",
  });
  assert.equal(contact.firstName, "Bob");
  assert.equal(contact.lastName, "Smith");
  assert.equal(contact.phone, "+1234567890");
  assert.equal(contact.company, "Acme");
  assert.deepEqual(contact.tags, ["lead", "vip"]);
  assert.deepEqual(contact.lists, ["list-1"]);
  assert.equal(contact.tenantId, "t1");
});

test("createContact returns existing contact for duplicate email", async () => {
  resetVboutStore();
  const first = await createContact({ email: "dup@example.com" });
  const second = await createContact({ email: "dup@example.com", firstName: "Different" });
  assert.equal(first.id, second.id);
  assert.equal(second.firstName, undefined);
});

test("getContact returns contact by id", async () => {
  resetVboutStore();
  const created = await createContact({ email: "get@example.com" });
  const fetched = await getContact(created.id);
  assert.ok(fetched);
  assert.equal(fetched.email, "get@example.com");
});

test("getContact returns null for unknown id", async () => {
  resetVboutStore();
  const result = await getContact("nonexistent");
  assert.equal(result, null);
});

test("getContactByEmail finds contact case-insensitively", async () => {
  resetVboutStore();
  await createContact({ email: "CasE@Example.COM" });
  const found = await getContactByEmail("case@example.com");
  assert.ok(found);
  assert.equal(found.email, "CasE@Example.COM");
});

test("getContactByEmail returns null for unknown email", async () => {
  resetVboutStore();
  const result = await getContactByEmail("nobody@example.com");
  assert.equal(result, null);
});

test("updateContact modifies fields", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "upd@example.com" });
  const updated = await updateContact(contact.id, { firstName: "Updated", company: "NewCo" });
  assert.ok(updated);
  assert.equal(updated.firstName, "Updated");
  assert.equal(updated.company, "NewCo");
  assert.equal(updated.email, "upd@example.com");
});

test("updateContact returns null for unknown id", async () => {
  resetVboutStore();
  const result = await updateContact("bad-id", { firstName: "X" });
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Tagging
// ---------------------------------------------------------------------------

test("tagContact adds a tag to a contact", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "tag@example.com" });
  const tagged = await tagContact(contact.id, "vip");
  assert.ok(tagged);
  assert.ok(tagged.tags.includes("vip"));
});

test("tagContact does not duplicate existing tag", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "tagsame@example.com", tags: ["vip"] });
  const tagged = await tagContact(contact.id, "vip");
  assert.ok(tagged);
  assert.equal(tagged.tags.filter((t) => t === "vip").length, 1);
});

test("tagContact returns null for unknown contact", async () => {
  resetVboutStore();
  const result = await tagContact("bad-id", "vip");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

test("scoreContact adds points to contact score", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "score@example.com" });
  assert.equal(contact.score, 0);

  const scored = await scoreContact(contact.id, 10);
  assert.ok(scored);
  assert.equal(scored.score, 10);

  const scoredAgain = await scoreContact(contact.id, 5);
  assert.ok(scoredAgain);
  assert.equal(scoredAgain.score, 15);
});

test("scoreContact returns null for unknown contact", async () => {
  resetVboutStore();
  const result = await scoreContact("bad-id", 10);
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// List Management
// ---------------------------------------------------------------------------

test("createList creates a new mailing list", async () => {
  resetVboutStore();
  const list = await createList("Newsletter", "t1");
  assert.ok(list.id.startsWith("vbl_"));
  assert.equal(list.name, "Newsletter");
  assert.equal(list.contactCount, 0);
  assert.equal(list.tenantId, "t1");
});

test("listLists returns all lists", async () => {
  resetVboutStore();
  await createList("List A");
  await createList("List B");
  const lists = await listLists();
  assert.equal(lists.length, 2);
});

test("listLists filters by tenantId", async () => {
  resetVboutStore();
  await createList("Tenant 1 List", "t1");
  await createList("Tenant 2 List", "t2");
  const t1Lists = await listLists("t1");
  assert.equal(t1Lists.length, 1);
  assert.equal(t1Lists[0].name, "Tenant 1 List");
});

test("addContactToList adds contact and increments count", async () => {
  resetVboutStore();
  const list = await createList("My List");
  const contact = await createContact({ email: "listc@example.com" });

  const updated = await addContactToList(contact.id, list.id);
  assert.ok(updated);
  assert.ok(updated.lists.includes(list.id));

  const refreshedList = (await listLists())[0];
  assert.equal(refreshedList.contactCount, 1);
});

test("addContactToList does not duplicate list membership", async () => {
  resetVboutStore();
  const list = await createList("Dup List");
  const contact = await createContact({ email: "dupl@example.com" });

  await addContactToList(contact.id, list.id);
  await addContactToList(contact.id, list.id);

  const fetched = await getContact(contact.id);
  assert.ok(fetched);
  assert.equal(fetched.lists.filter((l) => l === list.id).length, 1);

  const refreshedList = (await listLists())[0];
  assert.equal(refreshedList.contactCount, 1);
});

test("addContactToList returns null for unknown contact", async () => {
  resetVboutStore();
  const list = await createList("Orphan List");
  const result = await addContactToList("bad-id", list.id);
  assert.equal(result, null);
});

test("addContactToList returns null for unknown list", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "nolist@example.com" });
  const result = await addContactToList(contact.id, "bad-list");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Campaign Lifecycle
// ---------------------------------------------------------------------------

test("createCampaign creates a draft campaign", async () => {
  resetVboutStore();
  const campaign = await createCampaign({
    name: "Welcome",
    subject: "Welcome aboard",
    fromName: "Acme",
    fromEmail: "noreply@acme.com",
    htmlBody: "<h1>Hello</h1>",
    listIds: ["list-1"],
  });
  assert.ok(campaign.id.startsWith("vbcmp_"));
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.name, "Welcome");
});

test("createCampaign with scheduledAt sets scheduled status", async () => {
  resetVboutStore();
  const campaign = await createCampaign({
    name: "Scheduled",
    subject: "Later",
    fromName: "Acme",
    fromEmail: "no@acme.com",
    htmlBody: "<p>Hi</p>",
    listIds: [],
    scheduledAt: "2026-04-01T10:00:00Z",
  });
  assert.equal(campaign.status, "scheduled");
  assert.equal(campaign.scheduledAt, "2026-04-01T10:00:00Z");
});

test("sendCampaign transitions draft to sent with stats", async () => {
  resetVboutStore();
  const campaign = await createCampaign({
    name: "Send Me",
    subject: "Now",
    fromName: "X",
    fromEmail: "x@x.com",
    htmlBody: "<p>Go</p>",
    listIds: [],
  });
  const sent = await sendCampaign(campaign.id);
  assert.equal(sent.status, "sent");
  assert.ok(sent.sentAt);
  assert.ok(sent.stats);
  assert.equal(typeof sent.stats.openRate, "number");
});

test("sendCampaign is idempotent for already-sent campaigns", async () => {
  resetVboutStore();
  const campaign = await createCampaign({
    name: "Idem",
    subject: "Test",
    fromName: "X",
    fromEmail: "x@x.com",
    htmlBody: "<p>Hi</p>",
    listIds: [],
  });
  const first = await sendCampaign(campaign.id);
  const second = await sendCampaign(campaign.id);
  assert.equal(first.sentAt, second.sentAt);
});

test("sendCampaign throws for unknown campaign", async () => {
  resetVboutStore();
  await assert.rejects(() => sendCampaign("bad-id"), {
    message: "Campaign not found: bad-id",
  });
});

// ---------------------------------------------------------------------------
// Campaign Stats
// ---------------------------------------------------------------------------

test("getCampaignStats returns stats for sent campaign", async () => {
  resetVboutStore();
  const campaign = await createCampaign({
    name: "Stats",
    subject: "Stats",
    fromName: "X",
    fromEmail: "x@x.com",
    htmlBody: "<p>Hi</p>",
    listIds: [],
  });
  await sendCampaign(campaign.id);
  const stats = await getCampaignStats(campaign.id);
  assert.ok(stats);
  assert.equal(typeof stats.sent, "number");
  assert.equal(typeof stats.openRate, "number");
});

test("getCampaignStats returns zero stats for unsent campaign", async () => {
  resetVboutStore();
  const campaign = await createCampaign({
    name: "Unsent",
    subject: "Unsent",
    fromName: "X",
    fromEmail: "x@x.com",
    htmlBody: "<p>Hi</p>",
    listIds: [],
  });
  const stats = await getCampaignStats(campaign.id);
  assert.ok(stats);
  assert.equal(stats.sent, 0);
  assert.equal(stats.openRate, 0);
});

test("getCampaignStats returns null for unknown campaign", async () => {
  resetVboutStore();
  const stats = await getCampaignStats("nonexistent");
  assert.equal(stats, null);
});

// ---------------------------------------------------------------------------
// Automation CRUD
// ---------------------------------------------------------------------------

test("createAutomation creates a new automation", async () => {
  resetVboutStore();
  const automation = await createAutomation({
    name: "Welcome Flow",
    trigger: { type: "contact_added" },
    actions: [{ type: "send_email", config: { templateId: "tpl-1" } }],
    tenantId: "t1",
  });
  assert.ok(automation.id.startsWith("vba_"));
  assert.equal(automation.name, "Welcome Flow");
  assert.equal(automation.active, true);
  assert.equal(automation.executionCount, 0);
});

test("listAutomations returns all automations", async () => {
  resetVboutStore();
  await createAutomation({
    name: "A1",
    trigger: { type: "contact_added" },
    actions: [],
  });
  await createAutomation({
    name: "A2",
    trigger: { type: "tag_added", value: "vip" },
    actions: [],
  });
  const all = await listAutomations();
  assert.equal(all.length, 2);
});

test("listAutomations filters by tenantId", async () => {
  resetVboutStore();
  await createAutomation({
    name: "T1 Auto",
    trigger: { type: "contact_added" },
    actions: [],
    tenantId: "t1",
  });
  await createAutomation({
    name: "T2 Auto",
    trigger: { type: "contact_added" },
    actions: [],
    tenantId: "t2",
  });
  const t1 = await listAutomations("t1");
  assert.equal(t1.length, 1);
  assert.equal(t1[0].name, "T1 Auto");
});

// ---------------------------------------------------------------------------
// Automation Toggle
// ---------------------------------------------------------------------------

test("toggleAutomation disables an automation", async () => {
  resetVboutStore();
  const automation = await createAutomation({
    name: "Togglable",
    trigger: { type: "contact_added" },
    actions: [],
  });
  assert.equal(automation.active, true);

  const disabled = await toggleAutomation(automation.id, false);
  assert.ok(disabled);
  assert.equal(disabled.active, false);

  const enabled = await toggleAutomation(automation.id, true);
  assert.ok(enabled);
  assert.equal(enabled.active, true);
});

test("toggleAutomation returns null for unknown id", async () => {
  resetVboutStore();
  const result = await toggleAutomation("bad-id", false);
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Automation Execution
// ---------------------------------------------------------------------------

test("executeAutomation applies add_tag action", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "exec@example.com" });
  const automation = await createAutomation({
    name: "Tag Automation",
    trigger: { type: "contact_added" },
    actions: [{ type: "add_tag", config: { tag: "engaged" } }],
  });

  const result = await executeAutomation(automation.id, contact.id);
  assert.ok(result);
  assert.ok(result.contact.tags.includes("engaged"));
  assert.equal(result.automation.executionCount, 1);
});

test("executeAutomation applies remove_tag action", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "rm@example.com", tags: ["old"] });
  const automation = await createAutomation({
    name: "Remove Tag",
    trigger: { type: "contact_added" },
    actions: [{ type: "remove_tag", config: { tag: "old" } }],
  });

  const result = await executeAutomation(automation.id, contact.id);
  assert.ok(result);
  assert.ok(!result.contact.tags.includes("old"));
});

test("executeAutomation applies update_field action", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "field@example.com" });
  const automation = await createAutomation({
    name: "Update Field",
    trigger: { type: "form_submitted" },
    actions: [{ type: "update_field", config: { field: "source", value: "webinar" } }],
  });

  const result = await executeAutomation(automation.id, contact.id);
  assert.ok(result);
  assert.equal(result.contact.customFields.source, "webinar");
});

test("executeAutomation applies add_to_list action", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "addlist@example.com" });
  const list = await createList("Auto List");
  const automation = await createAutomation({
    name: "List Add",
    trigger: { type: "contact_added" },
    actions: [{ type: "add_to_list", config: { listId: list.id } }],
  });

  const result = await executeAutomation(automation.id, contact.id);
  assert.ok(result);
  assert.ok(result.contact.lists.includes(list.id));
});

test("executeAutomation returns null for unknown automation", async () => {
  resetVboutStore();
  const contact = await createContact({ email: "x@example.com" });
  const result = await executeAutomation("bad-auto", contact.id);
  assert.equal(result, null);
});

test("executeAutomation returns null for unknown contact", async () => {
  resetVboutStore();
  const automation = await createAutomation({
    name: "No Contact",
    trigger: { type: "contact_added" },
    actions: [],
  });
  const result = await executeAutomation(automation.id, "bad-contact");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Aggregate Stats
// ---------------------------------------------------------------------------

test("getVboutStats returns aggregate statistics", async () => {
  resetVboutStore();
  await createContact({ email: "s1@example.com", tenantId: "t1" });
  await createContact({ email: "s2@example.com", tenantId: "t1" });
  await createCampaign({
    name: "C1",
    subject: "S",
    fromName: "X",
    fromEmail: "x@x.com",
    htmlBody: "<p>Hi</p>",
    listIds: [],
    tenantId: "t1",
  });
  await createAutomation({
    name: "A1",
    trigger: { type: "contact_added" },
    actions: [],
    tenantId: "t1",
  });

  const stats = await getVboutStats("t1");
  assert.equal(stats.totalContacts, 2);
  assert.equal(stats.totalCampaigns, 1);
  assert.equal(stats.totalAutomations, 1);
  assert.equal(stats.contactsByStatus.active, 2);
});

test("getVboutStats returns zero stats when empty", async () => {
  resetVboutStore();
  const stats = await getVboutStats();
  assert.equal(stats.totalContacts, 0);
  assert.equal(stats.totalCampaigns, 0);
  assert.equal(stats.totalAutomations, 0);
  assert.equal(stats.avgOpenRate, 0);
  assert.equal(stats.avgClickRate, 0);
});

// ---------------------------------------------------------------------------
// ProviderResult email sending
// ---------------------------------------------------------------------------

test("sendEmailViaVbout returns dry-run result without API key", async () => {
  clearVboutEnv();
  resetVboutStore();
  const result = await sendEmailViaVbout({
    to: "user@example.com",
    subject: "Test",
    html: "<p>Hi</p>",
  });
  assert.equal(result.ok, true);
  assert.equal(result.provider, "VBOUT");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("user@example.com"));
});

test("sendEmailViaVbout includes payload with to and subject", async () => {
  clearVboutEnv();
  resetVboutStore();
  const result = await sendEmailViaVbout({
    to: "pay@example.com",
    subject: "Payload Test",
    html: "<p>Body</p>",
  });
  assert.ok(result.payload);
  assert.equal(result.payload.to, "pay@example.com");
  assert.equal(result.payload.subject, "Payload Test");
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetVboutStore clears all stores", async () => {
  resetVboutStore();
  await createContact({ email: "clear@example.com" });
  await createList("Clear List");
  await createCampaign({
    name: "Clear",
    subject: "Clear",
    fromName: "X",
    fromEmail: "x@x.com",
    htmlBody: "<p>Hi</p>",
    listIds: [],
  });
  await createAutomation({
    name: "Clear Auto",
    trigger: { type: "contact_added" },
    actions: [],
  });

  resetVboutStore();

  const contacts = await getContactByEmail("clear@example.com");
  assert.equal(contacts, null);
  const lists = await listLists();
  assert.equal(lists.length, 0);
  const automations = await listAutomations();
  assert.equal(automations.length, 0);
  const stats = await getVboutStats();
  assert.equal(stats.totalContacts, 0);
});
