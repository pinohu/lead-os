import { clientPresets, defaultClientPresetId } from "./client-presets.ts";
import { nicheManifests } from "./niche-config.ts";

const BLUEPRINT_IDS = new Set([
  "client-audit",
  "lead-gen",
  "value-ladder",
  "high-ticket-call",
  "chatbot-lead",
  "appointment-gen",
  "abandonment-recovery",
  "bridge",
  "mini-class",
  "customer-onboarding",
  "back-to-basics",
  "webinar-live",
  "webinar-evergreen",
  "giveaway-capture",
  "documentary-vsl",
  "product-sales",
  "coupon-offer",
  "freemium-membership",
  "continuity",
  "refund-prevention",
  "affiliate-presell",
  "content-multiplier",
  "master-orchestration",
]);

const NICHE_ALIAS_MAP: Record<string, string> = {
  "business automation": "general",
  "process automation": "process-automation",
  "digital transformation": "digital-transformation",
  "systems integration": "systems-integration",
  "business intelligence": "business-intelligence",
  "real estate syndication": "re-syndication",
  "immigration law": "immigration-law",
  "franchise operations": "franchise",
  "church management": "church-management",
  "creator management": "creator-management",
  "compliance training": "compliance-training",
  "managed services": "managed-services",
};

function normalizeNicheSlug(value?: string): string {
  if (!value) return "general";

  const normalized = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, " ");
  if (nicheManifests[normalized]) return normalized;

  const alias = NICHE_ALIAS_MAP[normalized];
  if (alias) return alias;

  const dashed = normalized.replace(/\s+/g, "-");
  if (nicheManifests[dashed]) return dashed;

  return "general";
}

export interface WebsiteIntelligenceInput {
  url?: string;
  html?: string;
  notes?: string;
  forcePresetId?: string;
}

export interface ExtractedWebsiteSignals {
  url: string;
  domain: string;
  title: string;
  metaDescription: string;
  headings: string[];
  navigation: string[];
  ctas: string[];
  bodyText: string;
  colorPalette: string[];
}

export interface WebsiteArchitectureAnalysis {
  hasPricing: boolean;
  hasContactPath: boolean;
  hasBookingPath: boolean;
  hasAssessmentPath: boolean;
  hasWebinarPath: boolean;
  hasLeadMagnetPath: boolean;
  hasStoriesOrProof: boolean;
  hasEcommerceSignals: boolean;
  navigationDepth: number;
  sectionsDetected: string[];
}

export interface WebsiteBusinessAnalysis {
  brandName: string;
  presetId: string;
  serviceSlugs: string[];
  nicheSlugs: string[];
  primaryGoal:
    | "book-call"
    | "capture-lead"
    | "register-webinar"
    | "buy-now"
    | "request-quote"
    | "educate-first";
  businessModel: "service" | "education" | "ecommerce" | "hybrid";
  subjectMatter: string[];
  personaLabels: string[];
  trustProfile: "proof-heavy" | "roi-heavy" | "compliance-heavy" | "speed-heavy" | "mixed";
}

