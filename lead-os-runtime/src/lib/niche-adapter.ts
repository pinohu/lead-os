import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudienceConfig {
  description: string;
  painPoints: string[];
  urgencyType: "emergency" | "scheduled" | "project" | "ongoing";
  avgDealValue: { min: number; max: number };
  decisionMakers: string[];
}

export interface ScoringConfig {
  intentWeight: number;
  fitWeight: number;
  engagementWeight: number;
  urgencyWeight: number;
  sourceWeights: Record<string, number>;
  urgencyKeywords: string[];
  fitSignals: string[];
}

export interface OfferConfig {
  primary: { name: string; priceRange: { min: number; max: number }; guarantee: string };
  upsells: Array<{ name: string; price: number }>;
  leadMagnet: string;
  pricingModel: "per-project" | "hourly" | "monthly" | "per-lead";
}

export interface PsychologyConfig {
  primaryFear: string;
  primaryDesire: string;
  trustFactors: string[];
  objectionPatterns: string[];
  urgencyTriggers: string[];
}

export interface ChannelConfig {
  primary: string[];
  secondary: string[];
  followUp: { sms: boolean; email: boolean; call: boolean; whatsapp: boolean };
  responseTimeTarget: number;
}

export interface FunnelConfig {
  preferredFamily: string;
  conversionPath: string[];
  nurtureDuration: number;
  touchFrequency: number;
}

export interface MonetizationConfig {
  model: "managed-service" | "white-label" | "pay-per-lead" | "saas";
  leadValue: { min: number; max: number };
  marginTarget: number;
}

export interface ContentConfig {
  headlines: Record<string, string>;
  ctas: string[];
  emailSubjects: string[];
  smsTemplates: string[];
}

export interface NicheConfig {
  slug: string;
  name: string;
  industry: string;
  audience: AudienceConfig;
  scoring: ScoringConfig;
  offers: OfferConfig;
  psychology: PsychologyConfig;
  channels: ChannelConfig;
  funnels: FunnelConfig;
  monetization: MonetizationConfig;
  content: ContentConfig;
}

export interface ScoringWeightOverrides {
  intentWeight: number;
  fitWeight: number;
  engagementWeight: number;
  urgencyWeight: number;
  sourceWeights: Record<string, number>;
  urgencyKeywords: string[];
  fitSignals: string[];
}

export interface OfferGenerationParams {
  primaryOffer: NicheConfig["offers"]["primary"];
  upsells: NicheConfig["offers"]["upsells"];
  leadMagnet: string;
  pricingModel: string;
  avgDealValue: { min: number; max: number };
}

export interface PsychologyEvaluationParams {
  primaryFear: string;
  primaryDesire: string;
  trustFactors: string[];
  objectionPatterns: string[];
  urgencyTriggers: string[];
  urgencyType: string;
}

export interface ChannelStrategyParams {
  primaryChannels: string[];
  secondaryChannels: string[];
  followUp: ChannelConfig["followUp"];
  responseTimeTarget: number;
  preferredFunnelFamily: string;
  conversionPath: string[];
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<U>
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

export interface NicheListFilters {
  industry?: string;
  limit?: number;
  cursor?: string;
}

// ---------------------------------------------------------------------------
// Deep merge
// ---------------------------------------------------------------------------

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = (target as Record<string, unknown>)[key];

