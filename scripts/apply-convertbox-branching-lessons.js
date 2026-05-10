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

const LESSONS = {
  "232597": {
    family: "Emergency Home Response",
    headline: "Need urgent Erie County help?",
    body: "Start with the issue. We will keep the next step short and focused.",
    firstButtons: ["Water, heat, power, or storm", "Lockout, access, or roadside", "Not sure what counts as urgent"],
    alternateHeadline: "Not sure what to request?",
    alternateBody: "Choose the closest issue and add one sentence. Erie.Pro can route from symptoms, not just service names.",
    noPath: "Help me choose the right urgent path",
    primaryCta: "Send urgent request",
    secondaryCta: "Help me choose first",
    confirmation: "Request received. Keep your phone nearby if this is urgent.",
  },
  "232595": {
    family: "Emergency Home Response",
    headline: "What urgent issue needs attention?",
    body: "Pick the closest situation so the request starts in the right lane.",
    firstButtons: ["Leak, backup, no heat, or no power", "Lockout, towing, or access issue", "Storm, snow, ice, or property damage"],
    alternateHeadline: "If none fit perfectly, choose the closest one.",
    alternateBody: "A short description is enough. The goal is speed, not a perfect form.",
    noPath: "I need help choosing",
    primaryCta: "Send urgent request",
    secondaryCta: "Route from my description",
    confirmation: "Urgent request received with the issue context included.",
  },
  "232594": {
    family: "Cleaning And Turnover",
    headline: "Need cleaning, hauling, moving, or turnover help?",
    body: "Tell us what has to be ready and when. Timing matters more than a long form.",
    firstButtons: ["Cleaning or turnover", "Moving, junk, or dumpster", "Exterior, carpet, or pressure washing"],
    alternateHeadline: "Still comparing options?",
    alternateBody: "Tell us the date, size, or obstacle and we will help route the request without overcomplicating it.",
    noPath: "Help me pick the right cleaning path",
    primaryCta: "Send cleaning request",
    secondaryCta: "Ask a timing question",
    confirmation: "Request received with timing and property context.",
  },
  "232596": {
    family: "Planned Home Projects",
    headline: "Planning a project in Erie County?",
    body: "Answer the project questions first. Contact details come after the scope is clear.",
    firstButtons: ["Repair or replacement", "Remodel or build", "Energy, electrical, or exterior project"],
    alternateHeadline: "Not ready for an estimate yet?",
    alternateBody: "You can still share the project stage and get a cleaner next step before talking to a pro.",
    noPath: "Help me scope the project first",
    primaryCta: "Send project details",
    secondaryCta: "Help me plan first",
    confirmation: "Project request received with scope and timing context.",
  },
  "232598": {
    family: "Planned Home Projects",
    headline: "Make the first estimate call more useful.",
    body: "Choose the project family so Erie.Pro can ask the right scope questions.",
    firstButtons: ["Kitchen, bath, basement, or remodel", "Roof, siding, windows, or exterior", "Concrete, deck, solar, EV, or generator"],
    alternateHeadline: "Need help comparing project options?",
    alternateBody: "Share where you are stuck: budget, scope, timing, materials, or who to call first.",
    noPath: "Help me compare options",
    primaryCta: "Start project match",
    secondaryCta: "Get project guidance",
    confirmation: "Project details saved for a more useful match.",
  },
  "232599": {
    family: "Health And Wellness Appointments",
    headline: "Looking for an Erie County appointment?",
    body: "Keep this brief and private. Start with the type of care, then choose a contact window.",
    firstButtons: ["Dental, vision, skin, hearing, or therapy", "Pet care or grooming", "Senior care, home health, or counseling"],
    alternateHeadline: "Prefer a softer first step?",
    alternateBody: "You do not need to share detailed medical history here. A brief appointment reason is enough.",
    noPath: "I want help choosing privately",
    primaryCta: "Request appointment help",
    secondaryCta: "Ask about appointment fit",
    confirmation: "Appointment request received. Details can be handled privately with the provider.",
  },
  "232600": {
    family: "Professional Legal And Financial",
    headline: "Need a local professional consultation?",
    body: "Start with the type of matter and any timing concern. Keep sensitive details brief.",
    firstButtons: ["Legal, tax, insurance, or financial", "Real estate, inspection, or mortgage", "Funeral, estate sale, or sensitive planning"],
    alternateHeadline: "Not sure who to talk to first?",
    alternateBody: "Share the category and deadline. Erie.Pro can route from the situation without collecting private documents.",
    noPath: "Help me choose the right professional",
    primaryCta: "Request consultation help",
    secondaryCta: "Ask who fits best",
    confirmation: "Consultation request received with category and timing context.",
  },
  "232601": {
    family: "Provider Territory Claim",
    headline: "Serve Erie County?",
    body: "Start by checking your service category. Territory fit comes before any promise.",
    firstButtons: ["Home or property service", "Health, professional, or appointment service", "Cleaning, seasonal, auto, or marine"],
    alternateHeadline: "Not sure where your business fits?",
    alternateBody: "Tell us what you provide and which Erie County communities you serve. We will review the category.",
    noPath: "Help classify my service",
    primaryCta: "Check my service category",
    secondaryCta: "Ask about fit first",
    confirmation: "Provider claim request received for review.",
  },
  "232602": {
    family: "Returning And Exit Rescue",
    headline: "Leaving before you found the right path?",
    body: "Tell us what got in the way. The next step can be smaller than a full request.",
    firstButtons: ["Not sure which service fits", "Still comparing price or providers", "Need help today"],
    alternateHeadline: "Want a smaller next step?",
    alternateBody: "Save the service, ask a pricing question, or request help choosing the right path.",
    noPath: "Save this and follow up later",
    primaryCta: "Finish my request",
    secondaryCta: "Save or ask a question",
    confirmation: "Saved for follow-up with the reason included.",
  },
  "232603": {
    family: "Returning And Exit Rescue",
    headline: "Want to continue your Erie County request?",
    body: "Pick up where you left off. You do not have to start over.",
    firstButtons: ["Finish a service request", "Ask about price or timing", "Request a callback"],
    alternateHeadline: "Need a different next step now?",
    alternateBody: "Choose what changed so the follow-up matches your current situation.",
    noPath: "Change my request path",
    primaryCta: "Continue my request",
    secondaryCta: "Update my next step",
    confirmation: "Request context updated for follow-up.",
  },
};

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function setTextOption(element, text, size) {
  if (!element || !element.options) return;
  element.options.text = text;
  if (size) element.options.fontSize = size;
}

