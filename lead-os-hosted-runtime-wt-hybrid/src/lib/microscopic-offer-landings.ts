import { nicheCatalog } from "./catalog.ts";
import { GTM_USE_CASES } from "../config/gtm-use-cases.ts";
import { buildDefaultFunnelGraphs } from "./funnel-library.ts";
import { liveDeliverables } from "./live-deliverables.ts";
import {
  getPackageAudienceContract,
  getPackagePlanNames,
  provisionablePackages,
  type PackageSlug,
} from "./package-catalog.ts";
import { getPackagePersonaBlueprint } from "./package-persona-blueprints.ts";
import { publicPlans } from "./public-offer.ts";

export type MicroscopicOfferCategory =
  | "Primary package"
  | "Deliverable module"
  | "Vertical wrapper"
  | "Funnel blueprint"
  | "GTM play"
  | "Commercial plan";

export interface MicroscopicOfferLanding {
  slug: string;
  sourceSlug: string;
  category: MicroscopicOfferCategory;
  title: string;
  eyebrow: string;
  persona: string;
  decisionMaker: string;
  endUser: string;
  message: string;
  painPoints: string[];
  expectedOutcome: string;
  deliveryShape: string[];
  proof: string[];
  sourcePath: string;
  primaryCtaHref: string;
  secondaryCtaHref: string;
}

function landingSlug(category: string, slug: string): string {
  return `${category}-${slug}`;
}

function packageLandings(): MicroscopicOfferLanding[] {
  return provisionablePackages.map((pkg) => {
    const persona = getPackagePersonaBlueprint(pkg.slug);
    const audience = getPackageAudienceContract(pkg);

    return {
      slug: landingSlug("package", pkg.slug),
      sourceSlug: pkg.slug,
      category: "Primary package",
      title: pkg.title,
      eyebrow: "Complete productized solution",
      persona: persona.offerFor,
      decisionMaker: persona.decisionMaker,
      endUser: persona.residentPersona,
      message: persona.messaging,
      painPoints: persona.residentPainPoints,
      expectedOutcome: persona.expectedOutcome,
      deliveryShape: persona.deliveryShape,
      proof: [
        `${pkg.deliverables.length} customer-ready outputs defined in the package catalog.`,
        `Audience model: ${audience.model}. ${audience.summary}`,
        `Available on: ${getPackagePlanNames(pkg)}.`,
        persona.verificationPosture,
      ],
      sourcePath: `/packages/${pkg.slug}`,
      primaryCtaHref: `/packages/${pkg.slug}`,
      secondaryCtaHref: "/packages",
    };
  });
}

function deliverableLandings(): MicroscopicOfferLanding[] {
  return liveDeliverables.map((item) => ({
    slug: landingSlug("deliverable", item.slug),
    sourceSlug: item.slug,
    category: "Deliverable module",
    title: item.title,
    eyebrow: "Standalone module",
    persona: item.audienceSummary,
    decisionMaker:
      item.audienceModel === "B2B"
        ? "Operator, client stakeholder, agency owner, or internal team lead."
        : "Business owner, agency operator, growth lead, or client team buying a customer-facing module.",
    endUser:
      item.audienceModel === "B2B"
        ? "Internal operators and client teams who need visibility, readiness, or support."
        : "The client's lead, visitor, customer, buyer, patient, prospect, or marketplace participant.",
    message: `Install ${item.title.toLowerCase()} so the buyer gets ${item.buyerOutcome.toLowerCase()}`,
    painPoints: [
      "The buyer needs this specific capability without buying a vague platform.",
      "The current process is either manual, untracked, or scattered across disconnected systems.",
      "The end user needs a clear next step instead of a confusing handoff.",
      "The operator needs evidence that the module exists, works, and has acceptance criteria.",
    ],
    expectedOutcome: item.buyerOutcome,
    deliveryShape: [item.deliveredArtifact, ...item.acceptanceCriteria],
    proof: [item.backendReality, `Live proof route: ${item.livePath}.`, `Audience model: ${item.audienceModel}.`],
    sourcePath: item.livePath,
    primaryCtaHref: item.livePath,
    secondaryCtaHref: "/deliverables",
  }));
}

