import { randomUUID } from "crypto";
import { generateContentBatch } from "../social-asset-engine.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SocialPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "x"
  | "threads";

export interface SocialPost {
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: string;
  metadata?: Record<string, string>;
}

export interface PublishResult {
  id: string;
  platform: SocialPlatform;
  status: "published" | "scheduled" | "failed" | "dry-run";
  postUrl?: string;
  publishedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const scheduledPostStore = new Map<string, { tenantId: string; result: PublishResult; post: SocialPost }>();
const publishHistoryStore = new Map<string, PublishResult[]>();
const postMetricsStore = new Map<string, { impressions: number; engagements: number; clicks: number; shares: number }>();

export function resetPublisherStore(): void {
  scheduledPostStore.clear();
  publishHistoryStore.clear();
  postMetricsStore.clear();
}

// ---------------------------------------------------------------------------
// Config detection
// ---------------------------------------------------------------------------

function getPostizConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["POSTIZ_API_KEY"];
  const baseUrl = process.env["POSTIZ_URL"];

  if (
    typeof apiKey === "string" && apiKey.trim().length > 0 &&
    typeof baseUrl === "string" && baseUrl.trim().length > 0
  ) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.trim() };
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

function recordHistory(tenantId: string, result: PublishResult): void {
  const existing = publishHistoryStore.get(tenantId) ?? [];
  existing.unshift(result);
  publishHistoryStore.set(tenantId, existing);
}

// ---------------------------------------------------------------------------
// Postiz adapter
// ---------------------------------------------------------------------------

async function postizPublish(
  tenantId: string,
  post: SocialPost,
  config: { apiKey: string; baseUrl: string },
  isScheduled: boolean,
): Promise<PublishResult> {
  const endpoint = config.baseUrl.replace(/\/$/, "");

  const body: Record<string, unknown> = {
    tenantId,
    platform: post.platform,
    content: post.content,
    mediaUrls: post.mediaUrls ?? [],
    hashtags: post.hashtags ?? [],
  };

  if (isScheduled && post.scheduledAt) {
    body["scheduledAt"] = post.scheduledAt;
  }

  const response = await fetch(`${endpoint}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Postiz returned ${response.status}`);
  }

  const data = (await response.json()) as {
    id?: string;
    postUrl?: string;
    publishedAt?: string;
    status?: string;
  };

  const id = data.id ?? randomUUID();
  const now = new Date().toISOString();
  const status = isScheduled ? "scheduled" : "published";

  return {
    id,
    platform: post.platform,
    status: status as PublishResult["status"],
    postUrl: data.postUrl,
    publishedAt: data.publishedAt ?? now,
  };
}

// ---------------------------------------------------------------------------
// Dry-run helpers
// ---------------------------------------------------------------------------

function buildDryRunResult(platform: SocialPlatform, isScheduled: boolean): PublishResult {
  const id = randomUUID();
  return {
    id,
    platform,
    status: "dry-run",
    postUrl: `https://dry-run.example.com/posts/${id}`,
    publishedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Core exports
// ---------------------------------------------------------------------------

export async function publishPost(tenantId: string, post: SocialPost): Promise<PublishResult> {
  const config = getPostizConfig();

  let result: PublishResult;

  if (config) {
    try {
      result = await postizPublish(tenantId, post, config, false);
    } catch {
      result = { ...buildDryRunResult(post.platform, false), status: "failed" };
    }
  } else {
    result = buildDryRunResult(post.platform, false);
  }

  recordHistory(tenantId, result);
  return result;
}

export async function publishBatch(tenantId: string, posts: SocialPost[]): Promise<PublishResult[]> {
  return Promise.all(posts.map((post) => publishPost(tenantId, post)));
}

export async function schedulePost(tenantId: string, post: SocialPost): Promise<PublishResult> {
  const config = getPostizConfig();

  let result: PublishResult;

  if (config) {
    try {
      result = await postizPublish(tenantId, post, config, true);
    } catch {
      result = { ...buildDryRunResult(post.platform, true), status: "scheduled" };
    }
  } else {
    result = { ...buildDryRunResult(post.platform, true), status: "scheduled" };
  }

  scheduledPostStore.set(result.id, { tenantId, result, post });
  recordHistory(tenantId, result);
  return result;
}

export async function getScheduledPosts(tenantId: string): Promise<PublishResult[]> {
  return [...scheduledPostStore.values()]
    .filter((entry) => entry.tenantId === tenantId)
    .map((entry) => entry.result);
}

export async function cancelScheduledPost(postId: string): Promise<boolean> {
  const entry = scheduledPostStore.get(postId);
  if (!entry) return false;

  const config = getPostizConfig();
  if (config) {
    try {
      const endpoint = config.baseUrl.replace(/\/$/, "");
      const response = await fetch(`${endpoint}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      if (!response.ok) {
        return false;
      }
    } catch {
      return false;
    }
  }

  scheduledPostStore.delete(postId);

  // Remove from history
  const history = publishHistoryStore.get(entry.tenantId) ?? [];
  publishHistoryStore.set(
    entry.tenantId,
    history.filter((r) => r.id !== postId),
  );

  return true;
}

export async function getPublishHistory(
  tenantId: string,
  platform?: SocialPlatform,
  limit = 50,
): Promise<PublishResult[]> {
  const history = publishHistoryStore.get(tenantId) ?? [];
  const filtered = platform ? history.filter((r) => r.platform === platform) : history;
  return filtered.slice(0, limit);
}

export async function getPostMetrics(
  postId: string,
): Promise<{ impressions: number; engagements: number; clicks: number; shares: number } | null> {
  const cached = postMetricsStore.get(postId);
  if (cached) return cached;

  const config = getPostizConfig();
  if (config) {
    try {
      const endpoint = config.baseUrl.replace(/\/$/, "");
      const response = await fetch(`${endpoint}/api/posts/${postId}/metrics`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        impressions?: number;
        engagements?: number;
        clicks?: number;
        shares?: number;
      };

      const metrics = {
        impressions: data.impressions ?? 0,
        engagements: data.engagements ?? 0,
        clicks: data.clicks ?? 0,
        shares: data.shares ?? 0,
      };

      postMetricsStore.set(postId, metrics);
      return metrics;
    } catch {
      return null;
    }
  }

  // Return null when there is no real data source
  return null;
}

// ---------------------------------------------------------------------------
// Convenience: generate + publish
// ---------------------------------------------------------------------------

const SOCIAL_ASSET_PLATFORM_MAP: Record<SocialPlatform, "tiktok" | "instagram-reels" | "youtube-shorts" | "linkedin" | "x" | "facebook"> = {
  tiktok: "tiktok",
  instagram: "instagram-reels",
  youtube: "youtube-shorts",
  facebook: "facebook",
  linkedin: "linkedin",
  x: "x",
  threads: "x", // closest match
};

export async function generateAndPublish(
  tenantId: string,
  topic: string,
  niche: string,
  platforms: SocialPlatform[],
): Promise<PublishResult[]> {
  const assetPlatforms = platforms.map((p) => SOCIAL_ASSET_PLATFORM_MAP[p]);
  const batch = generateContentBatch(topic, niche, assetPlatforms, tenantId);

  const posts: SocialPost[] = platforms.map((platform, i) => {
    const asset = batch.assets[i];
    const script = asset?.script;
    const hook = asset?.hook;
    const content = hook ? hook.text : topic;
    const hashtags = script?.hashtags ?? [];

    return {
      platform,
      content,
      hashtags,
    };
  });

  return publishBatch(tenantId, posts);
}
