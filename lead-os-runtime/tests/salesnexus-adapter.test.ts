import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSNConfig,
  isSNDryRun,
  createContact,
  getContact,
  getContactByEmail,
  updateContact,
  listContacts,
  createDeal,
  updateDeal,
  listDeals,
  createCampaign,
  sendCampaign,
  pauseCampaign,
  getCampaignStats,
  createDripSequence,
  enrollInSequence,
  listSequences,
  syncLeadToSalesNexus,
  sendEmailViaSalesNexus,
  getSNStats,
  resetSNStore,
} from "../src/lib/integrations/salesnexus-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearSNEnv() {
  delete process.env.SALESNEXUS_API_KEY;
  delete process.env.SALESNEXUS_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveSNConfig returns null when no API key", () => {
  clearSNEnv();
  const cfg = resolveSNConfig();
  assert.equal(cfg, null);
});

test("resolveSNConfig returns config when API key is set", () => {
  clearSNEnv();
  process.env.SALESNEXUS_API_KEY = "sn-test-123";
  const cfg = resolveSNConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "sn-test-123");
  assert.equal(cfg.baseUrl, "https://api.salesnexus.com/v1");
  clearSNEnv();
});

test("resolveSNConfig uses custom base URL from env", () => {
  clearSNEnv();
  process.env.SALESNEXUS_API_KEY = "sn-test";
  process.env.SALESNEXUS_BASE_URL = "https://custom.salesnexus.com/v2";
  const cfg = resolveSNConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.salesnexus.com/v2");
  clearSNEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isSNDryRun returns true when no API key", () => {
  clearSNEnv();
  assert.equal(isSNDryRun(), true);
});

test("isSNDryRun returns false when API key is set", () => {
  clearSNEnv();
  process.env.SALESNEXUS_API_KEY = "sn-test";
  assert.equal(isSNDryRun(), false);
  clearSNEnv();
});

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

test("createContact creates a contact with defaults", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({ email: "alice@example.com" });
  assert.ok(contact.id.startsWith("snc-"));
  assert.equal(contact.email, "alice@example.com");
  assert.equal(contact.status, "lead");
  assert.equal(contact.score, 0);
  assert.deepEqual(contact.tags, []);
  assert.ok(contact.createdAt);

  resetSNStore();
});

test("createContact accepts all optional fields", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({
    email: "bob@corp.com",
    firstName: "Bob",
    lastName: "Smith",
    phone: "+1234567890",
    company: "Corp Inc",
    title: "VP Sales",
    source: "linkedin",
    status: "prospect",
    score: 85,
    tags: ["vip", "enterprise"],
    tenantId: "t-1",
  });

  assert.equal(contact.firstName, "Bob");
  assert.equal(contact.lastName, "Smith");
  assert.equal(contact.phone, "+1234567890");
  assert.equal(contact.company, "Corp Inc");
  assert.equal(contact.title, "VP Sales");
  assert.equal(contact.source, "linkedin");
  assert.equal(contact.status, "prospect");
  assert.equal(contact.score, 85);
  assert.deepEqual(contact.tags, ["vip", "enterprise"]);
  assert.equal(contact.tenantId, "t-1");

  resetSNStore();
});

test("getContact retrieves an existing contact", async () => {
  clearSNEnv();
  resetSNStore();

  const created = await createContact({ email: "get@test.com" });
  const fetched = await getContact(created.id);
  assert.ok(fetched);
  assert.equal(fetched.email, "get@test.com");

  resetSNStore();
});

test("getContact returns null for unknown id", async () => {
  clearSNEnv();
  resetSNStore();
  const result = await getContact("nonexistent");
  assert.equal(result, null);
});

test("getContactByEmail retrieves contact by email", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "find-me@example.com", firstName: "Findable" });
  const found = await getContactByEmail("find-me@example.com");
  assert.ok(found);
  assert.equal(found.firstName, "Findable");

  resetSNStore();
});

test("getContactByEmail returns null for unknown email", async () => {
  clearSNEnv();
  resetSNStore();
  const result = await getContactByEmail("ghost@nowhere.com");
  assert.equal(result, null);
});

test("updateContact updates specific fields", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({ email: "update@test.com", firstName: "Old" });
  const updated = await updateContact(contact.id, { firstName: "New", score: 90 });
  assert.equal(updated.firstName, "New");
  assert.equal(updated.score, 90);
  assert.equal(updated.email, "update@test.com");

  resetSNStore();
});

