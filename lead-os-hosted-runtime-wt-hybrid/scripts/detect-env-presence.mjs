#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const json = args.includes("--json");
const productionStrict = args.includes("--strict") || args.includes("--production");
const showHelp = args.includes("--help") || args.includes("-h");

if (showHelp) {
  console.log(`Lead OS environment detector

Usage:
  node scripts/detect-env-presence.mjs [--json] [--production|--strict]

Behavior:
  - Loads .env, .env.local, .env.production, and .env.production.local when present.
  - Never prints secret values.
  - In production mode, exits non-zero when required env groups are incomplete.
`);
  process.exit(0);
}

const examplePath = join(root, ".env.example");
if (!existsSync(examplePath)) {
  console.error("Missing .env.example");
  process.exit(1);
}

const envFileCandidates = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  process.env.LEAD_OS_ENV_FILE,
].filter(Boolean);

function cleanEnvValue(rawValue) {
  const trimmed = rawValue.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvLine(line) {
  const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;
  return [match[1], cleanEnvValue(match[2])];
}

function loadEnvFiles() {
  const loadedFiles = [];
  for (const candidate of envFileCandidates) {
    const envPath = isAbsolute(candidate) ? candidate : join(root, candidate);
    if (!existsSync(envPath)) continue;
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    loadedFiles.push(basename(candidate));
  }
  return [...new Set(loadedFiles)];
}

function hasValue(key) {
  return Boolean(process.env[key]?.trim());
}

const loadedFiles = loadEnvFiles();
const exampleText = readFileSync(examplePath, "utf8");
const exampleKeys = [];
for (const line of exampleText.split(/\r?\n/)) {
  const parsed = parseEnvLine(line);
  if (parsed) exampleKeys.push(parsed[0]);
}

const requiredGroups = [
  {
    id: "auth_secret",
    label: "Auth secret",
    mode: "all",
    keys: ["LEAD_OS_AUTH_SECRET"],
    note: "Signs operator sessions and request-gate identity.",
  },
  {
    id: "operator_allowlist",
    label: "Operator allowlist",
    mode: "all",
    keys: ["LEAD_OS_OPERATOR_EMAILS"],
    note: "Restricts owner/operator access.",
  },
  {
    id: "database",
    label: "Database",
    mode: "any",
    keys: ["LEAD_OS_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL"],
    note: "Provides production persistence.",
  },
  {
    id: "redis",
    label: "Redis",
    mode: "all",
    keys: ["REDIS_URL"],
    note: "Backs distributed queues and rate-limit state.",
  },
  {
    id: "billing",
    label: "Stripe billing",
    mode: "all",
    keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    optionalWhen: "LEAD_OS_BILLING_ENFORCE=false",
    note: "Required for live checkout, subscription sync, and webhook trust.",
  },
  {
    id: "canonical_url",
    label: "Canonical site URL",
    mode: "any",
    keys: ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"],
    note: "Builds magic links, metadata, widgets, and post-deploy smoke URLs.",
  },
  {
    id: "cron_secret",
    label: "Cron secret",
    mode: "all",
    keys: ["CRON_SECRET"],
    note: "Protects scheduled and maintenance routes.",
  },
];

function groupConfigured(group) {
  if (group.mode === "any") return group.keys.some(hasValue);
  return group.keys.every(hasValue);
}

function groupRequired(group) {
  if (group.id === "billing" && process.env.LEAD_OS_BILLING_ENFORCE === "false") {
    return false;
  }
  return true;
}

const set = [];
const unset = [];
for (const key of exampleKeys) {
  if (hasValue(key)) set.push(key);
  else unset.push(key);
}

const assessedRequiredGroups = requiredGroups.map((group) => {
  const configured = groupConfigured(group);
  const required = groupRequired(group);
  return {
    id: group.id,
    label: group.label,
    required,
    configured,
    mode: group.mode,
    keys: group.keys,
    missingKeys: group.keys.filter((key) => !hasValue(key)),
    note: group.note,
    optionalWhen: group.optionalWhen,
  };
});

const missingRequiredGroups = assessedRequiredGroups.filter((group) => group.required && !group.configured);
const result = {
  ok: !productionStrict || missingRequiredGroups.length === 0,
  productionStrict,
  productionReady: missingRequiredGroups.length === 0,
  loadedFiles,
  totalKeys: exampleKeys.length,
  setCount: set.length,
  unsetCount: unset.length,
  set,
  unset,
  requiredGroups: assessedRequiredGroups,
  missingRequiredGroups: missingRequiredGroups.map((group) => group.id),
  checkedAt: new Date().toISOString(),
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Lead OS environment detector (${productionStrict ? "production strict" : "local"})`);
  console.log(`Loaded env files: ${loadedFiles.length > 0 ? loadedFiles.join(", ") : "none"}`);
  console.log(`Example keys: ${result.setCount}/${result.totalKeys} set`);
  console.log(`Production required groups: ${assessedRequiredGroups.length - missingRequiredGroups.length}/${assessedRequiredGroups.length} ready`);
  if (missingRequiredGroups.length > 0) {
    console.log("");
    console.log("Missing production groups:");
    for (const group of missingRequiredGroups) {
      const keyText = group.mode === "any"
        ? `one of ${group.keys.join(", ")}`
        : group.missingKeys.join(", ");
      console.log(`- ${group.label}: ${keyText}`);
    }
  }
  console.log("");
  console.log("No secret values were printed.");
}

process.exitCode = result.ok ? 0 : 1;