function findTextElements(step) {
  const columns = step && step.elements ? ["center", "left", "right"] : [];
  return columns.flatMap((column) => (step.elements[column] || []).filter((element) => element.type === "text"));
}

function findButtonElements(step) {
  const columns = step && step.elements ? ["center", "left", "right"] : [];
  return columns.flatMap((column) => (step.elements[column] || []).filter((element) => element.type === "button"));
}

function findFormElements(step) {
  const columns = step && step.elements ? ["center", "left", "right"] : [];
  return columns.flatMap((column) => (step.elements[column] || []).filter((element) => element.type === "form"));
}

function patchButtons(button, labels, fallbackActionType) {
  const items = (((button || {}).options || {}).items || []).filter(Boolean);
  labels.forEach((label, index) => {
    if (!items[index]) return;
    items[index].text = `<b>${label}</b>`;
    items[index].value = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    items[index].backgroundColor = index === 0 ? "#C8102E" : index === 1 ? "#1F3A5F" : "#6B7280";
    items[index].color = "#ffffff";
    if (fallbackActionType && items[index].action) items[index].action.type = items[index].action.type || fallbackActionType;
  });
}

function patchForms(step, lesson) {
  for (const form of findFormElements(step)) {
    const options = form.options || {};
    options.buttonText = `<b>${lesson.primaryCta}</b>`;
    options.buttonBackgroundColor = "#C8102E";
    options.buttonTextColor = "#ffffff";
    const fields = options.fields || [];
    fields.forEach((field) => {
      const input = field.input || {};
      const name = String(input.name || "").toLowerCase();
      if (name.includes("project") || name.includes("details") || name.includes("message") || field.type === "textarea") {
        input.placeholder = `Briefly describe the ${lesson.family.toLowerCase()} need`;
      }
      if (name.includes("phone")) input.placeholder = "Best phone number";
      if (name.includes("email")) input.placeholder = "Best email";
      if (name.includes("zip")) input.placeholder = "Erie County ZIP or community";
      field.input = input;
    });
    form.options = options;
  }
}

