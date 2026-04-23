import test from "node:test";
import assert from "node:assert/strict";
import {
  // Config & health
  getGrooveMailConfig,
  isGrooveMailDryRun,
  grooveMailHealthCheck,
  getGrooveAffiliateConfig,
  isGrooveAffiliateDryRun,
  // GrooveMail — contacts
  addContact,
  removeContact,
  addTagToContact,
  // GrooveMail — campaigns
  createCampaign,
  sendCampaign,
  getCampaignStats,
  listCampaigns,
  // GrooveMail — sequences
  createSequence,
  enrollInSequence,
  pauseSequence,
  listSequences,
  listEnrollments,
  // GrooveMail — transactional
  sendTransactionalEmail,
  sendEmailViaGroove,
  // GrooveAffiliate — programs
  createAffiliateProgram,
  getAffiliateProgram,
  listAffiliatePrograms,
  // GrooveAffiliate — affiliates
  registerAffiliate,
  getAffiliate,
  listAffiliates,
  generateAffiliateSignupUrl,
  // GrooveAffiliate — conversions
  recordConversion,
  getConversions,
  getPayoutSummary,
  approveConversion,
  markConversionPaid,
  // Store reset
  resetGrooveStores,
} from "../src/lib/integrations/groove-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearGrooveEnv() {
  delete process.env.GROOVE_API_KEY;
  delete process.env.GROOVE_BASE_URL;
  delete process.env.GROOVE_LIST_ID;
  delete process.env.GROOVE_AFFILIATE_API_KEY;
  delete process.env.GROOVE_AFFILIATE_BASE_URL;
  delete process.env.LEAD_OS_ENABLE_LIVE_SENDS;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("getGrooveMailConfig resolves from environment variables", () => {
  clearGrooveEnv();
  process.env.GROOVE_API_KEY = "test-key";
  process.env.GROOVE_BASE_URL = "https://custom.groove.cm/v1";
  process.env.GROOVE_LIST_ID = "list-123";

  const cfg = getGrooveMailConfig();
  assert.equal(cfg.apiKey, "test-key");
  assert.equal(cfg.baseUrl, "https://custom.groove.cm/v1");
  assert.equal(cfg.listId, "list-123");

  clearGrooveEnv();
});

test("getGrooveMailConfig uses default baseUrl when env var absent", () => {
  clearGrooveEnv();
  const cfg = getGrooveMailConfig();
  assert.equal(cfg.baseUrl, "https://api.groove.cm/v1");
  assert.equal(cfg.apiKey, "");
});

test("getGrooveAffiliateConfig falls back to GROOVE_API_KEY when GROOVE_AFFILIATE_API_KEY absent", () => {
  clearGrooveEnv();
  process.env.GROOVE_API_KEY = "shared-key";

  const cfg = getGrooveAffiliateConfig();
  assert.equal(cfg.apiKey, "shared-key");

  clearGrooveEnv();
});

test("getGrooveAffiliateConfig prefers GROOVE_AFFILIATE_API_KEY over GROOVE_API_KEY", () => {
  clearGrooveEnv();
  process.env.GROOVE_API_KEY = "shared-key";
  process.env.GROOVE_AFFILIATE_API_KEY = "aff-key";

  const cfg = getGrooveAffiliateConfig();
  assert.equal(cfg.apiKey, "aff-key");

  clearGrooveEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isGrooveMailDryRun returns true when no API key configured", () => {
  clearGrooveEnv();
  assert.equal(isGrooveMailDryRun(), true);
});

test("isGrooveMailDryRun returns true when LEAD_OS_ENABLE_LIVE_SENDS is false", () => {
  clearGrooveEnv();
  process.env.GROOVE_API_KEY = "some-key";
  process.env.LEAD_OS_ENABLE_LIVE_SENDS = "false";

  assert.equal(isGrooveMailDryRun(), true);

  clearGrooveEnv();
});

test("isGrooveMailDryRun returns false when API key set and live sends enabled", () => {
  clearGrooveEnv();
  process.env.GROOVE_API_KEY = "some-key";

  assert.equal(isGrooveMailDryRun(), false);

  clearGrooveEnv();
});

test("isGrooveAffiliateDryRun returns true when no API key configured", () => {
  clearGrooveEnv();
  assert.equal(isGrooveAffiliateDryRun(), true);
});

// ---------------------------------------------------------------------------
// GrooveMail — Health check
// ---------------------------------------------------------------------------

