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

const VISUALS = {
  "Emergency Home Response": {
    label: "Urgent Erie County Help",
    accent: "#C8102E",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#FFF5F5",
    icon: "[!]",
    trust: ["Fast routing", "Safety-first", "Erie County focused"],
    buttonIcons: ["[!]", "[phone]", "[?]"],
  },
  "Cleaning And Turnover": {
    label: "Cleaning, Moving, And Turnover",
    accent: "#0F766E",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#F0FDFA",
    icon: "[spark]",
    trust: ["Date-aware", "Property-ready", "No public blast"],
    buttonIcons: ["[spark]", "[box]", "[wash]"],
  },
  "Planned Home Projects": {
    label: "Project Planning",
    accent: "#C8102E",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#F8FAFC",
    icon: "[plan]",
    trust: ["Scope-first", "Better first call", "Local project fit"],
    buttonIcons: ["[tool]", "[home]", "[bolt]"],
  },
  "Health And Wellness Appointments": {
    label: "Private Appointment Request",
    accent: "#1F7A8C",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#F0F9FF",
    icon: "[care]",
    trust: ["Private summary", "Appointment-focused", "Respectful follow-up"],
    buttonIcons: ["[cal]", "[pet]", "[care]"],
  },
  "Professional Legal And Financial": {
    label: "Professional Consultation",
    accent: "#31456A",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#F8FAFC",
    icon: "[doc]",
    trust: ["Brief summary", "Deadline-aware", "Sensitive details protected"],
    buttonIcons: ["[doc]", "[home]", "[lock]"],
  },
  "Provider Territory Claim": {
    label: "Provider Category Review",
    accent: "#0F766E",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#F0FDFA",
    icon: "[badge]",
    trust: ["Category check", "Community fit", "No territory promise before review"],
    buttonIcons: ["[home]", "[brief]", "[map]"],
  },
  "Returning And Exit Rescue": {
    label: "Finish Or Save Your Request",
    accent: "#C8102E",
    dark: "#1F3A5F",
    muted: "#4A4A4A",
    soft: "#F8FAFC",
    icon: "[arrow]",
    trust: ["Pick up faster", "Ask a smaller question", "No pressure"],
    buttonIcons: ["[?]", "[$]", "[phone]"],
  },
};

function columns(step) {
  if (!step || !step.elements) return [];
  return ["center", "left", "right"].map((key) => step.elements[key]).filter(Array.isArray);
}

function allElements(step) {
  return columns(step).flat();
}

function textElement(id, html, color, fontSize, top = 1, bottom = 1) {
  return {
    id,
    type: "text",
    title: "Text",
    options: {
      fontFamily: "roboto",
      color,
      fontSize: String(fontSize),
      lineHeight: "1.32",
      vSpacingTop: top,
      vSpacingBottom: bottom,
      text: html,
      mobile: {
        overwritten: true,
        fontSize: String(Math.max(12, Math.min(Number(fontSize), 22))),
        lineHeight: "1.32",
        vSpacingTop: top,
        vSpacingBottom: bottom,
      },
    },
  };
}

function dividerElement(id, color) {
  return {
    id,
    type: "divider",
    title: "Divider",
    options: {
      hideOnMobile: false,
      vSpacingTop: 1,
      vSpacingBottom: 1,
      color,
      width: 500,
      height: 1,
      mobile: { overwritten: true, vSpacingTop: 1, vSpacingBottom: 1 },
    },
  };
}

function makeTrustRow(visual) {
  return `<div style="text-align:center;font-size:13px;line-height:1.45;color:${visual.muted};">${visual.trust.map((item) => `<span style="display:inline-block;margin:3px 6px;padding:5px 9px;border:1px solid #D7DEE6;border-radius:999px;background:#ffffff;">${item}</span>`).join("")}</div>`;
}

function decorateButtonItems(button, visual) {
  const items = (((button || {}).options || {}).items || []).filter(Boolean);
  items.forEach((item, index) => {
    if (!item.text) return;
    const clean = String(item.text).replace(/<[^>]*>/g, "").trim();
    const icon = visual.buttonIcons[index] || visual.icon;
    item.text = `<b>${icon} ${clean}</b>`;
    item.backgroundColor = index === 0 ? visual.accent : index === 1 ? visual.dark : "#6B7280";
    item.color = "#ffffff";
  });
  if (button && button.options) {
    button.options.shape = "rounded";
    button.options.width = "wide";
    button.options.size = "l";
    button.options.mobile = button.options.mobile || {};
    button.options.mobile.overwritten = true;
    button.options.mobile.size = "m";
  }
}

