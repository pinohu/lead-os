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

const FAMILY_BY_BOX = {
  "232597": {
    code: "EP-F01",
    name: "Emergency Home Response",
    headline: "Need urgent Erie County help?",
    body: "Tell us what is happening now so we can route your request to the right local service path.",
    stepNames: [
      "What happened?",
      "Is there active damage or risk?",
      "Where do you need help?",
      "How should we reach you?",
      "Want us to handle more of the calling?",
      "Request received",
    ],
    buttons: ["Water, heat, power, lock, or storm", "Vehicle or roadside", "Snow, ice, or property damage"],
    fields: ["phone", "service_issue", "safety_or_damage", "zip", "description"],
    cta: "Send urgent request",
    footer: "For emergencies, keep your phone nearby. Erie.Pro helps route the request; call 911 for immediate danger.",
  },
  "232595": {
    code: "EP-F01",
    name: "Emergency Home Response",
    headline: "What urgent issue needs attention?",
    body: "Choose the closest match so the request starts with the right context.",
    stepNames: [
      "Choose the urgent issue",
      "Tell us the risk",
      "Add location context",
      "Share contact details",
      "Optional extra help",
      "Urgent request received",
    ],
    buttons: ["Leak, backup, no heat, or no power", "Lockout, towing, or access issue", "Storm, tree, snow, or ice damage"],
    fields: ["phone", "emergency_type", "active_risk", "zip", "description"],
    cta: "Send urgent request",
    footer: "We will keep the request focused on the issue and Erie County location.",
  },
  "232594": {
    code: "EP-F04",
    name: "Cleaning And Turnover",
    headline: "Need cleaning, hauling, moving, or turnover help?",
    body: "Tell us what needs to be ready and when, and we will help route the request with the right details.",
    stepNames: [
      "What needs to be handled?",
      "Tell us the size or scope",
      "When does it need to be ready?",
      "Where should a pro follow up?",
      "Want extra scheduling help?",
      "Request received",
    ],
    buttons: ["Cleaning or turnover", "Moving, junk, or dumpster", "Exterior or carpet cleaning"],
    fields: ["service_type", "property_type", "size_or_rooms", "date_needed", "contact"],
    cta: "Send cleaning request",
    footer: "Good timing details help avoid back-and-forth before a quote.",
  },
  "232596": {
    code: "EP-F02",
    name: "Planned Home Projects",
    headline: "Planning a project in Erie County?",
    body: "A few project details help the first conversation start with scope, timing, and fit.",
    stepNames: [
      "What are you planning?",
      "How far along are you?",
      "Share the project scope",
      "Add timing and contact",
      "Want project concierge help?",
      "Project request received",
    ],
    buttons: ["Repair or replacement", "Remodel or build", "Energy, electrical, or exterior project"],
    fields: ["project_type", "decision_stage", "size_or_count", "timeline", "contact"],
    cta: "Send project details",
    footer: "For bigger work, context helps Erie.Pro avoid matching you too broadly.",
  },
  "232598": {
    code: "EP-F02",
    name: "Planned Home Projects",
    headline: "Make the first estimate call more useful.",
    body: "Tell us the project type, stage, and timing so we can route more intelligently than a generic quote form.",
    stepNames: [
      "Choose the project type",
      "Tell us your planning stage",
      "Add scope details",
      "Share contact details",
      "Want help comparing options?",
      "Project request received",
    ],
    buttons: ["Kitchen, bath, basement, or remodel", "Roof, siding, windows, or exterior", "Concrete, deck, solar, EV, or generator"],
    fields: ["project_type", "planning_stage", "scope", "timeline", "contact"],
    cta: "Start project match",
    footer: "You can stay with free matching; concierge help is optional.",
  },
  "232599": {
    code: "EP-F07",
    name: "Health And Wellness Appointments",
    headline: "Looking for an Erie County appointment?",
    body: "Share the type of care and a good time to be contacted. Keep the summary brief and private.",
    stepNames: [
      "What kind of appointment?",
      "Tell us the care type",
      "Choose a contact window",
      "Share contact details",
      "Review your request",
      "Appointment request received",
    ],
    buttons: ["Dental, vision, skin, hearing, or therapy", "Pet care or grooming", "Senior care, home health, or counseling"],
    fields: ["care_type", "preferred_window", "new_or_existing", "privacy_safe_summary", "contact"],
    cta: "Request appointment help",
    footer: "Please avoid detailed medical history here. A provider can follow up privately.",
  },
  "232600": {
    code: "EP-F08",
    name: "Professional Legal And Financial",
    headline: "Need a local professional consultation?",
    body: "Tell us the type of help and any timing concern so the request goes to the right professional path.",
    stepNames: [
      "What kind of help?",
      "Is there a deadline?",
      "Share a brief summary",
      "Choose contact preference",
      "Review your request",
      "Consultation request received",
    ],
    buttons: ["Legal, tax, insurance, or financial", "Real estate, inspection, or mortgage", "Funeral, estate sale, or sensitive planning"],
    fields: ["matter_type", "deadline_or_date", "privacy_safe_summary", "preferred_contact_window", "contact"],
    cta: "Request consultation help",
    footer: "Keep sensitive details brief. The first goal is routing, not collecting private documents.",
  },
  "232601": {
    code: "EP-F09",
    name: "Provider Territory Claim",
    headline: "Serve Erie County?",
    body: "Check whether your service category is open and tell us which communities you cover.",
    stepNames: [
      "What service do you provide?",
      "Where do you serve?",
      "Tell us about the business",
      "Add owner contact",
      "Review territory interest",
      "Claim request received",
    ],
    buttons: ["Home or property service", "Health, professional, or appointment service", "Cleaning, seasonal, auto, or marine"],
    fields: ["business_name", "owner_name", "service_category", "communities_served", "contact"],
    cta: "Check my service category",
    footer: "Category availability is reviewed before any territory promise is made.",
  },
  "232602": {
    code: "EP-F10",
    name: "Returning And Exit Rescue",
    headline: "Leaving before you found the right path?",
    body: "Choose what slowed you down and we will help you finish with less back-and-forth.",
    stepNames: [
      "What got in the way?",
      "What service were you looking for?",
      "Pick the better next step",
      "Leave a contact option",
      "Review your request",
      "Saved for follow-up",
    ],
    buttons: ["Not sure which service fits", "Still comparing price or providers", "Need help today"],
    fields: ["stuck_reason", "likely_service", "service_family", "zip", "phone_or_email"],
    cta: "Finish my request",
    footer: "No pressure. This just helps Erie.Pro route the next step more cleanly.",
  },
  "232603": {
    code: "EP-F10",
    name: "Returning And Exit Rescue",
    headline: "Want to continue your Erie County request?",
    body: "Tell us what you were working on and the next step you need.",
    stepNames: [
      "What were you working on?",
      "What changed?",
      "Choose the next step",
      "Confirm contact details",
      "Review your request",
      "We will help from here",
    ],
    buttons: ["Finish a service request", "Ask about price or timing", "Request a callback"],
    fields: ["likely_service", "next_step", "urgency", "zip", "contact"],
    cta: "Continue my request",
    footer: "Returning visitors should not have to start from scratch.",
  },
};

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit));
    return;
  }
  Object.values(value).forEach((item) => walk(item, visit));
}