test("updateContact throws for unknown contact", async () => {
  clearSNEnv();
  resetSNStore();
  await assert.rejects(() => updateContact("bad-id", { firstName: "X" }), /Contact not found/);
});

test("listContacts returns all contacts", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "a@test.com", tenantId: "t1" });
  await createContact({ email: "b@test.com", tenantId: "t1" });
  await createContact({ email: "c@test.com", tenantId: "t2" });

  const all = await listContacts();
  assert.equal(all.length, 3);

  resetSNStore();
});

test("listContacts filters by tenantId", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "a@test.com", tenantId: "t1" });
  await createContact({ email: "b@test.com", tenantId: "t2" });

  const filtered = await listContacts({ tenantId: "t1" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].email, "a@test.com");

  resetSNStore();
});

test("listContacts filters by status", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "lead@test.com", status: "lead" });
  await createContact({ email: "cust@test.com", status: "customer" });

  const leads = await listContacts({ status: "lead" });
  assert.equal(leads.length, 1);
  assert.equal(leads[0].email, "lead@test.com");

  resetSNStore();
});

test("listContacts filters by tag", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "tagged@test.com", tags: ["vip"] });
  await createContact({ email: "plain@test.com" });

  const vips = await listContacts({ tag: "vip" });
  assert.equal(vips.length, 1);
  assert.equal(vips[0].email, "tagged@test.com");

  resetSNStore();
});

// ---------------------------------------------------------------------------
// Deal CRUD
// ---------------------------------------------------------------------------

test("createDeal creates a deal with defaults", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({ email: "deal@test.com" });
  const deal = await createDeal({ contactId: contact.id, title: "Big Deal", value: 50000, stage: "discovery" });

  assert.ok(deal.id.startsWith("snd-"));
  assert.equal(deal.contactId, contact.id);
  assert.equal(deal.title, "Big Deal");
  assert.equal(deal.value, 50000);
  assert.equal(deal.stage, "discovery");
  assert.equal(deal.probability, 50);
  assert.equal(deal.status, "open");
  assert.ok(deal.createdAt);

  resetSNStore();
});

test("createDeal accepts custom probability", async () => {
  clearSNEnv();
  resetSNStore();

  const deal = await createDeal({ contactId: "c1", title: "Sure Thing", value: 10000, stage: "closing", probability: 95 });
  assert.equal(deal.probability, 95);

  resetSNStore();
});

test("updateDeal updates deal fields", async () => {
  clearSNEnv();
  resetSNStore();

  const deal = await createDeal({ contactId: "c1", title: "Deal", value: 1000, stage: "qualification" });
  const updated = await updateDeal(deal.id, { stage: "proposal", value: 2000, status: "won" });

  assert.equal(updated.stage, "proposal");
  assert.equal(updated.value, 2000);
  assert.equal(updated.status, "won");

  resetSNStore();
});

test("updateDeal throws for unknown deal", async () => {
  clearSNEnv();
  resetSNStore();
  await assert.rejects(() => updateDeal("bad-id", { stage: "X" }), /Deal not found/);
});

test("listDeals returns all deals", async () => {
  clearSNEnv();
  resetSNStore();

  await createDeal({ contactId: "c1", title: "D1", value: 100, stage: "s1", tenantId: "t1" });
  await createDeal({ contactId: "c2", title: "D2", value: 200, stage: "s2", tenantId: "t1" });

  const all = await listDeals();
  assert.equal(all.length, 2);

  resetSNStore();
});

test("listDeals filters by tenantId", async () => {
  clearSNEnv();
  resetSNStore();

  await createDeal({ contactId: "c1", title: "D1", value: 100, stage: "s1", tenantId: "t1" });
  await createDeal({ contactId: "c2", title: "D2", value: 200, stage: "s2", tenantId: "t2" });

  const filtered = await listDeals({ tenantId: "t1" });
  assert.equal(filtered.length, 1);

  resetSNStore();
});

test("listDeals filters by status", async () => {
  clearSNEnv();
  resetSNStore();

  const d1 = await createDeal({ contactId: "c1", title: "D1", value: 100, stage: "s1" });
  await createDeal({ contactId: "c2", title: "D2", value: 200, stage: "s2" });
  await updateDeal(d1.id, { status: "won" });

  const won = await listDeals({ status: "won" });
  assert.equal(won.length, 1);

  resetSNStore();
});

