// ---------------------------------------------------------------------------
// Offer Engine — generates irresistible offers with pricing psychology,
// bundle creation, and urgency/scarcity mechanics.
// ---------------------------------------------------------------------------

export type Niche =
  | "construction"
  | "legal"
  | "healthcare"
  | "real-estate"
  | "home-services"
  | "franchise"
  | "staffing"
  | "technology"
  | "professional-services"
  | "education";

export interface Bonus {
  name: string;
  description: string;
  perceivedValue: number;
}

export interface UrgencyTrigger {
  type: "countdown" | "limited-spots" | "seasonal";
  label: string;
  deadline: string | null;
  spotsRemaining: number | null;
}

export interface ScarcityElement {
  type: "capacity" | "waitlist" | "exclusivity";
  label: string;
  remaining: number | null;
  waitlistPosition: number | null;
}

export interface RiskReversal {
  headline: string;
  body: string;
  durationDays: number;
}

export interface SocialProof {
  reviewCount: number;
  rating: number;
  testimonialSnippet: string;
}

export interface PriceTier {
  name: string;
  label: string;
  price: number;
  features: string[];
  isRecommended: boolean;
  savings: number;
}

export interface Bundle {
  name: string;
  items: string[];
  originalTotal: number;
  bundlePrice: number;
  savings: number;
  savingsPercent: number;
}

export interface Offer {
  headline: string;
  subheadline: string;
  priceAnchor: number;
  offerPrice: number;
  savings: number;
  savingsPercent: number;
  guarantee: RiskReversal;
  bonuses: Bonus[];
  urgencyTrigger: UrgencyTrigger;
  scarcityElement: ScarcityElement;
  socialProof: SocialProof;
}

export interface OfferTemplate {
  niche: Niche;
  services: string[];
  defaultPriceRange: { min: number; max: number };
  guaranteeType: "money-back" | "results-based" | "satisfaction";
  guaranteeDays: number;
  language: {
    painPoints: string[];
    desiredOutcomes: string[];
    socialProofTemplate: string;
  };
}

export interface OfferContext {
  brandName?: string;
  averageProjectValue?: number;
  competitorPrice?: number;
  seasonalEvent?: string;
  urgencyType?: UrgencyTrigger["type"];
  scarcityType?: ScarcityElement["type"];
}

// ---------------------------------------------------------------------------
// Niche-specific offer templates
// ---------------------------------------------------------------------------

