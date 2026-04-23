import test from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_PROFILES,
  adaptContentForPlatform,
  generatePlatformVariants,
  getOptimalPostingSchedule,
  estimateReach,
  type GenericContent,
} from "../src/lib/platform-adapter.ts";
import type { Platform } from "../src/lib/social-asset-engine.ts";

const ALL_PLATFORMS: Platform[] = [
  "tiktok",
  "instagram-reels",
  "youtube-shorts",
  "youtube-long",
  "linkedin",
  "x",
  "facebook",
];

const SAMPLE_CONTENT: GenericContent = {
  text: "This is a sample piece of content about pest control services in your area.",
  hook: "Nobody tells you this about pest control",
  hashtags: ["#pestcontrol", "#homesafety", "#exterminator", "#bugs", "#pestfree", "#rodentcontrol"],
};

// ---------------------------------------------------------------------------
// PLATFORM_PROFILES
// ---------------------------------------------------------------------------

test("PLATFORM_PROFILES contains all 7 platforms", () => {
  for (const platform of ALL_PLATFORMS) {
    assert.ok(platform in PLATFORM_PROFILES, `Missing profile for ${platform}`);
  }
});

test("each platform profile has all required fields", () => {
  for (const [key, profile] of Object.entries(PLATFORM_PROFILES)) {
    assert.ok(typeof profile.name === "string" && profile.name.length > 0, `${key}: name must be non-empty`);
    assert.ok(["fast", "curiosity", "authority", "emotional"].includes(profile.hookStyle), `${key}: invalid hookStyle`);
    assert.ok(typeof profile.maxDuration === "number" && profile.maxDuration >= 0, `${key}: maxDuration must be a non-negative number`);
    assert.ok(["vertical", "horizontal", "text", "carousel"].includes(profile.format), `${key}: invalid format`);
    assert.ok(typeof profile.maxTextLength === "number" && profile.maxTextLength > 0, `${key}: maxTextLength must be positive`);
    assert.ok(typeof profile.hashtagLimit === "number" && profile.hashtagLimit >= 0, `${key}: hashtagLimit must be non-negative`);
    assert.ok(Array.isArray(profile.bestPostingTimes) && profile.bestPostingTimes.length > 0, `${key}: bestPostingTimes must be non-empty array`);
    assert.ok(Array.isArray(profile.contentRules) && profile.contentRules.length > 0, `${key}: contentRules must be non-empty array`);
  }
});

test("all bestPostingTimes are valid hour values (0-23)", () => {
  for (const [key, profile] of Object.entries(PLATFORM_PROFILES)) {
    for (const hour of profile.bestPostingTimes) {
      assert.ok(hour >= 0 && hour <= 23, `${key}: hour ${hour} is out of range`);
    }
  }
});

test("tiktok has vertical format", () => {
  assert.equal(PLATFORM_PROFILES.tiktok.format, "vertical");
});

test("youtube-long has horizontal format", () => {
  assert.equal(PLATFORM_PROFILES["youtube-long"].format, "horizontal");
});

test("x has text format", () => {
  assert.equal(PLATFORM_PROFILES.x.format, "text");
});

test("x maxTextLength is 280", () => {
  assert.equal(PLATFORM_PROFILES.x.maxTextLength, 280);
});

test("linkedin has authority hookStyle", () => {
  assert.equal(PLATFORM_PROFILES.linkedin.hookStyle, "authority");
});

// ---------------------------------------------------------------------------
// adaptContentForPlatform
// ---------------------------------------------------------------------------

test("adaptContentForPlatform returns adapted content with platform field", () => {
  const adapted = adaptContentForPlatform(SAMPLE_CONTENT, "tiktok");
  assert.equal(adapted.platform, "tiktok");
  assert.ok(typeof adapted.text === "string");
  assert.ok(typeof adapted.hook === "string");
  assert.ok(Array.isArray(adapted.hashtags));
  assert.ok(Array.isArray(adapted.notes));
});

test("adaptContentForPlatform truncates text exceeding platform maxTextLength", () => {
  const longContent: GenericContent = {
    text: "A".repeat(400),
    hook: "Short hook",
    hashtags: [],
  };
  const adapted = adaptContentForPlatform(longContent, "x");
  assert.ok(adapted.text.length <= PLATFORM_PROFILES.x.maxTextLength);
});

test("adaptContentForPlatform does not truncate text within platform limits", () => {
  const shortContent: GenericContent = {
    text: "Short text",
    hook: "Short hook",
    hashtags: [],
  };
  const adapted = adaptContentForPlatform(shortContent, "linkedin");
  assert.equal(adapted.text, "Short text");
});

test("adaptContentForPlatform limits hashtags to platform hashtagLimit", () => {
  const adapted = adaptContentForPlatform(SAMPLE_CONTENT, "x");
  assert.ok(adapted.hashtags.length <= PLATFORM_PROFILES.x.hashtagLimit);
});

test("adaptContentForPlatform adds notes when content is modified", () => {
  const longContent: GenericContent = {
    text: "B".repeat(500),
    hook: "Test hook",
    hashtags: ["#a", "#b", "#c", "#d", "#e", "#f"],
  };
  const adapted = adaptContentForPlatform(longContent, "x");
  assert.ok(adapted.notes.length > 0, "Notes should explain what was changed");
});

