import { getIndustryAudienceModel } from "./industry-positioning.ts";

export type PageAudienceKind =
  | "B2B"
  | "B2B2C"
  | "Operator app"
  | "Developer"
  | "Account"
  | "Trust"
  | "White-label";

export type PageAudienceProfile = {
  id: string;
  routeLabel: string;
  kind: PageAudienceKind;
  servedAudience: string;
  primaryPersona: string;
  pagePurpose: string;
  expectedOutcome: string;
  notFor: string;
  showBanner: boolean;
};

type PageAudienceRule = {
  id: string;
  routeLabel: string;
  test: (pathname: string) => boolean;
  profile: Omit<PageAudienceProfile, "id" | "routeLabel">;
};

function normalizePath(pathname: string) {
  if (!pathname || pathname === "") return "/";
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return normalized.length > 1 ? normalized.replace(/\/$/, "") : normalized;
}

function firstSegment(pathname: string) {
  return normalizePath(pathname).split("/").filter(Boolean)[0] ?? "";
}

function secondSegment(pathname: string) {
  return normalizePath(pathname).split("/").filter(Boolean)[1] ?? "";
}

const operatorProfile = {
  kind: "Operator app" as const,
  servedAudience: "Signed-in operators and delivery teams running the fulfillment system.",
  primaryPersona: "Operator, founder, delivery lead, support lead, or admin teammate.",
  pagePurpose: "Operate, configure, monitor, or improve the solution delivery engine.",
  expectedOutcome: "The operator knows what needs attention, what is live, what is blocked, and what should happen next.",
  notFor: "Not a buyer-facing marketing page or downstream customer experience.",
  showBanner: true,
};

const whiteLabelProfile = {
  kind: "White-label" as const,
  servedAudience: "The operator's clients or the client's downstream audience, depending on the deployed surface.",
  primaryPersona: "Client prospect, customer, lead, applicant, patient, shopper, or tenant-branded visitor.",
  pagePurpose: "Let the deployed client experience collect demand, present an offer, or show a launched asset without exposing the platform layer.",
  expectedOutcome: "The visitor experiences the operator or client brand, while the platform handles capture, routing, reporting, or delivery behind the scenes.",
  notFor: "Not a central Lead OS sales page and not a place to expose platform dependency.",
  showBanner: false,
};

