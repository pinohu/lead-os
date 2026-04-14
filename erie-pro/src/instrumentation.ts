// ── Next.js Instrumentation ───────────────────────────────────────────
// Runs once at server startup. Used for:
// 1. Environment variable validation
// 2. Database connectivity check
// 3. Sentry initialization (when configured)
//
// IMPORTANT: This module is bundled into BOTH the Node.js server and the
// edge middleware bundle. Anything pulled in via `register()` ships to
// the edge runtime — which lacks Node globals like `process.exit` and
// can't tolerate eager DB/env initialization. Gate Node-only work behind
// `process.env.NEXT_RUNTIME === 'nodejs'`.

export async function register() {
  // Edge runtime: do nothing. Middleware is pure and doesn't need env validation.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Node.js server runtime: validate env up front so we crash on misconfig
  // instead of silently failing inside individual route handlers.
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
