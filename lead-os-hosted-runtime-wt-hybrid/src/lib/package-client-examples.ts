import {
  getProvisionablePackage,
  provisionablePackages,
  type PackageDeliverable,
  type PackageSlug,
  type ProvisionablePackage,
} from "./package-catalog.ts";

export interface PackageClientExampleSeed {
  clientName: string;
  domain: string;
  market: string;
  buyer: string;
  endUser: string;
  mainPain: string;
  plainPromise: string;
  heroAction: string;
  exampleResult: string;
  photoUrl: string;
  photoAlt: string;
}

export interface PackageClientExample extends PackageClientExampleSeed {
  pkg: ProvisionablePackage;
  shortUrl: string;
  simpleSteps: string[];
  processMap: Array<{
    title: string;
    description: string;
  }>;
  tutorial: Array<{
    title: string;
    body: string;
  }>;
  visibleDeliverables: Array<PackageDeliverable & { plainUse: string }>;
}

const officePhoto = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";
const clinicPhoto = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80";
const servicePhoto = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80";
const ecommercePhoto = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80";
const educationPhoto = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80";
const analyticsPhoto = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80";

export const packageClientExampleSeeds: Record<PackageSlug, PackageClientExampleSeed> = {
  "ai-opportunity-audit": {
    clientName: "Northstar Ops Review",
    domain: "northstarops.example",
    market: "small business owners with messy workflows",
    buyer: "A founder who wants a clear AI plan before spending money.",
    endUser: "The owner and team leads who need to know what to fix first.",
    mainPain: "The team hears about AI every day, but no one knows which workflow is worth fixing first.",
    plainPromise: "We show the best AI fixes, the order to do them, and the money or time each fix can save.",
    heroAction: "Get my AI plan",
    exampleResult: "A ranked plan with quick wins, risks, owners, and a 30-day rollout.",
    photoUrl: analyticsPhoto,
    photoAlt: "A dashboard on a laptop showing business charts.",
  },
  "ghost-expert-course-factory": {
    clientName: "Dr. Mira Course Lab",
    domain: "miracourselab.example",
    market: "experts who want to sell their knowledge",
    buyer: "A trusted expert who has knowledge but no finished course.",
    endUser: "Students who need simple lessons, worksheets, and next steps.",
    mainPain: "The expert is busy and does not want to write scripts or film every lesson.",
    plainPromise: "We turn the expert's ideas into a full course people can watch and use.",
    heroAction: "View the course plan",
    exampleResult: "A course outline, lesson scripts, workbook, sales page, and launch emails.",
    photoUrl: educationPhoto,
    photoAlt: "A teacher leading a small group at a table.",
  },
  "ai-receptionist-missed-call-recovery": {
    clientName: "BrightLine Dental Calls",
    domain: "brightlinecalls.example",
    market: "appointment businesses that miss calls",
    buyer: "A clinic owner who loses bookings when the phone is busy.",
    endUser: "A caller who wants a fast answer and a booked appointment.",
    mainPain: "People call after hours or during busy times, then call a competitor.",
    plainPromise: "Every caller gets an answer, a next step, and a clear handoff.",
    heroAction: "Call the demo line",
    exampleResult: "A call script, booking path, missed-call text, escalation rules, and call report.",
    photoUrl: clinicPhoto,
    photoAlt: "A calm clinic reception desk.",
  },
  "lead-reactivation-engine": {
    clientName: "Revive List Studio",
    domain: "revivelist.example",
    market: "businesses with old leads",
    buyer: "A business owner who already paid for leads that went cold.",
    endUser: "Past leads who once showed interest and need a simple reason to come back.",
    mainPain: "Old leads sit in a spreadsheet while the business keeps buying new traffic.",
    plainPromise: "We contact old leads, answer replies, and book the warm ones.",
    heroAction: "Recover old leads",
    exampleResult: "Clean segments, win-back messages, reply rules, booking flow, and recovery report.",
    photoUrl: analyticsPhoto,
    photoAlt: "A person reviewing a customer list on a laptop.",
  },
  "speed-to-lead-system": {
    clientName: "OneMinute Lead Desk",
    domain: "oneminuteleads.example",
    market: "businesses that buy ads",
    buyer: "A sales leader who needs every new lead contacted right away.",
    endUser: "A prospect who just filled out a form and expects a quick reply.",
    mainPain: "Leads wait too long, compare other companies, and stop answering.",
    plainPromise: "A new lead gets a reply in under one minute with the right next step.",
    heroAction: "Test the fast reply",
    exampleResult: "Instant follow-up, score, booking route, rep alert, and speed report.",
    photoUrl: officePhoto,
    photoAlt: "A sales team working beside laptops.",
  },
  "content-repurposing-engine": {
    clientName: "Founder Clip Kitchen",
    domain: "clipkitchen.example",
    market: "creators and experts with long videos",
    buyer: "A founder or creator who has ideas but no time to post everywhere.",
    endUser: "Followers who want clear posts, clips, emails, and lessons.",
    mainPain: "One good video gets posted once, then disappears.",
    plainPromise: "We turn one video into a month of useful content.",
    heroAction: "See the content month",
    exampleResult: "Posts, clips, newsletter drafts, blog drafts, carousels, calendar, and report.",
    photoUrl: educationPhoto,
    photoAlt: "A creator recording content near a laptop.",
  },
  "ai-ugc-video-ad-studio": {
    clientName: "GlowBottle Ad Studio",
    domain: "glowbottleads.example",
    market: "ecommerce brands that need more ads",
    buyer: "A growth marketer who needs fresh product ads every week.",
    endUser: "Shoppers who need a clear reason to trust and try the product.",
    mainPain: "Creative gets stale, and waiting on creators slows every test.",
    plainPromise: "We make product ad angles, scripts, and test-ready creative packs.",
    heroAction: "View ad pack",
    exampleResult: "Research, hooks, UGC scripts, static ad ideas, test matrix, and claim check.",
    photoUrl: ecommercePhoto,
    photoAlt: "A product bottle staged for an ecommerce photo.",
  },
  "med-spa-growth-engine": {
    clientName: "Luna Aesthetics Growth",
    domain: "lunaestheticgrowth.example",
    market: "med spas and aesthetic clinics",
    buyer: "A med spa owner who wants more booked consults.",
    endUser: "A local person comparing treatments and clinics.",
    mainPain: "People search, compare, ask questions, and leave before booking.",
    plainPromise: "We help the clinic get found, answer questions, and book consults.",
    heroAction: "Book a consult",
    exampleResult: "Ad ideas, local search plan, review flow, booking path, and lead report.",
    photoUrl: clinicPhoto,
    photoAlt: "A clean aesthetic treatment room.",
  },
  "webinar-lead-magnet-factory": {
    clientName: "B2B Webinar Vault",
    domain: "webinarvault.example",
    market: "teams with old webinars",
    buyer: "A marketer who wants old webinar content to create new leads.",
    endUser: "A buyer who wants a short guide instead of a long replay.",
    mainPain: "Good webinars sit unused after the live event ends.",
    plainPromise: "We turn one webinar into a guide, checklist, landing page, and emails.",
    heroAction: "Get the guide",
    exampleResult: "Lead magnet, landing copy, promo posts, nurture emails, and opt-in report.",
    photoUrl: officePhoto,
    photoAlt: "A webinar presenter speaking to a remote audience.",
  },
  "founder-ai-chief-of-staff": {
    clientName: "Pilot Founder Desk",
    domain: "pilotdesk.example",
    market: "busy founders and small teams",
    buyer: "A founder who needs fewer dropped balls each day.",
    endUser: "The founder and team members who need clear priorities.",
    mainPain: "Inbox, calendar, follow-ups, and reports are scattered everywhere.",
    plainPromise: "We create a daily desk that shows what matters and what to do next.",
    heroAction: "Open today's desk",
    exampleResult: "Daily brief, inbox rules, CRM follow-ups, meeting notes, and weekly report.",
    photoUrl: officePhoto,
    photoAlt: "A founder planning work at a desk.",
  },
  "ai-first-business-os": {
    clientName: "Summit AI Operating System",
    domain: "summitaios.example",
    market: "growing teams with repeat work",
    buyer: "A business owner who wants the company to run with less manual work.",
    endUser: "Sales, marketing, delivery, support, admin, and leadership teams.",
    mainPain: "Every department works in a different way, so follow-up and reporting break.",
    plainPromise: "We map the company and install repeatable AI-supported work paths.",
    heroAction: "View the operating system",
    exampleResult: "Business brain, department map, agent workflows, dashboards, and improvement plan.",
    photoUrl: analyticsPhoto,
    photoAlt: "A team reviewing a large operations screen.",
  },
  "local-service-lead-engine": {
    clientName: "Erie Roof Lead Engine",
    domain: "erieroofleads.example",
    market: "local service companies",
    buyer: "A contractor who wants more qualified local jobs.",
    endUser: "A homeowner who needs help now and wants the right company.",
    mainPain: "Local demand is spread across search, maps, forms, calls, and directories.",
    plainPromise: "We capture local jobs and route them to the right service path.",
    heroAction: "Request a quote",
    exampleResult: "Local capture page, scoring, booking handoff, attribution, dashboard, and QA list.",
    photoUrl: servicePhoto,
    photoAlt: "A contractor working at a home service site.",
  },
  "agency-client-workspace": {
    clientName: "Maple Agency Client Hub",
    domain: "mapleclienthub.example",
    market: "agencies serving many clients",
    buyer: "An agency owner who needs a clean workspace for each client.",
    endUser: "The agency team and the client team.",
    mainPain: "Client work is scattered across docs, forms, reports, and chat.",
    plainPromise: "Each client gets one workspace for capture, status, reports, and handoff.",
    heroAction: "Open client hub",
    exampleResult: "Workspace, client funnel, routing policy, report template, handoff page, and checklist.",
    photoUrl: officePhoto,
    photoAlt: "An agency team working around a conference table.",
  },
  "directory-monetization-system": {
    clientName: "Erie Pro Buyer Network",
    domain: "erieprobuyers.example",
    market: "local and niche directories",
    buyer: "A directory owner who wants traffic to create revenue.",
    endUser: "A visitor looking for a provider and a buyer who wants the lead.",
    mainPain: "Directory visitors leave without becoming trackable, sellable demand.",
    plainPromise: "We turn directory visits into routed lead requests and buyer inventory.",
    heroAction: "Find a local pro",
    exampleResult: "Category intake, buyer routing, lead inventory, pricing, onboarding, and revenue reports.",
    photoUrl: servicePhoto,
    photoAlt: "A local business street with service storefronts.",
  },
  "saas-trial-conversion-system": {
    clientName: "TrialLift SaaS Desk",
    domain: "triallift.example",
    market: "SaaS teams with trial users",
    buyer: "A SaaS founder who wants more trials to become paid accounts.",
    endUser: "Trial users who need help reaching the first useful win.",
    mainPain: "People start trials, get stuck, and leave before seeing value.",
    plainPromise: "We spot stuck users, send the right nudge, and route good accounts to demos.",
    heroAction: "Lift trial wins",
    exampleResult: "Trial form, activation map, scoring, lifecycle emails, demo route, and ROI dashboard.",
    photoUrl: analyticsPhoto,
    photoAlt: "A software dashboard with product metrics.",
  },
  "consultant-authority-funnel": {
    clientName: "ClearPath Advisor Funnel",
    domain: "clearpathadvisor.example",
    market: "consultants and advisors",
    buyer: "A consultant who wants better-fit calls.",
    endUser: "A prospect who wants to know if the consultant can help.",
    mainPain: "Too many calls are a bad fit, and good prospects do not see enough proof.",
    plainPromise: "We qualify prospects and show the right proof before they book.",
    heroAction: "Check fit",
    exampleResult: "Authority page, qualifier, booking handoff, proof sequence, lead brief, and pipeline board.",
    photoUrl: educationPhoto,
    photoAlt: "A consultant talking with a client.",
  },
  "franchise-territory-router": {
    clientName: "FleetFix Territory Router",
    domain: "fleetfixterritory.example",
    market: "franchises and multi-location brands",
    buyer: "A franchise leader who needs leads routed to the right location.",
    endUser: "A customer who wants the nearest correct location to respond.",
    mainPain: "Leads go to the wrong place, duplicate owners, or fall through gaps.",
    plainPromise: "We route each lead by place, service, owner, and fallback rule.",
    heroAction: "Find my territory",
    exampleResult: "Territory form, routing matrix, brand view, local view, conflict rules, and SLA monitor.",
    photoUrl: servicePhoto,
    photoAlt: "A service fleet parked outside a business.",
  },
  "marketplace-lead-seller-system": {
    clientName: "Qualified Lead Market",
    domain: "qualifiedmarket.example",
    market: "pay-per-lead marketplaces",
    buyer: "A lead seller who wants clean inventory buyers can trust.",
    endUser: "A lead buyer who wants scored, priced, claimable opportunities.",
    mainPain: "Buyers do not trust lead quality when scoring, price, and outcomes are unclear.",
    plainPromise: "We package each lead with score, price, claim path, and outcome tracking.",
    heroAction: "View lead inventory",
    exampleResult: "Inventory board, claim flow, scoring, pricing setup, buyer onboarding, and revenue report.",
    photoUrl: analyticsPhoto,
    photoAlt: "A marketplace analytics screen with rows of opportunities.",
  },
  "affiliate-partner-revenue-system": {
    clientName: "PartnerPay Revenue Hub",
    domain: "partnerpayhub.example",
    market: "affiliate and partner programs",
    buyer: "A partner leader who needs clear revenue credit.",
    endUser: "Partners who send leads and want fair tracking.",
    mainPain: "Partner traffic is hard to track, and payouts become arguments.",
    plainPromise: "We track partner links, leads, revenue events, and commission status.",
    heroAction: "Track partner revenue",
    exampleResult: "Partner links, attribution model, commission table, partner view, fraud checks, and ROI report.",
    photoUrl: officePhoto,
    photoAlt: "Business partners reviewing a shared plan.",
  },
  "reactivation-retention-system": {
    clientName: "ReturnPath Customer Winback",
    domain: "returnpathwinback.example",
    market: "businesses with dormant customers",
    buyer: "An operator who wants old customers and leads to come back.",
    endUser: "A past customer who needs a helpful reason to return.",
    mainPain: "People go quiet after quotes, visits, purchases, or trials.",
    plainPromise: "We find who is worth saving and send the right comeback path.",
    heroAction: "Win customers back",
    exampleResult: "Segments, win-back sequence, risk score, offer rules, outcome board, and ROI report.",
    photoUrl: analyticsPhoto,
    photoAlt: "A customer retention dashboard.",
  },
  "operator-control-plane-system": {
    clientName: "LaunchRoom Control Plane",
    domain: "launchroomcontrol.example",
    market: "operators running many systems",
    buyer: "An operator who needs one place to see what is live, blocked, and earning.",
    endUser: "The internal team that owns launch, support, billing, and fixes.",
    mainPain: "Status is hidden across tools, so owners do not know what is safe to launch.",
    plainPromise: "We show health, readiness, queues, toggles, revenue, audit, and incident steps in one place.",
    heroAction: "Open control plane",
    exampleResult: "Health panel, checklist, queues, toggles, revenue center, audit trail, and runbook.",
    photoUrl: analyticsPhoto,
    photoAlt: "An operations room with dashboard screens.",
  },
  "content-distribution-engine": {
    clientName: "ResourceReach Content Engine",
    domain: "resourcereach.example",
    market: "teams using content to create leads",
    buyer: "A marketer who wants content to turn into real leads.",
    endUser: "A reader who wants a useful resource and a clear next step.",
    mainPain: "Content gets attention, but the team does not capture or follow up well.",
    plainPromise: "We turn content into a lead path with delivery, nurture, scoring, and reports.",
    heroAction: "Get the resource",
    exampleResult: "Lead magnet page, delivery flow, nurture, calendar, scoring, CTA test, and attribution.",
    photoUrl: educationPhoto,
    photoAlt: "A person reading a guide on a tablet.",
  },
  "revenue-attribution-suite": {
    clientName: "ProofPath Revenue Reports",
    domain: "proofpathreports.example",
    market: "teams that must prove ROI",
    buyer: "A leader who needs to know what made money.",
    endUser: "Executives, clients, and operators who need clear proof.",
    mainPain: "Leads, sales, costs, and revenue live in different places.",
    plainPromise: "We connect source, conversion, revenue, and ROI in one plain report.",
    heroAction: "See revenue proof",
    exampleResult: "Source map, event schema, ROI dashboard, revenue webhook, attribution model, and executive report.",
    photoUrl: analyticsPhoto,
    photoAlt: "A revenue report dashboard with charts.",
  },
};

