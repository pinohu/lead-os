import test from "node:test";
import assert from "node:assert/strict";
import {
  assertProductionReady,
  getProductionReadinessStatus,
} from "../src/lib/production-config.ts";

const ORIGINAL_ENV = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  NODE_ENV: process.env.NODE_ENV,
  LEAD_OS_ENFORCE_PRODUCTION_CONFIG: process.env.LEAD_OS_ENFORCE_PRODUCTION_CONFIG,
  LEAD_OS_DATABASE_URL: process.env.LEAD_OS_DATABASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  REDIS_URL: process.env.REDIS_URL,
  LEAD_OS_AUTH_SECRET: process.env.LEAD_OS_AUTH_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

function resetEnv() {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test("production readiness reports missing production dependencies", () => {
  resetEnv();
  process.env.VERCEL_ENV = "production";
  delete process.env.LEAD_OS_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.REDIS_URL;
  delete process.env.LEAD_OS_AUTH_SECRET;
  delete process.env.CRON_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;

  const status = getProductionReadinessStatus();

  assert.equal(status.productionLike, true);
  assert.equal(status.ready, false);
  assert.ok(status.missingRequired.some((dependency) => dependency.key === "database"));
  assert.ok(status.missingRequired.some((dependency) => dependency.key === "redis"));
  assert.ok(status.missingRequired.some((dependency) => dependency.key === "stripe"));
  resetEnv();
});

test("strict production config fails fast when required env is absent", () => {
  resetEnv();
  process.env.LEAD_OS_ENFORCE_PRODUCTION_CONFIG = "true";
  delete process.env.LEAD_OS_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.REDIS_URL;
  delete process.env.LEAD_OS_AUTH_SECRET;
  delete process.env.CRON_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;

  assert.throws(
    () => assertProductionReady(),
    /Lead OS production configuration is incomplete/,
  );
  resetEnv();
});
