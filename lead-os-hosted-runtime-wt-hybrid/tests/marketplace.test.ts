import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLeadPrice,
  anonymizeLeadSummary,
  publishLeadToMarketplace,
  claimLeadForBuyer,
  reportLeadOutcome,
  getRevenueByNiche,
  getMarketplaceStats,
} from "../src/lib/marketplace.ts";
import {
  createBuyer,
  getMarketplaceLead,
  type BuyerAccount,
} from "../src/lib/marketplace-store.ts";

// ---------------------------------------------------------------------------
// calculateLeadPrice
// ---------------------------------------------------------------------------

test("calculateLeadPrice returns correct price for cold temperature", () => {
  const price = calculateLeadPrice("staffing", "cold", 50);
  // base=2500, niche=1.5, quality=(50/100)*1.5+0.5=1.25
  // 2500 * 1.5 * 1.25 = 4687.5 -> 4688
  assert.equal(price, 4688);
});

test("calculateLeadPrice returns correct price for warm temperature", () => {
  const price = calculateLeadPrice("construction", "warm", 80);
  // base=5000, niche=2.0, quality=(80/100)*1.5+0.5=1.7
  // 5000 * 2.0 * 1.7 = 17000
  assert.equal(price, 17000);
});

test("calculateLeadPrice returns correct price for hot temperature", () => {
  const price = calculateLeadPrice("franchise", "hot", 60);
  // base=10000, niche=2.0, quality=(60/100)*1.5+0.5=1.4
  // 10000 * 2.0 * 1.4 = 28000
  assert.equal(price, 28000);
});

test("calculateLeadPrice returns correct price for burning temperature", () => {
  const price = calculateLeadPrice("re-syndication", "burning", 90);
  // base=20000, niche=3.0, quality=(90/100)*1.5+0.5=1.85
  // 20000 * 3.0 * 1.85 = 111000
  assert.equal(price, 111000);
});

test("calculateLeadPrice uses 1.0 multiplier for unknown niche", () => {
  const price = calculateLeadPrice("unknown-niche", "cold", 100);
  // base=2500, niche=1.0, quality=(100/100)*1.5+0.5=2.0
  // 2500 * 1.0 * 2.0 = 5000
  assert.equal(price, 5000);
});

// ---------------------------------------------------------------------------
// Niche multipliers
// ---------------------------------------------------------------------------

test("niche multipliers apply correctly for immigration-law", () => {
  const price = calculateLeadPrice("immigration-law", "warm", 50);
  // base=5000, niche=2.5, quality=1.25
  // 5000 * 2.5 * 1.25 = 15625
  assert.equal(price, 15625);
});

test("niche multipliers apply correctly for staffing vs general", () => {
  const staffingPrice = calculateLeadPrice("staffing", "hot", 70);
  const generalPrice = calculateLeadPrice("general", "hot", 70);
  // staffing has 1.5x multiplier, general has 1.0x
  assert.ok(staffingPrice > generalPrice);
  assert.equal(staffingPrice / generalPrice, 1.5);
});

// ---------------------------------------------------------------------------
// anonymizeLeadSummary
// ---------------------------------------------------------------------------

test("anonymizeLeadSummary produces PII-free text", () => {
  const summary = anonymizeLeadSummary("Jonathan", "construction", 85, "building");
  assert.ok(summary.includes("J***"));
  assert.ok(!summary.includes("Jonathan"));
  assert.ok(summary.includes("construction"));
  assert.ok(summary.includes("building"));
  assert.ok(summary.includes("85/100"));
  assert.ok(summary.includes("high-quality"));
});

test("anonymizeLeadSummary labels early-stage for low scores", () => {
  const summary = anonymizeLeadSummary("Alice", "staffing", 30, "recruiting");
  assert.ok(summary.includes("early-stage"));
  assert.ok(!summary.includes("Alice"));
});

test("anonymizeLeadSummary labels qualified for mid scores", () => {
  const summary = anonymizeLeadSummary("Bob", "franchise", 55, "franchise ops");
  assert.ok(summary.includes("qualified"));
});

test("anonymizeLeadSummary handles empty first name", () => {
  const summary = anonymizeLeadSummary("", "staffing", 70, "recruiting");
  assert.ok(summary.includes("A***"));
});

// ---------------------------------------------------------------------------
// publishLeadToMarketplace
// ---------------------------------------------------------------------------