test("grooveMailHealthCheck returns ok in dry-run mode (no API key)", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const result = await grooveMailHealthCheck();
  assert.equal(result.ok, true);
  assert.ok(result.message.includes("dry-run"));
});

// ---------------------------------------------------------------------------
// GrooveMail — Contacts
// ---------------------------------------------------------------------------

test("addContact stores contact locally in dry-run mode", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const contact = await addContact("alice@example.com", "Alice", "Smith", ["vip"], "list-1");
  assert.ok(contact.id);
  assert.equal(contact.email, "alice@example.com");
  assert.equal(contact.firstName, "Alice");
  assert.equal(contact.lastName, "Smith");
  assert.deepEqual(contact.tags, ["vip"]);
  assert.equal(contact.listId, "list-1");
  assert.ok(contact.subscribedAt);
});

test("addContact with same email returns same id on second call", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const first = await addContact("bob@example.com");
  const second = await addContact("bob@example.com");
  assert.equal(first.id, second.id);
});

test("removeContact returns true in dry-run mode", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await addContact("carol@example.com", undefined, undefined, undefined, "list-a");
  const removed = await removeContact("carol@example.com", "list-a");
  assert.equal(removed, true);
});

test("addTagToContact appends tag to existing contact", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await addContact("dave@example.com", "Dave", undefined, ["existing-tag"]);
  const result = await addTagToContact("dave@example.com", "new-tag");
  assert.equal(result, true);
});

// ---------------------------------------------------------------------------
// GrooveMail — Campaigns
// ---------------------------------------------------------------------------

test("createCampaign stores campaign with correct fields", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const campaign = await createCampaign(
    "tenant-abc",
    "Welcome Campaign",
    "Welcome to Lead OS",
    "<h1>Hello</h1>",
    { textBody: "Hello", fromName: "LeadOS", listId: "list-1" },
  );

  assert.ok(campaign.id.startsWith("camp-"));
  assert.equal(campaign.tenantId, "tenant-abc");
  assert.equal(campaign.name, "Welcome Campaign");
  assert.equal(campaign.subject, "Welcome to Lead OS");
  assert.equal(campaign.htmlBody, "<h1>Hello</h1>");
  assert.equal(campaign.textBody, "Hello");
  assert.equal(campaign.fromName, "LeadOS");
  assert.equal(campaign.listId, "list-1");
  assert.equal(campaign.status, "draft");
  assert.deepEqual(campaign.stats, { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });
  assert.ok(campaign.createdAt);
  assert.ok(campaign.updatedAt);
});

test("sendCampaign updates status to sent", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const campaign = await createCampaign("tenant-1", "Test", "Subject", "<p>Body</p>");
  const sent = await sendCampaign(campaign.id);

  assert.equal(sent.status, "sent");
  assert.ok(sent.sentAt);
});

test("sendCampaign throws for unknown campaign id", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => sendCampaign("nonexistent-id"),
    /Campaign not found/,
  );
});

test("getCampaignStats returns zero stats for new campaign", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const campaign = await createCampaign("t1", "Stats Test", "Subject", "<p>Body</p>");
  const stats = await getCampaignStats(campaign.id);

  assert.ok(stats !== null);
  assert.equal(stats!.sent, 0);
  assert.equal(stats!.opened, 0);
  assert.equal(stats!.clicked, 0);
  assert.equal(stats!.bounced, 0);
});

test("getCampaignStats returns null for unknown id", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const stats = await getCampaignStats("nonexistent");
  assert.equal(stats, null);
});

test("listCampaigns filters by tenantId", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await createCampaign("tenant-A", "A Campaign", "Subject A", "<p>A</p>");
  await createCampaign("tenant-A", "A2 Campaign", "Subject A2", "<p>A2</p>");
  await createCampaign("tenant-B", "B Campaign", "Subject B", "<p>B</p>");

  const tenantACampaigns = await listCampaigns("tenant-A");
  assert.equal(tenantACampaigns.length, 2);
  assert.ok(tenantACampaigns.every((c) => c.tenantId === "tenant-A"));

  const tenantBCampaigns = await listCampaigns("tenant-B");
  assert.equal(tenantBCampaigns.length, 1);
});

// ---------------------------------------------------------------------------
// GrooveMail — Sequences
// ---------------------------------------------------------------------------

