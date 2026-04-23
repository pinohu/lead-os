import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VistaSocialConfig {
  apiKey: string;
  baseUrl: string;
}

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "pinterest"
  | "youtube";

export interface SocialProfile {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  followers: number;
  connected: boolean;
  tenantId?: string;
}

export interface SocialPost {
  id: string;
  profileIds: string[];
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  platforms: SocialPlatform[];
  tenantId?: string;
  createdAt: string;
}

export interface PostPerformance {
  postId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
}

export interface ContentCalendarEntry {
  date: string;
  posts: SocialPost[];
}

export interface SchedulePostInput {
  profileIds: string[];
  content: string;
  mediaUrls?: string[];
  scheduledAt: string;
  platforms: SocialPlatform[];
  tenantId?: string;
}

export interface SocialAnalytics {
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPlatform: SocialPlatform;
  topPost?: SocialPost;
  byPlatform: Record<
    SocialPlatform,
    { posts: number; impressions: number; engagement: number }
  >;
}

// ---------------------------------------------------------------------------
// Platform character limits for content adaptation
// ---------------------------------------------------------------------------

const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200,
  pinterest: 500,
  youtube: 5000,
};

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const profileStore = new Map<string, SocialProfile>();
const postStore = new Map<string, SocialPost>();
const performanceStore = new Map<string, PostPerformance>();

// ---------------------------------------------------------------------------
// DB schema lazy-init
// ---------------------------------------------------------------------------

let schemaEnsured = false;

async function ensureVistaSocialSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) {
    schemaEnsured = true;
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_vista_social (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    schemaEnsured = true;
  }
}

