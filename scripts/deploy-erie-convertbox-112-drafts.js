const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;
const ROOT = path.join(__dirname, "..");
const IMPLEMENTATION_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "convertbox-implementation");
const MATRIX_PATH = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-SERVICE-MATRIX.json");
const DEPLOYMENT_JSON = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-DRAFT-DEPLOYMENT.json");
const DEPLOYMENT_MD = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-DRAFT-DEPLOYMENT.md");

const TEMPLATE_BY_FAMILY = {
  "Emergency Home Response": "232597",
  "Planned Home Projects": "232596",
  "Seasonal Erie Services": "232594",
  "Cleaning and Turnover": "232594",
  "Pest and Environmental": "232599",
  "Auto Marine Roadside": "232594",
  "Health and Appointments": "232599",
  "Professional and Financial": "232600",
};

const GROUP_BY_FAMILY = {
  "Emergency Home Response": "Erie.Pro - Emergency",
  "Planned Home Projects": "Erie.Pro - Service Families",
  "Seasonal Erie Services": "Erie.Pro - Seasonal",
  "Cleaning and Turnover": "Erie.Pro - Service Families",
  "Pest and Environmental": "Erie.Pro - Service Families",
  "Auto Marine Roadside": "Erie.Pro - Service Families",
  "Health and Appointments": "Erie.Pro - Appointments",
  "Professional and Financial": "Erie.Pro - Professional",
};

const FAMILY_ASSETS = {
  "Emergency Home Response": { label: "URGENT", initials: "ER", color: "#C8102E", bg: "#FFF5F5" },
  "Planned Home Projects": { label: "PLAN", initials: "PR", color: "#C8102E", bg: "#F8FAFC" },
  "Seasonal Erie Services": { label: "SEASON", initials: "SE", color: "#1F7A8C", bg: "#F0F9FF" },
  "Cleaning and Turnover": { label: "READY", initials: "CL", color: "#0F766E", bg: "#F0FDFA" },
  "Pest and Environmental": { label: "SAFE", initials: "PE", color: "#4A5568", bg: "#F8FAFC" },
  "Auto Marine Roadside": { label: "MOBILE", initials: "AM", color: "#1F3A5F", bg: "#EEF6FF" },
  "Health and Appointments": { label: "CARE", initials: "AP", color: "#1F7A8C", bg: "#F0F9FF" },
  "Professional and Financial": { label: "PRO", initials: "CO", color: "#31456A", bg: "#F8FAFC" },
};

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function html(text) {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slug(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueId(prefix, serviceNumber, index) {
  return `${prefix}${String(serviceNumber).padStart(3, "0")}${index}${Math.random().toString(16).slice(2, 8)}`;
}

function makeSvg(asset) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="${asset.bg}"/>
  <circle cx="256" cy="232" r="142" fill="#ffffff" stroke="${asset.color}" stroke-width="18"/>
  <text x="256" y="260" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="800" fill="${asset.color}">${asset.initials}</text>
  <rect x="116" y="350" width="280" height="58" rx="29" fill="${asset.color}"/>
  <text x="256" y="389" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${asset.label}</text>
</svg>`.trim();
}

function textElement(id, text, color = "#1F3A5F", fontSize = 17) {
  return {
    id,
    type: "text",
    title: "Text",
    options: {
      fontFamily: "roboto",
      color,
      fontSize: String(fontSize),
      lineHeight: "1.32",
      vSpacingTop: 1,
      vSpacingBottom: 1,
      text,
      mobile: { overwritten: true, fontSize: String(Math.min(Number(fontSize), 22)), lineHeight: "1.32", vSpacingTop: 1, vSpacingBottom: 1 },
    },
  };
}

function labelElement(id, label, headline, fontSize) {
  return textElement(
    id,
    `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#F8FAFC;color:#C8102E;font-size:13px;font-weight:700;text-transform:uppercase;">${html(label)}</span><br><b>${html(headline)}</b>`,
    "#C8102E",
    fontSize,
  );
}

function trustElement(id, chips) {
  const text = `<div style="text-align:center;font-size:13px;line-height:1.45;color:#4A4A4A;">${chips
    .map((chip) => `<span style="display:inline-block;margin:3px 6px;padding:5px 9px;border:1px solid #D7DEE6;border-radius:999px;background:#ffffff;">${html(chip)}</span>`)
    .join("")}</div>`;
  return textElement(id, text, "#4A4A4A", 13);
}

