// src/runtime/worker-entry.ts
// Dedicated background worker (BullMQ + scheduler). Run: npm run worker

if (!process.env.REDIS_URL) {
  console.error("[lead-os-worker] REDIS_URL is required for the pricing worker in production.");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const buildId = process.env.LEAD_OS_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown";
console.log("[lead-os-worker] build", buildId);

const { startPricingRuntimeWorker } = await import("../lib/pricing/bootstrap.ts");
await startPricingRuntimeWorker();
console.log("[lead-os-worker] Pricing worker bootstrap complete (see structured logs for BullMQ state).");
