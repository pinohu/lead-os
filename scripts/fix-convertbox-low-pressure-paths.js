const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;

const LOW_PRESSURE_LABELS = {
  "232594": "[?] Not sure which cleaning path fits",
  "232595": "[?] Help me choose the urgent path",
  "232596": "[?] Help me scope the project first",
  "232598": "[?] Help me compare project options",
  "232599": "[?] I want help choosing privately",
  "232600": "[?] Help me choose the right professional",
  "232601": "[?] Help classify my service",
};

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

function patch(box, id) {
  const label = LOW_PRESSURE_LABELS[id];
  const firstStep = (((box.variations || [])[0] || {}).steps || [])[0];
  const buttons = (firstStep?.elements?.center || []).filter((element) => element.type === "button");
  const button = buttons[0];
  const items = button?.options?.items || [];
  const populated = items.filter((item) => item.text);
  const target = populated[populated.length - 1];
  if (target) {
    target.text = `<b>${label}</b>`;
    target.value = label.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    target.backgroundColor = "#6B7280";
    target.color = "#ffffff";
  }
  box.meta = box.meta || {};
  box.meta.ep_low_pressure_path_fixed = true;
  box.meta.ep_low_pressure_path_fixed_at = new Date().toISOString();
  box.active = false;
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
  for (const id of Object.keys(LOW_PRESSURE_LABELS)) {
    const box = await page.evaluate(async (id) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      const parsed = await res.json();
      return parsed.box || parsed.data || parsed;
    }, id);
    patch(box, id);
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
      return { status: res.status, text: (await res.text()).slice(0, 100) };
    }, { id, box });
    results.push({ id, ok: save.status >= 200 && save.status < 300, label: LOW_PRESSURE_LABELS[id] });
  }

  await browser.close();
  console.log(JSON.stringify({ updated: results.filter((result) => result.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
