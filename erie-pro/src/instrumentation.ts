// ── Next.js Instrumentation ───────────────────────────────────────────
// Runs once at server startup. Used for:
// 1. Environment variable validation (log-only — see warning below)
// 2. Sentry initialization (when configured)
//
// IMPORTANT: This module is bundled into BOTH the Node.js server and the
// edge middleware bundle. Anything pulled in via `register()` ships to
// the edge runtime — which lacks Node globals like `process.exit` and
// can't tolerate eager DB/env initialization. Gate Node-only work behind
// `process.env.NEXT_RUNTIME === 'nodejs'`.
//
// NEVER call `process.exit(1)` here. On Vercel, a lambda that exits during
// `register()` returns 500 for every request that triggered the cold start
// — and because Vercel keeps spinning new instances, this turns a single
// misconfigured env var into a site-wide outage where every dynamic route
// 500s and only statically-prerendered pages remain reachable. We've been
// burned by this once already; do NOT reintroduce a hard exit.

export async function register() {
  // Edge runtime: do nothing. Middleware is pure and doesn't need env validation.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Node.js server runtime: validate env up front so misconfiguration shows up
  // in logs immediately. Failures are logged but NEVER fatal — individual
  // routes either degrade gracefully (dry-run modes for Stripe / Emailit) or
  // throw a clear error at request time (DB / auth secrets), which is far
  // better than a global lambda crash loop.
  try {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  } catch (err) {
    try {
      const { logger } = await import("@/lib/logger");
      logger.error(
        "instrumentation",
        "Environment validation failed (continuing — routes that need missing vars will error individually):",
        err
      );
    } catch {
      // Logger import itself failed — fall back to console so the stack still
      // surfaces in Vercel logs. Still do NOT throw or exit.
      // eslint-disable-next-line no-console
      console.error("[instrumentation] env validation failed:", err);
    }
  }
}