async function persistToDb(
  id: string,
  type: string,
  tenantId: string | undefined,
  payload: unknown,
): Promise<void> {
  await ensureVistaSocialSchema();
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO lead_os_vista_social (id, type, tenant_id, payload)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET payload = $4`,
      [id, type, tenantId ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failure is non-fatal; in-memory store is source of truth
  }
}

async function deleteFromDb(id: string): Promise<void> {
  await ensureVistaSocialSchema();
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query("DELETE FROM lead_os_vista_social WHERE id = $1", [id]);
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveVistaSocialConfig(): VistaSocialConfig | null {
  const apiKey = process.env.VISTA_SOCIAL_API_KEY ?? "";
  const baseUrl =
    process.env.VISTA_SOCIAL_BASE_URL ?? "https://api.vistasocial.com/v1";
  if (!apiKey) return null;
  return { apiKey, baseUrl };
}

export function isVistaSocialDryRun(): boolean {
  return !process.env.VISTA_SOCIAL_API_KEY;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function connectProfile(
  platform: SocialPlatform,
  handle: string,
  tenantId?: string,
): Promise<SocialProfile> {
  const profile: SocialProfile = {
    id: `vsp-${randomUUID()}`,
    platform,
    name: handle,
    handle,
    followers: 0,
    connected: true,
    tenantId,
  };

  if (!isVistaSocialDryRun()) {
    const cfg = resolveVistaSocialConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({ platform, handle }),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { profile?: SocialProfile };
          if (data.profile) {
            profileStore.set(data.profile.id, { ...data.profile, tenantId });
            await persistToDb(data.profile.id, "profile", tenantId, data.profile);
            return { ...data.profile, tenantId };
          }
        }
      } catch {
        // fall through to local store
      }
    }
  }

  profileStore.set(profile.id, profile);
  await persistToDb(profile.id, "profile", tenantId, profile);
  return profile;
}

export async function listProfiles(
  tenantId?: string,
): Promise<SocialProfile[]> {
  const all = [...profileStore.values()];
  if (!tenantId) return all;
  return all.filter((p) => p.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Posts — schedule & publish
// ---------------------------------------------------------------------------

export async function schedulePost(
  input: SchedulePostInput,
): Promise<SocialPost> {
  const now = new Date().toISOString();
  const post: SocialPost = {
    id: `vspost-${randomUUID()}`,
    profileIds: input.profileIds,
    content: input.content,
    mediaUrls: input.mediaUrls,
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    platforms: input.platforms,
    tenantId: input.tenantId,
    createdAt: now,
  };

  if (!isVistaSocialDryRun()) {
    const cfg = resolveVistaSocialConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { post?: SocialPost };
          if (data.post) {
            const merged = { ...post, ...data.post, tenantId: input.tenantId };
            postStore.set(merged.id, merged);
            await persistToDb(merged.id, "post", input.tenantId, merged);
            return merged;
          }
        }
      } catch {
        // fall through
      }
    }
  }

  postStore.set(post.id, post);
  await persistToDb(post.id, "post", input.tenantId, post);
  return post;
}

export async function publishPostNow(
  input: Omit<SchedulePostInput, "scheduledAt">,
): Promise<SocialPost> {
  const now = new Date().toISOString();
  const post: SocialPost = {
    id: `vspost-${randomUUID()}`,
    profileIds: input.profileIds,
    content: input.content,
    mediaUrls: input.mediaUrls,
    publishedAt: now,
    status: "published",
    platforms: input.platforms,
    tenantId: input.tenantId,
    createdAt: now,
  };

  if (!isVistaSocialDryRun()) {
    const cfg = resolveVistaSocialConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/posts/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { post?: SocialPost };
          if (data.post) {
            const merged = { ...post, ...data.post, tenantId: input.tenantId };
            postStore.set(merged.id, merged);
            await persistToDb(merged.id, "post", input.tenantId, merged);
            return merged;
          }
        }
      } catch {
        // fall through
      }
    }
  }

  postStore.set(post.id, post);
  await persistToDb(post.id, "post", input.tenantId, post);
  return post;
}

// ---------------------------------------------------------------------------
// Posts — read, list, delete
// ---------------------------------------------------------------------------

export async function getPost(postId: string): Promise<SocialPost | undefined> {
  return postStore.get(postId);
}

export async function listPosts(
  tenantId?: string,
  status?: string,
): Promise<SocialPost[]> {
  let posts = [...postStore.values()];
  if (tenantId) {
    posts = posts.filter((p) => p.tenantId === tenantId);
  }
  if (status) {
    posts = posts.filter((p) => p.status === status);
  }
  return posts;
}

export async function deletePost(postId: string): Promise<boolean> {
  const post = postStore.get(postId);
  if (!post) return false;

  if (post.status === "published") return false;

  if (!isVistaSocialDryRun()) {
    const cfg = resolveVistaSocialConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/posts/${postId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        // fall through
      }
    }
  }

  postStore.delete(postId);
  performanceStore.delete(postId);
  await deleteFromDb(postId);
  return true;
}

// ---------------------------------------------------------------------------
// Performance metrics
// ---------------------------------------------------------------------------

export async function getPostPerformance(
  postId: string,
): Promise<PostPerformance | null> {
  const post = postStore.get(postId);
  if (!post) return null;

  const existing = performanceStore.get(postId);
  if (existing) return existing;

  if (!isVistaSocialDryRun()) {
    const cfg = resolveVistaSocialConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/posts/${postId}/performance`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { performance?: PostPerformance };
          if (data.performance) {
            performanceStore.set(postId, data.performance);
            return data.performance;
          }
        }
      } catch {
        // fall through to generated metrics
      }
    }
  }

  // Generate realistic dry-run metrics based on platform
  const platform = post.platforms[0] ?? "facebook";
  const baseMultiplier = platformEngagementMultiplier(platform);
  const impressions = Math.floor(1000 * baseMultiplier);
  const reach = Math.floor(impressions * 0.7);
  const likes = Math.floor(impressions * 0.04 * baseMultiplier);
  const comments = Math.floor(impressions * 0.008 * baseMultiplier);
  const shares = Math.floor(impressions * 0.012 * baseMultiplier);
  const clicks = Math.floor(impressions * 0.025 * baseMultiplier);
  const totalEngagement = likes + comments + shares + clicks;
  const engagementRate =
    impressions > 0
      ? Math.round((totalEngagement / impressions) * 10000) / 10000
      : 0;

  const perf: PostPerformance = {
    postId,
    impressions,
    reach,
    likes,
    comments,
    shares,
    clicks,
    engagementRate,
  };

  performanceStore.set(postId, perf);
  return perf;
}

function platformEngagementMultiplier(platform: SocialPlatform): number {
  const multipliers: Record<SocialPlatform, number> = {
    tiktok: 2.5,
    instagram: 1.8,
    linkedin: 1.5,
    twitter: 1.0,
    facebook: 1.2,
    pinterest: 0.9,
    youtube: 2.0,
  };
  return multipliers[platform];
}

// ---------------------------------------------------------------------------
// Content calendar
// ---------------------------------------------------------------------------

