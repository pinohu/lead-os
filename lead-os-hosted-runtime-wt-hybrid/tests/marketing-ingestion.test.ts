import test from "node:test";
import assert from "node:assert/strict";
import {
  extractMarketingArtifact,
  extractHeadline,
  extractOffer,
  extractUrgencySignals,
  extractTrustSignals,
  extractCtaLabels,
  extractContactInfo,
  extractAudienceSignals,
  extractGeoContext,
} from "../src/lib/marketing-ingestion.ts";
import { convertArtifactToIngestion } from "../src/lib/marketing-artifact-to-ingestion.ts";
import {
  addArtifact,
  listArtifacts,
  removeArtifact,
  resetArtifactStore,
} from "../src/lib/marketing-artifact-store.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLUMBER_FLYER = `
EMERGENCY PLUMBING SERVICES
Fast. Reliable. Affordable.

24/7 Emergency Response — We're Here When You Need Us Most

SPRING SPECIAL: 15% OFF All Drain Cleaning Services
Valid through March 31, 2026

Why Choose ABC Plumbing?
★ 25+ Years of Experience
★ Licensed, Bonded & Insured
★ BBB A+ Rated
★ Over 10,000 Happy Customers
★ Same-Day Service Available
★ 100% Satisfaction Guarantee

Our Services:
• Emergency Repairs
• Drain Cleaning
• Water Heater Installation
• Pipe Replacement
• Sewer Line Repair
• Bathroom Remodeling

FREE ESTIMATES on all major projects!

CALL NOW: (555) 123-4567
Visit: www.abcplumbing.com
Email: info@abcplumbing.com

123 Main Street, Suite 4
Denver, CO 80202

Follow us @ABCPlumbing

Don't wait — LIMITED TIME OFFER!
Schedule your appointment TODAY
`;

const SPARSE_TEXT = "Hello World";

// ---------------------------------------------------------------------------
// extractHeadline
// ---------------------------------------------------------------------------

test("extractHeadline extracts EMERGENCY PLUMBING SERVICES as headline", () => {
  const { headline } = extractHeadline(PLUMBER_FLYER);
  assert.ok(headline !== undefined, "expected a headline");
  assert.ok(
    headline.toUpperCase().includes("EMERGENCY") || headline.toUpperCase().includes("PLUMBING"),
    `unexpected headline: ${headline}`,
  );
});

test("extractHeadline extracts a subheadline from the second heading-like line", () => {
  const { headline, subheadline } = extractHeadline(PLUMBER_FLYER);
  assert.ok(headline !== undefined, "expected headline");
  assert.ok(subheadline !== undefined, "expected subheadline");
  assert.notEqual(headline, subheadline);
});

test("extractHeadline returns undefined headline for empty text", () => {
  const { headline } = extractHeadline("   ");
  assert.equal(headline, undefined);
});

// ---------------------------------------------------------------------------
// extractOffer
// ---------------------------------------------------------------------------

test("extractOffer finds 15% OFF pricing", () => {
  const offer = extractOffer(PLUMBER_FLYER);
  const pricingStr = offer.pricing.join(" ").toLowerCase();
  assert.ok(
    pricingStr.includes("15") || pricingStr.includes("off") || pricingStr.includes("free"),
    `expected pricing patterns, got: ${offer.pricing.join(", ")}`,
  );
});

test("extractOffer finds discounts", () => {
  const offer = extractOffer(PLUMBER_FLYER);
  assert.ok(offer.discounts.length > 0, `expected discounts, got: ${offer.discounts.join(", ")}`);
});

test("extractOffer finds 100% Satisfaction Guarantee", () => {
  const offer = extractOffer(PLUMBER_FLYER);
  const guaranteeStr = offer.guarantees.join(" ").toLowerCase();
  assert.ok(
    guaranteeStr.includes("satisfaction") || guaranteeStr.includes("guarantee"),
    `expected satisfaction guarantee, got: ${offer.guarantees.join(", ")}`,
  );
});

test("extractOffer finds FREE ESTIMATES bonus", () => {
  const offer = extractOffer(PLUMBER_FLYER);
  const bonusStr = offer.bonuses.join(" ").toLowerCase();
  assert.ok(
    bonusStr.includes("free") || bonusStr.includes("estimate"),
    `expected free estimates bonus, got: ${offer.bonuses.join(", ")}`,
  );
});

test("extractOffer returns empty arrays for text with no offers", () => {
  const offer = extractOffer("Hello World. We are a company.");
  assert.equal(offer.pricing.length, 0);
  assert.equal(offer.guarantees.length, 0);
});

// ---------------------------------------------------------------------------
// extractUrgencySignals
// ---------------------------------------------------------------------------

test("extractUrgencySignals finds LIMITED TIME", () => {
  const signals = extractUrgencySignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("limited") || joined.includes("time"),
    `expected limited time signal, got: ${signals.join(" | ")}`,
  );
});

test("extractUrgencySignals finds Don't wait", () => {
  const signals = extractUrgencySignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("wait") || joined.includes("don"),
    `expected don't wait signal, got: ${signals.join(" | ")}`,
  );
});

