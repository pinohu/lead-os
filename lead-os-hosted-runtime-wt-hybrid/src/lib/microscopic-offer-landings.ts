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
  pricing: StandaloneOfferPricing;
  sourcePath: string;
  primaryCtaHref: string;
  secondaryCtaHref: string;
}

export interface StandaloneOfferPricing {
  headline: string;
  setup: string;
  recurring: string;
  performance: string;
  bestFor: string;
  rationale: string;
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
      pricing: packagePricing(pkg.slug),
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
    pricing: deliverablePricing(item.slug),
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
    pricing: verticalPricing(niche.slug),
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
    pricing: funnelPricing(funnel.family),
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
    pricing: gtmPricing(play.slug),
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
    pricing: {
      headline: plan.price,
      setup: "$0 platform setup when self-serve onboarding is used.",
      recurring: plan.price,
      performance: "No performance fee; usage limits are controlled by the plan.",
      bestFor: plan.description,
      rationale: `This is the public platform container price. It packages ${plan.limits.toLowerCase()} and should not be confused with the standalone outcome-service prices above.`,
    },
    sourcePath: `/pricing?plan=${plan.shortId}`,
    primaryCtaHref: `/onboard?plan=${plan.shortId}`,
    secondaryCtaHref: "/pricing",
  }));
}

function price(
  headline: string,
  setup: string,
  recurring: string,
  performance: string,
  bestFor: string,
  rationale: string,
): StandaloneOfferPricing {
  return { headline, setup, recurring, performance, bestFor, rationale };
}

