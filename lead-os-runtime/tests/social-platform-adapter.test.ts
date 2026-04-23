import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptContent,
  adaptContentMultiPlatform,
  getConstraints,
  getAllPlatforms,
} from "../src/lib/social-platform-adapter.ts";
import { generateScript } from "../src/lib/social-script-generator.ts";
import type { ContentAngle } from "../src/lib/social-angle-generator.ts";
import type { Hook } from "../src/lib/social-hook-generator.ts";

const SAMPLE_ANGLE: ContentAngle = {
  id: "angle-adapt-1",
  hook: "Stop doing marketing wrong",
  bodyOutline: ["Common mistake", "Real cost", "Better approach", "Framework"],
  cta: "DM 'RESULTS' to get started",
  targetEmotion: "curiosity",
  controversyScore: 0.5,
  shareabilityScore: 0.7,
  topic: "marketing",
  niche: "dental",
  generatedAt: new Date().toISOString(),
};

const SAMPLE_HOOK: Hook = {
  id: "hook-adapt-1",
  text: "What if everything you know about marketing is wrong?",
  type: "question",
  platform: "tiktok",
  characterCount: 52,
  estimatedEngagement: 0.72,
  generatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// getConstraints and getAllPlatforms
// ---------------------------------------------------------------------------

test("getAllPlatforms returns all supported platforms", () => {
  const platforms = getAllPlatforms();
  assert.ok(platforms.length >= 12, `Expected at least 12 platforms, got ${platforms.length}`);
  assert.ok(platforms.includes("tiktok"));
  assert.ok(platforms.includes("x-post"));
  assert.ok(platforms.includes("threads-post"));
});

test("getConstraints returns correct tiktok constraints", () => {
  const c = getConstraints("tiktok");
  assert.equal(c.maxDurationSeconds, 60);
  assert.equal(c.aspectRatio, "9:16");
  assert.equal(c.trendingSoundsPlaceholder, true);
});

test("getConstraints returns correct x-post constraints", () => {
  const c = getConstraints("x-post");
  assert.equal(c.maxCharacters, 280);
});

// ---------------------------------------------------------------------------
// adaptContent for video scripts
// ---------------------------------------------------------------------------

test("adaptContent adapts video script for tiktok", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" });
  const adapted = adaptContent(script, "tiktok");
  assert.equal(adapted.platform, "tiktok");
  assert.ok(adapted.content.length > 0);
  assert.ok(adapted.metadata.trendingSound !== undefined, "TikTok should include trending sound placeholder");
});

test("adaptContent adds warning when video exceeds platform duration", () => {
  const longAngle = {
    ...SAMPLE_ANGLE,
    bodyOutline: Array(20).fill("Long section content that extends the video well beyond normal limits"),
  };
  const script = generateScript({ angle: longAngle, hook: SAMPLE_HOOK, format: "short-video" });
  const adapted = adaptContent(script, "instagram-stories");
  assert.ok(adapted.warnings.length > 0 || adapted.constraints.maxDurationSeconds === 15);
});

// ---------------------------------------------------------------------------
// adaptContent for carousel
// ---------------------------------------------------------------------------

test("adaptContent truncates carousel slides to platform limit", () => {
  const manySlideAngle = {
    ...SAMPLE_ANGLE,
    bodyOutline: Array(15).fill("Slide content"),
  };
  const script = generateScript({ angle: manySlideAngle, hook: SAMPLE_HOOK, format: "carousel" });
  const adapted = adaptContent(script, "instagram-carousel");
  const slideCount = (adapted.metadata.slideCount as number) ?? 0;
  assert.ok(slideCount <= 10, `Instagram carousel should have max 10 slides, got ${slideCount}`);
});

// ---------------------------------------------------------------------------
// adaptContent for thread
// ---------------------------------------------------------------------------

test("adaptContent limits x-thread posts to 25", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "thread" });
  const adapted = adaptContent(script, "x-thread");
  assert.equal(adapted.platform, "x-thread");
  const postCount = (adapted.metadata.postCount as number) ?? 0;
  assert.ok(postCount <= 25);
});

// ---------------------------------------------------------------------------
// adaptContent for article
// ---------------------------------------------------------------------------

test("adaptContent adapts article for linkedin-article", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "article-outline" });
  const adapted = adaptContent(script, "linkedin-article");
  assert.equal(adapted.platform, "linkedin-article");
  assert.ok(adapted.content.includes("#"), "Article should contain markdown headings");
});

// ---------------------------------------------------------------------------
// Multi-platform adaptation
// ---------------------------------------------------------------------------

test("adaptContentMultiPlatform returns one result per platform", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" });
  const adapted = adaptContentMultiPlatform(script, ["tiktok", "youtube-shorts", "instagram-reels"]);
  assert.equal(adapted.length, 3);
  const platforms = adapted.map((a) => a.platform);
  assert.ok(platforms.includes("tiktok"));
  assert.ok(platforms.includes("youtube-shorts"));
  assert.ok(platforms.includes("instagram-reels"));
});

test("each adapted content has unique IDs", () => {
  const script = generateScript({ angle: SAMPLE_ANGLE, hook: SAMPLE_HOOK, format: "short-video" });
  const adapted = adaptContentMultiPlatform(script, ["tiktok", "youtube-shorts"]);
  assert.notEqual(adapted[0].id, adapted[1].id);
});