test("extractUrgencySignals finds TODAY", () => {
  const signals = extractUrgencySignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(joined.includes("today") || joined.includes("schedule"), `expected today signal, got: ${signals.join(" | ")}`);
});

test("extractUrgencySignals finds deadline date (March 31, 2026)", () => {
  const signals = extractUrgencySignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("march") || joined.includes("valid") || joined.includes("expires"),
    `expected date/deadline signal, got: ${signals.join(" | ")}`,
  );
});

test("extractUrgencySignals returns empty array for text with no urgency", () => {
  const signals = extractUrgencySignals("We sell widgets. Contact us at your convenience.");
  assert.equal(signals.length, 0);
});

// ---------------------------------------------------------------------------
// extractTrustSignals
// ---------------------------------------------------------------------------

test("extractTrustSignals finds 25+ Years of Experience", () => {
  const signals = extractTrustSignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("25") || joined.includes("year"),
    `expected years experience, got: ${signals.join(" | ")}`,
  );
});

test("extractTrustSignals finds Licensed, Bonded & Insured", () => {
  const signals = extractTrustSignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("licensed") || joined.includes("bonded") || joined.includes("insured"),
    `expected licensed/bonded/insured, got: ${signals.join(" | ")}`,
  );
});

test("extractTrustSignals finds BBB A+ Rated", () => {
  const signals = extractTrustSignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("bbb"),
    `expected BBB signal, got: ${signals.join(" | ")}`,
  );
});

test("extractTrustSignals finds 10,000 Happy Customers", () => {
  const signals = extractTrustSignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("10") || joined.includes("customer"),
    `expected 10,000 customers signal, got: ${signals.join(" | ")}`,
  );
});

test("extractTrustSignals finds 100% Satisfaction Guarantee", () => {
  const signals = extractTrustSignals(PLUMBER_FLYER);
  const joined = signals.join(" ").toLowerCase();
  assert.ok(
    joined.includes("satisfaction") || joined.includes("100"),
    `expected satisfaction guarantee trust signal, got: ${signals.join(" | ")}`,
  );
});

// ---------------------------------------------------------------------------
// extractCtaLabels
// ---------------------------------------------------------------------------

test("extractCtaLabels finds CALL NOW", () => {
  const labels = extractCtaLabels(PLUMBER_FLYER);
  const joined = labels.join(" ").toLowerCase();
  assert.ok(
    joined.includes("call"),
    `expected call now, got: ${labels.join(" | ")}`,
  );
});

test("extractCtaLabels finds Schedule", () => {
  const labels = extractCtaLabels(PLUMBER_FLYER);
  const joined = labels.join(" ").toLowerCase();
  assert.ok(
    joined.includes("schedule") || joined.includes("book") || joined.includes("appointment"),
    `expected schedule/book, got: ${labels.join(" | ")}`,
  );
});

