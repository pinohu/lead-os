import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentStatus = "published" | "scheduled" | "draft" | "archived";

export interface ContentFingerprint {
  topicHash: string;
  hookHash: string;
  angleHash: string;
}

export interface PlatformMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughRate: number;
  engagementRate: number;
}

export interface ContentEntry {
  id: string;
  tenantId: string;
  platform: string;
  topic: string;
  hookText: string;
  angleText: string;
  fingerprint: ContentFingerprint;
  status: ContentStatus;
  metrics: PlatformMetrics;
  publishedAt: string | null;
  createdAt: string;
}

export interface TopicExhaustion {
  topic: string;
  postCount: number;
  avgEngagement: number;
  trend: "rising" | "stable" | "declining" | "exhausted";
  lastPublishedAt: string;
}

export interface ContentMemorySummary {
  tenantId: string;
  totalEntries: number;
  publishedCount: number;
  platformBreakdown: Record<string, number>;
  topPerformers: ContentEntry[];
  exhaustedTopics: TopicExhaustion[];
  recentEntries: ContentEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function createFingerprint(topic: string, hookText: string, angleText: string): ContentFingerprint {
  return {
    topicHash: hashString(topic.toLowerCase().trim()),
    hookHash: hashString(hookText.toLowerCase().trim()),
    angleHash: hashString(angleText.toLowerCase().trim()),
  };
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, ContentEntry[]>();

export function recordContent(
  tenantId: string,
  entry: Omit<ContentEntry, "id" | "tenantId" | "fingerprint" | "createdAt">,
): ContentEntry {
  const now = new Date().toISOString();
  const record: ContentEntry = {
    ...entry,
    id: crypto.randomUUID(),
    tenantId,
    fingerprint: createFingerprint(entry.topic, entry.hookText, entry.angleText),
    createdAt: now,
  };

  const existing = memoryStore.get(tenantId) ?? [];
  existing.push(record);
  memoryStore.set(tenantId, existing);

  return record;
}

export function getContentByTenant(tenantId: string): ContentEntry[] {
  return memoryStore.get(tenantId) ?? [];
}

export function getContentByPlatform(tenantId: string, platform: string): ContentEntry[] {
  const entries = memoryStore.get(tenantId) ?? [];
  return entries.filter((e) => e.platform === platform);
}

export function updateContentMetrics(
  tenantId: string,
  contentId: string,
  metrics: Partial<PlatformMetrics>,
): ContentEntry | undefined {
  const entries = memoryStore.get(tenantId) ?? [];
  const idx = entries.findIndex((e) => e.id === contentId);
  if (idx === -1) return undefined;

  entries[idx] = {
    ...entries[idx],
    metrics: { ...entries[idx].metrics, ...metrics },
  };

  return entries[idx];
}

export function updateContentStatus(
  tenantId: string,
  contentId: string,
  status: ContentStatus,
): ContentEntry | undefined {
  const entries = memoryStore.get(tenantId) ?? [];
  const idx = entries.findIndex((e) => e.id === contentId);
  if (idx === -1) return undefined;

  entries[idx] = {
    ...entries[idx],
    status,
    publishedAt: status === "published" ? new Date().toISOString() : entries[idx].publishedAt,
  };

  return entries[idx];
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

export function isDuplicate(tenantId: string, topic: string, hookText: string, angleText: string): boolean {
  const entries = memoryStore.get(tenantId) ?? [];
  const fp = createFingerprint(topic, hookText, angleText);

  return entries.some(
    (e) =>
      e.fingerprint.topicHash === fp.topicHash &&
      e.fingerprint.hookHash === fp.hookHash &&
      e.fingerprint.angleHash === fp.angleHash,
  );
}

export function isSimilarHook(tenantId: string, hookText: string): boolean {
  const entries = memoryStore.get(tenantId) ?? [];
  const hookHash = hashString(hookText.toLowerCase().trim());
  return entries.some((e) => e.fingerprint.hookHash === hookHash);
}

// ---------------------------------------------------------------------------
// Topic exhaustion detection
// ---------------------------------------------------------------------------

export function analyzeTopicExhaustion(tenantId: string): TopicExhaustion[] {
  const entries = memoryStore.get(tenantId) ?? [];
  const topicMap = new Map<string, ContentEntry[]>();

  for (const entry of entries) {
    const normalized = entry.topic.toLowerCase().trim();
    const group = topicMap.get(normalized) ?? [];
    group.push(entry);
    topicMap.set(normalized, group);
  }

  const exhaustionData: TopicExhaustion[] = [];

  for (const [topic, group] of topicMap) {
    const published = group.filter((e) => e.status === "published");
    const avgEngagement = published.length > 0
      ? published.reduce((sum, e) => sum + e.metrics.engagementRate, 0) / published.length
      : 0;

    const sorted = [...published].sort(
      (a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime(),
    );

    let trend: TopicExhaustion["trend"] = "stable";
    if (published.length >= 5 && avgEngagement < 0.01) {
      trend = "exhausted";
    } else if (published.length >= 3) {
      const recent = sorted.slice(0, 3);
      const older = sorted.slice(3);
      const recentAvg = recent.reduce((s, e) => s + e.metrics.engagementRate, 0) / recent.length;
      const olderAvg = older.length > 0
        ? older.reduce((s, e) => s + e.metrics.engagementRate, 0) / older.length
        : recentAvg;

      if (recentAvg > olderAvg * 1.2) trend = "rising";
      else if (recentAvg < olderAvg * 0.8) trend = "declining";
    }

    exhaustionData.push({
      topic,
      postCount: group.length,
      avgEngagement: Number(avgEngagement.toFixed(4)),
      trend,
      lastPublishedAt: sorted[0]?.publishedAt ?? sorted[0]?.createdAt ?? new Date().toISOString(),
    });
  }

  return exhaustionData;
}

// ---------------------------------------------------------------------------
// Memory summary
// ---------------------------------------------------------------------------

export function getMemorySummary(tenantId: string): ContentMemorySummary {
  const entries = memoryStore.get(tenantId) ?? [];
  const published = entries.filter((e) => e.status === "published");

  const platformBreakdown: Record<string, number> = {};
  for (const entry of entries) {
    platformBreakdown[entry.platform] = (platformBreakdown[entry.platform] ?? 0) + 1;
  }

  const topPerformers = [...published]
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
    .slice(0, 10);

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const exhaustedTopics = analyzeTopicExhaustion(tenantId).filter(
    (t) => t.trend === "exhausted" || t.trend === "declining",
  );

  return {
    tenantId,
    totalEntries: entries.length,
    publishedCount: published.length,
    platformBreakdown,
    topPerformers,
    exhaustedTopics,
    recentEntries,
  };
}

export function _resetStores(): void {
  memoryStore.clear();
}
