import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveCloduraConfig,
  isCloduraDryRun,
  searchContacts,
  searchCompanies,
  getOrgChart,
  enrichContact,
  enrichCompany,
  findByTechnology,
  saveContacts,
  getStoredContacts,
  getSearchStats,
  searchAndIngestAsProspects,
  cloduraResult,
  searchViaClodura,
  resetCloduraStore,
} from "../src/lib/integrations/clodura-adapter.ts";
import type {
  CloduraContact,
  CloduraSearchParams,
} from "../src/lib/integrations/clodura-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearCloduraEnv() {
  delete process.env.CLODURA_API_KEY;
  delete process.env.CLODURA_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveCloduraConfig returns null when no API key", () => {
  clearCloduraEnv();
  const cfg = resolveCloduraConfig();
  assert.equal(cfg, null);
});

test("resolveCloduraConfig resolves from environment variables", () => {
  clearCloduraEnv();
  process.env.CLODURA_API_KEY = "clo-test-key";
  process.env.CLODURA_BASE_URL = "https://custom.clodura.ai/v2";

  const cfg = resolveCloduraConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "clo-test-key");
  assert.equal(cfg.baseUrl, "https://custom.clodura.ai/v2");

  clearCloduraEnv();
});

test("resolveCloduraConfig uses default baseUrl when env var absent", () => {
  clearCloduraEnv();
  process.env.CLODURA_API_KEY = "clo-test-key";

  const cfg = resolveCloduraConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://api.clodura.ai/v1");

  clearCloduraEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isCloduraDryRun returns true when no API key", () => {
  clearCloduraEnv();
  assert.equal(isCloduraDryRun(), true);
});

test("isCloduraDryRun returns false when API key present", () => {
  clearCloduraEnv();
  process.env.CLODURA_API_KEY = "clo-test-key";
  assert.equal(isCloduraDryRun(), false);
  clearCloduraEnv();
});

// ---------------------------------------------------------------------------
// searchContacts (dry-run)
// ---------------------------------------------------------------------------

test("searchContacts returns contacts in dry-run mode", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ industry: "Technology", limit: 5 });

  assert.ok(result.contacts.length > 0);
  assert.ok(result.contacts.length <= 5);
  assert.equal(typeof result.total, "number");
  assert.equal(typeof result.creditsUsed, "number");
  assert.equal(typeof result.hasMore, "boolean");
});

test("searchContacts applies companyName filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ companyName: "TestCorp" });

  for (const c of result.contacts) {
    assert.equal(c.company, "TestCorp");
  }
});

test("searchContacts applies jobTitle filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ jobTitle: "CTO" });

  for (const c of result.contacts) {
    assert.equal(c.jobTitle, "CTO");
  }
});

test("searchContacts applies department filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ department: "Engineering" });

  for (const c of result.contacts) {
    assert.equal(c.department, "Engineering");
  }
});

test("searchContacts applies seniority filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ seniority: "C-Level" });

  for (const c of result.contacts) {
    assert.equal(c.seniority, "C-Level");
  }
});

test("searchContacts applies technology filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ technology: "Kubernetes" });

  for (const c of result.contacts) {
    assert.ok(c.technologies);
    assert.ok(c.technologies.includes("Kubernetes"));
  }
});

test("searchContacts respects limit parameter", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ limit: 3 });

  assert.ok(result.contacts.length <= 3);
});

test("searchContacts generates contacts with valid structure", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ limit: 1 });
  const contact = result.contacts[0];

  assert.ok(contact.id.startsWith("clo-"));
  assert.ok(contact.firstName.length > 0);
  assert.ok(contact.lastName.length > 0);
  assert.ok(contact.email.includes("@"));
  assert.equal(typeof contact.emailVerified, "boolean");
  assert.ok(contact.jobTitle.length > 0);
  assert.ok(contact.department.length > 0);
  assert.ok(contact.seniority.length > 0);
  assert.ok(contact.company.length > 0);
  assert.ok(contact.companyDomain.length > 0);
  assert.ok(contact.companySize.length > 0);
  assert.ok(contact.industry.length > 0);
  assert.ok(contact.location.length > 0);
});