function plainUseForDeliverable(deliverable: PackageDeliverable): string {
  switch (deliverable.launchSurface) {
    case "capture":
      return "People use this to ask for help, book, join, or send details.";
    case "operator":
      return "The team uses this to know what to check and what to do next.";
    case "automation":
      return "This is the rule or message path that runs the work the same way each time.";
    case "billing":
      return "This shows how money, price, claims, payouts, or payment steps are handled.";
    case "reporting":
      return "This proves what happened and whether the result is improving.";
    default:
      return "This is the main place where the finished work is shown and used.";
  }
}

export function getPackageClientExample(slug: string): PackageClientExample | undefined {
  const pkg = getProvisionablePackage(slug);
  const seed = packageClientExampleSeeds[slug as PackageSlug];
  if (!pkg || !seed) return undefined;

  const visibleDeliverables = pkg.deliverables.map((deliverable) => ({
    ...deliverable,
    plainUse: plainUseForDeliverable(deliverable),
  }));

  return {
    ...seed,
    pkg,
    shortUrl: `/client-examples/${pkg.slug}`,
    visibleDeliverables,
    simpleSteps: [
      "The customer fills out one short form.",
      "The system builds the pages, rules, reports, and handoffs.",
      "The client opens this website and sees the finished work.",
      "The team follows the guide and uses the first deliverable.",
      "The report shows what changed and what to improve next.",
    ],
    processMap: [
      {
        title: "1. Intake",
        description: "Collect the business, audience, offer, rules, and success goal.",
      },
      {
        title: "2. Build",
        description: "Create every selected page, workflow, guide, and report.",
      },
      {
        title: "3. Launch",
        description: "Publish the client site and show what is ready now.",
      },
      {
        title: "4. Use",
        description: "Give the team simple steps for using the system.",
      },
      {
        title: "5. Prove",
        description: "Track the result the client paid for.",
      },
    ],
    tutorial: [
      {
        title: "Step 1: Read the top of the page.",
        body: `Make sure this says it is for ${seed.market}. If the market is wrong, fix the intake before using the system.`,
      },
      {
        title: "Step 2: Check the promised result.",
        body: `The promised result is: ${seed.exampleResult} This is what the client should expect to receive.`,
      },
      {
        title: "Step 3: Open the first deliverable.",
        body: `Start with "${pkg.deliverables[0]?.title ?? "the first deliverable"}." It tells the team where to begin.`,
      },
      {
        title: "Step 4: Follow the process map.",
        body: "Do the steps in order: intake, build, launch, use, then prove. Do not skip the proof step.",
      },
      {
        title: "Step 5: Use the report to improve.",
        body: `Look at ${pkg.deliverables.find((item) => item.launchSurface === "reporting")?.title ?? "the report"}. It shows what worked, what is blocked, and what to fix next.`,
      },
    ],
  };
}

export function getAllPackageClientExamples(): PackageClientExample[] {
  return provisionablePackages
    .map((pkg) => getPackageClientExample(pkg.slug))
    .filter((example): example is PackageClientExample => Boolean(example));
}
