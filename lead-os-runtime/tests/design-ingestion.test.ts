import test from "node:test";
import assert from "node:assert/strict";
import {
  ingestDesignFromScrape,
  extractColorsFromMarkdown,
  extractTypographyFromMarkdown,
  classifySections,
  extractCopy,
  detectFunnelSignals,
} from "../src/lib/design-ingestion.ts";
import {
  convertIngestionToDesignSpec,
  mergeWithNicheDefaults,
} from "../src/lib/design-ingestion-to-spec.ts";
import type { ScrapeResult } from "../src/lib/integrations/web-scraper.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RICH_MARKDOWN = `
# Transform Your Plumbing Business with Automated Lead Generation

Grow your business, increase revenue, and eliminate slow seasons with our proven system.

[Get Started Today](https://example.com/start) [Book a Free Call](https://example.com/book)

## Why 500+ Plumbing Companies Trust Us

- Automate your lead capture
- Improve response times to under 5 minutes
- Streamline your follow-up process
- Increase conversions by 40%
- Save 10 hours per week on admin work
- Boost revenue without more marketing spend

Trusted by over 500 plumbing businesses nationwide. Rated 4.9 stars across 200 reviews.

## Features & Benefits

Simplify your entire lead management workflow in one platform.

- Smart lead scoring
- Automated SMS and email follow-up
- CRM integration
- Real-time notifications

## What Our Clients Say

"This transformed how we run our plumbing business" - John D., Denver CO

> 47 plumbing businesses signed up in the last 30 days

## Pricing Plans

\`\`\`css
.hero { color: #2563eb; background: #f8fafc; font-size: 18px; }
.cta { background-color: #1d4ed8; font-family: 'Inter', sans-serif; }
body { font-family: 'Roboto', Arial, sans-serif; font-size: 16px; }
border-radius: 8px;
\`\`\`

Choose the plan that works for your business:
- Starter: $97/month
- Professional: $197/month
- Enterprise: $397/month

[Start Free Trial](https://example.com/trial)

## Frequently Asked Questions

### How long does setup take?

### Do I need technical skills?

### What happens after the free trial?

### Can I cancel at any time?

## Book Your Free Strategy Call

Get in touch — fill out the form and we'll reach out within 24 hours.

email: your@email.com
phone: your phone number
company: your business name

We use Calendly to schedule calls: https://calendly.com/example

Copyright 2024. Privacy Policy. Terms of Service.
`;

const SPARSE_MARKDOWN = `
# Hello

Welcome to our site.
`;

function buildScrapeResult(markdown: string, url = "https://example.com"): ScrapeResult {
  return {
    url,
    title: "Test Page",
    markdown,
    metadata: {
      description: "A test competitor page",
      keywords: ["plumbing", "leads"],
      language: "en",
    },
    links: [],
    scrapedAt: new Date().toISOString(),
    mode: "dry-run",
  };
}

// ---------------------------------------------------------------------------
// extractColorsFromMarkdown
// ---------------------------------------------------------------------------

test("extractColorsFromMarkdown returns hex colors", () => {
  const colors = extractColorsFromMarkdown(RICH_MARKDOWN);
  assert.ok(colors.includes("#2563eb"));
  assert.ok(colors.includes("#f8fafc"));
  assert.ok(colors.includes("#1d4ed8"));
});

test("extractColorsFromMarkdown returns empty array for no colors", () => {
  const colors = extractColorsFromMarkdown("# Hello\n\nNo colors here.");
  assert.equal(colors.length, 0);
});

test("extractColorsFromMarkdown detects rgb values", () => {
  const colors = extractColorsFromMarkdown("color: rgb(100, 200, 50); background: #fff;");
  assert.ok(colors.some((c) => c.startsWith("rgb(")));
  assert.ok(colors.some((c) => c.startsWith("#")));
});

test("extractColorsFromMarkdown normalizes hex to lowercase", () => {
  const colors = extractColorsFromMarkdown("color: #FF5733;");
  assert.ok(colors.includes("#ff5733"));
});

// ---------------------------------------------------------------------------
// extractTypographyFromMarkdown
// ---------------------------------------------------------------------------

test("extractTypographyFromMarkdown extracts font families", () => {
  const { fonts } = extractTypographyFromMarkdown(RICH_MARKDOWN);
  assert.ok(fonts.some((f) => f.toLowerCase().includes("inter") || f.toLowerCase().includes("roboto")));
});

test("extractTypographyFromMarkdown extracts font sizes", () => {
  const { sizes } = extractTypographyFromMarkdown(RICH_MARKDOWN);
  assert.ok(sizes.includes("18px") || sizes.includes("16px"));
});

test("extractTypographyFromMarkdown returns empty arrays for plain markdown", () => {
  const { fonts, sizes } = extractTypographyFromMarkdown("# Just a heading\n\nSome text.");
  assert.equal(fonts.length, 0);
  assert.equal(sizes.length, 0);
});

// ---------------------------------------------------------------------------
// classifySections
// ---------------------------------------------------------------------------

test("classifySections identifies hero section from first h1", () => {
  const sections = classifySections(RICH_MARKDOWN);
  const hero = sections.find((s) => s.type === "hero");
  assert.ok(hero !== undefined, "expected a hero section");
  assert.equal(hero.position, 0);
});

test("classifySections identifies pricing section", () => {
  const sections = classifySections(RICH_MARKDOWN);
  const pricing = sections.find((s) => s.type === "pricing");
  assert.ok(pricing !== undefined, "expected a pricing section");
});

test("classifySections identifies faq section", () => {
  const sections = classifySections(RICH_MARKDOWN);
  const faq = sections.find((s) => s.type === "faq");
  assert.ok(faq !== undefined, "expected a faq section");
});

test("classifySections identifies testimonials section", () => {
  const sections = classifySections(RICH_MARKDOWN);
  const testimonials = sections.find((s) => s.type === "testimonials");
  assert.ok(testimonials !== undefined, "expected a testimonials section");
});

test("classifySections identifies features section", () => {
  const sections = classifySections(RICH_MARKDOWN);
  const features = sections.find((s) => s.type === "features");
  assert.ok(features !== undefined, "expected a features section");
});

test("classifySections detects estimated columns from list items", () => {
  const md = "## Features\n\n- Item 1\n- Item 2\n- Item 3\n- Item 4\n- Item 5\n- Item 6\n";
  const sections = classifySections(md);
  const features = sections[0];
  assert.ok(features.estimatedColumns >= 2, `expected columns >= 2, got ${features.estimatedColumns}`);
});

test("classifySections returns single content section for markdown without headings", () => {
  const sections = classifySections("Just some plain text with no headings.");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].type, "content");
});

