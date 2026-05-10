const fs = require("fs");

const FIELD_IDS = {
  "Erie Event ID": 2917,
  "Event Type": 2925,
  "Source System": 2933,
  "Source Domain": 2937,
  "Source Page URL": 2941,
  "Service Niche": 2949,
  "Service Slug": 2953,
  City: 2957,
  State: 2961,
  Urgency: 2977,
  "Consumer Full Name": 3045,
  "Consumer Phone": 3049,
  "Consumer Email": 3053,
  "Request Summary": 3061,
  "Consent to Contact": 3129,
  "Marketing Consent": 3133,
  "Raw Payload": 3173,
  "Boost.space Sync Status": 3181,
  "Created At": 3205,
};

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
    env[match[1]] = value.replace(/\\r\\n$/g, "").trim();
  }
  return env;
}

async function main() {
  const envPath = process.argv[2] || "C:/tmp/erie-pro-production.env";
  const env = { ...process.env, ...readEnvFile(envPath) };
  const apiToken =
    env.BOOST_SPACE_API_TOKEN ||
    env.BOOSTSPACE_API_TOKEN ||
    env.BOOST_SPACE_API_KEY ||
    env.BOOSTSPACE_API_KEY;
  const apiBaseUrl = (
    env.BOOST_SPACE_API_BASE_URL ||
    env.BOOSTSPACE_API_BASE_URL ||
    "https://neatcircle.boost.space/api"
  ).replace(/\/$/, "");
  const spaceId = Number(env.BOOST_SPACE_LEAD_EVENT_SPACE_ID || 5);
  const statusSystemId = Number(env.BOOST_SPACE_LEAD_EVENT_STATUS_SYSTEM_ID || 94);

  if (!apiToken) throw new Error("Boost.space API token is missing.");

  const timestamp = new Date().toISOString();
  const eventId = `codex-boost-direct-test-${Date.now()}`;
  const flatPayload = {
    "Erie Event ID": eventId,
    "Event Type": "codex.integration_test",
    "Source System": "codex-audit",
    "Source Domain": "erie.pro",
    "Source Page URL": "https://erie.pro/plumbing?codex_boost_direct_test=1",
    "Service Niche": "plumbing",
    "Service Slug": "plumbing",
    City: "erie",
    State: "PA",
    Urgency: "test",
    "Consumer Full Name": "Codex Boost Test",
    "Consumer Phone": "+18145550199",
    "Consumer Email": "codex-boost-direct-test@example.com",
    "Request Summary":
      "TEST ONLY - direct Boost.space API credential and schema audit. Please ignore.",
    "Consent to Contact": false,
    "Marketing Consent": false,
    "Raw Payload": JSON.stringify({ test: true, eventId, timestamp }),
    "Boost.space Sync Status": "direct_test",
    "Created At": timestamp,
  };

  const customFieldsValues = Object.entries(FIELD_IDS).map(([fieldName, customFieldInputId]) => ({
    customFieldInputId,
    module: "custom-module-item",
    value:
      typeof flatPayload[fieldName] === "boolean"
        ? flatPayload[fieldName]
          ? "1"
          : "0"
        : String(flatPayload[fieldName] ?? ""),
  }));

  const response = await fetch(`${apiBaseUrl}/custom-module-item`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "EriePro-BoostDirectAudit/1.0",
    },
    body: JSON.stringify({ spaceId, statusSystemId, customFieldsValues }),
  });

  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 1000) };
  }

  console.log(JSON.stringify({
    checkedAt: timestamp,
    endpoint: `${apiBaseUrl}/custom-module-item`,
    spaceId,
    statusSystemId,
    status: response.status,
    ok: response.ok,
    eventId,
    responsePreview: body,
  }, null, 2));

  if (!response.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
