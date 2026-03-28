import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GumletConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface HostedVideo {
  id: string;
  tenantId: string;
  title: string;
  sourceUrl: string;
  playbackUrl: string;
  embedCode: string;
  status: "processing" | "ready" | "failed";
  durationSeconds?: number;
  fileSize?: number;
  formats: string[];
  analytics: VideoAnalytics;
  uploadedAt: string;
  readyAt?: string;
}

export interface VideoAnalytics {
  views: number;
  uniqueViewers: number;
  totalWatchTime: number;
  averageWatchPercentage: number;
  completionRate: number;
}

export interface TranscodeProfile {
  id: string;
  name: string;
  resolution: string;
  bitrate: number;
  codec: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const videoStore = new Map<string, HostedVideo>();

export function resetGumletStore(): void {
  videoStore.clear();
}

// ---------------------------------------------------------------------------
// Transcode profiles
// ---------------------------------------------------------------------------

export const TRANSCODE_PROFILES: TranscodeProfile[] = [
  { id: "tp-360p", name: "360p", resolution: "640x360", bitrate: 800, codec: "h264" },
  { id: "tp-720p", name: "720p", resolution: "1280x720", bitrate: 2500, codec: "h264" },
  { id: "tp-1080p", name: "1080p", resolution: "1920x1080", bitrate: 5000, codec: "h264" },
  { id: "tp-4k", name: "4K", resolution: "3840x2160", bitrate: 15000, codec: "h265" },
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: GumletConfig): GumletConfig {
  return {
    apiKey: config?.apiKey ?? process.env.GUMLET_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.GUMLET_BASE_URL ?? "https://api.gumlet.com/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: GumletConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "Gumlet API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "Gumlet connection verified" }
      : { ok: false, message: `Gumlet returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Video upload / hosting
// ---------------------------------------------------------------------------

export async function uploadVideo(
  tenantId: string,
  title: string,
  sourceUrl: string,
): Promise<HostedVideo> {
  const videoId = randomUUID();
  const now = new Date().toISOString();

  const video: HostedVideo = {
    id: `gvid-${videoId}`,
    tenantId,
    title,
    sourceUrl,
    playbackUrl: `https://video.gumlet.io/play/${videoId}`,
    embedCode: `<iframe src="https://video.gumlet.io/embed/${videoId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`,
    status: "ready",
    durationSeconds: 60,
    fileSize: 5_000_000,
    formats: ["h264-720p", "h264-1080p"],
    analytics: {
      views: 0,
      uniqueViewers: 0,
      totalWatchTime: 0,
      averageWatchPercentage: 0,
      completionRate: 0,
    },
    uploadedAt: now,
    readyAt: now,
  };
  videoStore.set(video.id, video);
  return video;
}

export async function getVideo(videoId: string): Promise<HostedVideo | undefined> {
  return videoStore.get(videoId);
}

export async function listVideos(tenantId: string): Promise<HostedVideo[]> {
  return [...videoStore.values()].filter((v) => v.tenantId === tenantId);
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  return videoStore.delete(videoId);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getVideoAnalytics(videoId: string): Promise<VideoAnalytics | undefined> {
  const video = videoStore.get(videoId);
  return video?.analytics;
}

export async function recordView(
  videoId: string,
  watchPercentage: number,
): Promise<VideoAnalytics | undefined> {
  const video = videoStore.get(videoId);
  if (!video) return undefined;

  const a = video.analytics;
  a.views += 1;
  a.uniqueViewers += 1;
  a.totalWatchTime += Math.round((video.durationSeconds ?? 60) * (watchPercentage / 100));
  a.averageWatchPercentage = Math.round(
    (a.averageWatchPercentage * (a.views - 1) + watchPercentage) / a.views,
  );
  a.completionRate = watchPercentage >= 90
    ? Math.round(((a.completionRate * (a.views - 1) + 100) / a.views))
    : Math.round(((a.completionRate * (a.views - 1)) / a.views));

  return a;
}

// ---------------------------------------------------------------------------
// Embed code generation
// ---------------------------------------------------------------------------

export function generateEmbedCode(
  videoId: string,
  width = 640,
  height = 360,
  autoplay = false,
): string {
  const autoplayParam = autoplay ? "?autoplay=1" : "";
  return `<iframe src="https://video.gumlet.io/embed/${videoId}${autoplayParam}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
}

export function getProfiles(): TranscodeProfile[] {
  return TRANSCODE_PROFILES;
}
