#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const args = new Set(process.argv.slice(2));
const json = args.has("--json");
const strict = args.has("--strict") || args.has("--production");

const checks = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function add(id, area, status, message, detail = undefined) {
  checks.push({ id, area, status, message, detail });
}

function fileExists(path, area = "artifact") {
  const ok = existsSync(join(root, path));
  add(
    `file:${path}`,
    area,
    ok ? "pass" : "fail",
    ok ? `${path} exists` : `${path} is missing`,
  );
}

function fileContains(path, needle, id, area, message) {
  const content = existsSync(join(root, path)) ? read(path) : "";
  add(id, area, content.includes(needle) ? "pass" : "fail", message, path);
}

function envCheck(name, requiredInProd, area, note) {
  const present = Boolean(process.env[name]?.trim());
  const status = present ? "pass" : requiredInProd && strict ? "fail" : "warn";
  add(`env:${name}`, area, status, present ? `${name} present` : `${name} missing`, note);
}

function listMigrations() {
  const dir = join(root, "db", "migrations");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();
}

fileExists("ARCHITECTURE.md", "documentation");
fileExists("OPERATOR_RUNBOOK.md", "documentation");
fileExists("DEPLOYMENT.md", "documentation");
fileExists("API_REFERENCE.md", "documentation");
fileExists("db/migrations/012_production_schema_alignment.sql", "database");
fileExists("tests/operator-auth.test.ts", "testing");
fileExists("tests/db-rls-context.test.ts", "testing");
fileExists("src/app/production/page.tsx", "public-assessment");
fileExists("src/app/api/production-readiness/route.ts", "public-assessment");
fileExists("src/lib/public-production-status.ts", "public-assessment");

fileContains(
  "src/lib/operator-auth.ts",
  "verifyMiddlewareOperatorSignature",
  "auth:signed-middleware-identity",
  "security",
  "Operator API identity is signed by middleware",
);
fileContains(
  "src/app/api/system/route.ts",
  "publicHealthResponse",
  "api:system-redaction",
  "security",
  "System endpoint redacts integration detail for unauthenticated callers",
);
fileContains(
  "src/lib/db.ts",
  "set_config('app.tenant_id'",
  "db:rls-context",
  "database",
  "Postgres helper sets app.tenant_id for tenant-scoped queries",
);
fileContains(
  "src/lib/integrations/lead-delivery-hub.ts",
  "persistLeadDeliveryFailure",
  "queue:lead-delivery-dlq",
  "reliability",
  "Live lead-delivery failures persist into dead_letter_jobs",
);
fileContains(
  "src/middleware.ts",
  "endTrace(",
  "observability:trace-close",
  "observability",
  "Middleware closes traces with response status",
);
fileContains(
  "package.json",
  "\"postcss\": \"^8.5.10\"",
  "deps:postcss-override",
  "security",
  "PostCSS security override is pinned",
);

const migrations = listMigrations();
add(
  "db:migration-count",
  "database",
  migrations.length >= 12 ? "pass" : "fail",
  `${migrations.length} migration files detected`,
  migrations.map((name) => relative(root, join(root, "db", "migrations", name))),
);

envCheck("LEAD_OS_AUTH_SECRET", true, "security", "Required to sign operator and middleware identity.");
envCheck("LEAD_OS_OPERATOR_EMAILS", true, "security", "Required to restrict operator access.");
envCheck("DATABASE_URL", true, "database", "Required for production persistence.");
envCheck("REDIS_URL", false, "queue", "Required for distributed BullMQ workers; fallback mode works without it.");
envCheck("STRIPE_SECRET_KEY", true, "billing", "Required for live checkout and subscription sync.");
envCheck("STRIPE_WEBHOOK_SECRET", true, "billing", "Required for trusted Stripe webhook handling.");
envCheck("NEXT_PUBLIC_APP_URL", true, "deployment", "Required for canonical production URLs.");
envCheck("CRON_SECRET", true, "security", "Required for protected cron routes.");

const counts = checks.reduce(
  (acc, check) => {
    acc[check.status] += 1;
    return acc;
  },
  { pass: 0, warn: 0, fail: 0 },
);

const readinessScore = Math.round((counts.pass / checks.length) * 100);
const result = {
  ok: counts.fail === 0,
  strict,
  readinessScore,
  counts,
  checkedAt: new Date().toISOString(),
  checks,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Lead OS production assessment (${strict ? "strict" : "local"})`);
  console.log(`Score: ${readinessScore}/100 | pass=${counts.pass} warn=${counts.warn} fail=${counts.fail}`);
  console.log("");
  for (const check of checks) {
    const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
    console.log(`[${marker}] ${check.area} :: ${check.message}`);
    if (check.detail && typeof check.detail === "string") console.log(`       ${check.detail}`);
  }
}

process.exitCode = counts.fail > 0 ? 1 : 0;
