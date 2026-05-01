import type { PackageSlug } from "./package-catalog";

export const directorySolutionPackages: PackageSlug[] = [
  "directory-monetization-system",
  "marketplace-lead-seller-system",
  "franchise-territory-router",
  "local-service-lead-engine",
];

export const directoryAudiences = [
  {
    title: "Directory owner",
    body: "Local directory, media site, niche directory, community portal, review site, or association that wants to monetize demand.",
  },
  {
    title: "Lead buyer",
    body: "Service provider, franchisee, agency, sponsor, or partner that pays for routed opportunities in approved categories and markets.",
  },
  {
    title: "Consumer or business requester",
    body: "The downstream visitor who submits a category-specific request and receives a clear next step without seeing internal tools.",
  },
  {
    title: "Operator team",
    body: "The team that monitors route health, buyer capacity, billing status, delivery outcomes, and revenue performance.",
  },
];

export const directoryCategories = [
  {
    key: "plumbing",
    label: "Plumbing",
    market: "Erie, PA",
    urgency: "Emergency and same-day jobs",
    buyer: "plumber_erie_test_1",
    priceBand: "$35-$95 per qualified lead",
  },
  {
    key: "hvac",
    label: "HVAC",
    market: "Erie, PA",
    urgency: "Repair, replacement, and maintenance",
    buyer: "hvac_erie_test_1",
    priceBand: "$45-$125 per qualified lead",
  },
  {
    key: "roofing",
    label: "Roofing",
    market: "Any local service market",
    urgency: "Storm damage, quotes, insurance work",
    buyer: "Configured buyer node",
    priceBand: "$60-$180 per qualified lead",
  },
  {
    key: "dental",
    label: "Dental",
    market: "Any clinic market",
    urgency: "New patient, emergency, high-value treatment",
    buyer: "Configured buyer node",
    priceBand: "$40-$150 per qualified lead",
  },
];

export const directoryFlowSteps = [
  {
    title: "Category request",
    body: "The requester chooses a category, market, urgency, contact method, and problem description from a public intake page.",
    surface: "Capture surface",
  },
  {
    title: "Node resolution",
    body: "The system resolves the active buyer node for that tenant, category, location, and exclusivity rule.",
    surface: "Routing engine",
  },
  {
    title: "Billing gate",
    body: "If billing enforcement is enabled, inactive subscriptions are blocked before delivery so unpaid buyers do not receive leads.",
    surface: "Revenue guard",
  },
  {
    title: "Delivery handoff",
    body: "Qualified lead details are sent through the delivery hub to CRM, webhook, automation, or simulated handoff when credentials are not connected.",
    surface: "Delivery hub",
  },
  {
    title: "Audit and reporting",
    body: "The route is logged with category, node, delivery mode, outcome, and trace events for operator review.",
    surface: "Operator reporting",
  },
];

export const directorySurfaces = [
  {
    title: "Public category intake",
    body: "A customer-facing page that asks only for the information required to route the request.",
    href: "/directory/lead-router#intake-preview",
  },
  {
    title: "Buyer routing matrix",
    body: "Visible category-to-buyer rules with fallback, billing, and delivery states.",
    href: "/directory/lead-router#routing-matrix",
  },
  {
    title: "Lead marketplace inventory",
    body: "Buyer-facing inventory with score, temperature, category, market, and claim action.",
    href: "/marketplace",
  },
  {
    title: "Provisionable package",
    body: "The sellable solution that creates the intake, routing, pricing, buyer onboarding, and reporting outputs.",
    href: "/packages/directory-monetization-system",
  },
  {
    title: "Implementation runbook",
    body: "Website-rendered documentation for the Erie seeded implementation and production limitations.",
    href: "/docs/erie-pro",
  },
  {
    title: "Source reference",
    body: "Read-only website view of the route resolver and delivery handoff implementation.",
    href: "/docs/source/src/lib/erie/directory-lead-flow.ts",
  },
];

export const directoryNicheExamples = [
  "home-service directories",
  "medical provider directories",
  "legal referral directories",
  "local media business directories",
  "franchise territory routers",
  "B2B vendor directories",
  "creator or expert marketplaces",
  "review and comparison sites",
];