test("extractCtaLabels finds Schedule", () => {
  const labels = extractCtaLabels(PLUMBER_FLYER);
  const joined = labels.join(" ").toLowerCase();
  assert.ok(
    joined.includes("schedule"),
    `expected schedule, got: ${labels.join(" | ")}`,
  );
});

test("extractCtaLabels returns empty array for text with no CTAs", () => {
  const labels = extractCtaLabels("We make widgets. They are good widgets.");
  assert.equal(labels.length, 0);
});

// ---------------------------------------------------------------------------
// extractContactInfo
// ---------------------------------------------------------------------------

test("extractContactInfo finds phone (555) 123-4567", () => {
  const info = extractContactInfo(PLUMBER_FLYER);
  assert.ok(info.phones.length > 0, "expected phones");
  const joined = info.phones.join(" ");
  assert.ok(
    joined.includes("555") || joined.includes("123"),
    `expected (555) 123-4567, got: ${info.phones.join(", ")}`,
  );
});

test("extractContactInfo finds email info@abcplumbing.com", () => {
  const info = extractContactInfo(PLUMBER_FLYER);
  assert.ok(info.emails.length > 0, "expected emails");
  assert.ok(
    info.emails.some((e) => e.includes("abcplumbing")),
    `expected info@abcplumbing.com, got: ${info.emails.join(", ")}`,
  );
});

test("extractContactInfo finds website www.abcplumbing.com", () => {
  const info = extractContactInfo(PLUMBER_FLYER);
  assert.ok(info.websites.length > 0, "expected websites");
  assert.ok(
    info.websites.some((w) => w.includes("abcplumbing")),
    `expected abcplumbing website, got: ${info.websites.join(", ")}`,
  );
});

test("extractContactInfo finds address 123 Main Street", () => {
  const info = extractContactInfo(PLUMBER_FLYER);
  assert.ok(info.addresses.length > 0, "expected addresses");
  assert.ok(
    info.addresses.some((a) => a.includes("123") || a.includes("Main")),
    `expected 123 Main Street, got: ${info.addresses.join(", ")}`,
  );
});

test("extractContactInfo finds social @ABCPlumbing", () => {
  const info = extractContactInfo(PLUMBER_FLYER);
  assert.ok(info.socialHandles.length > 0, "expected social handles");
  assert.ok(
    info.socialHandles.some((h) => h.includes("ABCPlumbing")),
    `expected @ABCPlumbing, got: ${info.socialHandles.join(", ")}`,
  );
});

test("extractContactInfo returns empty arrays for text with no contact info", () => {
  const info = extractContactInfo("Hello World. We sell widgets.");
  assert.equal(info.phones.length, 0);
  assert.equal(info.emails.length, 0);
  assert.equal(info.websites.length, 0);
  assert.equal(info.socialHandles.length, 0);
});

// ---------------------------------------------------------------------------
// extractAudienceSignals
// ---------------------------------------------------------------------------

test("extractAudienceSignals detects plumbing industry", () => {
  const audience = extractAudienceSignals(PLUMBER_FLYER);
  assert.equal(audience.targetIndustry, "plumbing");
});

test("extractAudienceSignals returns defined keywords for known industry", () => {
  const audience = extractAudienceSignals(PLUMBER_FLYER);
  assert.ok(audience.keywords.length > 0, "expected keywords for plumbing");
});

test("extractAudienceSignals detects pain points", () => {
  const audience = extractAudienceSignals(PLUMBER_FLYER);
  assert.ok(audience.painPoints.length > 0, "expected pain points");
});

test("extractAudienceSignals returns undefined industry for unrecognized text", () => {
  const audience = extractAudienceSignals("We build rocket ships and space modules for interplanetary travel.");
  assert.equal(audience.targetIndustry, undefined);
});

// ---------------------------------------------------------------------------
// extractGeoContext
// ---------------------------------------------------------------------------

