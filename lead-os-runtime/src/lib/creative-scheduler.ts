import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import { generateWeeklyRecapScript, generateDataReportScript } from "./video-pipeline.ts";
import { generateDesignMd, exportDesignMdForAgent } from "./design-md.ts";
import { computeAnalyticsSnapshot } from "./data-pipeline.ts";

export interface CreativeJob {
  id: string;
  tenantId: string;
  type: CreativeJobType;
  schedule: "daily" | "weekly" | "monthly";
  config: Record<string, unknown>;
  status: "active" | "paused";
  lastRunAt?: string;
  nextRunAt?: string;
  lastOutput?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type CreativeJobType =
  | "weekly-video-recap"
  | "daily-metrics-video"
  | "landing-page-refresh"
  | "email-sequence-update"
  | "design-system-sync"
  | "marketing-gallery-update";

export interface CreativeOutput {
  jobId: string;
  type: string;
  artifacts: CreativeArtifact[];
  generatedAt: string;
}

export interface CreativeArtifact {
  type: "remotion-script" | "landing-page" | "email-template" | "design-md" | "image-spec";
  name: string;
  content: string;
  format: string;
}

const jobStore = new Map<string, CreativeJob>();
const outputStore = new Map<string, CreativeOutput[]>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_creative_jobs (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          type TEXT NOT NULL,
          schedule TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          config JSONB NOT NULL DEFAULT '{}',
          last_run_at TIMESTAMPTZ,
          next_run_at TIMESTAMPTZ,
          last_output JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_creative_jobs_tenant
          ON lead_os_creative_jobs (tenant_id, status);
        CREATE INDEX IF NOT EXISTS idx_lead_os_creative_jobs_schedule
          ON lead_os_creative_jobs (schedule, status, next_run_at);

        CREATE TABLE IF NOT EXISTS lead_os_creative_outputs (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL REFERENCES lead_os_creative_jobs(id),
          type TEXT NOT NULL,
          artifacts JSONB NOT NULL DEFAULT '[]',
          generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_creative_outputs_job
          ON lead_os_creative_outputs (job_id, generated_at DESC);
      `);
    } catch (error: unknown) {
      console.error("Failed to create creative scheduler schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

function computeNextRunAt(schedule: CreativeJob["schedule"]): string {
  const now = new Date();
  switch (schedule) {
    case "daily":
      now.setDate(now.getDate() + 1);
      now.setHours(6, 0, 0, 0);
      break;
    case "weekly":
      now.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 || 7);
      now.setHours(6, 0, 0, 0);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1, 1);
      now.setHours(6, 0, 0, 0);
      break;
  }
  return now.toISOString();
}

export type CreateCreativeJobInput = {
  tenantId: string;
  type: CreativeJobType;
  schedule: "daily" | "weekly" | "monthly";
  config?: Record<string, unknown>;
};

export async function createCreativeJob(input: CreateCreativeJobInput): Promise<CreativeJob> {
  await ensureSchema();

  const now = new Date().toISOString();
  const job: CreativeJob = {
    id: randomUUID(),
    tenantId: input.tenantId,
    type: input.type,
    schedule: input.schedule,
    config: input.config ?? {},
    status: "active",
    nextRunAt: computeNextRunAt(input.schedule),
    createdAt: now,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_creative_jobs (id, tenant_id, type, schedule, status, config, next_run_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [job.id, job.tenantId, job.type, job.schedule, job.status, JSON.stringify(job.config), job.nextRunAt, job.createdAt, job.updatedAt],
    );
  }

  jobStore.set(job.id, job);
  return job;
}

export async function getCreativeJob(id: string): Promise<CreativeJob | null> {
  await ensureSchema();

  const cached = jobStore.get(id);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT id, tenant_id, type, schedule, status, config, last_run_at, next_run_at, last_output, created_at, updated_at
     FROM lead_os_creative_jobs WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const job: CreativeJob = {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type as CreativeJobType,
    schedule: row.schedule,
    status: row.status,
    config: row.config ?? {},
    lastRunAt: row.last_run_at?.toISOString(),
    nextRunAt: row.next_run_at?.toISOString(),
    lastOutput: row.last_output,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };

  jobStore.set(job.id, job);
  return job;
}

export async function listCreativeJobs(tenantId: string): Promise<CreativeJob[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query(
      `SELECT id, tenant_id, type, schedule, status, config, last_run_at, next_run_at, last_output, created_at, updated_at
       FROM lead_os_creative_jobs WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );

    const jobs: CreativeJob[] = result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type as CreativeJobType,
      schedule: row.schedule,
      status: row.status,
      config: row.config ?? {},
      lastRunAt: row.last_run_at?.toISOString(),
      nextRunAt: row.next_run_at?.toISOString(),
      lastOutput: row.last_output,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    for (const job of jobs) {
      jobStore.set(job.id, job);
    }
    return jobs;
  }

