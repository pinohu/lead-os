const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;

const FLOW_SPECS = {
  "232597": {
    family: "Emergency Home Response",
    desiredSteps: 4,
    rationale: "Urgent visitors need speed, not long scoping.",
    steps: [
      { name: "What happened?", headline: "What needs urgent help?", body: "Choose the closest issue. If this is immediate danger, call 911 first.", buttons: ["[!] Water, heat, power, or storm", "[phone] Lockout, access, or roadside", "[?] Not sure what counts as urgent"] },
      { name: "Where do you need help?", headline: "Where should help be routed?", body: "Share the Erie County community, ZIP, or address context so the request is useful.", formCta: "Continue with location" },
      { name: "How should we reach you?", headline: "What is the fastest safe contact?", body: "For urgent requests, a phone number is usually the fastest way to avoid delay.", formCta: "Send urgent request" },
      { name: "Request received", headline: "Urgent request received.", body: "Keep your phone nearby. Erie.Pro will use the issue and location context to route the request." },
    ],
  },
  "232595": {
    family: "Emergency Home Response",
    desiredSteps: 4,
    rationale: "Emergency callback should be compact and phone-first.",
    steps: [
      { name: "Choose the urgent issue", headline: "Choose the urgent issue.", body: "Pick the closest situation so the request starts in the right lane.", buttons: ["[!] Leak, backup, no heat, or no power", "[phone] Lockout, towing, or access issue", "[?] Help me choose the urgent path"] },
      { name: "Tell us the risk", headline: "Is there active damage or safety risk?", body: "A short risk note helps route urgent jobs without slowing you down.", formCta: "Continue" },
      { name: "Share contact details", headline: "How should a provider reach you?", body: "Add the best number and Erie County location for follow-up.", formCta: "Send urgent request" },
      { name: "Urgent request received", headline: "Urgent request received.", body: "The request includes your issue, risk, location, and contact details." },
    ],
  },
  "232594": {
    family: "Cleaning And Turnover",
    desiredSteps: 5,
    rationale: "Cleaning and turnover decisions need task, size, timing, access, and contact.",
    steps: [
      { name: "What needs to be handled?", headline: "What needs to be cleaned, moved, or prepared?", body: "Start with the work type so we can ask the right timing question.", buttons: ["[spark] Cleaning or turnover", "[box] Moving, junk, or dumpster", "[?] Not sure which cleaning path fits"] },
      { name: "Size and property context", headline: "How large is the job?", body: "Rooms, square footage, item volume, or property type helps avoid a vague quote.", formCta: "Continue" },
      { name: "Timing and access", headline: "When does it need to be ready?", body: "Share the date, deadline, access notes, or turnover window.", formCta: "Continue" },
      { name: "Contact for scheduling", headline: "Where should a pro follow up?", body: "Add the best contact method so timing can be confirmed quickly.", formCta: "Send cleaning request" },
      { name: "Request received", headline: "Request received.", body: "Your timing, size, and property context are included." },
    ],
  },
  "232596": {
    family: "Planned Home Projects",
    desiredSteps: 7,
    rationale: "Complex projects benefit from comprehensive guided scoping.",
    steps: [
      { name: "What are you planning?", headline: "What kind of project are you planning?", body: "Choose the project family before we ask scope questions.", buttons: ["[tool] Repair or replacement", "[home] Remodel or build", "[?] Help me scope the project first"] },
      { name: "Planning stage", headline: "How far along are you?", body: "Idea stage, comparing estimates, ready to schedule, or urgent repair?", formCta: "Continue" },
      { name: "Scope and property details", headline: "What is the project scope?", body: "Rooms, surfaces, dimensions, material preferences, or property type all help.", formCta: "Continue" },
      { name: "Timing and budget comfort", headline: "What timing and budget range feels realistic?", body: "A range is enough. This helps avoid mismatched providers.", formCta: "Continue" },
      { name: "Photos or special constraints", headline: "Anything a pro should know first?", body: "Permits, access, insurance, pets, parking, HOA, or photos available.", formCta: "Continue" },
      { name: "Contact and optional concierge", headline: "How should Erie.Pro help next?", body: "Stay with free matching or ask for more hands-on project help.", formCta: "Send project details" },
      { name: "Project request received", headline: "Project request received.", body: "Your scope, stage, timing, and constraints are included." },
    ],
  },
  "232598": {
    family: "Planned Home Projects",
    desiredSteps: 7,
    rationale: "High-value project estimates need enough context to make the first call useful.",
    steps: [
      { name: "Choose the project type", headline: "Which project path fits best?", body: "This keeps the first estimate from being too broad.", buttons: ["[tool] Kitchen, bath, basement, or remodel", "[home] Roof, siding, windows, or exterior", "[?] Help me compare project options"] },
      { name: "Goal and outcome", headline: "What outcome do you want?", body: "Repair, refresh, replacement, safety, energy savings, resale, or full transformation.", formCta: "Continue" },
      { name: "Scope details", headline: "Add the useful project details.", body: "Approximate size, count, rooms, material, surface, system, or current condition.", formCta: "Continue" },
      { name: "Decision stage", headline: "Where are you in the decision?", body: "Researching, pricing, selecting a pro, ready to start, or urgent repair.", formCta: "Continue" },
      { name: "Timing and constraints", headline: "What timing or constraints matter?", body: "Start date, deadline, financing, insurance, access, or permit concerns.", formCta: "Continue" },
      { name: "Contact and next step", headline: "How should the next step happen?", body: "Choose contact preference and whether you want free matching or extra guidance.", formCta: "Start project match" },
      { name: "Project details saved", headline: "Project details saved.", body: "The request is more specific than a generic project quote." },
    ],
  },
  "232599": {
    family: "Health And Wellness Appointments",
    desiredSteps: 4,
    rationale: "Appointment visitors need privacy, fit, and scheduling without over-sharing.",
    steps: [
      { name: "What kind of appointment?", headline: "What kind of appointment are you looking for?", body: "Choose the closest care category. Keep details brief.", buttons: ["[cal] Dental, vision, skin, hearing, or therapy", "[pet] Pet care or grooming", "[?] I want help choosing privately"] },
      { name: "Care type and timing", headline: "What care type and timing fit?", body: "Share appointment type, preferred window, and whether this is new or follow-up care.", formCta: "Continue" },
      { name: "Private contact details", headline: "How should someone follow up?", body: "Avoid detailed medical history here. A provider can follow up privately.", formCta: "Request appointment help" },
      { name: "Appointment request received", headline: "Appointment request received.", body: "The request is brief, private, and appointment-focused." },
    ],
  },
  "232600": {
    family: "Professional Legal And Financial",
    desiredSteps: 5,
    rationale: "Professional and sensitive services need matter type, deadline, privacy-safe summary, contact, and confirmation.",
    steps: [
      { name: "What kind of help?", headline: "What kind of professional help do you need?", body: "Choose the closest category. Keep sensitive details brief.", buttons: ["[doc] Legal, tax, insurance, or financial", "[home] Real estate, inspection, or mortgage", "[?] Help me choose the right professional"] },
      { name: "Deadline or timing", headline: "Is there a deadline or important date?", body: "Court date, closing date, tax deadline, event date, or planning window.", formCta: "Continue" },
      { name: "Brief private summary", headline: "Share a brief routing summary.", body: "Do not upload documents or share detailed private facts in this box.", formCta: "Continue" },
      { name: "Contact preference", headline: "How should a professional follow up?", body: "Choose the best contact method and time window.", formCta: "Request consultation help" },
      { name: "Consultation request received", headline: "Consultation request received.", body: "Your category, timing, and contact preference are included." },
    ],
  },
  "232601": {
    family: "Provider Territory Claim",
    desiredSteps: 6,
    rationale: "Provider acquisition needs category fit, territory, business info, response capacity, contact, and review.",
    steps: [
      { name: "What service do you provide?", headline: "What Erie County service do you provide?", body: "Choose the closest provider family so category review starts correctly.", buttons: ["[home] Home or property service", "[brief] Health, professional, or appointment service", "[?] Help classify my service"] },
      { name: "Communities served", headline: "Which Erie County communities do you serve?", body: "List the areas where you can realistically respond.", formCta: "Continue" },
      { name: "Business details", headline: "Tell us about the business.", body: "Business name, website, license/insurance notes, or profile claim context.", formCta: "Continue" },
      { name: "Lead response readiness", headline: "How quickly can you respond?", body: "Response speed affects fit for urgent and high-intent requests.", formCta: "Continue" },
      { name: "Owner contact", headline: "Who should Erie.Pro contact?", body: "Add owner or manager contact details for review.", formCta: "Check my service category" },
      { name: "Claim request received", headline: "Claim request received.", body: "Category and territory fit will be reviewed before any promise is made." },
    ],
  },
  "232602": {
    family: "Returning And Exit Rescue",
    desiredSteps: 3,
    rationale: "Exit rescue should be tiny: obstacle, next step/contact, confirmation.",
    steps: [
      { name: "What got in the way?", headline: "What got in the way?", body: "Choose the smallest helpful next step.", buttons: ["[?] Not sure which service fits", "[$] Still comparing price or providers", "[phone] Need help today"] },
      { name: "Choose the next step", headline: "What should Erie.Pro do next?", body: "Save the request, ask a pricing question, route from symptoms, or request contact.", formCta: "Finish my request" },
      { name: "Saved for follow-up", headline: "Saved for follow-up.", body: "Your reason and preferred next step are included." },
    ],
  },
  "232603": {
    family: "Returning And Exit Rescue",
    desiredSteps: 3,
    rationale: "Returning visitors should not restart a long flow.",
    steps: [
      { name: "What were you working on?", headline: "What were you working on?", body: "Pick up from the service, price question, or callback path.", buttons: ["[?] Finish a service request", "[$] Ask about price or timing", "[phone] Request a callback"] },
      { name: "Update the next step", headline: "What changed since last time?", body: "Share the service, urgency, or best contact path now.", formCta: "Continue my request" },
      { name: "We will help from here", headline: "We will help from here.", body: "Your updated context is ready for follow-up." },
    ],
  },
};

