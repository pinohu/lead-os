// ---------------------------------------------------------------------------
// GBP Sync Scheduler — manages scheduled Google Business Profile data syncs
// that re-ingest GMB listings and refresh landing pages.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import { ingestGMBListing, type GMBListingData } from "./gmb-ingestor.ts";
import {
  generateLandingPage,
  getLandingPage,
  saveLandingPage,
} from "./landing-page-generator.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GBPSyncConfig {
  tenantId: string;
  placeId: string;
  slug: string;
  cronExpression: string;
  enabled: boolean;
}

export interface GBPSyncJob {
  id: string;
  config: GBPSyncConfig;
  status: "idle" | "running" | "completed" | "failed";
  lastRunAt: string | null;
  lastResult: GBPSyncResult | null;
  nextRunAt: string;
  totalRuns: number;
  consecutiveFailures: number;
  createdAt: string;
}

export interface GBPSyncResult {
  success: boolean;
  listingCompleteness: number;
  reviewQuality: number;
  sectionsUpdated: number;
  changesDetected: boolean;
  detail: string;
  durationMs: number;
  syncedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const syncJobStore = new Map<string, GBPSyncJob>();

// ---------------------------------------------------------------------------
// Cron helpers — minimal parser for common expressions
// ---------------------------------------------------------------------------

const CRON_INTERVALS: Record<string, number> = {
  "0 * * * *": 60 * 60_000,
  "0 */2 * * *": 2 * 60 * 60_000,
  "0 */6 * * *": 6 * 60 * 60_000,
  "0 */12 * * *": 12 * 60 * 60_000,
  "0 0 * * *": 24 * 60 * 60_000,
  "0 9 * * 1": 7 * 24 * 60 * 60_000,
};

function getIntervalMs(cronExpression: string): number {
  return CRON_INTERVALS[cronExpression] ?? 60 * 60_000;
}

function computeNextRun(cronExpression: string, fromDate?: Date): string {
  const from = fromDate ?? new Date();
  const intervalMs = getIntervalMs(cronExpression);
  const next = new Date(from.getTime() + intervalMs);
  return next.toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createSyncJob(config: GBPSyncConfig): Promise<GBPSyncJob> {
  const now = new Date();
  const job: GBPSyncJob = {
    id: randomUUID(),
    config: { ...config },
    status: "idle",
    lastRunAt: null,
    lastResult: null,
    nextRunAt: computeNextRun(config.cronExpression, now),
    totalRuns: 0,
    consecutiveFailures: 0,
    createdAt: now.toISOString(),
  };
  syncJobStore.set(job.id, job);
  return job;
}

export function getSyncJob(jobId: string): GBPSyncJob | null {
  return syncJobStore.get(jobId) ?? null;
}

export function listSyncJobs(tenantId?: string): GBPSyncJob[] {
  const jobs = Array.from(syncJobStore.values());
  if (tenantId) {
    return jobs.filter((j) => j.config.tenantId === tenantId);
  }
  return jobs;
}

export function updateSyncJob(
  jobId: string,
  updates: Partial<Pick<GBPSyncConfig, "cronExpression" | "enabled">>,
): GBPSyncJob | null {
  const job = syncJobStore.get(jobId);
  if (!job) return null;

  if (updates.cronExpression !== undefined) {
    job.config.cronExpression = updates.cronExpression;
    job.nextRunAt = computeNextRun(updates.cronExpression);
  }
  if (updates.enabled !== undefined) {
    job.config.enabled = updates.enabled;
  }

  return job;
}

export function deleteSyncJob(jobId: string): boolean {
  return syncJobStore.delete(jobId);
}

export async function executeSyncJob(
  jobId: string,
  listingData: GMBListingData,
): Promise<GBPSyncResult> {
  const job = syncJobStore.get(jobId);
  if (!job) {
    throw new Error(`Sync job not found: ${jobId}`);
  }

  const startTime = Date.now();
  job.status = "running";

  try {
    const profile = ingestGMBListing(listingData);

    const newPage = generateLandingPage(profile, {
      tenantId: job.config.tenantId,
    });

    const existingPage = await getLandingPage(newPage.slug);

    const changesDetected = existingPage
      ? existingPage.sections.length !== newPage.sections.length ||
        JSON.stringify(existingPage.sections) !== JSON.stringify(newPage.sections)
      : true;

    const sectionsUpdated = changesDetected ? newPage.sections.length : 0;

    await saveLandingPage(newPage);

    const durationMs = Date.now() - startTime;
    const now = new Date();

    const result: GBPSyncResult = {
      success: true,
      listingCompleteness: profile.listingCompleteness,
      reviewQuality: profile.reviewQuality,
      sectionsUpdated,
      changesDetected,
      detail: changesDetected
        ? `Synced ${sectionsUpdated} sections with changes detected`
        : "Sync completed with no changes",
      durationMs,
      syncedAt: now.toISOString(),
    };

    job.status = "completed";
    job.lastRunAt = now.toISOString();
    job.lastResult = result;
    job.totalRuns += 1;
    job.consecutiveFailures = 0;
    job.nextRunAt = computeNextRun(job.config.cronExpression, now);

    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const now = new Date();

    const result: GBPSyncResult = {
      success: false,
      listingCompleteness: 0,
      reviewQuality: 0,
      sectionsUpdated: 0,
      changesDetected: false,
      detail: err instanceof Error ? err.message : "Unknown sync failure",
      durationMs,
      syncedAt: now.toISOString(),
    };

    job.status = "failed";
    job.lastRunAt = now.toISOString();
    job.lastResult = result;
    job.totalRuns += 1;
    job.consecutiveFailures += 1;
    job.nextRunAt = computeNextRun(job.config.cronExpression, now);

    return result;
  }
}

export function evaluateDueJobs(): GBPSyncJob[] {
  const now = new Date();
  return Array.from(syncJobStore.values()).filter((job) => {
    if (!job.config.enabled) return false;
    if (job.status === "running") return false;
    return new Date(job.nextRunAt).getTime() <= now.getTime();
  });
}

// ---------------------------------------------------------------------------
// Store reset (testing only)
// ---------------------------------------------------------------------------

export function resetSyncStore(): void {
  syncJobStore.clear();
}