test("classifySections captures CTA labels from links", () => {
  const md = "# Hero\n\n[Get Started Today](https://example.com/start) [Book a Call](https://example.com/book)";
  const sections = classifySections(md);
  const hero = sections[0];
  assert.ok(hero.ctaLabels.length > 0, "expected CTA labels in hero");
});

// ---------------------------------------------------------------------------
// extractCopy
// ---------------------------------------------------------------------------

test("extractCopy pulls h1 headlines", () => {
  const copy = extractCopy(RICH_MARKDOWN);
  assert.ok(copy.headlines.length > 0);
  assert.ok(copy.headlines[0].includes("Transform") || copy.headlines[0].includes("Plumbing"));
});

test("extractCopy pulls h2 subheadlines", () => {
  const copy = extractCopy(RICH_MARKDOWN);
  assert.ok(copy.subheadlines.length > 0);
});

test("extractCopy pulls CTA labels from markdown links", () => {
  const copy = extractCopy(RICH_MARKDOWN);
  assert.ok(copy.ctaLabels.length > 0);
  const labels = copy.ctaLabels.map((l) => l.toLowerCase());
  assert.ok(
    labels.some((l) => l.includes("get started") || l.includes("book") || l.includes("start")),
    `expected CTA labels, got: ${copy.ctaLabels.join(", ")}`,
  );
});

test("extractCopy extracts social proof claims", () => {
  const copy = extractCopy(RICH_MARKDOWN);
  assert.ok(copy.socialProofClaims.length > 0, "expected social proof claims");
  const joined = copy.socialProofClaims.join(" ").toLowerCase();
  assert.ok(joined.includes("500") || joined.includes("4.9") || joined.includes("trusted"));
});

test("extractCopy captures FAQ questions from h3 ending in ?", () => {
  const copy = extractCopy(RICH_MARKDOWN);
  assert.ok(copy.faqQuestions.length > 0, "expected FAQ questions");
  assert.ok(copy.faqQuestions[0].includes("?"));
});

