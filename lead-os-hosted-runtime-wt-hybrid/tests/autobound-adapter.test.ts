import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  resolveAutoboundConfig,
  isAutoboundDryRun,
  generateEmail,
  generateSequence,
  getGeneratedEmail,
  listGeneratedEmails,
  getSequence,
  listSequences,
  advanceSequence,
  pauseSequence,
  resumeSequence,
  rateEmail,
  generateForProspectPipeline,
  getAutoboundStats,
  autoboundResult,
  resetAutoboundStore,
} from "../src/lib/integrations/autobound-adapter.ts";
import type {
  ProspectInput,
  GenerateEmailInput,
  GenerateSequenceInput,
  PersonalizedEmail,
  EmailSequence,
} from "../src/lib/integrations/autobound-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROSPECT: ProspectInput = {
  email: "jane.doe@acmecorp.com",
  firstName: "Jane",
  lastName: "Doe",
  company: "Acme Corp",
  title: "VP of Sales",
  linkedinUrl: "https://linkedin.com/in/janedoe",
  website: "https://acmecorp.com",
};

const MINIMAL_PROSPECT: ProspectInput = {
  email: "unknown@gmail.com",
};

function makeEmailInput(overrides?: Partial<GenerateEmailInput>): GenerateEmailInput {
  return {
    prospect: PROSPECT,
    senderName: "Alex Smith",
    senderCompany: "LeadOS Inc",
    valueProposition: "accelerate your outbound pipeline",
    ...overrides,
  };
}

function makeSequenceInput(overrides?: Partial<GenerateSequenceInput>): GenerateSequenceInput {
  return {
    prospect: PROSPECT,
    senderName: "Alex Smith",
    senderCompany: "LeadOS Inc",
    valueProposition: "accelerate your outbound pipeline",
    steps: 4,
    delayDays: [0, 3, 7, 14],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetAutoboundStore();
  delete process.env.AUTOBOUND_API_KEY;
  delete process.env.AUTOBOUND_BASE_URL;
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveAutoboundConfig returns null when no API key is set", () => {
  const cfg = resolveAutoboundConfig();
  assert.equal(cfg, null);
});

test("resolveAutoboundConfig returns config when API key is set", () => {
  process.env.AUTOBOUND_API_KEY = "test-key-123";
  const cfg = resolveAutoboundConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key-123");
  assert.equal(cfg.baseUrl, "https://api.autobound.ai/api/v1");
  delete process.env.AUTOBOUND_API_KEY;
});

test("resolveAutoboundConfig uses custom base URL when set", () => {
  process.env.AUTOBOUND_API_KEY = "test-key";
  process.env.AUTOBOUND_BASE_URL = "https://custom.api.com/v2";
  const cfg = resolveAutoboundConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.api.com/v2");
  delete process.env.AUTOBOUND_API_KEY;
  delete process.env.AUTOBOUND_BASE_URL;
});

test("isAutoboundDryRun returns true when no API key", () => {
  assert.equal(isAutoboundDryRun(), true);
});

test("isAutoboundDryRun returns false when API key is set", () => {
  process.env.AUTOBOUND_API_KEY = "key";
  assert.equal(isAutoboundDryRun(), false);
  delete process.env.AUTOBOUND_API_KEY;
});

// ---------------------------------------------------------------------------
// Single Email Generation (dry-run)
// ---------------------------------------------------------------------------

test("generateEmail produces default 3 variants in dry-run", async () => {
  const emails = await generateEmail(makeEmailInput());
  assert.equal(emails.length, 3);
  for (let i = 0; i < emails.length; i++) {
    assert.equal(emails[i].variant, i);
    assert.equal(emails[i].prospectEmail, PROSPECT.email);
    assert.ok(emails[i].id.startsWith("abemail_"));
  }
});

test("generateEmail respects numberOfVariants parameter", async () => {
  const emails = await generateEmail(makeEmailInput({ numberOfVariants: 5 }));
  assert.equal(emails.length, 5);
});

test("generateEmail produces single variant when numberOfVariants is 1", async () => {
  const emails = await generateEmail(makeEmailInput({ numberOfVariants: 1 }));
  assert.equal(emails.length, 1);
});

