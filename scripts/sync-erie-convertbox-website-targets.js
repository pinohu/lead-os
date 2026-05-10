const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const ROOT = path.join(__dirname, "..");
const IMPLEMENTATION_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "convertbox-implementation");
const WEBSITE_MAP_PATH = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-WEBSITE-MAP.json");
const OUT_JSON = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-WEBSITE-TARGET-SYNC.json");
const OUT_MD = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-WEBSITE-TARGET-SYNC.md");
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;

async function login(page, username, password) {
  await page.goto("https://app.convertbox.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.fill("input[type=email], input[name=email], input[name=username]", username);
  await page.fill("input[type=password], input[name=password]", password);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {}),
    page.click("button:has-text('Sign In'), input[type=submit]"),
  ]);
  await page.goto(DASHBOARD_URL, { waitUntil: "networkidle", timeout: 60000 });
}

async function api(page, url, options = {}) {
  return page.evaluate(async ({ url, options }) => {
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      ...(options.headers || {}),
    };
    const res = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }
    return { ok: res.ok, status: res.status, data, text: text.slice(0, 500) };
  }, { url, options });
}

function findSiteUuid(value) {
  const seen = new Set();
  const candidates = [];

  function walk(node, pathParts = []) {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...pathParts, String(index)]));
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      const nextPath = [...pathParts, key];
      if (
        typeof child === "string" &&
        /uuid|install|embed|script/i.test(nextPath.join(".")) &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(child)
      ) {
        candidates.push({ path: nextPath.join("."), value: child });
      }
      walk(child, nextPath);
    }
  }

  walk(value);
  return candidates;
}

