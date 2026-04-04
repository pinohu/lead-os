// ── Environment Variable Validation ─────────────────────────────────
// Validates all required env vars at startup using Zod.
// Fail-fast with clear error messages if anything is missing.

import { z } from "zod";
import { logger } from "@/lib/logger";

/** Treat empty strings as undefined so `.optional()` works with blank env vars */
const emptyToUndefined = z.string().transform((v) => (v === "" ? undefined : v));

/** Optional string that must match a prefix when provided (non-empty) */
function optionalPrefixed(prefix: string, label: string) {
  return emptyToUndefined
    .pipe(z.string().startsWith(prefix, `${label} must start with ${prefix}`).optional());
}

const envSchema = z.object({
  // ── Database (required) ──────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // ── Stripe (optional — dry-run mode when absent) ────────────────
  STRIPE_SECRET_KEY: optionalPrefixed("sk_", "STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: optionalPrefixed("whsec_", "STRIPE_WEBHOOK_SECRET"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalPrefixed("pk_", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  // ── Auth ─────────────────────────────────────────────────────────
  AUTH_SECRET: emptyToUndefined
    .pipe(z.string().min(16, "AUTH_SECRET must be at least 16 characters").optional()),
  AUTH_URL: emptyToUndefined.pipe(z.string().url("AUTH_URL must be a valid URL").optional()),

  // ── Email (Emailit) ──────────────────────────────────────────────
  EMAILIT_API_KEY: emptyToUndefined.pipe(z.string().min(1).optional()),

  // ── Admin ────────────────────────────────────────────────────────
  ADMIN_ACCESS_KEY: emptyToUndefined.pipe(z.string().min(8).optional()),
  ADMIN_EMAIL: emptyToUndefined.pipe(z.string().email().optional()),

  // ── Cron ─────────────────────────────────────────────────────────
  CRON_SECRET: emptyToUndefined.pipe(z.string().min(16, "CRON_SECRET must be at least 16 characters").optional()),

  // ── App ──────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: emptyToUndefined.pipe(z.string().url().optional()),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // ── Observability ────────────────────────────────────────────────
  SENTRY_DSN: emptyToUndefined.pipe(z.string().url().optional()),
  NEXT_PUBLIC_POSTHOG_KEY: emptyToUndefined.pipe(z.string().min(1).optional()),
  NEXT_PUBLIC_POSTHOG_HOST: emptyToUndefined.pipe(z.string().url().optional()),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate — throws on missing required vars
let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  ${e.path.map(String).join(".")}: ${e.message}`)
      .join("\n");
    logger.error(
      "env",
      `\n❌ Invalid environment variables:\n${errors}\n\nCheck your .env file or deployment configuration.\n`
    );

    // In development, warn but don't crash (allows partial dev setup)
    if (process.env.NODE_ENV === "development") {
      logger.warn("env", "⚠️  Continuing with partial env in development mode.\n");
      _env = result.data as unknown as Env;
      return _env;
    }

    throw new Error("Invalid environment configuration");
  }

  _env = result.data;
  return _env;
}

// Convenience export for immediate validation
export const env = getEnv();