test("adaptContentForPlatform adds authority marker formatting for linkedin", () => {
  const content: GenericContent = {
    text: "Pest control tips that actually work",
    hook: "The truth about pest control services",
    hashtags: ["#pest"],
  };
  const adapted = adaptContentForPlatform(content, "linkedin");
  const lastChar = adapted.hook[adapted.hook.length - 1];
  assert.ok(lastChar === "." || lastChar === "?");
});

test("adaptContentForPlatform preserves hashtags under the limit", () => {
  const content: GenericContent = {
    text: "Some content",
    hook: "Some hook",
    hashtags: ["#a", "#b"],
  };
  const adapted = adaptContentForPlatform(content, "tiktok");
  assert.equal(adapted.hashtags.length, 2);
});

// ---------------------------------------------------------------------------
// generatePlatformVariants
// ---------------------------------------------------------------------------

test("generatePlatformVariants returns one variant per platform", () => {
  const platforms: Platform[] = ["tiktok", "linkedin", "x"];
  const variants = generatePlatformVariants(SAMPLE_CONTENT, platforms);
  assert.equal(variants.length, platforms.length);
  const returnedPlatforms = variants.map((v) => v.platform);
  for (const p of platforms) {
    assert.ok(returnedPlatforms.includes(p));
  }
});

test("generatePlatformVariants returns empty array for empty platforms list", () => {
  const variants = generatePlatformVariants(SAMPLE_CONTENT, []);
  assert.deepEqual(variants, []);
});

test("generatePlatformVariants generates variants for all 7 platforms", () => {
  const variants = generatePlatformVariants(SAMPLE_CONTENT, ALL_PLATFORMS);
  assert.equal(variants.length, 7);
});

// ---------------------------------------------------------------------------
// getOptimalPostingSchedule
// ---------------------------------------------------------------------------

test("getOptimalPostingSchedule returns required fields", () => {
  const schedule = getOptimalPostingSchedule("tiktok");
  assert.equal(schedule.platform, "tiktok");
  assert.ok(typeof schedule.timezone === "string");
  assert.ok(Array.isArray(schedule.recommendedTimes) && schedule.recommendedTimes.length > 0);
  assert.ok(typeof schedule.frequencyPerWeek === "number" && schedule.frequencyPerWeek > 0);
});

test("getOptimalPostingSchedule defaults timezone to UTC", () => {
  const schedule = getOptimalPostingSchedule("linkedin");
  assert.equal(schedule.timezone, "UTC");
});

test("getOptimalPostingSchedule accepts custom timezone", () => {
  const schedule = getOptimalPostingSchedule("tiktok", "America/New_York");
  assert.equal(schedule.timezone, "America/New_York");
  assert.ok(schedule.recommendedTimes.every((t) => t.includes("America/New_York")));
});

test("getOptimalPostingSchedule returns times in HH:MM format", () => {
  const schedule = getOptimalPostingSchedule("instagram-reels");
  for (const time of schedule.recommendedTimes) {
    assert.match(time, /^\d{2}:\d{2}/);
  }
});

test("getOptimalPostingSchedule returns higher frequency for tiktok than youtube-long", () => {
  const tiktokSchedule = getOptimalPostingSchedule("tiktok");
  const youtubeLongSchedule = getOptimalPostingSchedule("youtube-long");
  assert.ok(tiktokSchedule.frequencyPerWeek > youtubeLongSchedule.frequencyPerWeek);
});

// ---------------------------------------------------------------------------
// estimateReach
// ---------------------------------------------------------------------------

test("estimateReach returns required fields", () => {
  const result = estimateReach(SAMPLE_CONTENT, "tiktok");
  assert.equal(result.platform, "tiktok");
  assert.ok(typeof result.estimatedImpressions === "number" && result.estimatedImpressions >= 0);
  assert.ok(typeof result.estimatedClicks === "number" && result.estimatedClicks >= 0);
  assert.ok(["low", "medium", "high"].includes(result.confidence));
  assert.ok(Array.isArray(result.factors));
});

test("estimateReach returns higher impressions for tiktok than youtube-long for same content", () => {
  const tiktokReach = estimateReach(SAMPLE_CONTENT, "tiktok");
  const youtubeLongReach = estimateReach(SAMPLE_CONTENT, "youtube-long");
  assert.ok(tiktokReach.estimatedImpressions > youtubeLongReach.estimatedImpressions);
});

test("estimateReach includes factors explaining the estimate", () => {
  const contentWithHighCTR: GenericContent = {
    text: "High performing content",
    hook: "Short",
    hashtags: ["#test", "#content"],
    hookData: { text: "Short", style: "shock", estimatedCTR: 0.11 },
    angle: { id: "a1", type: "viral", hook: "Short", premise: "p", targetEmotion: "curiosity", estimatedReach: "high" },
  };
  const result = estimateReach(contentWithHighCTR, "tiktok");
  assert.ok(result.factors.length > 0, "Should have explanatory factors");
});

test("estimateReach returns estimatedClicks less than or equal to estimatedImpressions", () => {
  const result = estimateReach(SAMPLE_CONTENT, "instagram-reels");
  assert.ok(result.estimatedClicks <= result.estimatedImpressions);
});