function textPatch(text, family) {
  if (typeof text !== "string") return text;
  let next = text;
  const replacements = [
    [/Need help from a trusted Erie County pro\?/g, family.headline],
    [/Tell us what you need\. We will match you with one local pro, not a list of companies chasing the same job\./g, family.body],
    [/Tell us what happened\. We will help you find the right local pro as quickly as we can\./g, family.body],
    [/Answer one quick question so we can point you in the right direction\./g, "Choose the closest option so we can ask the right next question."],
    [/Tell us what you need/g, family.stepNames[0]],
    [/Send my request/g, family.cta],
    [/Find me a local pro/g, family.buttons[0]],
    [/I need help today/g, family.buttons[0]],
    [/I am planning a project/g, family.buttons[1]],
    [/Private until you say yes\. One vetted local pro serving Erie County\./g, family.footer],
    [/Thanks\. We have your details and will help route the request to the right Erie County service path\./g, family.stepNames[5] + ". " + family.footer],
    [/Would you like us to help more\?/g, "Want a little extra help with this?"],
    [/Keep my free match/g, "Keep free matching"],
    [/Show me extra help/g, "Show optional help"],
  ];
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  return next;
}

function patchBox(box, family) {
  box.name = `${family.code} ${family.name} - Draft Preview`;
  box.status = box.status === "active" ? "inactive" : box.status;
  box.meta = box.meta || {};
  box.meta.steps_introduction = false;
  box.meta.ep_service_aware_preview = true;
  box.meta.ep_service_family = family.name;
  box.meta.ep_audit_applied_at = new Date().toISOString();

  const variations = box.variations || [];
  for (const variation of variations) {
    const steps = variation.steps || [];
    steps.forEach((step, index) => {
      if (family.stepNames[index]) step.name = family.stepNames[index];
    });
  }

  walk(box, (node) => {
    for (const key of ["text", "html", "value", "label", "name", "placeholder", "title", "body", "button_text"]) {
      if (typeof node[key] === "string") node[key] = textPatch(node[key], family);
    }
    if (Array.isArray(node.items)) {
      node.items.forEach((item, idx) => {
        if (family.buttons[idx] && item && typeof item === "object") {
          if (typeof item.text === "string") item.text = family.buttons[idx];
          if (typeof item.label === "string") item.label = family.buttons[idx];
          if (typeof item.value === "string" && idx < family.buttons.length) {
            item.value = family.buttons[idx].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          }
        }
      });
    }
    if (node.settings && typeof node.settings === "object") {
      node.settings.ep_service_family = family.name;
      node.settings.ep_family_code = family.code;
    }
  });
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

  await page.goto("https://app.convertbox.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.fill("input[type=email], input[name=email], input[name=username]", username);
  await page.fill("input[type=password], input[name=password]", password);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {}),
    page.click("button:has-text('Sign In'), input[type=submit]"),
  ]);
  await page.goto(DASHBOARD_URL, { waitUntil: "networkidle", timeout: 60000 });

  const cookies = await page.context().cookies();
  const xsrf = cookies.find((cookie) => cookie.name.toLowerCase().includes("xsrf"));
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

  const csrf = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : null;
  });

  const headers = {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
    cookie: cookieHeader,
    referer: DASHBOARD_URL,
    "x-requested-with": "XMLHttpRequest",
  };
  if (xsrf) headers["x-xsrf-token"] = decodeURIComponent(xsrf.value);
  if (csrf) headers["x-csrf-token"] = csrf;

  const results = [];
  for (const id of BOX_IDS) {
    const family = FAMILY_BY_BOX[id];
    const urls = [
      `https://app.convertbox.com/api/convertboxes/${id}`,
      `https://app.convertbox.com/api/boxes/${id}`,
      `https://app.convertbox.com/api/sites/${SITE_ID}/boxes/${id}`,
      `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/box/${id}`,
    ];
    let box = null;
    let getUrl = null;
    for (const url of urls) {
      const response = await page.evaluate(async ({ url, headers }) => {
        const res = await fetch(url, { headers, credentials: "include" });
        return { status: res.status, text: await res.text() };
      }, { url, headers });
      if (response.status >= 200 && response.status < 300) {
        try {
          const parsed = JSON.parse(response.text);
          box = parsed.box || parsed.data || parsed;
          getUrl = url;
          break;
        } catch {}
      }
    }
    if (!box) {
      results.push({ id, ok: false, error: "Could not fetch box JSON" });
      continue;
    }

    patchBox(box, family);

    const candidatePayloads = [
      box,
      { box },
      { data: box },
    ];
    const putUrls = [
      getUrl,
      `https://app.convertbox.com/api/convertboxes/${id}`,
      `https://app.convertbox.com/api/boxes/${id}`,
      `https://app.convertbox.com/api/sites/${SITE_ID}/boxes/${id}`,
    ];

    let saved = null;
    for (const url of putUrls) {
      for (const method of ["PUT", "PATCH", "POST"]) {
        for (const payload of candidatePayloads) {
          const response = await page.evaluate(async ({ url, method, headers, payload }) => {
            const res = await fetch(url, {
              method,
              headers,
              credentials: "include",
              body: JSON.stringify(payload),
            });
            return { status: res.status, text: (await res.text()).slice(0, 300) };
          }, { url, method, headers, payload });
          if (response.status >= 200 && response.status < 300) {
            saved = { url, method, status: response.status };
            break;
          }
        }
        if (saved) break;
      }
      if (saved) break;
    }

    results.push({
      id,
      ok: Boolean(saved),
      family: family.name,
      name: box.name,
      steps: (((box.variations || [])[0] || {}).steps || []).map((step) => step.name),
      saved,
    });
  }

  await browser.close();
  console.log(JSON.stringify({ updated: results.filter((r) => r.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
