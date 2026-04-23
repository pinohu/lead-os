// src/lib/pricing/memory-fallback.ts
// In-process scheduler when Redis is unavailable (long-running Node only).

import { getDefaultTenantId, getPricingTickIntervalMs, isRedisUrlConfigured } from "./env.ts";
import { runPricingTickJob } from "./job-processor.ts";
import { pricingLog } from "./logger.ts";
import { markMemorySchedulerStarted } from "./runtime-state.ts";

const g = globalThis as typeof globalThis & {
  __leadOsPricingMemoryScheduler?: ReturnType<typeof setInterval>;
};

export function startMemoryPricingFallbackScheduler(): void {
  if (isRedisUrlConfigured()) return;
  if (g.__leadOsPricingMemoryScheduler) return;

  const ms = getPricingTickIntervalMs();
  g.__leadOsPricingMemoryScheduler = setInterval(() => {
    runPricingTickJob(
      { kind: "tick", tenantId: getDefaultTenantId(), source: "memory-scheduler" },
      undefined,
    ).catch((err) => {
      pricingLog("error", "memory_scheduler_tick", {
        message: err instanceof Error ? err.message : String(err),
      });
    });
  }, ms);
  markMemorySchedulerStarted();
  pricingLog("info", "memory_scheduler_started", { intervalMs: ms });
}
