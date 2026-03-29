import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveLeadRocksConfig,
  isLeadRocksDryRun,
  searchContacts,
  enrichFromLinkedIn,
  enrichFromEmail,
  saveSearchResults,
  getStoredContacts,
  findContactByEmail,
  getSearchStats,
  searchAndIngestAsProspects,
  searchViaLeadRocks,
  resetLeadRocksStore,
} from "../src/lib/integrations/leadrocks-adapter.ts";
import type {
  LeadRocksContact,
  LeadRocksSearchParams,
} from "../src/lib/integrations/leadrocks-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearLeadRocksEnv() {
  delete process.env.LEADROCKS_API_KEY;
  delete process.env.LEADROCKS_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveLeadRocksConfig returns null when no API key", () => {
  clearLeadRocksEnv();
  const cfg = resolveLeadRocksConfig();
  assert.equal(cfg, null);
});

test("resolveLeadRocksConfig resolves from environment variables", () => {
  clearLeadRocksEnv();
  process.env.LEADROCKS_API_KEY = "lr-test-key";
  process.env.LEADROCKS_BASE_URL = "https://custom.leadrocks.io/api/v2";

  const cfg = resolveLeadRocksConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "lr-test-key");
  assert.equal(cfg.baseUrl, "https://custom.leadrocks.io/api/v2");

  clearLeadRocksEnv();
});

test("resolveLeadRocksConfig uses default baseUrl when env var absent", () => {
  clearLeadRocksEnv();
  process.env.LEADROCKS_API_KEY = "lr-test-key";

  const cfg = resolveLeadRocksConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://api.leadrocks.io/api/v1");

  clearLeadRocksEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isLeadRocksDryRun returns true when no API key", () => {
  clearLeadRocksEnv();
  assert.equal(isLeadRocksDryRun(), true);
});

test("isLeadRocksDryRun returns false when API key present", () => {
  clearLeadRocksEnv();
  process.env.LEADROCKS_API_KEY = "lr-test-key";
  assert.equal(isLeadRocksDryRun(), false);
  clearLeadRocksEnv();
});

// ---------------------------------------------------------------------------
// Contact search (dry-run)
// ---------------------------------------------------------------------------

test("searchContacts returns contacts in dry-run mode", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ jobTitle: "Engineer" });
  assert.ok(result.contacts.length >= 5);
  assert.ok(result.contacts.length <= 10);
  assert.ok(result.total > 0);
  assert.ok(result.creditsUsed > 0);
  assert.equal(typeof result.hasMore, "boolean");
});

test("searchContacts uses job title from params in dry-run", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ jobTitle: "CTO" });
  for (const c of result.contacts) {
    assert.equal(c.jobTitle, "CTO");
  }
});

test("searchContacts uses company name from params in dry-run", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ company: "Stripe" });
  for (const c of result.contacts) {
    assert.equal(c.company, "Stripe");
    assert.ok(c.email.includes("stripe"));
  }
});

test("searchContacts uses industry from params in dry-run", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ industry: "Healthcare" });
  for (const c of result.contacts) {
    assert.equal(c.industry, "Healthcare");
  }
});

test("searchContacts uses location from params in dry-run", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ location: "Austin, TX" });
  for (const c of result.contacts) {
    assert.equal(c.location, "Austin, TX");
  }
});

test("searchContacts uses seniority from params in dry-run", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ seniority: "C-Level" });
  for (const c of result.contacts) {
    assert.equal(c.seniority, "C-Level");
  }
});

test("searchContacts uses company size from params in dry-run", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ companySize: "201-500" });
  for (const c of result.contacts) {
    assert.equal(c.companySize, "201-500");
  }
});

test("searchContacts respects limit parameter", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ jobTitle: "Manager", limit: 3 });
  assert.ok(result.contacts.length <= 3);
});

test("searchContacts respects offset parameter", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ jobTitle: "Manager", offset: 10 });
  assert.ok(result.contacts.length > 0);
});

test("searchContacts with all fields populated", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const params: LeadRocksSearchParams = {
    jobTitle: "VP of Sales",
    company: "HubSpot",
    industry: "Marketing",
    location: "Boston, MA",
    companySize: "1000+",
    seniority: "VP",
    limit: 5,
    offset: 0,
  };

  const result = await searchContacts(params);
  assert.ok(result.contacts.length > 0);
  assert.ok(result.contacts.length <= 5);
  for (const c of result.contacts) {
    assert.equal(c.jobTitle, "VP of Sales");
    assert.equal(c.company, "HubSpot");
    assert.equal(c.industry, "Marketing");
    assert.equal(c.location, "Boston, MA");
    assert.equal(c.seniority, "VP");
    assert.equal(c.companySize, "1000+");
  }
});