export const OFFER_TEMPLATES: Record<Niche, OfferTemplate> = {
  construction: {
    niche: "construction",
    services: ["General Contracting", "Commercial Build-Out", "Renovation", "Project Management"],
    defaultPriceRange: { min: 5000, max: 50000 },
    guaranteeType: "results-based",
    guaranteeDays: 90,
    language: {
      painPoints: [
        "Losing bids to competitors with lower overhead",
        "Inconsistent project pipeline causing cash flow gaps",
        "Wasting time on unqualified leads that never convert",
      ],
      desiredOutcomes: [
        "A full pipeline of pre-qualified commercial projects",
        "Predictable monthly revenue without feast-or-famine cycles",
        "Higher close rates on bids worth $50K+",
      ],
      socialProofTemplate: "Trusted by {{count}}+ contractors across {{rating}}-star reviews",
    },
  },
  legal: {
    niche: "legal",
    services: ["Case Evaluation", "Legal Consultation", "Retainer Package", "Litigation Support"],
    defaultPriceRange: { min: 2000, max: 25000 },
    guaranteeType: "satisfaction",
    guaranteeDays: 30,
    language: {
      painPoints: [
        "Spending too much on advertising with low case conversion",
        "Intake process losing qualified leads to slow follow-up",
        "Difficulty standing out in a crowded legal market",
      ],
      desiredOutcomes: [
        "A steady stream of high-value case inquiries",
        "Automated intake that converts leads within minutes",
        "Authority positioning that commands premium fees",
      ],
      socialProofTemplate: "Helping {{count}}+ law firms increase case volume with {{rating}}-star satisfaction",
    },
  },
  healthcare: {
    niche: "healthcare",
    services: ["Patient Acquisition", "Telehealth Setup", "Practice Growth", "Retention Program"],
    defaultPriceRange: { min: 3000, max: 30000 },
    guaranteeType: "results-based",
    guaranteeDays: 60,
    language: {
      painPoints: [
        "Empty appointment slots costing thousands per week",
        "Patient no-shows eating into practice revenue",
        "Difficulty attracting new patients in a competitive market",
      ],
      desiredOutcomes: [
        "Fully booked schedules with high-value patients",
        "Reduced no-show rates through automated reminders",
        "A reputation that attracts patients without paid ads",
      ],
      socialProofTemplate: "{{count}}+ healthcare practices trust us — {{rating}}-star average rating",
    },
  },
  "real-estate": {
    niche: "real-estate",
    services: ["Listing Generation", "Buyer Lead System", "Open House Automation", "CRM Setup"],
    defaultPriceRange: { min: 1500, max: 15000 },
    guaranteeType: "money-back",
    guaranteeDays: 60,
    language: {
      painPoints: [
        "Spending thousands on Zillow leads with poor conversion",
        "Missing follow-ups on warm prospects who go to competitors",
        "Inconsistent deal flow making income unpredictable",
      ],
      desiredOutcomes: [
        "A predictable pipeline of motivated buyers and sellers",
        "Automated follow-up that nurtures leads to closing",
        "More closings per month with less time prospecting",
      ],
      socialProofTemplate: "{{count}}+ agents growing their business — {{rating}}-star rated",
    },
  },
  "home-services": {
    niche: "home-services",
    services: ["Lead Generation", "Booking System", "Review Management", "Service Area Expansion"],
    defaultPriceRange: { min: 1000, max: 10000 },
    guaranteeType: "money-back",
    guaranteeDays: 30,
    language: {
      painPoints: [
        "Seasonal slowdowns creating unpredictable revenue",
        "Losing jobs to competitors who respond faster",
        "Low online visibility in your service area",
      ],
      desiredOutcomes: [
        "A phone that rings with qualified service requests year-round",
        "Instant response automation that books jobs before competitors",
        "Dominant local presence in your top service areas",
      ],
      socialProofTemplate: "{{count}}+ home service pros — {{rating}}-star average",
    },
  },
  franchise: {
    niche: "franchise",
    services: ["Franchise Lead Gen", "Multi-Location Marketing", "Brand Compliance", "Territory Expansion"],
    defaultPriceRange: { min: 5000, max: 40000 },
    guaranteeType: "results-based",
    guaranteeDays: 90,
    language: {
      painPoints: [
        "Inconsistent marketing execution across franchise locations",
        "Franchisees struggling to generate local leads independently",
        "Brand dilution from non-compliant local campaigns",
      ],
      desiredOutcomes: [
        "Unified lead generation across all franchise locations",
        "Scalable marketing playbook franchisees can execute",
        "Brand-consistent campaigns that drive local results",
      ],
      socialProofTemplate: "Powering {{count}}+ franchise locations — {{rating}}-star platform",
    },
  },
  staffing: {
    niche: "staffing",
    services: ["Candidate Pipeline", "Client Acquisition", "Placement Automation", "Talent Branding"],
    defaultPriceRange: { min: 3000, max: 25000 },
    guaranteeType: "results-based",
    guaranteeDays: 60,
    language: {
      painPoints: [
        "Not enough qualified candidates to fill open roles",
        "Long time-to-fill hurting client relationships",
        "High recruiter burnout from manual sourcing",
      ],
      desiredOutcomes: [
        "A deep pipeline of pre-screened candidates ready to place",
        "Faster fills that keep clients loyal",
        "Automated sourcing that frees recruiters for high-value work",
      ],
      socialProofTemplate: "{{count}}+ staffing firms scaling with us — {{rating}}-star rated",
    },
  },
  technology: {
    niche: "technology",
    services: ["SaaS Lead Gen", "Demo Pipeline", "Product-Led Growth", "Developer Marketing"],
    defaultPriceRange: { min: 5000, max: 50000 },
    guaranteeType: "results-based",
    guaranteeDays: 90,
    language: {
      painPoints: [
        "High CAC eroding margins on new customer acquisition",
        "Long sales cycles with too many unqualified demos",
        "Low trial-to-paid conversion despite good product",
      ],
      desiredOutcomes: [
        "Lower CAC through intent-based lead qualification",
        "Shorter sales cycles with better-qualified demo pipeline",
        "Higher conversion from trial to paid with targeted nurture",
      ],
      socialProofTemplate: "{{count}}+ tech companies growing faster — {{rating}}-star platform",
    },
  },
  "professional-services": {
    niche: "professional-services",
    services: ["Client Acquisition", "Thought Leadership", "Referral System", "Proposal Automation"],
    defaultPriceRange: { min: 2500, max: 20000 },
    guaranteeType: "satisfaction",
    guaranteeDays: 45,
    language: {
      painPoints: [
        "Over-reliance on referrals creating unpredictable growth",
        "Difficulty justifying fees against lower-cost competitors",
        "Time wasted on proposals that never close",
      ],
      desiredOutcomes: [
        "A diversified pipeline beyond referrals alone",
        "Premium positioning that justifies your rates",
        "Higher proposal win rates with less effort",
      ],
      socialProofTemplate: "{{count}}+ professional firms trust us — {{rating}}-star satisfaction",
    },
  },
  education: {
    niche: "education",
    services: ["Enrollment Marketing", "Student Lead Gen", "Retention Program", "Alumni Engagement"],
    defaultPriceRange: { min: 2000, max: 20000 },
    guaranteeType: "satisfaction",
    guaranteeDays: 60,
    language: {
      painPoints: [
        "Declining enrollment despite increasing marketing spend",
        "Long decision cycles losing prospective students to competitors",
        "Poor visibility into which channels drive real enrollments",
      ],
      desiredOutcomes: [
        "Consistent enrollment growth from qualified applicants",
        "Shorter decision cycles with automated nurture sequences",
        "Clear ROI attribution on every marketing dollar",
      ],
      socialProofTemplate: "{{count}}+ educational institutions enrolled — {{rating}}-star rated",
    },
  },
};

