const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;
const SNAPSHOT_DIR = path.join(__dirname, "..", "docs", "erie-pro-consolidation", "convertbox-implementation", "audit-snapshots");
const BOX_IDS = ["232597", "232595", "232594", "232596", "232598", "232599", "232600", "232601", "232602", "232603"];

const COPY = {
  "232597": {
    profileTitle: "Urgent Erie County Help",
    teaser: "Need urgent local help?",
    label: "Urgent Erie County Help",
    steps: [
      {
        name: "What happened?",
        headline: "Need urgent local help?",
        body: "Tell us what happened and where you are in Erie County. If anyone is in immediate danger, call 911 first.",
        buttons: ["Water, heat, power, or storm", "Lockout, access, or roadside", "Not sure what counts as urgent"],
      },
      {
        name: "Where is help needed?",
        headline: "Where is the help needed?",
        body: "Share the Erie County community, ZIP, or address context so a local pro has the right starting point.",
        placeholder: "Describe what happened and where help is needed",
        cta: "Continue with location",
      },
      {
        name: "Fastest contact",
        headline: "What is the fastest safe way to reach you?",
        body: "For urgent requests, a phone number is usually the quickest way to avoid delay.",
        placeholder: "Best contact details and any access notes",
        cta: "Send urgent request",
      },
      {
        name: "Request received",
        headline: "Urgent request received.",
        body: "Thanks. Keep your phone nearby while the request is sent through the right Erie County service path.",
      },
    ],
  },
  "232595": {
    profileTitle: "Urgent Erie County Help",
    teaser: "Need urgent local help?",
    label: "Urgent Erie County Help",
    steps: [
      {
        name: "Choose the urgent issue",
        headline: "What needs urgent help?",
        body: "Choose the closest situation. If anyone is in immediate danger, call 911 first.",
        buttons: ["Leak, backup, no heat, or no power", "Lockout, towing, or access issue", "Help me choose the urgent path"],
      },
      {
        name: "Damage or safety risk",
        headline: "Is there active damage or safety risk?",
        body: "A short note is enough. This helps the next conversation start with the right urgency.",
        placeholder: "Briefly describe the risk, damage, or symptom",
        cta: "Continue",
      },
      {
        name: "Best contact",
        headline: "How should a local pro reach you?",
        body: "Add the best number and Erie County location for follow-up.",
        placeholder: "Best number, location, and any access notes",
        cta: "Send urgent request",
      },
      {
        name: "Urgent request received",
        headline: "Urgent request received.",
        body: "Thanks. Your issue, risk, location, and contact details are ready for follow-up.",
      },
    ],
  },
  "232594": {
    profileTitle: "Cleaning, Moving, And Turnover",
    teaser: "Need something ready on time?",
    label: "Ready On Time",
    steps: [
      {
        name: "What needs to be ready?",
        headline: "What needs to be ready?",
        body: "Tell us what needs cleaning, moving, hauling, or turning over and when it has to be done.",
        buttons: ["I need cleaning or turnover help", "I need moving, junk, or dumpster help", "Help me choose the right path"],
      },
      {
        name: "Size and property",
        headline: "How big is the job?",
        body: "Rooms, square footage, item volume, or property type helps a quote start closer to reality.",
        placeholder: "Rooms, size, items, property type, or surfaces",
        cta: "Continue",
      },
      {
        name: "Timing and access",
        headline: "When does it need to be ready?",
        body: "Share the date, deadline, access notes, or turnover window.",
        placeholder: "Date needed, access notes, or turnover window",
        cta: "Continue",
      },
      {
        name: "Scheduling contact",
        headline: "Who is the best contact for scheduling?",
        body: "Add the best contact method so timing can be confirmed quickly.",
        placeholder: "Best contact method and scheduling notes",
        cta: "Send request",
      },
      {
        name: "Request received",
        headline: "Request received.",
        body: "Thanks. Your timing, size, and access details are ready for a useful quote.",
      },
    ],
  },
  "232596": {
    profileTitle: "Project Planning",
    teaser: "Planning a home project?",
    label: "Project Planning",
    steps: [
      {
        name: "What are you planning?",
        headline: "Planning a home project?",
        body: "Share the scope so the first conversation starts prepared.",
        buttons: ["I need a repair or replacement", "I am planning a remodel or build", "Help me scope the project first"],
      },
      {
        name: "Planning stage",
        headline: "Where are you in the decision?",
        body: "Idea stage, comparing estimates, ready to schedule, or dealing with a repair that cannot wait?",
        placeholder: "Idea stage, estimates, ready to schedule, or urgent repair",
        cta: "Continue",
      },
      {
        name: "Scope and property",
        headline: "What should a pro understand first?",
        body: "Rooms, surfaces, dimensions, material preferences, or property type all help.",
        placeholder: "Rooms, dimensions, materials, property type, or current condition",
        cta: "Continue",
      },
      {
        name: "Timing and budget",
        headline: "What timing and budget range feels realistic?",
        body: "A range is enough. This helps avoid a provider conversation that does not fit.",
        placeholder: "Start window, deadline, and optional budget range",
        cta: "Continue",
      },
      {
        name: "Constraints",
        headline: "Anything that could affect the work?",
        body: "Permits, access, insurance, pets, parking, HOA, or photos available.",
        placeholder: "Permits, access, insurance, parking, HOA, pets, or photos",
        cta: "Continue",
      },
      {
        name: "Best next step",
        headline: "What would make the next step easier?",
        body: "Choose contact preference and whether you want simple matching or more guided project help.",
        placeholder: "Best contact method and what kind of help you want next",
        cta: "Send project details",
      },
      {
        name: "Project request received",
        headline: "Project request received.",
        body: "Thanks. Your scope, timing, and constraints are ready for a more useful Erie County provider conversation.",
      },
    ],
  },
  "232598": {
    profileTitle: "Project Planning",
    teaser: "Planning a home project?",
    label: "Project Planning",
    steps: [
      {
        name: "Choose the project type",
        headline: "What kind of project are you planning?",
        body: "Choose the closest option so the first conversation is not too broad.",
        buttons: ["Kitchen, bath, basement, or remodel", "Roof, siding, windows, or exterior", "Help me compare project options"],
      },
      {
        name: "Goal and outcome",
        headline: "What outcome do you want?",
        body: "Repair, refresh, replacement, safety, energy savings, resale, or full transformation.",
        placeholder: "Desired outcome or problem you want solved",
        cta: "Continue",
      },
      {
        name: "Useful details",
        headline: "What details would help a pro prepare?",
        body: "Approximate size, count, rooms, material, surface, system, or current condition.",
        placeholder: "Size, count, rooms, materials, surfaces, or current condition",
        cta: "Continue",
      },
      {
        name: "Decision stage",
        headline: "Where are you in the decision?",
        body: "Researching, pricing, selecting a pro, ready to start, or handling an urgent repair.",
        placeholder: "Researching, pricing, selecting, ready, or urgent",
        cta: "Continue",
      },
      {
        name: "Timing and constraints",
        headline: "What timing or constraints matter?",
        body: "Start date, deadline, financing, insurance, access, or permit concerns.",
        placeholder: "Timing, financing, insurance, access, permits, or other constraints",
        cta: "Continue",
      },
      {
        name: "Best next step",
        headline: "How would you like to continue?",
        body: "Choose the best contact path and whether you want free matching or extra guidance.",
        placeholder: "Best contact path and preferred next step",
        cta: "Start project match",
      },
      {
        name: "Project details saved",
        headline: "Project details saved.",
        body: "Thanks. Your project details are ready for a clearer Erie County provider conversation.",
      },
    ],
  },
  "232599": {
    profileTitle: "Private Appointment Help",
    teaser: "Looking for an appointment?",
    label: "Private Appointment Help",
    steps: [
      {
        name: "Appointment type",
        headline: "Looking for an appointment?",
        body: "Choose the closest care type. A brief note is enough here.",
        buttons: ["Dental, vision, skin, hearing, or therapy", "Pet care or grooming", "I want help choosing privately"],
      },
      {
        name: "Care type and timing",
        headline: "What kind of visit and timing fit?",
        body: "Share the appointment type, preferred window, and whether this is new or follow-up care.",
        placeholder: "Appointment type, preferred time, and new or follow-up care",
        cta: "Continue",
      },
      {
        name: "Private contact",
        headline: "How should someone follow up?",
        body: "Share only what you are comfortable sharing. Avoid detailed medical history here.",
        placeholder: "Best contact method and a brief privacy-safe note",
        cta: "Request appointment help",
      },
      {
        name: "Appointment request received",
        headline: "Appointment request received.",
        body: "Thanks. Your request stays brief, private, and focused on the appointment path.",
      },
    ],
  },
  "232600": {
    profileTitle: "Local Professional Help",
    teaser: "Need a local professional?",
    label: "Local Professional Help",
    steps: [
      {
        name: "Type of help",
        headline: "Need a local professional?",
        body: "Tell us the type of help you need and when you would like to speak with someone.",
        buttons: ["I need legal, tax, insurance, or money help", "I need property, inspection, or mortgage help", "Help me choose the right professional"],
      },
      {
        name: "Deadline or timing",
        headline: "Is there a deadline or important date?",
        body: "Court date, closing date, tax deadline, event date, or planning window.",
        placeholder: "Deadline, important date, or planning window",
        cta: "Continue",
      },
      {
        name: "Brief private note",
        headline: "Share a brief private note.",
        body: "A brief note is enough. Please do not include private documents or detailed confidential facts here.",
        placeholder: "Brief privacy-safe summary",
        cta: "Continue",
      },
      {
        name: "Contact preference",
        headline: "How should a professional follow up?",
        body: "Choose the best contact method and time window.",
        placeholder: "Best contact method and time window",
        cta: "Request consultation help",
      },
      {
        name: "Consultation request received",
        headline: "Consultation request received.",
        body: "Thanks. The next conversation can start with the right context and a respectful pace.",
      },
    ],
  },
  "232601": {
    profileTitle: "Erie County Provider Review",
    teaser: "Serve Erie County?",
    label: "Provider Availability",
    steps: [
      {
        name: "Service category",
        headline: "Serve Erie County?",
        body: "Check whether your service category is open for local requests.",
        buttons: ["I provide home or property services", "I provide health, professional, or appointment services", "Help me choose my category"],
      },
      {
        name: "Service area",
        headline: "Where do you serve?",
        body: "List the Erie County communities where you can realistically respond.",
        placeholder: "Communities served in Erie County",
        cta: "Continue",
      },
      {
        name: "Business details",
        headline: "Tell us about your business.",
        body: "Business name, website, license or insurance notes, and whether you are claiming an existing profile.",
        placeholder: "Business name, website, license or insurance notes, profile claim context",
        cta: "Continue",
      },
      {
        name: "Response readiness",
        headline: "How quickly can you respond to new requests?",
        body: "Response speed helps determine fit for urgent and high-intent local requests.",
        placeholder: "Typical response speed and capacity",
        cta: "Continue",
      },
      {
        name: "Best business contact",
        headline: "Who is the best person to contact?",
        body: "Add owner or manager contact details for review.",
        placeholder: "Owner or manager name, phone, and email",
        cta: "Check my service category",
      },
      {
        name: "Review request received",
        headline: "Review request received.",
        body: "Thanks. We will review your service category and follow up about profile claim or availability.",
      },
    ],
  },
  "232602": {
    profileTitle: "Continue Your Request",
    teaser: "Want to keep this moving?",
    label: "Simple Next Step",
    steps: [
      {
        name: "What would help now?",
        headline: "Want to keep this moving?",
        body: "Choose the easiest next step and we will keep it simple.",
        buttons: ["Help me choose the right service", "Send me price or timing help", "Have someone call me"],
      },
      {
        name: "Choose next step",
        headline: "What would help now?",
        body: "Save the request, ask a pricing question, describe the issue, or request contact.",
        placeholder: "What would help you continue?",
        cta: "Finish my request",
      },
      {
        name: "Saved for follow-up",
        headline: "Saved for follow-up.",
        body: "Thanks. Your next step is saved for follow-up.",
      },
    ],
  },
  "232603": {
    profileTitle: "Continue Your Request",
    teaser: "Want to continue?",
    label: "Continue Your Request",
    steps: [
      {
        name: "Pick up where you left off",
        headline: "Want to continue?",
        body: "Pick up from the service, price question, or callback path.",
        buttons: ["Finish a service request", "Ask about price or timing", "Request a callback"],
      },
      {
        name: "What changed?",
        headline: "What would help now?",
        body: "Share the service, urgency, or best contact path now.",
        placeholder: "Service, urgency, or best contact path",
        cta: "Continue my request",
      },
      {
        name: "We will help from here",
        headline: "We will help from here.",
        body: "Thanks. Your updated context is ready for follow-up.",
      },
    ],
  },
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function strip(html) {
  return String(html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function htmlText(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function labelHeadline(label, headline) {
  return `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#F8FAFC;color:#C8102E;font-size:13px;font-weight:700;text-transform:uppercase;">${htmlText(label)}</span><br><b>${htmlText(headline)}</b>`;
}

function trustHtml(urgent = false) {
  const chips = urgent
    ? ["Erie County only", "Fastest safe contact"]
    : ["Private until you submit", "Erie County only", "One clear next step"];
  return `<div style="text-align:center;font-size:13px;line-height:1.45;color:#4A4A4A;">${chips
    .map((chip) => `<span style="display:inline-block;margin:3px 6px;padding:5px 9px;border:1px solid #D7DEE6;border-radius:999px;background:#ffffff;">${chip}</span>`)
    .join("")}</div>`;
}

function slug(value) {
  return strip(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else Object.values(value).forEach((item) => walk(item, visit));
}

function updateForm(form, step) {
  if (!form?.options) return;
  if (step.cta) form.options.buttonText = `<b>${htmlText(step.cta)}</b>`;
  for (const field of form.options.fields || []) {
    const name = field.input?.name || "";
    if (step.placeholder && name === "request_context") field.input.placeholder = step.placeholder;
    if (name === "zip_or_community") field.input.placeholder = "Erie County ZIP or community";
    if (name === "phone") field.input.placeholder = "Best phone number";
    if (name === "email") field.input.placeholder = "Best email";
  }
}

function updateButton(button, labels) {
  if (!button?.options || !Array.isArray(button.options.items) || !labels) return;
  button.options.amount = labels.length;
  labels.forEach((label, index) => {
    const item = button.options.items[index];
    if (!item) return;
    item.text = `<b>${htmlText(label)}</b>`;
    item.value = slug(label);
  });
}

function updateStep(step, stepCopy, index, boxCopy, boxId) {
  if (!step || !stepCopy) return;
  step.name = stepCopy.name;
  const center = step.elements?.center || [];
  const textElements = center.filter((element) => element.type === "text");
  const button = center.find((element) => element.type === "button");
  const form = center.find((element) => element.type === "form");

  if (textElements[0]?.options) {
    textElements[0].options.text = labelHeadline(boxCopy.label, stepCopy.headline);
  }

  if (textElements[1]?.options) {
    textElements[1].options.text = htmlText(stepCopy.body);
  }

  const trust = textElements.find((element) => /Private request|One routed path|One clear next step|Erie County focused|Erie County only/i.test(element.options?.text || ""));
  if (trust?.options) {
    trust.options.text = trustHtml(boxId === "232597" || boxId === "232595");
  }

  updateButton(button, stepCopy.buttons);
  updateForm(form, stepCopy);
}

function patchBox(box) {
  const boxCopy = COPY[String(box.id)];
  if (!boxCopy) throw new Error(`No copy spec for ${box.id}`);
  box.active = false;
  box.meta = box.meta || {};
  box.meta.ep_persona_copy_rewrite_applied = true;
  box.meta.ep_persona_copy_rewrite_at = new Date().toISOString();
  box.meta.ep_persona_copy_audit_source = "COPY-PERSONA-AUDIT-2026-05-10.md";

  for (const variation of box.variations || []) {
    if (variation.profile) {
      variation.profile.title = boxCopy.profileTitle;
      variation.profile.title_show = true;
    }
    if (variation.teaser) {
      variation.teaser.message = boxCopy.teaser;
      variation.teaser.message_show = true;
    }
    (variation.steps || []).forEach((step, index) => updateStep(step, boxCopy.steps[index], index, boxCopy, String(box.id)));
  }

  const visible = [];
  walk(box, (node) => {
    if (node?.options?.text) visible.push(strip(node.options.text));
    if (node?.options?.items) node.options.items.forEach((item) => visible.push(strip(item.text)));
    if (node?.input?.placeholder) visible.push(node.input.placeholder);
  });

  const visibleText = visible.join(" ");
  const banned = [
    "Provider Territory Claim",
    "Returning And Exit Rescue",
    "Emergency Home Response",
    "Professional Legal And Financial",
    "Health And Wellness Appointments",
    "Cleaning And Turnover",
    "One routed path",
    "category review",
    "provider family",
    "Help classify my service",
    "right lane",
  ];
  const found = banned.filter((term) => visibleText.toLowerCase().includes(term.toLowerCase()));
  if (found.length) throw new Error(`Visible banned copy remains in ${box.id}: ${found.join(", ")}`);
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

async function getBox(page, id) {
  return page.evaluate(async (id) => {
    const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`GET ${id} failed: ${res.status}`);
    const parsed = await res.json();
    return parsed.box || parsed.data || parsed;
  }, id);
}

async function saveBox(page, id, box) {
  return page.evaluate(async ({ id, box }) => {
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
    return { ok: res.ok, status: res.status, text: (await res.text()).slice(0, 240) };
  }, { id, box });
}

function writeSnapshot(boxes) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  for (const box of boxes) {
    fs.writeFileSync(path.join(SNAPSHOT_DIR, `${box.id}.json`), `${JSON.stringify(box, null, 2)}\n`);
  }
  const index = boxes.map((box) => ({
    id: box.id,
    name: box.name,
    active: box.active,
    meta: box.meta || {},
    steps: (((box.variations || [])[0] || {}).steps || []).map((step) => step.name),
  }));
  fs.writeFileSync(path.join(SNAPSHOT_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
}

async function main() {
  loadEnvFile("C:/Users/VRLab/Projects/.env");
  loadEnvFile("C:/Users/VRLab/Documents/.env");
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();
  await login(page, username, password);

  const saved = [];
  const results = [];
  for (const id of BOX_IDS) {
    const box = await getBox(page, id);
    patchBox(box);
    const save = await saveBox(page, id, box);
    if (!save.ok) throw new Error(`Save failed for ${id}: ${save.status} ${save.text}`);
    const verified = await getBox(page, id);
    saved.push(verified);
    const text = JSON.stringify(verified);
    results.push({
      id,
      active: verified.active,
      rewritten: Boolean(verified.meta?.ep_persona_copy_rewrite_applied),
      hasOneRoutedPath: /One routed path/i.test(text),
      hasInternalVisibleLabel: /<[^>]*>(?:Emergency Home Response|Cleaning And Turnover|Health And Wellness Appointments|Professional Legal And Financial|Provider Territory Claim|Returning And Exit Rescue)/i.test(text),
    });
  }
  await browser.close();
  writeSnapshot(saved);
  console.log(JSON.stringify({ updated: saved.length, total: BOX_IDS.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
