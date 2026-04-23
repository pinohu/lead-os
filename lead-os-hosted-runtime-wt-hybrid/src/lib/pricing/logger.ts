// src/lib/pricing/logger.ts
// Structured logs for pricing pipeline observability.

export type PricingLogLevel = "info" | "warn" | "error" | "debug";

export function pricingLog(level: PricingLogLevel, step: string, meta: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    scope: "pricing",
    level,
    step,
    ...meta,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