function patchStepVisuals(step, visual, boxId, stepIndex) {
  const center = step.elements && step.elements.center;
  if (!Array.isArray(center)) return;

  const texts = center.filter((element) => element.type === "text");
  if (texts[0]) {
    const existing = String(texts[0].options && texts[0].options.text || "");
    const clean = existing.replace(/<[^>]*>/g, "").trim();
    texts[0].options.text = `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${visual.soft};color:${visual.accent};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0;">${visual.icon} ${visual.label}</span><br><b>${clean}</b>`;
    texts[0].options.color = visual.accent;
    texts[0].options.fontSize = stepIndex === 0 ? "34" : "28";
  }

  if (texts[1]) {
    texts[1].options.color = visual.dark;
    texts[1].options.fontSize = stepIndex === 0 ? "18" : "17";
  }

  const hasTrust = center.some((element) => element.id === `visual-trust-${boxId}-${stepIndex}`);
  if (!hasTrust && stepIndex === 0) {
    const firstButtonIndex = center.findIndex((element) => element.type === "button");
    const insertAt = firstButtonIndex >= 0 ? firstButtonIndex : Math.min(center.length, 3);
    center.splice(insertAt, 0, dividerElement(`visual-divider-${boxId}-${stepIndex}`, "#D7DEE6"));
    center.splice(insertAt + 1, 0, textElement(`visual-trust-${boxId}-${stepIndex}`, makeTrustRow(visual), visual.muted, 13, 0, 1));
  }

  for (const element of allElements(step)) {
    if (element.type === "button") decorateButtonItems(element, visual);
    if (element.type === "form" && element.options) {
      element.options.buttonBackgroundColor = visual.accent;
      element.options.buttonTextColor = "#ffffff";
      element.options.shape = "rounded";
    }
  }

  step.background = step.background || {};
  for (const area of ["center", "underlay"]) {
    step.background[area] = step.background[area] || {};
    step.background[area].color = stepIndex === 0 ? visual.soft : "#ffffff";
    step.background[area].overlayEnabled = false;
  }
  step.background.close = "#6B7280";
}

function patchBox(box, boxId) {
  const family = box.meta && box.meta.ep_service_family;
  const visual = VISUALS[family] || VISUALS["Returning And Exit Rescue"];
  box.active = false;
  box.meta = box.meta || {};
  box.meta.ep_professional_visual_system_applied = true;
  box.meta.ep_professional_visual_system_applied_at = new Date().toISOString();
  box.meta.ep_visual_label = visual.label;

  const variations = box.variations || [];
  for (const variation of variations) {
    variation.profile = variation.profile || {};
    variation.profile.enabled = true;
    variation.profile.name = "Erie.Pro";
    variation.profile.title = visual.label;
    variation.profile.color = "dark";
    variation.teaser = variation.teaser || {};
    variation.teaser.enabled = true;
    variation.teaser.text_color = visual.dark;
    variation.teaser.background_color = "#ffffff";
    variation.teaser.message = visual.label;
    variation.teaser.icon = "chat";

    const steps = variation.steps || [];
    steps.forEach((step, index) => patchStepVisuals(step, visual, boxId, index));
  }
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

    patchBox(box, id);

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
      const step = ((box.variations || [])[0] || {}).steps?.[0];
      const text = JSON.stringify(step || {});
      return {
        name: box.name,
        active: box.active,
        visualApplied: Boolean(box.meta && box.meta.ep_professional_visual_system_applied),
        visualLabel: box.meta && box.meta.ep_visual_label,
        hasTrustRow: text.includes("visual-trust-"),
        hasIconText: /\[(phone|doc|care|plan|spark|badge|arrow|!)\]/.test(text),
        teaser: ((box.variations || [])[0] || {}).teaser,
      };
    }, id);

    results.push({ id, ok: save.status >= 200 && save.status < 300, verify });
  }

  await browser.close();
  console.log(JSON.stringify({ updated: results.filter((r) => r.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