    if (
      srcVal !== undefined &&
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === "object" &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      (result as Record<string, unknown>)[key] = srcVal;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const nicheConfigStore = new Map<string, NicheConfig>();

// ---------------------------------------------------------------------------
// Default config (for resolveNicheConfig gap-fill)
// ---------------------------------------------------------------------------

const DEFAULT_NICHE_CONFIG: Omit<NicheConfig, "slug" | "name" | "industry"> = {
  audience: {
    description: "General business audience",
    painPoints: ["Inconsistent lead flow", "Low conversion rates"],
    urgencyType: "ongoing",
    avgDealValue: { min: 500, max: 5000 },
    decisionMakers: ["business owner"],
  },
  scoring: {
    intentWeight: 0.35,
    fitWeight: 0.15,
    engagementWeight: 0.25,
    urgencyWeight: 0.25,
    sourceWeights: { "google-ads": 30, referral: 25, organic: 20, direct: 15 },
    urgencyKeywords: ["asap", "urgent", "immediately", "need now"],
    fitSignals: ["has-budget", "decision-maker", "right-industry"],
  },
  offers: {
    primary: { name: "Core Service Package", priceRange: { min: 500, max: 5000 }, guarantee: "30-day money-back guarantee" },
    upsells: [],
    leadMagnet: "Free Assessment",
    pricingModel: "per-project",
  },
  psychology: {
    primaryFear: "Wasting money on ineffective solutions",
    primaryDesire: "Predictable growth and revenue",
    trustFactors: ["verified-reviews", "case-studies"],
    objectionPatterns: ["Too expensive", "Not the right time"],
    urgencyTriggers: ["Limited availability", "Price increasing soon"],
  },
  channels: {
    primary: ["google-ads", "seo"],
    secondary: ["facebook", "email"],
    followUp: { sms: true, email: true, call: true, whatsapp: false },
    responseTimeTarget: 5,
  },
  funnels: {
    preferredFamily: "qualification",
    conversionPath: ["landing-page", "assessment", "booking"],
    nurtureDuration: 30,
    touchFrequency: 3,
  },
  monetization: {
    model: "managed-service",
    leadValue: { min: 50, max: 500 },
    marginTarget: 40,
  },
  content: {
    headlines: { cold: "Discover a better way", warm: "Ready to take the next step?", hot: "Claim your spot now", burning: "Final chance - act now" },
    ctas: ["Get Started", "Book a Call", "Learn More"],
    emailSubjects: ["Quick question about your business", "You are leaving money on the table"],
    smsTemplates: ["Hi {{name}}, just following up on your inquiry. Reply YES to schedule a call."],
  },
};

// ---------------------------------------------------------------------------
// Pre-built configs
// ---------------------------------------------------------------------------

const PEST_CONTROL: NicheConfig = {
  slug: "pest-control",
  name: "Pest Control Services",
  industry: "service",
  audience: {
    description: "Homeowners and property managers dealing with pest infestations",
    painPoints: [
      "Active infestation causing health and safety concerns",
      "Recurring pest problems despite DIY attempts",
      "Uncertainty about which treatment is safe for children and pets",
      "Difficulty finding licensed and insured providers quickly",
    ],
    urgencyType: "emergency",
    avgDealValue: { min: 150, max: 800 },
    decisionMakers: ["homeowner", "property manager", "landlord"],
  },
  scoring: {
    intentWeight: 0.4,
    fitWeight: 0.1,
    engagementWeight: 0.2,
    urgencyWeight: 0.3,
    sourceWeights: { "google-ads": 35, referral: 30, organic: 20, nextdoor: 25, yelp: 20 },
    urgencyKeywords: ["emergency", "infestation", "rats", "bedbugs", "termites", "immediately", "today", "asap"],
    fitSignals: ["homeowner", "property-manager", "local-area"],
  },
  offers: {
    primary: { name: "Complete Pest Inspection + Treatment", priceRange: { min: 199, max: 599 }, guarantee: "90-day re-treatment guarantee" },
    upsells: [
      { name: "Quarterly Prevention Plan", price: 99 },
      { name: "Attic & Crawlspace Seal-Out", price: 349 },
    ],
    leadMagnet: "Free Pest Risk Assessment for Your Home",
    pricingModel: "per-project",
  },
  psychology: {
    primaryFear: "Pests spreading disease or damaging the home",
    primaryDesire: "A pest-free home that is safe for the family",
    trustFactors: ["licensed", "insured", "eco-friendly-products", "5-star-reviews", "same-day-service"],
    objectionPatterns: ["Is it safe for my pets?", "How long until they are gone?", "Will they come back?", "Can I just do it myself?"],
    urgencyTriggers: ["Infestation getting worse daily", "Health risk to children", "Seasonal pest surge"],
  },
  channels: {
    primary: ["google-ads", "seo"],
    secondary: ["nextdoor", "yelp", "facebook"],
    followUp: { sms: true, email: true, call: true, whatsapp: false },
    responseTimeTarget: 15,
  },
  funnels: {
    preferredFamily: "qualification",
    conversionPath: ["landing-page", "pest-identifier-quiz", "booking"],
    nurtureDuration: 14,
    touchFrequency: 4,
  },
  monetization: {
    model: "pay-per-lead",
    leadValue: { min: 25, max: 75 },
    marginTarget: 45,
  },
  content: {
    headlines: {
      cold: "Is Your Home at Risk? Take Our Free Pest Assessment",
      warm: "We Found Your Pest Problem - Here Is How We Fix It",
      hot: "Same-Day Pest Treatment Available - Book Now",
      burning: "Emergency Service Ready - Technician On The Way",
    },
    ctas: ["Get Free Inspection", "Book Same-Day Service", "Take Pest Quiz"],
    emailSubjects: ["Your home pest risk report is ready", "Same-day pest removal - 90-day guarantee", "Seasonal pest alert for your area"],
    smsTemplates: [
      "Hi {{name}}, your pest inspection is confirmed for {{date}}. Reply HELP for questions.",
      "{{name}}, pests do not wait - neither should you. Book your free inspection: {{link}}",
    ],
  },
};

const IMMIGRATION_LAW: NicheConfig = {
  slug: "immigration-law",
  name: "Immigration Law Practice",
  industry: "legal",
  audience: {
    description: "Immigrants, visa applicants, employers sponsoring foreign workers, and families seeking reunification",
    painPoints: [
      "Confusion about which visa category to apply for",
      "Fear of deportation or status expiration",
      "Long processing times with no visibility",
      "Previous denial and unsure how to appeal",
    ],
    urgencyType: "scheduled",
    avgDealValue: { min: 2000, max: 15000 },
    decisionMakers: ["applicant", "family-sponsor", "HR Director", "CEO"],
  },
  scoring: {
    intentWeight: 0.35,
    fitWeight: 0.2,
    engagementWeight: 0.2,
    urgencyWeight: 0.25,
    sourceWeights: { "google-ads": 30, referral: 35, organic: 25, community: 20 },
    urgencyKeywords: ["deadline", "expiring", "denied", "deportation", "RFE", "appeal", "emergency"],
    fitSignals: ["visa-holder", "employer-sponsor", "family-petition", "has-case-number"],
  },
  offers: {
    primary: { name: "Immigration Case Evaluation", priceRange: { min: 250, max: 500 }, guarantee: "Full refund if we cannot take your case" },
    upsells: [
      { name: "Premium Processing Add-On", price: 2500 },
      { name: "Family Petition Bundle", price: 4500 },
    ],
    leadMagnet: "Free Visa Eligibility Assessment",
    pricingModel: "per-project",
  },
  psychology: {
    primaryFear: "Losing the chance to stay in the country or reunite with family",
    primaryDesire: "Legal status, stability, and a clear path forward",
    trustFactors: ["licensed-attorney", "bar-association", "success-rate", "multilingual", "client-testimonials"],
    objectionPatterns: ["Is this lawyer legit?", "Can I afford this?", "What if I get denied again?", "How long will it take?"],
    urgencyTriggers: ["Visa expiring within 60 days", "RFE response deadline", "Policy changes pending"],
  },
  channels: {
    primary: ["google-ads", "seo"],
    secondary: ["facebook", "community-groups", "referral"],
    followUp: { sms: true, email: true, call: true, whatsapp: true },
    responseTimeTarget: 30,
  },
  funnels: {
    preferredFamily: "authority",
    conversionPath: ["landing-page", "visa-eligibility-quiz", "case-review", "consultation"],
    nurtureDuration: 45,
    touchFrequency: 2,
  },
  monetization: {
    model: "managed-service",
    leadValue: { min: 100, max: 500 },
    marginTarget: 35,
  },
  content: {
    headlines: {
      cold: "Not Sure Which Visa Is Right for You? Take Our Free Assessment",
      warm: "Your Eligibility Results Are Ready - See Your Options",
      hot: "Schedule Your Case Review With an Immigration Attorney Today",
      burning: "Deadline Approaching - Get Legal Help Before It Is Too Late",
    },
    ctas: ["Check My Eligibility", "Talk to an Attorney", "Get Case Review"],
    emailSubjects: ["Your visa eligibility results", "Important immigration deadline approaching", "Free case review - limited slots this week"],
    smsTemplates: [
      "Hi {{name}}, your immigration case review is scheduled for {{date}}. Reply C to confirm.",
      "{{name}}, immigration deadlines do not wait. Book your free assessment: {{link}}",
    ],
  },
};

const ROOFING: NicheConfig = {
  slug: "roofing",
  name: "Roofing Contractor Services",
  industry: "construction",
  audience: {
    description: "Homeowners needing roof repair, replacement, or storm damage assessment",
    painPoints: [
      "Roof leak causing interior damage",
      "Storm damage with insurance claim uncertainty",
      "Aging roof needing replacement before it fails",
      "Unreliable contractors who disappear mid-job",
    ],
    urgencyType: "emergency",
    avgDealValue: { min: 3000, max: 25000 },
    decisionMakers: ["homeowner", "property manager"],
  },
  scoring: {
    intentWeight: 0.35,
    fitWeight: 0.15,
    engagementWeight: 0.15,
    urgencyWeight: 0.35,
    sourceWeights: { "google-ads": 35, referral: 30, organic: 20, "storm-chaser": 15, nextdoor: 20 },
    urgencyKeywords: ["leak", "storm damage", "emergency", "insurance claim", "missing shingles", "immediate", "water damage"],
    fitSignals: ["homeowner", "storm-area", "roof-age-15-plus", "insurance-claim"],
  },
  offers: {
    primary: { name: "Free Roof Inspection + Detailed Report", priceRange: { min: 5000, max: 20000 }, guarantee: "10-year workmanship warranty" },
    upsells: [
      { name: "Gutter Guard System", price: 1200 },
      { name: "Attic Ventilation Upgrade", price: 800 },
    ],
    leadMagnet: "Free Storm Damage Assessment Checklist",
    pricingModel: "per-project",
  },
  psychology: {
    primaryFear: "Roof failure causing catastrophic home damage",
    primaryDesire: "A solid, leak-free roof that protects the family and investment",
    trustFactors: ["licensed", "insured", "BBB-accredited", "manufacturer-certified", "local-references"],
    objectionPatterns: ["How much will it cost?", "Will insurance cover it?", "How long does it take?", "What about the warranty?"],
    urgencyTriggers: ["Active leak getting worse", "Storm season approaching", "Insurance claim deadline"],
  },
  channels: {
    primary: ["google-ads", "seo"],
    secondary: ["nextdoor", "facebook", "door-knocking"],
    followUp: { sms: true, email: true, call: true, whatsapp: false },
    responseTimeTarget: 10,
  },
  funnels: {
    preferredFamily: "qualification",
    conversionPath: ["landing-page", "roof-age-calculator", "inspection-booking"],
    nurtureDuration: 21,
    touchFrequency: 3,
  },
  monetization: {
    model: "pay-per-lead",
    leadValue: { min: 50, max: 200 },
    marginTarget: 50,
  },
  content: {
    headlines: {
      cold: "How Old Is Your Roof? Find Out If You Are Due for a Replacement",
      warm: "Your Roof Report Shows It Is Time to Act - Here Is What to Do",
      hot: "Book Your Free Roof Inspection Before the Next Storm",
      burning: "Emergency Roof Repair Available - Call Now",
    },
    ctas: ["Get Free Inspection", "Check My Roof", "Book Emergency Repair"],
    emailSubjects: ["Your roof inspection report", "Storm season is here - is your roof ready?", "Free inspection slots open this week"],
    smsTemplates: [
      "Hi {{name}}, your roof inspection is set for {{date}}. Our tech will call 30 min before arrival.",
      "{{name}}, storm damage claims have a deadline. Get your free inspection: {{link}}",
    ],
  },
};

const REAL_ESTATE_SYNDICATION: NicheConfig = {
  slug: "real-estate-syndication",
  name: "Real Estate Syndication",
  industry: "real-estate",
  audience: {
    description: "Accredited investors and high-net-worth individuals looking for passive real estate income",
    painPoints: [
      "Low returns on traditional investments",
      "Want real estate exposure without landlord headaches",
      "Difficulty finding vetted syndication deals",
      "Uncertainty about sponsor track record and deal structure",
    ],
    urgencyType: "project",
    avgDealValue: { min: 50000, max: 500000 },
    decisionMakers: ["accredited investor", "financial advisor", "family office"],
  },
  scoring: {
    intentWeight: 0.3,
    fitWeight: 0.3,
    engagementWeight: 0.2,
    urgencyWeight: 0.2,
    sourceWeights: { referral: 40, webinar: 30, "linkedin-ads": 25, organic: 20, podcast: 25 },
    urgencyKeywords: ["funding deadline", "closing soon", "limited slots", "accredited", "1031 exchange", "tax deadline"],
    fitSignals: ["accredited-investor", "high-net-worth", "real-estate-experience", "investment-size-50k-plus"],
  },
  offers: {
    primary: { name: "Investor Deal Room Access", priceRange: { min: 50000, max: 250000 }, guarantee: "Preferred return structure with asset-backed security" },
    upsells: [
      { name: "Co-GP Position", price: 100000 },
      { name: "Annual Investor Retreat Access", price: 2500 },
    ],
    leadMagnet: "Free Passive Income Through Real Estate Syndication Guide",
    pricingModel: "per-project",
  },
  psychology: {
    primaryFear: "Losing capital in a poorly managed deal",
    primaryDesire: "Consistent passive income and wealth building through real estate",
    trustFactors: ["SEC-compliant", "audited-financials", "track-record", "investor-testimonials", "institutional-partners"],
    objectionPatterns: ["What are the risks?", "How liquid is my investment?", "What is your track record?", "How are returns distributed?"],
    urgencyTriggers: ["Deal closing in 30 days", "Limited LP slots remaining", "1031 exchange deadline"],
  },
  channels: {
    primary: ["linkedin-ads", "webinar"],
    secondary: ["podcast", "referral", "seo"],
    followUp: { sms: false, email: true, call: true, whatsapp: false },
    responseTimeTarget: 60,
  },
  funnels: {
    preferredFamily: "authority",
    conversionPath: ["landing-page", "webinar-registration", "investor-kit-download", "one-on-one-call"],
    nurtureDuration: 90,
    touchFrequency: 2,
  },
  monetization: {
    model: "managed-service",
    leadValue: { min: 500, max: 5000 },
    marginTarget: 25,
  },
  content: {
    headlines: {
      cold: "How Accredited Investors Are Earning 8-12% Returns in Real Estate",
      warm: "Your Investor Profile Is Ready - See Matching Deals",
      hot: "Current Deal Closing Soon - Review the Offering Memorandum",
      burning: "Only 3 LP Slots Remaining - Schedule Your Call Today",
    },
    ctas: ["Get Investor Kit", "Join the Webinar", "Review Current Deal"],
    emailSubjects: ["New syndication deal - 8.5% preferred return", "Your investor profile matches this opportunity", "Webinar replay: passive income through real estate"],
    smsTemplates: [],
  },
};

const STAFFING_AGENCY: NicheConfig = {
  slug: "staffing-agency",
  name: "Staffing & Recruitment Agency",
  industry: "staffing",
  audience: {
    description: "Businesses needing temporary, contract, or permanent staff across various roles",
    painPoints: [
      "Open positions going unfilled for weeks",
      "High turnover costing thousands per replacement",
      "HR team overwhelmed with screening and interviews",
      "Seasonal demand spikes with no reliable workforce pipeline",
    ],
    urgencyType: "ongoing",
    avgDealValue: { min: 5000, max: 50000 },
    decisionMakers: ["HR Director", "CEO", "Operations Manager", "Hiring Manager"],
  },
  scoring: {
    intentWeight: 0.3,
    fitWeight: 0.25,
    engagementWeight: 0.2,
    urgencyWeight: 0.25,
    sourceWeights: { referral: 35, "linkedin-ads": 30, "google-ads": 25, organic: 20, "trade-shows": 15 },
    urgencyKeywords: ["urgent hire", "immediate need", "backfill", "temp to perm", "contract", "scaling", "seasonal"],
    fitSignals: ["multiple-openings", "enterprise-size", "recurring-need", "approved-budget"],
  },
  offers: {
    primary: { name: "Workforce Solution Consultation", priceRange: { min: 5000, max: 25000 }, guarantee: "90-day placement guarantee" },
    upsells: [
      { name: "Dedicated Recruiting Team", price: 15000 },
      { name: "Employer Brand Audit", price: 3500 },
    ],
    leadMagnet: "Free Cost-Per-Hire Calculator & Industry Salary Guide",
    pricingModel: "monthly",
  },
  psychology: {
    primaryFear: "Critical roles going unfilled and losing productivity or clients",
    primaryDesire: "A reliable pipeline of vetted, qualified candidates on demand",
    trustFactors: ["industry-certifications", "client-case-studies", "fill-rate-metrics", "candidate-guarantee", "compliance-certifications"],
    objectionPatterns: ["We tried agencies before and they did not deliver", "Our budget is tight", "We prefer to hire in-house", "How fast can you fill roles?"],
    urgencyTriggers: ["Major contract starting next month", "Key employee just resigned", "Seasonal rush approaching"],
  },
  channels: {
    primary: ["linkedin-ads", "google-ads"],
    secondary: ["trade-shows", "referral", "email"],
    followUp: { sms: false, email: true, call: true, whatsapp: false },
    responseTimeTarget: 30,
  },
  funnels: {
    preferredFamily: "authority",
    conversionPath: ["landing-page", "workforce-assessment", "proposal-call"],
    nurtureDuration: 60,
    touchFrequency: 2,
  },
  monetization: {
    model: "managed-service",
    leadValue: { min: 200, max: 2000 },
    marginTarget: 30,
  },
  content: {
    headlines: {
      cold: "What Is Your True Cost of an Unfilled Position? Calculate It Free",
      warm: "Your Workforce Assessment Shows Opportunities - Let Us Talk",
      hot: "Get Pre-Screened Candidates in Your Pipeline This Week",
      burning: "We Have Candidates Ready for Your Open Roles - Schedule a Call",
    },
    ctas: ["Calculate Cost-Per-Hire", "Get Workforce Assessment", "See Candidates"],
    emailSubjects: ["Your cost-per-hire report is ready", "Pre-screened candidates for your industry", "Workforce planning for next quarter"],
    smsTemplates: [],
  },
};

const BUILT_IN_CONFIGS: NicheConfig[] = [
  PEST_CONTROL,
  IMMIGRATION_LAW,
  ROOFING,
  REAL_ESTATE_SYNDICATION,
  STAFFING_AGENCY,
];

// ---------------------------------------------------------------------------
// Postgres persistence helpers
// ---------------------------------------------------------------------------

const TABLE_NAME = "niche_configs";

async function ensureTable(): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      slug       TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return true;
}

let tableReady: Promise<boolean> | null = null;

function getTableReady(): Promise<boolean> {
  if (!tableReady) {
    tableReady = ensureTable().catch(() => false);
  }
  return tableReady;
}

async function persistToPostgres(config: NicheConfig): Promise<void> {
  const ready = await getTableReady();
  if (!ready) return;
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO ${TABLE_NAME} (slug, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (slug) DO UPDATE SET data = $2, updated_at = NOW()`,
    [config.slug, JSON.stringify(config)],
  );
}

async function loadFromPostgres(slug: string): Promise<NicheConfig | null> {
  const ready = await getTableReady();
  if (!ready) return null;
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<{ data: NicheConfig }>(
    `SELECT data FROM ${TABLE_NAME} WHERE slug = $1`,
    [slug],
  );
  return result.rows.length > 0 ? result.rows[0].data : null;
}

async function deleteFromPostgresDb(slug: string): Promise<void> {
  const ready = await getTableReady();
  if (!ready) return;
  const pool = getPool();
  if (!pool) return;
  await pool.query(`DELETE FROM ${TABLE_NAME} WHERE slug = $1`, [slug]);
}

// ---------------------------------------------------------------------------
// Initialize built-in configs
// ---------------------------------------------------------------------------

function ensureBuiltIns(): void {
  for (const config of BUILT_IN_CONFIGS) {
    if (!nicheConfigStore.has(config.slug)) {
      nicheConfigStore.set(config.slug, config);
    }
  }
}

ensureBuiltIns();

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateSlug(slug: string): string | null {
  if (!slug || typeof slug !== "string") return "slug is required";
  if (slug.length < 2 || slug.length > 100) return "slug must be 2-100 characters";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 1) return "slug must be lowercase alphanumeric with hyphens";
  return null;
}

function validateNicheConfig(config: NicheConfig): string[] {
  const errors: string[] = [];

  const slugError = validateSlug(config.slug);
  if (slugError) errors.push(slugError);

  if (!config.name || config.name.length < 2) errors.push("name must be at least 2 characters");
  if (!config.industry) errors.push("industry is required");

  if (!config.audience?.painPoints?.length) errors.push("audience.painPoints must have at least one entry");
  if (!config.audience?.decisionMakers?.length) errors.push("audience.decisionMakers must have at least one entry");

  if (typeof config.scoring?.intentWeight !== "number") errors.push("scoring.intentWeight is required");
  if (typeof config.scoring?.fitWeight !== "number") errors.push("scoring.fitWeight is required");

  if (!config.offers?.primary?.name) errors.push("offers.primary.name is required");

  if (!config.psychology?.primaryFear) errors.push("psychology.primaryFear is required");
  if (!config.psychology?.primaryDesire) errors.push("psychology.primaryDesire is required");

  if (!config.channels?.primary?.length) errors.push("channels.primary must have at least one entry");

  return errors;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function loadNicheConfig(slug: string): NicheConfig | null {
  ensureBuiltIns();
  return nicheConfigStore.get(slug) ?? null;
}

export async function loadNicheConfigAsync(slug: string): Promise<NicheConfig | null> {
  ensureBuiltIns();
  const cached = nicheConfigStore.get(slug);
  if (cached) return cached;

  const persisted = await loadFromPostgres(slug);
  if (persisted) {
    nicheConfigStore.set(slug, persisted);
    return persisted;
  }
  return null;
}

export function createNicheConfig(config: NicheConfig): { config: NicheConfig | null; errors: string[] } {
  const errors = validateNicheConfig(config);
  if (errors.length > 0) return { config: null, errors };

  if (nicheConfigStore.has(config.slug)) {
    return { config: null, errors: [`Niche config with slug "${config.slug}" already exists`] };
  }

  nicheConfigStore.set(config.slug, config);
  persistToPostgres(config).catch(() => {});
  return { config, errors: [] };
}

export function updateNicheConfig(
  slug: string,
  partial: DeepPartial<Omit<NicheConfig, "slug">>,
): NicheConfig | null {
  const existing = nicheConfigStore.get(slug);
  if (!existing) return null;

  const merged = deepMerge(
    existing as unknown as Record<string, unknown>,
    partial as Record<string, unknown>,
  ) as unknown as NicheConfig;
  merged.slug = slug;

  nicheConfigStore.set(slug, merged);
  persistToPostgres(merged).catch(() => {});
  return merged;
}

export function listNicheConfigs(filters: NicheListFilters = {}): NicheConfig[] {
  ensureBuiltIns();
  const limit = Math.min(filters.limit ?? 20, 100);
  const results: NicheConfig[] = [];

  const sorted = [...nicheConfigStore.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [slug, config] of sorted) {
    if (filters.cursor && slug <= filters.cursor) continue;
    if (filters.industry && config.industry !== filters.industry) continue;
    results.push(config);
    if (results.length >= limit) break;
  }

  return results;
}

export function deleteNicheConfig(slug: string): boolean {
  const existed = nicheConfigStore.delete(slug);
  if (existed) {
    deleteFromPostgresDb(slug).catch(() => {});
  }
  return existed;
}

export function resolveNicheConfig(slug: string): NicheConfig | null {
  ensureBuiltIns();
  const config = nicheConfigStore.get(slug);
  if (!config) return null;

  const defaults = { ...DEFAULT_NICHE_CONFIG, slug: config.slug, name: config.name, industry: config.industry };
  return deepMerge(defaults as unknown as Record<string, unknown>, config as unknown as Record<string, unknown>) as unknown as NicheConfig;
}

export function applyNicheToScoring(nicheConfig: NicheConfig): ScoringWeightOverrides {
  return {
    intentWeight: nicheConfig.scoring.intentWeight,
    fitWeight: nicheConfig.scoring.fitWeight,
    engagementWeight: nicheConfig.scoring.engagementWeight,
    urgencyWeight: nicheConfig.scoring.urgencyWeight,
    sourceWeights: { ...nicheConfig.scoring.sourceWeights },
    urgencyKeywords: [...nicheConfig.scoring.urgencyKeywords],
    fitSignals: [...nicheConfig.scoring.fitSignals],
  };
}

export function applyNicheToOffers(nicheConfig: NicheConfig): OfferGenerationParams {
  return {
    primaryOffer: { ...nicheConfig.offers.primary },
    upsells: nicheConfig.offers.upsells.map((u) => ({ ...u })),
    leadMagnet: nicheConfig.offers.leadMagnet,
    pricingModel: nicheConfig.offers.pricingModel,
    avgDealValue: { ...nicheConfig.audience.avgDealValue },
  };
}

export function applyNicheToPsychology(nicheConfig: NicheConfig): PsychologyEvaluationParams {
  return {
    primaryFear: nicheConfig.psychology.primaryFear,
    primaryDesire: nicheConfig.psychology.primaryDesire,
    trustFactors: [...nicheConfig.psychology.trustFactors],
    objectionPatterns: [...nicheConfig.psychology.objectionPatterns],
    urgencyTriggers: [...nicheConfig.psychology.urgencyTriggers],
    urgencyType: nicheConfig.audience.urgencyType,
  };
}

export function applyNicheToChannels(nicheConfig: NicheConfig): ChannelStrategyParams {
  return {
    primaryChannels: [...nicheConfig.channels.primary],
    secondaryChannels: [...nicheConfig.channels.secondary],
    followUp: { ...nicheConfig.channels.followUp },
    responseTimeTarget: nicheConfig.channels.responseTimeTarget,
    preferredFunnelFamily: nicheConfig.funnels.preferredFamily,
    conversionPath: [...nicheConfig.funnels.conversionPath],
  };
}

export interface DesignSpecInput {
  niche: {
    name: string;
    industry?: string;
    icp: {
      painPoints: string[];
      urgencyTriggers?: string[];
      demographics?: string;
      decisionMakers?: string[];
      budget?: string;
    };
  };
  offers?: {
    core: { name: string; price: number; description: string };
    upsells?: Array<{ name: string; price: number }>;
    leadMagnets?: Array<{ name: string }>;
    pricing?: { model: string };
  };
  psychology?: {
    urgencyTriggers?: Array<{ type: string; message: string }>;
    trustBuilders?: Array<{ type: string; content: string }>;
    objectionHandlers?: Array<{ objection: string; response: string }>;
  };
  ingress?: {
    channels?: Array<{ type: string; intentLevel?: string }>;
  };
  funnels?: Array<{
    type: string;
    steps?: Array<{ type: string }>;
    conversionGoal?: string;
  }>;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function generateNicheConfigFromDesignSpec(designSpec: DesignSpecInput): NicheConfig {
  const slug = slugify(designSpec.niche.name);
  const industry = designSpec.niche.industry ?? "general";

  const painPoints = designSpec.niche.icp.painPoints;
  const urgencyKeywords = designSpec.niche.icp.urgencyTriggers ?? [];
  const decisionMakers = designSpec.niche.icp.decisionMakers ?? ["business owner"];

  const channels = (designSpec.ingress?.channels ?? []).map((c) => c.type);
  const primaryChannels = channels.length > 0 ? channels.slice(0, 2) : ["google-ads", "seo"];
  const secondaryChannels = channels.length > 2 ? channels.slice(2) : ["facebook"];

  const coreOffer = designSpec.offers?.core;
  const primaryOffer = coreOffer
    ? { name: coreOffer.name, priceRange: { min: coreOffer.price * 0.8, max: coreOffer.price * 1.2 }, guarantee: "Satisfaction guarantee" }
    : DEFAULT_NICHE_CONFIG.offers.primary;

  const upsells = designSpec.offers?.upsells ?? [];
  const leadMagnet = designSpec.offers?.leadMagnets?.[0]?.name ?? "Free Assessment";
  const pricingModel = (designSpec.offers?.pricing?.model ?? "per-project") as NicheConfig["offers"]["pricingModel"];

  const trustFactors = (designSpec.psychology?.trustBuilders ?? []).map((t) => t.type);
  const objectionPatterns = (designSpec.psychology?.objectionHandlers ?? []).map((o) => o.objection);
  const psychUrgencyTriggers = (designSpec.psychology?.urgencyTriggers ?? []).map((t) => t.message);

  const funnelSteps = designSpec.funnels?.[0]?.steps?.map((s) => s.type) ?? ["landing-page", "assessment", "booking"];
  const preferredFamily = designSpec.funnels?.[0]?.type ?? "qualification";

  const config: NicheConfig = {
    slug,
    name: designSpec.niche.name,
    industry,
    audience: {
      description: designSpec.niche.icp.demographics ?? `${designSpec.niche.name} target audience`,
      painPoints,
      urgencyType: urgencyKeywords.some((k) => k.toLowerCase().includes("emergency")) ? "emergency" : "scheduled",
      avgDealValue: coreOffer ? { min: coreOffer.price * 0.5, max: coreOffer.price * 2 } : { min: 500, max: 5000 },
      decisionMakers,
    },
    scoring: {
      intentWeight: 0.35,
      fitWeight: 0.15,
      engagementWeight: 0.25,
      urgencyWeight: 0.25,
      sourceWeights: { "google-ads": 30, referral: 25, organic: 20, direct: 15 },
      urgencyKeywords,
      fitSignals: decisionMakers.map((d) => d.toLowerCase().replace(/\s+/g, "-")),
    },
    offers: {
      primary: primaryOffer,
      upsells,
      leadMagnet,
      pricingModel,
    },
    psychology: {
      primaryFear: painPoints[0] ?? "Wasting money on ineffective solutions",
      primaryDesire: `Solving ${painPoints[0]?.toLowerCase() ?? "their core problem"}`,
      trustFactors: trustFactors.length > 0 ? trustFactors : ["verified-reviews"],
      objectionPatterns: objectionPatterns.length > 0 ? objectionPatterns : ["Is it worth it?"],
      urgencyTriggers: psychUrgencyTriggers.length > 0 ? psychUrgencyTriggers : urgencyKeywords,
    },
    channels: {
      primary: primaryChannels,
      secondary: secondaryChannels,
      followUp: { sms: true, email: true, call: true, whatsapp: false },
      responseTimeTarget: 15,
    },
    funnels: {
      preferredFamily,
      conversionPath: funnelSteps,
      nurtureDuration: 30,
      touchFrequency: 3,
    },
    monetization: {
      model: "managed-service",
      leadValue: coreOffer ? { min: coreOffer.price * 0.05, max: coreOffer.price * 0.15 } : { min: 50, max: 500 },
      marginTarget: 35,
    },
    content: {
      headlines: {
        cold: `Discover How ${designSpec.niche.name} Can Transform Your Results`,
        warm: `Your ${designSpec.niche.name} Assessment Is Ready`,
        hot: `Book Your ${designSpec.niche.name} Consultation Today`,
        burning: `Limited Spots - Get ${designSpec.niche.name} Help Now`,
      },
      ctas: ["Get Started", "Book a Call", "Learn More"],
      emailSubjects: [`Your ${designSpec.niche.name.toLowerCase()} assessment results`, `Quick question about your needs`],
      smsTemplates: [`Hi {{name}}, following up on your {{niche}} inquiry. Reply YES to schedule.`],
    },
  };

  return config;
}

export function exportNicheConfigAsDesignMd(nicheConfig: NicheConfig): string {
  const lines: string[] = [];

  lines.push(`# DESIGN.md - ${nicheConfig.name}`);
  lines.push("");
  lines.push("## Niche");
  lines.push(`- **Name**: ${nicheConfig.name}`);
  lines.push(`- **Industry**: ${nicheConfig.industry}`);
  lines.push(`- **Slug**: ${nicheConfig.slug}`);
  lines.push("");

  lines.push("## Audience");
  lines.push(`- **Description**: ${nicheConfig.audience.description}`);
  lines.push(`- **Urgency Type**: ${nicheConfig.audience.urgencyType}`);
  lines.push(`- **Avg Deal Value**: $${nicheConfig.audience.avgDealValue.min} - $${nicheConfig.audience.avgDealValue.max}`);
  lines.push(`- **Decision Makers**: ${nicheConfig.audience.decisionMakers.join(", ")}`);
  lines.push("### Pain Points");
  for (const p of nicheConfig.audience.painPoints) {
    lines.push(`- ${p}`);
  }
  lines.push("");

  lines.push("## Scoring");
  lines.push(`- Intent Weight: ${nicheConfig.scoring.intentWeight}`);
  lines.push(`- Fit Weight: ${nicheConfig.scoring.fitWeight}`);
  lines.push(`- Engagement Weight: ${nicheConfig.scoring.engagementWeight}`);
  lines.push(`- Urgency Weight: ${nicheConfig.scoring.urgencyWeight}`);
  lines.push("### Source Weights");
  for (const [source, weight] of Object.entries(nicheConfig.scoring.sourceWeights)) {
    lines.push(`- ${source}: ${weight}`);
  }
  lines.push("### Urgency Keywords");
  lines.push(nicheConfig.scoring.urgencyKeywords.join(", "));
  lines.push("");

  lines.push("## Offers");
  lines.push(`- **Primary**: ${nicheConfig.offers.primary.name} ($${nicheConfig.offers.primary.priceRange.min} - $${nicheConfig.offers.primary.priceRange.max})`);
  lines.push(`- **Guarantee**: ${nicheConfig.offers.primary.guarantee}`);
  lines.push(`- **Lead Magnet**: ${nicheConfig.offers.leadMagnet}`);
  lines.push(`- **Pricing Model**: ${nicheConfig.offers.pricingModel}`);
  if (nicheConfig.offers.upsells.length > 0) {
    lines.push("### Upsells");
    for (const u of nicheConfig.offers.upsells) {
      lines.push(`- ${u.name}: $${u.price}`);
    }
  }
  lines.push("");

  lines.push("## Psychology");
  lines.push(`- **Primary Fear**: ${nicheConfig.psychology.primaryFear}`);
  lines.push(`- **Primary Desire**: ${nicheConfig.psychology.primaryDesire}`);
  lines.push(`- **Trust Factors**: ${nicheConfig.psychology.trustFactors.join(", ")}`);
  lines.push("### Objection Patterns");
  for (const o of nicheConfig.psychology.objectionPatterns) {
    lines.push(`- ${o}`);
  }
  lines.push("### Urgency Triggers");
  for (const t of nicheConfig.psychology.urgencyTriggers) {
    lines.push(`- ${t}`);
  }
  lines.push("");

  lines.push("## Channels");
  lines.push(`- **Primary**: ${nicheConfig.channels.primary.join(", ")}`);
  lines.push(`- **Secondary**: ${nicheConfig.channels.secondary.join(", ")}`);
  lines.push(`- **Response Time Target**: ${nicheConfig.channels.responseTimeTarget} minutes`);
  const followUp = nicheConfig.channels.followUp;
  const enabledFollowUp = Object.entries(followUp).filter(([, v]) => v).map(([k]) => k);
  lines.push(`- **Follow-Up**: ${enabledFollowUp.join(", ")}`);
  lines.push("");

  lines.push("## Funnels");
  lines.push(`- **Preferred Family**: ${nicheConfig.funnels.preferredFamily}`);
  lines.push(`- **Conversion Path**: ${nicheConfig.funnels.conversionPath.join(" -> ")}`);
  lines.push(`- **Nurture Duration**: ${nicheConfig.funnels.nurtureDuration} days`);
  lines.push(`- **Touch Frequency**: ${nicheConfig.funnels.touchFrequency}/week`);
  lines.push("");

  lines.push("## Monetization");
  lines.push(`- **Model**: ${nicheConfig.monetization.model}`);
  lines.push(`- **Lead Value**: $${nicheConfig.monetization.leadValue.min} - $${nicheConfig.monetization.leadValue.max}`);
  lines.push(`- **Margin Target**: ${nicheConfig.monetization.marginTarget}%`);
  lines.push("");

  lines.push("## Content");
  lines.push("### Headlines");
  for (const [temp, headline] of Object.entries(nicheConfig.content.headlines)) {
    lines.push(`- **${temp}**: ${headline}`);
  }
  lines.push("### CTAs");
  for (const cta of nicheConfig.content.ctas) {
    lines.push(`- ${cta}`);
  }
  lines.push("");

  return lines.join("\n");
}

export function resetNicheConfigStore(): void {
  nicheConfigStore.clear();
  ensureBuiltIns();
}

export function getBuiltInSlugs(): string[] {
  return BUILT_IN_CONFIGS.map((c) => c.slug);
}