export interface WebsiteDesignAnalysis {
  visualStyle: "corporate" | "premium" | "modern-saas" | "editorial" | "conversion-heavy" | "utility";
  tone: string[];
  darkModeLikely: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export interface WebsiteFunnelAnalysis {
  recommendedBlueprints: string[];
  recommendedIntakeBias: string[];
  recommendedHeroStrategy: "roi" | "proof" | "speed";
  reasoning: string[];
}

export interface WebsiteIntelligenceAnalysis {
  signals: ExtractedWebsiteSignals;
  architecture: WebsiteArchitectureAnalysis;
  business: WebsiteBusinessAnalysis;
  design: WebsiteDesignAnalysis;
  funnel: WebsiteFunnelAnalysis;
  confidence: number;
}

export interface GeneratedLeadOsManifest {
  draftId: string;
  generatedAt: string;
  sourceUrl: string;
  brandName: string;
  legalName: string;
  presetId: string;
  tenantTag: string;
  siteUrl: string;
  supportEmail: string;
  adminEmail: string;
  portalUrl: string;
  marketingHeadline: string;
  marketingDescription: string;
  openGraphDescription: string;
  activeServiceSlugs: string[];
  featuredCoreServiceSlugs: string[];
  featuredBlueOceanServiceSlugs: string[];
  featuredIndustrySlugs: string[];
  recommendedBlueprints: string[];
  recommendedIntakeBias: string[];
  personaLabels: string[];
  subjectMatter: string[];
  trustProfile: WebsiteBusinessAnalysis["trustProfile"];
  visualStyle: WebsiteDesignAnalysis["visualStyle"];
  tone: string[];
  primaryColor?: string;
  accentColor?: string;
  launchChecklist: string[];
}

type KeywordProfile = {
  keywords: string[];
  personas: string[];
  subjectMatter: string[];
};

const SERVICE_KEYWORDS: Record<string, KeywordProfile> = {
  general: {
    keywords: ["automation", "operations", "workflow", "systems", "efficiency"],
    personas: ["operator", "owner"],
    subjectMatter: ["operations", "automation"],
  },
  "client-portal": {
    keywords: ["client portal", "customer portal", "onboarding portal", "member portal"],
    personas: ["agency owner", "consultant", "client success leader"],
    subjectMatter: ["client experience", "portal operations"],
  },
  "process-automation": {
    keywords: ["workflow automation", "process automation", "manual tasks", "automation"],
    personas: ["ops manager", "founder", "operations lead"],
    subjectMatter: ["workflow automation", "process design"],
  },
  "systems-integration": {
    keywords: ["integration", "api", "sync", "middleware", "data flow"],
    personas: ["cto", "ops lead", "revops"],
    subjectMatter: ["integration", "systems architecture"],
  },
  "training-platform": {
    keywords: ["lms", "learning", "course", "training platform", "certification"],
    personas: ["training manager", "program owner", "hr leader"],
    subjectMatter: ["training delivery", "course operations"],
  },
  "business-intelligence": {
    keywords: ["dashboard", "analytics", "bi", "reporting", "kpi"],
    personas: ["executive", "operations lead", "analyst"],
    subjectMatter: ["analytics", "reporting"],
  },
  "digital-transformation": {
    keywords: ["digital transformation", "modernization", "transformation", "change management"],
    personas: ["executive", "transformation lead", "founder"],
    subjectMatter: ["transformation", "modernization"],
  },
  "compliance-training": {
    keywords: ["compliance training", "hipaa", "osha", "aml", "certification"],
    personas: ["compliance officer", "hr leader", "training manager"],
    subjectMatter: ["compliance", "training"],
  },
  "managed-services": {
    keywords: ["managed services", "msp", "support desk", "sla", "ticketing"],
    personas: ["msp owner", "service manager", "it leader"],
    subjectMatter: ["service delivery", "support operations"],
  },
  "re-syndication": {
    keywords: ["investor", "syndication", "capital raise", "deal room", "real estate fund"],
    personas: ["fund manager", "syndicator", "capital partner"],
    subjectMatter: ["capital operations", "investor relations"],
  },
  "immigration-law": {
    keywords: ["immigration", "visa", "case management", "law firm", "legal intake"],
    personas: ["attorney", "law firm owner", "legal ops"],
    subjectMatter: ["legal intake", "case workflows"],
  },
  construction: {
    keywords: ["contractor", "construction", "project update", "change order", "field ops"],
    personas: ["contractor", "project manager", "operations manager"],
    subjectMatter: ["project communication", "field operations"],
  },
  franchise: {
    keywords: ["franchise", "franchisee", "multi-location", "brand compliance"],
    personas: ["franchisor", "ops director", "brand manager"],
    subjectMatter: ["franchise operations", "multi-location support"],
  },
  staffing: {
    keywords: ["staffing", "recruiting", "candidate", "placement", "timesheet"],
    personas: ["agency owner", "recruiter", "staffing manager"],
    subjectMatter: ["recruiting", "placements"],
  },
  "church-management": {
    keywords: ["church", "ministry", "congregation", "giving", "small group"],
    personas: ["pastor", "church administrator", "ministry leader"],
    subjectMatter: ["member engagement", "giving"],
  },
  "creator-management": {
    keywords: ["creator", "talent", "brand deal", "ugc", "media kit"],
    personas: ["talent manager", "creator agency owner", "partnerships lead"],
    subjectMatter: ["creator operations", "brand partnerships"],
  },
  "compliance-productized": {
    keywords: ["white label compliance", "reseller", "productized compliance", "employee training"],
    personas: ["consultancy owner", "broker", "reseller"],
    subjectMatter: ["productized training", "reseller operations"],
  },
};

const CTA_GOAL_MAP: Record<WebsiteBusinessAnalysis["primaryGoal"], string[]> = {
  "book-call": ["book a call", "book call", "schedule", "talk to sales", "book demo", "consultation"],
  "capture-lead": ["download", "get the guide", "get updates", "free assessment", "get report", "subscribe"],
  "register-webinar": ["register", "join webinar", "save my seat", "watch webinar"],
  "buy-now": ["buy now", "checkout", "order now", "start trial", "get started now"],
  "request-quote": ["request quote", "get quote", "request proposal", "contact sales"],
  "educate-first": ["learn more", "read more", "watch story", "see how it works"],
};

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMatches(html: string, regex: RegExp, group = 1) {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const value = stripHtml(match[group] ?? "");
    if (value) matches.push(value);
  }
  return matches;
}