function verticalLandings(): MicroscopicOfferLanding[] {
  return Object.values(nicheCatalog).map((niche) => ({
    slug: landingSlug("vertical", niche.slug),
    sourceSlug: niche.slug,
    category: "Vertical wrapper",
    title: `${niche.label} solution landing`,
    eyebrow: "Market-specific offer wrapper",
    persona: `${niche.summary} Built for teams that need a niche-specific path instead of generic automation copy.`,
    decisionMaker: verticalDecisionMaker(niche.slug),
    endUser: verticalEndUser(niche.slug),
    message: `Launch ${niche.label.toLowerCase()} solutions that speak directly to the market's buying pressure, compliance needs, and conversion path.`,
    painPoints: verticalPainPoints(niche.slug),
    expectedOutcome: `${niche.assessmentTitle}, recommended funnel path, directory positioning, resource page, and niche-specific offer page aligned around ${niche.calculatorBias} impact.`,
    deliveryShape: [
      `/offers/${niche.slug}`,
      `/industries/${niche.slug}`,
      `/assess/${niche.slug}`,
      `/resources/${niche.slug}`,
      `/directory/${niche.slug}`,
      `Recommended funnels: ${niche.recommendedFunnels.join(", ")}.`,
    ],
    proof: [
      "Backed by `nicheCatalog` so all listed routes use a real catalog slug.",
      `Assessment title: ${niche.assessmentTitle}.`,
      `Calculator bias: ${niche.calculatorBias}.`,
    ],
    sourcePath: `/offers/${niche.slug}`,
    primaryCtaHref: `/offers/${niche.slug}`,
    secondaryCtaHref: `/industries/${niche.slug}`,
  }));
}

function funnelLandings(): MicroscopicOfferLanding[] {
  const funnels = Object.values(buildDefaultFunnelGraphs("solution-landing"));

  return funnels.map((funnel) => ({
    slug: landingSlug("funnel", funnel.family),
    sourceSlug: funnel.family,
    category: "Funnel blueprint",
    title: funnel.name,
    eyebrow: "Funnel landing page",
    persona: `Operators and client businesses that need a ${funnel.goal} funnel with a defined path from first touch to next action.`,
    decisionMaker: "Founder, marketer, agency operator, sales leader, funnel builder, or client success owner.",
    endUser: "Prospects, leads, buyers, applicants, customers, subscribers, or members moving through the funnel.",
    message: `Use this ${funnel.name.toLowerCase()} when the buyer needs a measurable ${funnel.goal} path instead of disconnected pages and follow-up.`,
    painPoints: [
      "Traffic reaches the business but does not move through a defined conversion path.",
      "The handoff between education, capture, qualification, offer, and follow-up is unclear.",
      "Operators cannot see which stage is supposed to create the next action.",
      "The customer experience feels improvised instead of intentional.",
    ],
    expectedOutcome: `A runtime-ready ${funnel.name} with ${funnel.nodes.length} ordered stages, ${funnel.edges.length} transitions, measurable goal '${funnel.goal}', and default channel handoff rules.`,
    deliveryShape: [
      ...funnel.nodes.map((node) => `${node.name} (${node.purpose})`),
      `Goal: ${funnel.goal}.`,
      `Default channels: ${funnel.defaults.defaultChannelOrder.join(", ")}.`,
    ],
    proof: [
      `Blueprint id: ${funnel.id}.`,
      `Entry points: ${funnel.entryPoints.join(", ")}.`,
      "Generated from the runtime funnel graph source of truth.",
    ],
    sourcePath: `/funnel/${funnel.family}`,
    primaryCtaHref: `/funnel/${funnel.family}`,
    secondaryCtaHref: "/packages",
  }));
}