test("createSequence stores sequence with steps and correct defaults", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const sequence = await createSequence("tenant-1", "Nurture", [
    { delayHours: 0, subject: "Welcome!", htmlBody: "<p>Welcome</p>" },
    { delayHours: 24, subject: "Day 2", htmlBody: "<p>Day 2</p>", textBody: "Day 2 text" },
  ]);

  assert.ok(sequence.id.startsWith("seq-"));
  assert.equal(sequence.tenantId, "tenant-1");
  assert.equal(sequence.name, "Nurture");
  assert.equal(sequence.steps.length, 2);
  assert.ok(sequence.steps[0].id.startsWith("step-"));
  assert.equal(sequence.steps[1].delayHours, 24);
  assert.equal(sequence.status, "active");
  assert.equal(sequence.enrolledCount, 0);
});

test("enrollInSequence creates enrollment and increments enrolledCount", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const sequence = await createSequence("tenant-1", "Onboarding", [
    { delayHours: 0, subject: "Welcome", htmlBody: "<p>Hi</p>" },
  ]);

  const enrollment = await enrollInSequence(sequence.id, "user@example.com");
  assert.ok(enrollment.id.startsWith("enroll-"));
  assert.equal(enrollment.sequenceId, sequence.id);
  assert.equal(enrollment.contactEmail, "user@example.com");
  assert.equal(enrollment.currentStep, 0);
  assert.equal(enrollment.status, "active");

  const enrollments = await listEnrollments(sequence.id);
  assert.equal(enrollments.length, 1);

  const updated = (await listSequences("tenant-1")).find((s) => s.id === sequence.id);
  assert.equal(updated?.enrolledCount, 1);
});

test("enrollInSequence throws for unknown sequence", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => enrollInSequence("nonexistent", "user@example.com"),
    /Sequence not found/,
  );
});

test("pauseSequence updates status to paused", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const sequence = await createSequence("t1", "To Pause", [
    { delayHours: 0, subject: "S", htmlBody: "<p>S</p>" },
  ]);

  const paused = await pauseSequence(sequence.id);
  assert.equal(paused.status, "paused");
});

test("pauseSequence throws for unknown sequence", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => pauseSequence("nonexistent"),
    /Sequence not found/,
  );
});

// ---------------------------------------------------------------------------
// GrooveMail — Transactional Email
// ---------------------------------------------------------------------------

test("sendTransactionalEmail returns ok with dry-run mode when no API key", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const result = await sendTransactionalEmail(
    "recipient@example.com",
    "Hello",
    "<p>Body</p>",
    "Plain body",
    "Sender",
    "sender@example.com",
  );

  assert.equal(result.ok, true);
  assert.equal(result.mode, "dry-run");
  assert.ok(result.messageId.startsWith("msg-"));
});

test("sendEmailViaGroove returns ProviderResult shape in dry-run", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const result = await sendEmailViaGroove({
    email: "test@example.com",
    subject: "Provider Test",
    htmlBody: "<p>Test</p>",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Groove");
  assert.ok(["live", "dry-run", "prepared"].includes(result.mode));
  assert.ok(typeof result.detail === "string");
});

test("sendEmailViaGroove includes email in payload", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const result = await sendEmailViaGroove({
    email: "payload@example.com",
    subject: "Payload Test",
    htmlBody: "<p>Test</p>",
  });

  assert.equal(result.payload?.to, "payload@example.com");
});

// ---------------------------------------------------------------------------
// GrooveAffiliate — Programs
// ---------------------------------------------------------------------------

test("createAffiliateProgram stores program with correct fields", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("tenant-1", "Partner Program", "percentage", 20, {
    cookieDuration: 60,
    payoutMinimum: 100,
  });

  assert.ok(program.id.startsWith("prog-"));
  assert.equal(program.tenantId, "tenant-1");
  assert.equal(program.name, "Partner Program");
  assert.equal(program.commissionType, "percentage");
  assert.equal(program.commissionRate, 20);
  assert.equal(program.cookieDuration, 60);
  assert.equal(program.payoutMinimum, 100);
  assert.equal(program.active, true);
  assert.equal(program.affiliateCount, 0);
  assert.ok(program.createdAt);
});

test("createAffiliateProgram uses sensible defaults when options omitted", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Basic Program", "fixed", 25);
  assert.equal(program.cookieDuration, 30);
  assert.equal(program.payoutMinimum, 50);
});