test("extractGeoContext finds Denver city from flyer", () => {
  const geo = extractGeoContext(PLUMBER_FLYER);
  assert.ok(geo !== undefined, "expected geo context");
  assert.equal(geo.city, "Denver");
});

test("extractGeoContext finds CO state from flyer", () => {
  const geo = extractGeoContext(PLUMBER_FLYER);
  assert.ok(geo !== undefined, "expected geo context");
  assert.equal(geo.state, "CO");
});

test("extractGeoContext finds zip code 80202 from flyer", () => {
  const geo = extractGeoContext(PLUMBER_FLYER);
  assert.ok(geo !== undefined, "expected geo context");
  assert.equal(geo.zipCode, "80202");
});

test("extractGeoContext uses geoHint when no geo in text", () => {
  const geo = extractGeoContext("No location info here.", "Austin, TX");
  assert.ok(geo !== undefined, "expected geo context from hint");
  assert.equal(geo.city, "Austin");
});

test("extractGeoContext returns undefined for text with no geo info", () => {
  const geo = extractGeoContext("We sell widgets for all your needs.");
  assert.equal(geo, undefined);
});

// ---------------------------------------------------------------------------
// extractMarketingArtifact (full pipeline)
// ---------------------------------------------------------------------------

test("extractMarketingArtifact produces valid artifact with high confidence for rich flyer", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "flyer",
  });

  assert.ok(typeof artifact.id === "string" && artifact.id.startsWith("artifact_"));
  assert.equal(artifact.tenantId, "tenant-1");
  assert.equal(artifact.sourceType, "flyer");
  assert.ok(artifact.headline !== undefined, "expected headline");
  assert.ok(artifact.contactInfo.phones.length > 0, "expected phones");
  assert.ok(artifact.trustSignals.length > 0, "expected trust signals");
  assert.ok(artifact.urgencySignals.length > 0, "expected urgency signals");
  assert.ok(artifact.confidence >= 50, `expected confidence >= 50, got ${artifact.confidence}`);
  assert.ok(artifact.confidence <= 100);
});

test("extractMarketingArtifact produces low confidence artifact for sparse text", () => {
  const artifact = extractMarketingArtifact({
    text: SPARSE_TEXT,
    tenantId: "tenant-1",
    sourceType: "other",
  });

  assert.ok(artifact.confidence < 50, `expected low confidence for sparse text, got ${artifact.confidence}`);
});

test("extractMarketingArtifact sets geoContext from geoHint when not in text", () => {
  const artifact = extractMarketingArtifact({
    text: "Call us for great service! (800) 555-0000",
    tenantId: "tenant-1",
    sourceType: "flyer",
    geoHint: "Phoenix, AZ",
  });

  assert.ok(artifact.geoContext !== undefined, "expected geoContext from hint");
  assert.equal(artifact.geoContext?.city, "Phoenix");
});

test("extractMarketingArtifact sets createdAt to valid ISO string", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "mailer",
  });

  const date = new Date(artifact.createdAt);
  assert.ok(!isNaN(date.getTime()), `expected valid ISO date, got: ${artifact.createdAt}`);
});

test("extractMarketingArtifact assigns offer when pricing found", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "flyer",
  });

  assert.ok(artifact.offer !== undefined, "expected offer to be defined");
});

// ---------------------------------------------------------------------------
// convertArtifactToIngestion
// ---------------------------------------------------------------------------

test("convertArtifactToIngestion maps to valid DesignIngestionResult", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "flyer",
  });
  const ingestion = convertArtifactToIngestion(artifact);

  assert.ok(typeof ingestion.sourceUrl === "string" && ingestion.sourceUrl.includes("artifact://"));
  assert.ok(Array.isArray(ingestion.layout.sections) && ingestion.layout.sections.length > 0);
  assert.ok(ingestion.layout.sectionCount > 0);
  assert.ok(Array.isArray(ingestion.copy.headlines));
  assert.ok(ingestion.copy.headlines.length > 0 || artifact.headline === undefined);
  assert.ok(Array.isArray(ingestion.copy.socialProofClaims));
  assert.ok(typeof ingestion.confidence === "number");
});