function newId(prefix, boxId, index) {
  return `${prefix}${boxId}${index}${Math.random().toString(16).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function textElement(id, html, color, fontSize) {
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
      text: html,
      mobile: { overwritten: true, fontSize: String(Math.min(Number(fontSize), 22)), lineHeight: "1.32", vSpacingTop: 1, vSpacingBottom: 1 },
    },
  };
}

function buttonElement(id, buttons, targetStepId) {
  return {
    id,
    type: "button",
    title: "Button",
    options: {
      fontFamily: "roboto",
      multiple: true,
      amount: buttons.length,
      items: buttons.map((button, index) => ({
        id: `${id}item${index}`,
        color: "#ffffff",
        backgroundColor: index === 0 ? "#C8102E" : index === 1 ? "#1F3A5F" : "#6B7280",
        text: `<b>${button}</b>`,
        value: button.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        action: { type: "step", link: null, step: targetStepId, new_tab: false },
        automations: [],
        automations_type: "immediately",
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

function formElement(id, cta, targetStepId, family) {
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
        { type: "textarea", composite: false, input: { placeholder: `Briefly describe the ${family.toLowerCase()} need`, name: "request_context", type: "textarea", required: true } },
        { type: "text", composite: false, input: { placeholder: "Erie County ZIP or community", name: "zip_or_community", type: "text", required: false } },
        { type: "phone", composite: false, input: { placeholder: "Best phone number", name: "phone", type: "tel", required: true } },
        { type: "email", composite: false, input: { placeholder: "Best email", name: "email", type: "text", required: false } },
      ],
      actions: [],
      vSpacingTop: 1,
      vSpacingBottom: 1,
      buttonText: `<b>${cta}</b>`,
      layout: "vertical",
      shape: "rounded",
      mobile: { overwritten: true, size: "m", shape: "rounded", vSpacingTop: 1, vSpacingBottom: 1 },
      conditional_integrations: [],
    },
  };
}

function trustElement(id) {
  return textElement(id, '<div style="text-align:center;font-size:13px;line-height:1.45;color:#4A4A4A;"><span style="display:inline-block;margin:3px 6px;padding:5px 9px;border:1px solid #D7DEE6;border-radius:999px;background:#ffffff;">Private request</span><span style="display:inline-block;margin:3px 6px;padding:5px 9px;border:1px solid #D7DEE6;border-radius:999px;background:#ffffff;">Erie County focused</span><span style="display:inline-block;margin:3px 6px;padding:5px 9px;border:1px solid #D7DEE6;border-radius:999px;background:#ffffff;">One routed path</span></div>', "#4A4A4A", 13);
}

function buildSteps(box, spec) {
  const existingSteps = (((box.variations || [])[0] || {}).steps || []);
  const finalStepIds = spec.steps.map((_, index) => existingSteps[index]?.id || `step${box.id}${index}${Math.random().toString(16).slice(2, 8)}`);
  const templateBackground = clone(existingSteps[0]?.background || {});
  return spec.steps.map((stepSpec, index) => {
    const nextStepId = finalStepIds[Math.min(index + 1, finalStepIds.length - 1)];
    const center = [
      textElement(newId("label", box.id, index), `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#F8FAFC;color:#C8102E;font-size:13px;font-weight:700;text-transform:uppercase;">${spec.family}</span><br><b>${stepSpec.headline}</b>`, "#C8102E", index === 0 ? 34 : 28),
      textElement(newId("body", box.id, index), stepSpec.body, "#1F3A5F", 17),
    ];
    if (index === 0) center.push(trustElement(newId("trust", box.id, index)));
    if (stepSpec.buttons) center.push(buttonElement(newId("btn", box.id, index), stepSpec.buttons, nextStepId));
    else if (index < spec.steps.length - 1) center.push(formElement(newId("form", box.id, index), stepSpec.formCta || "Continue", nextStepId, spec.family));
    const original = existingSteps[index] || {};
    return {
      ...clone(original),
      id: finalStepIds[index],
      name: stepSpec.name,
      loading_screen: false,
      loading_message: "Matching your request...",
      conditional_skips: [],
      elements: { center, left: [], right: [] },
      layout: { column_number: 1, column_layout: "center" },
      background: templateBackground,
    };
  });
}