test("extractCopy extracts value propositions", () => {
  const copy = extractCopy(RICH_MARKDOWN);
  assert.ok(copy.valuePropositions.length > 0, "expected value propositions");
});

// ---------------------------------------------------------------------------
// detectFunnelSignals
// ---------------------------------------------------------------------------

test("detectFunnelSignals detects pricing", () => {
  const signals = detectFunnelSignals(RICH_MARKDOWN, {});
  assert.equal(signals.hasPricing, true);
});

test("detectFunnelSignals detects testimonials", () => {
  const signals = detectFunnelSignals(RICH_MARKDOWN, {});
  assert.equal(signals.hasTestimonials, true);
});

test("detectFunnelSignals detects FAQ", () => {
  const signals = detectFunnelSignals(RICH_MARKDOWN, {});
  assert.equal(signals.hasFaq, true);
});

test("detectFunnelSignals detects booking via Calendly URL", () => {
  const signals = detectFunnelSignals(RICH_MARKDOWN, {});
  assert.equal(signals.hasBooking, true);
});

test("detectFunnelSignals detects form fields", () => {
  const signals = detectFunnelSignals(RICH_MARKDOWN, {});
  assert.ok(signals.formFields.length > 0);
  assert.ok(signals.formFields.includes("email") || signals.formFields.includes("phone"));
});

test("detectFunnelSignals detects chat widget from metadata", () => {
  const signals = detectFunnelSignals("Some page content", { scripts: ["intercom.com/widget.js"] });
  assert.equal(signals.hasChat, true);
});

test("detectFunnelSignals sets detectedFamily to direct-conversion when booking present", () => {
  const signals = detectFunnelSignals(RICH_MARKDOWN, {});
  assert.ok(
    signals.detectedFamily === "direct-conversion" || signals.detectedFamily === "nurture",
    `unexpected family: ${signals.detectedFamily}`,
  );
});

test("detectFunnelSignals detects quiz funnel family", () => {
  const quizMd = "# Take Our Free Assessment\n\nAnswer 5 questions to get your score.";
  const signals = detectFunnelSignals(quizMd, {});
  assert.equal(signals.detectedFamily, "quiz");
});

test("detectFunnelSignals detects lead-magnet funnel family", () => {
  const magnetMd = "# Download Your Free Guide\n\nGet our free ebook on plumbing business growth.";
  const signals = detectFunnelSignals(magnetMd, {});
  assert.equal(signals.detectedFamily, "lead-magnet");
});

// ---------------------------------------------------------------------------
// ingestDesignFromScrape
// ---------------------------------------------------------------------------

test("ingestDesignFromScrape returns DesignIngestionResult with correct sourceUrl", () => {
  const result = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  assert.equal(result.sourceUrl, "https://example.com");
});

test("ingestDesignFromScrape extracts colors into tokens", () => {
  const result = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  assert.ok(result.tokens.colors.all.length > 0, "expected color tokens");
  assert.ok(result.tokens.colors.primary !== undefined);
});

test("ingestDesignFromScrape populates layout sections", () => {
  const result = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  assert.ok(result.layout.sectionCount > 0);
  assert.equal(result.layout.sections.length, result.layout.sectionCount);
});

test("ingestDesignFromScrape sets hasAboveFoldCta for hero with CTAs", () => {
  const result = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  assert.equal(result.layout.hasAboveFoldCta, true);
});

test("ingestDesignFromScrape populates copy inventory", () => {
  const result = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  assert.ok(result.copy.headlines.length > 0);
  assert.ok(result.copy.ctaLabels.length > 0);
});

test("ingestDesignFromScrape populates funnel signals", () => {
  const result = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  assert.ok(result.funnel.detectedFamily.length > 0);
  assert.equal(result.funnel.hasPricing, true);
});

test("ingestDesignFromScrape has higher confidence for rich page than sparse page", () => {
  const rich = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const sparse = ingestDesignFromScrape(buildScrapeResult(SPARSE_MARKDOWN));
  assert.ok(rich.confidence > sparse.confidence, `rich=${rich.confidence}, sparse=${sparse.confidence}`);
});

test("ingestDesignFromScrape confidence is in range 0-100", () => {
  const rich = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const sparse = ingestDesignFromScrape(buildScrapeResult(SPARSE_MARKDOWN));
  assert.ok(rich.confidence >= 0 && rich.confidence <= 100);
  assert.ok(sparse.confidence >= 0 && sparse.confidence <= 100);
});