// ---------------------------------------------------------------------------
// Pricing Psychology
// ---------------------------------------------------------------------------

export function applyPriceAnchoring(basePrice: number, anchorMultiplier: number = 2.5): { anchorPrice: number; offerPrice: number; savings: number; savingsPercent: number } {
  const anchorPrice = Math.round(basePrice * anchorMultiplier / 100) * 100;
  const offerPrice = basePrice;
  const savings = anchorPrice - offerPrice;
  const savingsPercent = Math.round((savings / anchorPrice) * 100);
  return { anchorPrice, offerPrice, savings, savingsPercent };
}

export function generatePriceTiers(service: string, niche: Niche): PriceTier[] {
  const template = OFFER_TEMPLATES[niche];
  const mid = Math.round((template.defaultPriceRange.min + template.defaultPriceRange.max) / 2);
  const low = Math.round(mid * 0.5);
  const high = Math.round(mid * 1.6);

  return [
    {
      name: "starter",
      label: "Starter",
      price: low,
      features: [
        `${service} — core setup`,
        "Email support",
        "Monthly reporting",
      ],
      isRecommended: false,
      savings: 0,
    },
    {
      name: "growth",
      label: "Growth",
      price: mid,
      features: [
        `${service} — full implementation`,
        "Priority support",
        "Weekly reporting",
        "A/B testing",
        "Dedicated account manager",
      ],
      isRecommended: true,
      savings: Math.round(high * 0.3) - (mid - low),
    },
    {
      name: "scale",
      label: "Scale",
      price: high,
      features: [
        `${service} — enterprise deployment`,
        "24/7 priority support",
        "Real-time dashboard",
        "A/B testing",
        "Dedicated account manager",
        "Custom integrations",
        "Quarterly strategy sessions",
      ],
      isRecommended: false,
      savings: 0,
    },
  ];
}