test("searchContacts with empty params returns contacts", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({});
  assert.ok(result.contacts.length >= 5);
});

// ---------------------------------------------------------------------------
// LinkedIn enrichment (dry-run)
// ---------------------------------------------------------------------------

test("enrichFromLinkedIn generates contact from LinkedIn URL", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contact = await enrichFromLinkedIn({ linkedinUrl: "https://linkedin.com/in/jane-smith-42" });
  assert.ok(contact);
  assert.equal(contact.firstName, "Jane");
  assert.equal(contact.lastName, "Smith");
  assert.ok(contact.email.includes("jane"));
  assert.equal(contact.linkedinUrl, "https://linkedin.com/in/jane-smith-42");
  assert.ok(contact.id.startsWith("lr-"));
});

test("enrichFromLinkedIn handles URL with single name segment", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contact = await enrichFromLinkedIn({ linkedinUrl: "https://linkedin.com/in/a" });
  assert.ok(contact);
  assert.equal(contact.lastName, "Doe");
});

// ---------------------------------------------------------------------------
// Email enrichment (dry-run)
// ---------------------------------------------------------------------------

test("enrichFromEmail generates contact from email address", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contact = await enrichFromEmail({ email: "sarah.connor@skynet.com" });
  assert.ok(contact);
  assert.equal(contact.firstName, "Sarah");
  assert.equal(contact.lastName, "Connor");
  assert.equal(contact.email, "sarah.connor@skynet.com");
  assert.equal(contact.company, "Skynet");
  assert.equal(contact.companyDomain, "skynet.com");
});

test("enrichFromEmail handles simple email without dot separator", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contact = await enrichFromEmail({ email: "admin@techcorp.io" });
  assert.ok(contact);
  assert.equal(contact.firstName, "Admin");
  assert.equal(contact.company, "Techcorp");
});

// ---------------------------------------------------------------------------
// Store and retrieve contacts
// ---------------------------------------------------------------------------

test("saveSearchResults stores contacts in memory", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contacts: LeadRocksContact[] = [
    {
      id: "lr-test-1",
      firstName: "Alice",
      lastName: "Wonder",
      email: "alice@wonder.com",
      emailVerified: true,
      jobTitle: "CEO",
      company: "Wonder Inc",
      industry: "Technology",
      location: "NYC",
      seniority: "C-Level",
      companySize: "51-200",
    },
    {
      id: "lr-test-2",
      firstName: "Bob",
      lastName: "Builder",
      email: "bob@build.com",
      emailVerified: false,
      jobTitle: "CTO",
      company: "Build Co",
      industry: "Construction",
      location: "LA",
      seniority: "C-Level",
      companySize: "11-50",
    },
  ];

  await saveSearchResults(contacts, "tenant-1");
  const stored = await getStoredContacts();
  assert.ok(stored.length >= 2);
});

test("getStoredContacts returns all stored contacts", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchContacts({ jobTitle: "Developer" });
  const stored = await getStoredContacts();
  assert.ok(stored.length >= 5);
});

test("getStoredContacts respects limit parameter", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchContacts({ jobTitle: "Developer" });
  const stored = await getStoredContacts(undefined, 2);
  assert.equal(stored.length, 2);
});

// ---------------------------------------------------------------------------
// Find by email
// ---------------------------------------------------------------------------

test("findContactByEmail returns matching contact", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const enriched = await enrichFromEmail({ email: "findme@company.com" });
  assert.ok(enriched);

  const found = await findContactByEmail("findme@company.com");
  assert.ok(found);
  assert.equal(found.email, "findme@company.com");
});

test("findContactByEmail returns null for nonexistent email", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const found = await findContactByEmail("nonexistent@nowhere.com");
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// Search stats
// ---------------------------------------------------------------------------

test("getSearchStats computes stats from searches", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchContacts({ jobTitle: "Engineer", industry: "Technology" });
  await searchContacts({ jobTitle: "Designer", industry: "Marketing" });

  const stats = await getSearchStats();
  assert.equal(stats.totalSearches, 2);
  assert.ok(stats.totalContacts > 0);
  assert.ok(stats.creditsUsed > 0);
  assert.ok(Array.isArray(stats.topIndustries));
  assert.ok(Array.isArray(stats.topTitles));
});

test("getSearchStats filters by tenantId", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchAndIngestAsProspects({ jobTitle: "PM" }, "tenant-a");
  await searchAndIngestAsProspects({ jobTitle: "QA" }, "tenant-b");

  const statsA = await getSearchStats("tenant-a");
  assert.equal(statsA.totalSearches, 1);

  const statsAll = await getSearchStats();
  assert.equal(statsAll.totalSearches, 2);
});

