import type { Platform, Script, Hook, ContentAngle } from "./social-asset-engine.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HookStyleProfile = "fast" | "curiosity" | "authority" | "emotional";
export type VideoFormat = "vertical" | "horizontal" | "text" | "carousel";

export interface PlatformProfile {
  name: string;
  hookStyle: HookStyleProfile;
  maxDuration: number;
  format: VideoFormat;
  maxTextLength: number;
  hashtagLimit: number;
  bestPostingTimes: number[];
  contentRules: string[];
}

export interface AdaptedContent {
  platform: Platform;
  text: string;
  hook: string;
  hashtags: string[];
  duration: number;
  notes: string[];
}

export interface PostingSchedule {
  platform: Platform;
  timezone: string;
  recommendedTimes: string[];
  frequencyPerWeek: number;
}

export interface ReachEstimation {
  platform: Platform;
  estimatedImpressions: number;
  estimatedClicks: number;
  confidence: "low" | "medium" | "high";
  factors: string[];
}

export interface GenericContent {
  text: string;
  hook?: string;
  hashtags?: string[];
  duration?: number;
  cta?: string;
  angle?: ContentAngle;
  script?: Script;
  hookData?: Hook;
}

// ---------------------------------------------------------------------------
// Platform profiles
// ---------------------------------------------------------------------------

