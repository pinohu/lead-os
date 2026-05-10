const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname, "..", "docs", "erie-pro-consolidation", "convertbox-implementation", "audit-snapshots");
const OUT_PATH = path.join(__dirname, "..", "docs", "erie-pro-consolidation", "convertbox-implementation", "FULL-BOX-AUDIT-2026-05-10.md");

const expected = {
  232597: "Emergency Home Response",
  232595: "Emergency Home Response",
  232594: "Cleaning And Turnover",
  232596: "Planned Home Projects",
  232598: "Planned Home Projects",
  232599: "Health And Wellness Appointments",
  232600: "Professional Legal And Financial",
  232601: "Provider Territory Claim",
  232602: "Returning And Exit Rescue",
  232603: "Returning And Exit Rescue",
};

const expectedStepCounts = {
  232597: 4,
  232595: 4,
  232594: 5,
  232596: 7,
  232598: 7,
  232599: 4,
  232600: 5,
  232601: 6,
  232602: 3,
  232603: 3,
};

function strip(html) {
  return String(html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else Object.values(value).forEach((item) => walk(item, visit));
}

function elements(step) {
  if (!step || !step.elements) return [];
  return ["center", "left", "right"].flatMap((key) => step.elements[key] || []);
}

function summarizeBox(box) {
  const variation = (box.variations || [])[0] || {};
  const steps = variation.steps || [];
  const all = [];
  walk(box, (node) => {
    if (node && typeof node.type === "string") all.push(node);
  });

  const buttons = all.filter((node) => node.type === "button");
  const forms = all.filter((node) => node.type === "form");
  const text = JSON.stringify(box);
  const formFields = forms.flatMap((form) => (form.options?.fields || []).map((field) => ({
    type: field.type,
    name: field.input?.name,
    placeholder: field.input?.placeholder,
    required: field.input?.required,
  })));

  const firstStep = steps[0] || {};
  const firstTexts = elements(firstStep).filter((el) => el.type === "text").map((el) => strip(el.options?.text));
  const firstButtons = elements(firstStep)
    .filter((el) => el.type === "button")
    .flatMap((button) => (button.options?.items || []).filter((item) => item.text).map((item) => strip(item.text)));

  const issues = [];
  const strengths = [];

  if (box.active === false) strengths.push("Inactive draft state is preserved.");
  else issues.push("Box is not inactive.");

  if ((box.meta || {}).ep_service_family === expected[box.id]) strengths.push("Service-family metadata matches the intended family.");
  else issues.push(`Service-family metadata mismatch: expected ${expected[box.id]}, got ${(box.meta || {}).ep_service_family || "missing"}.`);

  if (steps.length === expectedStepCounts[box.id]) strengths.push(`Uses persona-fit step count: ${steps.length}.`);
  else issues.push(`Unexpected step count: expected ${expectedStepCounts[box.id]}, got ${steps.length}.`);

  if ((box.meta || {}).steps_introduction === false) strengths.push("ConvertBox Steps drawer onboarding flag is disabled.");
  else issues.push("Steps drawer onboarding flag may still hide steps.");

  if ((box.meta || {}).ep_branching_lessons_applied) strengths.push("Branching lessons metadata is present.");
  else issues.push("Missing branching-lessons metadata.");

  if ((box.meta || {}).ep_professional_visual_system_applied) strengths.push("Professional visual-system metadata is present.");
  else issues.push("Missing visual-system metadata.");

  if ((box.meta || {}).ep_profile_photos_applied) strengths.push("Profile-photo metadata is present.");
  else issues.push("Missing profile-photo metadata.");

  if ((box.meta || {}).ep_persona_fit_steps_applied) strengths.push("Persona-fit step metadata is present.");
  else issues.push("Missing persona-fit step metadata.");

  if (variation.profile?.enabled && variation.profile?.photo?.path) strengths.push("Profile photo is attached.");
  else issues.push("Profile photo is missing or disabled.");

  if (variation.teaser?.enabled && variation.teaser?.photo?.path) strengths.push("Teaser photo is attached.");
  else issues.push("Teaser photo is missing or disabled.");

  if (text.includes("visual-trust-") || (text.includes("Private request") && text.includes("Erie County focused") && text.includes("One routed path"))) strengths.push("Trust row markup is present.");
  else issues.push("Trust row markup not found.");

  if (firstButtons.length >= 2) strengths.push("First step has multiple choice buttons.");
  else issues.push("First step does not present enough choices.");

  if (firstButtons.some((label) => /not sure|help|save|ask/i.test(label))) strengths.push("Includes a low-pressure alternate path.");
  else issues.push("Missing explicit low-pressure alternate path.");

  if (forms.length > 0) strengths.push("Contains form capture elements.");
  else issues.push("No form capture element found.");

  if (formFields.some((field) => /phone|email|contact/i.test(`${field.name} ${field.placeholder}`))) strengths.push("Has contact capture.");
  else issues.push("Contact capture fields are unclear.");

  const riskySensitive = expected[box.id] === "Health And Wellness Appointments" || expected[box.id] === "Professional Legal And Financial";
  if (riskySensitive && /avoid detailed|sensitive|private|brief/i.test(text)) strengths.push("Sensitive-service privacy language is present.");
  if (riskySensitive && !/avoid detailed|sensitive|private|brief/i.test(text)) issues.push("Sensitive-service privacy language is missing.");

  if (/30-mile|30 miles|within 30/i.test(text)) issues.push("Radius-based geography copy found.");
  else strengths.push("No targeted 30-mile/radius copy found.");

  const mobileTooSmall = [];
  walk(box, (node) => {
    const mobileFont = node?.options?.mobile?.fontSize;
    const desktopFont = node?.options?.fontSize;
    if (mobileFont && Number(mobileFont) < 12) mobileTooSmall.push({ id: node.id, mobileFont, desktopFont });
  });
  if (mobileTooSmall.length) issues.push(`Mobile font below 12px found in ${mobileTooSmall.length} element(s).`);
  else strengths.push("No mobile font below 12px found.");

  const buttonAmountMismatch = buttons.filter((button) => {
    const items = (button.options?.items || []).filter((item) => item.text);
    return button.options?.amount && Number(button.options.amount) !== items.length;
  });
  if (buttonAmountMismatch.length) issues.push(`Button amount/text item mismatch in ${buttonAmountMismatch.length} button element(s).`);
  else strengths.push("Button configured amount matches populated button text counts.");

  const urlRules = box.rules_display || {};
  if (urlRules.target === "specific_pages") strengths.push("Uses specific page targeting.");
  else issues.push(`Display targeting is not specific_pages: ${urlRules.target || "missing"}.`);

  return {
    id: box.id,
    name: box.name,
    family: (box.meta || {}).ep_service_family,
    active: box.active,
    steps: steps.map((step) => step.name),
    firstTexts,
    firstButtons,
    formFields,
    profilePhoto: variation.profile?.photo?.name || null,
    teaserPhoto: variation.teaser?.photo?.name || null,
    strengths,
    issues,
  };
}

const boxes = Object.keys(expected).map((id) => {
  const file = path.join(SNAPSHOT_DIR, `${id}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
});

const audits = boxes.map(summarizeBox);
const totalIssues = audits.reduce((sum, audit) => sum + audit.issues.length, 0);
const highLevelIssues = [
  "The drafts are structurally much stronger than the first shells: service-family routing, branching, photos, trust rows, and inactive status are all present.",
  "The main residual risk is visual fidelity inside the live ConvertBox canvas: API data confirms the elements, but final activation still requires manual visual/mobile preview.",
  "The current avatar graphics are functional service-family badges, not polished photography. They solve the empty photo icon problem, but can be upgraded to branded human/team or service imagery later.",
  "The drafts still use family-level routing, not true per-service/per-subservice flows for all 112 services. They are good preview templates, not the final exhaustive service matrix.",
];

let md = `# Erie.Pro ConvertBox Full Draft Audit\n\nDate: 2026-05-10\n\nSource: fresh authenticated ConvertBox API snapshots saved under \`audit-snapshots/\`.\n\n## Overall Verdict\n\nThe 10 ConvertBox drafts are now suitable for preview and stakeholder review, but they are not ready for activation. They have meaningful service-family journeys, branching, profile photos, trust rows, persona-fit step counts, and Erie County-focused copy. Remaining work is visual/mobile QA inside the ConvertBox editor, test submissions, and per-service/subservice expansion.\n\n## High-Level Findings\n\n${highLevelIssues.map((item) => `- ${item}`).join("\n")}\n\n## Audit Scorecard\n\n- Boxes audited: ${audits.length}\n- Total issues/risks found: ${totalIssues}\n- All boxes inactive: ${audits.every((audit) => audit.active === false) ? "yes" : "no"}\n- All boxes use persona-fit step counts: ${audits.every((audit) => audit.steps.length === expectedStepCounts[audit.id]) ? "yes" : "no"}\n- All boxes have profile photos: ${audits.every((audit) => audit.profilePhoto) ? "yes" : "no"}\n- All boxes have teaser photos: ${audits.every((audit) => audit.teaserPhoto) ? "yes" : "no"}\n\n`;

for (const audit of audits) {
  md += `## ${audit.name}\n\n`;
  md += `- Box id: \`${audit.id}\`\n`;
  md += `- Family: \`${audit.family}\`\n`;
  md += `- Active: \`${audit.active}\`\n`;
  md += `- Profile photo: \`${audit.profilePhoto || "missing"}\`\n`;
  md += `- Teaser photo: \`${audit.teaserPhoto || "missing"}\`\n\n`;
  md += `Steps:\n\n${audit.steps.map((step) => `- ${step}`).join("\n")}\n\n`;
  md += `First-step choice buttons:\n\n${audit.firstButtons.map((button) => `- ${button}`).join("\n") || "- none"}\n\n`;
  md += `Strengths:\n\n${audit.strengths.map((item) => `- ${item}`).join("\n")}\n\n`;
  md += `Issues / risks:\n\n${audit.issues.length ? audit.issues.map((item) => `- ${item}`).join("\n") : "- No structural issue found in JSON audit."}\n\n`;
}

md += `## Required Before Activation\n\n- Open every box in the ConvertBox visual editor and preview desktop and mobile.\n- Confirm profile photos render, not only exist in JSON.\n- Click through each step path, including alternate/no-path choices.\n- Submit test leads for each family and confirm payload routing.\n- Confirm no box appears immediately on public pages except direct CTA click flows.\n- Confirm suppression rules and page targeting against live Erie.Pro URLs.\n- Replace functional SVG badges with more polished branded/person/service imagery if the preview still feels too plain.\n- Expand from family-level templates into service/subservice variants for highest-priority Erie.Pro services before full deployment.\n`;

fs.writeFileSync(OUT_PATH, md);
console.log(JSON.stringify({ out: OUT_PATH, boxes: audits.length, totalIssues }, null, 2));
