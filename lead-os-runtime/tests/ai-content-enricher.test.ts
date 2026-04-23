import test from "node:test";
import assert from "node:assert/strict";
import { withEnv } from "./test-helpers.ts";
import {
  enrichSections,
  enrichHeroSection,
  enrichAboutSection,
  enrichFaqSection,
  enrichLandingPage,
  parseJsonFromLLM,
  type EnrichmentRequest,
} from "../src/lib/ai-content-enricher.ts";

// ---------------------------------------------------------------------------
// parseJsonFromLLM
// ---------------------------------------------------------------------------

test("parseJsonFromLLM parses valid JSON", () => {
  const result = parseJsonFromLLM('{"headline": "Test"}');
  assert.deepEqual(result, { headline: "Test" });
});

test("parseJsonFromLLM extracts JSON from markdown code block", () => {
  const input = '```json\n{"headline": "Test"}\n```';
  const result = parseJsonFromLLM(input);
  assert.deepEqual(result, { headline: "Test" });
});

test("parseJsonFromLLM extracts JSON from untagged code block", () => {
  const input = '```\n{"key": "value"}\n```';
  const result = parseJsonFromLLM(input);
  assert.deepEqual(result, { key: "value" });
});

test("parseJsonFromLLM returns null for invalid input", () => {
  assert.equal(parseJsonFromLLM("not json at all"), null);
});

test("parseJsonFromLLM returns null for malformed JSON in code block", () => {
  const input = '```json\n{broken json}\n```';
  assert.equal(parseJsonFromLLM(input), null);
});

// ---------------------------------------------------------------------------
// enrichHeroSection — AI disabled
// ---------------------------------------------------------------------------

test("enrichHeroSection returns original content when AI is disabled", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const content = { headline: "Old Headline", subheadline: "Old Sub" };
    const { enrichment, tokens } = await enrichHeroSection(content, {
      businessName: "Test Biz",
      niche: "plumbing",
      city: "Austin",
    });

    assert.equal(enrichment.changed, false);
    assert.equal(enrichment.confidence, 1.0);
    assert.deepEqual(enrichment.enriched, content);
    assert.equal(tokens.input, 0);
    assert.equal(tokens.output, 0);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// enrichAboutSection — skips long descriptions
// ---------------------------------------------------------------------------

test("enrichAboutSection skips descriptions >= 200 chars", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const longDescription = "A".repeat(200);
    const content = { description: longDescription };
    const { enrichment } = await enrichAboutSection(content, {
      businessName: "Test Biz",
      niche: "plumbing",
      city: "Austin",
    });

    assert.equal(enrichment.changed, false);
    assert.equal(enrichment.confidence, 1.0);
    assert.deepEqual(enrichment.enriched, content);
  } finally {
    restore();
  }
});

test("enrichAboutSection returns unchanged when AI is disabled and description is short", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const content = { description: "Short desc" };
    const { enrichment } = await enrichAboutSection(content, {
      businessName: "Test Biz",
      niche: "plumbing",
      city: "Austin",
    });

    assert.equal(enrichment.changed, false);
    assert.equal(enrichment.confidence, 1.0);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// enrichFaqSection — only enriches short answers
// ---------------------------------------------------------------------------

test("enrichFaqSection returns unchanged when AI is disabled", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const content = {
      items: [
        { question: "What do you do?", answer: "We help." },
        { question: "Where?", answer: "Austin area." },
      ],
    };
    const { enrichment } = await enrichFaqSection(content, {
      businessName: "Test Biz",
      niche: "plumbing",
      city: "Austin",
      state: "TX",
    });

    assert.equal(enrichment.changed, false);
    assert.equal(enrichment.confidence, 1.0);
  } finally {
    restore();
  }
});