export function calculateBundlePrice(
  items: { name: string; price: number }[],
  discountStrategy: "percentage" | "fixed" | "tiered" = "tiered",
): Bundle {
  const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
  let discountRate: number;

  switch (discountStrategy) {
    case "percentage":
      discountRate = 0.2;
      break;
    case "fixed":
      discountRate = 0.15;
      break;
    case "tiered":
      if (items.length >= 4) discountRate = 0.3;
      else if (items.length >= 3) discountRate = 0.25;
      else if (items.length >= 2) discountRate = 0.15;
      else discountRate = 0;
      break;
  }

  const savings = Math.round(originalTotal * discountRate);
  const bundlePrice = originalTotal - savings;
  const savingsPercent = Math.round((savings / originalTotal) * 100);

  return {
    name: `${items.length}-Service Bundle`,
    items: items.map((i) => i.name),
    originalTotal,
    bundlePrice,
    savings,
    savingsPercent,
  };
}

export function generateRiskReversal(niche: Niche, offerType: "service" | "subscription" | "project" = "service"): RiskReversal {
  const template = OFFER_TEMPLATES[niche];
  const days = template.guaranteeDays;

  const guaranteeHeadlines: Record<OfferTemplate["guaranteeType"], string> = {
    "money-back": `${days}-Day Money-Back Guarantee`,
    "results-based": `${days}-Day Results Guarantee`,
    satisfaction: `${days}-Day Satisfaction Guarantee`,
  };

  const guaranteeBodies: Record<OfferTemplate["guaranteeType"], Record<string, string>> = {
    "money-back": {
      service: `If you are not completely satisfied with our ${niche} services within ${days} days, we will refund 100% of your investment. No questions asked.`,
      subscription: `Cancel anytime in the first ${days} days for a full refund. We only win when you win.`,
      project: `If the project deliverables do not meet the agreed scope within ${days} days, you get a full refund.`,
    },
    "results-based": {
      service: `If you do not see measurable results within ${days} days, we will work for free until you do — or refund your investment entirely.`,
      subscription: `Hit your KPIs within ${days} days or we extend your service at no cost until you do.`,
      project: `We guarantee measurable improvement within ${days} days of project completion, or we redo the work at no charge.`,
    },
    satisfaction: {
      service: `Try our ${niche} services risk-free for ${days} days. If you are not satisfied for any reason, we will make it right or refund your payment.`,
      subscription: `Your satisfaction is guaranteed for ${days} days. Not happy? We will fix it or refund you — your choice.`,
      project: `We stand behind every ${niche} project with a ${days}-day satisfaction guarantee. Period.`,
    },
  };

  return {
    headline: guaranteeHeadlines[template.guaranteeType],
    body: guaranteeBodies[template.guaranteeType][offerType],
    durationDays: days,
  };
}

// ---------------------------------------------------------------------------
// Urgency & Scarcity
// ---------------------------------------------------------------------------