function buttonElement(id, service, targetStepId) {
  const colors = ["#C8102E", "#1F3A5F", "#6B7280"];
  return {
    id,
    type: "button",
    title: "Button",
    options: {
      fontFamily: "roboto",
      multiple: true,
      amount: service.branches.length,
      items: service.branches.map((branch, index) => ({
        id: `${id}item${index}`,
        color: "#ffffff",
        backgroundColor: colors[index] || "#6B7280",
        text: `<b>${html(branch.label)}</b>`,
        value: branch.id,
        action: { type: "step", link: null, step: targetStepId, new_tab: false },
        automations: [],
        automations_type: "immediately",
        ep_branch_metadata: branch.metadata,
      })),
      shape: "rounded",
      size: "l",
      width: "wide",
      vSpacingTop: 1,
      vSpacingBottom: 1,
      mobile: { overwritten: true, size: "m", vSpacingTop: 1, vSpacingBottom: 1 },
    },
  };
}

function formElement(id, cta, targetStepId, service, placeholder) {
  const phoneRequired = service.lead_temperature === "hot";
  return {
    id,
    type: "form",
    title: "Form",
    options: {
      size: "m",
      fontFamily: "roboto",
      buttonBackgroundColor: "#C8102E",
      buttonTextColor: "#ffffff",
      checkboxTextColor: "#4A4A4A",
      action: { type: "step", link: null, pass: false, step: targetStepId, fire_scripts: false, scripts: null },
      fields: [
        { type: "textarea", composite: false, input: { placeholder, name: "request_context", type: "textarea", required: true } },
        { type: "text", composite: false, input: { placeholder: "Erie County ZIP or community", name: "zip_or_community", type: "text", required: false } },
        { type: "phone", composite: false, input: { placeholder: phoneRequired ? "Best phone number (recommended for fast help)" : "Best phone number", name: "phone", type: "tel", required: phoneRequired } },
        { type: "email", composite: false, input: { placeholder: "Best email", name: "email", type: "text", required: false } },
      ],
      actions: [],
      vSpacingTop: 1,
      vSpacingBottom: 1,
      buttonText: `<b>${html(cta)}</b>`,
      layout: "vertical",
      shape: "rounded",
      mobile: { overwritten: true, size: "m", shape: "rounded", vSpacingTop: 1, vSpacingBottom: 1 },
      conditional_integrations: [],
    },
  };
}

function stepSpecs(service) {
  const route = service.route;
  const fields = service.qualifying_fields.join(", ");
  const first = {
    name: "Choose need",
    headline: service.copy.headline,
    body: service.copy.body,
    buttons: true,
  };
  const confirm = {
    name: "Request received",
    headline: "Request received.",
    body: service.copy.confirmation,
  };
  if (route === "urgent_callback") {
    return [
      first,
      { name: "Location and risk", headline: "Where is help needed?", body: "Share the Erie County location, safety concern, and what is happening now.", cta: "Continue", placeholder: `Briefly describe ${service.service_label}: ${fields}` },
      { name: "Fastest contact", headline: "What is the fastest safe way to reach you?", body: "For urgent requests, a phone number is usually the quickest way to avoid delay.", cta: "Send urgent request", placeholder: "Best contact details, access notes, and timing" },
      confirm,
    ];
  }
  if (route === "project_planner") {
    return [
      first,
      { name: "Planning stage", headline: "Where are you in the decision?", body: "Idea stage, comparing estimates, ready to schedule, or handling a repair that cannot wait?", cta: "Continue", placeholder: "Decision stage and desired outcome" },
      { name: "Scope details", headline: "What should a pro understand first?", body: "Add the rooms, surfaces, dimensions, material preferences, property type, or current condition.", cta: "Continue", placeholder: `Scope details for ${service.service_label}` },
      { name: "Timing and budget", headline: "What timing and budget range feels realistic?", body: "A range is enough. This helps avoid a provider conversation that does not fit.", cta: "Continue", placeholder: "Start window, deadline, and optional budget range" },
      { name: "Constraints", headline: "Anything that could affect the work?", body: "Permits, access, insurance, pets, parking, HOA, photos, or site limitations.", cta: "Continue", placeholder: "Important constraints or access notes" },
      { name: "Best next step", headline: "What would make the next step easier?", body: "Choose contact preference and whether you want simple matching or more guided project help.", cta: "Send project details", placeholder: "Best contact method and preferred next step" },
      confirm,
    ];
  }
  if (route === "appointment_or_consultation") {
    return [
      first,
      { name: "Timing or deadline", headline: "Is there a timing need or important date?", body: service.copy.sensitive_guardrail || "Share the preferred appointment window, deadline, or planning timeline.", cta: "Continue", placeholder: "Preferred window, deadline, or timing context" },
      { name: "Brief private note", headline: "Share a brief private note.", body: "A brief note is enough. Do not include private documents or detailed confidential facts in this box.", cta: "Continue", placeholder: `Privacy-safe summary for ${service.service_label}` },
      { name: "Contact preference", headline: "How should someone follow up?", body: "Choose the best contact method and time window.", cta: "Request help", placeholder: "Best contact method and time window" },
      confirm,
    ];
  }
  return [
    first,
    { name: "Useful details", headline: "What details would help first?", body: "Share the size, type, property context, or concern so the request is not too broad.", cta: "Continue", placeholder: `Useful details for ${service.service_label}: ${fields}` },
    { name: "Timing", headline: "When do you need help?", body: "Share the preferred date, deadline, access notes, or timing window.", cta: "Continue", placeholder: "Date, deadline, access notes, or timing window" },
    { name: "Best contact", headline: "Who is the best contact?", body: "Add the best contact method so the next step can be confirmed quickly.", cta: "Send request", placeholder: "Best contact method and scheduling notes" },
    confirm,
  ];
}