function gtmLandings(): MicroscopicOfferLanding[] {
  return GTM_USE_CASES.map((play) => ({
    slug: landingSlug("gtm", play.slug),
    sourceSlug: play.slug,
    category: "GTM play",
    title: play.title,
    eyebrow: play.slug === "platform-resale-deferred" ? "Deferred revenue play" : "Revenue play landing page",
    persona: play.summary ?? `Operators who want to sell ${play.title.toLowerCase()} as a focused revenue play.`,
    decisionMaker: "Founder, operator, agency seller, local media owner, directory owner, or GTM lead.",
    endUser: "The buyer or downstream customer depends on the play: local residents, lead buyers, agencies, attorneys, service businesses, or internal operators.",
    message:
      play.slug === "platform-resale-deferred"
        ? "Do not lead with platform resale yet. Use this only after case studies prove the preceding revenue plays."
        : `Sell ${play.title.toLowerCase()} with a clear first-week implementation path and explicit runtime anchors.`,
    painPoints: [
      "The market motion is easy to talk about but hard to operationalize without a concrete first-week path.",
      "Operators need to know which runtime features actually support the play.",
      "Buyers need a result, not a repo reference or configuration checklist.",
      "The team needs a clear boundary between active plays and deferred ideas.",
    ],
    expectedOutcome:
      play.slug === "platform-resale-deferred"
        ? "A deliberately deferred SaaS resale path that waits for 3-5 paying case studies before being sold as a standalone product."
        : `A sellable GTM play with technical anchors, required environment posture, and week-one actions for ${play.title}.`,
    deliveryShape: [
      ...play.weekOneActions,
      `Technical anchors: ${play.technicalAnchors.join("; ")}.`,
      `Environment keys: ${play.envKeys.length ? play.envKeys.join(", ") : "none required in current play"}.`,
    ],
    proof: [
      `GTM source id: ${play.id}.`,
      `Canonical slug: ${play.slug}.`,
      "Backed by `GTM_USE_CASES` and the GTM documentation surface.",
    ],
    sourcePath: "/docs/go-to-market-use-cases",
    primaryCtaHref: "/docs/go-to-market-use-cases",
    secondaryCtaHref: "/dashboard/gtm",
  }));
}

function planLandings(): MicroscopicOfferLanding[] {
  return publicPlans.map((plan) => ({
    slug: landingSlug("plan", plan.id),
    sourceSlug: plan.id,
    category: "Commercial plan",
    title: `${plan.name} plan`,
    eyebrow: `${plan.price} commercial container`,
    persona: plan.description,
    decisionMaker:
      plan.shortId === "starter"
        ? "Solo operator, founder, or agency owner validating the first workspace."
        : plan.shortId === "growth"
          ? "Small team, agency, or operator managing several funnels or client workspaces."
          : "Operator preparing a production multi-workspace rollout.",
    endUser: "Operators and client teams who receive the capacity, modules, and delivery limits included in the plan.",
    message: `Choose ${plan.name} when the buyer needs ${plan.limits.toLowerCase()} with clear included deliverables.`,
    painPoints: [
      "The buyer needs to know exactly what capacity and modules are included.",
      "Plan selection should not blur the difference between a product outcome and subscription limits.",
      "Operators need a plan that matches the number of workspaces, funnels, integrations, and leads.",
      "Customers need pricing expectations before they start onboarding.",
    ],
    expectedOutcome: `${plan.name} gives the buyer ${plan.limits} and includes: ${plan.features.join(", ")}.`,
    deliveryShape: [plan.price, plan.limits, ...plan.features],
    proof: [
      `Plan id: ${plan.id}.`,
      `Price value: ${plan.priceValue}.`,
      plan.recommended ? "Marked as recommended in the public plan catalog." : "Available in the public plan catalog.",
    ],
    sourcePath: `/pricing?plan=${plan.shortId}`,
    primaryCtaHref: `/onboard?plan=${plan.shortId}`,
    secondaryCtaHref: "/pricing",
  }));
}

export const microscopicOfferLandings: MicroscopicOfferLanding[] = [
  ...packageLandings(),
  ...deliverableLandings(),
  ...verticalLandings(),
  ...funnelLandings(),
  ...gtmLandings(),
  ...planLandings(),
];

export function getMicroscopicOfferLanding(slug: string): MicroscopicOfferLanding | undefined {
  return microscopicOfferLandings.find((offer) => offer.slug === slug);
}

export function getMicroscopicOffersByCategory(category: MicroscopicOfferCategory): MicroscopicOfferLanding[] {
  return microscopicOfferLandings.filter((offer) => offer.category === category);
}

