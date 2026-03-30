export type NicheDefinition = {
  slug: string;
  label: string;
  summary: string;
  assessmentTitle: string;
  calculatorBias: "time" | "revenue" | "compliance" | "experience";
  recommendedFunnels: string[];
};

export const nicheCatalog: Record<string, NicheDefinition> = {
  general: {
    slug: "general",
    label: "Business Automation",
    summary: "Automation and growth infrastructure for service businesses.",
    assessmentTitle: "Business Automation Assessment",
    calculatorBias: "time",
    recommendedFunnels: ["lead-magnet", "qualification", "chat", "webinar"],
  },
  legal: {
    slug: "legal",
    label: "Legal Operations",
    summary: "Lead capture and intake optimization for law firms.",
    assessmentTitle: "Legal Intake Readiness Assessment",
    calculatorBias: "compliance",
    recommendedFunnels: ["qualification", "authority", "webinar", "retention"],
  },
  "home-services": {
    slug: "home-services",
    label: "Home Services",
    summary: "Quote and booking acceleration for contractors and trades.",
    assessmentTitle: "Home Services Conversion Assessment",
    calculatorBias: "revenue",
    recommendedFunnels: ["qualification", "chat", "checkout", "retention"],
  },
  coaching: {
    slug: "coaching",
    label: "Coaching & Consulting",
    summary: "Qualification and appointment funnels for knowledge businesses.",
    assessmentTitle: "High-Ticket Coaching Funnel Assessment",
    calculatorBias: "experience",
    recommendedFunnels: ["authority", "webinar", "qualification", "continuity"],
  },
  construction: {
    slug: "construction",
    label: "Construction & Trades",
    summary: "Bid follow-up, project coordination, and crew scheduling for contractors.",
    assessmentTitle: "Construction Operations Assessment",
    calculatorBias: "revenue",
    recommendedFunnels: ["qualification", "chat", "checkout", "retention"],
  },
  "real-estate": {
    slug: "real-estate",
    label: "Real Estate",
    summary: "Lead response automation and listing marketing for agents and teams.",
    assessmentTitle: "Real Estate Lead Conversion Assessment",
    calculatorBias: "revenue",
    recommendedFunnels: ["lead-magnet", "chat", "qualification", "retention"],
  },
  tech: {
    slug: "tech",
    label: "Technology & SaaS",
    summary: "Trial conversion, onboarding automation, and churn prevention for software companies.",
    assessmentTitle: "SaaS Growth Readiness Assessment",
    calculatorBias: "time",
    recommendedFunnels: ["lead-magnet", "webinar", "qualification", "continuity"],
  },
  education: {
    slug: "education",
    label: "Education & Training",
    summary: "Enrollment marketing and student retention for programs and institutions.",
    assessmentTitle: "Enrollment Growth Assessment",
    calculatorBias: "experience",
    recommendedFunnels: ["lead-magnet", "webinar", "authority", "retention"],
  },
  finance: {
    slug: "finance",
    label: "Finance & Accounting",
    summary: "Client onboarding automation and compliance tracking for advisory firms.",
    assessmentTitle: "Financial Practice Efficiency Assessment",
    calculatorBias: "revenue",
    recommendedFunnels: ["authority", "qualification", "webinar", "continuity"],
  },
  franchise: {
    slug: "franchise",
    label: "Franchise Operations",
    summary: "Multi-location lead routing, brand compliance, and franchisee performance tracking.",
    assessmentTitle: "Franchise Operations Assessment",
    calculatorBias: "revenue",
    recommendedFunnels: ["qualification", "authority", "webinar", "checkout"],
  },
  staffing: {
    slug: "staffing",
    label: "Staffing & Recruiting",
    summary: "Candidate pipeline automation and placement tracking for staffing agencies.",
    assessmentTitle: "Staffing Pipeline Efficiency Assessment",
    calculatorBias: "time",
    recommendedFunnels: ["qualification", "chat", "lead-magnet", "retention"],
  },
  faith: {
    slug: "faith",
    label: "Church & Ministry",
    summary: "Member engagement, online giving, and volunteer coordination for congregations.",
    assessmentTitle: "Ministry Technology Assessment",
    calculatorBias: "experience",
    recommendedFunnels: ["lead-magnet", "authority", "retention", "referral"],
  },
  creative: {
    slug: "creative",
    label: "Creative Agencies",
    summary: "Project intake, client approvals, and portfolio-to-lead conversion for studios.",
    assessmentTitle: "Creative Agency Workflow Assessment",
    calculatorBias: "experience",
    recommendedFunnels: ["lead-magnet", "authority", "qualification", "referral"],
  },
  health: {
    slug: "health",
    label: "Healthcare & Wellness",
    summary: "Patient scheduling, no-show reduction, and practice growth automation.",
    assessmentTitle: "Healthcare Practice Growth Assessment",
    calculatorBias: "compliance",
    recommendedFunnels: ["qualification", "lead-magnet", "chat", "retention"],
  },
  ecommerce: {
    slug: "ecommerce",
    label: "E-Commerce",
    summary: "Store optimization, conversion funnels, and customer lifecycle automation.",
    assessmentTitle: "E-Commerce Growth Assessment",
    calculatorBias: "revenue",
    recommendedFunnels: ["checkout", "lead-magnet", "retention", "referral"],
  },
  fitness: {
    slug: "fitness",
    label: "Fitness & Wellness",
    summary: "Member acquisition, retention programs, and community engagement for gyms and coaches.",
    assessmentTitle: "Fitness Business Growth Assessment",
    calculatorBias: "experience",
    recommendedFunnels: ["lead-magnet", "chat", "retention", "referral"],
  },
};

export function getNiche(slug?: string) {
  return nicheCatalog[slug ?? "general"] ?? nicheCatalog.general;
}