function patchBox(box, spec) {
  box.active = false;
  box.meta = box.meta || {};
  box.meta.steps_introduction = false;
  box.meta.ep_persona_fit_steps_applied = true;
  box.meta.ep_persona_fit_steps_applied_at = new Date().toISOString();
  box.meta.ep_desired_step_count = spec.desiredSteps;
  box.meta.ep_step_count_rationale = spec.rationale;
  box.meta.ep_service_family = spec.family;

  for (const variation of box.variations || []) {
    variation.steps = buildSteps(box, spec);
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

  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage();
  await login(page, username, password);

  const results = [];
  for (const [id, spec] of Object.entries(FLOW_SPECS)) {
    const box = await page.evaluate(async (id) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, { credentials: "include", headers: { accept: "application/json" } });
      const parsed = await res.json();
      return parsed.box || parsed.data || parsed;
    }, id);
    patchBox(box, spec);
    const save = await page.evaluate(async ({ id, box }) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { accept: "application/json", "content-type": "application/json;charset=UTF-8", "x-requested-with": "XMLHttpRequest" },
        body: JSON.stringify(box),
      });
      return { status: res.status, text: (await res.text()).slice(0, 120) };
    }, { id, box });
    results.push({ id, ok: save.status >= 200 && save.status < 300, desiredSteps: spec.desiredSteps, family: spec.family });
  }

  await browser.close();
  console.log(JSON.stringify({ updated: results.filter((result) => result.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