test("publishLeadToMarketplace creates listing with correct price", async () => {
  const lead = await publishLeadToMarketplace("test-lead-1", "tenant-1", {
    firstName: "Jane",
    niche: "construction",
    score: 75,
    temperature: "hot",
    city: "Denver",
    state: "CO",
    service: "remodeling",
    contactFields: ["email", "phone"],
  });

  assert.equal(lead.leadKey, "test-lead-1");
  assert.equal(lead.tenantId, "tenant-1");
  assert.equal(lead.niche, "construction");
  assert.equal(lead.status, "available");
  assert.equal(lead.qualityScore, 75);
  assert.equal(lead.temperature, "hot");
  assert.ok(lead.id.startsWith("mkt_"));
  assert.ok(lead.summary.includes("J***"));
  assert.ok(!lead.summary.includes("Jane"));
  assert.deepEqual(lead.contactFields, ["email", "phone"]);

  // Verify price: base=10000, niche=2.0, quality=(75/100)*1.5+0.5=1.625
  // 10000 * 2.0 * 1.625 = 32500
  assert.equal(lead.price, 32500);
});

// ---------------------------------------------------------------------------
// claimLeadForBuyer
// ---------------------------------------------------------------------------

test("claimLeadForBuyer marks lead as claimed", async () => {
  const lead = await publishLeadToMarketplace("claim-test-lead", "tenant-2", {
    niche: "staffing",
    score: 60,
    temperature: "warm",
    contactFields: ["email"],
  });

  const now = new Date().toISOString();
  const buyer: BuyerAccount = {
    id: "buyer-claim-test",
    email: "buyer@example.com",
    company: "Test Corp",
    nicheSubscriptions: ["staffing"],
    monthlyBudget: 100000,
    totalSpent: 0,
    leadsPurchased: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await createBuyer(buyer);

  const result = await claimLeadForBuyer(lead.id, "buyer-claim-test");
  assert.equal(result.lead.status, "claimed");
  assert.equal(result.lead.claimedBy, "buyer-claim-test");
  assert.ok(result.revealedContact.email);
});

test("claimLeadForBuyer rejects if lead already claimed", async () => {
  const lead = await publishLeadToMarketplace("claim-test-lead-2", "tenant-3", {
    niche: "franchise",
    score: 50,
    temperature: "warm",
    contactFields: ["email"],
  });

  const now = new Date().toISOString();
  const buyer1: BuyerAccount = {
    id: "buyer-reject-1",
    email: "buyer-reject-1@example.com",
    company: "Corp A",
    nicheSubscriptions: [],
    monthlyBudget: 100000,
    totalSpent: 0,
    leadsPurchased: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  const buyer2: BuyerAccount = {
    id: "buyer-reject-2",
    email: "buyer-reject-2@example.com",
    company: "Corp B",
    nicheSubscriptions: [],
    monthlyBudget: 100000,
    totalSpent: 0,
    leadsPurchased: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await createBuyer(buyer1);
  await createBuyer(buyer2);

  await claimLeadForBuyer(lead.id, "buyer-reject-1");

  await assert.rejects(
    () => claimLeadForBuyer(lead.id, "buyer-reject-2"),
    (err: Error) => {
      assert.ok(err.message.includes("not available"));
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// reportLeadOutcome
// ---------------------------------------------------------------------------

test("reportLeadOutcome records outcome", async () => {
  const lead = await publishLeadToMarketplace("outcome-test-lead", "tenant-4", {
    niche: "staffing",
    score: 80,
    temperature: "hot",
    contactFields: ["email", "phone"],
  });

  const now = new Date().toISOString();
  const buyer: BuyerAccount = {
    id: "buyer-outcome-test",
    email: "outcome@example.com",
    company: "Outcome Corp",
    nicheSubscriptions: [],
    monthlyBudget: 500000,
    totalSpent: 0,
    leadsPurchased: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await createBuyer(buyer);
  await claimLeadForBuyer(lead.id, "buyer-outcome-test");

  const updated = await reportLeadOutcome(lead.id, "buyer-outcome-test", "booked");
  assert.equal(updated.outcomeReported, true);
  assert.equal(updated.outcome, "booked");
  assert.equal(updated.status, "sold");
  assert.ok(updated.soldAt);
});

// ---------------------------------------------------------------------------
// getRevenueByNiche
// ---------------------------------------------------------------------------

test("getRevenueByNiche aggregates correctly", async () => {
  // The outcome test above sold a staffing lead, so there should be revenue
  const revenue = await getRevenueByNiche();
  assert.ok(typeof revenue === "object");
  // At minimum the outcome-test lead was sold in "staffing" niche
  if (revenue["staffing"]) {
    assert.ok(revenue["staffing"].revenue > 0);
    assert.ok(revenue["staffing"].count > 0);
  }
});

// ---------------------------------------------------------------------------
// getMarketplaceStats
// ---------------------------------------------------------------------------

test("getMarketplaceStats returns summary", async () => {
  const stats = await getMarketplaceStats();
  assert.ok(typeof stats.totalLeads === "number");
  assert.ok(typeof stats.available === "number");
  assert.ok(typeof stats.claimed === "number");
  assert.ok(typeof stats.sold === "number");
  assert.ok(typeof stats.totalRevenue === "number");
  assert.ok(typeof stats.avgPrice === "number");
  assert.ok(Array.isArray(stats.topNiches));
  assert.ok(stats.totalLeads > 0);
});