export function generateUrgencyTrigger(
  type: UrgencyTrigger["type"],
  config: { deadlineDays?: number; spotsTotal?: number; spotsTaken?: number; eventName?: string } = {},
): UrgencyTrigger {
  const deadlineDays = config.deadlineDays ?? 7;
  const deadline = new Date(Date.now() + deadlineDays * 86_400_000).toISOString();

  switch (type) {
    case "countdown":
      return {
        type: "countdown",
        label: `Offer expires in ${deadlineDays} days — lock in your price now`,
        deadline,
        spotsRemaining: null,
      };
    case "limited-spots": {
      const total = config.spotsTotal ?? 20;
      const taken = config.spotsTaken ?? Math.floor(total * 0.7);
      const remaining = total - taken;
      return {
        type: "limited-spots",
        label: `Only ${remaining} spots remaining at this price`,
        deadline: null,
        spotsRemaining: remaining,
      };
    }
    case "seasonal": {
      const eventName = config.eventName ?? "Q2 Growth Sprint";
      return {
        type: "seasonal",
        label: `${eventName} pricing ends ${new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
        deadline,
        spotsRemaining: null,
      };
    }
  }
}

export function generateScarcityElement(
  type: ScarcityElement["type"],
  config: { remaining?: number; waitlistPosition?: number; exclusivityLabel?: string } = {},
): ScarcityElement {
  switch (type) {
    case "capacity":
      return {
        type: "capacity",
        label: `We only onboard ${config.remaining ?? 5} new clients per month`,
        remaining: config.remaining ?? 5,
        waitlistPosition: null,
      };
    case "waitlist":
      return {
        type: "waitlist",
        label: `Join ${config.waitlistPosition ?? 12} others on the priority waitlist`,
        remaining: null,
        waitlistPosition: config.waitlistPosition ?? 12,
      };
    case "exclusivity":
      return {
        type: "exclusivity",
        label: config.exclusivityLabel ?? "Available to qualified businesses only — apply to see if you qualify",
        remaining: null,
        waitlistPosition: null,
      };
  }
}

// ---------------------------------------------------------------------------
// Offer Rotation
// ---------------------------------------------------------------------------

const rotationIndex = new Map<string, number>();

export function rotateOffers(tenantId: string): number {
  const current = rotationIndex.get(tenantId) ?? 0;
  const next = (current + 1) % 3;
  rotationIndex.set(tenantId, next);
  return next;
}

// ---------------------------------------------------------------------------
// Core Offer Generation
// ---------------------------------------------------------------------------

export function generateOffer(niche: Niche, service: string, context: OfferContext = {}): Offer {
  const template = OFFER_TEMPLATES[niche];
  const basePrice = context.averageProjectValue
    ?? Math.round((template.defaultPriceRange.min + template.defaultPriceRange.max) / 2);

  const anchorMultiplier = context.competitorPrice
    ? context.competitorPrice / basePrice + 1
    : 2.5;

  const pricing = applyPriceAnchoring(basePrice, anchorMultiplier);

  const brandName = context.brandName ?? "our team";
  const desiredOutcome = template.language.desiredOutcomes[0];
  const painPoint = template.language.painPoints[0];

  const headline = `Stop ${painPoint.split(" ").slice(0, 4).join(" ")} — Get ${desiredOutcome.split(" ").slice(0, 6).join(" ")}`;
  const subheadline = `${service} for ${niche} professionals — backed by ${brandName} and a ${template.guaranteeDays}-day guarantee`;

  const guarantee = generateRiskReversal(niche);

  const bonuses: Bonus[] = [
    {
      name: "Quick-Start Strategy Session",
      description: `A 60-minute strategy call tailored to your ${niche} business goals`,
      perceivedValue: Math.round(basePrice * 0.15),
    },
    {
      name: "Custom Implementation Playbook",
      description: `Step-by-step ${service} playbook customized for ${niche}`,
      perceivedValue: Math.round(basePrice * 0.1),
    },
    {
      name: "Priority Support Access",
      description: "30 days of priority support with same-day response guarantee",
      perceivedValue: Math.round(basePrice * 0.08),
    },
  ];

  const urgencyType = context.urgencyType ?? "countdown";
  const urgencyTrigger = generateUrgencyTrigger(urgencyType, {
    eventName: context.seasonalEvent,
  });

  const scarcityType = context.scarcityType ?? "capacity";
  const scarcityElement = generateScarcityElement(scarcityType);

  const reviewCount = 100 + Math.floor(niche.length * 17);
  const rating = 4.7 + (niche.length % 3) * 0.1;
  const socialProof: SocialProof = {
    reviewCount,
    rating: Math.round(rating * 10) / 10,
    testimonialSnippet: template.language.socialProofTemplate
      .replace("{{count}}", String(reviewCount))
      .replace("{{rating}}", String(Math.round(rating * 10) / 10)),
  };

  return {
    headline,
    subheadline,
    priceAnchor: pricing.anchorPrice,
    offerPrice: pricing.offerPrice,
    savings: pricing.savings,
    savingsPercent: pricing.savingsPercent,
    guarantee,
    bonuses,
    urgencyTrigger,
    scarcityElement,
    socialProof,
  };
}

// ---------------------------------------------------------------------------
// Template Access
// ---------------------------------------------------------------------------

export function getOfferTemplates(filterNiche?: Niche): OfferTemplate[] {
  if (filterNiche) {
    const t = OFFER_TEMPLATES[filterNiche];
    return t ? [t] : [];
  }
  return Object.values(OFFER_TEMPLATES);
}

export function getOfferTemplate(niche: Niche): OfferTemplate | null {
  return OFFER_TEMPLATES[niche] ?? null;
}

export const ALL_NICHES: Niche[] = [
  "construction",
  "legal",
  "healthcare",
  "real-estate",
  "home-services",
  "franchise",
  "staffing",
  "technology",
  "professional-services",
  "education",
];
