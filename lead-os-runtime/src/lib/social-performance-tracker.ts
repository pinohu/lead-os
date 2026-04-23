import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughRate: number;
  leadConversions: number;
  revenue: number;
}

export interface TrackedPost {
  id: string;
  tenantId: string;
  platform: string;
  contentId: string;
  topic: string;
  hookType: string;
  metrics: PostMetrics;
  publishedAt: string;
  lastUpdatedAt: string;
}

export interface ContentROI {
  contentId: string;
  platform: string;
  leadsPerPost: number;
  revenuePerPost: number;
  costPerLead: number;
  engagementRate: number;
  roi: number;
}

export interface WinningPattern {
  pattern: string;
  occurrences: number;
  avgEngagementRate: number;
  avgLeadConversions: number;
  platforms: string[];
}

export interface PerformanceSummary {
  tenantId: string;
  totalPosts: number;
  totalViews: number;
  totalLeads: number;
  totalRevenue: number;
  avgEngagementRate: number;
  avgLeadsPerPost: number;
  topPosts: TrackedPost[];
  platformBreakdown: Record<string, { posts: number; views: number; leads: number; revenue: number }>;
  winningPatterns: WinningPattern[];
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const postStore = new Map<string, TrackedPost[]>();

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export function trackPost(
  tenantId: string,
  post: Omit<TrackedPost, "id" | "tenantId" | "lastUpdatedAt">,
): TrackedPost {
  const record: TrackedPost = {
    ...post,
    id: crypto.randomUUID(),
    tenantId,
    lastUpdatedAt: new Date().toISOString(),
  };

  const existing = postStore.get(tenantId) ?? [];
  existing.push(record);
  postStore.set(tenantId, existing);

  return record;
}

export function updatePostMetrics(
  tenantId: string,
  postId: string,
  metrics: Partial<PostMetrics>,
): TrackedPost | undefined {
  const posts = postStore.get(tenantId) ?? [];
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return undefined;

  posts[idx] = {
    ...posts[idx],
    metrics: { ...posts[idx].metrics, ...metrics },
    lastUpdatedAt: new Date().toISOString(),
  };

  return posts[idx];
}

export function getTrackedPosts(tenantId: string): TrackedPost[] {
  return postStore.get(tenantId) ?? [];
}

export function getPostsByPlatform(tenantId: string, platform: string): TrackedPost[] {
  const posts = postStore.get(tenantId) ?? [];
  return posts.filter((p) => p.platform === platform);
}

// ---------------------------------------------------------------------------
// ROI calculation
// ---------------------------------------------------------------------------

function calculateEngagementRate(metrics: PostMetrics): number {
  if (metrics.views === 0) return 0;
  const engagements = metrics.likes + metrics.comments + metrics.shares + metrics.saves;
  return Number((engagements / metrics.views).toFixed(4));
}

export function calculateContentROI(post: TrackedPost, costPerPost: number = 0): ContentROI {
  const engagementRate = calculateEngagementRate(post.metrics);
  const roi = costPerPost > 0
    ? Number(((post.metrics.revenue - costPerPost) / costPerPost).toFixed(2))
    : post.metrics.revenue > 0 ? 999 : 0;

  const costPerLead = post.metrics.leadConversions > 0 && costPerPost > 0
    ? Number((costPerPost / post.metrics.leadConversions).toFixed(2))
    : 0;

  return {
    contentId: post.contentId,
    platform: post.platform,
    leadsPerPost: post.metrics.leadConversions,
    revenuePerPost: post.metrics.revenue,
    costPerLead,
    engagementRate,
    roi,
  };
}

// ---------------------------------------------------------------------------
// Pattern detection
// ---------------------------------------------------------------------------

export function identifyWinningPatterns(tenantId: string): WinningPattern[] {
  const posts = postStore.get(tenantId) ?? [];
  if (posts.length === 0) return [];

  const hookTypeGroups = new Map<string, TrackedPost[]>();
  const platformGroups = new Map<string, TrackedPost[]>();
  const topicGroups = new Map<string, TrackedPost[]>();

  for (const post of posts) {
    const hookGroup = hookTypeGroups.get(post.hookType) ?? [];
    hookGroup.push(post);
    hookTypeGroups.set(post.hookType, hookGroup);

    const platGroup = platformGroups.get(post.platform) ?? [];
    platGroup.push(post);
    platformGroups.set(post.platform, platGroup);

    const topicGroup = topicGroups.get(post.topic) ?? [];
    topicGroup.push(post);
    topicGroups.set(post.topic, topicGroup);
  }

  const patterns: WinningPattern[] = [];

  for (const [hookType, group] of hookTypeGroups) {
    if (group.length < 2) continue;
    const avgEng = group.reduce((s, p) => s + calculateEngagementRate(p.metrics), 0) / group.length;
    const avgLeads = group.reduce((s, p) => s + p.metrics.leadConversions, 0) / group.length;
    const platforms = [...new Set(group.map((p) => p.platform))];

    patterns.push({
      pattern: `hook-type:${hookType}`,
      occurrences: group.length,
      avgEngagementRate: Number(avgEng.toFixed(4)),
      avgLeadConversions: Number(avgLeads.toFixed(2)),
      platforms,
    });
  }

  for (const [topic, group] of topicGroups) {
    if (group.length < 2) continue;
    const avgEng = group.reduce((s, p) => s + calculateEngagementRate(p.metrics), 0) / group.length;
    const avgLeads = group.reduce((s, p) => s + p.metrics.leadConversions, 0) / group.length;
    const platforms = [...new Set(group.map((p) => p.platform))];

    patterns.push({
      pattern: `topic:${topic}`,
      occurrences: group.length,
      avgEngagementRate: Number(avgEng.toFixed(4)),
      avgLeadConversions: Number(avgLeads.toFixed(2)),
      platforms,
    });
  }

  return patterns.sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

// ---------------------------------------------------------------------------
// Performance summary
// ---------------------------------------------------------------------------

export function getPerformanceSummary(tenantId: string): PerformanceSummary {
  const posts = postStore.get(tenantId) ?? [];

  const totalViews = posts.reduce((s, p) => s + p.metrics.views, 0);
  const totalLeads = posts.reduce((s, p) => s + p.metrics.leadConversions, 0);
  const totalRevenue = posts.reduce((s, p) => s + p.metrics.revenue, 0);
  const avgEngagement = posts.length > 0
    ? posts.reduce((s, p) => s + calculateEngagementRate(p.metrics), 0) / posts.length
    : 0;

  const platformBreakdown: PerformanceSummary["platformBreakdown"] = {};
  for (const post of posts) {
    const entry = platformBreakdown[post.platform] ?? { posts: 0, views: 0, leads: 0, revenue: 0 };
    entry.posts += 1;
    entry.views += post.metrics.views;
    entry.leads += post.metrics.leadConversions;
    entry.revenue += post.metrics.revenue;
    platformBreakdown[post.platform] = entry;
  }

  const topPosts = [...posts]
    .sort((a, b) => calculateEngagementRate(b.metrics) - calculateEngagementRate(a.metrics))
    .slice(0, 10);

  return {
    tenantId,
    totalPosts: posts.length,
    totalViews,
    totalLeads,
    totalRevenue,
    avgEngagementRate: Number(avgEngagement.toFixed(4)),
    avgLeadsPerPost: posts.length > 0 ? Number((totalLeads / posts.length).toFixed(2)) : 0,
    topPosts,
    platformBreakdown,
    winningPatterns: identifyWinningPatterns(tenantId),
  };
}

export function _resetStores(): void {
  postStore.clear();
}
