import {
  type IndustryCategory,
  type AssessmentStem,
  INDUSTRY_TEMPLATES,
} from "./niche-templates.ts";
import { loadCatalog, type LeadMagnet } from "./lead-magnet-engine.ts";

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: "single-choice" | "multi-choice" | "scale";
  options: { label: string; value: string; scoreImpact: number }[];
  weight: number;
}

export interface ScoringWeightOverrides {
  intentWeight: number;
  fitWeight: number;
  engagementWeight: number;
  urgencyWeight: number;
}

export interface NurtureStageContent {
  stageId: string;
  dayOffset: number;
  subject: string;
  previewText: string;
  bodyTemplate: string;
}

export interface PersonalizationContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  socialProof: string;
  trustBadge: string;
}

export interface GeneratedNicheConfig {
  slug: string;
  name: string;
  industry: IndustryCategory;
  definition: {
    label: string;
    shortDescription: string;
    category: string;
    market?: string;
  };
  painPoints: string[];
  urgencySignals: string[];
  offers: string[];
  keywords: string[];
  assessmentQuestions: AssessmentQuestion[];
  scoringWeights: ScoringWeightOverrides;
  personalizationContent: Record<"cold" | "warm" | "hot" | "burning", PersonalizationContent>;
  recommendedMagnets: string[];
  recommendedFunnels: string[];
  nurtureSequence: NurtureStageContent[];
  n8nWorkflowSlugs: string[];
  createdAt: string;
}

const NURTURE_DAY_OFFSETS = [0, 2, 5, 10, 14, 21, 30];

const NURTURE_STAGE_LABELS = [
  "Immediate Value Delivery",
  "Quick Win",
  "Proof and Positioning",
  "Authority Follow-Up",
  "Consultation Offer",
  "Reactivation",
  "Long-Term Nurture",
];

