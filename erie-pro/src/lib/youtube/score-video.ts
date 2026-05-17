// ── Video scoring ────────────────────────────────────────────────────
// Pure function that scores a candidate YouTube video against curation
// criteria from a cluster's curation guide.
//
// Score is 0-100. Higher = better candidate for the channel rotation.
// The function returns the score AND a breakdown of reasons (positives
// and penalties) so a human curator can quickly understand why a video
// was ranked where it was.

import type { CurationGuide } from "@/lib/youtube/parse-curation";

export interface VideoCandidate {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string; // ISO 8601
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  /** True if comments are disabled — slight negative signal for educational content */
  commentsDisabled?: boolean;
}

export interface ScoreBreakdown {
  total: number; // 0-100
  recency: number;
  engagement: number;
  length: number;
  relevance: number;
  erieFilter: number;
  positives: string[];
  penalties: string[];
}

const NOW = () => Date.now();
const YEAR_MS = 365 * 86400 * 1000;

// ── Component scorers (each returns 0-1 contribution × weight) ───────

const WEIGHTS = {
  recency: 15, // 0-15 points
  engagement: 20, // 0-20 points
  length: 15, // 0-15 points
  relevance: 30, // 0-30 points
  erieFilter: 20, // -20 to +20 points (penalty-or-bonus axis)
};

function scoreRecency(publishedAt: string): {
  score: number;
  positives: string[];
  penalties: string[];
} {
  const positives: string[] = [];
  const penalties: string[] = [];
  const ageMs = NOW() - new Date(publishedAt).getTime();
  const ageYears = ageMs / YEAR_MS;

  let raw: number;
  if (ageYears < 1) {
    raw = 1.0;
    positives.push("Recent (< 1 year)");
  } else if (ageYears < 2) {
    raw = 0.85;
  } else if (ageYears < 4) {
    raw = 0.6;
  } else if (ageYears < 7) {
    raw = 0.35;
    penalties.push(`${ageYears.toFixed(1)} years old`);
  } else {
    raw = 0.15;
    penalties.push(`${ageYears.toFixed(1)} years old (consider freshness)`);
  }

  return {
    score: raw * WEIGHTS.recency,
    positives,
    penalties,
  };
}

function scoreEngagement(v: VideoCandidate): {
  score: number;
  positives: string[];
  penalties: string[];
} {
  const positives: string[] = [];
  const penalties: string[] = [];

  if (v.viewCount < 1000) {
    penalties.push(`Low view count (${v.viewCount.toLocaleString()})`);
    return { score: WEIGHTS.engagement * 0.1, positives, penalties };
  }

  // Like ratio is the strongest engagement signal that survives view-count gaming
  const likeRatio = v.likeCount / Math.max(1, v.viewCount);
  let likeScore: number;
  if (likeRatio >= 0.04) {
    likeScore = 1.0;
    positives.push(`Strong like ratio (${(likeRatio * 100).toFixed(1)}%)`);
  } else if (likeRatio >= 0.02) {
    likeScore = 0.7;
    positives.push(`Healthy like ratio (${(likeRatio * 100).toFixed(1)}%)`);
  } else if (likeRatio >= 0.01) {
    likeScore = 0.4;
  } else {
    likeScore = 0.2;
    penalties.push(`Weak like ratio (${(likeRatio * 100).toFixed(2)}%)`);
  }

  // Comment health: disabled comments is a slight negative for educational content
  let commentScore = 0.5;
  if (v.commentsDisabled) {
    commentScore = 0.2;
    penalties.push("Comments disabled");
  } else if (v.commentCount > 0) {
    const commentRatio = v.commentCount / Math.max(1, v.viewCount);
    if (commentRatio >= 0.005) {
      commentScore = 1.0;
      positives.push("Active comment discussion");
    } else if (commentRatio >= 0.001) {
      commentScore = 0.7;
    } else {
      commentScore = 0.4;
    }
  }

  // View threshold bonus — passes basic credibility
  let viewScore = 0.5;
  if (v.viewCount >= 100000) {
    viewScore = 1.0;
    positives.push(`${(v.viewCount / 1000).toFixed(0)}k+ views`);
  } else if (v.viewCount >= 10000) {
    viewScore = 0.75;
  } else if (v.viewCount >= 1000) {
    viewScore = 0.5;
  }

  // Weighted blend: like > view > comment
  const blend = likeScore * 0.5 + viewScore * 0.3 + commentScore * 0.2;
  return {
    score: blend * WEIGHTS.engagement,
    positives,
    penalties,
  };
}

function scoreLength(durationSec: number): {
  score: number;
  positives: string[];
  penalties: string[];
} {
  const positives: string[] = [];
  const penalties: string[] = [];
  const minutes = durationSec / 60;

  let raw: number;
  if (minutes < 1) {
    raw = 0.1;
    penalties.push(`Too short (${minutes.toFixed(1)} min)`);
  } else if (minutes < 3) {
    raw = 0.5;
  } else if (minutes <= 20) {
    raw = 1.0;
    positives.push(`Good length (${minutes.toFixed(1)} min)`);
  } else if (minutes <= 35) {
    raw = 0.7;
  } else if (minutes <= 60) {
    raw = 0.4;
    penalties.push(`Long (${minutes.toFixed(0)} min) — may not fit rotation`);
  } else {
    raw = 0.2;
    penalties.push(`Very long (${minutes.toFixed(0)} min)`);
  }

  return {
    score: raw * WEIGHTS.length,
    positives,
    penalties,
  };
}