test("ingestDesignFromScrape includes scrapedAt from scrape result", () => {
  const scrape = buildScrapeResult(RICH_MARKDOWN);
  const result = ingestDesignFromScrape(scrape);
  assert.equal(result.scrapedAt, scrape.scrapedAt);
});

// ---------------------------------------------------------------------------
// convertIngestionToDesignSpec
// ---------------------------------------------------------------------------

test("convertIngestionToDesignSpec returns partial with niche name from headlines", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  assert.ok(partial.niche !== undefined);
  assert.ok(typeof partial.niche?.name === "string");
  assert.ok(partial.niche.name.length > 0);
});

test("convertIngestionToDesignSpec maps social proof to trust builders", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  assert.ok(partial.psychology !== undefined);
  assert.ok(Array.isArray(partial.psychology?.trustBuilders));
  assert.ok((partial.psychology?.trustBuilders?.length ?? 0) > 0, "expected trust builders from social proof");
});

test("convertIngestionToDesignSpec maps FAQ questions to micro-commitments", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  assert.ok(Array.isArray(partial.psychology?.microCommitments));
  assert.ok((partial.psychology?.microCommitments?.length ?? 0) > 0, "expected micro-commitments from FAQ");
});

test("convertIngestionToDesignSpec sets funnel type from detectedFamily", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  assert.ok(Array.isArray(partial.funnels));
  assert.ok((partial.funnels?.length ?? 0) > 0);
});

test("convertIngestionToDesignSpec uses nicheConfig name when provided", async () => {
  const { generateNicheConfig } = await import("../src/lib/niche-generator.ts");
  const ingestion = ingestDesignFromScrape(buildScrapeResult(SPARSE_MARKDOWN));
  const nicheConfig = generateNicheConfig({ name: "HVAC" });
  const partial = convertIngestionToDesignSpec(ingestion, nicheConfig);
  assert.equal(partial.niche?.name, "HVAC");
});

test("convertIngestionToDesignSpec maps form fields to leadMagnets", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  if ((ingestion.funnel.formFields.length ?? 0) > 0) {
    assert.ok(partial.offers?.leadMagnets !== undefined);
  }
});

test("convertIngestionToDesignSpec maps value propositions to deliverables", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  assert.ok(Array.isArray(partial.offers?.core?.deliverables));
});

// ---------------------------------------------------------------------------
// mergeWithNicheDefaults
// ---------------------------------------------------------------------------

test("mergeWithNicheDefaults returns a fully valid DesignSpec", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  const spec = mergeWithNicheDefaults(partial, "plumbing");

  assert.ok(typeof spec.niche.name === "string" && spec.niche.name.length > 0);
  assert.ok(Array.isArray(spec.niche.icp.painPoints) && spec.niche.icp.painPoints.length > 0);
  assert.ok(Array.isArray(spec.funnels) && spec.funnels.length > 0);
  assert.ok(Array.isArray(spec.psychology.trustBuilders));
  assert.ok(Array.isArray(spec.psychology.objectionHandlers));
  assert.ok(typeof spec.offers.core.price === "number");
  assert.ok(typeof spec.kpis.targetConversionRate === "number");
});

test("mergeWithNicheDefaults fills missing pain points from niche template", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(SPARSE_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  const spec = mergeWithNicheDefaults(partial, "dental");

  assert.ok(spec.niche.icp.painPoints.length > 0, "expected pain points from niche defaults");
});

test("mergeWithNicheDefaults preserves extracted trust builders when present", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(RICH_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  const spec = mergeWithNicheDefaults(partial, "plumbing");

  assert.ok(spec.psychology.trustBuilders.length > 0);
});

test("mergeWithNicheDefaults always returns spec with automation config", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(SPARSE_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  const spec = mergeWithNicheDefaults(partial, "cleaning");

  assert.ok(spec.automation !== undefined);
});

test("mergeWithNicheDefaults always returns spec with ingress config", () => {
  const ingestion = ingestDesignFromScrape(buildScrapeResult(SPARSE_MARKDOWN));
  const partial = convertIngestionToDesignSpec(ingestion);
  const spec = mergeWithNicheDefaults(partial, "roofing");

  assert.ok(spec.ingress !== undefined);
  assert.ok(Array.isArray(spec.ingress.channels) && spec.ingress.channels.length > 0);
  assert.ok(typeof spec.ingress.defaultFunnel === "string");
});