function packagePricing(slug: PackageSlug): StandaloneOfferPricing {
  const prices: Record<PackageSlug, StandaloneOfferPricing> = {
    "ai-opportunity-audit": price(
      "$5,000 fixed audit",
      "$2,500-$15,000 depending on company size, workflow count, and regulation.",
      "$2,000-$8,000/month if kept as implementation advisory.",
      "Credit the audit fee toward the first implementation package when it closes within 30 days.",
      "Founder-led SMBs and mid-market teams that need a decision-grade AI roadmap.",
      "AI readiness audits in 2026 cluster around low four figures for narrow SMB reviews and $5k-$15k for serious mid-market audits, so $5k is the clean default.",
    ),
    "ghost-expert-course-factory": price(
      "$12,500/course",
      "$5,000-$25,000 per finished course package.",
      "$1,500-$5,000/month for updates, localization, and launch asset refreshes.",
      "$2,000-$8,000 per language or major module expansion.",
      "Experts with premium knowledge and a sellable audience.",
      "This is priced as a finished education product, not a scriptwriting task; the value is curriculum, scripts, workbook, launch assets, and production readiness.",
    ),
    "ai-receptionist-missed-call-recovery": price(
      "$2,500 setup + $497/month",
      "$1,500-$7,500 depending on call flow complexity and handoffs.",
      "$297-$1,500/month plus usage or phone-provider costs.",
      "Optional $25-$150 per booked qualified appointment for high-ticket niches.",
      "Appointment-heavy local businesses where one recovered job or consult can pay for the system.",
      "AI receptionist tools can be cheap, but managed receptionist systems and high-value local setup justify setup plus monthly monitoring.",
    ),
    "lead-reactivation-engine": price(
      "$2,500 setup + $150/booked appointment",
      "$1,500-$5,000 based on list size, cleanup, and campaign complexity.",
      "$750-$2,500/month for ongoing reactivation cycles.",
      "$50-$300 per qualified booked appointment; avoid charging on closed revenue you cannot control.",
      "Businesses with existing paid-for leads sitting dormant.",
      "Pay-per-appointment pricing is strongest when the client already owns the list and wants low-risk upside.",
    ),
    "speed-to-lead-system": price(
      "$3,500 setup + $750/month",
      "$2,500-$7,500 based on ad sources, routing, CRM, and phone/SMS flow.",
      "$500-$2,000/month for monitoring, routing fixes, and SLA reporting.",
      "Optional bonus for conversion-rate lift or booked appointments.",
      "Businesses spending on ads where slow response wastes budget.",
      "The system sits close to revenue, so it should be priced above a generic automation but below full paid-media retainers.",
    ),
    "content-repurposing-engine": price(
      "$2,500/month",
      "$750-$2,000 onboarding for brand voice, content pillars, and approval workflow.",
      "$1,500-$6,000/month by source volume and platform count.",
      "Optional $250-$750 per additional long-form source asset.",
      "Creators and expert businesses that already create source material.",
      "Social/content management retainers commonly run from low four figures to agency-level retainers; this offer wins by producing many assets from existing material.",
    ),
    "ai-ugc-video-ad-studio": price(
      "$2,000/month for 20 ads",
      "$500-$1,500 creative strategy setup.",
      "$1,500-$5,000/month by creative volume and compliance needs.",
      "$100-$300 per additional creative or remix batch.",
      "Ecommerce brands that need creative velocity without traditional UGC production delay.",
      "AI UGC tools are inexpensive, but hybrid AI ad agencies price around $1.5k-$2k/month when strategy, scripting, review, and production are included.",
    ),
    "med-spa-growth-engine": price(
      "$3,000/month",
      "$1,500-$3,500 setup for local audit, tracking, creative baseline, and consultation funnel.",
      "$2,500-$6,000/month plus ad spend for creative, local SEO, reporting, and review operations.",
      "Optional $50-$200 per booked consultation when tracking is clean.",
      "Med spas with high-value consultations and local search/ad demand.",
      "Local SEO and marketing retainers commonly sit in the $1.5k-$5k+ range, and med spas can support premium pricing because customer lifetime value is high.",
    ),
    "webinar-lead-magnet-factory": price(
      "$1,500 per webinar asset",
      "$750-$1,500 for one webinar-to-lead-magnet conversion.",
      "$3,000-$8,000/month for recurring webinar repurposing.",
      "$500-$1,500 per extra lead magnet or nurture sequence.",
      "B2B teams with recorded educational content that should become pipeline.",
      "This is priced between a landing page build and a content retainer because it includes extraction, lead magnet, promo copy, and nurture assets.",
    ),
    "founder-ai-chief-of-staff": price(
      "$3,500 setup + $2,500/month",
      "$2,500-$10,000 depending on inbox, CRM, calendar, and dashboard scope.",
      "$1,500-$7,500/month for ongoing triage, reporting, and workflow improvement.",
      "Optional executive-support tier at $10k+/month for high-touch operators.",
      "Founders whose time is worth more than the monthly retainer.",
      "Consulting retainers and fractional executive support commonly land in the low-to-mid thousands monthly, so this should not be priced like a simple assistant.",
    ),
    "ai-first-business-os": price(
      "$15,000 setup + $4,000/month",
      "$10,000-$50,000 for the initial operating-system install.",
      "$2,000-$10,000/month for optimization, monitoring, and workflow expansion.",
      "Optional department expansion packages at $5,000-$15,000 each.",
      "SMBs and agencies ready to rebuild multiple workflows, not buy a single automation.",
      "Business process automation projects run from $5k to much higher; a full AI operating system should be value-priced as a strategic implementation.",
    ),
    "local-service-lead-engine": price(
      "$1,500 setup + $750/month",
      "$1,000-$3,500 by niche, form complexity, and routing logic.",
      "$500-$2,000/month for lead flow, reporting, and optimization.",
      "$25-$150 per qualified lead where exclusivity and consent are clear.",
      "Local service businesses and agencies selling lead generation.",
      "Local lead systems are lower ticket than full marketing retainers but can support performance pricing when the leads are exclusive.",
    ),
    "agency-client-workspace": price(
      "$1,000 setup + $499/month/client",
      "$750-$2,500 per client workspace.",
      "$299-$1,000/month per active client workspace.",
      "Volume discount after 5 client workspaces.",
      "Agencies that need repeatable client delivery infrastructure.",
      "Agencies need margin and repeatability; per-client workspace pricing keeps the offer understandable and scalable.",
    ),
    "directory-monetization-system": price(
      "$5,000 setup + $1,500/month",
      "$3,500-$12,500 based on categories, buyers, and exclusivity rules.",
      "$1,000-$4,000/month for buyer onboarding, routing, and revenue ops.",
      "10%-30% of lead revenue or claim fees for marketplace operation.",
      "Directory and local media operators turning traffic into monetized demand.",
      "This creates a revenue channel, so it should include a setup fee plus either monthly ops or revenue share.",
    ),
    "saas-trial-conversion-system": price(
      "$4,000 setup + $1,500/month",
      "$3,000-$10,000 based on event map, lifecycle stages, and CRM/billing complexity.",
      "$1,000-$5,000/month for activation reporting and lifecycle optimization.",
      "Optional bonus tied to demo-booking or activation lift.",
      "SaaS teams with enough trial volume for conversion gains to matter.",
      "This sits between funnel buildout, lifecycle marketing, and attribution, so it deserves a strategic setup plus recurring optimization.",
    ),
    "consultant-authority-funnel": price(
      "$2,500 setup + $500/month",
      "$1,500-$5,000 for the authority funnel and qualification path.",
      "$300-$1,500/month for updates, reporting, and nurture improvements.",
      "Optional $100-$500 per qualified booked call for high-ticket consultants.",
      "Consultants and coaches selling calls or advisory work.",
      "One good client can pay for the funnel, but the buyer is often price-sensitive, so a clear fixed setup works best.",
    ),
    "franchise-territory-router": price(
      "$10,000 setup + $3,000/month",
      "$7,500-$25,000 based on territory count and conflict rules.",
      "$2,000-$8,000/month for SLA monitoring, reporting, and territory changes.",
      "$250-$1,000 per added territory batch.",
      "Franchises and multi-location brands with costly misrouting.",
      "Multi-location routing is operational infrastructure, not a basic form, so it should be priced like a serious implementation.",
    ),
    "marketplace-lead-seller-system": price(
      "$12,500 setup + $3,000/month",
      "$7,500-$30,000 for marketplace inventory, claim, pricing, and outcomes.",
      "$2,000-$7,500/month for marketplace operations and buyer support.",
      "10%-30% of gross lead revenue or buyer claim fees.",
      "Lead sellers and marketplace operators with buyer demand.",
      "Because the system creates monetizable inventory and transaction flow, setup plus revenue share is the cleanest pricing.",
    ),
    "affiliate-partner-revenue-system": price(
      "$5,000 setup + $1,500/month",
      "$3,000-$10,000 for tracking, commission logic, and partner portal setup.",
      "$1,000-$4,000/month for reporting, fraud checks, and partner ops.",
      "Optional 2%-10% override on attributed partner revenue.",
      "Partner programs that need trustworthy attribution and payouts.",
      "Partner revenue systems touch attribution, payments, and reporting, which warrants more than a simple dashboard fee.",
    ),
    "reactivation-retention-system": price(
      "$3,000 setup + $1,000/month",
      "$2,000-$7,500 based on segments, sequences, and CRM state.",
      "$750-$3,000/month for winback cycles and retention reporting.",
      "$50-$300 per reactivated customer, booked call, or recovered opportunity.",
      "Clinics, gyms, SaaS teams, coaches, and service businesses with dormant demand.",
      "This is close to revenue but uses existing relationships, so performance-based upside is appropriate.",
    ),
    "operator-control-plane-system": price(
      "$10,000 setup + $2,500/month",
      "$7,500-$25,000 based on operator surfaces, toggles, queues, and revenue views.",
      "$1,500-$6,000/month for operational support and improvements.",
      "Optional per-workspace fee for multi-client operators.",
      "Agencies and operators running multiple AI-enabled delivery systems.",
      "A control plane is internal infrastructure; price it as operational leverage and risk reduction.",
    ),
    "content-distribution-engine": price(
      "$2,500 setup + $2,000/month",
      "$1,500-$5,000 for lead magnet, nurture, scoring, and distribution setup.",
      "$1,500-$6,000/month by content volume and channel count.",
      "$500-$1,500 per additional resource or campaign.",
      "B2B marketers and creators turning attention into qualified leads.",
      "Content retainers range widely; this offer is narrower and outcome-tied, so mid-four-figure monthly pricing is justified.",
    ),
    "revenue-attribution-suite": price(
      "$7,500 setup + $2,000/month",
      "$5,000-$20,000 based on source count, events, revenue systems, and data cleanup.",
      "$1,500-$7,500/month for reporting, QA, and model maintenance.",
      "Optional bonus for recovered spend or improved reporting adoption.",
      "Operators who need to prove which sources actually create revenue.",
      "Attribution consulting, dashboards, and analytics retainers are premium because they influence budget allocation and revenue decisions.",
    ),
  };

  return prices[slug];
}

