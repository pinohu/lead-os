import test from "node:test";
import assert from "node:assert/strict";
import {
  generateOffer,
  applyPriceAnchoring,
  generatePriceTiers,
  calculateBundlePrice,
  generateRiskReversal,
  generateUrgencyTrigger,
  generateScarcityElement,
  rotateOffers,
  getOfferTemplates,
  getOfferTemplate,
  ALL_NICHES,
  type Niche,
  type Offer,
} from "../src/lib/offer-engine.ts";

// ---------------------------------------------------------------------------
// generateOffer
// ---------------------------------------------------------------------------

test("generateOffer returns a complete offer with all required fields", () => {
  const offer = generateOffer("construction", "General Contracting");
  assert.ok(offer.headline.length > 0);
  assert.ok(offer.subheadline.length > 0);
  assert.ok(offer.priceAnchor > offer.offerPrice);
  assert.ok(offer.savings > 0);
  assert.ok(offer.savingsPercent > 0 && offer.savingsPercent < 100);
  assert.ok(offer.guarantee.headline.length > 0);
  assert.ok(offer.guarantee.body.length > 0);
  assert.ok(offer.guarantee.durationDays > 0);
  assert.ok(offer.bonuses.length >= 3);
  assert.ok(offer.urgencyTrigger.type === "countdown");
  assert.ok(offer.scarcityElement.type === "capacity");
  assert.ok(offer.socialProof.reviewCount > 0);
  assert.ok(offer.socialProof.rating >= 4.0 && offer.socialProof.rating <= 5.0);
  assert.ok(offer.socialProof.testimonialSnippet.length > 0);
});

test("generateOffer respects brandName context", () => {
  const offer = generateOffer("legal", "Case Evaluation", { brandName: "AcmeLaw" });
  assert.ok(offer.subheadline.includes("AcmeLaw"));
});

test("generateOffer respects urgencyType and scarcityType context", () => {
  const offer = generateOffer("healthcare", "Patient Acquisition", {
    urgencyType: "limited-spots",
    scarcityType: "waitlist",
  });
  assert.equal(offer.urgencyTrigger.type, "limited-spots");
  assert.equal(offer.scarcityElement.type, "waitlist");
});

test("generateOffer uses averageProjectValue when provided", () => {
  const offer = generateOffer("technology", "SaaS Lead Gen", {
    averageProjectValue: 10000,
  });
  assert.equal(offer.offerPrice, 10000);
});

test("generateOffer works for every niche", () => {
  for (const niche of ALL_NICHES) {
    const offer = generateOffer(niche, "Test Service");
    assert.ok(offer.headline.length > 0, `${niche}: headline should exist`);
    assert.ok(offer.offerPrice > 0, `${niche}: offerPrice should be positive`);
    assert.ok(offer.bonuses.length >= 1, `${niche}: should have bonuses`);
  }
});

// ---------------------------------------------------------------------------
// applyPriceAnchoring
// ---------------------------------------------------------------------------

test("applyPriceAnchoring with default multiplier creates ~60% savings", () => {
  const result = applyPriceAnchoring(1000);
  assert.equal(result.offerPrice, 1000);
  assert.ok(result.anchorPrice > result.offerPrice);
  assert.equal(result.savings, result.anchorPrice - result.offerPrice);
  assert.equal(result.savingsPercent, Math.round((result.savings / result.anchorPrice) * 100));
});

test("applyPriceAnchoring with custom multiplier scales anchor correctly", () => {
  const result = applyPriceAnchoring(2000, 3.0);
  assert.equal(result.offerPrice, 2000);
  assert.equal(result.anchorPrice, 6000);
  assert.equal(result.savings, 4000);
});

test("applyPriceAnchoring rounds anchor to nearest 100", () => {
  const result = applyPriceAnchoring(333, 2.0);
  assert.equal(result.anchorPrice % 100, 0);
});

// ---------------------------------------------------------------------------
// generatePriceTiers
// ---------------------------------------------------------------------------

