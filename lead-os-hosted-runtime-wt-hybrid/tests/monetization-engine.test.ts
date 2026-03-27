import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLeadValue,
  routeLeadToBuyer,
  auctionLead,
  matchAffiliateOffer,
  generateReferralLink,
  calculateReferralCommission,
  estimateServiceCost,
  estimateServicePrice,
  calculateArbitrageMargin,
  recordRevenue,
  getRevenueReport,
  getRevenueByNiche,
  _resetStores,
  type BuyerPreferences,
} from "../src/lib/monetization-engine.ts";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// calculateLeadValue
// ---------------------------------------------------------------------------

test("calculateLeadValue returns higher price for plumber niche at quality 100", () => {
  const result = calculateLeadValue({ id: "lead-1" }, "plumber", 100);
  assert.equal(result.niche, "plumber");
  assert.equal(result.qualityScore, 100);
  assert.equal(result.finalPrice, 150);
  assert.equal(result.currency, "USD");
});

test("calculateLeadValue returns base price for plumber niche at quality 0", () => {
  const result = calculateLeadValue({ id: "lead-2" }, "plumber", 0);
  assert.equal(result.finalPrice, 50);
});

test("calculateLeadValue applies exclusivity multiplier of 1.5", () => {
  const standard = calculateLeadValue({ id: "lead-3" }, "plumber", 50);
  const exclusive = calculateLeadValue({ id: "lead-4", exclusivity: true }, "plumber", 50);
  assert.equal(exclusive.exclusivityMultiplier, 1.5);
  assert.ok(exclusive.finalPrice > standard.finalPrice);
  assert.equal(exclusive.finalPrice, Math.round(standard.basePrice * 1.5 * 100) / 100);
});

test("calculateLeadValue uses lawyer price range ($100-$300)", () => {
  const low = calculateLeadValue({ id: "lead-5" }, "lawyer", 0);
  const high = calculateLeadValue({ id: "lead-6" }, "lawyer", 100);
  assert.equal(low.finalPrice, 100);
  assert.equal(high.finalPrice, 300);
});

test("calculateLeadValue clamps quality score to 0-100", () => {
  const negative = calculateLeadValue({ id: "lead-7" }, "plumber", -50);
  const over = calculateLeadValue({ id: "lead-8" }, "plumber", 200);
  assert.equal(negative.qualityScore, 0);
  assert.equal(over.qualityScore, 100);
});

test("calculateLeadValue uses default range for unknown niche", () => {
  const result = calculateLeadValue({ id: "lead-9" }, "mystery-niche", 50);
  assert.ok(result.finalPrice >= 30);
  assert.ok(result.finalPrice <= 100);
});

// ---------------------------------------------------------------------------
// routeLeadToBuyer
// ---------------------------------------------------------------------------

test("routeLeadToBuyer matches lead to best buyer by niche and location", () => {
  const buyers: BuyerPreferences[] = [
    { buyerId: "b1", niches: ["plumber"], locations: ["Austin"], maxBudgetPerLead: 100, dailyCapacity: 10, currentDailyCount: 0 },
    { buyerId: "b2", niches: ["lawyer"], locations: ["Austin"], maxBudgetPerLead: 200, dailyCapacity: 10, currentDailyCount: 0 },
  ];
  const match = routeLeadToBuyer({ id: "lead-1", niche: "plumber", location: "Austin" }, buyers);
  assert.ok(match !== null);
  assert.equal(match.buyerId, "b1");
  assert.ok(match.matchReasons.includes("niche-match"));
  assert.ok(match.matchReasons.includes("location-match"));
});

test("routeLeadToBuyer returns null when no buyer has matching niche", () => {
  const buyers: BuyerPreferences[] = [
    { buyerId: "b1", niches: ["dentist"], locations: ["Austin"], maxBudgetPerLead: 100, dailyCapacity: 10, currentDailyCount: 0 },
  ];
  const match = routeLeadToBuyer({ id: "lead-1", niche: "plumber" }, buyers);
  assert.equal(match, null);
});

test("routeLeadToBuyer skips buyer at capacity", () => {
  const buyers: BuyerPreferences[] = [
    { buyerId: "b1", niches: ["plumber"], locations: [], maxBudgetPerLead: 100, dailyCapacity: 5, currentDailyCount: 5 },
    { buyerId: "b2", niches: ["plumber"], locations: [], maxBudgetPerLead: 80, dailyCapacity: 10, currentDailyCount: 2 },
  ];
  const match = routeLeadToBuyer({ id: "lead-1", niche: "plumber" }, buyers);
  assert.ok(match !== null);
  assert.equal(match.buyerId, "b2");
});

// ---------------------------------------------------------------------------
// auctionLead
// ---------------------------------------------------------------------------

test("auctionLead selects highest bidder when reserve is met", () => {
  const result = auctionLead(
    { id: "lead-1", niche: "plumber", reservePrice: 50 },
    [
      { buyerId: "b1", bidAmount: 60 },
      { buyerId: "b2", bidAmount: 80 },
      { buyerId: "b3", bidAmount: 55 },
    ],
  );
  assert.equal(result.winnerId, "b2");
  assert.equal(result.winningBid, 80);
  assert.equal(result.reserveMet, true);
  assert.equal(result.bidCount, 3);
});