function deliverablePricing(slug: string): StandaloneOfferPricing {
  const prices: Record<string, StandaloneOfferPricing> = {
    "lead-capture-workspace": price("$499 setup + $99/month", "$499", "$99-$299/month", "No performance fee.", "A business that needs one live capture surface.", "Priced as a focused landing/capture module, below full funnel or agency retainers."),
    "lead-scoring-routing": price("$750 setup", "$750-$1,500", "$150-$500/month if monitored.", "No performance fee unless tied to accepted leads.", "Teams that need routing decisions, not a full CRM rebuild.", "Scoring is valuable but narrow, so fixed setup plus optional monitoring is clean."),
    "email-nurture-workflow": price("$750 setup", "$500-$1,500", "$100-$500/month for edits and reporting.", "No performance fee.", "Businesses with a simple lead follow-up gap.", "Pricing fits a productized email sequence rather than full lifecycle marketing."),
    "embed-capture-script": price("$350 setup", "$250-$750", "$50-$150/month for maintenance.", "No performance fee.", "Operators embedding capture onto an existing site.", "This is a small technical module, so keep it low-friction."),
    "operator-dashboard": price("$999 setup + $199/month", "$999-$2,500", "$199-$750/month", "No performance fee.", "Operators who need visibility without full analytics consulting.", "Dashboard tools are cheap, but configured operator visibility deserves setup plus maintenance."),
    "ab-testing-surface": price("$999 setup + $249/month", "$999-$3,000", "$249-$750/month", "Optional bonus on conversion lift.", "Teams with enough traffic for offer tests to matter.", "A/B testing affects conversion, but the module is narrower than a full CRO retainer."),
    "attribution-view": price("$1,500 setup + $299/month", "$1,500-$5,000", "$299-$1,500/month", "No performance fee unless tied to recovered spend.", "Operators who need source-level ROI clarity.", "Attribution is higher value than basic reporting, so price above simple dashboards."),
    "channel-readiness": price("$750 setup", "$500-$2,000", "$150-$500/month if channels are monitored.", "No performance fee.", "Teams preparing email, SMS, WhatsApp, chat, booking, or CRM channels.", "Readiness work prevents risky live sends but is still a bounded module."),
    "marketplace-surface": price("$2,500 setup + $499/month", "$2,500-$7,500", "$499-$2,000/month", "Optional percentage of claimed lead revenue.", "Lead sellers and marketplace operators.", "Marketplace surfaces create buyer-facing revenue potential, so price above ordinary dashboards."),
    "support-lane": price("$500 setup + $199/month", "$500-$1,500", "$199-$750/month", "No performance fee.", "Teams needing a clear priority support intake path.", "Support intake is operationally important but should remain affordable as a module."),
    "funnel-library": price("$1,500 setup", "$1,500-$4,000", "$250-$1,000/month for upkeep.", "No performance fee.", "Operators who need reusable funnel definitions.", "Blueprint library work is reusable infrastructure, priced between a module and full funnel build."),
    "production-launch-checklist": price("$1,000 audit", "$750-$2,500", "$250-$1,000/month for readiness monitoring.", "No performance fee.", "Teams preparing a serious go-live.", "This is a launch-risk reduction offer, best sold as a fixed readiness check."),
  };
  return prices[slug] ?? price("$1,000 setup", "$500-$2,500", "$150-$750/month", "No performance fee.", "Operators needing this standalone module.", "Default module pricing.");
}