test("searchContacts stores contacts in memory after search", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchContacts({ limit: 5 });
  const stored = await getStoredContacts();

  assert.ok(stored.length > 0);
});

// ---------------------------------------------------------------------------
// searchCompanies (dry-run)
// ---------------------------------------------------------------------------

test("searchCompanies returns companies in dry-run mode", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await searchCompanies({ industry: "Technology" });

  assert.ok(companies.length > 0);
  for (const co of companies) {
    assert.ok(co.id.startsWith("clo-co-"));
    assert.ok(co.name.length > 0);
    assert.ok(co.domain.length > 0);
    assert.ok(co.technologies.length > 0);
    assert.equal(typeof co.employeeCount, "number");
  }
});

test("searchCompanies applies industry filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await searchCompanies({ industry: "Healthcare" });

  for (const co of companies) {
    assert.equal(co.industry, "Healthcare");
  }
});

test("searchCompanies applies technology filter in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await searchCompanies({ technology: "React" });

  for (const co of companies) {
    assert.ok(co.technologies.includes("React"));
  }
});

test("searchCompanies respects limit parameter", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await searchCompanies({ limit: 2 });

  assert.ok(companies.length <= 2);
});

// ---------------------------------------------------------------------------
// getOrgChart (dry-run)
// ---------------------------------------------------------------------------

test("getOrgChart returns departments with contacts in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const orgChart = await getOrgChart("TestCorp");

  assert.equal(orgChart.company, "TestCorp");
  assert.ok(orgChart.departments.length >= 3);
  assert.ok(orgChart.departments.length <= 5);

  for (const dept of orgChart.departments) {
    assert.ok(dept.name.length > 0);
    assert.ok(dept.contacts.length >= 2);
    assert.ok(dept.contacts.length <= 4);
    for (const c of dept.contacts) {
      assert.equal(c.company, "TestCorp");
      assert.equal(c.department, dept.name);
    }
  }
});

test("getOrgChart stores generated contacts in memory", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const orgChart = await getOrgChart("OrgTestCo");
  const totalContacts = orgChart.departments.reduce((sum, d) => sum + d.contacts.length, 0);

  const stored = await getStoredContacts();
  assert.ok(stored.length >= totalContacts);
});

// ---------------------------------------------------------------------------
// enrichContact (dry-run)
// ---------------------------------------------------------------------------

test("enrichContact returns contact from email in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const contact = await enrichContact("jane.smith@acmecorp.com");

  assert.ok(contact);
  assert.equal(contact.email, "jane.smith@acmecorp.com");
  assert.equal(contact.firstName, "Jane");
  assert.equal(contact.lastName, "Smith");
  assert.equal(contact.company, "Acmecorp");
  assert.equal(contact.emailVerified, true);
});

test("enrichContact handles email without dot separator", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const contact = await enrichContact("admin@testco.io");

  assert.ok(contact);
  assert.equal(contact.email, "admin@testco.io");
  assert.equal(contact.firstName, "Admin");
});

// ---------------------------------------------------------------------------
// enrichCompany (dry-run)
// ---------------------------------------------------------------------------

test("enrichCompany returns company from domain in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const company = await enrichCompany("acmecorp.com");

  assert.ok(company);
  assert.equal(company.domain, "acmecorp.com");
  assert.equal(company.name, "Acmecorp");
  assert.equal(typeof company.employeeCount, "number");
  assert.ok(company.technologies.length > 0);
  assert.ok(company.founded);
});

test("enrichCompany handles .io domains", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const company = await enrichCompany("stripe.io");

  assert.ok(company);
  assert.equal(company.domain, "stripe.io");
  assert.equal(company.name, "Stripe");
});

