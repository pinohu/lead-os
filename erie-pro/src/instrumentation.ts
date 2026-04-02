// ── Next.js Instrumentation ───────────────────────────────────────────
// Runs once at server startup. Used for:
// 1. Environment variable validation
// 2. Database connectivity check
// 3. Sentry initialization (when configured)

export async function register() {
  // Only run on the server
  if (typeof window !== "undefined") return;

  // Validate environment variables
  try {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  } catch (err) {
    const { logger } = await import("@/lib/logger");
    logger.error("instrumentation", "Environment validation failed:", err);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