function verticalPricing(slug: string): StandaloneOfferPricing {
  const premium = ["legal", "health", "finance", "franchise", "ecommerce"].includes(slug);
  return price(
    premium ? "$3,500 vertical launch sprint" : "$2,500 vertical launch sprint",
    premium ? "$3,500-$7,500" : "$1,500-$5,000",
    premium ? "$1,500-$5,000/month" : "$750-$3,000/month",
    "Optional performance fee only when lead, booking, or revenue events are measurable.",
    `${verticalDecisionMaker(slug)} Use this when the offer needs its own niche-specific website and message.`,
    "Vertical wrappers should be priced as market-positioning and conversion packaging, then upsold into the package or funnel that delivers the result.",
  );
}

function funnelPricing(family: string): StandaloneOfferPricing {
  const table: Record<string, StandaloneOfferPricing> = {
    "lead-magnet": price("$1,500 funnel build", "$1,000-$3,000", "$300-$1,000/month for iteration.", "$250-$750 per added lead magnet.", "Teams needing an opt-in asset and capture path.", "Lead magnet funnels are narrower than full sites but should include copy, page, delivery, and tracking."),
    qualification: price("$2,500 funnel build", "$1,500-$5,000", "$500-$1,500/month for routing optimization.", "Optional per qualified booked call.", "Businesses wasting time on low-fit leads.", "Qualification directly protects sales time, so price higher than a basic landing page."),
    chat: price("$2,500 conversational funnel", "$1,500-$5,000", "$500-$1,500/month for tuning.", "Optional per qualified conversation.", "Businesses needing chat-style capture and objection handling.", "Conversational flows require scripting, routing, and tuning."),
    webinar: price("$3,500 webinar funnel", "$2,500-$7,500", "$750-$2,500/month for webinar cycles.", "Optional per attendee or booked call.", "B2B teams selling through education.", "Webinar funnels require registration, reminders, replay, offer, and follow-up."),
    authority: price("$2,500 authority funnel", "$1,500-$5,000", "$500-$2,000/month for content/proof updates.", "Optional per qualified call.", "Experts who need trust before booking.", "Authority funnels package positioning, proof, education, and qualification."),
    checkout: price("$3,500 checkout funnel", "$2,500-$8,000", "$750-$2,500/month for CRO.", "Optional conversion-lift bonus.", "Offer owners with purchase intent but checkout leakage.", "Checkout funnels sit closest to revenue and should be priced accordingly."),
    retention: price("$2,000 retention funnel", "$1,500-$5,000", "$750-$2,500/month", "Optional per retained or reactivated account.", "Businesses with churn or repeat-purchase opportunities.", "Retention pricing should connect to lifetime value."),
    rescue: price("$2,000 rescue funnel", "$1,500-$5,000", "$500-$2,000/month", "Optional per recovered sale or saved account.", "Teams losing carts, refunds, no-shows, or stale leads.", "Recovery funnels are measurable and support performance upside."),
    referral: price("$1,500 referral funnel", "$1,000-$4,000", "$300-$1,500/month", "Optional bounty per referred customer.", "Businesses with happy customers but no referral path.", "Referral funnel setup is bounded but tied to new customer value."),
    continuity: price("$2,000 continuity funnel", "$1,500-$5,000", "$750-$2,500/month", "Optional retention or activation bonus.", "Membership, subscription, course, and SaaS offers.", "Continuity funnels protect recurring revenue."),
  };
  return table[family] ?? price("$2,500 funnel build", "$1,500-$5,000", "$500-$1,500/month", "Optional performance fee.", "Teams needing a measurable funnel.", "Default funnel pricing.");
}

