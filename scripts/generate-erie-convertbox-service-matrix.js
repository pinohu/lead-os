const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMPLEMENTATION_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "convertbox-implementation");
const SOURCE_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "source-snapshots");
const FAMILY_MAP = path.join(IMPLEMENTATION_DIR, "SERVICE-FAMILY-MAP.csv");
const OUT_JSON = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-SERVICE-MATRIX.json");
const OUT_MD = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-SERVICE-MATRIX.md");

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      out.push(current);
      current = "";
    } else current += char;
  }
  out.push(current);
  return out.map((value) => value.trim());
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sentence(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function servicePhrase(value) {
  const acronyms = new Set(["HVAC", "AC", "EV"]);
  return String(value || "")
    .split(/(\s+|\/|&|-)/)
    .map((part) => {
      if (/^\s+$|^\/$|^&$|^-$/.test(part)) return part;
      if (acronyms.has(part.toUpperCase())) return part.toUpperCase();
      return part.toLowerCase();
    })
    .join("")
    .replace(/\s*&\s*/g, " and ");
}

function parseNicheSource(file) {
  const content = fs.readFileSync(file, "utf8");
  const matches = [...content.matchAll(/\{\s*slug:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*icon:\s*"[^"]*",\s*description:\s*"([^"]+)",\s*searchTerms:\s*\[([^\]]*)\],\s*avgProjectValue:\s*"([^"]+)"/g)];
  return matches.map((match) => ({
    slug: match[1],
    label: match[2],
    description: match[3],
    searchTerms: [...match[4].matchAll(/"([^"]+)"/g)].map((term) => term[1]),
    avgProjectValue: match[5],
  }));
}

function loadNiches() {
  const niches = [
    ...parseNicheSource(path.join(SOURCE_DIR, "niches.ts")),
    ...parseNicheSource(path.join(SOURCE_DIR, "additional-niches.ts")),
  ];
  const bySlug = new Map();
  const byLabel = new Map();
  for (const niche of niches) {
    bySlug.set(niche.slug, niche);
    byLabel.set(niche.label.toLowerCase(), niche);
  }
  return { bySlug, byLabel };
}

function loadFamilyRows() {
  const lines = fs.readFileSync(FAMILY_MAP, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

const FAMILY_BLUEPRINTS = {
  "Emergency Home Response": {
    group: "Erie.Pro - Emergency",
    template: "EP-C02 Emergency Callback",
    format: "click modal + urgent slide-in",
    trigger: "CTA click, 20 seconds on emergency page, or desktop exit intent",
    suppression: "30d after submit; CTA click may override non-submit close suppression",
    persona: "stressed homeowner, renter, property manager, or driver who wants fast help",
    firstQuestion: (service) => `Need urgent ${servicePhrase(service.label)} help?`,
    body: (service) => `Tell us what happened, where you are in Erie County, and the fastest safe way to reach you. If anyone is in immediate danger, call 911 first.`,
    buttons: (service) => [
      `I need ${servicePhrase(service.label)} help now`,
      "This may cause damage or safety risk",
      "Help me choose the urgent path",
    ],
    fields: ["service_issue", "safety_or_damage_flag", "property_type", "zip_or_community", "phone_required", "short_description"],
    confirmation: "Thanks. Keep your phone nearby while the request is sent through the right Erie County service path.",
  },
  "Planned Home Projects": {
    group: "Erie.Pro - Service Families",
    template: "EP-C05 Project Planner",
    format: "multi-step modal + embedded guide helper",
    trigger: "CTA click, 60% scroll, 70 seconds, or second service pageview",
    suppression: "7d after close; 30d after submit",
    persona: "project planner comparing scope, cost, timing, disruption, and provider fit",
    firstQuestion: (service) => `Planning ${servicePhrase(service.label)} work?`,
    body: (service) => `Share the scope so the first Erie County provider conversation starts prepared.`,
    buttons: (service) => [
      `I need ${servicePhrase(service.label)} repair or replacement`,
      `I am planning a ${servicePhrase(service.label)} project`,
      "Help me scope this first",
    ],
    fields: ["project_type", "decision_stage", "scope_details", "property_type", "size_or_count", "timeline", "budget_range_optional", "constraints", "zip_or_community", "contact"],
    confirmation: "Thanks. Your scope, timing, and constraints are ready for a more useful Erie County provider conversation.",
  },
  "Seasonal Erie Services": {
    group: "Erie.Pro - Seasonal",
    template: "EP-C06 Seasonal Erie Helper",
    format: "slide-in + embedded seasonal helper",
    trigger: "CTA click, 45 seconds, 60% scroll, seasonal guide view, or storm/weather page context",
    suppression: "7d after close; 30d after submit",
    persona: "property owner reacting to Erie weather, seasonal deadlines, maintenance windows, or storm risk",
    firstQuestion: (service) => `Need ${servicePhrase(service.label)} help in Erie County?`,
    body: () => "Tell us what needs to be handled and when, especially if weather or a seasonal deadline matters.",
    buttons: (service) => [
      `I need ${servicePhrase(service.label)} soon`,
      "This is storm, weather, or season related",
      "Help me choose the right timing",
    ],
    fields: ["seasonal_task", "weather_or_storm_flag", "property_type", "one_time_or_recurring", "date_or_window", "zip_or_community", "contact"],
    confirmation: "Thanks. Your request includes the Erie County timing and weather context a local provider needs.",
  },
  "Cleaning and Turnover": {
    group: "Erie.Pro - Service Families",
    template: "EP-C03 Fast Quote",
    format: "slide-in + bottom bar + embedded pricing helper",
    trigger: "CTA click, 45 seconds, 60% scroll, or second high-intent pageview",
    suppression: "7d after close; 30d after submit",
    persona: "busy visitor who needs a space cleaned, moved, hauled, or ready by a specific date",
    firstQuestion: (service) => `Need ${servicePhrase(service.label)} help?`,
    body: () => "Tell us what needs to be ready, how big it is, and when it has to be done.",
    buttons: (service) => [
      `I need ${servicePhrase(service.label)} scheduled`,
      "There is a move, turnover, or deadline",
      "Help me choose the right service",
    ],
    fields: ["service_type", "property_type", "size_or_rooms", "item_volume", "date_needed", "access_notes", "zip_or_community", "contact"],
    confirmation: "Thanks. Your timing, size, and access details are ready for a useful quote.",
  },
  "Pest and Environmental": {
    group: "Erie.Pro - Service Families",
    template: "EP-C07 Pest / Environmental Concern",
    format: "calm slide-in + click modal",
    trigger: "CTA click, 45 seconds, 60% scroll, or concern-specific guide view",
    suppression: "7d after close; 30d after submit",
    persona: "visitor concerned about health, safety, property damage, contamination, or discomfort",
    firstQuestion: (service) => `Concerned about ${servicePhrase(service.label)}?`,
    body: () => "Tell us what you noticed and where. A brief, private note is enough.",
    buttons: (service) => [
      `I noticed a ${servicePhrase(service.label)} issue`,
      "I need testing, inspection, or removal",
      "Help me choose the safest next step",
    ],
    fields: ["concern_type", "location_in_property", "severity", "sensitive_occupants", "testing_or_removal", "timeline", "contact"],
    confirmation: "Thanks. We will keep this focused on the right inspection, testing, or removal path.",
  },
  "Auto Marine Roadside": {
    group: "Erie.Pro - Service Families",
    template: "EP-C08 Auto / Roadside / Marine",
    format: "click modal + urgent slide-in where location matters",
    trigger: "CTA click, 20 seconds for roadside pages, 45 seconds for repair/marine pages, or exit intent",
    suppression: "7d after close; 30d after submit; urgent CTA click may override",
    persona: "driver, boat owner, or property owner whose asset status and location decide the next step",
    firstQuestion: (service) => `Need ${servicePhrase(service.label)} help?`,
    body: () => "Tell us what is affected, where it is, and whether it can still be used safely.",
    buttons: (service) => [
      `I need ${servicePhrase(service.label)} help now`,
      "I need repair, service, or scheduling",
      "Help me choose the right path",
    ],
    fields: ["asset_type", "current_location", "issue", "drivable_or_usable", "destination_optional", "timing", "contact"],
    confirmation: "Thanks. Your location and equipment details are ready for the right Erie County provider path.",
  },
  "Health and Appointments": {
    group: "Erie.Pro - Appointments",
    template: "EP-C04 Appointment / Consultation Request",
    format: "privacy-aware click modal + soft slide-in",
    trigger: "CTA click, 50 seconds, 60% scroll, or return visit; no aggressive exit intent on sensitive pages",
    suppression: "7d after close; 30d after submit",
    persona: "person choosing an appointment, clinic, caregiver, pet service, or private care path",
    firstQuestion: (service) => `Looking for ${servicePhrase(service.label)} in Erie County?`,
    body: () => "Choose the closest appointment need. Share only what you are comfortable sharing here.",
    buttons: (service) => [
      `I want ${servicePhrase(service.label)} appointment help`,
      "I have timing or care preferences",
      "I want help choosing privately",
    ],
    fields: ["care_type", "preferred_window", "new_or_existing", "privacy_safe_summary", "insurance_or_payment_note_optional", "contact"],
    confirmation: "Thanks. Your request stays brief, private, and focused on the right appointment path.",
  },
  "Professional and Financial": {
    group: "Erie.Pro - Professional",
    template: "EP-C04 Appointment / Consultation Request",
    format: "consultation click modal + embedded guide helper",
    trigger: "CTA click, 50 seconds, 60% scroll, pricing/compare page, or return visit",
    suppression: "7d after close; 30d after submit",
    persona: "visitor making a higher-trust decision involving deadlines, documents, money, property, family, or sensitive life events",
    firstQuestion: (service) => `Need ${servicePhrase(service.label)} help?`,
    body: () => "Tell us the type of help you need and when you would like to speak with someone. A brief note is enough.",
    buttons: (service) => [
      `I need ${servicePhrase(service.label)} guidance`,
      "There is a date, deadline, or event",
      "Help me choose the right professional",
    ],
    fields: ["matter_type", "deadline_or_date", "personal_business_property_context", "privacy_safe_summary", "preferred_contact_window", "contact"],
    confirmation: "Thanks. The next conversation can start with the right context and a respectful pace.",
  },
};

const FLOW_TO_ROUTE = {
  "EP-02 Emergency Callback": "urgent_callback",
  "EP-03 Fast Quote": "fast_quote",
  "EP-05 Project Planner": "project_planner",
  "EP-06 Appointment Request": "appointment_or_consultation",
};

const COPY_OVERRIDES = {
  "funeral-homes": {
    headline: "Need help choosing a funeral home?",
    body: "Tell us what kind of help is needed and when you would like someone to follow up. A brief note is enough.",
    buttons: ["Immediate arrangement help", "Pre-planning or memorial questions", "Help me choose the right conversation"],
    confirmation: "Thanks. The next conversation can start gently, with the right context and a respectful pace.",
  },
  "mental-health-counseling": {
    headline: "Looking for counseling support in Erie County?",
    body: "Share only what you are comfortable sharing. A brief note is enough to help point you toward the right appointment path.",
    buttons: ["Individual, couples, or family counseling", "Child, teen, or medication-support referral help", "I want help choosing privately"],
    confirmation: "Thanks. Your request stays brief, private, and focused on the right next conversation.",
  },
  "senior-home-care": {
    headline: "Looking for senior home care help?",
    body: "Tell us what kind of support may be needed and when a conversation would help.",
    buttons: ["Companionship or daily living support", "Respite, personal care, or schedule help", "I want help choosing privately"],
  },
  "home-health-care": {
    headline: "Looking for home health care help?",
    body: "Share the general care need and preferred follow-up window. Keep medical details brief here.",
    buttons: ["Skilled care, nursing, or therapy visits", "Recovery or ongoing support at home", "I want help choosing privately"],
  },
  "estate-sale-services": {
    headline: "Need help with an estate sale or downsizing?",
    body: "Tell us the timeline, property context, and what kind of help would make the next step easier.",
    buttons: ["Estate sale or sale management", "Downsizing, appraisal, or cleanout help", "Help me choose the right professional"],
  },
  "towing-roadside-assistance": {
    headline: "Need roadside help in Erie County?",
    body: "Tell us where the vehicle is, what happened, and the fastest safe way to reach you.",
    buttons: ["I need towing or roadside help now", "The vehicle is disabled or unsafe", "Help me choose the right path"],
  },
  "snow-removal": {
    headline: "Need snow removal in Erie County?",
    body: "Tell us whether this is storm help now, a one-time visit, or seasonal service.",
    buttons: ["I need snow cleared soon", "I want seasonal snow service", "Help me choose the right timing"],
  },
  "commercial-snow-removal": {
    headline: "Need commercial snow removal?",
    body: "Tell us the property type, coverage need, and whether this is for an active storm or seasonal contract.",
    buttons: ["Parking lot or sidewalk service", "Seasonal commercial contract", "Help me choose the right coverage"],
  },
  "salt-deicing-services": {
    headline: "Need salting or de-icing help?",
    body: "Tell us the property type, risk area, and whether this is for a storm, recurring coverage, or prevention.",
    buttons: ["Sidewalk, driveway, or lot treatment", "Recurring winter coverage", "Help me choose the right service"],
  },
};

function subserviceIntents(row, niche) {
  const terms = (niche?.searchTerms || []).slice(0, 6);
  const note = row.notes || "";
  const base = [
    ...terms,
    ...note
      .replace(/Use |Ask |Collect |Strong |Emergency |Immediate |Split |Avoid |Consultation-oriented |Appointment flow |Primary/gi, "")
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean),
  ];
  const seen = new Set();
  return base
    .map((item) => sentence(item).replace(/\.$/, ""))
    .filter((item) => item.length > 2)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function pageTargets(row) {
  const service = row.service_slug;
  return {
    include: [
      `/${service}`,
      `/${service}/pricing`,
      `/${service}/costs`,
      `/${service}/compare`,
      `/${service}/reviews`,
      `/${service}/directory`,
      `/${service}/faq`,
      `/${service}/guides`,
      `/${service}/checklist`,
      `/${service}/emergency`,
      `/${service}/provider`,
    ],
    exclude: ["/admin", "/dashboard", "/login", "/privacy", "/terms", "/api", "/for-business/checkout"],
  };
}

function pageTypeStrategy(row) {
  const urgent = /emergency|urgent|seasonal_urgent/i.test(row.urgency_profile);
  const sensitive = /sensitive|appointment|consultation|deadline_sensitive/i.test(row.urgency_profile);
  return {
    service_main: {
      format: "slide-in or CTA modal",
      trigger: urgent ? "CTA click or 20 seconds" : "CTA click, 45 seconds, or 60% scroll",
      goal: "move service-page intent into the right ConvertBox branch",
    },
    pricing_cost: {
      format: "embedded helper first; slide-in second",
      trigger: "50% scroll or 60 seconds",
      goal: "convert price research into a scoped request",
    },
    guide_faq: {
      format: "embedded helper",
      trigger: "inline placement; optional 70% scroll slide-in",
      goal: "turn research into a low-pressure next step",
    },
    emergency: {
      format: urgent ? "urgent click modal and compact slide-in" : "not primary unless page context is urgent",
      trigger: urgent ? "CTA click, 20 seconds, or desktop exit intent" : "suppress unless visitor clicks emergency CTA",
      goal: urgent ? "phone-first urgent request" : "avoid false urgency",
    },
    directory_compare: {
      format: "comparison helper",
      trigger: sensitive ? "CTA click or 60% scroll" : "45 seconds or 60% scroll",
      goal: "help visitor choose criteria and request help",
    },
  };
}

function branchMap(row, service, blueprint, intents) {
  const route = FLOW_TO_ROUTE[row.primary_flow] || "service_request";
  return [
    {
      id: `${row.service_slug}_primary`,
      label: blueprint.buttons(service)[0],
      route,
      metadata: {
        ep_service: row.service_label,
        ep_service_slug: row.service_slug,
        ep_family: row.family,
        ep_subintent: intents[0] || "primary_need",
        ep_urgency: row.urgency_profile,
        ep_route: route,
      },
      next_step: route === "urgent_callback" ? "location_and_fast_contact" : "qualifying_details",
    },
    {
      id: `${row.service_slug}_alternate`,
      label: blueprint.buttons(service)[1],
      route,
      metadata: {
        ep_service: row.service_label,
        ep_service_slug: row.service_slug,
        ep_family: row.family,
        ep_subintent: intents[1] || "alternate_need",
        ep_urgency: row.urgency_profile,
        ep_route: route,
      },
      next_step: "qualifying_details",
    },
    {
      id: `${row.service_slug}_help_choose`,
      label: blueprint.buttons(service)[2],
      route: "concierge_classification",
      metadata: {
        ep_service: row.service_label,
        ep_service_slug: row.service_slug,
        ep_family: row.family,
        ep_subintent: "not_sure_help_choose",
        ep_urgency: row.urgency_profile,
        ep_route: "concierge_classification",
      },
      next_step: "concierge_question",
    },
  ];
}

function leadTemperature(row) {
  if (/emergency|urgent|seasonal_urgent/i.test(row.urgency_profile)) return "hot";
  if (/date_sensitive|deadline_sensitive|consultation/i.test(row.urgency_profile)) return "warm";
  if (/appointment/i.test(row.urgency_profile)) return "warm";
  return "standard";
}

function buildService(row, niche) {
  const blueprint = FAMILY_BLUEPRINTS[row.family];
  if (!blueprint) throw new Error(`Missing family blueprint for ${row.family}`);
  const service = {
    label: row.service_label,
    slug: row.service_slug,
    description: niche?.description || row.notes,
  };
  const intents = subserviceIntents(row, niche);
  const override = COPY_OVERRIDES[row.service_slug] || {};
  return {
    service_number: Number(row.service_number),
    service_label: row.service_label,
    service_slug: row.service_slug,
    family: row.family,
    primary_flow: row.primary_flow,
    route: FLOW_TO_ROUTE[row.primary_flow] || "service_request",
    urgency_profile: row.urgency_profile,
    lead_temperature: leadTemperature(row),
    persona: blueprint.persona,
    value_context: niche?.avgProjectValue || null,
    service_context: {
      description: niche?.description || null,
      search_terms: niche?.searchTerms || [],
      implementation_note: row.notes,
      derived_subservice_intents: intents,
    },
    convertbox: {
      group: blueprint.group,
      template: blueprint.template,
      recommended_name: `EP-S${String(row.service_number).padStart(3, "0")} ${row.service_label} - Service Aware`,
      format: blueprint.format,
      trigger: blueprint.trigger,
      suppression: blueprint.suppression,
      page_targets: pageTargets(row),
      page_type_strategy: pageTypeStrategy(row),
    },
    copy: {
      first_step_label: row.family.replace(/\band\b/g, "&"),
      headline: override.headline || blueprint.firstQuestion(service),
      body: override.body || blueprint.body(service),
      trust_chips: /emergency|urgent|seasonal_urgent/i.test(row.urgency_profile)
        ? ["Erie County only", "Fastest safe contact"]
        : ["Private until you submit", "Erie County only", "One clear next step"],
      buttons: override.buttons || blueprint.buttons(service),
      confirmation: override.confirmation || blueprint.confirmation,
      sensitive_guardrail: /sensitive|appointment|consultation|deadline_sensitive/i.test(row.urgency_profile)
        ? "A brief note is enough. Do not include private documents, detailed medical history, or confidential facts in the ConvertBox."
        : null,
    },
    branches: branchMap(row, { ...service, label: row.service_label }, {
      ...blueprint,
      buttons: () => override.buttons || blueprint.buttons(service),
    }, intents),
    qualifying_fields: blueprint.fields,
    payload_fields: [
      "source",
      "site",
      "box_id",
      "variation_id",
      "step_path",
      "ep_service",
      "ep_service_slug",
      "ep_family",
      "ep_subintent",
      "ep_urgency",
      "ep_persona",
      "ep_page_url",
      "ep_page_type",
      "ep_referrer",
      "ep_zip_or_community",
      "preferred_contact",
      "lead_temperature",
      "privacy_flag",
      "created_at",
    ],
    qa: {
      desktop_preview: "required",
      mobile_preview: "required",
      branch_clickthrough: "all branches",
      test_submission: "required before activation",
      suppression_test: "required",
      payload_assertions: ["ep_service", "ep_service_slug", "ep_family", "ep_subintent", "ep_urgency", "ep_route"],
    },
    ab_tests: [
      {
        hypothesis: "Visitor-native headline beats category headline.",
        variation_a: blueprint.firstQuestion(service),
        variation_b: `${row.service_label} help in Erie County`,
      },
      {
        hypothesis: "Action-oriented button copy improves first-step engagement.",
        variation_a: blueprint.buttons(service)[0],
        variation_b: `${row.service_label} request`,
      },
    ],
  };
}

function markdown(matrix) {
  const services = matrix.services;
  const counts = services.reduce((acc, service) => {
    acc[service.family] = (acc[service.family] || 0) + 1;
    return acc;
  }, {});
  let md = `# Erie.Pro ConvertBox 112-Service Implementation Matrix\n\nDate: 2026-05-10\n\nThis is the service-specific implementation data generated from \`SERVICE-FAMILY-MAP.csv\` and recovered Erie.Pro niche source snapshots. It turns the master plan into concrete ConvertBox copy, branches, metadata, targeting, and QA requirements for every live Erie.Pro service.\n\n## Coverage\n\n- Services: ${services.length}\n`;
  for (const [family, count] of Object.entries(counts)) md += `- ${family}: ${count}\n`;
  md += `\n## Implementation Rule\n\nEach row below must become either a service-specific ConvertBox variant or a generated service context inside the relevant family template. The family template is the layout; this matrix is the service-specific intelligence.\n\n`;

  for (const [family, familyServices] of Object.entries(Object.groupBy(services, (service) => service.family))) {
    md += `## ${family}\n\n`;
    md += `| # | Service | Template | Urgency | Headline | Branches |\n`;
    md += `|---:|---|---|---|---|---|\n`;
    for (const service of familyServices) {
      md += `| ${service.service_number} | ${service.service_label} | ${service.convertbox.template} | ${service.urgency_profile} | ${service.copy.headline.replace(/\|/g, "/")} | ${service.copy.buttons.join("<br>").replace(/\|/g, "/")} |\n`;
    }
    md += `\n`;
  }

  md += `## Required QA For Every Service\n\n- Desktop preview.\n- Mobile preview.\n- All first-step branches clicked.\n- Test submission with payload verification.\n- Suppression rule verified.\n- No internal taxonomy visible to customers.\n- No placeholder icon text.\n- No 30-mile copy.\n- Correct Erie County targeting.\n`;
  return md;
}

function main() {
  const { bySlug, byLabel } = loadNiches();
  const rows = loadFamilyRows();
  const services = rows.map((row) => {
    const niche = bySlug.get(row.service_slug) || byLabel.get(row.service_label.toLowerCase()) || bySlug.get(slug(row.service_label));
    return buildService(row, niche);
  });

  const matrix = {
    generated_at: new Date().toISOString(),
    source_files: [
      "SERVICE-FAMILY-MAP.csv",
      "source-snapshots/niches.ts",
      "source-snapshots/additional-niches.ts",
      "MASTER-112-SERVICE-CONVERTBOX-PLAN.md",
    ],
    service_count: services.length,
    family_count: Object.keys(FAMILY_BLUEPRINTS).length,
    services,
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(matrix, null, 2)}\n`);
  fs.writeFileSync(OUT_MD, markdown(matrix));
  console.log(JSON.stringify({
    service_count: services.length,
    json: OUT_JSON,
    md: OUT_MD,
    families: services.reduce((acc, service) => {
      acc[service.family] = (acc[service.family] || 0) + 1;
      return acc;
    }, {}),
  }, null, 2));
}

main();