// ---------------------------------------------------------------------------
// Search and ingest as prospects
// ---------------------------------------------------------------------------

test("searchAndIngestAsProspects returns correct counts", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchAndIngestAsProspects({ jobTitle: "Engineer" }, "tenant-x");
  assert.ok(result.contactsFound >= 5);
  assert.equal(result.prospectsCreated, result.contactsFound);
  assert.ok(result.creditsUsed > 0);
});

test("searchAndIngestAsProspects stores contacts for retrieval", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchAndIngestAsProspects({ company: "TestCo" }, "tenant-y");
  const stored = await getStoredContacts();
  assert.ok(stored.length >= 5);
});

// ---------------------------------------------------------------------------
// ProviderResult format
// ---------------------------------------------------------------------------

test("searchViaLeadRocks returns ProviderResult in dry-run mode", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchViaLeadRocks({ jobTitle: "CEO" });
  assert.equal(result.ok, true);
  assert.equal(result.provider, "LeadRocks");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.equal(typeof result.payload.total, "number");
  assert.equal(typeof result.payload.contactsReturned, "number");
  assert.equal(typeof result.payload.creditsUsed, "number");
  assert.equal(typeof result.payload.hasMore, "boolean");
});

test("searchViaLeadRocks detail includes contact count", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchViaLeadRocks({ company: "Google" });
  assert.ok(result.detail.includes("Found"));
  assert.ok(result.detail.includes("contacts"));
});

// ---------------------------------------------------------------------------
// Dry-run generates realistic data based on search params
// ---------------------------------------------------------------------------

test("dry-run contacts have valid email format", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ company: "Acme" });
  for (const c of result.contacts) {
    assert.ok(c.email.includes("@"));
    assert.ok(c.email.includes("."));
  }
});

test("dry-run contacts have IDs starting with lr-", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ jobTitle: "Sales" });
  for (const c of result.contacts) {
    assert.ok(c.id.startsWith("lr-"));
  }
});

test("dry-run contacts have all required fields", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ industry: "Finance" });
  for (const c of result.contacts) {
    assert.equal(typeof c.firstName, "string");
    assert.equal(typeof c.lastName, "string");
    assert.equal(typeof c.email, "string");
    assert.equal(typeof c.emailVerified, "boolean");
    assert.equal(typeof c.jobTitle, "string");
    assert.equal(typeof c.company, "string");
    assert.equal(typeof c.industry, "string");
    assert.equal(typeof c.location, "string");
    assert.equal(typeof c.seniority, "string");
    assert.equal(typeof c.companySize, "string");
  }
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("searchContacts with limit 0 returns empty array", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const result = await searchContacts({ limit: 0 });
  assert.equal(result.contacts.length, 0);
  assert.equal(result.creditsUsed, 0);
});

test("enrichFromLinkedIn with minimal URL still works", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contact = await enrichFromLinkedIn({ linkedinUrl: "https://linkedin.com/in/solo" });
  assert.ok(contact);
  assert.equal(contact.firstName, "Solo");
});

// ---------------------------------------------------------------------------
// Store and reset
// ---------------------------------------------------------------------------

test("resetLeadRocksStore clears all data", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchContacts({ jobTitle: "Manager" });
  const beforeReset = await getStoredContacts();
  assert.ok(beforeReset.length > 0);

  resetLeadRocksStore();

  const afterReset = await getStoredContacts();
  assert.equal(afterReset.length, 0);

  const stats = await getSearchStats();
  assert.equal(stats.totalSearches, 0);
  assert.equal(stats.totalContacts, 0);
});

test("multiple searches accumulate in stats", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await searchContacts({ jobTitle: "A" });
  await searchContacts({ jobTitle: "B" });
  await searchContacts({ jobTitle: "C" });

  const stats = await getSearchStats();
  assert.equal(stats.totalSearches, 3);
});

test("enriched contacts are findable by email", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  await enrichFromEmail({ email: "test@enriched.com" });
  const found = await findContactByEmail("test@enriched.com");
  assert.ok(found);
  assert.equal(found.email, "test@enriched.com");
});

test("linkedin enriched contacts are stored", async () => {
  clearLeadRocksEnv();
  resetLeadRocksStore();

  const contact = await enrichFromLinkedIn({ linkedinUrl: "https://linkedin.com/in/mike-ross" });
  assert.ok(contact);

  const stored = await getStoredContacts();
  assert.ok(stored.some((c) => c.id === contact.id));
});