export const PAGE_AUDIENCE_RULES: PageAudienceRule[] = [
  {
    id: "home",
    routeLabel: "/",
    test: (pathname) => normalizePath(pathname) === "/",
    profile: {
      kind: "B2B",
      servedAudience: "B2B operators who sell outcome-based AI solutions to client businesses.",
      primaryPersona: "Agency owner, consultant, founder, SaaS operator, franchise team, lead seller, or service provider.",
      pagePurpose: "Explain the core promise: sell a solution, collect one intake form, and provision the finished delivery system.",
      expectedOutcome: "The visitor understands whether Lead OS is for them and which product path to inspect next.",
      notFor: "Not a consumer app and not a page for end customers to configure tools themselves.",
      showBanner: true,
    },
  },
  {
    id: "audience-map",
    routeLabel: "/audience-map",
    test: (pathname) => normalizePath(pathname) === "/audience-map",
    profile: {
      kind: "B2B",
      servedAudience: "Operators, founders, reviewers, and internal teams trying to understand who each page serves.",
      primaryPersona: "The person auditing messaging, navigation, conversion paths, or customer experience.",
      pagePurpose: "Show the audience, persona, purpose, and expected outcome for every route family.",
      expectedOutcome: "The reader can tell who every page is for without reverse-engineering the website.",
      notFor: "Not a product catalog or pricing page.",
      showBanner: true,
    },
  },
  {
    id: "auth",
    routeLabel: "/auth/*",
    test: (pathname) => firstSegment(pathname) === "auth",
    profile: {
      kind: "Account",
      servedAudience: "Returning operators and invited teammates.",
      primaryPersona: "Account owner, team member, admin, or collaborator accepting access.",
      pagePurpose: "Authenticate the right person and move them into the correct workspace.",
      expectedOutcome: "The user signs in, verifies access, or understands the next authentication step.",
      notFor: "Not for new buyer education or public product comparison.",
      showBanner: true,
    },
  },
  {
    id: "onboard",
    routeLabel: "/onboard",
    test: (pathname) => normalizePath(pathname) === "/onboard",
    profile: {
      kind: "B2B",
      servedAudience: "New operators ready to create an account and start provisioning solutions.",
      primaryPersona: "Founder, agency operator, consultant, or delivery lead starting setup.",
      pagePurpose: "Collect the minimum operator information needed to create the account and begin launch.",
      expectedOutcome: "The operator finishes account creation with a clear next step into package selection or setup.",
      notFor: "Not for downstream leads or clients buying from an operator.",
      showBanner: true,
    },
  },
  {
    id: "pricing",
    routeLabel: "/pricing",
    test: (pathname) => normalizePath(pathname) === "/pricing",
    profile: {
      kind: "B2B",
      servedAudience: "Economic buyers comparing whether the platform is worth the monthly operating cost.",
      primaryPersona: "Agency owner, founder, finance-minded operator, or team lead approving spend.",
      pagePurpose: "Translate packages, limits, and outside-service dependencies into a buying decision.",
      expectedOutcome: "The buyer knows which plan fits their expected volume and what is included before onboarding.",
      notFor: "Not a consumer checkout or a custom enterprise procurement room.",
      showBanner: true,
    },
  },
  {
    id: "contact",
    routeLabel: "/contact",
    test: (pathname) => normalizePath(pathname) === "/contact",
    profile: {
      kind: "B2B",
      servedAudience: "Operators who need human help before buying, migrating, or launching.",
      primaryPersona: "Founder, agency operator, consultant, or implementation owner with a specific question.",
      pagePurpose: "Give unsure buyers and existing operators a clear path to reach a human.",
      expectedOutcome: "The visitor knows what to ask, how to contact the team, and what response to expect.",
      notFor: "Not a support ticket system for downstream client customers.",
      showBanner: true,
    },
  },
  {
    id: "industries-index",
    routeLabel: "/industries",
    test: (pathname) => normalizePath(pathname) === "/industries",
    profile: {
      kind: "B2B",
      servedAudience: "Operators choosing which market, vertical, or client niche to sell into.",
      primaryPersona: "Agency owner, consultant, niche operator, or founder validating a target market.",
      pagePurpose: "Compare industry-specific pains, buyer realities, and solution angles.",
      expectedOutcome: "The operator chooses an industry path that matches their buyer, proof, and delivery capacity.",
      notFor: "Not a generic list of consumer services.",
      showBanner: true,
    },
  },
  {
    id: "industry-detail",
    routeLabel: "/industries/[slug]",
    test: (pathname) => firstSegment(pathname) === "industries" && Boolean(secondSegment(pathname)),
    profile: {
      kind: "B2B2C",
      servedAudience: "Operators selling into one industry, plus the client-business teams who will receive the finished workflow.",
      primaryPersona: "Industry-specific operator, agency seller, consultant, or client-business decision maker.",
      pagePurpose: "Name the buyer, internal users, downstream audience, pain, expected outcome, and service blueprint for one industry.",
      expectedOutcome: "The visitor knows exactly who the offer serves and what the installed workflow is supposed to deliver.",
      notFor: "Not a consumer self-service app for the downstream audience.",
      showBanner: true,
    },
  },
  {
    id: "solutions",
    routeLabel: "/solutions/*",
    test: (pathname) => firstSegment(pathname) === "solutions",
    profile: {
      kind: "B2B",
      servedAudience: "Operators comparing solution categories before choosing a package or offer.",
      primaryPersona: "Business owner, agency operator, consultant, or growth lead evaluating outcomes.",
      pagePurpose: "Explain the problem category, outcome promise, and deployment path for a solution.",
      expectedOutcome: "The visitor can decide whether this solution category matches the client problem they need to solve.",
      notFor: "Not a tool feature tour detached from client outcomes.",
      showBanner: true,
    },
  },
  {
    id: "offers",
    routeLabel: "/offers/*",
    test: (pathname) => firstSegment(pathname) === "offers",
    profile: {
      kind: "B2B",
      servedAudience: "Operators packaging, pricing, and selling standalone AI-agency offers.",
      primaryPersona: "Agency owner, consultant, operator, or salesperson choosing what to sell.",
      pagePurpose: "Show the offer promise, buyer, pain, delivery shape, and route into provisioning.",
      expectedOutcome: "The operator can pick an offer to sell by itself or combine with other packages.",
      notFor: "Not a client-facing implementation dashboard.",
      showBanner: true,
    },
  },
  {
    id: "packages",
    routeLabel: "/packages/*",
    test: (pathname) => firstSegment(pathname) === "packages",
    profile: {
      kind: "B2B",
      servedAudience: "Operators selecting and provisioning modular packages.",
      primaryPersona: "Delivery operator, agency founder, consultant, or implementation lead.",
      pagePurpose: "Let the operator choose one or many packages and see the delivered assets, guides, forms, and workspace.",
      expectedOutcome: "The operator knows what package will be provisioned and how the finished outputs will appear.",
      notFor: "Not a marketplace for consumers buying individual tools.",
      showBanner: true,
    },
  },
  {
    id: "deliverables",
    routeLabel: "/deliverables/*",
    test: (pathname) => firstSegment(pathname) === "deliverables",
    profile: {
      kind: "B2B",
      servedAudience: "Operators and client-success teams verifying what each offer actually delivers.",
      primaryPersona: "Delivery lead, quality reviewer, agency operator, or founder checking fulfillment claims.",
      pagePurpose: "List finished outputs, acceptance checks, guides, and implementation shape for each deliverable.",
      expectedOutcome: "The reader can see what the client receives and what the operator must support.",
      notFor: "Not a sales-only page with vague promises.",
      showBanner: true,
    },
  },
  {
    id: "directory",
    routeLabel: "/directory/*",
    test: (pathname) => firstSegment(pathname) === "directory",
    profile: {
      kind: "B2B2C",
      servedAudience: "Operators building niche, local, regional, state, or national directory demand channels.",
      primaryPersona: "Directory operator, lead seller, marketplace owner, local SEO operator, or agency team.",
      pagePurpose: "Explain directory coverage, vertical routing, regional grouping, and monetizable demand paths.",
      expectedOutcome: "The operator understands how directory traffic becomes routed leads, offers, or marketplace supply.",
      notFor: "Not a general consumer directory detached from operator monetization.",
      showBanner: true,
    },
  },
  {
    id: "marketplace",
    routeLabel: "/marketplace",
    test: (pathname) => normalizePath(pathname) === "/marketplace",
    profile: {
      kind: "B2B",
      servedAudience: "Lead sellers, lead buyers, operators, and marketplace managers.",
      primaryPersona: "Operator monetizing demand, buyer sourcing qualified opportunities, or manager balancing supply and demand.",
      pagePurpose: "Show how routed opportunities, buyer demand, quality, and revenue work together.",
      expectedOutcome: "The visitor knows whether they are a seller, buyer, or operator in the marketplace model.",
      notFor: "Not a consumer lead request form.",
      showBanner: true,
    },
  },
  {
    id: "persona",
    routeLabel: "/for/[persona]",
    test: (pathname) => firstSegment(pathname) === "for",
    profile: {
      kind: "B2B",
      servedAudience: "A specific operator persona evaluating whether the platform matches their business model.",
      primaryPersona: "The persona named in the URL, such as agency, consultant, SaaS, franchise, or lead seller.",
      pagePurpose: "Translate the platform into that persona's language, workflow, and expected value.",
      expectedOutcome: "The visitor sees the page as made for their role rather than a generic platform pitch.",
      notFor: "Not a cross-persona product encyclopedia.",
      showBanner: true,
    },
  },
  {
    id: "assessment",
    routeLabel: "/assess/[slug]",
    test: (pathname) => firstSegment(pathname) === "assess",
    profile: {
      kind: "B2B2C",
      servedAudience: "Operators or client-business buyers diagnosing a specific market or workflow leak.",
      primaryPersona: "Client business owner, operator, or sales lead who wants a guided diagnosis before buying.",
      pagePurpose: "Ask enough context to recommend the right workflow, package, or next step.",
      expectedOutcome: "The visitor gets a focused recommendation instead of a generic sales call request.",
      notFor: "Not a long enterprise discovery process.",
      showBanner: true,
    },
  },
  {
    id: "funnel",
    routeLabel: "/funnel/[family]",
    test: (pathname) => firstSegment(pathname) === "funnel",
    profile: {
      kind: "B2B2C",
      servedAudience: "Operators testing a funnel family and the downstream prospects who will move through it.",
      primaryPersona: "Growth operator, campaign builder, or client-business marketer.",
      pagePurpose: "Demonstrate the capture, qualification, education, checkout, or nurture path for a funnel family.",
      expectedOutcome: "The operator sees which funnel shape fits the buyer journey they are trying to install.",
      notFor: "Not a standalone content page.",
      showBanner: true,
    },
  },
  {
    id: "calculator",
    routeLabel: "/calculator",
    test: (pathname) => normalizePath(pathname) === "/calculator",
    profile: {
      kind: "B2B",
      servedAudience: "Operators and buyers trying to quantify revenue recovery, time savings, or opportunity cost.",
      primaryPersona: "Founder, agency seller, consultant, or client-business decision maker.",
      pagePurpose: "Turn abstract value into a rough financial model.",
      expectedOutcome: "The visitor can decide whether the outcome is valuable enough to buy or sell.",
      notFor: "Not a guaranteed financial forecast.",
      showBanner: true,
    },
  },
  {
    id: "docs",
    routeLabel: "/docs/*",
    test: (pathname) => firstSegment(pathname) === "docs",
    profile: {
      kind: "Developer",
      servedAudience: "Operators, implementers, developers, and technical reviewers.",
      primaryPersona: "Implementation lead, technical founder, developer, or operations teammate.",
      pagePurpose: "Explain setup, APIs, SLA, source docs, and technical operating expectations.",
      expectedOutcome: "The reader understands how to configure, integrate, verify, or govern the platform.",
      notFor: "Not a primary sales page for non-technical buyers.",
      showBanner: true,
    },
  },
  {
    id: "resources",
    routeLabel: "/resources/*, /help, /changelog, /roadmap, /setup, /production, /demo",
    test: (pathname) => ["resources", "help", "changelog", "roadmap", "setup", "production", "demo"].includes(firstSegment(pathname)),
    profile: {
      kind: "B2B",
      servedAudience: "Operators, implementers, buyers, and reviewers who need supporting proof or guidance.",
      primaryPersona: "Buyer doing diligence, operator learning the workflow, or teammate preparing launch.",
      pagePurpose: "Answer questions, show roadmap/proof, explain setup, or demonstrate the product.",
      expectedOutcome: "The visitor leaves with less uncertainty and a clearer next action.",
      notFor: "Not a replacement for package-specific onboarding.",
      showBanner: true,
    },
  },
  {
    id: "legal-trust",
    routeLabel: "/privacy, /terms, /manage-data, /preferences",
    test: (pathname) => ["privacy", "terms", "manage-data", "preferences"].includes(firstSegment(pathname)),
    profile: {
      kind: "Trust",
      servedAudience: "Operators, clients, teammates, and privacy reviewers.",
      primaryPersona: "Data subject, account owner, legal reviewer, or compliance-minded buyer.",
      pagePurpose: "Explain rights, terms, privacy, preferences, and data handling controls.",
      expectedOutcome: "The reader understands the trust boundary and knows how to manage data or consent.",
      notFor: "Not an offer page or implementation guide.",
      showBanner: true,
    },
  },
  {
    id: "dashboard",
    routeLabel: "/dashboard/*",
    test: (pathname) => firstSegment(pathname) === "dashboard",
    profile: operatorProfile,
  },
  {
    id: "white-label-runtime",
    routeLabel: "/portal/*, /p/*, /d/*, /embed/*, /lp/*, /sites/*",
    test: (pathname) => ["portal", "p", "d", "embed", "lp", "sites"].includes(firstSegment(pathname)),
    profile: whiteLabelProfile,
  },
];