test("generateEmail uses specified tone", async () => {
  const emails = await generateEmail(makeEmailInput({ tone: "casual" }));
  for (const email of emails) {
    assert.equal(email.tone, "casual");
  }
});

test("generateEmail defaults to professional tone", async () => {
  const emails = await generateEmail(makeEmailInput());
  for (const email of emails) {
    assert.equal(email.tone, "professional");
  }
});

test("generateEmail produces unique IDs for each variant", async () => {
  const emails = await generateEmail(makeEmailInput());
  const ids = new Set(emails.map((e) => e.id));
  assert.equal(ids.size, emails.length);
});

test("generateEmail sets valid ISO 8601 createdAt", async () => {
  const emails = await generateEmail(makeEmailInput());
  for (const email of emails) {
    const parsed = Date.parse(email.createdAt);
    assert.ok(!isNaN(parsed));
  }
});

// ---------------------------------------------------------------------------
// Personalization signal extraction
// ---------------------------------------------------------------------------

test("generated emails include personalization signals from prospect data", async () => {
  const emails = await generateEmail(makeEmailInput());
  for (const email of emails) {
    assert.ok(email.personalizationSignals.length >= 2);
  }
});

test("signals reference prospect company when available", async () => {
  const emails = await generateEmail(makeEmailInput());
  const allSignals = emails.flatMap((e) => e.personalizationSignals);
  assert.ok(allSignals.some((s) => s.includes("Acme Corp")));
});

test("signals reference prospect title when available", async () => {
  const emails = await generateEmail(makeEmailInput());
  const allSignals = emails.flatMap((e) => e.personalizationSignals);
  assert.ok(allSignals.some((s) => s.includes("VP of Sales")));
});

test("signals reference LinkedIn when URL provided", async () => {
  const emails = await generateEmail(makeEmailInput());
  const allSignals = emails.flatMap((e) => e.personalizationSignals);
  assert.ok(allSignals.some((s) => s.toLowerCase().includes("linkedin")));
});

test("signals include corporate email domain for non-free providers", async () => {
  const emails = await generateEmail(makeEmailInput());
  const allSignals = emails.flatMap((e) => e.personalizationSignals);
  assert.ok(allSignals.some((s) => s.includes("acmecorp.com")));
});

test("minimal prospect still generates at least 2 signals", async () => {
  const emails = await generateEmail(makeEmailInput({ prospect: MINIMAL_PROSPECT }));
  for (const email of emails) {
    assert.ok(email.personalizationSignals.length >= 2);
  }
});

// ---------------------------------------------------------------------------
// Dry-run email content quality
// ---------------------------------------------------------------------------

test("dry-run email body references prospect company", async () => {
  const emails = await generateEmail(makeEmailInput());
  assert.ok(emails.some((e) => e.body.includes("Acme Corp")));
});

test("dry-run email body references prospect first name", async () => {
  const emails = await generateEmail(makeEmailInput());
  assert.ok(emails.some((e) => e.body.includes("Jane")));
});

test("dry-run email body references sender company", async () => {
  const emails = await generateEmail(makeEmailInput());
  assert.ok(emails.some((e) => e.body.includes("LeadOS Inc")));
});

test("dry-run email subject references prospect company or name", async () => {
  const emails = await generateEmail(makeEmailInput());
  assert.ok(
    emails.some(
      (e) => e.subject.includes("Acme Corp") || e.subject.includes("Jane") || e.subject.includes("VP of Sales"),
    ),
  );
});

test("each variant has a different subject line", async () => {
  const emails = await generateEmail(makeEmailInput({ numberOfVariants: 3 }));
  const subjects = emails.map((e) => e.subject);
  const unique = new Set(subjects);
  assert.ok(unique.size > 1, "Expected at least 2 distinct subjects across variants");
});

test("confidence is between 0 and 1", async () => {
  const emails = await generateEmail(makeEmailInput());
  for (const email of emails) {
    assert.ok(email.confidence >= 0 && email.confidence <= 1);
  }
});

// ---------------------------------------------------------------------------
// Sequence generation
// ---------------------------------------------------------------------------

test("generateSequence creates correct number of steps", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 4 }));
  assert.equal(seq.emails.length, 4);
});