test("enrichFaqSection skips items with answers >= 50 chars", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const longAnswer = "A".repeat(50);
    const content = {
      items: [{ question: "What?", answer: longAnswer }],
    };
    const { enrichment } = await enrichFaqSection(content, {
      businessName: "Test Biz",
      niche: "plumbing",
      city: "Austin",
      state: "TX",
    });

    assert.equal(enrichment.changed, false);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// enrichSections — AI disabled
// ---------------------------------------------------------------------------

test("enrichSections returns all originals unchanged when AI is disabled", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const request: EnrichmentRequest = {
      slug: "test-page",
      sections: [
        { sectionType: "hero", currentContent: { headline: "Hello" } },
        { sectionType: "about", currentContent: { description: "Short" } },
        { sectionType: "faq", currentContent: { items: [{ question: "Q?", answer: "A" }] } },
      ],
      nicheContext: { niche: "plumbing", industry: "home-services", city: "Austin", state: "TX" },
      businessName: "Test Biz",
    };

    const result = await enrichSections(request);

    assert.equal(result.slug, "test-page");
    assert.equal(result.enrichments.length, 3);
    assert.equal(result.tokensUsed.input, 0);
    assert.equal(result.tokensUsed.output, 0);

    for (const enrichment of result.enrichments) {
      assert.equal(enrichment.changed, false);
      assert.equal(enrichment.confidence, 1.0);
    }
  } finally {
    restore();
  }
});

test("enrichSections falls back to no-op for unknown section types", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const request: EnrichmentRequest = {
      slug: "test-page",
      sections: [
        { sectionType: "unknown-widget", currentContent: { foo: "bar" } },
      ],
      nicheContext: { niche: "plumbing", industry: "home-services", city: "Austin", state: "TX" },
      businessName: "Test Biz",
    };

    const result = await enrichSections(request);

    assert.equal(result.enrichments.length, 1);
    assert.equal(result.enrichments[0].changed, false);
    assert.deepEqual(result.enrichments[0].enriched, { foo: "bar" });
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// Token tracking accumulation
// ---------------------------------------------------------------------------

test("enrichSections accumulates zero tokens across sections when AI is disabled", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const request: EnrichmentRequest = {
      slug: "test-page",
      sections: [
        { sectionType: "hero", currentContent: { headline: "H1" } },
        { sectionType: "hero", currentContent: { headline: "H2" } },
        { sectionType: "about", currentContent: { description: "Short" } },
      ],
      nicheContext: { niche: "plumbing", industry: "home-services", city: "Austin", state: "TX" },
      businessName: "Test Biz",
    };

    const result = await enrichSections(request);

    assert.equal(result.tokensUsed.input, 0);
    assert.equal(result.tokensUsed.output, 0);
    assert.equal(result.enrichments.length, 3);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

test("confidence is 1.0 when AI is disabled since content is unchanged", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const { enrichment } = await enrichHeroSection(
      { headline: "Test" },
      { businessName: "Biz", niche: "plumbing", city: "Austin" },
    );
    assert.equal(enrichment.confidence, 1.0);
    assert.equal(enrichment.changed, false);

    const { enrichment: aboutEnrichment } = await enrichAboutSection(
      { description: "Short" },
      { businessName: "Biz", niche: "plumbing", city: "Austin" },
    );
    assert.equal(aboutEnrichment.confidence, 1.0);

    const { enrichment: faqEnrichment } = await enrichFaqSection(
      { items: [{ question: "Q?", answer: "A" }] },
      { businessName: "Biz", niche: "plumbing", city: "Austin", state: "TX" },
    );
    assert.equal(faqEnrichment.confidence, 1.0);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// enrichLandingPage — non-existent slug
// ---------------------------------------------------------------------------

test("enrichLandingPage returns null for non-existent slug", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const result = await enrichLandingPage("non-existent-slug-xyz-12345");
    assert.equal(result, null);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// enrichSections includes enrichedAt timestamp and durationMs
// ---------------------------------------------------------------------------

test("enrichSections result includes enrichedAt ISO timestamp and non-negative durationMs", async () => {
  const restore = withEnv({ AI_API_KEY: undefined });
  try {
    const request: EnrichmentRequest = {
      slug: "test-page",
      sections: [{ sectionType: "hero", currentContent: { headline: "Test" } }],
      nicheContext: { niche: "plumbing", industry: "home-services", city: "Austin", state: "TX" },
      businessName: "Test Biz",
    };

    const result = await enrichSections(request);

    assert.ok(typeof result.enrichedAt === "string");
    assert.ok(result.enrichedAt.includes("T"));
    assert.ok(result.durationMs >= 0);
  } finally {
    restore();
  }
});