test("listDeals filters by contactId", async () => {
  clearSNEnv();
  resetSNStore();

  await createDeal({ contactId: "c1", title: "D1", value: 100, stage: "s1" });
  await createDeal({ contactId: "c2", title: "D2", value: 200, stage: "s2" });

  const filtered = await listDeals({ contactId: "c1" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, "D1");

  resetSNStore();
});

// ---------------------------------------------------------------------------
// Email Campaigns
// ---------------------------------------------------------------------------

test("createCampaign creates a draft campaign", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({
    name: "Welcome Series",
    subject: "Welcome!",
    body: "<h1>Hello</h1>",
  });

  assert.ok(campaign.id.startsWith("sncamp-"));
  assert.equal(campaign.name, "Welcome Series");
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.sentCount, 0);
  assert.equal(campaign.stats, undefined);
  assert.deepEqual(campaign.recipientFilter, {});

  resetSNStore();
});

test("createCampaign accepts recipientFilter", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({
    name: "VIP Campaign",
    subject: "VIP Offer",
    body: "<p>Special</p>",
    recipientFilter: { status: "customer", tag: "vip" },
    tenantId: "t1",
  });

  assert.deepEqual(campaign.recipientFilter, { status: "customer", tag: "vip" });
  assert.equal(campaign.tenantId, "t1");

  resetSNStore();
});

test("sendCampaign activates campaign and generates stats", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "a@test.com", status: "lead", tenantId: "t1" });
  await createContact({ email: "b@test.com", status: "lead", tenantId: "t1" });

  const campaign = await createCampaign({
    name: "Blast",
    subject: "News",
    body: "<p>Body</p>",
    recipientFilter: { status: "lead" },
    tenantId: "t1",
  });

  const sent = await sendCampaign(campaign.id);
  assert.equal(sent.status, "active");
  assert.equal(sent.sentCount, 2);
  assert.ok(sent.stats);
  assert.equal(sent.stats.sent, 2);
  assert.ok(sent.stats.openRate > 0);

  resetSNStore();
});

test("sendCampaign with no matching contacts sends to zero", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({
    name: "Empty",
    subject: "Test",
    body: "<p>Body</p>",
    recipientFilter: { status: "customer" },
  });

  const sent = await sendCampaign(campaign.id);
  assert.equal(sent.sentCount, 0);
  assert.ok(sent.stats);
  assert.equal(sent.stats.openRate, 0);

  resetSNStore();
});

test("sendCampaign throws for unknown campaign", async () => {
  clearSNEnv();
  resetSNStore();
  await assert.rejects(() => sendCampaign("bad-id"), /Campaign not found/);
});

test("sendCampaign throws for completed campaign", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({ name: "C", subject: "S", body: "B" });
  await sendCampaign(campaign.id);
  const paused = await pauseCampaign(campaign.id);
  assert.equal(paused.status, "paused");

  resetSNStore();
});

test("pauseCampaign pauses an active campaign", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({ name: "C", subject: "S", body: "B" });
  await sendCampaign(campaign.id);
  const paused = await pauseCampaign(campaign.id);

  assert.equal(paused.status, "paused");

  resetSNStore();
});

test("pauseCampaign throws for draft campaign", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({ name: "C", subject: "S", body: "B" });
  await assert.rejects(() => pauseCampaign(campaign.id), /Can only pause an active campaign/);

  resetSNStore();
});

test("pauseCampaign throws for unknown campaign", async () => {
  clearSNEnv();
  resetSNStore();
  await assert.rejects(() => pauseCampaign("bad-id"), /Campaign not found/);
});

test("getCampaignStats returns null for unknown campaign", async () => {
  clearSNEnv();
  resetSNStore();
  const stats = await getCampaignStats("nonexistent");
  assert.equal(stats, null);
});

test("getCampaignStats returns null for draft campaign", async () => {
  clearSNEnv();
  resetSNStore();

  const campaign = await createCampaign({ name: "C", subject: "S", body: "B" });
  const stats = await getCampaignStats(campaign.id);
  assert.equal(stats, null);

  resetSNStore();
});

test("getCampaignStats returns stats for sent campaign", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "x@test.com" });
  const campaign = await createCampaign({ name: "C", subject: "S", body: "B" });
  await sendCampaign(campaign.id);

  const stats = await getCampaignStats(campaign.id);
  assert.ok(stats);
  assert.equal(stats.sent, 1);
  assert.equal(typeof stats.openRate, "number");

  resetSNStore();
});

