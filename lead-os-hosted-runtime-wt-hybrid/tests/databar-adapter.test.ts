import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveDatabarConfig,
  isDatabarDryRun,
  enrichPerson,
  enrichCompany,
  enrichAndStore,
  getStoredEnrichment,
  getEnrichmentStats,
  enrichLeadAutomatically,
  enrichViaDatabar,
  resetDatabarStore,
} from "../src/lib/integrations/databar-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearDatabarEnv() {
  delete process.env.DATABAR_API_KEY;
  delete process.env.DATABAR_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveDatabarConfig returns null when no API key is set", () => {
  clearDatabarEnv();
  const cfg = resolveDatabarConfig();
  assert.equal(cfg, null);
});

test("resolveDatabarConfig returns config when API key is set", () => {
  clearDatabarEnv();
  process.env.DATABAR_API_KEY = "db-test-key";
  const cfg = resolveDatabarConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "db-test-key");
  assert.equal(cfg.baseUrl, "https://api.databar.ai/api/v1");
  clearDatabarEnv();
});

test("resolveDatabarConfig uses custom base URL from env", () => {
  clearDatabarEnv();
  process.env.DATABAR_API_KEY = "key";
  process.env.DATABAR_BASE_URL = "https://custom.databar.ai/v2";
  const cfg = resolveDatabarConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.databar.ai/v2");
  clearDatabarEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isDatabarDryRun returns true when no API key", () => {
  clearDatabarEnv();
  assert.equal(isDatabarDryRun(), true);
});

test("isDatabarDryRun returns false when API key is set", () => {
  clearDatabarEnv();
  process.env.DATABAR_API_KEY = "key";
  assert.equal(isDatabarDryRun(), false);
  clearDatabarEnv();
});

// ---------------------------------------------------------------------------
// Person enrichment — dry-run
// ---------------------------------------------------------------------------

test("enrichPerson returns dry-run result with email-based data", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichPerson({ email: "john.smith@acme.com" });
  assert.equal(result.ok, true);
  assert.equal(result.source, "dry-run");
  assert.equal(result.creditsUsed, 0);
  assert.ok(result.person);
  assert.equal(result.person.email, "john.smith@acme.com");
  assert.equal(result.person.firstName, "John");
  assert.equal(result.person.lastName, "Smith");
  assert.equal(result.person.company, "Acme Corp");
});

test("enrichPerson uses provided firstName and lastName over extracted ones", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichPerson({
    email: "j@test.com",
    firstName: "Alice",
    lastName: "Wonder",
  });
  assert.ok(result.person);
  assert.equal(result.person.firstName, "Alice");
  assert.equal(result.person.lastName, "Wonder");
});

test("enrichPerson uses provided company name", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichPerson({
    email: "hello@example.com",
    company: "MegaCorp",
  });
  assert.ok(result.person);
  assert.equal(result.person.company, "MegaCorp");
});

test("enrichPerson with linkedinUrl populates linkedinUrl field", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichPerson({
    linkedinUrl: "https://linkedin.com/in/janesmith",
  });
  assert.ok(result.person);
  assert.equal(result.person.linkedinUrl, "https://linkedin.com/in/janesmith");
});

test("enrichPerson with only name+company generates data", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichPerson({
    firstName: "Bob",
    lastName: "Jones",
    company: "Widgets Inc",
  });
  assert.ok(result.person);
  assert.equal(result.person.firstName, "Bob");
  assert.equal(result.person.lastName, "Jones");
  assert.equal(result.person.company, "Widgets Inc");
});

test("enrichPerson returns technologies array", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichPerson({ email: "dev@tech.io" });
  assert.ok(result.person);
  assert.ok(Array.isArray(result.person.technologies));
  assert.ok(result.person.technologies.length > 0);
});

// ---------------------------------------------------------------------------
// Company enrichment — dry-run
// ---------------------------------------------------------------------------

test("enrichCompany returns dry-run result with domain-based data", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({ domain: "stripe.com" });
  assert.equal(result.ok, true);
  assert.equal(result.source, "dry-run");
  assert.equal(result.creditsUsed, 0);
  assert.ok(result.company);
  assert.equal(result.company.domain, "stripe.com");
  assert.equal(result.company.name, "Stripe Corp");
});