export const PLATFORM_PROFILES: Record<Platform, PlatformProfile> = {
  tiktok: {
    name: "TikTok",
    hookStyle: "fast",
    maxDuration: 600,
    format: "vertical",
    maxTextLength: 2200,
    hashtagLimit: 5,
    bestPostingTimes: [6, 10, 19, 21],
    contentRules: [
      "Hook must land in first 2 seconds",
      "Use trending audio when possible",
      "On-screen text captions improve retention",
      "Keep cuts under 3 seconds for high energy",
      "End with a strong loop or open loop to replay",
    ],
  },
  "instagram-reels": {
    name: "Instagram Reels",
    hookStyle: "emotional",
    maxDuration: 90,
    format: "vertical",
    maxTextLength: 2200,
    hashtagLimit: 5,
    bestPostingTimes: [8, 11, 14, 17, 20],
    contentRules: [
      "Aesthetic visuals increase share rate",
      "Hook in first 3 seconds",
      "Use Reels-specific audio for algorithmic boost",
      "Captions matter - 80% of viewers watch muted",
      "End with a save or share prompt",
    ],
  },
  "youtube-shorts": {
    name: "YouTube Shorts",
    hookStyle: "curiosity",
    maxDuration: 60,
    format: "vertical",
    maxTextLength: 100,
    hashtagLimit: 3,
    bestPostingTimes: [12, 15, 18, 21],
    contentRules: [
      "Hook must be in first 2 seconds",
      "Include #Shorts in title",
      "Keep full 60 seconds for maximum watch time credit",
      "No external links in description for Shorts",
      "Vertical 9:16 aspect ratio required",
    ],
  },
  "youtube-long": {
    name: "YouTube",
    hookStyle: "curiosity",
    maxDuration: 3600,
    format: "horizontal",
    maxTextLength: 5000,
    hashtagLimit: 3,
    bestPostingTimes: [14, 16, 18, 20],
    contentRules: [
      "First 30 seconds determine audience retention",
      "Use chapter markers for videos over 5 minutes",
      "Thumbnail and title do 80% of the work",
      "End screen cards improve subscriber conversion",
      "Transcripts improve SEO and accessibility",
    ],
  },
  linkedin: {
    name: "LinkedIn",
    hookStyle: "authority",
    maxDuration: 600,
    format: "horizontal",
    maxTextLength: 3000,
    hashtagLimit: 3,
    bestPostingTimes: [8, 10, 12, 17],
    contentRules: [
      "First line must compel the see-more click",
      "Use line breaks for readability - no walls of text",
      "Professional tone but conversational voice",
      "Data and credentials increase credibility",
      "Personal story outperforms corporate messaging",
    ],
  },
  x: {
    name: "X (Twitter)",
    hookStyle: "fast",
    maxDuration: 140,
    format: "text",
    maxTextLength: 280,
    hashtagLimit: 2,
    bestPostingTimes: [8, 9, 12, 17, 18],
    contentRules: [
      "Single punchy sentence as opener",
      "Thread format multiplies reach",
      "Quote tweet with commentary for engagement",
      "Avoid hashtag stuffing - 1-2 max",
      "Images increase impressions by 150 percent",
    ],
  },
  facebook: {
    name: "Facebook",
    hookStyle: "emotional",
    maxDuration: 240,
    format: "vertical",
    maxTextLength: 63206,
    hashtagLimit: 3,
    bestPostingTimes: [9, 13, 15, 20],
    contentRules: [
      "Stories and personal narratives outperform promotional content",
      "Native video gets 3x more reach than links",
      "Ask a question to drive comments",
      "Groups outperform pages for organic reach",
      "Longer captions work better than on other platforms",
    ],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

function adjustHashtags(hashtags: string[], limit: number): string[] {
  return hashtags.slice(0, limit);
}

function estimateDuration(script?: Script, profileMax?: number): number {
  if (!script) return 0;
  if (profileMax === 0) return 0;
  return Math.min(script.totalDuration, profileMax ?? script.totalDuration);
}

// ---------------------------------------------------------------------------
// Core exports
// ---------------------------------------------------------------------------

export function adaptContentForPlatform(content: GenericContent, platform: Platform): AdaptedContent {
  const profile = PLATFORM_PROFILES[platform];
  const notes: string[] = [];

  let text = content.text;
  if (text.length > profile.maxTextLength) {
    text = truncate(text, profile.maxTextLength);
    notes.push(`Text truncated to ${profile.maxTextLength} characters for ${profile.name}`);
  }

  let hookText = content.hook ?? text.split("\n")[0] ?? text;
  if (platform === "linkedin") {
    if (!hookText.endsWith(".") && !hookText.endsWith("?")) hookText += ".";
    notes.push("Added authority marker formatting for LinkedIn");
  } else if (platform === "tiktok" || platform === "instagram-reels") {
    if (hookText.length > 100) {
      hookText = hookText.slice(0, 97) + "...";
      notes.push("Hook shortened for short-form attention span");
    }
  } else if (platform === "x") {
    if (hookText.length > 280) {
      hookText = hookText.slice(0, 277) + "...";
      notes.push("Hook truncated to fit X character limit");
    }
  }

  const hashtags = adjustHashtags(content.hashtags ?? [], profile.hashtagLimit);
  if ((content.hashtags?.length ?? 0) > profile.hashtagLimit) {
    notes.push(`Hashtags reduced from ${content.hashtags?.length} to ${profile.hashtagLimit} for ${profile.name}`);
  }

  const duration = estimateDuration(content.script, profile.maxDuration);

  return {
    platform,
    text,
    hook: hookText,
    hashtags,
    duration,
    notes,
  };
}

export function generatePlatformVariants(
  content: GenericContent,
  platforms: Platform[],
): AdaptedContent[] {
  return platforms.map((platform) => adaptContentForPlatform(content, platform));
}

export function getOptimalPostingSchedule(platform: Platform, timezone = "UTC"): PostingSchedule {
  const profile = PLATFORM_PROFILES[platform];

  const frequencyMap: Record<Platform, number> = {
    tiktok: 7,
    "instagram-reels": 5,
    "youtube-shorts": 5,
    "youtube-long": 3,
    linkedin: 5,
    x: 7,
    facebook: 4,
  };

  const recommendedTimes = profile.bestPostingTimes.map((hour) => {
    const paddedHour = String(hour).padStart(2, "0");
    return `${paddedHour}:00 ${timezone}`;
  });

  return {
    platform,
    timezone,
    recommendedTimes,
    frequencyPerWeek: frequencyMap[platform],
  };
}

export function estimateReach(content: GenericContent, platform: Platform): ReachEstimation {
  const profile = PLATFORM_PROFILES[platform];
  const factors: string[] = [];

  let score = 50;

  const hookLength = (content.hook ?? content.text).length;
  if (hookLength > 0 && hookLength <= 100) {
    score += 10;
    factors.push("Concise hook length");
  }

  if (content.hookData) {
    const ctr = content.hookData.estimatedCTR;
    if (ctr >= 0.09) {
      score += 20;
      factors.push("High estimated CTR hook");
    } else if (ctr >= 0.07) {
      score += 10;
      factors.push("Moderate estimated CTR hook");
    }
  }

  if (content.angle?.estimatedReach === "high") {
    score += 15;
    factors.push("High reach angle");
  } else if (content.angle?.estimatedReach === "medium") {
    score += 8;
    factors.push("Medium reach angle");
  }

  const hashtagCount = (content.hashtags ?? []).length;
  if (hashtagCount > 0 && hashtagCount <= profile.hashtagLimit) {
    score += 5;
    factors.push("Optimal hashtag usage");
  }

  const platformMultipliers: Record<Platform, number> = {
    tiktok: 3.5,
    "instagram-reels": 2.8,
    "youtube-shorts": 2.2,
    "youtube-long": 1.5,
    linkedin: 1.8,
    x: 2.0,
    facebook: 1.6,
  };

  const multiplier = platformMultipliers[platform];
  const estimatedImpressions = Math.round(score * multiplier * 100);
  const estimatedClicks = Math.round(estimatedImpressions * (content.hookData?.estimatedCTR ?? 0.03));

  const confidence: ReachEstimation["confidence"] =
    score >= 80 ? "high" : score >= 60 ? "medium" : "low";

  return {
    platform,
    estimatedImpressions,
    estimatedClicks,
    confidence,
    factors,
  };
}