function buildSteps(box, service) {
  const originalSteps = (((box.variations || [])[0] || {}).steps || []);
  const specs = stepSpecs(service);
  const ids = specs.map((_, index) => originalSteps[index]?.id || `step${service.service_number}${index}${Math.random().toString(16).slice(2, 10)}`);
  const background = clone(originalSteps[0]?.background || {});
  return specs.map((spec, index) => {
    const nextId = ids[Math.min(index + 1, ids.length - 1)];
    const center = [
      labelElement(uniqueId("label", service.service_number, index), service.copy.first_step_label, spec.headline, index === 0 ? 30 : 26),
      textElement(uniqueId("body", service.service_number, index), html(spec.body), "#1F3A5F", 17),
    ];
    if (index === 0) {
      center.push(trustElement(uniqueId("trust", service.service_number, index), service.copy.trust_chips));
      center.push(buttonElement(uniqueId("btn", service.service_number, index), service, nextId));
    } else if (index < specs.length - 1) {
      center.push(formElement(uniqueId("form", service.service_number, index), spec.cta || "Continue", nextId, service, spec.placeholder));
    }
    return {
      ...(clone(originalSteps[index] || {})),
      id: ids[index],
      name: spec.name,
      loading_screen: false,
      loading_message: "Preparing your request...",
      conditional_skips: [],
      elements: { center, left: [], right: [] },
      layout: { column_number: 1, column_layout: "center" },
      background,
    };
  });
}