test("convertArtifactToIngestion maps trust signals to socialProofClaims", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "flyer",
  });
  const ingestion = convertArtifactToIngestion(artifact);

  assert.ok(
    ingestion.copy.socialProofClaims.length > 0,
    "expected trust signals to map to socialProofClaims",
  );
});

test("convertArtifactToIngestion maps CTA labels to copy.ctaLabels", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "flyer",
  });
  const ingestion = convertArtifactToIngestion(artifact);

  assert.deepEqual(ingestion.copy.ctaLabels, artifact.ctaLabels);
});

test("convertArtifactToIngestion sets hasPricing when pricing found", () => {
  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "tenant-1",
    sourceType: "flyer",
  });
  const ingestion = convertArtifactToIngestion(artifact);

  if (artifact.offer && artifact.offer.pricing.length > 0) {
    assert.equal(ingestion.funnel.hasPricing, true);
  }
});

test("convertArtifactToIngestion sparse artifact produces valid ingestion", () => {
  const artifact = extractMarketingArtifact({
    text: SPARSE_TEXT,
    tenantId: "tenant-1",
    sourceType: "other",
  });
  const ingestion = convertArtifactToIngestion(artifact);

  assert.ok(typeof ingestion.sourceUrl === "string");
  assert.ok(Array.isArray(ingestion.layout.sections));
  assert.ok(typeof ingestion.confidence === "number");
});

// ---------------------------------------------------------------------------
// Store tests
// ---------------------------------------------------------------------------

test("addArtifact stores and returns artifact", async () => {
  resetArtifactStore();

  const artifact = extractMarketingArtifact({
    text: PLUMBER_FLYER,
    tenantId: "test-tenant",
    sourceType: "flyer",
  });

  const result = await addArtifact(artifact);
  assert.deepEqual(result, artifact);
});

test("listArtifacts returns artifacts for tenant", async () => {
  resetArtifactStore();

  const a1 = extractMarketingArtifact({ text: PLUMBER_FLYER, tenantId: "tenant-a", sourceType: "flyer" });
  const a2 = extractMarketingArtifact({ text: SPARSE_TEXT, tenantId: "tenant-a", sourceType: "ad" });
  const a3 = extractMarketingArtifact({ text: "Other tenant content", tenantId: "tenant-b", sourceType: "mailer" });

  await addArtifact(a1);
  await addArtifact(a2);
  await addArtifact(a3);

  const tenantAResults = await listArtifacts("tenant-a");
  assert.equal(tenantAResults.length, 2);

  const tenantBResults = await listArtifacts("tenant-b");
  assert.equal(tenantBResults.length, 1);
  assert.equal(tenantBResults[0].id, a3.id);
});

test("removeArtifact deletes the artifact from the store", async () => {
  resetArtifactStore();

  const artifact = extractMarketingArtifact({ text: PLUMBER_FLYER, tenantId: "tenant-c", sourceType: "flyer" });
  await addArtifact(artifact);

  const before = await listArtifacts("tenant-c");
  assert.equal(before.length, 1);

  await removeArtifact(artifact.id);

  const after = await listArtifacts("tenant-c");
  assert.equal(after.length, 0);
});

test("resetArtifactStore clears all artifacts", async () => {
  const a1 = extractMarketingArtifact({ text: PLUMBER_FLYER, tenantId: "tenant-x", sourceType: "flyer" });
  await addArtifact(a1);

  resetArtifactStore();

  const results = await listArtifacts("tenant-x");
  assert.equal(results.length, 0);
});

test("listArtifacts returns empty array for unknown tenant", async () => {
  resetArtifactStore();
  const results = await listArtifacts("no-such-tenant");
  assert.equal(results.length, 0);
});