test("generateSequence starts in draft status", async () => {
  const seq = await generateSequence(makeSequenceInput());
  assert.equal(seq.status, "draft");
  assert.equal(seq.currentStep, 0);
});

test("generateSequence ID starts with abseq_", async () => {
  const seq = await generateSequence(makeSequenceInput());
  assert.ok(seq.id.startsWith("abseq_"));
});

test("sequence emails have escalating themes", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 4 }));
  const lastEmail = seq.emails[3];
  assert.equal(lastEmail.tone, "urgent");
  assert.equal(seq.emails[0].tone, "professional");
});

test("generateSequence sets tenant ID", async () => {
  const seq = await generateSequence(makeSequenceInput({ tenantId: "t-123" }));
  assert.equal(seq.tenantId, "t-123");
});

// ---------------------------------------------------------------------------
// Sequence lifecycle
// ---------------------------------------------------------------------------

test("advanceSequence moves from draft to active at step 1", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 3 }));
  const advanced = await advanceSequence(seq.id);
  assert.ok(advanced);
  assert.equal(advanced.status, "active");
  assert.equal(advanced.currentStep, 1);
});

test("advanceSequence completes at last step", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 2 }));
  await advanceSequence(seq.id);
  const completed = await advanceSequence(seq.id);
  assert.ok(completed);
  assert.equal(completed.status, "completed");
});

test("advanceSequence on completed sequence stays completed", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 1 }));
  await advanceSequence(seq.id);
  const again = await advanceSequence(seq.id);
  assert.ok(again);
  assert.equal(again.status, "completed");
});

test("pauseSequence pauses an active sequence", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 3 }));
  await advanceSequence(seq.id);
  const paused = await pauseSequence(seq.id);
  assert.ok(paused);
  assert.equal(paused.status, "paused");
});

test("resumeSequence resumes a paused sequence", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 3 }));
  await advanceSequence(seq.id);
  await pauseSequence(seq.id);
  const resumed = await resumeSequence(seq.id);
  assert.ok(resumed);
  assert.equal(resumed.status, "active");
});

test("resumeSequence on non-paused sequence returns unchanged", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 3 }));
  await advanceSequence(seq.id);
  const result = await resumeSequence(seq.id);
  assert.ok(result);
  assert.equal(result.status, "active");
});

test("advanceSequence returns null for unknown ID", async () => {
  const result = await advanceSequence("nonexistent");
  assert.equal(result, null);
});