async function discoverInstallUuid(page) {
  const endpoints = [
    `https://app.convertbox.com/api/sites/${SITE_ID}`,
    `https://app.convertbox.com/api/accounts/${ACCOUNT_ID}/sites`,
    "https://app.convertbox.com/api/sites",
  ];
  const checked = [];

  for (const endpoint of endpoints) {
    const res = await api(page, endpoint, { method: "GET" }).catch((error) => ({
      ok: false,
      status: "error",
      text: error.message,
    }));
    checked.push({ endpoint, ok: res.ok, status: res.status });
    if (!res.ok) continue;
    const candidates = findSiteUuid(res.data);
    if (candidates.length) {
      return { uuid: candidates[0].value, source: endpoint, candidates, checked };
    }
  }

  await page.goto(`https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/installation`, {
    waitUntil: "networkidle",
    timeout: 60000,
  }).catch(() => {});
  const html = await page.content();
  const match = html.match(/dataset\.uuid\s*=\s*["']([0-9a-f-]{36})["']/i) ||
    html.match(/data-uuid=["']([0-9a-f-]{36})["']/i);
  if (match) {
    return { uuid: match[1], source: "installation-page-html", candidates: [], checked };
  }

  return { uuid: null, source: null, candidates: [], checked };
}

async function main() {
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const map = JSON.parse(fs.readFileSync(WEBSITE_MAP_PATH, "utf8"));
  const servicesByConvertBoxSlug = new Map(
    map.services.map((service) => [service.convertBoxServiceSlug, service]),
  );

  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage();
  await login(page, username, password);

  const install = await discoverInstallUuid(page);

  const list = await api(page, `https://app.convertbox.com/api/sites/${SITE_ID}/boxes`);
  if (!list.ok) throw new Error(`List boxes failed ${list.status}: ${list.text}`);

  const results = [];
  const serviceBoxes = (list.data.data || [])
    .filter((box) => box.meta?.ep_full_service_matrix_applied)
    .sort((a, b) => Number(a.meta?.ep_matrix_service_number || 0) - Number(b.meta?.ep_matrix_service_number || 0));

  for (const listedBox of serviceBoxes) {
    const convertBoxSlug = listedBox.meta?.ep_matrix_service_slug;
    const mapped = servicesByConvertBoxSlug.get(convertBoxSlug);
    if (!mapped) {
      results.push({ box_id: listedBox.id, convertBoxSlug, ok: false, action: "missing-map" });
      continue;
    }

    const detail = await api(page, `https://app.convertbox.com/api/boxes/${listedBox.id}`);
    if (!detail.ok) {
      results.push({ box_id: listedBox.id, convertBoxSlug, ok: false, action: "load-failed", status: detail.status });
      continue;
    }

    const box = detail.data.box || detail.data.data || detail.data;
    const currentInclude = box.rules_display?.target_pages?.include || [];
    const nextInclude = mapped.sitePageTargets.include.map((value) => ({ type: "contains", value }));
    const changed = JSON.stringify(currentInclude) !== JSON.stringify(nextInclude) ||
      box.meta?.ep_website_service_slug !== mapped.serviceSlug;

    if (changed) {
      box.active = false;
      box.meta = {
        ...(box.meta || {}),
        ep_website_target_sync_applied: true,
        ep_website_service_slug: mapped.serviceSlug,
        ep_convertbox_service_slug: mapped.convertBoxServiceSlug,
      };
      box.rules_display = {
        ...(box.rules_display || {}),
        target_pages: {
          ...(box.rules_display?.target_pages || {}),
          include: nextInclude,
          exclude: mapped.sitePageTargets.exclude.map((value) => ({ type: "contains", value })),
        },
      };
      const save = await api(page, `https://app.convertbox.com/api/boxes/${box.id}`, {
        method: "PUT",
        body: JSON.stringify(box),
      });
      if (!save.ok) {
        results.push({
          box_id: box.id,
          service: mapped.serviceLabel,
          serviceSlug: mapped.serviceSlug,
          convertBoxSlug,
          ok: false,
          action: "save-failed",
          status: save.status,
        });
        continue;
      }
    }

    results.push({
      box_id: box.id,
      service: mapped.serviceLabel,
      serviceSlug: mapped.serviceSlug,
      convertBoxSlug,
      ok: true,
      active: box.active,
      action: changed ? "updated" : "unchanged",
      target_count: nextInclude.length,
    });
  }

  await browser.close();

  const payload = {
    synced_at: new Date().toISOString(),
    install_uuid: install.uuid,
    install_uuid_source: install.source,
    install_uuid_checked: install.checked,
    attempted: results.length,
    updated: results.filter((result) => result.action === "updated").length,
    unchanged: results.filter((result) => result.action === "unchanged").length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);

  let md = `# Erie.Pro ConvertBox Website Target Sync\n\nDate: 2026-05-10\n\n`;
  md += `- Attempted: ${payload.attempted}\n`;
  md += `- Updated: ${payload.updated}\n`;
  md += `- Unchanged: ${payload.unchanged}\n`;
  md += `- Failed: ${payload.failed}\n`;
  md += `- Install UUID found: ${payload.install_uuid ? "yes" : "no"}\n\n`;
  md += `| Service | Erie.Pro slug | ConvertBox slug | Box id | Action | Active | Targets | Status |\n`;
  md += `|---|---|---|---:|---|---|---:|---|\n`;
  for (const result of results) {
    md += `| ${result.service || ""} | ${result.serviceSlug || ""} | ${result.convertBoxSlug || ""} | ${result.box_id || ""} | ${result.action || ""} | ${result.active} | ${result.target_count || 0} | ${result.ok ? "ok" : "failed"} |\n`;
  }
  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({
    attempted: payload.attempted,
    updated: payload.updated,
    unchanged: payload.unchanged,
    failed: payload.failed,
    install_uuid_found: Boolean(payload.install_uuid),
    install_uuid_source: payload.install_uuid_source,
    out_json: OUT_JSON,
    out_md: OUT_MD,
  }, null, 2));

  if (payload.failed || !payload.install_uuid) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