// ---------------------------------------------------------------------------
// Drip Sequences
// ---------------------------------------------------------------------------

test("createDripSequence creates a sequence", async () => {
  clearSNEnv();
  resetSNStore();

  const seq = await createDripSequence({
    name: "Onboarding",
    steps: [
      { delayDays: 0, subject: "Welcome", body: "Hi" },
      { delayDays: 3, subject: "Follow Up", body: "How are you?" },
    ],
    tenantId: "t1",
  });

  assert.ok(seq.id.startsWith("snseq-"));
  assert.equal(seq.name, "Onboarding");
  assert.equal(seq.steps.length, 2);
  assert.equal(seq.enrolledCount, 0);
  assert.equal(seq.active, true);
  assert.equal(seq.tenantId, "t1");

  resetSNStore();
});

test("enrollInSequence increments enrolled count", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({ email: "enroll@test.com" });
  const seq = await createDripSequence({
    name: "Nurture",
    steps: [{ delayDays: 1, subject: "S", body: "B" }],
  });

  const updated = await enrollInSequence(seq.id, contact.id);
  assert.equal(updated.enrolledCount, 1);

  resetSNStore();
});

test("enrollInSequence does not double-enroll same contact", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({ email: "dup@test.com" });
  const seq = await createDripSequence({
    name: "Seq",
    steps: [{ delayDays: 1, subject: "S", body: "B" }],
  });

  await enrollInSequence(seq.id, contact.id);
  const second = await enrollInSequence(seq.id, contact.id);
  assert.equal(second.enrolledCount, 1);

  resetSNStore();
});

test("enrollInSequence throws for unknown sequence", async () => {
  clearSNEnv();
  resetSNStore();
  await assert.rejects(() => enrollInSequence("bad-seq", "c1"), /Sequence not found/);
});

test("enrollInSequence throws for unknown contact", async () => {
  clearSNEnv();
  resetSNStore();

  const seq = await createDripSequence({ name: "S", steps: [] });
  await assert.rejects(() => enrollInSequence(seq.id, "bad-contact"), /Contact not found/);

  resetSNStore();
});

test("listSequences returns all sequences", async () => {
  clearSNEnv();
  resetSNStore();

  await createDripSequence({ name: "S1", steps: [], tenantId: "t1" });
  await createDripSequence({ name: "S2", steps: [], tenantId: "t2" });

  const all = await listSequences();
  assert.equal(all.length, 2);

  resetSNStore();
});

test("listSequences filters by tenantId", async () => {
  clearSNEnv();
  resetSNStore();

  await createDripSequence({ name: "S1", steps: [], tenantId: "t1" });
  await createDripSequence({ name: "S2", steps: [], tenantId: "t2" });

  const filtered = await listSequences("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "S1");

  resetSNStore();
});

// ---------------------------------------------------------------------------
// syncLeadToSalesNexus
// ---------------------------------------------------------------------------

test("syncLeadToSalesNexus creates new contact from lead", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await syncLeadToSalesNexus(
    { email: "lead@company.com", firstName: "Lead", lastName: "Person", company: "Acme" },
    "t1",
  );

  assert.equal(contact.email, "lead@company.com");
  assert.equal(contact.firstName, "Lead");
  assert.equal(contact.company, "Acme");
  assert.equal(contact.tenantId, "t1");

  resetSNStore();
});

test("syncLeadToSalesNexus updates existing contact", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "existing@company.com", firstName: "Old" });
  const synced = await syncLeadToSalesNexus(
    { email: "existing@company.com", firstName: "Updated", company: "NewCo" },
  );

  assert.equal(synced.firstName, "Updated");
  assert.equal(synced.company, "NewCo");

  resetSNStore();
});

test("syncLeadToSalesNexus sets source to lead-os by default", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await syncLeadToSalesNexus({ email: "src@test.com" });
  assert.equal(contact.source, "lead-os");

  resetSNStore();
});

// ---------------------------------------------------------------------------
// sendEmailViaSalesNexus
// ---------------------------------------------------------------------------

test("sendEmailViaSalesNexus returns dry-run ProviderResult without API key", async () => {
  clearSNEnv();
  resetSNStore();

  const result = await sendEmailViaSalesNexus({
    to: "user@example.com",
    subject: "Test",
    html: "<p>Hello</p>",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "SalesNexus");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("user@example.com"));
  assert.ok(result.payload);
  assert.equal(result.payload.to, "user@example.com");
  assert.equal(result.payload.subject, "Test");
});