// ---------------------------------------------------------------------------
// findByTechnology (dry-run)
// ---------------------------------------------------------------------------

test("findByTechnology returns companies using specific tech", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await findByTechnology("Salesforce", 5);

  assert.ok(companies.length > 0);
  assert.ok(companies.length <= 5);
  for (const co of companies) {
    assert.ok(co.technologies.includes("Salesforce"));
  }
});

test("findByTechnology defaults to reasonable limit", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await findByTechnology("AWS");

  assert.ok(companies.length > 0);
});

// ---------------------------------------------------------------------------
// saveContacts & getStoredContacts
// ---------------------------------------------------------------------------

test("saveContacts persists contacts to in-memory store", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const contacts: CloduraContact[] = [
    {
      id: "clo-test-1",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      emailVerified: true,
      jobTitle: "Engineer",
      department: "Engineering",
      seniority: "Senior",
      company: "TestCo",
      companyDomain: "testco.com",
      companySize: "51-200",
      industry: "Technology",
      location: "Austin, TX",
    },
  ];

  await saveContacts(contacts, "tenant-1");
  const stored = await getStoredContacts("tenant-1");

  assert.ok(stored.length >= 1);
});

test("getStoredContacts respects limit", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const contacts: CloduraContact[] = [];
  for (let i = 0; i < 5; i++) {
    contacts.push({
      id: `clo-limit-${i}`,
      firstName: "Limit",
      lastName: `Test${i}`,
      email: `limit${i}@example.com`,
      emailVerified: true,
      jobTitle: "Engineer",
      department: "Engineering",
      seniority: "Mid-Level",
      company: "LimitCo",
      companyDomain: "limitco.com",
      companySize: "11-50",
      industry: "Technology",
      location: "Seattle, WA",
    });
  }

  await saveContacts(contacts);
  const stored = await getStoredContacts(undefined, 3);

  assert.equal(stored.length, 3);
});

test("getStoredContacts returns empty array when store is empty", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const stored = await getStoredContacts();
  assert.equal(stored.length, 0);
});

// ---------------------------------------------------------------------------
// getSearchStats
// ---------------------------------------------------------------------------

test("getSearchStats returns zero stats on empty store", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const stats = await getSearchStats();

  assert.equal(stats.totalSearches, 0);
  assert.equal(stats.totalContacts, 0);
  assert.equal(stats.creditsUsed, 0);
  assert.ok(Array.isArray(stats.topIndustries));
  assert.ok(Array.isArray(stats.topTechnologies));
});

test("getSearchStats accumulates after searches", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchContacts({ industry: "Technology", limit: 3 });
  await searchContacts({ industry: "Healthcare", limit: 2 });

  const stats = await getSearchStats();

  assert.equal(stats.totalSearches, 2);
  assert.ok(stats.totalContacts > 0);
  assert.ok(stats.creditsUsed > 0);
  assert.ok(stats.topIndustries.length > 0);
});

test("getSearchStats filters by tenantId", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchAndIngestAsProspects({ industry: "Technology", limit: 3 }, "tenant-a");
  await searchAndIngestAsProspects({ industry: "Finance", limit: 2 }, "tenant-b");

  const statsA = await getSearchStats("tenant-a");
  const statsB = await getSearchStats("tenant-b");

  assert.equal(statsA.totalSearches, 1);
  assert.equal(statsB.totalSearches, 1);
});

test("getSearchStats includes technology counts", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchContacts({ technology: "React", limit: 5 });

  const stats = await getSearchStats();

  assert.ok(stats.topTechnologies.length > 0);
  const reactEntry = stats.topTechnologies.find((t) => t.tech === "React");
  assert.ok(reactEntry);
  assert.ok(reactEntry.count > 0);
});

// ---------------------------------------------------------------------------
// searchAndIngestAsProspects
// ---------------------------------------------------------------------------