function gtmPricing(slug: string): StandaloneOfferPricing {
  const prices: Record<string, StandaloneOfferPricing> = {
    "erie-exclusive-niche": price("$1,500 setup + $750/month", "$1,500-$3,500", "$750-$2,000/month", "$50-$200 per exclusive qualified lead.", "One local category buyer in one market.", "Exclusive local routing is simple to understand and should include monthly territory value."),
    "exclusive-category-ownership": price("$2,500 setup + $1,000/month", "$2,500-$5,000", "$1,000-$3,000/month", "Per-lead fee or category exclusivity premium.", "Businesses buying city x niche ownership.", "The exclusivity claim supports a premium over ordinary lead routing."),
    "managed-lead-ops": price("$2,500 setup + $1,500/month", "$2,500-$7,500", "$1,500-$5,000/month", "$50-$300 per qualified booked lead.", "Operators who want done-for-you lead ops.", "Managed lead operations combines routing, monitoring, reporting, and human accountability."),
    "national-territory-directory": price("$7,500 setup + $2,500/month", "$7,500-$25,000", "$2,500-$10,000/month", "Territory fees plus lead claim revenue.", "Directory owners scaling across cities.", "National territory plays involve multi-market setup and buyer management."),
    "white-label-agencies": price("$2,500 setup + $499/month/client", "$2,500-$7,500", "$499-$1,500/month per client workspace", "Optional wholesale/revenue share.", "Agencies reselling the system under their own name.", "White-label buyers need margin, so per-client pricing must stay simple."),
    "home-services-concierge": price("$2,500 setup + $1,000/month", "$2,500-$7,500", "$1,000-$4,000/month", "$25-$150 per qualified request.", "Local brokers and concierge operators.", "Home service concierge pricing should mix ops retainer and lead value."),
    "legal-immigration-intake": price("$3,500 setup + $1,500/month", "$3,500-$10,000", "$1,500-$5,000/month", "$150-$500 per qualified consult where compliant.", "Immigration attorneys and legal intake operators.", "Legal intake is high value and compliance-sensitive, so it deserves premium setup and monitoring."),
    "internal-ops-yourdeputy": price("$5,000 setup + $2,000/month", "$5,000-$15,000", "$2,000-$7,500/month", "No performance fee; price by time saved and risk reduced.", "Internal operators using the stack to run their own business.", "Internal ops work is automation consulting plus control-plane setup."),
    "integration-hub": price("$3,000 setup + $1,000/month", "$3,000-$10,000", "$1,000-$4,000/month", "No performance fee.", "Teams replacing scattered Zapier-style sprawl.", "Integration cleanup is valuable because it reduces breakage and tool chaos."),
    "platform-resale-deferred": price("Do not sell yet; $15,000 validation pilot only", "$15,000+ if accepted as a controlled pilot.", "$5,000+/month only after case studies exist.", "No standard performance fee until proof exists.", "Founders validating platform resale after 3-5 case studies.", "This play is explicitly deferred; pricing should discourage premature platform sales."),
  };
  return prices[slug] ?? price("$2,500 setup", "$2,500-$7,500", "$1,000-$3,000/month", "Optional performance fee.", "Operators selling this GTM play.", "Default GTM pricing.");
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