test("pauseSequence returns null for unknown ID", async () => {
  const result = await pauseSequence("nonexistent");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Email rating
// ---------------------------------------------------------------------------

test("rateEmail returns true for existing email", async () => {
  const emails = await generateEmail(makeEmailInput({ numberOfVariants: 1 }));
  const ok = rateEmail(emails[0].id, "good");
  assert.equal(ok, true);
});

test("rateEmail returns false for nonexistent email", () => {
  const ok = rateEmail("nonexistent", "bad");
  assert.equal(ok, false);
});

// ---------------------------------------------------------------------------
// Store & retrieve
// ---------------------------------------------------------------------------

test("getGeneratedEmail retrieves a stored email", async () => {
  const emails = await generateEmail(makeEmailInput({ numberOfVariants: 1 }));
  const retrieved = getGeneratedEmail(emails[0].id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, emails[0].id);
});

test("getGeneratedEmail returns null for unknown ID", () => {
  assert.equal(getGeneratedEmail("unknown"), null);
});

test("listGeneratedEmails returns all stored emails", async () => {
  await generateEmail(makeEmailInput({ numberOfVariants: 2 }));
  await generateEmail(makeEmailInput({ numberOfVariants: 1, prospect: MINIMAL_PROSPECT }));
  const list = listGeneratedEmails();
  assert.equal(list.length, 3);
});

test("getSequence retrieves a stored sequence", async () => {
  const seq = await generateSequence(makeSequenceInput());
  const retrieved = getSequence(seq.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, seq.id);
});

test("getSequence returns null for unknown ID", () => {
  assert.equal(getSequence("unknown"), null);
});

test("listSequences returns all sequences", async () => {
  await generateSequence(makeSequenceInput({ tenantId: "t1" }));
  await generateSequence(makeSequenceInput({ tenantId: "t2" }));
  const list = listSequences();
  assert.equal(list.length, 2);
});

test("listSequences filters by tenantId", async () => {
  await generateSequence(makeSequenceInput({ tenantId: "t1" }));
  await generateSequence(makeSequenceInput({ tenantId: "t2" }));
  const filtered = listSequences("t1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].tenantId, "t1");
});

// ---------------------------------------------------------------------------
// Bulk pipeline generation
// ---------------------------------------------------------------------------

test("generateForProspectPipeline generates sequences for all prospects", async () => {
  const prospects: ProspectInput[] = [
    { email: "a@corp.com", firstName: "A", company: "Corp A" },
    { email: "b@corp.com", firstName: "B", company: "Corp B" },
    { email: "c@corp.com", firstName: "C", company: "Corp C" },
  ];

  const result = await generateForProspectPipeline(
    prospects,
    { name: "Sender", company: "LeadOS", valueProposition: "grow revenue" },
    "tenant-bulk",
  );

  assert.equal(result.sequences.length, 3);
  assert.equal(result.generated, 9);
  assert.ok(result.avgConfidence > 0);
  assert.ok(result.avgConfidence <= 1);
});

test("generateForProspectPipeline handles empty prospect list", async () => {
  const result = await generateForProspectPipeline(
    [],
    { name: "Sender", company: "LeadOS", valueProposition: "grow" },
  );

  assert.equal(result.sequences.length, 0);
  assert.equal(result.generated, 0);
  assert.equal(result.avgConfidence, 0);
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getAutoboundStats returns correct counts after generation", async () => {
  await generateEmail(makeEmailInput({ numberOfVariants: 3, tenantId: "t1" }));
  await generateSequence(makeSequenceInput({ steps: 2, tenantId: "t1" }));

  const stats = getAutoboundStats();
  assert.equal(stats.totalGenerated, 5);
  assert.equal(stats.totalSequences, 1);
  assert.ok(stats.avgConfidence > 0);
  assert.ok(stats.topSignals.length > 0);
  assert.ok(Object.keys(stats.byTone).length > 0);
});

test("getAutoboundStats returns zeros when store is empty", () => {
  const stats = getAutoboundStats();
  assert.equal(stats.totalGenerated, 0);
  assert.equal(stats.totalSequences, 0);
  assert.equal(stats.avgConfidence, 0);
  assert.deepEqual(stats.topSignals, []);
  assert.deepEqual(stats.byTone, {});
});

// ---------------------------------------------------------------------------
// ProviderResult
// ---------------------------------------------------------------------------

test("autoboundResult returns correct shape in dry-run mode", () => {
  const result = autoboundResult("generate", "Generated 3 variants");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Autobound");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("generate"));
  assert.ok(result.detail.includes("Generated 3 variants"));
});

test("autoboundResult returns live mode when API key is set", () => {
  process.env.AUTOBOUND_API_KEY = "key";
  const result = autoboundResult("generate", "done");
  assert.equal(result.mode, "live");
  delete process.env.AUTOBOUND_API_KEY;
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("generateEmail with minimal prospect produces valid output", async () => {
  const emails = await generateEmail(makeEmailInput({ prospect: MINIMAL_PROSPECT }));
  assert.equal(emails.length, 3);
  for (const email of emails) {
    assert.ok(email.subject.length > 0);
    assert.ok(email.body.length > 0);
    assert.equal(email.prospectEmail, "unknown@gmail.com");
  }
});

test("generateSequence with 1 step works", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 1 }));
  assert.equal(seq.emails.length, 1);
});

test("advanceSequence on paused sequence stays paused", async () => {
  const seq = await generateSequence(makeSequenceInput({ steps: 3 }));
  await advanceSequence(seq.id);
  await pauseSequence(seq.id);
  const result = await advanceSequence(seq.id);
  assert.ok(result);
  assert.equal(result.status, "paused");
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetAutoboundStore clears all stores", async () => {
  await generateEmail(makeEmailInput({ numberOfVariants: 2 }));
  await generateSequence(makeSequenceInput({ steps: 2 }));
  resetAutoboundStore();

  assert.equal(listGeneratedEmails().length, 0);
  assert.equal(listSequences().length, 0);
  const stats = getAutoboundStats();
  assert.equal(stats.totalGenerated, 0);
  assert.equal(stats.totalSequences, 0);
});