function patchBox(box, service, campaignId, photo) {
  box.active = false;
  box.name = service.convertbox.recommended_name;
  box.campaign_id = campaignId || box.campaign_id;
  box.has_form = true;
  box.meta = {
    ...(box.meta || {}),
    steps_introduction: false,
    ep_full_service_matrix_applied: true,
    ep_full_service_matrix_applied_at: new Date().toISOString(),
    ep_matrix_source: "ERIE-CONVERTBOX-112-SERVICE-MATRIX.json",
    ep_matrix_service_number: service.service_number,
    ep_matrix_service_label: service.service_label,
    ep_matrix_service_slug: service.service_slug,
    ep_service_family: service.family,
    ep_matrix_route: service.route,
    ep_matrix_urgency: service.urgency_profile,
    ep_matrix_lead_temperature: service.lead_temperature,
    ep_matrix_template: service.convertbox.template,
    ep_matrix_payload_fields: service.payload_fields,
    ep_matrix_qualifying_fields: service.qualifying_fields,
    ep_matrix_subservice_intents: service.service_context.derived_subservice_intents,
    ep_activation_status: "inactive_draft_needs_visual_mobile_and_test_submission",
  };
  box.rules_display = {
    ...(box.rules_display || {}),
    target: "specific_pages",
    target_pages: {
      include: service.convertbox.page_targets.include.map((value) => ({ type: "contains", value })),
      exclude: service.convertbox.page_targets.exclude.map((value) => ({ type: "contains", value })),
    },
    trigger_in_seconds: service.lead_temperature === "hot" ? 20 : 45,
    trigger_scroll_percent: service.route === "urgent_callback" ? 5 : 60,
    limit_per_day_times: 1,
    duration_type: "visit",
    duration_times: 1,
    suppress_if_closed: true,
    suppress_until: "never",
    trigger_time: true,
    trigger_scroll: service.route !== "urgent_callback",
    trigger_leave: service.route === "urgent_callback",
    trigger_by_link: true,
    device: "all",
  };
  for (const variation of box.variations || []) {
    variation.profile = variation.profile || {};
    variation.profile.enabled = true;
    variation.profile.photo = photo || variation.profile.photo;
    variation.profile.name = "Erie.Pro";
    variation.profile.name_show = true;
    variation.profile.title = service.copy.first_step_label;
    variation.profile.title_show = true;
    variation.profile.layout = "chat";
    variation.profile.color = "dark";

    variation.teaser = variation.teaser || {};
    variation.teaser.enabled = true;
    variation.teaser.message = service.copy.headline;
    variation.teaser.message_show = true;
    variation.teaser.photo = photo || variation.teaser.photo;
    variation.teaser.icon = "none";
    variation.teaser.pulse = service.lead_temperature === "hot";

    variation.steps = buildSteps(box, service);
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

async function api(page, url, options = {}) {
  return page.evaluate(async ({ url, options }) => {
    const res = await fetch(url, {
      credentials: "include",
      headers: { accept: "application/json", "content-type": "application/json;charset=UTF-8", "x-requested-with": "XMLHttpRequest", ...(options.headers || {}) },
      ...options,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
    return { ok: res.ok, status: res.status, data, text: text.slice(0, 500) };
  }, { url, options });
}

async function getBox(page, id) {
  const res = await api(page, `https://app.convertbox.com/api/boxes/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(`GET box ${id} failed: ${res.status} ${res.text}`);
  return res.data.box || res.data.data || res.data;
}

async function saveBox(page, box) {
  const res = await api(page, `https://app.convertbox.com/api/boxes/${box.id}`, { method: "PUT", body: JSON.stringify(box) });
  if (!res.ok) throw new Error(`PUT box ${box.id} failed: ${res.status} ${res.text}`);
  return res.data.box || res.data.data || res.data;
}

async function cloneBox(page, sourceId) {
  const res = await api(page, `https://app.convertbox.com/api/boxes/${sourceId}/clone`, { method: "POST" });
  if (!res.ok) throw new Error(`Clone ${sourceId} failed: ${res.status} ${res.text}`);
  const payload = res.data.box || res.data.data || res.data;
  return payload.box || payload.data || payload;
}

async function listBoxes(page) {
  const res = await api(page, `https://app.convertbox.com/api/sites/${SITE_ID}/boxes`, { method: "GET" });
  if (!res.ok) throw new Error(`List boxes failed: ${res.status} ${res.text}`);
  return res.data.data || res.data.boxes || [];
}

async function ensureCampaigns(page) {
  const desired = [...new Set(Object.values(GROUP_BY_FAMILY))];
  const currentRes = await api(page, `https://app.convertbox.com/api/sites/${SITE_ID}/campaigns`, { method: "GET" });
  if (!currentRes.ok) throw new Error(`List campaigns failed: ${currentRes.status} ${currentRes.text}`);
  const campaigns = currentRes.data.data || [];
  const byName = new Map(campaigns.map((campaign) => [campaign.name, campaign]));
  for (const name of desired) {
    if (byName.has(name)) continue;
    const create = await api(page, `https://app.convertbox.com/api/sites/${SITE_ID}/campaigns`, {
      method: "POST",
      body: JSON.stringify({ name, site_id: Number(SITE_ID) }),
    });
    if (create.ok) {
      const campaign = create.data.campaign || create.data.data || create.data;
      byName.set(campaign.name || name, campaign);
    }
  }
  return byName;
}

async function uploadFamilyImage(page, family, asset) {
  const fileName = `erie-pro-${slug(family)}-matrix.svg`;
  const existing = await api(page, `https://app.convertbox.com/api/accounts/${ACCOUNT_ID}/images`, { method: "GET" }).catch(() => null);
  const images = existing?.ok ? (existing.data.data || existing.data.images || existing.data || []) : [];
  if (Array.isArray(images)) {
    const found = images.find((image) => image.name === fileName);
    if (found) return found;
  }
  const svg = makeSvg(asset);
  const base64 = Buffer.from(svg, "utf8").toString("base64");
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
    if (!res.ok) throw new Error(`Upload ${fileName} failed ${res.status}: ${text.slice(0, 300)}`);
    const parsed = JSON.parse(text);
    return parsed.image || parsed.data || parsed;
  }, { accountId: ACCOUNT_ID, base64, fileName });
}

function writeDeployment(results, mode) {
  const ok = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);
  const payload = {
    generated_at: new Date().toISOString(),
    mode,
    total: results.length,
    ok: ok.length,
    failed: failed.length,
    results,
  };
  fs.writeFileSync(DEPLOYMENT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  let md = `# Erie.Pro ConvertBox 112 Draft Deployment\n\nDate: 2026-05-10\n\nMode: \`${mode}\`\n\n- Total attempted: ${results.length}\n- Successful: ${ok.length}\n- Failed: ${failed.length}\n- Active boxes created or updated: 0. All generated boxes are inactive drafts.\n\n`;
  md += `## Drafts\n\n| # | Service | Box id | Action | Family | Active | Status |\n|---:|---|---:|---|---|---|---|\n`;
  for (const result of results) {
    md += `| ${result.service_number} | ${result.service_label} | ${result.box_id || ""} | ${result.action || ""} | ${result.family} | ${result.active} | ${result.ok ? "ok" : result.error} |\n`;
  }
  fs.writeFileSync(DEPLOYMENT_MD, md);
}

async function main() {
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");
  const limit = Number(argValue("limit") || "0");
  const only = argValue("only");
  const mode = limit ? `limit-${limit}` : only ? `only-${only}` : "full";

  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, "utf8"));
  let services = matrix.services;
  if (only) services = services.filter((service) => service.service_slug === only || String(service.service_number) === only);
  if (limit) services = services.slice(0, limit);

  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage();
  await login(page, username, password);

  const campaigns = await ensureCampaigns(page);
  const photos = {};
  for (const [family, asset] of Object.entries(FAMILY_ASSETS)) {
    photos[family] = await uploadFamilyImage(page, family, asset);
  }

  const boxes = await listBoxes(page);
  const existingBySlug = new Map();
  for (const box of boxes) {
    const serviceSlug = box.meta?.ep_matrix_service_slug;
    if (box.meta?.ep_full_service_matrix_applied && serviceSlug) existingBySlug.set(serviceSlug, box.id);
  }

  const results = [];
  for (const service of services) {
    try {
      let action = "updated";
      let boxId = existingBySlug.get(service.service_slug);
      let box;
      if (boxId) {
        box = await getBox(page, boxId);
      } else {
        action = "created";
        const sourceId = TEMPLATE_BY_FAMILY[service.family];
        box = await cloneBox(page, sourceId);
        boxId = box.id;
      }
      const campaign = campaigns.get(GROUP_BY_FAMILY[service.family]) || campaigns.get("Erie.Pro - Service Families");
      patchBox(box, service, campaign?.id, photos[service.family]);
      await saveBox(page, box);
      const verified = await getBox(page, box.id);
      results.push({
        ok: true,
        action,
        service_number: service.service_number,
        service_label: service.service_label,
        service_slug: service.service_slug,
        family: service.family,
        box_id: verified.id,
        box_name: verified.name,
        active: verified.active,
        campaign_id: verified.campaign_id,
        steps: (((verified.variations || [])[0] || {}).steps || []).map((step) => step.name),
        target_count: verified.rules_display?.target_pages?.include?.length || 0,
        meta_ok: Boolean(verified.meta?.ep_full_service_matrix_applied && verified.meta?.ep_matrix_service_slug === service.service_slug),
      });
    } catch (error) {
      results.push({
        ok: false,
        service_number: service.service_number,
        service_label: service.service_label,
        service_slug: service.service_slug,
        family: service.family,
        active: false,
        error: error.message,
      });
    }
    if (results.length % 10 === 0) console.log(`processed ${results.length}/${services.length}`);
  }

  await browser.close();
  writeDeployment(results, mode);
  console.log(JSON.stringify({
    mode,
    total: results.length,
    ok: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    deployment_json: DEPLOYMENT_JSON,
    deployment_md: DEPLOYMENT_MD,
  }, null, 2));
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
