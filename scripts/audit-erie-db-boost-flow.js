const fs = require("fs");
const path = require("path");
const { Client } = require("../erie-pro/node_modules/pg");

function readEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

function redact(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch {
    return "[present]";
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { status: response.status, ok: response.ok, data };
}

async function main() {
  const envPath = process.argv[2] || "C:/tmp/erie-pro-production.env";
  const env = { ...process.env, ...readEnvFile(envPath) };
  const databaseUrl = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
  const baseUrl = env.NEXT_PUBLIC_APP_URL?.startsWith("http")
    ? env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://erie.pro";

  const timestamp = Date.now();
  const testEmail = `codex-db-boost-test+${timestamp}@lead-audit.invalid`;
  const sourcePage = `${baseUrl}/plumbing?codex_db_boost_test=${timestamp}`;
  const payload = {
    firstName: "Codex",
    lastName: "DbBoostTest",
    email: testEmail,
    phone: "8145550199",
    niche: "plumbing",
    city: "erie",
    message:
      "TEST ONLY - Codex database and Boost.space sync audit. Please ignore.",
    sourcePage,
    routingIntent: "general",
    tcpaConsent: true,
    tcpaConsentText:
      "TEST ONLY - synthetic consent for database and Boost.space integration audit.",
  };

  const report = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    env: {
      databaseUrl: redact(databaseUrl),
      boostApiTokenPresent: Boolean(env.BOOST_SPACE_API_TOKEN || env.BOOSTSPACE_API_TOKEN),
      boostWebhookPresent: Boolean(env.BOOST_SPACE_LEAD_WEBHOOK_URL || env.BOOSTSPACE_LEAD_WEBHOOK_URL),
      boostApiBaseUrl: env.BOOST_SPACE_API_BASE_URL || env.BOOSTSPACE_API_BASE_URL || null,
      boostLeadEventSpaceId: env.BOOST_SPACE_LEAD_EVENT_SPACE_ID || null,
      boostLeadEventStatusSystemId: env.BOOST_SPACE_LEAD_EVENT_STATUS_SYSTEM_ID || null,
    },
    health: null,
    leadSubmit: null,
    database: null,
    boostSync: null,
  };

  report.health = await fetchJson(`${baseUrl}/api/health`, {
    headers: { Accept: "application/json" },
  });

  report.leadSubmit = await fetchJson(`${baseUrl}/api/lead`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await new Promise((resolve) => setTimeout(resolve, 15000));

  if (!databaseUrl) {
    report.database = { ok: false, error: "DATABASE_URL is not available" };
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const leadId = report.leadSubmit?.data?.leadId;
    const byId = leadId
      ? await client.query(
          `select id, niche, city, email, source, "routeType", "boostspaceSyncStatus",
                  "boostspaceSyncedAt", "boostspaceLastError", "externalSyncPayload" is not null as has_external_sync_payload,
                  "createdAt"
             from leads
            where id = $1`,
          [leadId],
        )
      : { rows: [] };
    const byEmail = await client.query(
      `select id, niche, city, email, source, "routeType", "boostspaceSyncStatus",
              "boostspaceSyncedAt", "boostspaceLastError", "externalSyncPayload" is not null as has_external_sync_payload,
              "createdAt"
         from leads
        where email = $1
        order by "createdAt" desc
        limit 3`,
      [testEmail],
    );

    const leadRow = byId.rows[0] || byEmail.rows[0] || null;
    report.database = {
      ok: Boolean(leadRow),
      leadFoundById: Boolean(byId.rows[0]),
      leadFoundByEmail: Boolean(byEmail.rows[0]),
      lead: leadRow,
    };
    report.boostSync = leadRow
      ? {
          status: leadRow.boostspaceSyncStatus,
          syncedAt: leadRow.boostspaceSyncedAt,
          lastError: leadRow.boostspaceLastError,
          hasPayload: leadRow.has_external_sync_payload,
        }
      : null;
  } catch (error) {
    report.database = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    report.boostSync = {
      status: "unknown",
      reason: "Could not query production database after submission.",
    };
  } finally {
    await client.end().catch(() => {});
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.health.ok || !report.leadSubmit.ok || !report.database?.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
