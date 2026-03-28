import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeiroConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AvatarVideo {
  id: string;
  tenantId: string;
  avatarId: string;
  script: string;
  language: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  createdAt: string;
  completedAt?: string;
}

export interface Avatar {
  id: string;
  name: string;
  gender: "male" | "female";
  style: "business" | "casual" | "presenter";
  previewUrl: string;
}

export interface BatchJob {
  id: string;
  tenantId: string;
  videoIds: string[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const videoStore = new Map<string, AvatarVideo>();
const batchStore = new Map<string, BatchJob>();

export function resetMeiroStore(): void {
  videoStore.clear();
  batchStore.clear();
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: MeiroConfig): MeiroConfig {
  return {
    apiKey: config?.apiKey ?? process.env.MEIRO_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.MEIRO_BASE_URL ?? "https://api.meiro.io/v1",
  };
}

// ---------------------------------------------------------------------------
// Built-in avatars
// ---------------------------------------------------------------------------

export const AVAILABLE_AVATARS: Avatar[] = [
  { id: "avatar-business-m1", name: "James", gender: "male", style: "business", previewUrl: "https://assets.meiro.io/avatars/james.png" },
  { id: "avatar-business-f1", name: "Sarah", gender: "female", style: "business", previewUrl: "https://assets.meiro.io/avatars/sarah.png" },
  { id: "avatar-casual-m1", name: "Alex", gender: "male", style: "casual", previewUrl: "https://assets.meiro.io/avatars/alex.png" },
  { id: "avatar-casual-f1", name: "Maya", gender: "female", style: "casual", previewUrl: "https://assets.meiro.io/avatars/maya.png" },
  { id: "avatar-presenter-m1", name: "David", gender: "male", style: "presenter", previewUrl: "https://assets.meiro.io/avatars/david.png" },
  { id: "avatar-presenter-f1", name: "Lisa", gender: "female", style: "presenter", previewUrl: "https://assets.meiro.io/avatars/lisa.png" },
];

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: MeiroConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "Meiro API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "Meiro connection verified" }
      : { ok: false, message: `Meiro returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Video generation
// ---------------------------------------------------------------------------

export async function generateVideo(
  tenantId: string,
  avatarId: string,
  script: string,
  language = "en",
): Promise<AvatarVideo> {
  const now = new Date().toISOString();
  const video: AvatarVideo = {
    id: `mvid-${randomUUID()}`,
    tenantId,
    avatarId,
    script,
    language,
    status: "completed",
    videoUrl: `https://cdn.meiro.io/videos/${randomUUID()}.mp4`,
    thumbnailUrl: `https://cdn.meiro.io/thumbs/${randomUUID()}.jpg`,
    durationSeconds: Math.ceil(script.split(/\s+/).length / 2.5),
    createdAt: now,
    completedAt: now,
  };
  videoStore.set(video.id, video);
  return video;
}

export async function getVideo(videoId: string): Promise<AvatarVideo | undefined> {
  return videoStore.get(videoId);
}

export async function listVideos(tenantId: string): Promise<AvatarVideo[]> {
  return [...videoStore.values()].filter((v) => v.tenantId === tenantId);
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  return videoStore.delete(videoId);
}

// ---------------------------------------------------------------------------
// Batch generation
// ---------------------------------------------------------------------------

export async function generateBatch(
  tenantId: string,
  requests: { avatarId: string; script: string; language?: string }[],
): Promise<BatchJob> {
  const videos = await Promise.all(
    requests.map((r) => generateVideo(tenantId, r.avatarId, r.script, r.language)),
  );

  const batch: BatchJob = {
    id: `batch-${randomUUID()}`,
    tenantId,
    videoIds: videos.map((v) => v.id),
    status: "completed",
    createdAt: new Date().toISOString(),
  };
  batchStore.set(batch.id, batch);
  return batch;
}

export async function getBatchJob(batchId: string): Promise<BatchJob | undefined> {
  return batchStore.get(batchId);
}

// ---------------------------------------------------------------------------
// Personalized outreach
// ---------------------------------------------------------------------------

export async function generatePersonalizedVideo(
  tenantId: string,
  avatarId: string,
  recipientName: string,
  scriptTemplate: string,
  language = "en",
): Promise<AvatarVideo> {
  const personalizedScript = scriptTemplate.replace(/\{\{name\}\}/g, recipientName);
  return generateVideo(tenantId, avatarId, personalizedScript, language);
}

export function getAvatars(): Avatar[] {
  return AVAILABLE_AVATARS;
}
