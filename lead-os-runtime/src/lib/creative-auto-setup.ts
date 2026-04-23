import type { CreativeJobType } from "./creative-scheduler.ts";

interface CreativeSetupResult {
  type: CreativeJobType;
  status: "created" | "failed";
  id?: string;
  error?: string;
}

export async function setupDefaultCreativeJobs(
  tenantId: string,
  nicheSlug: string,
): Promise<CreativeSetupResult[]> {
  const { createCreativeJob } = await import("./creative-scheduler.ts");

  const defaultJobs: Array<{
    type: CreativeJobType;
    schedule: "daily" | "weekly" | "monthly";
    config: Record<string, unknown>;
  }> = [
    {
      type: "weekly-video-recap",
      schedule: "weekly",
      config: { niche: nicheSlug },
    },
    {
      type: "landing-page-refresh",
      schedule: "monthly",
      config: { niche: nicheSlug },
    },
    {
      type: "email-sequence-update",
      schedule: "weekly",
      config: { niche: nicheSlug },
    },
  ];

  const results: CreativeSetupResult[] = [];
  for (const job of defaultJobs) {
    try {
      const created = await createCreativeJob({
        tenantId,
        type: job.type,
        schedule: job.schedule,
        config: job.config,
      });
      results.push({ type: job.type, status: "created", id: created.id });
    } catch (err) {
      results.push({
        type: job.type,
        status: "failed",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }
  return results;
}
