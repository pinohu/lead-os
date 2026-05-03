#!/usr/bin/env node

const args = process.argv.slice(2);
const json = args.includes("--json");
const dryRun = args.includes("--dry-run") || args.includes("--plan");
const showHelp = args.includes("--help") || args.includes("-h");

function argValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

const positionalUrl = args.find((arg) => !arg.startsWith("--"));

if (showHelp) {
  console.log(`Lead OS post-deploy smoke checker

Usage:
  node scripts/postdeploy-smoke.mjs --url https://your-domain.example [--json] [--plan]
  node scripts/postdeploy-smoke.mjs https://your-domain.example [--json] [--plan]

Environment fallback order:
  POSTDEPLOY_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL
`);
  process.exit(0);
}

function normalizeUrl(value) {
  if (!value?.trim()) return undefined;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return new URL(withProtocol).origin;
}

const baseUrl = normalizeUrl(
  argValue("--url") ??
  positionalUrl ??
  process.env.POSTDEPLOY_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL,
);

const checks = [
  {
    id: "health",
    path: "/api/health",
    expectStatus: 200,
    expectText: "\"ok\"",
  },
  {
    id: "production-readiness",
    path: "/api/production-readiness",
    expectStatus: 200,
  },
  {
    id: "packages",
    path: "/packages",
    expectStatus: 200,
    expectText: "Sell complete outcomes",
  },
  {
    id: "onboarding",
    path: "/onboard",
    expectStatus: 200,
    expectText: "Create your operator account",
  },
  {
    id: "build-id",
    path: "/build-id.json",
    expectStatus: 200,
    expectText: "\"id\"",
  },
];

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function runCheck(check) {
  const url = new URL(check.path, baseUrl).toString();
  if (dryRun) {
    return { ...check, url, status: "dry-run", ok: true };
  }

  try {
    const response = await fetchWithTimeout(url);
    const body = await response.text();
    const statusOk = response.status === check.expectStatus;
    const textOk = check.expectText ? body.includes(check.expectText) : true;
    return {
      ...check,
      url,
      status: response.status,
      ok: statusOk && textOk,
      error: statusOk ? undefined : `Expected HTTP ${check.expectStatus}`,
      textMatched: textOk,
    };
  } catch (error) {
    return {
      ...check,
      url,
      status: "error",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

if (!baseUrl) {
  const result = {
    ok: false,
    error: "Missing deployment URL. Pass --url or set POSTDEPLOY_URL/NEXT_PUBLIC_SITE_URL.",
    checkedAt: new Date().toISOString(),
  };
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.error(result.error);
  process.exit(1);
}

const results = await Promise.all(checks.map(runCheck));
const failed = results.filter((check) => !check.ok);
const output = {
  ok: failed.length === 0,
  dryRun,
  baseUrl,
  checkedAt: new Date().toISOString(),
  checks: results,
};

if (json) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(`Lead OS post-deploy smoke check${dryRun ? " (dry run)" : ""}`);
  console.log(`Target: ${baseUrl}`);
  for (const check of results) {
    const marker = check.ok ? "PASS" : "FAIL";
    console.log(`[${marker}] ${check.id} ${check.path} -> ${check.status}`);
    if (check.error) console.log(`       ${check.error}`);
  }
}

process.exitCode = output.ok ? 0 : 1;
