import crypto from "crypto";
import type { Script, VideoScript, CarouselScript, ThreadScript, ArticleOutlineScript } from "./social-script-generator.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdaptedPlatform = "tiktok" | "instagram-reels" | "instagram-carousel" | "instagram-stories" | "youtube-shorts" | "youtube-long" | "linkedin-post" | "linkedin-carousel" | "linkedin-article" | "x-post" | "x-thread" | "threads-post";

export interface PlatformConstraints {
  platform: AdaptedPlatform;
  maxDurationSeconds: number | null;
  maxCharacters: number | null;
  maxSlides: number | null;
  maxThreadPosts: number | null;
  aspectRatio: string;
  trendingSoundsPlaceholder: boolean;
}

export interface AdaptedContent {
  id: string;
  platform: AdaptedPlatform;
  content: string;
  characterCount: number;
  metadata: Record<string, unknown>;
  constraints: PlatformConstraints;
  warnings: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Platform constraints
// ---------------------------------------------------------------------------

const CONSTRAINTS: Record<AdaptedPlatform, PlatformConstraints> = {
  tiktok: {
    platform: "tiktok",
    maxDurationSeconds: 60,
    maxCharacters: 2200,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "9:16",
    trendingSoundsPlaceholder: true,
  },
  "instagram-reels": {
    platform: "instagram-reels",
    maxDurationSeconds: 90,
    maxCharacters: 2200,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "9:16",
    trendingSoundsPlaceholder: false,
  },
  "instagram-carousel": {
    platform: "instagram-carousel",
    maxDurationSeconds: null,
    maxCharacters: 2200,
    maxSlides: 10,
    maxThreadPosts: null,
    aspectRatio: "1:1",
    trendingSoundsPlaceholder: false,
  },
  "instagram-stories": {
    platform: "instagram-stories",
    maxDurationSeconds: 15,
    maxCharacters: 250,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "9:16",
    trendingSoundsPlaceholder: false,
  },
  "youtube-shorts": {
    platform: "youtube-shorts",
    maxDurationSeconds: 60,
    maxCharacters: 100,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "9:16",
    trendingSoundsPlaceholder: false,
  },
  "youtube-long": {
    platform: "youtube-long",
    maxDurationSeconds: 900,
    maxCharacters: 5000,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "16:9",
    trendingSoundsPlaceholder: false,
  },
  "linkedin-post": {
    platform: "linkedin-post",
    maxDurationSeconds: null,
    maxCharacters: 3000,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "1:1",
    trendingSoundsPlaceholder: false,
  },
  "linkedin-carousel": {
    platform: "linkedin-carousel",
    maxDurationSeconds: null,
    maxCharacters: 3000,
    maxSlides: 20,
    maxThreadPosts: null,
    aspectRatio: "1:1",
    trendingSoundsPlaceholder: false,
  },
  "linkedin-article": {
    platform: "linkedin-article",
    maxDurationSeconds: null,
    maxCharacters: 125000,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "16:9",
    trendingSoundsPlaceholder: false,
  },
  "x-post": {
    platform: "x-post",
    maxDurationSeconds: null,
    maxCharacters: 280,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "16:9",
    trendingSoundsPlaceholder: false,
  },
  "x-thread": {
    platform: "x-thread",
    maxDurationSeconds: null,
    maxCharacters: 280,
    maxSlides: null,
    maxThreadPosts: 25,
    aspectRatio: "16:9",
    trendingSoundsPlaceholder: false,
  },
  "threads-post": {
    platform: "threads-post",
    maxDurationSeconds: null,
    maxCharacters: 500,
    maxSlides: null,
    maxThreadPosts: null,
    aspectRatio: "1:1",
    trendingSoundsPlaceholder: false,
  },
};

// ---------------------------------------------------------------------------
// Adaptation logic
// ---------------------------------------------------------------------------

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function adaptVideoForPlatform(script: VideoScript, platform: AdaptedPlatform): AdaptedContent {
  const constraint = CONSTRAINTS[platform];
  const warnings: string[] = [];
  const maxDuration = constraint.maxDurationSeconds ?? 60;

  let sections = script.sections;
  if (script.totalDurationSeconds > maxDuration) {
    warnings.push(`Script duration (${script.totalDurationSeconds}s) exceeds ${platform} limit (${maxDuration}s). Sections will be compressed.`);
    const ratio = maxDuration / script.totalDurationSeconds;
    sections = sections.map((s) => ({
      ...s,
      durationSeconds: Math.max(1, Math.round(s.durationSeconds * ratio)),
    }));
  }

  const scriptText = sections
    .map((s) => `[${s.label.toUpperCase()} - ${s.durationSeconds}s]\n${s.content}`)
    .join("\n\n");

  const metadata: Record<string, unknown> = {
    totalDurationSeconds: sections.reduce((sum, s) => sum + s.durationSeconds, 0),
    sectionCount: sections.length,
    originalDuration: script.totalDurationSeconds,
  };

  if (constraint.trendingSoundsPlaceholder) {
    metadata.trendingSound = "[INSERT TRENDING SOUND]";
    metadata.soundNote = "Select a trending sound from the Discover page that matches the energy of this script";
  }

  const content = constraint.maxCharacters
    ? truncate(scriptText, constraint.maxCharacters)
    : scriptText;

  return {
    id: crypto.randomUUID(),
    platform,
    content,
    characterCount: content.length,
    metadata,
    constraints: constraint,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

function adaptCarouselForPlatform(script: CarouselScript, platform: AdaptedPlatform): AdaptedContent {
  const constraint = CONSTRAINTS[platform];
  const warnings: string[] = [];
  const maxSlides = constraint.maxSlides ?? 10;

  let slides = script.slides;
  if (slides.length > maxSlides) {
    warnings.push(`Carousel has ${slides.length} slides but ${platform} allows max ${maxSlides}. Truncating.`);
    slides = slides.slice(0, maxSlides);
  }

  const content = slides
    .map((s) => `[SLIDE ${s.slideNumber}]\n${s.headline}\n${s.body}\nVisual: ${s.visualNote}`)
    .join("\n\n");

  const finalContent = constraint.maxCharacters
    ? truncate(content, constraint.maxCharacters)
    : content;

  return {
    id: crypto.randomUUID(),
    platform,
    content: finalContent,
    characterCount: finalContent.length,
    metadata: {
      slideCount: slides.length,
      originalSlideCount: script.slideCount,
    },
    constraints: constraint,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

function adaptThreadForPlatform(script: ThreadScript, platform: AdaptedPlatform): AdaptedContent {
  const constraint = CONSTRAINTS[platform];
  const warnings: string[] = [];
  const maxPosts = constraint.maxThreadPosts ?? 25;
  const maxChars = constraint.maxCharacters ?? 280;

  let posts = script.posts;
  if (posts.length > maxPosts) {
    warnings.push(`Thread has ${posts.length} posts but ${platform} allows max ${maxPosts}. Truncating.`);
    posts = posts.slice(0, maxPosts);
  }

  const truncatedPosts = posts.map((p) => ({
    ...p,
    content: truncate(p.content, maxChars),
    characterCount: Math.min(p.characterCount, maxChars),
  }));

  const overLimit = truncatedPosts.filter((p) => p.content !== posts.find((op) => op.postNumber === p.postNumber)?.content);
  if (overLimit.length > 0) {
    warnings.push(`${overLimit.length} post(s) were truncated to fit the ${maxChars} character limit.`);
  }

  const content = truncatedPosts
    .map((p) => `[${p.postNumber}/${truncatedPosts.length}]\n${p.content}`)
    .join("\n\n");

  return {
    id: crypto.randomUUID(),
    platform,
    content,
    characterCount: content.length,
    metadata: {
      postCount: truncatedPosts.length,
      originalPostCount: script.postCount,
      perPostCharLimit: maxChars,
    },
    constraints: constraint,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

function adaptArticleForPlatform(script: ArticleOutlineScript, platform: AdaptedPlatform): AdaptedContent {
  const constraint = CONSTRAINTS[platform];
  const warnings: string[] = [];

  const content = [
    `# ${script.title}`,
    "",
    ...script.sections.flatMap((s) => [
      `## ${s.heading}`,
      ...s.bulletPoints.map((bp) => `- ${bp}`),
      `[~${s.estimatedWordCount} words]`,
      "",
    ]),
  ].join("\n");

  const finalContent = constraint.maxCharacters
    ? truncate(content, constraint.maxCharacters)
    : content;

  if (constraint.maxCharacters && content.length > constraint.maxCharacters) {
    warnings.push(`Article outline exceeds ${platform} character limit. Content truncated.`);
  }

  return {
    id: crypto.randomUUID(),
    platform,
    content: finalContent,
    characterCount: finalContent.length,
    metadata: {
      sectionCount: script.sections.length,
      totalEstimatedWordCount: script.totalEstimatedWordCount,
    },
    constraints: constraint,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getConstraints(platform: AdaptedPlatform): PlatformConstraints {
  return CONSTRAINTS[platform];
}

export function getAllPlatforms(): AdaptedPlatform[] {
  return Object.keys(CONSTRAINTS) as AdaptedPlatform[];
}

export function adaptContent(script: Script, platform: AdaptedPlatform): AdaptedContent {
  switch (script.format) {
    case "short-video":
      return adaptVideoForPlatform(script, platform);
    case "carousel":
      return adaptCarouselForPlatform(script, platform);
    case "thread":
      return adaptThreadForPlatform(script, platform);
    case "article-outline":
      return adaptArticleForPlatform(script, platform);
  }
}

export function adaptContentMultiPlatform(script: Script, platforms: AdaptedPlatform[]): AdaptedContent[] {
  return platforms.map((p) => adaptContent(script, p));
}