test("searchAndIngestAsProspects searches and stores contacts", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchAndIngestAsProspects(
    { industry: "Technology", limit: 5 },
    "ingest-tenant",
  );

  assert.ok(result.contactsFound > 0);
  assert.equal(result.prospectsCreated, result.contactsFound);
  assert.ok(result.creditsUsed > 0);

  const stored = await getStoredContacts();
  assert.ok(stored.length >= result.contactsFound);
});

test("searchAndIngestAsProspects assigns tenantId to search", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchAndIngestAsProspects({ limit: 3 }, "my-tenant");

  const stats = await getSearchStats("my-tenant");
  assert.equal(stats.totalSearches, 1);
});

// ---------------------------------------------------------------------------
// cloduraResult (ProviderResult)
// ---------------------------------------------------------------------------

test("cloduraResult returns dry-run mode when no API key", () => {
  clearCloduraEnv();

  const result = cloduraResult("search", "Found 5 contacts");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Clodura");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Found 5 contacts");
});

test("cloduraResult returns live mode when API key present", () => {
  clearCloduraEnv();
  process.env.CLODURA_API_KEY = "clo-test-key";

  const result = cloduraResult("search", "Found 5 contacts");

  assert.equal(result.mode, "live");
  assert.equal(result.provider, "Clodura");

  clearCloduraEnv();
});

// ---------------------------------------------------------------------------
// searchViaClodura (Provider bridge)
// ---------------------------------------------------------------------------

test("searchViaClodura returns ProviderResult in dry-run", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchViaClodura({ industry: "Technology", limit: 3 });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Clodura");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("dry-run"));
  assert.ok(result.payload);
  assert.equal(typeof result.payload.total, "number");
  assert.equal(typeof result.payload.contactsReturned, "number");
  assert.equal(typeof result.payload.creditsUsed, "number");
  assert.equal(typeof result.payload.hasMore, "boolean");
});

// ---------------------------------------------------------------------------
// resetCloduraStore
// ---------------------------------------------------------------------------

test("resetCloduraStore clears all stores", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchContacts({ limit: 5 });
  await searchCompanies({ limit: 3 });

  const contactsBefore = await getStoredContacts();
  assert.ok(contactsBefore.length > 0);

  resetCloduraStore();

  const contactsAfter = await getStoredContacts();
  assert.equal(contactsAfter.length, 0);

  const stats = await getSearchStats();
  assert.equal(stats.totalSearches, 0);
  assert.equal(stats.totalContacts, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("searchContacts with empty params returns contacts", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({});

  assert.ok(result.contacts.length > 0);
  assert.ok(result.total > 0);
});

test("searchContacts with offset shifts generated contacts", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const result = await searchContacts({ limit: 3, offset: 10 });

  assert.ok(result.contacts.length > 0);
  assert.ok(result.contacts.length <= 3);
});

test("searchCompanies with empty params returns companies", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const companies = await searchCompanies({});

  assert.ok(companies.length > 0);
});

test("multiple sequential searches accumulate correctly", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  await searchContacts({ industry: "Technology", limit: 3 });
  await searchContacts({ industry: "Healthcare", limit: 3 });
  await searchContacts({ industry: "Finance", limit: 3 });

  const stats = await getSearchStats();
  assert.equal(stats.totalSearches, 3);
  assert.ok(stats.totalContacts > 0);
});

test("contact ids are unique across searches", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const r1 = await searchContacts({ limit: 5 });
  const r2 = await searchContacts({ limit: 5 });

  const allIds = [...r1.contacts, ...r2.contacts].map((c) => c.id);
  const uniqueIds = new Set(allIds);
  assert.equal(uniqueIds.size, allIds.length);
});

test("company ids are unique across searches", async () => {
  clearCloduraEnv();
  resetCloduraStore();

  const c1 = await searchCompanies({ limit: 5 });
  const c2 = await searchCompanies({ limit: 5 });

  const allIds = [...c1, ...c2].map((c) => c.id);
  const uniqueIds = new Set(allIds);
  assert.equal(uniqueIds.size, allIds.length);
});