test("enrichCompany uses provided name", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({ domain: "x.com", name: "X Platform" });
  assert.ok(result.company);
  assert.equal(result.company.name, "X Platform");
  assert.equal(result.company.domain, "x.com");
});

test("enrichCompany with only name generates data", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({ name: "OpenAI" });
  assert.ok(result.company);
  assert.equal(result.company.name, "OpenAI");
});

test("enrichCompany with linkedinUrl generates data", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({
    linkedinUrl: "https://linkedin.com/company/databar",
  });
  assert.ok(result.company);
  assert.ok(result.company.socialProfiles);
});

test("enrichCompany returns technologies array", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({ domain: "vercel.com" });
  assert.ok(result.company);
  assert.ok(Array.isArray(result.company.technologies));
});

test("enrichCompany returns socialProfiles object", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({ domain: "github.com" });
  assert.ok(result.company);
  assert.equal(typeof result.company.socialProfiles, "object");
  assert.ok(result.company.socialProfiles.linkedin);
});

test("enrichCompany returns numeric employees and founded", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichCompany({ domain: "notion.so" });
  assert.ok(result.company);
  assert.equal(typeof result.company.employees, "number");
  assert.equal(typeof result.company.founded, "number");
});

// ---------------------------------------------------------------------------
// Store and retrieve (cache behavior)
// ---------------------------------------------------------------------------

test("enrichAndStore stores person enrichment and retrieves from cache", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichAndStore({ email: "cache@test.com" }, "person", "tenant-1");
  assert.equal(result.ok, true);
  assert.ok(result.person);

  // Second call should hit cache
  const cached = await enrichAndStore({ email: "cache@test.com" }, "person", "tenant-1");
  assert.equal(cached.ok, true);
  assert.equal(cached.source, "cache");
  assert.equal(cached.creditsUsed, 0);
  assert.ok(cached.person);
});

test("enrichAndStore stores company enrichment and retrieves from cache", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichAndStore({ domain: "cached.com" }, "company", "tenant-2");
  assert.equal(result.ok, true);
  assert.ok(result.company);

  const cached = await enrichAndStore({ domain: "cached.com" }, "company", "tenant-2");
  assert.equal(cached.ok, true);
  assert.equal(cached.source, "cache");
  assert.ok(cached.company);
});

test("getStoredEnrichment returns null for unknown key", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await getStoredEnrichment("nonexistent@test.com", "person");
  assert.equal(result, null);
});

test("getStoredEnrichment returns stored entry by lookup key", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  await enrichAndStore({ email: "stored@find.com" }, "person");
  const stored = await getStoredEnrichment("stored@find.com", "person");
  assert.ok(stored);
  assert.equal(stored.lookupKey, "stored@find.com");
  assert.equal(stored.type, "person");
});

test("enrichAndStore returns failure for empty input", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  const result = await enrichAndStore({}, "person");
  assert.equal(result.ok, false);
});

test("enrichAndStore uses default tenantId when not provided", async () => {
  clearDatabarEnv();
  resetDatabarStore();
  await enrichAndStore({ email: "default-tenant@test.com" }, "person");
  const stored = await getStoredEnrichment("default-tenant@test.com", "person");
  assert.ok(stored);
  assert.equal(stored.tenantId, "default");
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getEnrichmentStats returns correct counts", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "stats1@test.com" }, "person", "t1");
  await enrichAndStore({ email: "stats2@test.com" }, "person", "t1");
  await enrichAndStore({ domain: "stats.com" }, "company", "t1");

  const stats = await getEnrichmentStats("t1");
  assert.equal(stats.total, 3);
  assert.equal(stats.persons, 2);
  assert.equal(stats.companies, 1);
});

test("getEnrichmentStats counts cache hits", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "hit@test.com" }, "person", "t1");
  await enrichAndStore({ email: "hit@test.com" }, "person", "t1"); // cache hit

  const stats = await getEnrichmentStats();
  assert.ok(stats.cacheHits >= 1);
});

test("getEnrichmentStats filters by tenantId", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "a@test.com" }, "person", "alpha");
  await enrichAndStore({ email: "b@test.com" }, "person", "beta");

  const alphaStats = await getEnrichmentStats("alpha");
  assert.equal(alphaStats.total, 1);

  const betaStats = await getEnrichmentStats("beta");
  assert.equal(betaStats.total, 1);
});