export async function getContentCalendar(
  startDate: string,
  endDate: string,
  tenantId?: string,
): Promise<ContentCalendarEntry[]> {
  const startStr = startDate.slice(0, 10);
  const endStr = endDate.slice(0, 10);
  const posts = await listPosts(tenantId);

  const dateMap = new Map<string, SocialPost[]>();

  for (const post of posts) {
    const postDate = post.scheduledAt ?? post.publishedAt ?? post.createdAt;
    const dateKey = new Date(postDate).toISOString().slice(0, 10);
    if (dateKey >= startStr && dateKey <= endStr) {
      const existing = dateMap.get(dateKey) ?? [];
      existing.push(post);
      dateMap.set(dateKey, existing);
    }
  }

  const entries: ContentCalendarEntry[] = [];
  const current = new Date(startStr + "T00:00:00Z");
  const endDate_ = new Date(endStr + "T00:00:00Z");
  while (current <= endDate_) {
    const dateKey = current.toISOString().slice(0, 10);
    entries.push({ date: dateKey, posts: dateMap.get(dateKey) ?? [] });
    current.setDate(current.getDate() + 1);
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getAnalytics(
  tenantId?: string,
): Promise<SocialAnalytics> {
  const posts = await listPosts(tenantId);

  const allPlatforms: SocialPlatform[] = [
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "tiktok",
    "pinterest",
    "youtube",
  ];

  const byPlatform = {} as Record<
    SocialPlatform,
    { posts: number; impressions: number; engagement: number }
  >;
  for (const p of allPlatforms) {
    byPlatform[p] = { posts: 0, impressions: 0, engagement: 0 };
  }

  let totalImpressions = 0;
  let totalEngagement = 0;
  let topPostEngagement = -1;
  let topPost: SocialPost | undefined;

  for (const post of posts) {
    const perf = await getPostPerformance(post.id);
    if (!perf) continue;

    const engagement = perf.likes + perf.comments + perf.shares + perf.clicks;
    totalImpressions += perf.impressions;
    totalEngagement += engagement;

    if (engagement > topPostEngagement) {
      topPostEngagement = engagement;
      topPost = post;
    }

    for (const platform of post.platforms) {
      byPlatform[platform].posts += 1;
      byPlatform[platform].impressions += perf.impressions;
      byPlatform[platform].engagement += engagement;
    }
  }

  let topPlatform: SocialPlatform = "facebook";
  let topPlatformEngagement = -1;
  for (const p of allPlatforms) {
    if (byPlatform[p].engagement > topPlatformEngagement) {
      topPlatformEngagement = byPlatform[p].engagement;
      topPlatform = p;
    }
  }

  const avgEngagementRate =
    totalImpressions > 0
      ? Math.round((totalEngagement / totalImpressions) * 10000) / 10000
      : 0;

  return {
    totalPosts: posts.length,
    totalImpressions,
    totalEngagement,
    avgEngagementRate,
    topPlatform,
    topPost,
    byPlatform,
  };
}

// ---------------------------------------------------------------------------
// Content distribution (copilot convenience)
// ---------------------------------------------------------------------------

function adaptContentForPlatform(
  content: string,
  platform: SocialPlatform,
): string {
  const limit = PLATFORM_CHAR_LIMITS[platform];
  if (content.length <= limit) return content;
  return content.slice(0, limit - 3) + "...";
}

export async function distributeCopilotContent(
  content: string,
  platforms: SocialPlatform[],
  tenantId?: string,
): Promise<SocialPost[]> {
  const profiles = await listProfiles(tenantId);
  const results: SocialPost[] = [];

  for (const platform of platforms) {
    const matchingProfiles = profiles.filter((p) => p.platform === platform);
    const profileIds =
      matchingProfiles.length > 0
        ? matchingProfiles.map((p) => p.id)
        : [`auto-${platform}`];

    const adapted = adaptContentForPlatform(content, platform);

    const scheduledAt = new Date(Date.now() + 3600_000).toISOString();
    const post = await schedulePost({
      profileIds,
      content: adapted,
      scheduledAt,
      platforms: [platform],
      tenantId,
    });
    results.push(post);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function postVistaResult(
  operation: string,
  detail: string,
): ProviderResult {
  return {
    ok: true,
    provider: "VistaSocial",
    mode: isVistaSocialDryRun() ? "dry-run" : "live",
    detail,
    payload: { operation },
  };
}

// ---------------------------------------------------------------------------
// Store reset (for tests)
// ---------------------------------------------------------------------------

export function resetVistaSocialStore(): void {
  profileStore.clear();
  postStore.clear();
  performanceStore.clear();
  schemaEnsured = false;
}
