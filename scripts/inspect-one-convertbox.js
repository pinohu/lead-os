const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";

async function main() {
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  const boxId = process.argv[2] || "232604";
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();
  await page.goto("https://app.convertbox.com/login", { waitUntil: "domcontentloaded" });
  await page.fill("input[type=email], input[name=email], input[name=username]", username);
  await page.fill("input[type=password], input[name=password]", password);
  await Promise.all([
    page.waitForLoadState("networkidle").catch(() => {}),
    page.click("button:has-text('Sign In'), input[type=submit]"),
  ]);
  await page.goto(`https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`, {
    waitUntil: "networkidle",
  });
  const response = await page.evaluate(async (id) => {
    const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
      credentials: "include",
      headers: { accept: "application/json", "x-requested-with": "XMLHttpRequest" },
    });
    return res.json();
  }, boxId);
  await browser.close();

  const box = response.box || response.data || response;
  const variation = (box.variations || [])[0] || {};
  console.log(JSON.stringify({
    id: box.id,
    name: box.name,
    active: box.active,
    type: box.type,
    style: box.style,
    rules_display: box.rules_display,
    rules_targeting: box.rules_targeting,
    rules_closing: box.rules_closing,
    trigger: box.trigger,
    profile: variation.profile,
    teaser: variation.teaser,
    meta: box.meta,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