function verticalDecisionMaker(slug: string): string {
  const bySlug: Record<string, string> = {
    legal: "Managing partner, intake director, legal marketer, or law firm operator.",
    "home-services": "Owner, dispatcher, office manager, or local lead-gen agency.",
    coaching: "Coach, consultant, program owner, or appointment-setting operator.",
    construction: "Contractor, estimator, project coordinator, or trades business owner.",
    "real-estate": "Agent, broker, team lead, investor marketer, or listing coordinator.",
    tech: "SaaS founder, PLG lead, product marketer, or revenue operator.",
    education: "Program director, course seller, enrollment marketer, or education founder.",
    finance: "Practice owner, advisor, accountant, compliance-aware marketer, or operations lead.",
    franchise: "Franchise owner, brand operator, territory manager, or multi-location lead.",
    staffing: "Recruiting owner, staffing operator, HR lead, or placement manager.",
    faith: "Ministry leader, church operations director, volunteer coordinator, or community lead.",
    creative: "Agency owner, studio lead, account manager, or creative operations lead.",
    health: "Practice owner, clinic manager, wellness operator, or patient-growth lead.",
    ecommerce: "Store owner, growth lead, retention marketer, or paid media operator.",
    fitness: "Gym owner, studio manager, coach, membership director, or wellness operator.",
  };
  return bySlug[slug] ?? "Founder, operator, owner, agency seller, or business leader.";
}

function verticalEndUser(slug: string): string {
  const bySlug: Record<string, string> = {
    legal: "Prospective clients who need clear intake, eligibility, and next-step guidance.",
    "home-services": "Residents and property owners who need fast quotes, bookings, or service routing.",
    coaching: "Prospects deciding whether to trust and book a high-ticket expert.",
    construction: "Property owners, developers, and buyers who need bid or project guidance.",
    "real-estate": "Buyers, sellers, investors, renters, and property leads.",
    tech: "Trial users, product-qualified leads, demo prospects, and customers at risk of churn.",
    education: "Students, learners, parents, cohort members, or training buyers.",
    finance: "Prospective clients who need trust, clarity, and a compliant advisory path.",
    franchise: "Local buyers who expect the correct territory or location to respond.",
    staffing: "Candidates, applicants, hiring managers, and client accounts.",
    faith: "Members, visitors, volunteers, donors, and community participants.",
    creative: "Prospects, clients, approvers, and buyers evaluating a studio or agency.",
    health: "Patients, wellness clients, appointment prospects, and returning customers.",
    ecommerce: "Shoppers, subscribers, repeat buyers, and abandoned-cart customers.",
    fitness: "Members, trial prospects, personal-training leads, and returning clients.",
  };
  return bySlug[slug] ?? "The buyer's prospects, leads, customers, or internal team.";
}

function verticalPainPoints(slug: string): string[] {
  const generic = [
    "The market has specific language and buying pressure that generic automation copy misses.",
    "Prospects need a clear intake, qualification, and follow-up path.",
    "The business needs measurable outcomes instead of a list of tools.",
    "Operators need routes, resources, assessment, and directory positioning to agree.",
  ];
  const extra: Record<string, string> = {
    legal: "Compliance-sensitive intake and practice-area routing create risk when handled casually.",
    "home-services": "Slow response loses urgent local jobs to competitors.",
    coaching: "Low-fit calls waste the expert's calendar and weaken close rates.",
    construction: "Project scope, urgency, and budget are hard to qualify from a generic form.",
    "real-estate": "Lead intent changes fast across buyers, sellers, investors, and listings.",
    tech: "Trial users churn before they activate or book the right next step.",
    education: "Learners need trust-building content before they enroll.",
    finance: "Claims, trust, and compliance rules shape every conversion step.",
    franchise: "Wrong-territory routing creates brand friction and lost accountability.",
    staffing: "Manual candidate screening and client routing slows placement.",
    faith: "Community engagement often depends on timely, human-feeling follow-up.",
    creative: "Prospects need proof, fit, and scope clarity before a sales call.",
    health: "Scheduling, privacy, and claims boundaries must be handled carefully.",
    ecommerce: "Creative, checkout, retention, and attribution gaps leak revenue.",
    fitness: "Trial members and returning clients need quick, motivating follow-up.",
  };
  return extra[slug] ? [extra[slug], ...generic] : generic;
}
