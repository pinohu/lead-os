// src/lib/pricing/env.ts

export function getDefaultTenantId(): string {
  return process.env.LEAD_OS_TENANT_ID ?? "default-tenant";
}

export function isSystemEnabled(): boolean {
  return process.env.SYSTEM_ENABLED !== "false";
}

export function isLivePricingEnabled(): boolean {
  if (process.env.ENABLE_LIVE_PRICING === "true") return true;
  if (process.env.ENABLE_LIVE_PRICING === "1") return true;
  return false;
}

export function getPricingTickIntervalMs(): number {
  const raw = Number(process.env.PRICING_TICK_INTERVAL_MS ?? 60_000);
  if (!Number.isFinite(raw) || raw < 10_000) return 60_000;
  return Math.floor(raw);
}

export function getPricingMeasurementDelayMs(): number {
  const raw = Number(process.env.PRICING_MEASUREMENT_DELAY_MS ?? 3_600_000);
  if (!Number.isFinite(raw) || raw < 60_000) return 3_600_000;
  return Math.floor(raw);
}

export function isPricingWorkerDisabled(): boolean {
  if (process.env.LEAD_OS_PRICING_WORKER_DISABLED === "true") return true;
  if (process.env.VERCEL === "1") return true;
  return false;
}

export function isRedisUrlConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}