test("generatePriceTiers returns exactly 3 tiers", () => {
  const tiers = generatePriceTiers("Lead Generation", "home-services");
  assert.equal(tiers.length, 3);
});

test("generatePriceTiers has correct tier names and ordering", () => {
  const tiers = generatePriceTiers("Lead Generation", "construction");
  assert.equal(tiers[0].name, "starter");
  assert.equal(tiers[1].name, "growth");
  assert.equal(tiers[2].name, "scale");
  assert.ok(tiers[0].price < tiers[1].price);
  assert.ok(tiers[1].price < tiers[2].price);
});

test("generatePriceTiers marks growth tier as recommended (decoy effect)", () => {
  const tiers = generatePriceTiers("Consultation", "legal");
  const recommended = tiers.filter((t) => t.isRecommended);
  assert.equal(recommended.length, 1);
  assert.equal(recommended[0].name, "growth");
});

test("generatePriceTiers scale tier has more features than starter", () => {
  const tiers = generatePriceTiers("Service", "franchise");
  assert.ok(tiers[2].features.length > tiers[0].features.length);
});

// ---------------------------------------------------------------------------
// calculateBundlePrice
// ---------------------------------------------------------------------------

test("calculateBundlePrice with tiered strategy gives 15% for 2 items", () => {
  const bundle = calculateBundlePrice(
    [{ name: "A", price: 1000 }, { name: "B", price: 1000 }],
    "tiered",
  );
  assert.equal(bundle.originalTotal, 2000);
  assert.equal(bundle.savings, 300);
  assert.equal(bundle.bundlePrice, 1700);
  assert.equal(bundle.savingsPercent, 15);
});

test("calculateBundlePrice with tiered strategy gives 25% for 3 items", () => {
  const bundle = calculateBundlePrice(
    [{ name: "A", price: 1000 }, { name: "B", price: 1000 }, { name: "C", price: 1000 }],
    "tiered",
  );
  assert.equal(bundle.savings, 750);
  assert.equal(bundle.savingsPercent, 25);
});

test("calculateBundlePrice with tiered strategy gives 30% for 4+ items", () => {
  const bundle = calculateBundlePrice(
    [{ name: "A", price: 500 }, { name: "B", price: 500 }, { name: "C", price: 500 }, { name: "D", price: 500 }],
    "tiered",
  );
  assert.equal(bundle.savingsPercent, 30);
});

test("calculateBundlePrice with percentage strategy gives 20%", () => {
  const bundle = calculateBundlePrice(
    [{ name: "A", price: 1000 }, { name: "B", price: 500 }],
    "percentage",
  );
  assert.equal(bundle.savings, 300);
  assert.equal(bundle.bundlePrice, 1200);
});

test("calculateBundlePrice with fixed strategy gives 15%", () => {
  const bundle = calculateBundlePrice(
    [{ name: "A", price: 2000 }],
    "fixed",
  );
  assert.equal(bundle.savings, 300);
  assert.equal(bundle.bundlePrice, 1700);
});

test("calculateBundlePrice includes item names", () => {
  const bundle = calculateBundlePrice(
    [{ name: "SEO", price: 1000 }, { name: "PPC", price: 2000 }],
  );
  assert.deepEqual(bundle.items, ["SEO", "PPC"]);
  assert.ok(bundle.name.includes("2"));
});

// ---------------------------------------------------------------------------
// generateRiskReversal
// ---------------------------------------------------------------------------

test("generateRiskReversal returns correct guarantee type per niche", () => {
  const construction = generateRiskReversal("construction");
  assert.ok(construction.headline.includes("90"));
  assert.ok(construction.headline.includes("Results"));

  const homeServices = generateRiskReversal("home-services");
  assert.ok(homeServices.headline.includes("30"));
  assert.ok(homeServices.headline.includes("Money-Back"));

  const legal = generateRiskReversal("legal");
  assert.ok(legal.headline.includes("30"));
  assert.ok(legal.headline.includes("Satisfaction"));
});