  return [...jobStore.values()]
    .filter((j) => j.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateCreativeJob(id: string, patch: Partial<Pick<CreativeJob, "schedule" | "config" | "status">>): Promise<CreativeJob | null> {
  await ensureSchema();

  const existing = await getCreativeJob(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: CreativeJob = {
    ...existing,
    ...patch,
    id: existing.id,
    tenantId: existing.tenantId,
    type: existing.type,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  if (patch.schedule && patch.schedule !== existing.schedule) {
    updated.nextRunAt = computeNextRunAt(patch.schedule);
  }

  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE lead_os_creative_jobs
       SET schedule = $1, status = $2, config = $3, next_run_at = $4, updated_at = $5
       WHERE id = $6`,
      [updated.schedule, updated.status, JSON.stringify(updated.config), updated.nextRunAt, updated.updatedAt, id],
    );
  }

  jobStore.set(id, updated);
  return updated;
}

export async function pauseCreativeJob(id: string): Promise<CreativeJob | null> {
  return updateCreativeJob(id, { status: "paused" });
}

export async function resumeCreativeJob(id: string): Promise<CreativeJob | null> {
  return updateCreativeJob(id, { status: "active" });
}

export async function deleteCreativeJob(id: string): Promise<boolean> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query(`DELETE FROM lead_os_creative_jobs WHERE id = $1`, [id]);
    jobStore.delete(id);
    return (result.rowCount ?? 0) > 0;
  }

  return jobStore.delete(id);
}

async function handleWeeklyVideoRecap(job: CreativeJob): Promise<CreativeArtifact[]> {
  const video = await generateWeeklyRecapScript(job.tenantId);
  return [
    {
      type: "remotion-script",
      name: `weekly-recap-${new Date().toISOString().split("T")[0]}.tsx`,
      content: video.remotionCode,
      format: "tsx",
    },
  ];
}

async function handleDailyMetricsVideo(job: CreativeJob): Promise<CreativeArtifact[]> {
  const dateStr = new Date().toISOString().split("T")[0];

  let snapshot;
  try {
    snapshot = await computeAnalyticsSnapshot(job.tenantId, dateStr);
  } catch {
    snapshot = {
      tenantId: job.tenantId,
      period: dateStr,
      leads: { total: 0, bySource: {}, byNiche: {}, byStage: {}, avgScore: 0, hotCount: 0 },
      conversions: { total: 0, rate: 0, avgTimeToConvert: 0, byFunnel: {} },
      engagement: { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, openRate: 0, clickRate: 0 },
      revenue: { total: 0, byNiche: {}, avgDealSize: 0 },
    };
  }

  const metrics: Record<string, number> = {
    "New Leads": snapshot.leads.total,
    "Conversions": snapshot.conversions.total,
    "Open Rate": Math.round(snapshot.engagement.openRate * 100),
  };

  const video = await generateDataReportScript(job.tenantId, metrics);
  return [
    {
      type: "remotion-script",
      name: `daily-metrics-${dateStr}.tsx`,
      content: video.remotionCode,
      format: "tsx",
    },
  ];
}

async function handleLandingPageRefresh(job: CreativeJob): Promise<CreativeArtifact[]> {
  const config = job.config as { slug?: string; headline?: string; ctaText?: string };

  const pageContent = JSON.stringify({
    tenantId: job.tenantId,
    refreshedAt: new Date().toISOString(),
    slug: config.slug ?? "main",
    headline: config.headline ?? "Transform Your Business Today",
    ctaText: config.ctaText ?? "Get Started Free",
  }, null, 2);

  return [
    {
      type: "landing-page",
      name: `landing-page-${config.slug ?? "main"}-refresh.json`,
      content: pageContent,
      format: "json",
    },
  ];
}

async function handleEmailSequenceUpdate(job: CreativeJob): Promise<CreativeArtifact[]> {
  const dateStr = new Date().toISOString().split("T")[0];

  let snapshot;
  try {
    snapshot = await computeAnalyticsSnapshot(job.tenantId, dateStr);
  } catch {
    snapshot = {
      tenantId: job.tenantId,
      period: dateStr,
      leads: { total: 0, bySource: {}, byNiche: {}, byStage: {}, avgScore: 0, hotCount: 0 },
      conversions: { total: 0, rate: 0, avgTimeToConvert: 0, byFunnel: {} },
      engagement: { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, openRate: 0, clickRate: 0 },
      revenue: { total: 0, byNiche: {}, avgDealSize: 0 },
    };
  }

  const suggestions: string[] = [];
  if (snapshot.engagement.openRate < 0.2) {
    suggestions.push("Open rate is below 20%. Consider testing new subject lines with urgency or personalization.");
  }
  if (snapshot.engagement.clickRate < 0.05) {
    suggestions.push("Click rate is below 5%. Consider adding more prominent CTAs and reducing email length.");
  }

  const emailUpdate = JSON.stringify({
    tenantId: job.tenantId,
    analyzedAt: new Date().toISOString(),
    openRate: snapshot.engagement.openRate,
    clickRate: snapshot.engagement.clickRate,
    suggestions,
  }, null, 2);

  return [
    {
      type: "email-template",
      name: `email-sequence-update-${dateStr}.json`,
      content: emailUpdate,
      format: "json",
    },
  ];
}

async function handleDesignSystemSync(job: CreativeJob): Promise<CreativeArtifact[]> {
  const [rawMd, agentMd] = await Promise.all([
    generateDesignMd(job.tenantId),
    exportDesignMdForAgent(job.tenantId),
  ]);

  return [
    {
      type: "design-md",
      name: "design.md",
      content: rawMd,
      format: "md",
    },
    {
      type: "design-md",
      name: "design-agent.md",
      content: agentMd,
      format: "md",
    },
  ];
}

async function handleMarketingGalleryUpdate(job: CreativeJob): Promise<CreativeArtifact[]> {
  const features = (job.config.features as string[]) ?? ["Lead Capture", "Smart Scoring", "Nurture Automation"];

  const gallerySpec = JSON.stringify({
    tenantId: job.tenantId,
    generatedAt: new Date().toISOString(),
    features: features.map((feature) => ({
      name: feature,
      tagline: `Powerful ${feature.toLowerCase()} built for modern teams`,
      screenshotSpec: { width: 1200, height: 800, theme: "dark" },
    })),
  }, null, 2);

  return [
    {
      type: "image-spec",
      name: `marketing-gallery-${new Date().toISOString().split("T")[0]}.json`,
      content: gallerySpec,
      format: "json",
    },
  ];
}

const JOB_HANDLERS: Record<CreativeJobType, (job: CreativeJob) => Promise<CreativeArtifact[]>> = {
  "weekly-video-recap": handleWeeklyVideoRecap,
  "daily-metrics-video": handleDailyMetricsVideo,
  "landing-page-refresh": handleLandingPageRefresh,
  "email-sequence-update": handleEmailSequenceUpdate,
  "design-system-sync": handleDesignSystemSync,
  "marketing-gallery-update": handleMarketingGalleryUpdate,
};

export async function runCreativeJob(jobId: string): Promise<CreativeOutput> {
  await ensureSchema();

  const job = await getCreativeJob(jobId);
  if (!job) {
    throw new Error(`Creative job not found: ${jobId}`);
  }

  const handler = JOB_HANDLERS[job.type];
  if (!handler) {
    throw new Error(`No handler for creative job type: ${job.type}`);
  }

  const artifacts = await handler(job);

  const output: CreativeOutput = {
    jobId: job.id,
    type: job.type,
    artifacts,
    generatedAt: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  job.lastRunAt = now;
  job.lastOutput = { artifactCount: artifacts.length, generatedAt: now };
  job.nextRunAt = computeNextRunAt(job.schedule);
  job.updatedAt = now;

  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE lead_os_creative_jobs
       SET last_run_at = $1, next_run_at = $2, last_output = $3, updated_at = $4
       WHERE id = $5`,
      [job.lastRunAt, job.nextRunAt, JSON.stringify(job.lastOutput), job.updatedAt, job.id],
    );

    await pool.query(
      `INSERT INTO lead_os_creative_outputs (id, job_id, type, artifacts, generated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), job.id, job.type, JSON.stringify(artifacts), output.generatedAt],
    );
  }

  jobStore.set(job.id, job);

  const existing = outputStore.get(job.id) ?? [];
  existing.push(output);
  outputStore.set(job.id, existing);

  return output;
}

export async function getCreativeOutputs(jobId: string): Promise<CreativeOutput[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query(
      `SELECT job_id, type, artifacts, generated_at
       FROM lead_os_creative_outputs WHERE job_id = $1 ORDER BY generated_at DESC LIMIT 20`,
      [jobId],
    );

    return result.rows.map((row) => ({
      jobId: row.job_id,
      type: row.type,
      artifacts: row.artifacts as CreativeArtifact[],
      generatedAt: row.generated_at.toISOString(),
    }));
  }

  return outputStore.get(jobId) ?? [];
}

export const CREATIVE_JOB_TYPES: { type: CreativeJobType; name: string; description: string; defaultSchedule: CreativeJob["schedule"] }[] = [
  { type: "weekly-video-recap", name: "Weekly Video Recap", description: "Generate a Remotion video summarizing this week's lead performance", defaultSchedule: "weekly" },
  { type: "daily-metrics-video", name: "Daily Metrics Video", description: "Generate daily metrics video with animated charts", defaultSchedule: "daily" },
  { type: "landing-page-refresh", name: "Landing Page Refresh", description: "Regenerate landing page blocks using latest niche config", defaultSchedule: "monthly" },
  { type: "email-sequence-update", name: "Email Sequence Update", description: "Analyze email metrics and suggest nurture sequence improvements", defaultSchedule: "weekly" },
  { type: "design-system-sync", name: "Design System Sync", description: "Export fresh design.md and check for design drift", defaultSchedule: "weekly" },
  { type: "marketing-gallery-update", name: "Marketing Gallery Update", description: "Generate fresh feature screenshots and descriptions", defaultSchedule: "monthly" },
];

export function resetCreativeSchedulerStore(): void {
  jobStore.clear();
  outputStore.clear();
  schemaReady = null;
}
