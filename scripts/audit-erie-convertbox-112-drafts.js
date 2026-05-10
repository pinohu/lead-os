const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;
const ROOT = path.join(__dirname, "..");
const IMPLEMENTATION_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "convertbox-implementation");
const MATRIX_PATH = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-SERVICE-MATRIX.json");
const OUT_JSON = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-DRAFT-AUDIT.json");
const OUT_MD = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-DRAFT-AUDIT.md");

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

function strip(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else Object.values(value).forEach((item) => walk(item, visit));
}

function visibleCopy(box) {
  const out = [];
  walk(box, (node) => {
    if (node?.options?.text) out.push(strip(node.options.text));
    if (node?.options?.items) {
      for (const item of node.options.items || []) if (item?.text) out.push(strip(item.text));
    }
    if (node?.input?.placeholder) out.push(node.input.placeholder);
  });
  return out.join(" ");
}

async function api(page, url) {
  return page.evaluate(async (url) => {
    const res = await fetch(url, { credentials: "include", headers: { accept: "application/json", "x-requested-with": "XMLHttpRequest" } });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = text; }
    return { ok: res.ok, status: res.status, data, text: text.slice(0, 300) };
  }, url);
}

async function main() {
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, "utf8"));
  const expected = new Map(matrix.services.map((service) => [service.service_slug, service]));

  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage();
  await login(page, username, password);
  const list = await api(page, `https://app.convertbox.com/api/sites/${SITE_ID}/boxes`);
  if (!list.ok) throw new Error(`List boxes failed ${list.status}: ${list.text}`);

  const serviceBoxes = (list.data.data || [])
    .filter((box) => box.meta?.ep_full_service_matrix_applied)
    .sort((a, b) => Number(a.meta?.ep_matrix_service_number || 0) - Number(b.meta?.ep_matrix_service_number || 0));

  const bySlug = new Map();
  const duplicates = [];
  for (const box of serviceBoxes) {
    const slug = box.meta?.ep_matrix_service_slug;
    if (bySlug.has(slug)) duplicates.push(slug);
    else bySlug.set(slug, box);
  }

  const audits = [];
  for (const service of matrix.services) {
    const listedBox = bySlug.get(service.service_slug);
    const issues = [];
    if (!listedBox) {
      issues.push("Missing service draft in ConvertBox account.");
      audits.push({ service_number: service.service_number, service_label: service.service_label, service_slug: service.service_slug, box_id: null, ok: false, issues });
      continue;
    }
    const detail = await api(page, `https://app.convertbox.com/api/boxes/${listedBox.id}`);
    if (!detail.ok) {
      issues.push(`Could not load box details: ${detail.status}`);
      audits.push({ service_number: service.service_number, service_label: service.service_label, service_slug: service.service_slug, box_id: listedBox.id, ok: false, issues });
      continue;
    }
    const box = detail.data.box || detail.data.data || detail.data;
    const variation = (box.variations || [])[0] || {};
    const steps = variation.steps || [];
    const copy = visibleCopy(box);
    if (box.active !== false) issues.push("Box is active; expected inactive draft.");
    if (box.meta?.ep_matrix_service_slug !== service.service_slug) issues.push("Service slug metadata mismatch.");
    if (box.meta?.ep_service_family !== service.family) issues.push("Family metadata mismatch.");
    if (!box.meta?.ep_full_service_matrix_applied) issues.push("Missing full matrix metadata.");
    if (!variation.profile?.photo?.path) issues.push("Missing profile photo.");
    if (!variation.teaser?.photo?.path) issues.push("Missing teaser photo.");
    if (!steps.length) issues.push("No steps found.");
    if (!steps[0]?.elements?.center?.some((element) => element.type === "button")) issues.push("First step has no button choices.");
    if (!JSON.stringify(box).includes("ep_branch_metadata")) issues.push("Button branch metadata missing.");
    if ((box.rules_display?.target_pages?.include || []).length < 5) issues.push("Insufficient URL target rules.");
    if (/30-mile|30 miles|One routed path|\[(home|brief|phone|spark|box|wash|tool|bolt|cal|pet|care|doc|lock|map|\$|arrow|plan|badge)\]/i.test(copy)) issues.push("Bad visible copy token found.");
    audits.push({
      service_number: service.service_number,
      service_label: service.service_label,
      service_slug: service.service_slug,
      family: service.family,
      box_id: box.id,
      box_name: box.name,
      active: box.active,
      step_count: steps.length,
      target_count: box.rules_display?.target_pages?.include?.length || 0,
      ok: issues.length === 0,
      issues,
    });
  }

  await browser.close();
  const payload = {
    audited_at: new Date().toISOString(),
    expected_services: expected.size,
    service_drafts_found: serviceBoxes.length,
    unique_service_drafts_found: bySlug.size,
    duplicate_slugs: duplicates,
    passed: audits.filter((audit) => audit.ok).length,
    failed: audits.filter((audit) => !audit.ok).length,
    audits,
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  let md = `# Erie.Pro ConvertBox 112 Draft Audit\n\nDate: 2026-05-10\n\n- Expected services: ${payload.expected_services}\n- Service drafts found: ${payload.service_drafts_found}\n- Unique service drafts found: ${payload.unique_service_drafts_found}\n- Passed: ${payload.passed}\n- Failed: ${payload.failed}\n- Duplicate slugs: ${payload.duplicate_slugs.length ? payload.duplicate_slugs.join(", ") : "none"}\n\n`;
  md += `| # | Service | Box id | Active | Steps | Targets | Status |\n|---:|---|---:|---|---:|---:|---|\n`;
  for (const audit of audits) {
    md += `| ${audit.service_number} | ${audit.service_label} | ${audit.box_id || ""} | ${audit.active} | ${audit.step_count || 0} | ${audit.target_count || 0} | ${audit.ok ? "ok" : audit.issues.join("; ")} |\n`;
  }
  fs.writeFileSync(OUT_MD, md);
  console.log(JSON.stringify({
    expected_services: payload.expected_services,
    service_drafts_found: payload.service_drafts_found,
    unique_service_drafts_found: payload.unique_service_drafts_found,
    passed: payload.passed,
    failed: payload.failed,
    duplicate_slugs: payload.duplicate_slugs,
    out_json: OUT_JSON,
    out_md: OUT_MD,
  }, null, 2));
  if (payload.failed || payload.duplicate_slugs.length || payload.unique_service_drafts_found !== payload.expected_services) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