export function getPageAudienceForPath(pathname: string): PageAudienceProfile {
  const path = normalizePath(pathname);

  if (path.startsWith("/industries/") && secondSegment(path)) {
    const slug = secondSegment(path);
    const audience = getIndustryAudienceModel(slug);
    return {
      id: "industry-detail",
      routeLabel: "/industries/[slug]",
      kind: audience.model,
      servedAudience: audience.buyer,
      primaryPersona: audience.buyer,
      pagePurpose: audience.buyerMessage,
      expectedOutcome: "The visitor sees the buyer, internal users, downstream audience, pains, expected outcomes, and service blueprint for this industry.",
      notFor: audience.notFor,
      showBanner: true,
    };
  }

  const rule = PAGE_AUDIENCE_RULES.find((candidate) => candidate.test(path));
  if (!rule) {
    return {
      id: "fallback",
      routeLabel: path,
      kind: "B2B",
      servedAudience: "B2B operators and implementation teams.",
      primaryPersona: "Operator, founder, delivery lead, or reviewer.",
      pagePurpose: "Support the operator journey through discovery, setup, delivery, or governance.",
      expectedOutcome: "The visitor should know what action this page supports and why it matters.",
      notFor: "Not a consumer app page.",
      showBanner: true,
    };
  }

  return { id: rule.id, routeLabel: rule.routeLabel, ...rule.profile };
}

export function getVisibleAudienceRules() {
  return PAGE_AUDIENCE_RULES.map((rule) => ({ id: rule.id, routeLabel: rule.routeLabel, ...rule.profile }));
}
