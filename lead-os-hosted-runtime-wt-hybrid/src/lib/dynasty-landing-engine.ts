/**
 * DynastyLandingEngine — Types, in-memory store, preset configs, and utility
 * functions for the landing page config DSL.
 *
 * 22 preset configs spanning:
 *   - 5 persona types   (category: "persona")
 *   - 4 revenue models  (category: "revenue-model")
 *   - 13 industry pages (category: "industry")
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type ThemeVariant = "dark" | "light";

export interface Theme {
  variant: ThemeVariant;
  /** CSS color string for the primary accent (e.g. "#6366f1") */
  accent: string;
  /** CSS color string for accent hover state */
  accentHover: string;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export interface CtaButton {
  text: string;
  url: string;
  subtext?: string;
}

export type TrustBarItemType = "stat" | "badge" | "social-proof";

export interface TrustBarItem {
  type: TrustBarItemType;
  value: string;
  label: string;
}

export interface HeroSection {
  eyebrow?: string;
  headline: string;
  subheadline: string;
  primaryCta: CtaButton;
  secondaryCta?: CtaButton;
  trustBar: TrustBarItem[];
}

// ---------------------------------------------------------------------------
// Problem
// ---------------------------------------------------------------------------

export interface PainPoint {
  scenario: string;
  emotion: string;
}

export interface ProblemSection {
  headline: string;
  painPoints: PainPoint[];
  agitation: string;
}

// ---------------------------------------------------------------------------
// Solution
// ---------------------------------------------------------------------------