test("auctionLead returns no winner when reserve is not met", () => {
  const result = auctionLead(
    { id: "lead-1", niche: "plumber", reservePrice: 200 },
    [
      { buyerId: "b1", bidAmount: 60 },
      { buyerId: "b2", bidAmount: 80 },
    ],
  );
  assert.equal(result.winnerId, null);
  assert.equal(result.winningBid, 0);
  assert.equal(result.reserveMet, false);
});

test("auctionLead handles empty bids array", () => {
  const result = auctionLead(
    { id: "lead-1", niche: "plumber", reservePrice: 10 },
    [],
  );
  assert.equal(result.winnerId, null);
  assert.equal(result.bidCount, 0);
});

// ---------------------------------------------------------------------------
// matchAffiliateOffer
// ---------------------------------------------------------------------------

test("matchAffiliateOffer returns offers for plumber niche", () => {
  const offers = matchAffiliateOffer({ niche: "plumber" }, "plumber");
  assert.ok(offers.length > 0);
  assert.ok(offers[0].relevanceScore > 0);
  assert.equal(offers[0].niche, "plumber");
});

test("matchAffiliateOffer returns empty array for unknown niche", () => {
  const offers = matchAffiliateOffer({ niche: "underwater-welding" }, "underwater-welding");
  assert.equal(offers.length, 0);
});

// ---------------------------------------------------------------------------
// generateReferralLink & calculateReferralCommission
// ---------------------------------------------------------------------------

test("generateReferralLink creates unique tracked URL", () => {
  const link1 = generateReferralLink("tenant-1", "summer-promo");
  const link2 = generateReferralLink("tenant-1", "summer-promo");
  assert.ok(link1.url.includes("r/"));
  assert.ok(link1.url.includes("utm_campaign=summer-promo"));
  assert.notEqual(link1.referralId, link2.referralId);
});

test("calculateReferralCommission uses base tier at 10%", () => {
  const result = calculateReferralCommission("ref-1", 1000, 0);
  assert.equal(result.tier, "base");
  assert.equal(result.commissionRate, 0.10);
  assert.equal(result.commissionAmount, 100);
});

test("calculateReferralCommission uses volume tier at 15%", () => {
  const result = calculateReferralCommission("ref-2", 1000, 15000);
  assert.equal(result.tier, "volume");
  assert.equal(result.commissionRate, 0.15);
  assert.equal(result.commissionAmount, 150);
});

test("calculateReferralCommission uses VIP tier at 20%", () => {
  const result = calculateReferralCommission("ref-3", 1000, 60000);
  assert.equal(result.tier, "vip");
  assert.equal(result.commissionRate, 0.20);
  assert.equal(result.commissionAmount, 200);
});

// ---------------------------------------------------------------------------
// Service Arbitrage
// ---------------------------------------------------------------------------

test("estimateServiceCost returns niche-specific cost for known niche", () => {
  const cost = estimateServiceCost("plumber", "seo");
  assert.equal(cost, 200);
});

test("estimateServiceCost returns default cost for unknown niche", () => {
  const cost = estimateServiceCost("unknown-niche", "seo");
  assert.equal(cost, 250);
});

test("estimateServicePrice applies market multiplier", () => {
  const usPrice = estimateServicePrice("lawyer", "seo", "us");
  const ukPrice = estimateServicePrice("lawyer", "seo", "uk");
  assert.ok(usPrice > ukPrice);
});

test("calculateArbitrageMargin identifies viable margins (>= 30%)", () => {
  const result = calculateArbitrageMargin(200, 800);
  assert.equal(result.margin, 600);
  assert.equal(result.viable, true);
  assert.ok(result.marginPercent >= 30);
});

test("calculateArbitrageMargin identifies non-viable margins (< 30%)", () => {
  const result = calculateArbitrageMargin(800, 1000);
  assert.equal(result.margin, 200);
  assert.equal(result.viable, false);
  assert.ok(result.marginPercent < 30);
});

// ---------------------------------------------------------------------------
// Revenue Tracking
// ---------------------------------------------------------------------------

test("recordRevenue stores an event and getRevenueReport returns it", async () => {
  const now = new Date().toISOString().slice(0, 7);
  await recordRevenue("tenant-1", "leads", 100, { niche: "plumber" });
  await recordRevenue("tenant-1", "affiliate", 50, { niche: "plumber" });
  await recordRevenue("tenant-2", "leads", 200, { niche: "lawyer" });

  const report = getRevenueReport("tenant-1", now);
  assert.equal(report.tenantId, "tenant-1");
  assert.equal(report.totalRevenue, 150);
  assert.equal(report.eventCount, 2);
  assert.equal(report.breakdown.leads, 100);
  assert.equal(report.breakdown.affiliate, 50);
});

test("getRevenueByNiche aggregates revenue across tenants", async () => {
  const now = new Date().toISOString().slice(0, 7);
  await recordRevenue("tenant-1", "leads", 100, { niche: "plumber" });
  await recordRevenue("tenant-2", "leads", 200, { niche: "plumber" });
  await recordRevenue("tenant-3", "leads", 300, { niche: "lawyer" });

  const byNiche = getRevenueByNiche(now);
  assert.equal(byNiche.plumber, 300);
  assert.equal(byNiche.lawyer, 300);
});
