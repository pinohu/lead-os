import { randomUUID } from "crypto";
import { BaseAdapter } from "./adapter-base.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZebracatConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface VideoProject {
  id: string;
  tenantId: string;
  title: string;
  script: string;
  style: VideoStyle;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  createdAt: string;
  completedAt?: string;
}

export type VideoStyle = "explainer" | "social-post" | "ad" | "tutorial" | "testimonial";

export interface VideoTemplate {
  id: string;
  name: string;
  style: VideoStyle;
  description: string;
}

// ---------------------------------------------------------------------------
// Shared adapter instance & in-memory stores
// ---------------------------------------------------------------------------

const adapter = new BaseAdapter("Zebracat", "ZEBRACAT", "https://api.zebracat.ai/v1");

const projectStore = new Map<string, VideoProject>();

export function resetZebracatStore(): void {
  projectStore.clear();
  adapter.resetStore();
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  { id: "zt-explainer", name: "Product Explainer", style: "explainer", description: "60-second product explanation video" },
  { id: "zt-social", name: "Social Media Clip", style: "social-post", description: "15-30 second vertical clip for social feeds" },
  { id: "zt-ad", name: "Ad Creative", style: "ad", description: "30-second ad with hook, value, and CTA" },
  { id: "zt-tutorial", name: "How-To Tutorial", style: "tutorial", description: "Step-by-step tutorial walkthrough" },
  { id: "zt-testimonial", name: "Testimonial Highlight", style: "testimonial", description: "Client testimonial with text overlays" },
];

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: ZebracatConfig): Promise<{ ok: boolean; message: string }> {
  return adapter.healthCheck(config);
}

// ---------------------------------------------------------------------------
// Video creation
// ---------------------------------------------------------------------------

export async function createVideo(
  tenantId: string,
  title: string,
  script: string,
  style: VideoStyle = "explainer",
): Promise<VideoProject> {
  const now = new Date().toISOString();
  const project: VideoProject = {
    id: `zvid-${randomUUID()}`,
    tenantId,
    title,
    script,
    style,
    status: "completed",
    videoUrl: `https://cdn.zebracat.ai/videos/${randomUUID()}.mp4`,
    thumbnailUrl: `https://cdn.zebracat.ai/thumbs/${randomUUID()}.jpg`,
    durationSeconds: Math.ceil(script.split(/\s+/).length / 2.5),
    createdAt: now,
    completedAt: now,
  };
  projectStore.set(project.id, project);
  return project;
}

export async function getVideo(videoId: string): Promise<VideoProject | undefined> {
  return projectStore.get(videoId);
}

export async function listVideos(tenantId: string): Promise<VideoProject[]> {
  return [...projectStore.values()].filter((v) => v.tenantId === tenantId);
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  return projectStore.delete(videoId);
}

// ---------------------------------------------------------------------------
// Template-based creation
// ---------------------------------------------------------------------------

export async function createFromTemplate(
  tenantId: string,
  templateId: string,
  title: string,
  script: string,
): Promise<VideoProject> {
  const template = VIDEO_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  return createVideo(tenantId, title, script, template.style);
}

// ---------------------------------------------------------------------------
// Batch creation
// ---------------------------------------------------------------------------

export async function createBatch(
  tenantId: string,
  requests: { title: string; script: string; style?: VideoStyle }[],
): Promise<VideoProject[]> {
  return Promise.all(
    requests.map((r) => createVideo(tenantId, r.title, r.script, r.style)),
  );
}

export function getTemplates(): VideoTemplate[] {
  return VIDEO_TEMPLATES;
}
