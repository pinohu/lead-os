export type AutomationCategory =
  | "core"
  | "blue-ocean"
  | "lifecycle"
  | "system"
  | "intelligence";

export type AutomationDependency =
  | "suiteDash"
  | "emailit"
  | "aitable"
  | "discord"
  | "telegram"
  | "wbiztool"
  | "boost";

export interface AutomationEndpoint {
  name: string;
  slug: string;
  route: string;
  method: "GET" | "POST";
  category: AutomationCategory;
  dependencies: AutomationDependency[];
  description: string;
}

export interface ScenarioScript {
  name: string;
  file: string;
  purpose: string;
  dependencies: AutomationDependency[];
}

export const serviceAutomations: AutomationEndpoint[] = [
  {
    name: "Client Portal",
    slug: "client-portal",
    route: "/api/automations/client-portal",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures client portal implementation leads into SuiteDash.",
  },
  {
    name: "Process Automation",
    slug: "process-automation",
    route: "/api/automations/process-automation",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures process automation opportunities and related constraints.",
  },
  {
    name: "Systems Integration",
    slug: "systems-integration",
    route: "/api/automations/systems-integration",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures systems integration leads and target stack details.",
  },
  {
    name: "Training Platform",
    slug: "training-platform",
    route: "/api/automations/training-platform",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures LMS and training platform opportunities.",
  },
  {
    name: "Business Intelligence",
    slug: "business-intelligence",
    route: "/api/automations/business-intelligence",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures BI and reporting opportunities.",
  },
  {
    name: "Digital Transformation",
    slug: "digital-transformation",
    route: "/api/automations/digital-transformation",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures digital transformation engagements.",
  },
  {
    name: "Compliance Training",
    slug: "compliance-training",
    route: "/api/automations/compliance-training",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures compliance training platform opportunities.",
  },
  {
    name: "Managed Services",
    slug: "managed-services",
    route: "/api/automations/managed-services",
    method: "POST",
    category: "core",
    dependencies: ["suiteDash"],
    description: "Captures managed services opportunities.",
  },
  {
    name: "RE Syndication",
    slug: "re-syndication",
    route: "/api/automations/re-syndication",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures investor portal and syndication leads.",
  },
  {
    name: "Immigration Law",
    slug: "immigration-law",
    route: "/api/automations/immigration-law",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures immigration law automation opportunities.",
  },
  {
    name: "Construction",
    slug: "construction",
    route: "/api/automations/construction",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures construction portal and workflow opportunities.",
  },
  {
    name: "Franchise",
    slug: "franchise",
    route: "/api/automations/franchise",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures franchise operations opportunities.",
  },
  {
    name: "Staffing",
    slug: "staffing",
    route: "/api/automations/staffing",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures staffing automation opportunities.",
  },
  {
    name: "Church Management",
    slug: "church-management",
    route: "/api/automations/church-management",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures church management portal opportunities.",
  },
  {
    name: "Creator Management",
    slug: "creator-management",
    route: "/api/automations/creator-management",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures creator and talent management opportunities.",
  },
  {
    name: "Compliance Productized",
    slug: "compliance-productized",
    route: "/api/automations/compliance-productized",
    method: "POST",
    category: "blue-ocean",
    dependencies: ["suiteDash"],
    description: "Captures productized compliance service opportunities.",
  },
];

export const lifecycleAutomations: AutomationEndpoint[] = [
  {
    name: "Lead Intake",
    slug: "intake",
    route: "/api/intake",
    method: "POST",
    category: "lifecycle",
    dependencies: ["suiteDash", "aitable", "discord", "telegram"],
    description: "Normalizes and captures leads from every intake source.",
  },
  {
    name: "Lead Convert",
    slug: "convert",
    route: "/api/automations/convert",
    method: "POST",
    category: "lifecycle",
    dependencies: ["suiteDash", "emailit", "aitable"],
    description: "Converts captured leads into client onboarding state.",
  },
  {
    name: "Behavior Tracking",
    slug: "track",
    route: "/api/track",
    method: "POST",
    category: "lifecycle",
    dependencies: ["aitable"],
    description: "Logs structured behavior and funnel step events.",
  },
  {
    name: "Decision Engine",
    slug: "decision",
    route: "/api/decision",
    method: "POST",
    category: "lifecycle",
    dependencies: [],
    description: "Generates server-side experience and routing decisions.",
  },
  {
    name: "Nurture Cron",
    slug: "nurture",
    route: "/api/cron/nurture",
    method: "GET",
    category: "lifecycle",
    dependencies: ["emailit", "aitable", "discord", "telegram", "wbiztool"],
    description: "Runs day-based nurture follow-up across email and WhatsApp.",
  },
];

export const intelligenceAutomations: AutomationEndpoint[] = [
  {
    name: "Website Intelligence Analyze",
    slug: "intelligence-analyze",
    route: "/api/intelligence/analyze",
    method: "POST",
    category: "intelligence",
    dependencies: [],
    description: "Analyzes a target website and infers Lead OS configuration.",
  },
  {
    name: "Website Intelligence Manifest",
    slug: "intelligence-manifest",
    route: "/api/intelligence/manifest",
    method: "POST",
    category: "intelligence",
    dependencies: [],
    description: "Generates a Lead OS manifest from inferred website intelligence.",
  },
];

export const systemAutomations: AutomationEndpoint[] = [
  {
    name: "Automation Health",
    slug: "health",
    route: "/api/automations/health",
    method: "GET",
    category: "system",
    dependencies: ["suiteDash"],
    description: "Reports route inventory and integration readiness.",
  },
];

export const scenarioScripts: ScenarioScript[] = [
  {
    name: "Advanced Scenario Deploy",
    file: "make-scenarios/deploy-advanced-scenarios.mjs",
    purpose: "Deploys the advanced Boost/Make scenario set.",
    dependencies: ["boost", "discord", "telegram", "aitable", "emailit"],
  },
  {
    name: "Event Scenario Deploy",
    file: "make-scenarios/deploy-event-scenarios.mjs",
    purpose: "Deploys event capture scenarios into Boost/Make.",
    dependencies: ["boost"],
  },
  {
    name: "Hot Lead Radar Deploy",
    file: "make-scenarios/deploy-hot-lead-radar.mjs",
    purpose: "Deploys the hot lead radar scenario.",
    dependencies: ["boost", "discord", "telegram", "aitable"],
  },
  {
    name: "Niche Intelligence Deploy",
    file: "make-scenarios/deploy-niche-intelligence.mjs",
    purpose: "Deploys the niche intelligence reporting scenario.",
    dependencies: ["boost", "emailit", "aitable", "discord"],
  },
  {
    name: "Referral Engine Deploy",
    file: "make-scenarios/deploy-referral-engine.mjs",
    purpose: "Deploys the referral engine scenario.",
    dependencies: ["boost", "emailit", "aitable", "discord"],
  },
  {
    name: "Nurture Engine Script",
    file: "make-scenarios/nurture-engine.mjs",
    purpose: "Local nurture execution companion for the app-side cron path.",
    dependencies: ["emailit", "aitable", "discord", "telegram", "wbiztool"],
  },
];

export const automationCatalog = [
  ...serviceAutomations,
  ...lifecycleAutomations,
  ...intelligenceAutomations,
  ...systemAutomations,
];