function toDomain(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  }
}

function toTenantTag(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function scoreKeywords(text: string, keywords: string[]) {
  const haystack = text.toLowerCase();
  return keywords.reduce((score, keyword) => {
    const normalized = keyword.toLowerCase();
    return haystack.includes(normalized) ? score + 1 : score;
  }, 0);
}

function inferGoal(ctas: string[], bodyText: string): WebsiteBusinessAnalysis["primaryGoal"] {
  const ctaText = `${ctas.join(" ")} ${bodyText.slice(0, 1200)}`.toLowerCase();
  let bestGoal: WebsiteBusinessAnalysis["primaryGoal"] = "capture-lead";
  let bestScore = -1;

  for (const [goal, keywords] of Object.entries(CTA_GOAL_MAP) as Array<
    [WebsiteBusinessAnalysis["primaryGoal"], string[]]
  >) {
    const score = scoreKeywords(ctaText, keywords);
    if (score > bestScore) {
      bestGoal = goal;
      bestScore = score;
    }
  }

  return bestGoal;
}

function inferBusinessModel(
  serviceSlugs: string[],
  goal: WebsiteBusinessAnalysis["primaryGoal"],
  text: string,
): WebsiteBusinessAnalysis["businessModel"] {
  const lower = text.toLowerCase();
  if (goal === "buy-now" || /\bcart\b|\bcheckout\b|\bshipping\b|\bsku\b/.test(lower)) {
    return "ecommerce";
  }
  if (
    serviceSlugs.includes("training-platform") ||
    serviceSlugs.includes("compliance-training") ||
    goal === "register-webinar"
  ) {
    return "education";
  }
  if (serviceSlugs.length >= 2 && /\bservices\b|\bagency\b|\bconsulting\b|\bimplementation\b/.test(lower)) {
    return "service";
  }
  return "hybrid";
}

function inferTrustProfile(
  goal: WebsiteBusinessAnalysis["primaryGoal"],
  text: string,
): WebsiteBusinessAnalysis["trustProfile"] {
  const lower = text.toLowerCase();
  if (/\bcase study\b|\btestimonial\b|\bresults\b|\bproof\b/.test(lower)) return "proof-heavy";
  if (/\broi\b|\bsave\b|\brevenue\b|\bmargin\b|\bcost\b/.test(lower)) return "roi-heavy";
  if (/\bcompliance\b|\bsecurity\b|\bhipaa\b|\bgdpr\b|\baudit\b/.test(lower)) return "compliance-heavy";
  if (goal === "book-call" || /\bfast\b|\binstant\b|\bimmediately\b/.test(lower)) return "speed-heavy";
  return "mixed";
}

function inferTone(text: string) {
  const lower = text.toLowerCase();
  const tone: string[] = [];
  if (/\benterprise\b|\btrusted\b|\bcompliance\b|\bsecure\b/.test(lower)) tone.push("credible");
  if (/\bgrow\b|\bscale\b|\brevenue\b|\baccelerate\b/.test(lower)) tone.push("growth-oriented");
  if (/\bpremium\b|\bconcierge\b|\bwhite glove\b/.test(lower)) tone.push("premium");
  if (/\bsimple\b|\beasy\b|\bfast\b|\bquick\b/.test(lower)) tone.push("direct");
  if (/\blearn\b|\bguide\b|\bwebinar\b|\btraining\b/.test(lower)) tone.push("educational");
  return tone.length > 0 ? tone : ["direct"];
}

function inferVisualStyle(
  colorPalette: string[],
  text: string,
  html: string,
): WebsiteDesignAnalysis["visualStyle"] {
  const lower = `${text} ${html}`.toLowerCase();
  if (/\bcase study\b|\bresults\b|\bsave my seat\b|\bbook a call\b/.test(lower)) {
    return "conversion-heavy";
  }
  if (/\bluxury\b|\bpremium\b|\bconcierge\b/.test(lower)) return "premium";
  if (/\bjournal\b|\bstory\b|\beditorial\b/.test(lower)) return "editorial";
  if (/\bplatform\b|\bsoftware\b|\bapi\b|\bautomation\b/.test(lower)) return "modern-saas";
  if (colorPalette.length <= 1) return "utility";
  return "corporate";
}

function inferPresetId(
  forcePresetId: string | undefined,
  businessModel: WebsiteBusinessAnalysis["businessModel"],
  goal: WebsiteBusinessAnalysis["primaryGoal"],
  serviceSlugs: string[],
): string {
  if (forcePresetId && clientPresets[forcePresetId]) return forcePresetId;
  if (businessModel === "ecommerce") return "dtc-conversion";
  if (
    businessModel === "education" ||
    serviceSlugs.includes("training-platform") ||
    serviceSlugs.includes("compliance-training")
  ) {
    return "education-compliance";
  }
  if (goal === "book-call" || goal === "request-quote") return "professional-services";
  return defaultClientPresetId;
}

function inferBlueprints(
  goal: WebsiteBusinessAnalysis["primaryGoal"],
  trustProfile: WebsiteBusinessAnalysis["trustProfile"],
  presetId: string,
  architecture: WebsiteArchitectureAnalysis,
): WebsiteFunnelAnalysis {
  const recommended = new Set<string>();
  const intakeBias = new Set<string>();
  const reasoning: string[] = [];

  if (goal === "book-call" || goal === "request-quote") {
    recommended.add("high-ticket-call");
    recommended.add("appointment-gen");
    intakeBias.add("assessment");
    intakeBias.add("contact_form");
    reasoning.push("Primary CTA suggests a direct consult or application motion.");
  }
  if (goal === "capture-lead") {
    recommended.add("lead-gen");
    recommended.add("client-audit");
    intakeBias.add("assessment");
    intakeBias.add("chat");
    reasoning.push("Lead capture CTAs point to assessment and nurture-first acquisition.");
  }
  if (goal === "register-webinar") {
    recommended.add("webinar-live");
    recommended.add("webinar-evergreen");
    intakeBias.add("webinar");
    intakeBias.add("newsletter");
    reasoning.push("The site is education-led and optimized for webinar registration.");
  }
  if (goal === "buy-now") {
    recommended.add("product-sales");
    recommended.add("coupon-offer");
    recommended.add("abandonment-recovery");
    intakeBias.add("giveaway");
    intakeBias.add("exit_intent");
    reasoning.push("Direct purchase intent benefits from recovery and lower-friction offer branches.");
  }
  if (trustProfile === "proof-heavy") {
    recommended.add("documentary-vsl");
    reasoning.push("Proof-heavy copy indicates story and case-study driven persuasion.");
  }
  if (trustProfile === "roi-heavy") {
    recommended.add("value-ladder");
    intakeBias.add("roi_calculator");
    reasoning.push("ROI language supports calculator-led qualification and value ladder escalation.");
  }
  if (architecture.hasLeadMagnetPath) {
    recommended.add("giveaway-capture");
    reasoning.push("Lead-magnet signals suggest a giveaway or playbook-style entry path.");
  }
  if (architecture.hasAssessmentPath) {
    recommended.add("client-audit");
  }
  if (architecture.hasStoriesOrProof) {
    recommended.add("bridge");
  }
  if (presetId === "education-compliance") {
    recommended.add("mini-class");
    recommended.add("freemium-membership");
  }
  if (presetId === "dtc-conversion") {
    recommended.add("coupon-offer");
    recommended.add("abandonment-recovery");
  }
  if (recommended.size === 0) {
    recommended.add("master-orchestration");
    reasoning.push("No dominant funnel family was obvious, so the adaptive master orchestration path is safest.");
  }

  const recommendedBlueprints = Array.from(recommended).filter((id) => BLUEPRINT_IDS.has(id));
  const recommendedIntakeBias = Array.from(intakeBias);
  const recommendedHeroStrategy: WebsiteFunnelAnalysis["recommendedHeroStrategy"] =
    trustProfile === "proof-heavy" ? "proof" : trustProfile === "roi-heavy" ? "roi" : "speed";

  return {
    recommendedBlueprints,
    recommendedIntakeBias,
    recommendedHeroStrategy,
    reasoning,
  };
}

function architectureLabel(enabled: boolean, label: string) {
  return enabled ? label : "";
}

function inferBrandName(signals: ExtractedWebsiteSignals) {
  const titleBrand = signals.title.split("|")[0]?.split("-")[0]?.trim();
  if (titleBrand && titleBrand.length <= 40) return titleBrand;
  if (signals.domain) {
    const base = signals.domain.split(".")[0] ?? "Lead OS Client";
    return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return "Lead OS Client";
}

function inferPersonasFromText(text: string) {
  const personaMatchers: Array<[string, RegExp]> = [
    ["founder", /\bfounder\b|\bowner\b/],
    ["marketing lead", /\bmarketing\b|\bdemand gen\b/],
    ["sales leader", /\bsales\b|\brevenue team\b/],
    ["operations leader", /\boperations\b|\bops\b/],
    ["compliance leader", /\bcompliance\b|\bregulatory\b/],
    ["hr leader", /\bhr\b|\bpeople team\b/],
    ["it leader", /\bit\b|\bcio\b|\bcto\b/],
    ["agency owner", /\bagency\b|\bclient services\b/],
  ];
  return personaMatchers.filter(([, matcher]) => matcher.test(text)).map(([label]) => label);
}

function buildMarketingHeadline(analysis: WebsiteIntelligenceAnalysis) {
  const firstSubject = analysis.business.subjectMatter[0] ?? "Growth";
  const goalLabel =
    analysis.business.primaryGoal === "book-call"
      ? "Book More Qualified Calls"
      : analysis.business.primaryGoal === "register-webinar"
        ? "Convert Education Into Pipeline"
        : analysis.business.primaryGoal === "buy-now"
          ? "Turn More Traffic Into Buyers"
          : "Capture and Convert Better Leads";
  return `${capitalize(firstSubject)} Systems That ${goalLabel}`;
}

function buildMarketingDescription(analysis: WebsiteIntelligenceAnalysis) {
  const niches = analysis.business.serviceSlugs
    .slice(0, 3)
    .map((slug) => nicheManifests[slug]?.label ?? slug)
    .join(", ");
  return `${analysis.business.brandName} can run on Lead OS with adaptive funnels, intelligent intake, and traceable nurture for ${niches}.`;
}

function buildOpenGraphDescription(analysis: WebsiteIntelligenceAnalysis) {
  return `Preset: ${analysis.business.presetId}. Goal: ${analysis.business.primaryGoal}. Blueprints: ${analysis.funnel.recommendedBlueprints.join(", ")}.`;
}

function buildLaunchChecklist(analysis: WebsiteIntelligenceAnalysis) {
  const checklist = [
    "Review inferred preset and active service mix.",
    "Confirm the primary conversion goal and top CTA path.",
    "Validate persona assumptions against actual buyers.",
    "Replace guessed support/admin emails with real mailbox addresses.",
    "Connect CRM, AITable, alerting, and nurture channels.",
  ];
  if (analysis.architecture.hasWebinarPath) {
    checklist.push("Configure webinar registration and follow-up sequences.");
  }
  if (analysis.business.primaryGoal === "buy-now") {
    checklist.push("Wire checkout, cart recovery, and post-purchase onboarding.");
  }
  if (analysis.business.trustProfile === "proof-heavy") {
    checklist.push("Load documentary, case-study, and testimonial assets into proof surfaces.");
  }
  return checklist;
}

function capitalize(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function extractWebsiteSignals(input: WebsiteIntelligenceInput): ExtractedWebsiteSignals {
  const html = input.html ?? "";
  const title = extractMatches(html, /<title[^>]*>([\s\S]*?)<\/title>/gi)[0] ?? "";
  const metaDescription =
    extractMatches(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/gi,
    )[0] ??
    extractMatches(
      html,
      /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/gi,
    )[0] ??
    "";
  const headings = unique([
    ...extractMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi),
    ...extractMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi),
    ...extractMatches(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi),
  ]).slice(0, 18);
  const navigation = unique(
    extractMatches(html, /<nav[\s\S]*?<\/nav>/gi)
      .flatMap((nav) => extractMatches(nav, /<a[^>]*>([\s\S]*?)<\/a>/gi))
      .slice(0, 16),
  );
  const ctas = unique([
    ...extractMatches(html, /<button[^>]*>([\s\S]*?)<\/button>/gi),
    ...extractMatches(html, /<a[^>]*>([\s\S]*?)<\/a>/gi),
  ]).filter((value) => value.length <= 80).slice(0, 30);
  const bodyText = stripHtml(html);
  const colorPalette = unique((html.match(/#[0-9a-fA-F]{3,8}/g) ?? []).map((hex) => hex.toLowerCase())).slice(0, 8);
  const url = input.url ?? "";

  return {
    url,
    domain: toDomain(url),
    title,
    metaDescription,
    headings,
    navigation,
    ctas,
    bodyText,
    colorPalette,
  };
}

export function analyzeWebsite(input: WebsiteIntelligenceInput): WebsiteIntelligenceAnalysis {
  const signals = extractWebsiteSignals(input);
  const combinedText = [
    signals.title,
    signals.metaDescription,
    ...signals.headings,
    ...signals.navigation,
    ...signals.ctas,
    signals.bodyText,
    input.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const serviceScores = Object.entries(SERVICE_KEYWORDS).map(([slug, profile]) => ({
    slug,
    score: scoreKeywords(combinedText, profile.keywords),
  }));
  const serviceSlugs = serviceScores
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => normalizeNicheSlug(entry.slug));
  const normalizedServices = unique(serviceSlugs).filter((slug) => nicheManifests[slug]).slice(0, 8);
  const finalServices = normalizedServices.length > 0 ? normalizedServices : ["general"];
  const primaryGoal = inferGoal(signals.ctas, combinedText);
  const businessModel = inferBusinessModel(finalServices, primaryGoal, combinedText);
  const trustProfile = inferTrustProfile(primaryGoal, combinedText);
  const presetId = inferPresetId(input.forcePresetId, businessModel, primaryGoal, finalServices);

  const architecture: WebsiteArchitectureAnalysis = {
    hasPricing: /\bpricing\b|\bplans\b|\binvestment\b/.test(combinedText),
    hasContactPath: /\bcontact\b|\brequest quote\b|\bget in touch\b/.test(combinedText),
    hasBookingPath: /\bbook\b|\bschedule\b|\bcall\b|\bdemo\b/.test(combinedText),
    hasAssessmentPath: /\bassessment\b|\baudit\b|\bquiz\b|\bscore\b/.test(combinedText),
    hasWebinarPath: /\bwebinar\b|\bmasterclass\b|\btraining\b/.test(combinedText),
    hasLeadMagnetPath: /\bdownload\b|\bguide\b|\bplaybook\b|\bchecklist\b/.test(combinedText),
    hasStoriesOrProof: /\bcase study\b|\btestimonial\b|\bstory\b|\bresults\b/.test(combinedText),
    hasEcommerceSignals: /\bcart\b|\bcheckout\b|\bshipping\b|\bbuy now\b/.test(combinedText),
    navigationDepth: signals.navigation.length,
    sectionsDetected: unique([
      architectureLabel(/\bservices\b/.test(combinedText), "services"),
      architectureLabel(/\bpricing\b|\bplans\b/.test(combinedText), "pricing"),
      architectureLabel(/\babout\b/.test(combinedText), "about"),
      architectureLabel(/\bcase study\b|\btestimonial\b/.test(combinedText), "proof"),
      architectureLabel(/\bcontact\b/.test(combinedText), "contact"),
      architectureLabel(/\bblog\b|\bresources\b/.test(combinedText), "resources"),
      architectureLabel(/\bfaq\b/.test(combinedText), "faq"),
    ]).filter(Boolean) as string[],
  };

  const subjectMatter = unique(
    finalServices.flatMap((slug) => SERVICE_KEYWORDS[slug]?.subjectMatter ?? []),
  ).slice(0, 8);
  const personaLabels = unique(
    [
      ...finalServices.flatMap((slug) => SERVICE_KEYWORDS[slug]?.personas ?? []),
      ...inferPersonasFromText(combinedText),
    ],
  ).slice(0, 8);

  const design: WebsiteDesignAnalysis = {
    visualStyle: inferVisualStyle(signals.colorPalette, combinedText, input.html ?? ""),
    tone: inferTone(combinedText),
    darkModeLikely: /#0[0-9a-f]{2,}|bg-black|bg-navy|text-white/.test((input.html ?? "").toLowerCase()),
    primaryColor: signals.colorPalette[0],
    accentColor: signals.colorPalette[1],
  };

  const funnel = inferBlueprints(primaryGoal, trustProfile, presetId, architecture);
  const confidence =
    Math.min(
      100,
      30 +
        finalServices.length * 8 +
        personaLabels.length * 4 +
        funnel.recommendedBlueprints.length * 3 +
        (signals.title ? 8 : 0) +
        (signals.metaDescription ? 8 : 0),
    ) / 100;

  return {
    signals,
    architecture,
    business: {
      brandName: inferBrandName(signals),
      presetId,
      serviceSlugs: finalServices,
      nicheSlugs: finalServices,
      primaryGoal,
      businessModel,
      subjectMatter,
      personaLabels,
      trustProfile,
    },
    design,
    funnel,
    confidence,
  };
}

export function synthesizeLeadOsManifest(
  analysis: WebsiteIntelligenceAnalysis,
): GeneratedLeadOsManifest {
  const preset = clientPresets[analysis.business.presetId] ?? clientPresets[defaultClientPresetId];
  const coreServices = analysis.business.serviceSlugs.filter(
    (slug) => nicheManifests[slug]?.category !== "blue-ocean",
  );
  const blueOceanServices = analysis.business.serviceSlugs.filter(
    (slug) => nicheManifests[slug]?.category === "blue-ocean",
  );
  const draftId = toTenantTag(`${analysis.business.brandName}-${analysis.business.primaryGoal}`);
  const brandName = analysis.business.brandName;
  const siteUrl = analysis.signals.url || preset.siteUrl;
  const tenantTag = toTenantTag(brandName);

  return {
    draftId,
    generatedAt: new Date().toISOString(),
    sourceUrl: siteUrl,
    brandName,
    legalName: `${brandName} LLC`,
    presetId: analysis.business.presetId,
    tenantTag,
    siteUrl,
    supportEmail: `hello@${toDomain(siteUrl) || "example.com"}`,
    adminEmail: `ops@${toDomain(siteUrl) || "example.com"}`,
    portalUrl: `https://portal.${toDomain(siteUrl) || "example.com"}`,
    marketingHeadline: buildMarketingHeadline(analysis),
    marketingDescription: buildMarketingDescription(analysis),
    openGraphDescription: buildOpenGraphDescription(analysis),
    activeServiceSlugs: analysis.business.serviceSlugs,
    featuredCoreServiceSlugs: coreServices.slice(0, 4),
    featuredBlueOceanServiceSlugs: blueOceanServices.slice(0, 4),
    featuredIndustrySlugs: analysis.business.serviceSlugs.slice(0, 6),
    recommendedBlueprints: analysis.funnel.recommendedBlueprints,
    recommendedIntakeBias: analysis.funnel.recommendedIntakeBias,
    personaLabels: analysis.business.personaLabels,
    subjectMatter: analysis.business.subjectMatter,
    trustProfile: analysis.business.trustProfile,
    visualStyle: analysis.design.visualStyle,
    tone: analysis.design.tone,
    primaryColor: analysis.design.primaryColor ?? preset.brandPrimary,
    accentColor: analysis.design.accentColor ?? preset.brandAccent,
    launchChecklist: buildLaunchChecklist(analysis),
  };
}

export function manifestToEnvExample(manifest: GeneratedLeadOsManifest) {
  return [
    `NEXT_PUBLIC_TENANT_PRESET=${manifest.presetId}`,
    `NEXT_PUBLIC_BRAND_NAME=${manifest.brandName}`,
    `NEXT_PUBLIC_LEGAL_NAME=${manifest.legalName}`,
    `NEXT_PUBLIC_SITE_URL=${manifest.siteUrl}`,
    `NEXT_PUBLIC_SUPPORT_EMAIL=${manifest.supportEmail}`,
    `ADMIN_EMAIL=${manifest.adminEmail}`,
    `NEXT_PUBLIC_PORTAL_URL=${manifest.portalUrl}`,
    `TENANT_TAG=${manifest.tenantTag}`,
    `NEXT_PUBLIC_ENABLED_SERVICES=${manifest.activeServiceSlugs.join(",")}`,
    `NEXT_PUBLIC_FEATURED_CORE_SERVICES=${manifest.featuredCoreServiceSlugs.join(",")}`,
    `NEXT_PUBLIC_FEATURED_BLUE_OCEAN_SERVICES=${manifest.featuredBlueOceanServiceSlugs.join(",")}`,
    `NEXT_PUBLIC_FEATURED_INDUSTRIES=${manifest.featuredIndustrySlugs.join(",")}`,
    `NEXT_PUBLIC_MARKETING_HEADLINE=${manifest.marketingHeadline}`,
    `NEXT_PUBLIC_MARKETING_DESCRIPTION=${manifest.marketingDescription}`,
    `NEXT_PUBLIC_OPEN_GRAPH_DESCRIPTION=${manifest.openGraphDescription}`,
  ].join("\n");
}
