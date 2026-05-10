const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;

const BOX_IDS = [
  "232597",
  "232595",
  "232594",
  "232596",
  "232598",
  "232599",
  "232600",
  "232601",
  "232602",
  "232603",
];

const FAMILY_ASSETS = {
  "Emergency Home Response": { label: "URGENT", initials: "ER", color: "#C8102E", bg: "#FFF5F5" },
  "Cleaning And Turnover": { label: "READY", initials: "CL", color: "#0F766E", bg: "#F0FDFA" },
  "Planned Home Projects": { label: "PLAN", initials: "PR", color: "#C8102E", bg: "#F8FAFC" },
  "Health And Wellness Appointments": { label: "CARE", initials: "AP", color: "#1F7A8C", bg: "#F0F9FF" },
  "Professional Legal And Financial": { label: "PRO", initials: "CO", color: "#31456A", bg: "#F8FAFC" },
  "Provider Territory Claim": { label: "CLAIM", initials: "PV", color: "#0F766E", bg: "#F0FDFA" },
  "Returning And Exit Rescue": { label: "SAVE", initials: "RE", color: "#C8102E", bg: "#F8FAFC" },
};

function makeSvg(asset) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="${asset.bg}"/>
  <circle cx="256" cy="232" r="142" fill="#ffffff" stroke="${asset.color}" stroke-width="18"/>
  <text x="256" y="260" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="112" font-weight="800" fill="${asset.color}">${asset.initials}</text>
  <rect x="126" y="350" width="260" height="58" rx="29" fill="${asset.color}"/>
  <text x="256" y="389" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${asset.label}</text>
</svg>`.trim();
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

async function uploadFamilyImage(page, family, asset) {
  const svg = makeSvg(asset);
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  const fileName = `erie-pro-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.svg`;

  return page.evaluate(async ({ accountId, base64, fileName }) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const file = new File([bytes], fileName, { type: "image/svg+xml" });
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://app.convertbox.com/api/accounts/${accountId}/images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Upload failed ${res.status}: ${text.slice(0, 300)}`);
    const parsed = JSON.parse(text);
    return parsed.image || parsed.data || parsed;
  }, { accountId: ACCOUNT_ID, base64, fileName });
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

  const uploaded = {};
  for (const [family, asset] of Object.entries(FAMILY_ASSETS)) {
    uploaded[family] = await uploadFamilyImage(page, family, asset);
  }

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

    const family = box.meta && box.meta.ep_service_family;
    const photo = uploaded[family];
    if (!photo) {
      results.push({ id, ok: false, error: `No uploaded asset for ${family}` });
      continue;
    }

    box.active = false;
    box.meta = box.meta || {};
    box.meta.ep_profile_photos_applied = true;
    box.meta.ep_profile_photos_applied_at = new Date().toISOString();
    box.meta.ep_profile_photo_id = photo.id;

    for (const variation of box.variations || []) {
      variation.profile = variation.profile || {};
      variation.profile.enabled = true;
      variation.profile.photo = photo;
      variation.profile.name = "Erie.Pro";
      variation.profile.name_show = true;
      variation.profile.title_show = true;
      variation.profile.layout = "chat";

      variation.teaser = variation.teaser || {};
      variation.teaser.enabled = true;
      variation.teaser.photo = photo;
      variation.teaser.icon = "none";
    }

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
      return { status: res.status, text: (await res.text()).slice(0, 200) };
    }, { id, box });

    const verify = await page.evaluate(async (id) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      const parsed = await res.json();
      const box = parsed.box || parsed.data || parsed;
      const variation = (box.variations || [])[0] || {};
      return {
        active: box.active,
        family: box.meta && box.meta.ep_service_family,
        applied: Boolean(box.meta && box.meta.ep_profile_photos_applied),
        profilePhoto: variation.profile && variation.profile.photo,
        teaserPhoto: variation.teaser && variation.teaser.photo,
        teaserIcon: variation.teaser && variation.teaser.icon,
      };
    }, id);

    results.push({ id, ok: save.status >= 200 && save.status < 300, save, verify });
  }

  await browser.close();
  console.log(JSON.stringify({ uploaded, updated: results.filter((r) => r.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
