// src/instrumentation.ts
// Node runtime bootstrap: pricing BullMQ workers + distributed scheduler (skipped on Edge / Vercel workers).

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const { applyEnvVaultAliases } = await import("@/lib/env-vault-aliases.ts");
    applyEnvVaultAliases();
  } catch (err) {
    console.error("[instrumentation] env vault aliases failed:", err);
  }

  const { assertProductionReady } = await import("@/lib/production-config.ts");
  assertProductionReady();

  try {
    const { startPricingRuntimeWeb } = await import("@/lib/pricing/bootstrap.ts");
    await startPricingRuntimeWeb();
  } catch (err) {
    console.error("[instrumentation] pricing bootstrap failed:", err);
  }
}