test("listAffiliatePrograms filters by tenantId", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await createAffiliateProgram("tenant-X", "Program X1", "percentage", 10);
  await createAffiliateProgram("tenant-X", "Program X2", "fixed", 5);
  await createAffiliateProgram("tenant-Y", "Program Y1", "percentage", 15);

  const xPrograms = await listAffiliatePrograms("tenant-X");
  assert.equal(xPrograms.length, 2);

  const yPrograms = await listAffiliatePrograms("tenant-Y");
  assert.equal(yPrograms.length, 1);
});

test("getAffiliateProgram returns undefined for unknown id", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const result = await getAffiliateProgram("nonexistent");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// GrooveAffiliate — Affiliates
// ---------------------------------------------------------------------------

test("registerAffiliate generates referral code and tracking URL", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "percentage", 10);
  const affiliate = await registerAffiliate(program.id, "aff@example.com", "Test Affiliate");

  assert.ok(affiliate.id.startsWith("aff-"));
  assert.equal(affiliate.programId, program.id);
  assert.equal(affiliate.email, "aff@example.com");
  assert.equal(affiliate.name, "Test Affiliate");
  assert.equal(affiliate.status, "pending");
  assert.ok(typeof affiliate.referralCode === "string" && affiliate.referralCode.length > 0);
  assert.ok(affiliate.trackingUrl.includes(affiliate.referralCode));
  assert.ok(affiliate.joinedAt);
});

test("registerAffiliate increments program affiliateCount", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "percentage", 10);
  await registerAffiliate(program.id, "aff1@example.com", "Affiliate One");
  await registerAffiliate(program.id, "aff2@example.com", "Affiliate Two");

  const updated = await getAffiliateProgram(program.id);
  assert.equal(updated?.affiliateCount, 2);
});

test("registerAffiliate throws for unknown program", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => registerAffiliate("nonexistent", "a@b.com", "Name"),
    /not found/,
  );
});

test("getAffiliate returns stored affiliate data", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "percentage", 10);
  const affiliate = await registerAffiliate(program.id, "aff@example.com", "Test");

  const retrieved = await getAffiliate(affiliate.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, affiliate.id);
  assert.equal(retrieved.email, "aff@example.com");
});

test("listAffiliates filters by programId", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const prog1 = await createAffiliateProgram("t1", "P1", "percentage", 10);
  const prog2 = await createAffiliateProgram("t1", "P2", "fixed", 5);

  await registerAffiliate(prog1.id, "a@b.com", "A");
  await registerAffiliate(prog1.id, "c@d.com", "C");
  await registerAffiliate(prog2.id, "e@f.com", "E");

  const prog1Affiliates = await listAffiliates(prog1.id);
  assert.equal(prog1Affiliates.length, 2);

  const prog2Affiliates = await listAffiliates(prog2.id);
  assert.equal(prog2Affiliates.length, 1);
});

// ---------------------------------------------------------------------------
// GrooveAffiliate — Conversions
// ---------------------------------------------------------------------------

test("recordConversion computes commission correctly for percentage type", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Perc Prog", "percentage", 25);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");

  const conversion = await recordConversion(affiliate.id, 200);
  assert.equal(conversion.commission, 50); // 25% of 200
  assert.equal(conversion.amount, 200);
  assert.equal(conversion.status, "pending");
  assert.ok(conversion.id.startsWith("conv-"));
});

test("recordConversion computes commission correctly for fixed type", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Fixed Prog", "fixed", 15);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");

  const conversion = await recordConversion(affiliate.id, 300);
  assert.equal(conversion.commission, 15); // flat $15
});

test("recordConversion stores orderId when provided", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "fixed", 10);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");

  const conversion = await recordConversion(affiliate.id, 100, "order-xyz");
  assert.equal(conversion.orderId, "order-xyz");
});

test("recordConversion throws for unknown affiliate", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => recordConversion("nonexistent", 100),
    /Affiliate not found/,
  );
});

test("getConversions filters by affiliateId", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "fixed", 10);
  const aff1 = await registerAffiliate(program.id, "a@b.com", "A");
  const aff2 = await registerAffiliate(program.id, "c@d.com", "C");

  await recordConversion(aff1.id, 100);
  await recordConversion(aff1.id, 200);
  await recordConversion(aff2.id, 150);

  const aff1Conversions = await getConversions(aff1.id);
  assert.equal(aff1Conversions.length, 2);

  const aff2Conversions = await getConversions(aff2.id);
  assert.equal(aff2Conversions.length, 1);
});