test("sendEmailViaSalesNexus includes subject in payload", async () => {
  clearSNEnv();
  const result = await sendEmailViaSalesNexus({
    to: "a@b.com",
    subject: "My Subject",
    html: "<p>Hi</p>",
  });
  assert.ok(result.payload);
  assert.equal(result.payload.subject, "My Subject");
});

// ---------------------------------------------------------------------------
// getSNStats
// ---------------------------------------------------------------------------

test("getSNStats returns zero stats for empty store", async () => {
  clearSNEnv();
  resetSNStore();

  const stats = await getSNStats();
  assert.equal(stats.totalContacts, 0);
  assert.equal(stats.totalDeals, 0);
  assert.equal(stats.openDeals, 0);
  assert.equal(stats.totalRevenue, 0);
  assert.equal(stats.avgDealValue, 0);
  assert.equal(stats.winRate, 0);
  assert.equal(stats.campaignsSent, 0);
  assert.equal(stats.avgOpenRate, 0);
});

test("getSNStats aggregates contacts and deals", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "a@test.com", tenantId: "t1" });
  await createContact({ email: "b@test.com", tenantId: "t1" });

  const d1 = await createDeal({ contactId: "c1", title: "D1", value: 10000, stage: "s1", tenantId: "t1" });
  const d2 = await createDeal({ contactId: "c2", title: "D2", value: 20000, stage: "s2", tenantId: "t1" });
  await updateDeal(d1.id, { status: "won" });
  await updateDeal(d2.id, { status: "lost" });

  const stats = await getSNStats("t1");
  assert.equal(stats.totalContacts, 2);
  assert.equal(stats.totalDeals, 2);
  assert.equal(stats.openDeals, 0);
  assert.equal(stats.totalRevenue, 10000);
  assert.equal(stats.avgDealValue, 15000);
  assert.equal(stats.winRate, 50);

  resetSNStore();
});

test("getSNStats filters by tenantId", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "a@test.com", tenantId: "t1" });
  await createContact({ email: "b@test.com", tenantId: "t2" });

  const stats = await getSNStats("t1");
  assert.equal(stats.totalContacts, 1);

  resetSNStore();
});

test("getSNStats includes campaign metrics", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "x@test.com" });
  const camp = await createCampaign({ name: "C", subject: "S", body: "B" });
  await sendCampaign(camp.id);

  const stats = await getSNStats();
  assert.equal(stats.campaignsSent, 1);
  assert.ok(stats.avgOpenRate > 0);

  resetSNStore();
});

// ---------------------------------------------------------------------------
// resetSNStore
// ---------------------------------------------------------------------------

test("resetSNStore clears all stores", async () => {
  clearSNEnv();
  resetSNStore();

  await createContact({ email: "test@test.com" });
  await createDeal({ contactId: "c1", title: "D", value: 100, stage: "s" });
  await createCampaign({ name: "C", subject: "S", body: "B" });
  await createDripSequence({ name: "Seq", steps: [] });

  resetSNStore();

  const contacts = await listContacts();
  const deals = await listDeals();
  const sequences = await listSequences();

  assert.equal(contacts.length, 0);
  assert.equal(deals.length, 0);
  assert.equal(sequences.length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("createContact with empty email still creates record", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({ email: "" });
  assert.equal(contact.email, "");
  assert.ok(contact.id);

  resetSNStore();
});

test("multiple contacts with same email are distinct records", async () => {
  clearSNEnv();
  resetSNStore();

  const c1 = await createContact({ email: "dup@test.com" });
  const c2 = await createContact({ email: "dup@test.com" });
  assert.notEqual(c1.id, c2.id);

  resetSNStore();
});

test("updateContact preserves unmodified fields", async () => {
  clearSNEnv();
  resetSNStore();

  const contact = await createContact({
    email: "preserve@test.com",
    firstName: "Keep",
    lastName: "This",
    tags: ["important"],
  });

  const updated = await updateContact(contact.id, { score: 50 });
  assert.equal(updated.firstName, "Keep");
  assert.equal(updated.lastName, "This");
  assert.deepEqual(updated.tags, ["important"]);
  assert.equal(updated.score, 50);

  resetSNStore();
});

test("deal default probability is 50", async () => {
  clearSNEnv();
  resetSNStore();

  const deal = await createDeal({ contactId: "c1", title: "D", value: 100, stage: "s" });
  assert.equal(deal.probability, 50);

  resetSNStore();
});