const INDUSTRY_KEYWORD_MAP: Record<string, IndustryCategory> = {
  law: "legal",
  legal: "legal",
  attorney: "legal",
  lawyer: "legal",
  litigation: "legal",
  paralegal: "legal",
  barrister: "legal",
  solicitor: "legal",

  plumb: "construction",
  electric: "construction",
  hvac: "construction",
  construct: "construction",
  roof: "construction",
  contract: "construction",
  builder: "construction",
  remodel: "construction",
  renovation: "construction",
  excavat: "construction",
  paving: "construction",
  concrete: "construction",
  framing: "construction",
  drywall: "construction",

  doctor: "health",
  clinic: "health",
  dental: "health",
  medical: "health",
  health: "health",
  wellness: "health",
  chiropractic: "health",
  therapy: "health",
  therapist: "health",
  optometr: "health",
  dermatolog: "health",
  pediatr: "health",
  physiotherapy: "health",
  veterinar: "health",
  pharma: "health",
  mental: "health",

  software: "tech",
  saas: "tech",
  app: "tech",
  platform: "tech",
  startup: "tech",
  fintech: "tech",
  devops: "tech",
  cybersecurity: "tech",
  "ai ": "tech",
  "machine learning": "tech",

  "real estate": "real-estate",
  realtor: "real-estate",
  realty: "real-estate",
  broker: "real-estate",
  property: "real-estate",
  mortgage: "real-estate",
  "home buying": "real-estate",
  "home selling": "real-estate",

  school: "education",
  university: "education",
  college: "education",
  academy: "education",
  tutoring: "education",
  training: "education",
  "online course": "education",
  "e-learning": "education",
  coaching: "education",
  certification: "education",

  accounting: "finance",
  financial: "finance",
  "wealth management": "finance",
  insurance: "finance",
  bookkeep: "finance",
  tax: "finance",
  "financial planning": "finance",
  advisor: "finance",
  cpa: "finance",
  credit: "finance",

  franchise: "franchise",
  "multi-location": "franchise",
  "multi-unit": "franchise",
  chain: "franchise",

  staffing: "staffing",
  recruiting: "staffing",
  recruitment: "staffing",
  "temp agency": "staffing",
  headhunt: "staffing",
  "talent acquisition": "staffing",
  placement: "staffing",

  church: "faith",
  ministry: "faith",
  mosque: "faith",
  synagogue: "faith",
  temple: "faith",
  parish: "faith",
  congregation: "faith",
  "faith-based": "faith",
  nonprofit: "faith",

  design: "creative",
  photography: "creative",
  videography: "creative",
  "graphic design": "creative",
  branding: "creative",
  "web design": "creative",
  "content creation": "creative",
  copywriting: "creative",
  marketing: "creative",
  advertising: "creative",
  "creative agency": "creative",
  studio: "creative",

  cleaning: "service",
  landscaping: "service",
  pest: "service",
  moving: "service",
  salon: "service",
  spa: "service",
  auto: "service",
  mechanic: "service",
  locksmith: "service",
  catering: "service",
  restaurant: "service",
  fitness: "service",
  gym: "service",
  pet: "service",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function replacePlaceholders(template: string, nicheName: string, industry: IndustryCategory): string {
  return template
    .replace(/\{\{niche\}\}/g, nicheName)
    .replace(/\{\{industry\}\}/g, industry);
}

function replaceArrayPlaceholders(templates: string[], nicheName: string, industry: IndustryCategory): string[] {
  return templates.map((t) => replacePlaceholders(t, nicheName, industry));
}

export function detectIndustryCategory(name: string, keywords?: string[]): IndustryCategory {
  const searchTerms = [name, ...(keywords ?? [])].join(" ").toLowerCase();

  for (const [keyword, category] of Object.entries(INDUSTRY_KEYWORD_MAP)) {
    if (searchTerms.includes(keyword)) {
      return category;
    }
  }

  return "general";
}

export function generateAssessmentQuestions(
  nicheName: string,
  industry: IndustryCategory,
): AssessmentQuestion[] {
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.general;
  const stems = template.assessmentStems;

  const selected = stems.slice(0, 7);

  return selected.map((stem: AssessmentStem, index: number) => {
    const question = replacePlaceholders(stem.questionTemplate, nicheName, industry);
    return {
      id: `q-${index + 1}`,
      question,
      type: stem.type,
      options: stem.optionTemplates.map((opt, optIndex) => ({
        label: replacePlaceholders(opt.label, nicheName, industry),
        value: `q${index + 1}-opt${optIndex + 1}`,
        scoreImpact: opt.scoreImpact,
      })),
      weight: index < 3 ? 1.5 : 1.0,
    };
  });
}

export function generateNurtureContent(
  nicheName: string,
  industry: IndustryCategory,
  brandName?: string,
): NurtureStageContent[] {
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.general;
  const subjects = template.nurtureSubjects;
  const brand = brandName ?? "LeadOS";

  return NURTURE_DAY_OFFSETS.map((dayOffset, index) => {
    const subject = replacePlaceholders(subjects[index] ?? `Day ${dayOffset} follow-up for {{niche}}`, nicheName, industry);
    const stageLabel = NURTURE_STAGE_LABELS[index] ?? `Stage ${index + 1}`;
    const previewText = `${stageLabel} - helping your ${nicheName} business grow`;

    const bodyTemplate = buildNurtureBody(index, nicheName, brand, stageLabel);

    return {
      stageId: `day-${dayOffset}`,
      dayOffset,
      subject,
      previewText,
      bodyTemplate,
    };
  });
}

function buildNurtureBody(
  stageIndex: number,
  nicheName: string,
  brandName: string,
  stageLabel: string,
): string {
  const bodies: string[] = [
    `<p>Hi {{firstName}},</p>
<p>Thank you for taking the first step toward growing your ${nicheName} business. As promised, here is your personalized growth roadmap.</p>
<p>Inside, you will find the three biggest opportunities we identified for businesses like yours, along with specific actions you can take this week.</p>
<p>If you have questions, reply to this email and our team will get back to you within 24 hours.</p>
<p>To your success,<br/>The {{brandName}} Team</p>`,

    `<p>Hi {{firstName}},</p>
<p>Quick win for your ${nicheName} business: did you know that responding to inquiries within 5 minutes makes you 21x more likely to convert that lead?</p>
<p>Most ${nicheName} businesses respond in hours or days. Here is how to set up instant response in under 15 minutes.</p>
<p>Reply if you want us to walk you through it.</p>
<p>Best,<br/>The {{brandName}} Team</p>`,

    `<p>Hi {{firstName}},</p>
<p>We wanted to share a quick case study from a ${nicheName} business that was in a similar position to yours.</p>
<p>They were struggling with the same challenges you mentioned. After implementing a structured follow-up system, they saw measurable results within the first 30 days.</p>
<p>Want to see how they did it? Reply and we will send you the full breakdown.</p>
<p>Best,<br/>The {{brandName}} Team</p>`,

    `<p>Hi {{firstName}},</p>
<p>We have helped dozens of ${nicheName} businesses solve the exact challenges you are facing. Here are three strategies that consistently deliver results:</p>
<ol>
<li>Automated lead capture that works around the clock</li>
<li>Intelligent follow-up that nurtures leads based on their behavior</li>
<li>A scoring system that tells you exactly who is ready to buy</li>
</ol>
<p>Want to see these in action for your business? Let us know.</p>
<p>Best,<br/>The {{brandName}} Team</p>`,

    `<p>Hi {{firstName}},</p>
<p>I have been reviewing your ${nicheName} assessment results, and I believe a quick strategy session would be valuable for you.</p>
<p>In 30 minutes, we can map out a concrete plan to address the specific challenges in your ${nicheName} business and show you exactly what the first 90 days would look like.</p>
<p>No pressure, no obligations. Just practical advice you can use whether or not we work together.</p>
<p>Book your session here: {{ctaUrl}}</p>
<p>Looking forward to it,<br/>The {{brandName}} Team</p>`,

    `<p>Hi {{firstName}},</p>
<p>It has been a few weeks since you explored growth options for your ${nicheName} business. We wanted to check in.</p>
<p>Since then, we have helped several ${nicheName} businesses implement the strategies from your assessment. The results have been impressive.</p>
<p>If your challenges have not gone away, we are still here to help. Reply to reconnect.</p>
<p>Best,<br/>The {{brandName}} Team</p>`,

    `<p>Hi {{firstName}},</p>
<p>One month ago, you took the first step toward transforming your ${nicheName} business. We have been thinking about your situation.</p>
<p>The market for ${nicheName} services is evolving quickly, and the businesses that invest in automation now will have a significant advantage.</p>
<p>When you are ready, we would love to pick up where we left off. Just reply to this email.</p>
<p>Wishing you continued success,<br/>The {{brandName}} Team</p>`,
  ];

  return bodies[stageIndex] ?? bodies[bodies.length - 1];
}

export function selectFunnelsForNiche(industry: IndustryCategory): string[] {
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.general;
  return [...template.funnelPreferences];
}

export function matchLeadMagnetsForNiche(
  nicheSlug: string,
  industry: IndustryCategory,
  catalog: LeadMagnet[],
): string[] {
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.general;
  const preferredFunnels = template.funnelPreferences;

  const scored = catalog
    .filter((m) => m.status === "active")
    .map((magnet) => {
      let score = 0;
      const applicability = (magnet.metadata.nicheApplicability as string[]) ?? [];

      if (magnet.niche === nicheSlug) score += 40;
      else if (applicability.includes(nicheSlug)) score += 30;
      else if (applicability.includes("general")) score += 10;
      else if (applicability.includes(industry)) score += 20;

      const funnelIndex = preferredFunnels.indexOf(magnet.funnelFamily);
      if (funnelIndex === 0) score += 30;
      else if (funnelIndex === 1) score += 20;
      else if (funnelIndex >= 2) score += 10;

      return { slug: magnet.slug, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((entry) => entry.slug);
}

function buildPersonalizationContent(
  nicheName: string,
  industry: IndustryCategory,
  slug: string,
): Record<"cold" | "warm" | "hot" | "burning", PersonalizationContent> {
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.general;
  const temps: Array<"cold" | "warm" | "hot" | "burning"> = ["cold", "warm", "hot", "burning"];

  const result = {} as Record<"cold" | "warm" | "hot" | "burning", PersonalizationContent>;

  const trustBadges: Record<"cold" | "warm" | "hot" | "burning", string> = {
    cold: "Free assessment included",
    warm: "No commitment required",
    hot: "Money-back guarantee",
    burning: "Priority onboarding available",
  };

  for (const temp of temps) {
    const h = template.headlineTemplates[temp];
    result[temp] = {
      headline: replacePlaceholders(h.headline, nicheName, industry),
      subheadline: replacePlaceholders(h.subheadline, nicheName, industry),
      ctaText: replacePlaceholders(h.ctaText, nicheName, industry),
      ctaUrl: `/${slug}/assessment`,
      socialProof: replacePlaceholders(h.socialProof, nicheName, industry),
      trustBadge: trustBadges[temp],
    };
  }

  return result;
}

function deriveKeywords(name: string, industry: IndustryCategory, userKeywords?: string[]): string[] {
  const derived = new Set<string>(userKeywords ?? []);
  const words = name.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (word.length > 2) derived.add(word);
  }
  derived.add(industry);
  derived.add(name.toLowerCase());
  return Array.from(derived);
}

function buildN8nWorkflowSlugs(industry: IndustryCategory, slug: string): string[] {
  return [
    `${slug}-lead-capture`,
    `${slug}-nurture-sequence`,
    `${slug}-scoring-update`,
    `${slug}-hot-lead-alert`,
  ];
}

export function generateNicheConfig(input: {
  name: string;
  industry?: string;
  keywords?: string[];
  revenueModel?: string;
}): GeneratedNicheConfig {
  const industry: IndustryCategory = input.industry
    ? (isValidIndustry(input.industry) ? input.industry as IndustryCategory : detectIndustryCategory(input.name, input.keywords))
    : detectIndustryCategory(input.name, input.keywords);

  const slug = slugify(input.name);
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.general;

  const painPoints = replaceArrayPlaceholders(template.painPoints, input.name, industry);
  const urgencySignals = [...template.urgencySignals];
  const offers = replaceArrayPlaceholders(template.offers, input.name, industry);
  const keywords = deriveKeywords(input.name, industry, input.keywords);

  const assessmentQuestions = generateAssessmentQuestions(input.name, industry);
  const scoringWeights: ScoringWeightOverrides = { ...template.scoringBias };
  const personalizationContent = buildPersonalizationContent(input.name, industry, slug);

  let catalog: LeadMagnet[] = [];
  try {
    catalog = loadCatalog();
  } catch {
    catalog = [];
  }
  const recommendedMagnets = matchLeadMagnetsForNiche(slug, industry, catalog);
  const recommendedFunnels = selectFunnelsForNiche(industry);
  const nurtureSequence = generateNurtureContent(input.name, industry);
  const n8nWorkflowSlugs = buildN8nWorkflowSlugs(industry, slug);

  return {
    slug,
    name: input.name,
    industry,
    definition: {
      label: input.name,
      shortDescription: `Lead capture and growth automation for ${input.name} businesses.`,
      category: industry,
      market: input.revenueModel,
    },
    painPoints,
    urgencySignals,
    offers,
    keywords,
    assessmentQuestions,
    scoringWeights,
    personalizationContent,
    recommendedMagnets,
    recommendedFunnels,
    nurtureSequence,
    n8nWorkflowSlugs,
    createdAt: new Date().toISOString(),
  };
}

const ALL_INDUSTRIES: IndustryCategory[] = [
  "service", "legal", "health", "tech", "construction",
  "real-estate", "education", "finance", "franchise",
  "staffing", "faith", "creative", "general",
];

function isValidIndustry(value: string): value is IndustryCategory {
  return ALL_INDUSTRIES.includes(value as IndustryCategory);
}