test("generateRiskReversal respects offerType parameter", () => {
  const subscription = generateRiskReversal("technology", "subscription");
  assert.ok(subscription.body.includes("Cancel") || subscription.body.includes("KPI"));

  const project = generateRiskReversal("construction", "project");
  assert.ok(project.body.includes("project") || project.body.includes("deliverables"));
});

// ---------------------------------------------------------------------------
// Urgency & Scarcity
// ---------------------------------------------------------------------------

test("generateUrgencyTrigger countdown returns deadline", () => {
  const trigger = generateUrgencyTrigger("countdown", { deadlineDays: 3 });
  assert.equal(trigger.type, "countdown");
  assert.ok(trigger.deadline !== null);
  assert.ok(trigger.label.includes("3 days"));
  assert.equal(trigger.spotsRemaining, null);
});

test("generateUrgencyTrigger limited-spots returns remaining count", () => {
  const trigger = generateUrgencyTrigger("limited-spots", { spotsTotal: 10, spotsTaken: 7 });
  assert.equal(trigger.type, "limited-spots");
  assert.equal(trigger.spotsRemaining, 3);
  assert.ok(trigger.label.includes("3"));
});

test("generateUrgencyTrigger seasonal includes event name", () => {
  const trigger = generateUrgencyTrigger("seasonal", { eventName: "Black Friday" });
  assert.ok(trigger.label.includes("Black Friday"));
});

test("generateScarcityElement capacity returns remaining", () => {
  const element = generateScarcityElement("capacity", { remaining: 3 });
  assert.equal(element.type, "capacity");
  assert.equal(element.remaining, 3);
  assert.ok(element.label.includes("3"));
});

test("generateScarcityElement waitlist returns position", () => {
  const element = generateScarcityElement("waitlist", { waitlistPosition: 25 });
  assert.equal(element.waitlistPosition, 25);
  assert.ok(element.label.includes("25"));
});

test("generateScarcityElement exclusivity returns label", () => {
  const element = generateScarcityElement("exclusivity", { exclusivityLabel: "VIP only" });
  assert.equal(element.label, "VIP only");
});

// ---------------------------------------------------------------------------
// Offer Rotation
// ---------------------------------------------------------------------------

test("rotateOffers cycles through 0, 1, 2", () => {
  const id = "test-rotation-tenant";
  const first = rotateOffers(id);
  const second = rotateOffers(id);
  const third = rotateOffers(id);
  const fourth = rotateOffers(id);
  assert.equal(first, 1);
  assert.equal(second, 2);
  assert.equal(third, 0);
  assert.equal(fourth, 1);
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

test("getOfferTemplates returns all 10 niches", () => {
  const templates = getOfferTemplates();
  assert.equal(templates.length, 10);
});

test("getOfferTemplates filters by niche", () => {
  const templates = getOfferTemplates("legal");
  assert.equal(templates.length, 1);
  assert.equal(templates[0].niche, "legal");
});

test("getOfferTemplate returns null for unknown niche", () => {
  const template = getOfferTemplate("nonexistent" as Niche);
  assert.equal(template, null);
});

test("every niche template has required fields", () => {
  for (const niche of ALL_NICHES) {
    const template = getOfferTemplate(niche);
    assert.ok(template !== null, `${niche}: template should exist`);
    assert.ok(template.services.length >= 2, `${niche}: should have at least 2 services`);
    assert.ok(template.defaultPriceRange.min > 0, `${niche}: min price should be positive`);
    assert.ok(template.defaultPriceRange.max > template.defaultPriceRange.min, `${niche}: max > min`);
    assert.ok(template.language.painPoints.length >= 3, `${niche}: should have 3+ pain points`);
    assert.ok(template.language.desiredOutcomes.length >= 3, `${niche}: should have 3+ outcomes`);
    assert.ok(template.language.socialProofTemplate.includes("{{count}}"), `${niche}: social proof needs {{count}}`);
  }
});