function patchBox(box, lesson) {
  box.name = box.name.includes("Draft Preview") ? box.name : `${box.name} - Draft Preview`;
  box.active = false;
  box.meta = box.meta || {};
  box.meta.ep_branching_lessons_applied = true;
  box.meta.ep_branching_lesson_source = "https://app.convertbox.com/share/SE6OC2LI";
  box.meta.ep_branching_lessons_applied_at = new Date().toISOString();
  box.meta.ep_service_family = lesson.family;
  box.meta.steps_introduction = false;

  const steps = (((box.variations || [])[0] || {}).steps || []);
  if (!steps.length) return;

  const first = steps[0];
  const firstTexts = findTextElements(first);
  if (firstTexts[0]) setTextOption(firstTexts[0], `<b>${lesson.headline}</b>`, "38");
  if (firstTexts[1]) setTextOption(firstTexts[1], `${lesson.body}<br><br><b>Choose the closest path. You can still change direction later.</b>`, "18");
  if (firstTexts[2]) setTextOption(firstTexts[2], `<b>Start with one quick choice. Contact details come after the request is clear.</b>`, "20");
  const firstButton = findButtonElements(first)[0];
  if (firstButton) patchButtons(firstButton, lesson.firstButtons, "step");

  const alternateIndex = Math.min(4, steps.length - 2);
  const alternate = steps[alternateIndex];
  if (alternate) {
    alternate.name = alternate.name.includes("Review") ? alternate.name : "Not ready yet?";
    const texts = findTextElements(alternate);
    if (texts[0]) setTextOption(texts[0], `<b>${lesson.alternateHeadline}</b>`, "28");
    if (texts[1]) setTextOption(texts[1], `${lesson.alternateBody}<br><br>This is the low-pressure path: save it, ask a question, or get routed from context.`, "17");
    const buttons = findButtonElements(alternate);
    if (buttons[0]) patchButtons(buttons[0], [lesson.noPath, lesson.secondaryCta], "step");
  }

  const confirmation = steps[steps.length - 1];
  if (confirmation) {
    const texts = findTextElements(confirmation);
    if (texts[0]) setTextOption(texts[0], `<b>${lesson.confirmation}</b>`, "26");
    if (texts[1]) setTextOption(texts[1], `Thanks. Erie.Pro will use the service-family context before routing this request.`, "16");
  }

  steps.forEach((step) => patchForms(step, lesson));
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
    const lesson = LESSONS[id];
    const box = await page.evaluate(async (id) => {
      const res = await fetch(`https://app.convertbox.com/api/boxes/${id}`, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      const parsed = await res.json();
      return parsed.box || parsed.data || parsed;
    }, id);

    patchBox(box, lesson);

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
      const steps = (((box.variations || [])[0] || {}).steps || []);
      const firstStepText = JSON.stringify(steps[0] || {});
      return {
        name: box.name,
        active: box.active,
        family: box.meta && box.meta.ep_service_family,
        lessonApplied: Boolean(box.meta && box.meta.ep_branching_lessons_applied),
        firstStep: steps[0] && steps[0].name,
        firstTextPreview: firstStepText.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").slice(0, 260),
      };
    }, id);

    results.push({ id, ok: save.status >= 200 && save.status < 300, save, verify });
  }

  await browser.close();
  console.log(JSON.stringify({ updated: results.filter((r) => r.ok).length, total: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
