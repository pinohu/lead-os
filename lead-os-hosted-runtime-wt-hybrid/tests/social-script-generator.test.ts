import test from "node:test";
import assert from "node:assert/strict";
import {
  generateScript,
  storeScript,
  getStoredScripts,
  _resetStores,
  type VideoScript,
  type CarouselScript,
  type ThreadScript,
  type ArticleOutlineScript,
} from "../src/lib/social-script-generator.ts";
import type { ContentAngle } from "../src/lib/social-angle-generator.ts";
import type { Hook } from "../src/lib/social-hook-generator.ts";

test.beforeEach(() => {
  _resetStores();
});

const SAMPLE_ANGLE: ContentAngle = {
  id: "angle-1",
  hook: "Stop doing marketing wrong",
  bodyOutline: ["Expose the common mistake", "Show the real cost", "Present the better approach", "Reveal the framework"],
  cta: "DM 'RESULTS' to get started",
  targetEmotion: "curiosity",
  controversyScore: 0.5,
  shareabilityScore: 0.7,
  topic: "marketing",
  niche: "dental",
  generatedAt: new Date().toISOString(),
};

const SAMPLE_HOOK: Hook = {
  id: "hook-1",
  text: "What if everything you know about marketing is wrong?",
  type: "question",
  platform: "tiktok",
  characterCount: 52,
  estimatedEngagement: 0.72,
  generatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Video script
// ---------------------------------------------------------------------------

test("generateScript creates a valid short-video script", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" }) as VideoScript;
  assert.equal(script.format, "short-video");
  assert.ok(script.sections.length >= 5, "Should have at least 5 sections (hook, problem, agitation, solution, proof, cta)");
  assert.ok(script.totalDurationSeconds > 0);
  assert.equal(script.hookText, SAMPLE_HOOK.text);
  assert.equal(script.ctaText, SAMPLE_ANGLE.cta);
});

test("video script has correct section labels", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" }) as VideoScript;
  const labels = script.sections.map((s) => s.label);
  assert.ok(labels.includes("hook"));
  assert.ok(labels.includes("problem"));
  assert.ok(labels.includes("agitation"));
  assert.ok(labels.includes("solution"));
  assert.ok(labels.includes("cta"));
});

test("video script totalDuration equals sum of section durations", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" }) as VideoScript;
  const sum = script.sections.reduce((s, sec) => s + sec.durationSeconds, 0);
  assert.equal(script.totalDurationSeconds, sum);
});

// ---------------------------------------------------------------------------
// Carousel script
// ---------------------------------------------------------------------------

test("generateScript creates a valid carousel script", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "carousel" }) as CarouselScript;
  assert.equal(script.format, "carousel");
  assert.ok(script.slides.length >= 4, "Should have at least 4 slides");
  assert.equal(script.slideCount, script.slides.length);
  assert.equal(script.slides[0].headline, SAMPLE_HOOK.text);
});

test("carousel slides have sequential numbers", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "carousel" }) as CarouselScript;
  for (let i = 0; i < script.slides.length; i++) {
    assert.equal(script.slides[i].slideNumber, i + 1);
  }
});

// ---------------------------------------------------------------------------
// Thread script
// ---------------------------------------------------------------------------

test("generateScript creates a valid thread script", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "thread" }) as ThreadScript;
  assert.equal(script.format, "thread");
  assert.ok(script.posts.length >= 4, "Should have at least 4 posts");
  assert.equal(script.postCount, script.posts.length);
  assert.ok(script.posts[0].content.includes(SAMPLE_HOOK.text));
});

test("thread posts have correct character counts", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "thread" }) as ThreadScript;
  for (const post of script.posts) {
    assert.equal(post.characterCount, post.content.length);
  }
});

// ---------------------------------------------------------------------------
// Article outline
// ---------------------------------------------------------------------------

test("generateScript creates a valid article outline", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "article-outline" }) as ArticleOutlineScript;
  assert.equal(script.format, "article-outline");
  assert.ok(script.sections.length >= 4, "Should have at least 4 sections");
  assert.ok(script.totalEstimatedWordCount > 0);
  assert.ok(script.title.length > 0);
});

test("article sections have bullet points and word counts", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "article-outline" }) as ArticleOutlineScript;
  for (const section of script.sections) {
    assert.ok(section.heading.length > 0);
    assert.ok(section.bulletPoints.length > 0);
    assert.ok(section.estimatedWordCount > 0);
  }
});

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

test("storeScript and getStoredScripts work correctly", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" });
  const tenantId = `script-store-${Date.now()}`;
  storeScript(tenantId, script);
  const stored = getStoredScripts(tenantId);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, script.id);
});

test("getStoredScripts returns empty for unknown tenant", () => {
  const result = getStoredScripts(`unknown-${Date.now()}`);
  assert.equal(result.length, 0);
});