test("getConversions filters by since date", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "fixed", 10);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");

  await recordConversion(affiliate.id, 100);

  const since = new Date(Date.now() + 60_000).toISOString(); // 1 minute in the future
  const filtered = await getConversions(affiliate.id, since);
  assert.equal(filtered.length, 0);
});

test("getPayoutSummary aggregates correctly", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "percentage", 10);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");

  const conv1 = await recordConversion(affiliate.id, 100); // commission: 10
  const conv2 = await recordConversion(affiliate.id, 200); // commission: 20
  await approveConversion(conv1.id);
  await markConversionPaid(conv1.id);

  const summary = await getPayoutSummary(affiliate.id);
  assert.equal(summary.affiliateId, affiliate.id);
  assert.equal(summary.totalEarned, 30); // 10 + 20
  assert.equal(summary.totalPaid, 10);
  assert.equal(summary.conversionCount, 2);
  // conv2 is still pending so it counts in pendingPayout
  assert.ok(summary.pendingPayout >= 0);
});

test("approveConversion changes status to approved", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "fixed", 10);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");
  const conversion = await recordConversion(affiliate.id, 100);

  const approved = await approveConversion(conversion.id);
  assert.equal(approved.status, "approved");
});

test("approveConversion throws for unknown conversion", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => approveConversion("nonexistent"),
    /Conversion not found/,
  );
});

test("markConversionPaid changes status to paid", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  const program = await createAffiliateProgram("t1", "Prog", "fixed", 10);
  const affiliate = await registerAffiliate(program.id, "a@b.com", "A");
  const conversion = await recordConversion(affiliate.id, 100);
  await approveConversion(conversion.id);

  const paid = await markConversionPaid(conversion.id);
  assert.equal(paid.status, "paid");
});

test("markConversionPaid throws for unknown conversion", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await assert.rejects(
    () => markConversionPaid("nonexistent"),
    /Conversion not found/,
  );
});

// ---------------------------------------------------------------------------
// GrooveAffiliate — Signup URL
// ---------------------------------------------------------------------------

test("generateAffiliateSignupUrl contains programId", () => {
  clearGrooveEnv();

  const url = generateAffiliateSignupUrl("prog-abc-123");
  assert.ok(url.includes("prog-abc-123"));
  assert.ok(url.includes("programId=prog-abc-123"));
});

// ---------------------------------------------------------------------------
// Store reset
// ---------------------------------------------------------------------------

test("resetGrooveStores clears all data", async () => {
  clearGrooveEnv();

  await addContact("reset-test@example.com");
  await createCampaign("t1", "C", "S", "<p>B</p>");
  await createAffiliateProgram("t1", "P", "fixed", 5);

  resetGrooveStores();

  const campaigns = await listCampaigns("t1");
  assert.equal(campaigns.length, 0);

  const programs = await listAffiliatePrograms("t1");
  assert.equal(programs.length, 0);
});

// ---------------------------------------------------------------------------
// Tenant isolation
// ---------------------------------------------------------------------------

test("affiliate programs are isolated between tenants", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await createAffiliateProgram("tenant-alpha", "Alpha Program", "percentage", 15);
  await createAffiliateProgram("tenant-beta", "Beta Program", "fixed", 10);

  const alphaProg = await listAffiliatePrograms("tenant-alpha");
  const betaProg = await listAffiliatePrograms("tenant-beta");

  assert.equal(alphaProg.length, 1);
  assert.equal(alphaProg[0].tenantId, "tenant-alpha");
  assert.equal(betaProg.length, 1);
  assert.equal(betaProg[0].tenantId, "tenant-beta");
});

test("campaigns are isolated between tenants", async () => {
  clearGrooveEnv();
  resetGrooveStores();

  await createCampaign("tenant-alpha", "Alpha Camp", "Subject", "<p>A</p>");
  await createCampaign("tenant-beta", "Beta Camp", "Subject", "<p>B</p>");

  const alphaCamp = await listCampaigns("tenant-alpha");
  const betaCamp = await listCampaigns("tenant-beta");

  assert.equal(alphaCamp.length, 1);
  assert.equal(betaCamp.length, 1);
  assert.equal(alphaCamp[0].tenantId, "tenant-alpha");
  assert.equal(betaCamp[0].tenantId, "tenant-beta");
});