export interface SolutionSection {
  headline: string;
  description: string;
  transformation: string;
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface HowItWorksSection {
  headline: string;
  steps: HowItWorksStep[];
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export interface Feature {
  title: string;
  benefit: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Social Proof
// ---------------------------------------------------------------------------

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  rating: number;
}

export type StatItemType = "number" | "percentage" | "text";

export interface StatItem {
  type: StatItemType;
  value: string;
  label: string;
}

export interface SocialProofSection {
  headline: string;
  testimonials: Testimonial[];
  stats: StatItem[];
}

// ---------------------------------------------------------------------------
// Objections / FAQ
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ObjectionsSection {
  headline: string;
  faq: FaqItem[];
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

export interface FinalCtaSection {
  headline: string;
  subheadline: string;
  primaryCta: CtaButton;
  urgency: string;
  guarantee: string;
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export interface FooterSection {
  badges: string[];
  copyright: string;
  brandName: string;
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export interface PageMeta {
  title: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Category type system
// ---------------------------------------------------------------------------

export type PersonaType =
  | "agency"
  | "saas-entrepreneur"
  | "lead-gen-company"
  | "consultant"
  | "franchise-network";

export type RevenueModel =
  | "managed-service"
  | "white-label"
  | "implementation"
  | "marketplace";

export type IndustryCategory =
  | "service"
  | "legal"
  | "health"
  | "tech"
  | "construction"
  | "real-estate"
  | "education"
  | "finance"
  | "franchise"
  | "staffing"
  | "faith"
  | "creative"
  | "general";

export type SiteCategory = "persona" | "revenue-model" | "industry";

export type SiteStatus = "draft" | "published" | "archived";

// ---------------------------------------------------------------------------
// Root config
// ---------------------------------------------------------------------------

export interface DynastyLandingConfig {
  slug: string;
  status: SiteStatus;
  category: SiteCategory;
  /** Sub-type within the category (e.g. "agency" within "persona") */
  categorySlug: PersonaType | RevenueModel | IndustryCategory | string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  theme: Theme;
  hero: HeroSection;
  problem: ProblemSection;
  solution: SolutionSection;
  howItWorks: HowItWorksSection;
  features: Feature[];
  socialProof: SocialProofSection;
  objections: ObjectionsSection;
  finalCta: FinalCtaSection;
  footer: FooterSection;
  meta: PageMeta;
}

// ---------------------------------------------------------------------------
// In-memory store (edge/serverless safe — no fs dependency)
// ---------------------------------------------------------------------------

const store = new Map<string, DynastyLandingConfig>();

export function resetDynastySiteStore(): void {
  store.clear();
}

export async function getDynastySite(
  slug: string,
): Promise<DynastyLandingConfig | null> {
  return store.get(slug) ?? null;
}

export async function saveDynastySite(
  config: DynastyLandingConfig,
): Promise<DynastyLandingConfig> {
  const now = new Date().toISOString();
  const record: DynastyLandingConfig = {
    ...config,
    updatedAt: now,
    createdAt: config.createdAt ?? now,
  };
  store.set(record.slug, record);
  return record;
}

export async function updateDynastySite(
  slug: string,
  changes: Partial<DynastyLandingConfig>,
): Promise<DynastyLandingConfig | null> {
  const existing = store.get(slug);
  if (!existing) return null;
  // Prevent slug reassignment via update
  const { slug: _s, createdAt: _c, ...safeChanges } = changes as Partial<DynastyLandingConfig> & {
    createdAt?: string;
  };
  const updated: DynastyLandingConfig = {
    ...existing,
    ...safeChanges,
    slug: existing.slug,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  store.set(slug, updated);
  return updated;
}

export async function deleteDynastySite(slug: string): Promise<boolean> {
  return store.delete(slug);
}

export interface ListDynastySitesOptions {
  category?: SiteCategory;
  status?: string;
  tenantId?: string;
}

export async function listDynastySites(
  options: ListDynastySitesOptions = {},
): Promise<DynastyLandingConfig[]> {
  const all = Array.from(store.values());
  return all.filter((s) => {
    if (options.category && s.category !== options.category) return false;
    if (options.status && s.status !== options.status) return false;
    if (options.tenantId && s.tenantId !== options.tenantId) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// JSON-LD & meta helpers
// ---------------------------------------------------------------------------

export interface SiteJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  publisher: {
    "@type": string;
    name: string;
  };
  breadcrumb: {
    "@type": string;
    itemListElement: Array<{
      "@type": string;
      position: number;
      name: string;
      item: string;
    }>;
  };
}

export function generateSiteJsonLd(config: DynastyLandingConfig): SiteJsonLd {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://localhost:3000";
  const url = `${base}/d/${config.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.meta.title,
    description: config.meta.description,
    url,
    publisher: {
      "@type": "Organization",
      name: config.footer.brandName,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: base,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: config.meta.title,
          item: url,
        },
      ],
    },
  };
}

export interface SiteMeta {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
  };
}

export function generateSiteMeta(config: DynastyLandingConfig): SiteMeta {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://localhost:3000";
  return {
    title: config.meta.title,
    description: config.meta.description,
    canonical: `${base}/d/${config.slug}`,
    openGraph: {
      title: config.hero.headline,
      description: config.hero.subheadline,
    },
  };
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

const SHARED_HOW_IT_WORKS: HowItWorksSection = {
  headline: "Three steps to more qualified leads",
  steps: [
    { number: 1, title: "Connect your stack", description: "Sync CRM, website, and ad accounts in minutes.", icon: "🔗" },
    { number: 2, title: "Score every lead", description: "AI ranks prospects by conversion probability, live.", icon: "🤖" },
    { number: 3, title: "Close more deals", description: "Focus on leads that are ready to buy right now.", icon: "🏆" },
  ],
};

const SHARED_FOOTER: FooterSection = {
  badges: ["SSL Secured", "SOC 2 Compliant", "GDPR Ready"],
  copyright: `© ${new Date().getFullYear()} Lead OS. All rights reserved.`,
  brandName: "Lead OS",
};

function ts(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Preset configs
// ---------------------------------------------------------------------------

export function seedAllPresetConfigs(): DynastyLandingConfig[] {
  return [
    // -----------------------------------------------------------------------
    // PERSONA — 5 configs
    // -----------------------------------------------------------------------

    // 1. Agency
    {
      slug: "persona-agency",
      status: "published",
      category: "persona",
      categorySlug: "agency",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#0ea5e9", accentHover: "#38bdf8" },
      meta: {
        title: "Lead OS for Agencies",
        description: "Fill your agency pipeline without cold outreach. Score inbound leads instantly.",
      },
      hero: {
        eyebrow: "For Agency Owners",
        headline: "Fill your pipeline without cold outreach",
        subheadline: "Lead OS scores inbound leads the moment they arrive so you call the right prospects first.",
        primaryCta: { text: "Book a 15-min demo", url: "/demo", subtext: "No credit card needed" },
        secondaryCta: { text: "See how it works", url: "#how" },
        trustBar: [
          { type: "stat", value: "2.8x", label: "more proposals accepted" },
          { type: "stat", value: "60%", label: "less time prospecting" },
          { type: "badge", value: "G2", label: "Leader" },
        ],
      },
      problem: {
        headline: "Agency growth is a grind",
        painPoints: [
          { scenario: "You send 50 proposals a month and close fewer than 10", emotion: "Exhausted" },
          { scenario: "Referrals dry up and you have no predictable pipeline", emotion: "Anxious" },
          { scenario: "Discovery calls waste hours on prospects who can't afford you", emotion: "Frustrated" },
        ],
        agitation: "Every unqualified call is an hour you could spend on a paying client.",
      },
      solution: {
        headline: "Qualify leads before you pick up the phone",
        description: "Lead OS enriches every inbound lead with firmographic data and a fit score before your first conversation.",
        transformation: "From spray-and-pray to precision outreach",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Real-time scoring", benefit: "Know who is ready to buy right now", icon: "⚡" },
        { title: "CRM sync", benefit: "Works with HubSpot, Salesforce, and 40+ others", icon: "🔌" },
        { title: "Automated nurture", benefit: "Keep cold leads warm without manual work", icon: "🌡️" },
        { title: "Revenue attribution", benefit: "See which channels drive pipeline", icon: "📊" },
      ],
      socialProof: {
        headline: "Agency owners trust Lead OS",
        testimonials: [
          { quote: "Our close rate jumped from 18% to 51% because we only pitch the right clients.", name: "James O'Brien", title: "Founder, Volt Creative", rating: 5 },
          { quote: "Lead OS paid for itself in the first week. The fit score is eerily accurate.", name: "Marta Kowalski", title: "Owner, Apex Digital", rating: 5 },
          { quote: "Setup took 20 minutes and we had our first scored leads the same day.", name: "Devon Price", title: "MD, Signal Growth", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "51%", label: "avg. proposal close rate" },
          { type: "number", value: "1,200+", label: "agencies on Lead OS" },
        ],
      },
      objections: {
        headline: "Questions agency owners ask",
        faq: [
          { question: "Can I white-label Lead OS for my clients?", answer: "Yes — Agency plan includes white-label dashboards for up to 50 client sub-accounts." },
          { question: "How does the fit score work?", answer: "We combine your historical win/loss data with real-time intent signals to score each lead 0–100." },
          { question: "Is there a free trial?", answer: "Yes — 14 days free, no credit card required." },
        ],
      },
      finalCta: {
        headline: "Stop pitching unqualified prospects",
        subheadline: "Close more, prospect less.",
        primaryCta: { text: "Book a 15-min demo", url: "/demo" },
        urgency: "Demo slots fill up fast — reserve yours today",
        guarantee: "Free 14-day pilot. No setup fees.",
      },
      footer: SHARED_FOOTER,
    },

    // 2. SaaS Entrepreneur
    {
      slug: "persona-saas",
      status: "published",
      category: "persona",
      categorySlug: "saas-entrepreneur",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#6366f1", accentHover: "#818cf8" },
      meta: {
        title: "Lead OS for SaaS Founders",
        description: "Turn trial sign-ups into paying customers. AI scoring built for SaaS metrics.",
      },
      hero: {
        eyebrow: "For SaaS Founders",
        headline: "Turn trial sign-ups into paying customers",
        subheadline: "Lead OS scores every free user by conversion probability so your team chases the right ones.",
        primaryCta: { text: "Start free trial", url: "/onboard", subtext: "No credit card required" },
        secondaryCta: { text: "See a live demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "3.2x", label: "higher trial-to-paid rate" },
          { type: "stat", value: "47%", label: "less churn in year one" },
          { type: "badge", value: "SOC 2", label: "Compliant" },
        ],
      },
      problem: {
        headline: "SaaS growth is broken",
        painPoints: [
          { scenario: "You spend $20k/mo on ads and can't tell which leads will actually pay", emotion: "Frustrated" },
          { scenario: "Sales reps waste hours on free users who will never upgrade", emotion: "Overwhelmed" },
          { scenario: "Churn surprises you every quarter with no early warning", emotion: "Blindsided" },
        ],
        agitation: "Every day without predictive scoring is money left on the table.",
      },
      solution: {
        headline: "Predictive scoring built for SaaS metrics",
        description: "Lead OS connects to your product analytics and CRM to score every user on trial-to-paid probability in real time.",
        transformation: "From guessing to knowing, in one dashboard",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Trial conversion scoring", benefit: "Know which free users will pay before you invest in them", icon: "🎯" },
        { title: "Churn prediction", benefit: "Identify at-risk accounts 45 days before cancellation", icon: "🛑" },
        { title: "Product usage signals", benefit: "Score leads on in-app behavior, not just firmographics", icon: "📱" },
        { title: "Automated playbooks", benefit: "Trigger the right message at the right stage automatically", icon: "🤖" },
      ],
      socialProof: {
        headline: "SaaS teams trust Lead OS",
        testimonials: [
          { quote: "We went from 8% trial conversion to 24% in 90 days. Paid for itself in the first week.", name: "Maria Chen", title: "CEO, Trackify", rating: 5 },
          { quote: "Lead OS is the single biggest lever we pulled on our path to $1M ARR.", name: "Pete Ramirez", title: "Founder, FlowKit", rating: 5 },
          { quote: "Finally a tool that understands SaaS metrics, not just B2B lead gen.", name: "Aisha Okonkwo", title: "Head of Growth, DataHive", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "3.2x", label: "avg. trial conversion lift" },
          { type: "number", value: "600+", label: "SaaS teams on Lead OS" },
        ],
      },
      objections: {
        headline: "Common questions from founders",
        faq: [
          { question: "How long does integration take?", answer: "Most teams are fully connected in under 30 minutes with our guided setup wizard." },
          { question: "Does it work with our current CRM?", answer: "Yes — we integrate with Salesforce, HubSpot, Pipedrive, and 40+ others." },
          { question: "Can it predict expansion revenue too?", answer: "Yes — Lead OS includes an expansion likelihood score for every existing account." },
        ],
      },
      finalCta: {
        headline: "Ready to 3x your trial conversion rate?",
        subheadline: "Join 600+ SaaS teams that stopped guessing.",
        primaryCta: { text: "Start your free trial", url: "/onboard" },
        urgency: "Only 12 onboarding slots available this month",
        guarantee: "30-day money-back guarantee. No questions asked.",
      },
      footer: SHARED_FOOTER,
    },

    // 3. Lead-Gen Company
    {
      slug: "persona-lead-gen",
      status: "published",
      category: "persona",
      categorySlug: "lead-gen-company",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#10b981", accentHover: "#34d399" },
      meta: {
        title: "Lead OS for Lead-Gen Companies",
        description: "Deliver higher quality leads to clients. AI scoring that proves your value.",
      },
      hero: {
        eyebrow: "For Lead-Gen Companies",
        headline: "Deliver leads your clients actually close",
        subheadline: "Lead OS scores every lead you generate so your clients see the quality — and keep paying.",
        primaryCta: { text: "See a live demo", url: "/demo", subtext: "15 minutes, no obligation" },
        secondaryCta: { text: "Start free trial", url: "/onboard" },
        trustBar: [
          { type: "stat", value: "4.1x", label: "client retention rate lift" },
          { type: "stat", value: "65%", label: "fewer client disputes" },
          { type: "badge", value: "API", label: "Ready" },
        ],
      },
      problem: {
        headline: "Lead quality is your biggest client problem",
        painPoints: [
          { scenario: "Clients churn because they can't tell which leads are worth working", emotion: "Frustrated" },
          { scenario: "You deliver volume but your clients want quality and you have no proof", emotion: "Defensive" },
          { scenario: "You're competing on price because you can't differentiate on quality", emotion: "Squeezed" },
        ],
        agitation: "Without a quality score, every lead dispute costs you a client.",
      },
      solution: {
        headline: "Attach a quality score to every lead you deliver",
        description: "Lead OS scores every lead before delivery — giving your clients a data-backed quality signal they can act on immediately.",
        transformation: "From commodity lead seller to quality partner",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Pre-delivery scoring", benefit: "Score every lead before it leaves your platform", icon: "⚡" },
        { title: "Client reporting", benefit: "White-label quality dashboards for every client", icon: "📊" },
        { title: "Dispute resolution", benefit: "Back every credit request with objective data", icon: "🛡️" },
        { title: "API delivery", benefit: "Push scored leads to any CRM or destination via API", icon: "🔌" },
      ],
      socialProof: {
        headline: "Lead-gen companies trust Lead OS",
        testimonials: [
          { quote: "Client churn dropped 60% the quarter we started delivering scored leads.", name: "Tanya Marsh", title: "COO, LeadVault", rating: 5 },
          { quote: "We upsold 40% of our clients to a quality tier once we had scoring to back it up.", name: "Ben Cortez", title: "CEO, ScaleLeads", rating: 5 },
          { quote: "Lead OS ended the 'your leads are junk' conversation permanently.", name: "Lisa Park", title: "VP Operations, FunnelFirst", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "60%", label: "less client churn" },
          { type: "number", value: "300+", label: "lead-gen companies on Lead OS" },
        ],
      },
      objections: {
        headline: "Lead-gen company FAQs",
        faq: [
          { question: "Can I white-label the quality reports?", answer: "Yes — every client-facing report uses your brand, not ours." },
          { question: "Does it integrate with our lead delivery platform?", answer: "We have native integrations with all major lead distribution platforms plus a REST API." },
          { question: "What industries does it score accurately?", answer: "We have trained models for legal, financial services, home services, healthcare, and 12 other verticals." },
        ],
      },
      finalCta: {
        headline: "Prove your lead quality with data",
        subheadline: "Stop losing clients to quality disputes.",
        primaryCta: { text: "See a live demo", url: "/demo" },
        urgency: "Demo slots are limited this week",
        guarantee: "30-day pilot with full refund if targets are not met.",
      },
      footer: SHARED_FOOTER,
    },

    // 4. Consultant
    {
      slug: "persona-consultant",
      status: "published",
      category: "persona",
      categorySlug: "consultant",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#f59e0b", accentHover: "#fbbf24" },
      meta: {
        title: "Lead OS for Consultants",
        description: "Land more engagements without cold outreach. AI scoring for consultants.",
      },
      hero: {
        eyebrow: "For Independent Consultants",
        headline: "Land more engagements without cold outreach",
        subheadline: "Lead OS tells you which inbound inquiries are worth your time — before you spend an hour on discovery.",
        primaryCta: { text: "Start free trial", url: "/onboard", subtext: "14 days, no card required" },
        secondaryCta: { text: "Watch a 3-min demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "3.4x", label: "higher engagement close rate" },
          { type: "stat", value: "50%", label: "fewer wasted discovery calls" },
          { type: "badge", value: "Solo-Friendly", label: "Setup" },
        ],
      },
      problem: {
        headline: "Consulting pipeline is feast or famine",
        painPoints: [
          { scenario: "You take every discovery call because you can't afford to miss an opportunity", emotion: "Overwhelmed" },
          { scenario: "Prospects ghost after a 90-minute deep-dive call you ran for free", emotion: "Drained" },
          { scenario: "You have no way to know which inquiries are serious buyers vs. idea shoppers", emotion: "Frustrated" },
        ],
        agitation: "Every wasted discovery call is 2 hours you could have billed.",
      },
      solution: {
        headline: "Filter your pipeline before the first call",
        description: "Lead OS scores every inquiry on budget readiness, urgency, and fit — so you only get on calls with prospects who are serious.",
        transformation: "From open to everyone to selective and profitable",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Inquiry scoring", benefit: "Know who is serious before accepting a discovery call", icon: "🎯" },
        { title: "Fit analysis", benefit: "Match prospects to your ideal engagement profile automatically", icon: "🧩" },
        { title: "Calendar protection", benefit: "Only allow high-score leads to book your time", icon: "📅" },
        { title: "Pipeline tracking", benefit: "See your entire opportunity pipeline in one view", icon: "📊" },
      ],
      socialProof: {
        headline: "Consultants trust Lead OS",
        testimonials: [
          { quote: "I cut discovery calls in half and doubled my close rate. Lead OS filters out the tire-kickers.", name: "Raj Mehta", title: "Independent Consultant, Strategy & Ops", rating: 5 },
          { quote: "My calendar is now only filled with people who can afford my rates.", name: "Christine Waller", title: "Fractional CMO", rating: 5 },
          { quote: "Setup took 10 minutes and I saved 6 wasted discovery hours in my first week.", name: "Omar Hassan", title: "Supply Chain Consultant", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "3.4x", label: "higher close rate" },
          { type: "number", value: "2,000+", label: "consultants on Lead OS" },
        ],
      },
      objections: {
        headline: "Consultant FAQs",
        faq: [
          { question: "I'm solo — is this too complex for me?", answer: "Not at all. Setup takes 10 minutes and the scoring is fully automatic. No technical skills needed." },
          { question: "Can it integrate with my booking tool?", answer: "Yes — we integrate with Calendly, Acuity, and Cal.com to gate bookings behind a minimum score threshold." },
          { question: "What does it cost?", answer: "Plans start at $49/month. Most consultants recover that in their first filtered week." },
        ],
      },
      finalCta: {
        headline: "Protect your calendar from tire-kickers",
        subheadline: "Only meet with prospects who are ready to invest.",
        primaryCta: { text: "Start your free trial", url: "/onboard" },
        urgency: "Join 2,000+ consultants closing more with Lead OS",
        guarantee: "14-day free trial. No credit card required.",
      },
      footer: SHARED_FOOTER,
    },

    // 5. Franchise Network
    {
      slug: "persona-franchise",
      status: "published",
      category: "persona",
      categorySlug: "franchise-network",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#ec4899", accentHover: "#f472b6" },
      meta: {
        title: "Lead OS for Franchise Networks",
        description: "Standardize lead scoring across all franchise locations. More closings, less chaos.",
      },
      hero: {
        eyebrow: "For Franchise Networks",
        headline: "Standardize lead quality across every location",
        subheadline: "Lead OS gives every franchisee the same AI scoring model so your best practices scale automatically.",
        primaryCta: { text: "Book a network demo", url: "/demo", subtext: "Enterprise pricing available" },
        secondaryCta: { text: "Download case study", url: "/resources" },
        trustBar: [
          { type: "stat", value: "2.9x", label: "more consistent close rates" },
          { type: "stat", value: "55%", label: "faster onboarding per location" },
          { type: "badge", value: "Multi-location", label: "Ready" },
        ],
      },
      problem: {
        headline: "Franchise lead quality is inconsistent",
        painPoints: [
          { scenario: "Top locations close 40% of leads while struggling ones close 8% — same leads", emotion: "Frustrated" },
          { scenario: "Corporate has no visibility into which leads each location is working", emotion: "Blind" },
          { scenario: "New franchisees take 6 months to develop lead prioritization instincts", emotion: "Patient" },
        ],
        agitation: "Every location that underperforms is franchise fee revenue you can't recover.",
      },
      solution: {
        headline: "Give every location your best rep's instincts",
        description: "Lead OS trains on your top performers' win patterns and deploys that model to every location instantly — so the newest franchisee scores like your most experienced one.",
        transformation: "From inconsistent performance to franchise-wide excellence",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Network-wide scoring model", benefit: "One model trained on all locations deployed everywhere", icon: "🌐" },
        { title: "Location benchmarking", benefit: "Compare lead quality and close rates across your network", icon: "📊" },
        { title: "Franchisee dashboards", benefit: "Each location sees their own leads and scores", icon: "🏪" },
        { title: "Corporate reporting", benefit: "Network-level pipeline and quality visibility in real time", icon: "🔭" },
      ],
      socialProof: {
        headline: "Franchise networks trust Lead OS",
        testimonials: [
          { quote: "Our worst-performing locations improved by 80% after we rolled out Lead OS network-wide.", name: "Sandra Tate", title: "VP Franchise Operations, HomeServe Group", rating: 5 },
          { quote: "We can finally see which leads every location is working and how they're scoring them.", name: "Marc DuBois", title: "CRO, FitNation Franchise", rating: 5 },
          { quote: "New franchisees ramp 3x faster because Lead OS shows them who to call first.", name: "Keiko Yamamoto", title: "Director of Performance, CleanBrite", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.9x", label: "more consistent close rates" },
          { type: "number", value: "150+", label: "franchise networks on Lead OS" },
        ],
      },
      objections: {
        headline: "Franchise network FAQs",
        faq: [
          { question: "How does pricing work for multiple locations?", answer: "We offer volume discounts starting at 5 locations. Enterprise plans cover unlimited locations." },
          { question: "Can each franchisee customize their model?", answer: "Yes — franchisees can adjust scoring weights within guardrails you define at the corporate level." },
          { question: "Does it work with our current franchise management software?", answer: "We integrate with FranConnect, Salesforce, and all major FMS platforms." },
        ],
      },
      finalCta: {
        headline: "Scale your best rep's instincts to every location",
        subheadline: "Network-wide lead quality, finally standardized.",
        primaryCta: { text: "Book a network demo", url: "/demo" },
        urgency: "Enterprise specialists available this week",
        guarantee: "Pilot program with contractual performance targets.",
      },
      footer: SHARED_FOOTER,
    },

    // -----------------------------------------------------------------------
    // REVENUE MODEL — 4 configs
    // -----------------------------------------------------------------------

    // 6. Managed Service
    {
      slug: "revenue-managed-service",
      status: "published",
      category: "revenue-model",
      categorySlug: "managed-service",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#8b5cf6", accentHover: "#a78bfa" },
      meta: {
        title: "Lead OS Managed Service",
        description: "Done-for-you lead scoring and pipeline management. We run it, you close deals.",
      },
      hero: {
        eyebrow: "Managed Service",
        headline: "Done-for-you lead scoring and pipeline management",
        subheadline: "Our team configures, monitors, and optimizes your entire lead scoring operation. You focus on closing.",
        primaryCta: { text: "Get a free pipeline audit", url: "/assess", subtext: "Delivered in 24 hours" },
        secondaryCta: { text: "See service overview", url: "/services" },
        trustBar: [
          { type: "stat", value: "2.7x", label: "more pipeline generated" },
          { type: "stat", value: "0 hrs", label: "of ops work per week" },
          { type: "badge", value: "Dedicated", label: "Team" },
        ],
      },
      problem: {
        headline: "You don't have time to run lead scoring ops",
        painPoints: [
          { scenario: "You bought a lead scoring tool but no one has time to configure or maintain it", emotion: "Stuck" },
          { scenario: "Your ops team is already overloaded and scoring keeps getting deprioritized", emotion: "Frustrated" },
          { scenario: "You're not getting value from your marketing stack because the data is a mess", emotion: "Overwhelmed" },
        ],
        agitation: "Every week without a working scoring system is pipeline you're leaving on the table.",
      },
      solution: {
        headline: "Let us run your entire scoring operation",
        description: "Lead OS Managed Service gives you a dedicated team that handles setup, model tuning, data quality, and reporting — so you get results without headcount.",
        transformation: "From DIY burden to hands-off revenue engine",
      },
      howItWorks: {
        headline: "How managed service works",
        steps: [
          { number: 1, title: "Discovery call", description: "We audit your stack and define your ideal customer profile together.", icon: "🔍" },
          { number: 2, title: "Build and configure", description: "Our team sets up and tests your scoring model in 5 business days.", icon: "⚙️" },
          { number: 3, title: "Run and optimize", description: "We monitor performance weekly and tune the model as your market evolves.", icon: "📈" },
        ],
      },
      features: [
        { title: "Dedicated success manager", benefit: "A named expert who knows your business and your goals", icon: "👤" },
        { title: "Model tuning included", benefit: "Weekly optimizations based on your win/loss data", icon: "🔧" },
        { title: "Data hygiene", benefit: "Ongoing deduplication and enrichment of your lead database", icon: "🧹" },
        { title: "Monthly reporting", benefit: "Executive-ready pipeline quality reports every month", icon: "📋" },
      ],
      socialProof: {
        headline: "Teams love not worrying about scoring ops",
        testimonials: [
          { quote: "We went from zero to a fully-running scoring operation in 5 days. I didn't lift a finger.", name: "Stephanie Cole", title: "CRO, Meridian Software", rating: 5 },
          { quote: "Our managed service team has saved us at least one FTE per quarter in ops overhead.", name: "Nate Freeman", title: "VP Revenue, GridPoint", rating: 5 },
          { quote: "Best ROI we've gotten from any vendor — and we didn't have to change a single internal process.", name: "Lisa Chu", title: "Head of Marketing, Pivotal Health", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.7x", label: "more pipeline generated" },
          { type: "number", value: "200+", label: "managed service clients" },
        ],
      },
      objections: {
        headline: "Managed service FAQs",
        faq: [
          { question: "How quickly can we get started?", answer: "Onboarding kicks off within 48 hours of signing. Your scoring model is live within 5 business days." },
          { question: "What if we already have a partial scoring setup?", answer: "We audit what you have, keep what's working, and fix or replace what isn't — no wasted work." },
          { question: "Is there a minimum contract length?", answer: "Month-to-month options are available. Annual contracts include a 20% discount." },
        ],
      },
      finalCta: {
        headline: "Get a fully-running scoring operation without the ops work",
        subheadline: "We run it. You close.",
        primaryCta: { text: "Get your free pipeline audit", url: "/assess" },
        urgency: "Audit delivered in 24 hours — limited slots this week",
        guarantee: "30-day performance guarantee or full refund.",
      },
      footer: SHARED_FOOTER,
    },

    // 7. White-Label
    {
      slug: "revenue-white-label",
      status: "published",
      category: "revenue-model",
      categorySlug: "white-label",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#06b6d4", accentHover: "#22d3ee" },
      meta: {
        title: "Lead OS White-Label Platform",
        description: "Resell AI lead scoring under your brand. Launch your own scoring product in days.",
      },
      hero: {
        eyebrow: "White-Label Platform",
        headline: "Launch your own AI scoring product under your brand",
        subheadline: "Lead OS white-label gives you the full scoring engine — rebrand it, price it, and sell it as your own.",
        primaryCta: { text: "Start a reseller conversation", url: "/partners", subtext: "Revenue share available" },
        secondaryCta: { text: "See white-label demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "$12k", label: "avg. monthly reseller revenue" },
          { type: "stat", value: "7 days", label: "to your branded launch" },
          { type: "badge", value: "API-first", label: "Platform" },
        ],
      },
      problem: {
        headline: "Building scoring tech is slow and expensive",
        painPoints: [
          { scenario: "Your clients want lead scoring but building it in-house would take 18 months", emotion: "Stuck" },
          { scenario: "You're losing deals to competitors who offer scoring as part of their platform", emotion: "Frustrated" },
          { scenario: "Licensing someone else's tool means you can't brand it or control the roadmap", emotion: "Constrained" },
        ],
        agitation: "Every month without your own scoring offering is market share you're ceding.",
      },
      solution: {
        headline: "Your brand. Our engine. Launched in a week.",
        description: "Lead OS white-label gives you the full scoring infrastructure under your brand — with your colors, your pricing, and your customer relationship.",
        transformation: "From tool reseller to platform company",
      },
      howItWorks: {
        headline: "White-label launch in three steps",
        steps: [
          { number: 1, title: "Brand configuration", description: "Upload your logo, set your colors, and configure your pricing in the admin portal.", icon: "🎨" },
          { number: 2, title: "Integration", description: "Connect Lead OS to your existing platform via API or use our hosted portal.", icon: "🔌" },
          { number: 3, title: "Launch and sell", description: "Start selling your branded scoring product to your existing client base.", icon: "🚀" },
        ],
      },
      features: [
        { title: "Full rebrand", benefit: "Your logo, colors, and domain — no Lead OS branding visible", icon: "🎨" },
        { title: "Custom pricing control", benefit: "Set your own pricing tiers and margins independently", icon: "💰" },
        { title: "API-first", benefit: "Embed scoring anywhere in your product via REST API", icon: "🔌" },
        { title: "Sub-account management", benefit: "Manage unlimited client accounts from one admin view", icon: "👥" },
      ],
      socialProof: {
        headline: "White-label partners are generating real revenue",
        testimonials: [
          { quote: "We launched our own scoring product in 8 days and immediately upsold 30% of our client base.", name: "Femi Adeyemi", title: "CEO, Oluwa Digital", rating: 5 },
          { quote: "Lead OS white-label added $15k/month in recurring revenue with zero engineering work.", name: "Cara Novak", title: "COO, Prism Marketing Tech", rating: 5 },
          { quote: "Our clients think we built the scoring engine ourselves. That's exactly what we wanted.", name: "Victor Bains", title: "Founder, Amplify Platforms", rating: 5 },
        ],
        stats: [
          { type: "text", value: "$12k", label: "avg. monthly partner revenue" },
          { type: "number", value: "80+", label: "white-label partners" },
        ],
      },
      objections: {
        headline: "White-label FAQs",
        faq: [
          { question: "Can our clients know who powers the scoring engine?", answer: "That's entirely up to you. The default is full white-label with no Lead OS branding anywhere." },
          { question: "What's the revenue share model?", answer: "Partners keep 60–80% of client revenue depending on volume tier. No minimum commitments." },
          { question: "Do we need engineers to integrate?", answer: "No — a no-code portal option is available. API integration typically takes one developer 1–2 days." },
        ],
      },
      finalCta: {
        headline: "Launch your own AI scoring product this week",
        subheadline: "Your brand. Your pricing. Our engine.",
        primaryCta: { text: "Start a reseller conversation", url: "/partners" },
        urgency: "Partner slots are limited — apply this week",
        guarantee: "First 30 days free for qualified partners.",
      },
      footer: SHARED_FOOTER,
    },

    // 8. Implementation
    {
      slug: "revenue-implementation",
      status: "published",
      category: "revenue-model",
      categorySlug: "implementation",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#64748b", accentHover: "#94a3b8" },
      meta: {
        title: "Lead OS Implementation Service",
        description: "Expert implementation of Lead OS for enterprise teams. Live in 5 days.",
      },
      hero: {
        eyebrow: "Implementation Service",
        headline: "Go live in 5 days with expert implementation",
        subheadline: "Our certified implementation team handles CRM integration, model configuration, and team training so you don't have to.",
        primaryCta: { text: "Schedule an implementation call", url: "/contact" },
        secondaryCta: { text: "See implementation scope", url: "/services" },
        trustBar: [
          { type: "stat", value: "5 days", label: "median time to live" },
          { type: "stat", value: "98%", label: "implementation success rate" },
          { type: "badge", value: "Certified", label: "Engineers" },
        ],
      },
      problem: {
        headline: "Self-service implementation is slowing you down",
        painPoints: [
          { scenario: "Your team spent 3 weeks trying to configure the scoring model and it's still not right", emotion: "Frustrated" },
          { scenario: "CRM integration is stalled because IT is prioritizing other projects", emotion: "Blocked" },
          { scenario: "You bought the tool but leadership is losing patience with the timeline", emotion: "Pressured" },
        ],
        agitation: "Every week without a working scoring system is pipeline you're leaving on the table.",
      },
      solution: {
        headline: "Certified experts who have done this 200 times",
        description: "Lead OS implementation engineers handle every technical step — CRM connection, model training, workflow setup, and user onboarding — in a structured 5-day engagement.",
        transformation: "From stalled self-service to live in one week",
      },
      howItWorks: {
        headline: "Our 5-day implementation process",
        steps: [
          { number: 1, title: "Kickoff and audit", description: "Day 1: We review your CRM data, ICP definition, and existing workflows.", icon: "📋" },
          { number: 2, title: "Build and integrate", description: "Days 2–4: CRM integration, model training, and workflow automation configuration.", icon: "⚙️" },
          { number: 3, title: "Train and launch", description: "Day 5: Team training and go-live with a post-launch 30-day check-in included.", icon: "🚀" },
        ],
      },
      features: [
        { title: "CRM integration", benefit: "We connect to your CRM with full field mapping and sync validation", icon: "🔌" },
        { title: "Custom model training", benefit: "Model trained on your historical win/loss data, not generic benchmarks", icon: "🧠" },
        { title: "Workflow setup", benefit: "Automated lead routing and alert rules configured to your process", icon: "⚙️" },
        { title: "Team training", benefit: "Live sessions for reps, managers, and ops so everyone knows what to do", icon: "🎓" },
      ],
      socialProof: {
        headline: "Teams love how fast we deliver",
        testimonials: [
          { quote: "We were live in 4 days. I've never seen an implementation move that fast.", name: "Andrew Walsh", title: "Director of RevOps, SyncPath", rating: 5 },
          { quote: "The implementation team knew our CRM better than our own ops team by day 2.", name: "Rebecca Storm", title: "VP Marketing, NorthStar Tech", rating: 5 },
          { quote: "We had been stuck for 2 months. Lead OS implementation had us running in a week.", name: "Carlos Rivera", title: "Head of Sales, Elevate B2B", rating: 5 },
        ],
        stats: [
          { type: "text", value: "5 days", label: "median time to live" },
          { type: "percentage", value: "98%", label: "on-time delivery rate" },
        ],
      },
      objections: {
        headline: "Implementation FAQs",
        faq: [
          { question: "What CRMs do you support?", answer: "We support Salesforce, HubSpot, Pipedrive, Zoho, and 15+ others with certified integrations." },
          { question: "What happens after the 5-day implementation?", answer: "You get a 30-day post-launch check-in and ongoing support via our standard SLA." },
          { question: "Do we need to provide data before the engagement?", answer: "We'll send a short data request form before kickoff — typically 30 minutes of prep on your side." },
        ],
      },
      finalCta: {
        headline: "Go live in 5 days, not 5 months",
        subheadline: "Expert implementation. Zero self-service headaches.",
        primaryCta: { text: "Schedule an implementation call", url: "/contact" },
        urgency: "Implementation slots book out 2 weeks ahead — reserve yours now",
        guarantee: "On-time delivery guarantee or your implementation is free.",
      },
      footer: SHARED_FOOTER,
    },

    // 9. Marketplace
    {
      slug: "revenue-marketplace",
      status: "published",
      category: "revenue-model",
      categorySlug: "marketplace",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#f97316", accentHover: "#fb923c" },
      meta: {
        title: "Lead OS Marketplace",
        description: "Buy scored, verified leads in your industry. Only pay for leads that score high.",
      },
      hero: {
        eyebrow: "Lead Marketplace",
        headline: "Buy leads that already score high before you pay",
        subheadline: "Every lead in the Lead OS Marketplace is scored, verified, and ready to contact — so you only spend budget on prospects most likely to close.",
        primaryCta: { text: "Shop scored leads now", url: "/marketplace" },
        secondaryCta: { text: "See how scoring works", url: "#how" },
        trustBar: [
          { type: "stat", value: "4.3x", label: "higher contact rate vs. raw lists" },
          { type: "stat", value: "Pay", label: "only for high scores" },
          { type: "badge", value: "TCPA", label: "Compliant" },
        ],
      },
      problem: {
        headline: "Buying leads is a gamble",
        painPoints: [
          { scenario: "You buy 500 leads and 400 don't answer the phone", emotion: "Frustrated" },
          { scenario: "List quality is impossible to verify before you pay", emotion: "Burned" },
          { scenario: "You have no way to know if leads were already sold to 10 competitors", emotion: "Skeptical" },
        ],
        agitation: "Unscored lead lists are one of the highest-waste line items in your marketing budget.",
      },
      solution: {
        headline: "Only buy leads that are ready to engage",
        description: "Every lead in our marketplace is independently scored for intent, freshness, and exclusivity before it's listed — so you know what you're getting before you pay.",
        transformation: "From lead roulette to precision purchasing",
      },
      howItWorks: {
        headline: "How the marketplace works",
        steps: [
          { number: 1, title: "Set your filters", description: "Define your ICP: industry, geography, company size, intent score minimum.", icon: "🎛️" },
          { number: 2, title: "Browse scored leads", description: "Review leads with full transparency on score, source, and freshness before buying.", icon: "🔍" },
          { number: 3, title: "Buy and contact", description: "Purchase only the leads you want. Delivered to your CRM instantly.", icon: "⚡" },
        ],
      },
      features: [
        { title: "Pre-scored inventory", benefit: "Every lead has an AI quality score before listing", icon: "🏷️" },
        { title: "Freshness guarantee", benefit: "No lead older than 72 hours in active inventory", icon: "⏱️" },
        { title: "Exclusivity options", benefit: "Buy exclusive leads that won't be sold to competitors", icon: "🔒" },
        { title: "CRM delivery", benefit: "Instant push to your CRM or email upon purchase", icon: "🔌" },
      ],
      socialProof: {
        headline: "Buyers trust Lead OS Marketplace",
        testimonials: [
          { quote: "Our contact rate went from 12% to 51% the day we switched to scored marketplace leads.", name: "Danny Lau", title: "Sales Manager, Vertex Insurance", rating: 5 },
          { quote: "The transparency is incredible. I can see the score, source, and age before I pay.", name: "Priya Shah", title: "Lead Buyer, SolarPro Network", rating: 5 },
          { quote: "We cut our cost per appointment by 60% by only buying leads with a score above 70.", name: "Greg Thompson", title: "VP Sales, TrustGuard Financial", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "4.3x", label: "higher contact rate" },
          { type: "number", value: "500k+", label: "scored leads available" },
        ],
      },
      objections: {
        headline: "Marketplace FAQs",
        faq: [
          { question: "What industries are available?", answer: "We have active inventory in legal, financial services, insurance, home services, healthcare, and real estate." },
          { question: "Are the leads TCPA compliant?", answer: "Yes — all leads are sourced with explicit opt-in consent and are fully TCPA compliant." },
          { question: "Can I return leads that don't answer?", answer: "Yes — leads with invalid phone numbers or no contact in 3 attempts are eligible for credit." },
        ],
      },
      finalCta: {
        headline: "Stop gambling on unscored lead lists",
        subheadline: "Browse scored leads in your industry right now.",
        primaryCta: { text: "Shop scored leads today", url: "/marketplace" },
        urgency: "New scored inventory added daily — check today's listings",
        guarantee: "Invalid lead credit guarantee on all purchases.",
      },
      footer: SHARED_FOOTER,
    },

    // -----------------------------------------------------------------------
    // INDUSTRY — 13 configs
    // -----------------------------------------------------------------------

    // 10. Service
    {
      slug: "industry-service",
      status: "published",
      category: "industry",
      categorySlug: "service",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#6366f1", accentHover: "#818cf8" },
      meta: {
        title: "Lead OS for Service Businesses",
        description: "Score service business leads by job value and urgency. Book more jobs.",
      },
      hero: {
        eyebrow: "For Service Businesses",
        headline: "Book more jobs from the same lead flow",
        subheadline: "Lead OS scores every inquiry by job value and urgency — so your team calls the highest-revenue opportunities first.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        secondaryCta: { text: "See a demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "3.1x", label: "more revenue per lead" },
          { type: "stat", value: "45%", label: "less time on small jobs" },
          { type: "badge", value: "Field-Friendly", label: "Mobile App" },
        ],
      },
      problem: {
        headline: "Service business leads waste your time",
        painPoints: [
          { scenario: "Your team chases small $200 jobs while $5,000 opportunities wait", emotion: "Frustrated" },
          { scenario: "Every inquiry gets equal attention regardless of job size or urgency", emotion: "Inefficient" },
          { scenario: "You have no way to tell which callers are price shopping vs. ready to book", emotion: "Guessing" },
        ],
        agitation: "Every hour your team spends on a low-value lead is an hour away from a high-value one.",
      },
      solution: {
        headline: "Score every inquiry by job value before your team calls back",
        description: "Lead OS analyzes inquiry signals — service type, urgency keywords, location, and historical data — to rank every lead by expected job value.",
        transformation: "From first-in-first-out dispatch to value-ranked calling",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Job value scoring", benefit: "Rank leads by estimated revenue before callback", icon: "💰" },
        { title: "Urgency detection", benefit: "Flag emergency service requests for immediate response", icon: "🚨" },
        { title: "Dispatch integration", benefit: "Works with ServiceTitan, Jobber, and most field service platforms", icon: "📱" },
        { title: "Team routing", benefit: "Automatically assign high-value leads to your best closers", icon: "🎯" },
      ],
      socialProof: {
        headline: "Service companies trust Lead OS",
        testimonials: [
          { quote: "Average job size went up 40% because we started calling the right leads first.", name: "Tom Bell", title: "Owner, Bell HVAC Services", rating: 5 },
          { quote: "Our close rate on high-value jobs jumped to 68% after we started prioritizing with Lead OS.", name: "Angela Brooks", title: "GM, Premier Plumbing", rating: 5 },
          { quote: "I wish I had this 5 years ago. We were leaving thousands on the table every week.", name: "Mike Donovan", title: "Founder, Donovan Electric", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "3.1x", label: "more revenue per lead" },
          { type: "number", value: "3,000+", label: "service companies on Lead OS" },
        ],
      },
      objections: {
        headline: "Service business FAQs",
        faq: [
          { question: "Does it work for residential and commercial service?", answer: "Yes — we have separate scoring models for residential, light commercial, and heavy commercial service." },
          { question: "Will it integrate with our dispatch software?", answer: "We integrate with ServiceTitan, Jobber, Housecall Pro, and FieldEdge out of the box." },
          { question: "Is this suitable for a small team?", answer: "Yes — plans start at $49/month and work for solo operators up to teams of 50+." },
        ],
      },
      finalCta: {
        headline: "Stop chasing low-value jobs",
        subheadline: "Your highest-revenue leads are already in your inbox.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 3,000+ service companies today",
        guarantee: "14-day free trial. No credit card required.",
      },
      footer: SHARED_FOOTER,
    },

    // 11. Legal
    {
      slug: "industry-legal",
      status: "published",
      category: "industry",
      categorySlug: "legal",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#64748b", accentHover: "#94a3b8" },
      meta: {
        title: "Lead OS for Law Firms",
        description: "Convert more consultations into retained clients. Smart intake prioritization.",
      },
      hero: {
        eyebrow: "For Law Firms",
        headline: "Convert more consults into retained clients",
        subheadline: "Lead OS scores every inquiry by case potential so your intake team calls the right prospects first.",
        primaryCta: { text: "Get a free intake audit", url: "/assess" },
        secondaryCta: { text: "Book a demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "2.7x", label: "more retained clients" },
          { type: "stat", value: "48%", label: "less time on unqualified intake" },
          { type: "badge", value: "ABA", label: "Ethics Compliant" },
        ],
      },
      problem: {
        headline: "Legal intake is inefficient and costly",
        painPoints: [
          { scenario: "Your intake team spends hours with prospects who can't afford your fees", emotion: "Frustrated" },
          { scenario: "High-value cases slip through because follow-up was too slow", emotion: "Regretful" },
          { scenario: "You can't triage inquiries by case value before the consultation", emotion: "Overwhelmed" },
        ],
        agitation: "Every missed high-value case is a significant revenue opportunity lost to a faster competitor.",
      },
      solution: {
        headline: "Smart intake prioritization for law firms",
        description: "Lead OS enriches every inquiry with case type, urgency signals, and potential value estimates — so intake prioritizes calls most likely to become retained clients.",
        transformation: "From first-in-first-out to value-based intake",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Case value scoring", benefit: "Estimate potential case value before your first conversation", icon: "⚖️" },
        { title: "Urgency flagging", benefit: "Identify time-sensitive cases that need same-day response", icon: "🚨" },
        { title: "Practice area routing", benefit: "Match inquiries to the right attorney automatically", icon: "🎯" },
        { title: "Intake analytics", benefit: "Track conversion rates by case type and source", icon: "📊" },
      ],
      socialProof: {
        headline: "Law firms trust Lead OS",
        testimonials: [
          { quote: "Our retained client rate went from 22% to 59% of consultations. We finally know who to prioritize.", name: "Rachel Kim, Esq.", title: "Managing Partner, Kim & Associates", rating: 5 },
          { quote: "We stopped taking every consult and started closing the ones that matter. Revenue per partner doubled.", name: "Mark Sullivan", title: "Senior Partner, Sullivan Law Group", rating: 5 },
          { quote: "Lead OS flagged a major case we almost missed because it came in through our web form late on a Friday.", name: "Nina Torres", title: "Intake Director, Apex Legal", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.7x", label: "more retained clients" },
          { type: "number", value: "180+", label: "law firms on Lead OS" },
        ],
      },
      objections: {
        headline: "Law firm FAQs",
        faq: [
          { question: "Does Lead OS comply with attorney advertising rules?", answer: "Yes — our system only scores and prioritizes inquiries. It does not generate client communications." },
          { question: "What practice areas does it support?", answer: "Personal injury, family law, immigration, criminal defense, employment, and business litigation." },
          { question: "Is client data kept confidential?", answer: "Yes — we sign BAAs, use encrypted storage, and never train models on your client data." },
        ],
      },
      finalCta: {
        headline: "Your best cases are already in your inbox",
        subheadline: "Start calling the right ones first.",
        primaryCta: { text: "Get your free intake audit", url: "/assess" },
        urgency: "Audit delivered in 24 hours — claim yours today",
        guarantee: "30-day satisfaction guarantee.",
      },
      footer: SHARED_FOOTER,
    },

    // 12. Health
    {
      slug: "industry-health",
      status: "published",
      category: "industry",
      categorySlug: "health",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#14b8a6", accentHover: "#2dd4bf" },
      meta: {
        title: "Lead OS for Healthcare Practices",
        description: "Fill your patient pipeline. Reduce no-shows with AI intent scoring.",
      },
      hero: {
        eyebrow: "For Healthcare Practices",
        headline: "More booked appointments. Fewer no-shows.",
        subheadline: "Lead OS scores prospective patients by booking intent so your front desk reaches out at exactly the right moment.",
        primaryCta: { text: "Schedule a demo", url: "/demo", subtext: "HIPAA-compliant platform" },
        secondaryCta: { text: "Start free trial", url: "/onboard" },
        trustBar: [
          { type: "stat", value: "38%", label: "more booked appointments" },
          { type: "stat", value: "52%", label: "reduction in no-shows" },
          { type: "badge", value: "HIPAA", label: "Compliant" },
        ],
      },
      problem: {
        headline: "Patient acquisition is expensive and unpredictable",
        painPoints: [
          { scenario: "You spend $150 per lead and half never respond to follow-up", emotion: "Frustrated" },
          { scenario: "Staff manually calls every inquiry with no prioritization system", emotion: "Overwhelmed" },
          { scenario: "No-shows fill your calendar but drain your revenue", emotion: "Resigned" },
        ],
        agitation: "Every unfilled appointment slot costs hundreds in lost revenue.",
      },
      solution: {
        headline: "Intent-based patient prioritization",
        description: "Lead OS scores web inquiries, insurance eligibility requests, and referral leads by booking intent — giving your front desk a prioritized call list every morning.",
        transformation: "From reactive to proactive patient acquisition",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Booking intent scoring", benefit: "Rank inquiries by likelihood to show up and complete treatment", icon: "📅" },
        { title: "Insurance signal analysis", benefit: "Prioritize patients with verified coverage for your services", icon: "🏥" },
        { title: "EHR integration", benefit: "Works with Epic, Athenahealth, Kareo, and more", icon: "🔌" },
        { title: "No-show prediction", benefit: "Flag high-risk appointments for confirmation calls", icon: "⚠️" },
      ],
      socialProof: {
        headline: "Healthcare practices trust Lead OS",
        testimonials: [
          { quote: "Our new patient volume increased 40% without adding a single marketing dollar.", name: "Dr. Keisha Monroe", title: "Practice Owner, Renew Wellness", rating: 5 },
          { quote: "No-shows dropped 52% the quarter we started using Lead OS to predict high-risk appointments.", name: "Patricia Osei", title: "Practice Administrator, SunVale Dental", rating: 5 },
          { quote: "Lead OS gave our front desk a morning call list. They stopped asking what to do first.", name: "Dr. Alan Marsh", title: "Medical Director, ClearView Health", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "38%", label: "more booked appointments" },
          { type: "number", value: "300+", label: "practices on Lead OS" },
        ],
      },
      objections: {
        headline: "Healthcare practice FAQs",
        faq: [
          { question: "Is Lead OS HIPAA compliant?", answer: "Yes — we sign BAAs and our platform meets all HIPAA technical safeguard requirements." },
          { question: "Does it integrate with our EHR?", answer: "We integrate with Epic, Athenahealth, Kareo, and other leading EHR/PM systems." },
          { question: "Can it handle multiple locations?", answer: "Yes — Lead OS supports multi-location practices with separate dashboards per site." },
        ],
      },
      finalCta: {
        headline: "Fill your schedule without more ad spend",
        subheadline: "Your next patient is already in your inbox.",
        primaryCta: { text: "Book a HIPAA-compliant demo", url: "/demo" },
        urgency: "Healthcare specialists available this week only",
        guarantee: "30-day pilot with full refund if targets are not met.",
      },
      footer: SHARED_FOOTER,
    },

    // 13. Tech
    {
      slug: "industry-tech",
      status: "published",
      category: "industry",
      categorySlug: "tech",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#6366f1", accentHover: "#818cf8" },
      meta: {
        title: "Lead OS for Tech Companies",
        description: "AI lead scoring built for B2B tech. Score trials, demos, and enterprise pipeline.",
      },
      hero: {
        eyebrow: "For B2B Tech Companies",
        headline: "Score every trial, demo, and enterprise lead in real time",
        subheadline: "Lead OS integrates with your product, CRM, and marketing stack to give every rep a ranked pipeline — updated live.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        secondaryCta: { text: "See a demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "3.8x", label: "faster deal velocity" },
          { type: "stat", value: "34%", label: "higher quota attainment" },
          { type: "badge", value: "SOC 2", label: "Type II" },
        ],
      },
      problem: {
        headline: "B2B tech sales is hard to scale",
        painPoints: [
          { scenario: "Your reps work hundreds of accounts with no idea which ones will close this quarter", emotion: "Scattered" },
          { scenario: "Product-qualified leads sit in the queue untouched while reps chase enterprise logos", emotion: "Wasteful" },
          { scenario: "Your scoring model is a spreadsheet someone built 3 years ago and no one trusts", emotion: "Flying blind" },
        ],
        agitation: "Without live AI scoring, your best opportunities are invisible until it's too late.",
      },
      solution: {
        headline: "Live AI scoring across your entire funnel",
        description: "Lead OS scores every free trial, demo request, and enterprise prospect using product usage, firmographic, and intent data — updated in real time inside your CRM.",
        transformation: "From static lead lists to a live priority queue",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Product usage scoring", benefit: "Score in-app behavior alongside CRM data for the full picture", icon: "📊" },
        { title: "Enterprise intent detection", benefit: "Know when a target account is actively researching your category", icon: "🔍" },
        { title: "Rep-level priority queues", benefit: "Every rep sees their top 10 accounts to work today", icon: "📋" },
        { title: "Forecast accuracy", benefit: "Predict quarterly attainment 8 weeks out with 90%+ accuracy", icon: "🎯" },
      ],
      socialProof: {
        headline: "B2B tech teams trust Lead OS",
        testimonials: [
          { quote: "Our SDRs doubled their meeting rate in 30 days. They stopped guessing and started calling the accounts Lead OS flagged.", name: "Alicia Torres", title: "CRO, Pinnacle Software", rating: 5 },
          { quote: "We hit 118% of quota last quarter. Lead OS is the only thing that changed.", name: "David Park", title: "VP Sales, Nextera SaaS", rating: 5 },
          { quote: "Lead OS predicted our quarter's closed-won deals with 91% accuracy. My board presentation was the easiest it's ever been.", name: "Sarah Winters", title: "CEO, Vantage Analytics", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "34%", label: "higher quota attainment" },
          { type: "number", value: "700+", label: "B2B tech teams on Lead OS" },
        ],
      },
      objections: {
        headline: "B2B tech FAQs",
        faq: [
          { question: "Does it work for both PLG and sales-led motions?", answer: "Yes — we have separate models for product-led and sales-led growth, or a hybrid model if you run both." },
          { question: "How does it handle enterprise deals with long sales cycles?", answer: "Our enterprise model scores at the account and opportunity level, tracking intent signals over a 6–18 month horizon." },
          { question: "What's the data residency option?", answer: "US, EU, and APAC data residency options are available on all plans." },
        ],
      },
      finalCta: {
        headline: "Give your team a live priority queue",
        subheadline: "Stop working from gut feel. Start working from data.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 700+ B2B tech teams closing more with Lead OS",
        guarantee: "30-day money-back guarantee.",
      },
      footer: SHARED_FOOTER,
    },

    // 14. Construction
    {
      slug: "industry-construction",
      status: "published",
      category: "industry",
      categorySlug: "construction",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#f59e0b", accentHover: "#fbbf24" },
      meta: {
        title: "Lead OS for Construction Companies",
        description: "Win more bids by scoring leads before you invest in estimates.",
      },
      hero: {
        eyebrow: "For Construction Companies",
        headline: "Win more bids without wasting time on low-probability jobs",
        subheadline: "Lead OS scores every project inquiry by bid-win probability so you invest estimate time in the jobs you're most likely to close.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        secondaryCta: { text: "See how it works", url: "#how" },
        trustBar: [
          { type: "stat", value: "2.4x", label: "higher bid win rate" },
          { type: "stat", value: "40%", label: "less time on losing bids" },
          { type: "badge", value: "Mobile", label: "Ready" },
        ],
      },
      problem: {
        headline: "Construction leads waste your estimating capacity",
        painPoints: [
          { scenario: "You spend 8 hours estimating a job and the prospect goes with the cheapest bidder", emotion: "Frustrated" },
          { scenario: "You can't tell which prospects are serious and which are fishing for a number", emotion: "Guessing" },
          { scenario: "Your estimating team is overloaded but win rates are still below 30%", emotion: "Overwhelmed" },
        ],
        agitation: "Every estimate on a low-probability job is a missed opportunity on one you could have won.",
      },
      solution: {
        headline: "Score bids before you invest in estimates",
        description: "Lead OS analyzes project type, client history, budget signals, and relationship strength to score each inquiry by bid-win probability — before you schedule the site visit.",
        transformation: "From estimating everything to winning everything you estimate",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Bid-win probability scoring", benefit: "Know which jobs are worth estimating before you send a team", icon: "🏗️" },
        { title: "Client history analysis", benefit: "Score returning clients and referrals higher automatically", icon: "🔄" },
        { title: "Project type matching", benefit: "Rank leads that match your most profitable project types", icon: "🎯" },
        { title: "Pipeline visibility", benefit: "See your full bid pipeline and win probability in one view", icon: "📊" },
      ],
      socialProof: {
        headline: "Construction companies trust Lead OS",
        testimonials: [
          { quote: "Our bid-to-win rate went from 22% to 58% in one quarter. We just stopped estimating bad leads.", name: "Carlos Mendez", title: "Founder, Mendez General Contracting", rating: 5 },
          { quote: "Lead OS tells me which jobs to prioritize every Monday morning. My estimating team is finally working on the right projects.", name: "Patricia Holt", title: "VP Sales, Summit Construction", rating: 5 },
          { quote: "We reduced estimate volume by 30% and increased closed contracts by 40%. That's the power of scoring.", name: "Jason Reed", title: "Owner, Reed Commercial Builders", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.4x", label: "higher bid win rate" },
          { type: "number", value: "800+", label: "construction companies on Lead OS" },
        ],
      },
      objections: {
        headline: "Construction company FAQs",
        faq: [
          { question: "Does it work for both residential and commercial?", answer: "Yes — we have separate scoring models optimized for residential, commercial, and industrial construction." },
          { question: "Can it integrate with our estimating software?", answer: "We integrate with Buildertrend, ProCore, CoConstruct, and Estimate Rocket." },
          { question: "What if we have a small team?", answer: "Lead OS works for teams of 2 to 200. The scoring is fully automated regardless of team size." },
        ],
      },
      finalCta: {
        headline: "Stop wasting estimates on bad bids",
        subheadline: "Score every lead before you invest in an estimate.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 800+ construction companies today",
        guarantee: "14-day free trial. No credit card required.",
      },
      footer: SHARED_FOOTER,
    },

    // 15. Real Estate
    {
      slug: "industry-real-estate",
      status: "published",
      category: "industry",
      categorySlug: "real-estate",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#0ea5e9", accentHover: "#38bdf8" },
      meta: {
        title: "Lead OS for Real Estate Agents",
        description: "Know which buyers and sellers are ready to close. AI scoring for real estate.",
      },
      hero: {
        eyebrow: "For Real Estate Professionals",
        headline: "Stop chasing cold leads. Start closing warm ones.",
        subheadline: "Lead OS scores every contact by purchase intent so you call the right buyers and sellers first.",
        primaryCta: { text: "Start free trial", url: "/onboard", subtext: "Free 14-day trial" },
        secondaryCta: { text: "See how it works", url: "#how" },
        trustBar: [
          { type: "stat", value: "4.1x", label: "more closings from same leads" },
          { type: "stat", value: "55%", label: "less time on dead-end calls" },
          { type: "badge", value: "NAR", label: "Approved Vendor" },
        ],
      },
      problem: {
        headline: "Real estate prospecting is broken",
        painPoints: [
          { scenario: "You call 100 leads and only 3 are actually ready to buy or sell", emotion: "Frustrated" },
          { scenario: "Hot leads go cold because you followed up too late", emotion: "Regretful" },
          { scenario: "You can't tell which portal leads are serious and which are just browsing", emotion: "Confused" },
        ],
        agitation: "Every missed hot lead is a commission someone else is earning.",
      },
      solution: {
        headline: "Behavioral scoring built for real estate",
        description: "Lead OS tracks listing views, mortgage calculator usage, and neighborhood searches to score every lead on true buying or selling intent.",
        transformation: "From cold calling to warm conversations",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Buyer intent scoring", benefit: "Know which buyers are close to making an offer", icon: "🏠" },
        { title: "Seller readiness scoring", benefit: "Identify homeowners who are likely to list soon", icon: "🔑" },
        { title: "Portal lead scoring", benefit: "Rank Zillow, Realtor.com, and direct leads by quality", icon: "📱" },
        { title: "Follow-up triggers", benefit: "Get notified when a cold lead's score spikes", icon: "🔔" },
      ],
      socialProof: {
        headline: "Real estate agents trust Lead OS",
        testimonials: [
          { quote: "I closed 4 extra deals last month just by calling my highest-scored leads first.", name: "Sarah Williams", title: "Top Producer, Keller Williams", rating: 5 },
          { quote: "Lead OS paid for a year's subscription with the first deal I closed using it.", name: "Robert Chen", title: "Team Lead, Compass", rating: 5 },
          { quote: "I stopped burning time on portal leads that were just browsing. My hours are finally focused.", name: "Denise Murray", title: "Independent Agent, RE/MAX", rating: 5 },
        ],
        stats: [
          { type: "number", value: "4.1x", label: "more closings on average" },
          { type: "number", value: "2,500+", label: "agents on Lead OS" },
        ],
      },
      objections: {
        headline: "Real estate agent FAQs",
        faq: [
          { question: "Does Lead OS work with my MLS or portal leads?", answer: "Yes — we integrate with Zillow, Realtor.com, and most CRM platforms used by agents." },
          { question: "How quickly will I see results?", answer: "Most agents report better conversations within their first week of use." },
          { question: "Can I use it for both buyer and seller leads?", answer: "Yes — we have separate scoring models for buyer intent and seller readiness." },
        ],
      },
      finalCta: {
        headline: "Close more deals without more leads",
        subheadline: "Your next commission is already in your database.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 2,500+ top producers today",
        guarantee: "No contract. Cancel anytime.",
      },
      footer: SHARED_FOOTER,
    },

    // 16. Education
    {
      slug: "industry-education",
      status: "published",
      category: "industry",
      categorySlug: "education",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#10b981", accentHover: "#34d399" },
      meta: {
        title: "Lead OS for Education & EdTech",
        description: "Convert more enrollment inquiries. AI scoring for education providers.",
      },
      hero: {
        eyebrow: "For Education & EdTech",
        headline: "Turn course inquiries into enrolled students",
        subheadline: "Lead OS scores every prospective student by enrollment intent so your admissions team reaches out at exactly the right moment.",
        primaryCta: { text: "See enrollment lift in action", url: "/demo" },
        secondaryCta: { text: "Start free trial", url: "/onboard" },
        trustBar: [
          { type: "stat", value: "3.4x", label: "higher enrollment rate" },
          { type: "stat", value: "50%", label: "less time on low-intent inquiries" },
          { type: "badge", value: "FERPA", label: "Compliant" },
        ],
      },
      problem: {
        headline: "Enrollment is leaving money on the table",
        painPoints: [
          { scenario: "Thousands of inquiries sit unworked because you can't prioritize them", emotion: "Overwhelmed" },
          { scenario: "Generic email drip sequences convert less than 3% of prospects", emotion: "Frustrated" },
          { scenario: "You can't tell who is comparison shopping vs. ready to enroll right now", emotion: "Guessing" },
        ],
        agitation: "Every un-worked high-intent inquiry is tuition revenue going to a competitor.",
      },
      solution: {
        headline: "Enrollment intelligence for every inquiry",
        description: "Lead OS analyzes content engagement, program page visits, and form behavior to score each prospect on enrollment readiness — giving admissions a prioritized outreach list every morning.",
        transformation: "From generic drip to personalized enrollment journeys",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Enrollment readiness scoring", benefit: "Rank prospects by likelihood to enroll this cycle", icon: "🎓" },
        { title: "Program affinity detection", benefit: "Identify which program each prospect is most interested in", icon: "📚" },
        { title: "Admissions CRM sync", benefit: "Works with Salesforce, HubSpot, and education-specific CRMs", icon: "🔌" },
        { title: "Scholarship matching", benefit: "Flag financial aid-eligible prospects for targeted outreach", icon: "💰" },
      ],
      socialProof: {
        headline: "Education providers trust Lead OS",
        testimonials: [
          { quote: "We increased enrolled students by 34% without increasing our marketing budget.", name: "Brenda Walsh", title: "VP Enrollment, AcademyPro", rating: 5 },
          { quote: "Our admissions team used to call everyone. Now they call the top 20 each morning and close 3x more.", name: "James Liu", title: "Director of Admissions, TechPath Institute", rating: 5 },
          { quote: "Lead OS showed us which program pages were driving real enrollment intent. We doubled our paid ads to those pages.", name: "Sophie Green", title: "CMO, LearnNow", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "3.4x", label: "higher enrollment rate" },
          { type: "number", value: "350+", label: "education providers on Lead OS" },
        ],
      },
      objections: {
        headline: "Education provider FAQs",
        faq: [
          { question: "Is Lead OS FERPA compliant?", answer: "Yes — we are designed for FERPA compliance with student data handled under strict access controls." },
          { question: "Does it work for both B2C and B2B EdTech?", answer: "Yes — we support both consumer enrollment journeys and corporate training procurement flows." },
          { question: "Can it integrate with our student information system?", answer: "We integrate with Ellucian, Slate, Salesforce Education Cloud, and most SIS platforms." },
        ],
      },
      finalCta: {
        headline: "Fill every cohort with the right students",
        subheadline: "Your next enrollment is already in your inquiry list.",
        primaryCta: { text: "Book a demo", url: "/demo" },
        urgency: "Enrollment specialists available this week",
        guarantee: "30-day performance guarantee.",
      },
      footer: SHARED_FOOTER,
    },

    // 17. Finance
    {
      slug: "industry-finance",
      status: "published",
      category: "industry",
      categorySlug: "finance",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#f97316", accentHover: "#fb923c" },
      meta: {
        title: "Lead OS for Financial Services",
        description: "Reach financial prospects in their buying window. AI intent scoring for finance.",
      },
      hero: {
        eyebrow: "For Financial Services",
        headline: "Stop cold-calling. Start having warm conversations.",
        subheadline: "Lead OS identifies which prospects are actively looking for your financial product so you reach out at exactly the right moment.",
        primaryCta: { text: "Get a free intent report", url: "/assess", subtext: "No commitment required" },
        secondaryCta: { text: "Book a demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "3.6x", label: "higher application rate" },
          { type: "stat", value: "44%", label: "shorter sales cycle" },
          { type: "badge", value: "SOC 2", label: "Type II" },
        ],
      },
      problem: {
        headline: "Financial lead generation is broken",
        painPoints: [
          { scenario: "You pay $400 per lead and most are just rate shopping", emotion: "Frustrated" },
          { scenario: "Compliance prevents you from reaching out too aggressively", emotion: "Constrained" },
          { scenario: "You always seem to call too early or too late to catch the buying window", emotion: "Defeated" },
        ],
        agitation: "The best financial prospects are active for just a few days — miss that window and they go to a competitor.",
      },
      solution: {
        headline: "Intent signals built for financial services",
        description: "Lead OS tracks content consumption, comparison behavior, and application signals to score each prospect on timing and fit so you always reach out when it matters most.",
        transformation: "From random outreach to perfect timing",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Buying window detection", benefit: "Know when a prospect is actively shopping right now", icon: "⏰" },
        { title: "Compliance guardrails", benefit: "Stay within FINRA, RESPA, and TCPA guidelines automatically", icon: "⚖️" },
        { title: "Product-fit scoring", benefit: "Match each prospect to the right financial product for their situation", icon: "🎯" },
        { title: "Cross-sell identification", benefit: "Find existing clients ready for additional products", icon: "🔄" },
      ],
      socialProof: {
        headline: "Financial teams see fast ROI",
        testimonials: [
          { quote: "Our mortgage team's funded loan rate doubled in one quarter.", name: "Tom Reeves", title: "Branch Manager, Summit Mortgage", rating: 5 },
          { quote: "We stopped buying leads from aggregators and started using Lead OS to identify who in our database was in-market. Revenue per rep went up 3x.", name: "Dana Foster", title: "VP Sales, ClearWealth Advisors", rating: 5 },
          { quote: "The compliance features alone saved us from two potential regulatory issues last year.", name: "Michael Chang", title: "CCO, Apex Financial", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "3.6x", label: "higher application rate" },
          { type: "number", value: "250+", label: "financial firms on Lead OS" },
        ],
      },
      objections: {
        headline: "Financial services FAQs",
        faq: [
          { question: "Is Lead OS compliant with financial regulations?", answer: "Our platform is designed around FINRA, RESPA, and TCPA compliance requirements. We don't store regulated data on our servers." },
          { question: "Can I use Lead OS for both acquisition and retention?", answer: "Yes — Lead OS scores new prospects for acquisition and existing clients for cross-sell and retention risk." },
          { question: "What lines of business are supported?", answer: "Mortgage, financial planning, insurance, banking, and investment management all have dedicated scoring models." },
        ],
      },
      finalCta: {
        headline: "Reach the right prospects at the perfect moment",
        subheadline: "Timing is your competitive advantage.",
        primaryCta: { text: "Get your free intent report", url: "/assess" },
        urgency: "Report delivered in 24 hours — claim yours today",
        guarantee: "60-day performance guarantee or full refund.",
      },
      footer: SHARED_FOOTER,
    },

    // 18. Franchise
    {
      slug: "industry-franchise",
      status: "published",
      category: "industry",
      categorySlug: "franchise",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#ec4899", accentHover: "#f472b6" },
      meta: {
        title: "Lead OS for Franchise Development",
        description: "Score franchisee candidates before the discovery day. Award more units faster.",
      },
      hero: {
        eyebrow: "For Franchise Development",
        headline: "Award more franchise units to the right candidates",
        subheadline: "Lead OS scores every franchisee inquiry by financial qualification, operator fit, and purchase intent — so your FDC focuses on candidates who will close.",
        primaryCta: { text: "Schedule a development demo", url: "/demo" },
        secondaryCta: { text: "Download the case study", url: "/resources" },
        trustBar: [
          { type: "stat", value: "3.3x", label: "more units awarded per FDC" },
          { type: "stat", value: "62%", label: "less time on unqualified candidates" },
          { type: "badge", value: "FDD", label: "Workflow Ready" },
        ],
      },
      problem: {
        headline: "Franchise development is a slow, manual process",
        painPoints: [
          { scenario: "Your FDC spends 5 hours with a candidate who can't meet the minimum liquid capital requirement", emotion: "Frustrated" },
          { scenario: "High-intent candidates go cold while your team is tied up with information-seekers", emotion: "Regretful" },
          { scenario: "You have no way to predict which inquiries will reach the discovery day stage", emotion: "Blind" },
        ],
        agitation: "Every hour your FDC spends on an unqualified candidate is a unit not awarded.",
      },
      solution: {
        headline: "Score franchisee candidates before discovery day",
        description: "Lead OS analyzes capital signals, operator background, and engagement patterns to score every FDD inquiry by qualification and close probability — before your first call.",
        transformation: "From development pipeline chaos to a ranked candidate queue",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Financial qualification scoring", benefit: "Identify candidates with sufficient liquid capital before first contact", icon: "💰" },
        { title: "Operator fit analysis", benefit: "Match candidate backgrounds to your ideal owner profile", icon: "🧩" },
        { title: "Pipeline stage tracking", benefit: "Track every candidate from inquiry to franchise agreement", icon: "📊" },
        { title: "FDD workflow integration", benefit: "Works with your existing FDD and CRM process", icon: "🔌" },
      ],
      socialProof: {
        headline: "Franchise development teams trust Lead OS",
        testimonials: [
          { quote: "Our FDC now closes 3x more units per quarter working the same number of leads.", name: "Mark Patterson", title: "VP Franchise Development, GreenThumb Networks", rating: 5 },
          { quote: "We stopped wasting discovery days on candidates who couldn't qualify. Lead OS identified that in the first scoring step.", name: "Christine Yuen", title: "Director, FastFit Franchise", rating: 5 },
          { quote: "Lead OS paid for itself with the first unit we awarded to a candidate it flagged as high-intent.", name: "Raymond Beck", title: "Franchise Development Manager, SunShine Services", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "3.3x", label: "more units per FDC" },
          { type: "number", value: "120+", label: "franchise brands on Lead OS" },
        ],
      },
      objections: {
        headline: "Franchise development FAQs",
        faq: [
          { question: "Does Lead OS work with our existing FDD and CRM?", answer: "Yes — we integrate with FranConnect, Salesforce, and all major franchise CRM platforms." },
          { question: "How does it assess financial qualification?", answer: "We use proxy signals — form behavior, territory interest, and engagement depth — to estimate qualification. We don't access financial accounts." },
          { question: "Can it handle multi-brand development teams?", answer: "Yes — Lead OS supports multi-brand organizations with separate scoring models per brand." },
        ],
      },
      finalCta: {
        headline: "Award more units without adding FDC headcount",
        subheadline: "Score every candidate before your first call.",
        primaryCta: { text: "Schedule a development demo", url: "/demo" },
        urgency: "Franchise development specialists available this week",
        guarantee: "30-day pilot with contractual performance targets.",
      },
      footer: SHARED_FOOTER,
    },

    // 19. Staffing
    {
      slug: "industry-staffing",
      status: "published",
      category: "industry",
      categorySlug: "staffing",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#06b6d4", accentHover: "#22d3ee" },
      meta: {
        title: "Lead OS for Staffing Agencies",
        description: "Score candidates and client leads simultaneously. Fill positions faster.",
      },
      hero: {
        eyebrow: "For Staffing Agencies",
        headline: "Fill positions faster by scoring both sides of the market",
        subheadline: "Lead OS scores client leads by hiring urgency and candidates by placement readiness — so your team works both sides of the market with precision.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        secondaryCta: { text: "See a demo", url: "/demo" },
        trustBar: [
          { type: "stat", value: "2.8x", label: "faster time-to-fill" },
          { type: "stat", value: "58%", label: "more placements per recruiter" },
          { type: "badge", value: "ATS", label: "Agnostic" },
        ],
      },
      problem: {
        headline: "Staffing is a dual-sided marketplace problem",
        painPoints: [
          { scenario: "Your recruiters can't tell which client job orders are urgent vs. exploratory", emotion: "Scattered" },
          { scenario: "Candidates in your database go stale because you have no signal on who is actively looking", emotion: "Wasteful" },
          { scenario: "High-fee placements get treated the same as low-margin ones in the queue", emotion: "Inefficient" },
        ],
        agitation: "Every low-urgency job order worked ahead of a critical placement is revenue lost and a client disappointed.",
      },
      solution: {
        headline: "Score clients and candidates simultaneously",
        description: "Lead OS scores client job orders by urgency and fee potential, and candidate records by placement readiness — giving your team a dual-ranked priority list every morning.",
        transformation: "From reactive to proactive — on both sides of the market",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Job order urgency scoring", benefit: "Know which client positions must be filled this week", icon: "🚨" },
        { title: "Candidate readiness scoring", benefit: "Identify which database candidates are actively looking right now", icon: "👤" },
        { title: "Match scoring", benefit: "Score candidate-to-job fit before you make the call", icon: "🎯" },
        { title: "ATS integration", benefit: "Works with Bullhorn, JobDiva, Crelate, and most major ATS platforms", icon: "🔌" },
      ],
      socialProof: {
        headline: "Staffing agencies trust Lead OS",
        testimonials: [
          { quote: "Placements per recruiter went up 58% in 60 days. Lead OS tells them who to call on both sides.", name: "Karen Webb", title: "President, Catalyst Staffing", rating: 5 },
          { quote: "We stopped working low-priority orders and started hitting the urgent ones first. Our client satisfaction score jumped 20 points.", name: "Paul Nguyen", title: "VP Operations, ProStaff Solutions", rating: 5 },
          { quote: "Our database has 80,000 candidates. Lead OS helped us find the 200 who were ready to work right now.", name: "Trisha Okafor", title: "Director of Recruiting, TalentBridge", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.8x", label: "faster time-to-fill" },
          { type: "number", value: "400+", label: "staffing agencies on Lead OS" },
        ],
      },
      objections: {
        headline: "Staffing agency FAQs",
        faq: [
          { question: "Does Lead OS work with our ATS?", answer: "We integrate with Bullhorn, JobDiva, Crelate, Avionte, and most major ATS platforms." },
          { question: "Can it score both temp and perm placements?", answer: "Yes — we have separate scoring models for temporary, contract, direct hire, and executive search." },
          { question: "Is candidate data handled compliantly?", answer: "Yes — we adhere to GDPR Article 6 and EEOC guidelines for candidate data processing." },
        ],
      },
      finalCta: {
        headline: "Work smarter on both sides of the market",
        subheadline: "Score every job order and every candidate.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 400+ staffing agencies already filling faster",
        guarantee: "14-day free trial. No ATS required to start.",
      },
      footer: SHARED_FOOTER,
    },

    // 20. Faith
    {
      slug: "industry-faith",
      status: "published",
      category: "industry",
      categorySlug: "faith",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#8b5cf6", accentHover: "#a78bfa" },
      meta: {
        title: "Lead OS for Faith Organizations",
        description: "Identify and engage your most connected visitors. Grow your congregation.",
      },
      hero: {
        eyebrow: "For Faith Organizations",
        headline: "Connect with your most engaged visitors before they drift away",
        subheadline: "Lead OS scores every first-time visitor and online inquiry by engagement potential so your team reaches out at the most meaningful moment.",
        primaryCta: { text: "See a ministry demo", url: "/demo" },
        secondaryCta: { text: "Start free trial", url: "/onboard" },
        trustBar: [
          { type: "stat", value: "2.6x", label: "higher visitor retention" },
          { type: "stat", value: "48%", label: "more connection card follow-through" },
          { type: "badge", value: "Church-Friendly", label: "Pricing" },
        ],
      },
      problem: {
        headline: "First-time visitor follow-up is missed too often",
        painPoints: [
          { scenario: "You collect connection cards but follow-up is inconsistent and often too late", emotion: "Frustrated" },
          { scenario: "Online visitors engage with your content but you have no way to identify who is searching", emotion: "Blind" },
          { scenario: "Your staff and volunteers are stretched too thin to follow up with everyone personally", emotion: "Overwhelmed" },
        ],
        agitation: "A visitor who doesn't hear from you within 48 hours is unlikely to return.",
      },
      solution: {
        headline: "Prioritize the visitors most likely to connect deeply",
        description: "Lead OS scores first-time visitors, online inquiries, and event attendees by engagement potential — so your team makes the most impactful follow-up calls first.",
        transformation: "From scattered follow-up to intentional connection",
      },
      howItWorks: {
        headline: "Three steps to deeper community connection",
        steps: [
          { number: 1, title: "Capture engagement signals", description: "Sync connection cards, online forms, and event attendance into Lead OS.", icon: "📋" },
          { number: 2, title: "Score for connection potential", description: "AI ranks visitors by likelihood to become long-term members.", icon: "❤️" },
          { number: 3, title: "Follow up with purpose", description: "Your team contacts the highest-priority visitors first with a personalized message.", icon: "📞" },
        ],
      },
      features: [
        { title: "Visitor engagement scoring", benefit: "Rank first-time visitors by connection potential", icon: "🌟" },
        { title: "Connection card sync", benefit: "Automatically import and score paper and digital connection cards", icon: "📋" },
        { title: "Online visitor identification", benefit: "Score anonymous web visitors who engage with your content", icon: "🌐" },
        { title: "Volunteer-friendly dashboard", benefit: "Simple prioritized call list any volunteer can use", icon: "🙏" },
      ],
      socialProof: {
        headline: "Faith communities trust Lead OS",
        testimonials: [
          { quote: "First-time visitor retention went from 18% to 47% in one season. We finally know who to call first.", name: "Pastor David Kim", title: "Senior Pastor, Grace Fellowship", rating: 5 },
          { quote: "Our connection team used to call everyone the same way. Now they prioritize and the conversations are so much more meaningful.", name: "Amy Rodriguez", title: "Guest Experience Director, City Church", rating: 5 },
          { quote: "Lead OS helped us identify the online visitors who were ready for a personal conversation. We had no idea how many there were.", name: "Brother James Osei", title: "Community Pastor, New Life Ministries", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.6x", label: "higher visitor retention" },
          { type: "number", value: "500+", label: "faith communities on Lead OS" },
        ],
      },
      objections: {
        headline: "Faith organization FAQs",
        faq: [
          { question: "Is this appropriate for a church or ministry context?", answer: "Yes — Lead OS for faith communities is specifically designed to support pastoral care, not sales. The language and workflows reflect that difference." },
          { question: "Can small congregations afford it?", answer: "Yes — faith community pricing starts at $29/month with discounts for congregations under 200 members." },
          { question: "Does it work with our church management software?", answer: "We integrate with Planning Center, Breeze, Church Community Builder, and most major ChMS platforms." },
        ],
      },
      finalCta: {
        headline: "Connect with the people who are searching for community",
        subheadline: "Every visitor matters. Reach the right ones first.",
        primaryCta: { text: "See a ministry demo", url: "/demo" },
        urgency: "Ministry specialists available for this week's demos",
        guarantee: "30-day free trial for qualifying faith organizations.",
      },
      footer: SHARED_FOOTER,
    },

    // 21. Creative
    {
      slug: "industry-creative",
      status: "published",
      category: "industry",
      categorySlug: "creative",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#ec4899", accentHover: "#f472b6" },
      meta: {
        title: "Lead OS for Creative Professionals",
        description: "Stop pitching the wrong clients. AI scoring for designers and creatives.",
      },
      hero: {
        eyebrow: "For Creative Professionals",
        headline: "Stop pitching clients who will undervalue your work",
        subheadline: "Lead OS scores every inquiry by budget fit and project alignment so you only spend time on clients who value what you do.",
        primaryCta: { text: "Start free trial", url: "/onboard", subtext: "14 days free" },
        secondaryCta: { text: "See how it works", url: "#how" },
        trustBar: [
          { type: "stat", value: "2.9x", label: "higher average project value" },
          { type: "stat", value: "70%", label: "fewer bad-fit client engagements" },
          { type: "badge", value: "Creative-First", label: "Design" },
        ],
      },
      problem: {
        headline: "Creative clients drain your energy",
        painPoints: [
          { scenario: "You spend 3 hours on a proposal for a client who then asks for a 60% discount", emotion: "Deflated" },
          { scenario: "Your best work goes to clients who can't appreciate or pay for it", emotion: "Undervalued" },
          { scenario: "Bad-fit projects monopolize your calendar and block great opportunities", emotion: "Stuck" },
        ],
        agitation: "Every bad-fit client that takes your best hours is a great client you couldn't serve.",
      },
      solution: {
        headline: "Filter for clients who match your value",
        description: "Lead OS scores every inquiry on budget signals, project scope, and creative alignment — so you instantly know whether a new client is worth pursuing.",
        transformation: "From taking whatever comes in to choosing only ideal clients",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "Budget signal analysis", benefit: "Identify clients with budgets that match your rates before the intro call", icon: "💰" },
        { title: "Project scope scoring", benefit: "Rank projects by creative challenge and strategic value", icon: "🎨" },
        { title: "Client longevity prediction", benefit: "Score leads by likelihood to become repeat clients", icon: "🔄" },
        { title: "Portfolio fit matching", benefit: "Flag inquiries that align with the work you want to showcase", icon: "🖼️" },
      ],
      socialProof: {
        headline: "Creative professionals trust Lead OS",
        testimonials: [
          { quote: "Average project value went from $4k to $11k in 6 months. I just stopped saying yes to everything.", name: "Chloe Martin", title: "Brand Designer, Studio Chloe", rating: 5 },
          { quote: "Lead OS helped me identify which inquiry types always turn into nightmare clients. I avoid them now.", name: "Jordan Yates", title: "Freelance Art Director", rating: 5 },
          { quote: "I doubled my rates and got better clients. Lead OS showed me which leads would value the work.", name: "Priya Anand", title: "UX Designer & Founder, Pixel North", rating: 5 },
        ],
        stats: [
          { type: "percentage", value: "2.9x", label: "higher avg. project value" },
          { type: "number", value: "5,000+", label: "creative professionals on Lead OS" },
        ],
      },
      objections: {
        headline: "Creative professional FAQs",
        faq: [
          { question: "Will this work for a solo freelancer?", answer: "Yes — Lead OS is designed for individual creatives. Setup takes 10 minutes and there are no complex integrations required." },
          { question: "Does it integrate with my website inquiry form?", answer: "Yes — we connect to Typeform, Gravity Forms, and most contact form tools via Zapier or direct integration." },
          { question: "Can it help me spot clients who will be difficult to work with?", answer: "Yes — our bad-fit scoring model flags inquiry patterns that historically lead to scope creep and late payment." },
        ],
      },
      finalCta: {
        headline: "Build a practice of ideal clients only",
        subheadline: "Your time is too valuable to spend on bad-fit projects.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 5,000+ creative professionals today",
        guarantee: "14-day free trial. No credit card required.",
      },
      footer: SHARED_FOOTER,
    },

    // 22. General
    {
      slug: "industry-general",
      status: "published",
      category: "industry",
      categorySlug: "general",
      createdAt: ts(),
      updatedAt: ts(),
      theme: { variant: "dark", accent: "#6366f1", accentHover: "#818cf8" },
      meta: {
        title: "Lead OS | AI Lead Scoring for Any Business",
        description: "AI lead scoring that works for any industry. Know which leads to call first.",
      },
      hero: {
        eyebrow: "For Any Business",
        headline: "Know which leads to call first — in any industry",
        subheadline: "Lead OS uses AI to score every lead by conversion probability so your team always works the highest-value opportunities first.",
        primaryCta: { text: "Start free trial", url: "/onboard", subtext: "No credit card required" },
        secondaryCta: { text: "See how it works", url: "#how" },
        trustBar: [
          { type: "stat", value: "10,000+", label: "businesses on Lead OS" },
          { type: "stat", value: "3.2x", label: "avg. conversion rate lift" },
          { type: "badge", value: "SOC 2", label: "Compliant" },
        ],
      },
      problem: {
        headline: "Most businesses treat all leads equally",
        painPoints: [
          { scenario: "Your team spends equal time on every lead regardless of how likely they are to close", emotion: "Inefficient" },
          { scenario: "You can't tell which leads are hot and which will waste your team's time", emotion: "Frustrated" },
          { scenario: "Pipeline reviews surprise you every quarter because there is no early signal", emotion: "Blindsided" },
        ],
        agitation: "Without scoring, every hour spent on the wrong lead is an hour not spent on the right one.",
      },
      solution: {
        headline: "AI that tells you who to call right now",
        description: "Lead OS learns your ideal customer profile from your historical data and scores every new lead in real time — so your team always has a ranked priority list to work from.",
        transformation: "From equal treatment to intelligent prioritization",
      },
      howItWorks: SHARED_HOW_IT_WORKS,
      features: [
        { title: "AI lead scoring", benefit: "Every lead gets a score from 0 to 100 based on conversion probability", icon: "🎯" },
        { title: "CRM integration", benefit: "Scores live inside your existing CRM — no new tool to learn", icon: "🔌" },
        { title: "Custom ICP training", benefit: "Model trained on your wins and losses, not generic benchmarks", icon: "🧠" },
        { title: "Real-time updates", benefit: "Scores refresh as new signals come in throughout the day", icon: "⚡" },
      ],
      socialProof: {
        headline: "Businesses across every industry trust Lead OS",
        testimonials: [
          { quote: "We tried three lead scoring tools. Lead OS is the only one that actually improved our close rate.", name: "Marcus Bell", title: "Owner, Bell Home Services", rating: 5 },
          { quote: "Our sales team went from working every lead to working the right leads. Revenue per rep went up 2.4x.", name: "Sandra Kim", title: "VP Sales, Centrix B2B", rating: 5 },
          { quote: "Setup was 20 minutes. Results showed up in week one. I've never seen a tool pay for itself that fast.", name: "Derek Walsh", title: "Founder, Walsh Consulting Group", rating: 5 },
        ],
        stats: [
          { type: "number", value: "10,000+", label: "businesses on Lead OS" },
          { type: "percentage", value: "3.2x", label: "avg. conversion rate lift" },
        ],
      },
      objections: {
        headline: "General FAQs",
        faq: [
          { question: "Does Lead OS work for my industry?", answer: "Yes — Lead OS has been deployed in 50+ industries. If you close deals, Lead OS can score your leads." },
          { question: "How long until we see results?", answer: "Most teams see a measurable lift in close rate within the first two weeks of use." },
          { question: "Do we need to change our sales process?", answer: "No — Lead OS adds a scoring layer to your existing process. No workflow changes required." },
        ],
      },
      finalCta: {
        headline: "Work smarter. Close more.",
        subheadline: "Join 10,000+ businesses that stopped treating all leads equally.",
        primaryCta: { text: "Start free trial", url: "/onboard" },
        urgency: "Join 10,000+ businesses already scoring smarter",
        guarantee: "30-day money-back guarantee. No long-term contracts.",
      },
      footer: SHARED_FOOTER,
    },
  ];
}