function scoreRelevance(
  v: VideoCandidate,
  guide: CurationGuide
): {
  score: number;
  positives: string[];
  penalties: string[];
  matchedBlock: string | null;
} {
  const positives: string[] = [];
  const penalties: string[] = [];

  const haystack = `${v.title} ${v.description}`.toLowerCase();
  const matchedBlocks: string[] = [];

  for (const block of guide.programmingBlocks) {
    // Use keywords from theme + examples
    const tokens = (block.theme + " " + block.examples)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4);
    const matchCount = tokens.filter((t) => haystack.includes(t)).length;
    if (matchCount >= 2) {
      matchedBlocks.push(`Block ${block.index} (${block.theme})`);
    }
  }

  // Also check niche slugs
  const nicheMatches = guide.nichesCovered.filter((n) =>
    haystack.includes(n.replace(/-/g, " ")) || haystack.includes(n)
  );

  let raw: number;
  if (matchedBlocks.length >= 2) {
    raw = 1.0;
    positives.push(`Matches: ${matchedBlocks.slice(0, 2).join("; ")}`);
  } else if (matchedBlocks.length === 1) {
    raw = 0.75;
    positives.push(`Matches: ${matchedBlocks[0]}`);
  } else if (nicheMatches.length > 0) {
    raw = 0.5;
    positives.push(`Matches niche: ${nicheMatches[0]}`);
  } else {
    raw = 0.15;
    penalties.push("No clear match to any programming block");
  }

  return {
    score: raw * WEIGHTS.relevance,
    positives,
    penalties,
    matchedBlock: matchedBlocks[0] ?? null,
  };
}

function scoreErieFilter(
  v: VideoCandidate,
  guide: CurationGuide
): {
  score: number;
  positives: string[];
  penalties: string[];
} {
  const positives: string[] = [];
  const penalties: string[] = [];
  const haystack = `${v.title} ${v.description}`.toLowerCase();

  // Common climate-disqualifiers regardless of cluster
  const universalSkips = [
    "arizona",
    "phoenix",
    "los angeles",
    "florida",
    "miami",
    "texas",
    "hurricane",
    "subtropical",
    "drought tolerant",
    "year round outdoor",
    "palm tree",
    "saint augustine grass",
    "stucco",
    "adobe",
  ];

  const universalKeeps = [
    "cold climate",
    "northern",
    "snow",
    "winter",
    "freeze",
    "frost",
    "lake effect",
    "great lakes",
    "midwest",
    "northeast",
    "pa ",
    "pennsylvania",
    "erie",
  ];

  let hitsSkip = 0;
  let hitsKeep = 0;
  for (const phrase of universalSkips) {
    if (haystack.includes(phrase)) hitsSkip++;
  }
  for (const phrase of universalKeeps) {
    if (haystack.includes(phrase)) hitsKeep++;
  }

  // Check cluster-specific excludes
  for (const skip of guide.erieFilterExcludes) {
    const sk = skip.toLowerCase();
    // Extract the meaningful noun/phrase (e.g. "Subtropical pest content")
    const lead = sk.split(/[(,—-]/)[0].trim();
    if (lead.length > 4 && haystack.includes(lead)) {
      hitsSkip += 2;
    }
  }

  // Raw: -1 (heavy disqualifier) to +1 (strong match)
  let raw = 0;
  if (hitsSkip > 0) {
    raw -= Math.min(1, hitsSkip * 0.5);
    penalties.push(
      `Climate mismatch (${hitsSkip} disqualifying terms in title/description)`
    );
  }
  if (hitsKeep > 0) {
    raw += Math.min(1, hitsKeep * 0.3);
    positives.push(`Cold-climate signal (${hitsKeep} matching terms)`);
  }

  // Convert -1..1 to -20..+20 points
  return {
    score: raw * WEIGHTS.erieFilter,
    positives,
    penalties,
  };
}

// ── Public scorer ────────────────────────────────────────────────────

export function scoreVideo(v: VideoCandidate, guide: CurationGuide): ScoreBreakdown {
  const recency = scoreRecency(v.publishedAt);
  const engagement = scoreEngagement(v);
  const length = scoreLength(v.durationSec);
  const relevance = scoreRelevance(v, guide);
  const erieFilter = scoreErieFilter(v, guide);

  const total =
    recency.score +
    engagement.score +
    length.score +
    relevance.score +
    erieFilter.score;

  // Clamp to 0..100. Erie filter can push negative, so floor at 0.
  const clamped = Math.max(0, Math.min(100, total));

  return {
    total: Math.round(clamped * 10) / 10,
    recency: Math.round(recency.score * 10) / 10,
    engagement: Math.round(engagement.score * 10) / 10,
    length: Math.round(length.score * 10) / 10,
    relevance: Math.round(relevance.score * 10) / 10,
    erieFilter: Math.round(erieFilter.score * 10) / 10,
    positives: [
      ...recency.positives,
      ...engagement.positives,
      ...length.positives,
      ...relevance.positives,
      ...erieFilter.positives,
    ],
    penalties: [
      ...recency.penalties,
      ...engagement.penalties,
      ...length.penalties,
      ...relevance.penalties,
      ...erieFilter.penalties,
    ],
  };
}

/** Convert ISO 8601 duration (e.g. "PT5M32S") to seconds */
export function iso8601DurationToSeconds(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, h, mn, s] = m;
  return (parseInt(h ?? "0", 10) * 3600) + (parseInt(mn ?? "0", 10) * 60) + parseInt(s ?? "0", 10);
}
