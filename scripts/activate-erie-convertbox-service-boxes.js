const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const ROOT = path.join(__dirname, "..");
const IMPLEMENTATION_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "convertbox-implementation");
const OUT_JSON = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-ACTIVATION.json");
const OUT_MD = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-ACTIVATION.md");
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
    const res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-requested-with": "XMLHttpRequest",
        ...(options.headers || {}),
      },
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

async function main() {
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage();
  await login(page, username, password);

  const list = await api(page, `https://app.convertbox.com/api/sites/${SITE_ID}/boxes`);
  if (!list.ok) throw new Error(`List boxes failed ${list.status}: ${list.text}`);

  const serviceBoxes = (list.data.data || [])
    .filter((box) => box.meta?.ep_full_service_matrix_applied)
    .sort((a, b) => Number(a.meta?.ep_matrix_service_number || 0) - Number(b.meta?.ep_matrix_service_number || 0));

  const results = [];
  for (const listedBox of serviceBoxes) {
    const detail = await api(page, `https://app.convertbox.com/api/boxes/${listedBox.id}`);
    if (!detail.ok) {
      results.push({ box_id: listedBox.id, ok: false, action: "load-failed", status: detail.status });
      continue;
    }

    const box = detail.data.box || detail.data.data || detail.data;
    box.active = true;
    box.meta = {
      ...(box.meta || {}),
      ep_service_activation_applied: true,
      ep_service_activation_date: "2026-05-10",
    };

    const save = await api(page, `https://app.convertbox.com/api/boxes/${box.id}`, {
      method: "PUT",
      body: JSON.stringify(box),
    });

    results.push({
      box_id: box.id,
      service_number: Number(box.meta?.ep_matrix_service_number || 0),
      service_label: box.meta?.ep_matrix_service_label,
      service_slug: box.meta?.ep_website_service_slug || box.meta?.ep_matrix_service_slug,
      active: true,
      ok: save.ok,
      action: save.ok ? "activated" : "save-failed",
      status: save.status,
    });
  }

  await browser.close();

  const payload = {
    activated_at: new Date().toISOString(),
    attempted: results.length,
    activated: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);

  let md = `# Erie.Pro ConvertBox 112 Service Activation\n\nDate: 2026-05-10\n\n`;
  md += `- Attempted: ${payload.attempted}\n`;
  md += `- Activated: ${payload.activated}\n`;
  md += `- Failed: ${payload.failed}\n\n`;
  md += `| # | Service | Slug | Box id | Active | Status |\n|---:|---|---|---:|---|---|\n`;
  for (const result of results) {
    md += `| ${result.service_number || ""} | ${result.service_label || ""} | ${result.service_slug || ""} | ${result.box_id || ""} | ${result.active} | ${result.ok ? "ok" : "failed"} |\n`;
  }
  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({
    attempted: payload.attempted,
    activated: payload.activated,
    failed: payload.failed,
    out_json: OUT_JSON,
    out_md: OUT_MD,
  }, null, 2));

  if (payload.failed || payload.activated !== 112) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
