const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;
const BOX_IDS = ["232597", "232595", "232594", "232596", "232598", "232599", "232600", "232601", "232602", "232603"];

const replacements = new Map([
  ["Water, heat, power, or storm", "Water, heat, power, or storm"],
  ["Lockout, access, or roadside", "Lockout, access, or roadside"],
  ["Not sure what counts as urgent", "Not sure what counts as urgent"],
  ["Leak, backup, no heat, or no power", "Leak, backup, no heat, or no power"],
  ["Lockout, towing, or access issue", "Lockout, towing, or access issue"],
  ["Help me choose the urgent path", "Help me choose the urgent path"],
  ["Cleaning or turnover", "Cleaning or turnover"],
  ["Moving, junk, or dumpster", "Moving, junk, or dumpster"],
  ["Not sure which cleaning path fits", "Not sure which cleaning path fits"],
  ["Repair or replacement", "Repair or replacement"],
  ["Remodel or build", "Remodel or build"],
  ["Help me scope the project first", "Help me scope the project first"],
  ["Kitchen, bath, basement, or remodel", "Kitchen, bath, basement, or remodel"],
  ["Roof, siding, windows, or exterior", "Roof, siding, windows, or exterior"],
  ["Help me compare project options", "Help me compare project options"],
  ["Dental, vision, skin, hearing, or therapy", "Dental, vision, skin, hearing, or therapy"],
  ["Pet care or grooming", "Pet care or grooming"],
  ["I want help choosing privately", "I want help choosing privately"],
  ["Legal, tax, insurance, or financial", "Legal, tax, insurance, or financial"],
  ["Real estate, inspection, or mortgage", "Real estate, inspection, or mortgage"],
  ["Help me choose the right professional", "Help me choose the right professional"],
  ["Home or property service", "Home or property service"],
  ["Health, professional, or appointment service", "Health, professional, or appointment service"],
  ["Help classify my service", "Help classify my service"],
  ["Not sure which service fits", "Not sure which service fits"],
  ["Still comparing price or providers", "Still comparing price or providers"],
  ["Need help today", "Need help today"],
  ["Finish a service request", "Finish a service request"],
  ["Ask about price or timing", "Ask about price or timing"],
  ["Request a callback", "Request a callback"],
]);

function cleanLabel(value) {
  const stripped = String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\[(?:!|\?|phone|spark|box|wash|tool|home|bolt|cal|pet|care|doc|lock|brief|map|\$|arrow|plan|badge)\]\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return replacements.get(stripped) || stripped;
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else Object.values(value).forEach((item) => walk(item, visit));
}

function patchBox(box) {
  box.active = false;
  box.meta = box.meta || {};
  box.meta.ep_pseudo_icons_removed = true;
  box.meta.ep_pseudo_icons_removed_at = new Date().toISOString();

  walk(box, (node) => {
    if (node.type === "button" && node.options && Array.isArray(node.options.items)) {
      node.options.items.forEach((item) => {
        if (!item || !item.text) return;
        const label = cleanLabel(item.text);
        item.text = `<b>${label}</b>`;
        item.value = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      });
    }
  });
}

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

async function main() {
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();
  await login(page, username, password);

  const results = [];
  for (const id of BOX_IDS) {
    const box = await page.evaluate(async (id) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      const parsed = await res.json();
      return parsed.box || parsed.data || parsed;
    }, id);
    patchBox(box);
    const save = await page.evaluate(async ({ id, box }) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json;charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify(box),
      });
      return { status: res.status, text: (await res.text()).slice(0, 120) };
    }, { id, box });
    const verify = await page.evaluate(async (id) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      const parsed = await res.json();
      const box = parsed.box || parsed.data || parsed;
      const text = JSON.stringify(box);
      return {
        active: box.active,
        removed: Boolean(box.meta && box.meta.ep_pseudo_icons_removed),
        hasPseudoIcon: /\[(?:!|\?|phone|spark|box|wash|tool|home|bolt|cal|pet|care|doc|lock|brief|map|\$|arrow|plan|badge)\]/i.test(text),
      };
    }, id);
    results.push({ id, ok: save.status >= 200 && save.status < 300, verify });
  }

  await browser.close();
  console.log(JSON.stringify({ updated: results.filter((result) => result.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