test("getEnrichmentStats returns all when no tenantId filter", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "x@test.com" }, "person", "t-a");
  await enrichAndStore({ email: "y@test.com" }, "person", "t-b");

  const stats = await getEnrichmentStats();
  assert.equal(stats.total, 2);
});

// ---------------------------------------------------------------------------
// Auto-enrichment from lead data
// ---------------------------------------------------------------------------

test("enrichLeadAutomatically enriches both person and company from email", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const results = await enrichLeadAutomatically({
    email: "lead@company.com",
    company: "Company Inc",
  });

  assert.ok(results.person);
  assert.equal(results.person.ok, true);
  assert.ok(results.person.person);

  assert.ok(results.company);
  assert.equal(results.company.ok, true);
  assert.ok(results.company.company);
});

test("enrichLeadAutomatically uses website as domain for company", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const results = await enrichLeadAutomatically({
    email: "user@mail.com",
    website: "bigcorp.com",
    company: "BigCorp",
  });

  assert.ok(results.company);
  assert.ok(results.company.company);
  assert.equal(results.company.company!.domain, "bigcorp.com");
});

test("enrichLeadAutomatically returns empty when no email", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const results = await enrichLeadAutomatically({ company: "NoEmail Corp" });
  assert.equal(results.person, undefined);
  assert.equal(results.company, undefined);
});

test("enrichLeadAutomatically with only email enriches both using email domain", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const results = await enrichLeadAutomatically({ email: "solo@domain.io" });
  assert.ok(results.person);
  assert.ok(results.company);
});

// ---------------------------------------------------------------------------
// ProviderResult format
// ---------------------------------------------------------------------------

test("enrichViaDatabar returns ProviderResult in dry-run mode", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichViaDatabar({ email: "provider@test.com" });
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Databar");
  assert.equal(result.mode, "dry-run");
  assert.equal(typeof result.detail, "string");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
});

test("enrichViaDatabar includes lookupKey in payload", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichViaDatabar({ email: "lookup@test.com" });
  assert.ok(result.payload);
  assert.equal(result.payload.lookupKey, "lookup@test.com");
});

test("enrichViaDatabar includes person data in payload", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichViaDatabar({ email: "payloadperson@test.com" });
  assert.ok(result.payload);
  assert.ok(result.payload.person);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("resetDatabarStore clears all stored enrichments", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "clear@test.com" }, "person");
  let stats = await getEnrichmentStats();
  assert.equal(stats.total, 1);

  resetDatabarStore();
  stats = await getEnrichmentStats();
  assert.equal(stats.total, 0);
  assert.equal(stats.cacheHits, 0);
});

test("enrichPerson handles email with no dot separator in local part", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichPerson({ email: "admin@company.com" });
  assert.ok(result.person);
  assert.equal(result.person.firstName, "Admin");
});

test("enrichCompany handles domain with multiple dots", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichCompany({ domain: "app.staging.example.com" });
  assert.ok(result.company);
  assert.equal(result.company.domain, "app.staging.example.com");
});

test("getStoredEnrichment is case-insensitive on lookup key", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "CaseTest@Example.COM" }, "person");
  const stored = await getStoredEnrichment("casetest@example.com", "person");
  assert.ok(stored);
});

test("enrichAndStore does not duplicate on repeated calls", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "once@test.com" }, "person");
  await enrichAndStore({ email: "once@test.com" }, "person");

  const stats = await getEnrichmentStats();
  assert.equal(stats.total, 1);
  assert.ok(stats.cacheHits >= 1);
});

test("person and company with same lookup key are stored separately", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  await enrichAndStore({ email: "dual@test.com" }, "person");
  await enrichAndStore({ domain: "dual@test.com" }, "company");

  const stats = await getEnrichmentStats();
  assert.equal(stats.persons, 1);
  assert.equal(stats.companies, 1);
});

test("enrichPerson with empty object still returns a result", async () => {
  clearDatabarEnv();
  resetDatabarStore();

  const result = await enrichPerson({});
  assert.equal(result.ok, true);
  assert.equal(result.source, "dry-run");
  assert.ok(result.person);
});
