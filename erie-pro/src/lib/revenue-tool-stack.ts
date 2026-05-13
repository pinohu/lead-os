export type RevenueToolPhase = "core" | "fulfillment" | "growth" | "content" | "automation" | "later"

export type RevenueToolStatus = "active" | "selective" | "deferred"

export type RevenueTool = {
  id: string
  name: string
  phase: RevenueToolPhase
  status: RevenueToolStatus
  ownerRole: string
  job: string
  inputs: string[]
  outputs: string[]
  fallback: string
  activationRule: string
  publicFacing: boolean
}

export const revenueToolStack: RevenueTool[] = [
  {
    id: "erie-pro",
    name: "Erie.Pro / LeadOS",
    phase: "core",
    status: "active",
    ownerRole: "Public experience and source-of-truth interface",
    job: "Host service pages, funnel pages, request routing, admin review, and customer-safe public copy.",
    inputs: ["service catalog", "visitor behavior", "lead requests", "offer clicks", "purchase status"],
    outputs: ["service-aware pages", "funnel events", "lead records", "offer recommendations"],
    fallback: "Keep public pages in Next.js even when external tools are unavailable.",
    activationRule: "Always active for Erie.Pro customer and provider journeys.",
    publicFacing: true,
  },
  {
    id: "neon",
    name: "Neon",
    phase: "core",
    status: "active",
    ownerRole: "Canonical database",
    job: "Store leads, customers, purchases, events, attribution, fulfillment state, and audit records.",
    inputs: ["ConvertBox events", "ThriveCart webhooks", "Erie.Pro forms", "sync callbacks"],
    outputs: ["operational records", "admin reporting", "sync payloads", "fulfillment state"],
    fallback: "Queue or retry external syncs, but never let external systems replace Neon as the source of truth.",
    activationRule: "Every revenue event must land here first or be backfilled here.",
    publicFacing: false,
  },
  {
    id: "convertbox",
    name: "ConvertBox",
    phase: "core",
    status: "active",
    ownerRole: "On-site segmentation and guided overlays",
    job: "Qualify visitors, separate requester/provider intent, capture service context, and route people to the right next step.",
    inputs: ["page URL", "service slug", "visitor intent", "ConvertBox step answers"],
    outputs: ["lead submissions", "funnel interactions", "checkout starts", "segmentation tags"],
    fallback: "Native Erie.Pro forms and funnel pages remain available when overlays are not shown.",
    activationRule: "Use when an overlay improves clarity without blocking the page experience.",
    publicFacing: true,
  },
  {
    id: "thrivecart",
    name: "ThriveCart Pro+/Ultimate",
    phase: "core",
    status: "active",
    ownerRole: "Checkout and revenue optimization engine",
    job: "Run checkouts, bumps, one-click upsells, downsells, coupons, affiliates, subscriptions, abandoned cart, and A/B tests.",
    inputs: ["offer slug", "service context", "customer details", "UTM data", "affiliate and coupon data"],
    outputs: ["orders", "bump purchases", "upsells", "downsells", "subscription events", "refunds", "abandoned carts"],
    fallback: "Stripe checkout remains only for legacy provider billing paths, not productized Erie.Pro offers.",
    activationRule: "Every paid productized offer should use a complete ThriveCart funnel, not a bare checkout.",
    publicFacing: true,
  },
  {
    id: "boostspace",
    name: "Boost.space",
    phase: "core",
    status: "active",
    ownerRole: "Integration bus",
    job: "Sync canonical Neon events into operational tools without making those tools the system of record.",
    inputs: ["fulfilled purchases", "lead events", "customer events", "routing metadata"],
    outputs: ["automation records", "cross-tool syncs", "retryable workflow handoffs"],
    fallback: "Direct API calls or Taskade tasks when a Boost.space module is not configured.",
    activationRule: "Use for repeatable cross-app syncs after Neon has stored the event.",
    publicFacing: false,
  },
  {
    id: "suitedash",
    name: "SuiteDash",
    phase: "core",
    status: "active",
    ownerRole: "Client and provider operations",
    job: "Create contacts, provider/client records, portal context, onboarding notes, and fulfillment workspace records.",
    inputs: ["purchases", "lead records", "customer profiles", "generated asset URLs"],
    outputs: ["CRM contacts", "portal records", "support context", "delivery notes"],
    fallback: "Neon admin records and Taskade tasks if SuiteDash sync fails.",
    activationRule: "Use for customers/providers who need ongoing relationship management.",
    publicFacing: false,
  },
  {
    id: "taskade",
    name: "Taskade",
    phase: "fulfillment",
    status: "active",
    ownerRole: "Internal task handoff",
    job: "Track manual review, fulfillment follow-up, content production, and admin exceptions.",
    inputs: ["failed syncs", "fulfillment jobs", "review-needed events"],
    outputs: ["tasks", "work queues", "operator reminders"],
    fallback: "Admin dashboard queues.",
    activationRule: "Use when human follow-up is needed or a fulfillment job cannot be fully automated.",
    publicFacing: false,
  },
  {
    id: "productdyno",
    name: "ProductDyno",
    phase: "fulfillment",
    status: "selective",
    ownerRole: "Protected digital delivery",
    job: "Deliver paid digital products, member downloads, template kits, and protected resource libraries.",
    inputs: ["paid purchase", "customer email", "offer slug", "asset entitlement"],
    outputs: ["access links", "member access", "protected downloads"],
    fallback: "Erie.Pro generated asset pages for simple one-off deliverables.",
    activationRule: "Use only when protected or repeated access is better than a one-off Erie.Pro asset page.",
    publicFacing: true,
  },
  {
    id: "upviral",
    name: "UpViral",
    phase: "growth",
    status: "selective",
    ownerRole: "Referral and waitlist growth",
    job: "Run referral contests, waitlists, giveaways, provider recruitment loops, and partner campaigns.",
    inputs: ["campaign promise", "reward", "participant email", "referral source"],
    outputs: ["referred leads", "waitlist positions", "campaign attribution"],
    fallback: "ConvertBox capture plus Erie.Pro email follow-up when viral mechanics do not fit.",
    activationRule: "Use only for campaigns with a real share-worthy reward or priority-access mechanic.",
    publicFacing: true,
  },
  {
    id: "formaloo-gozen",
    name: "Formaloo / GoZen Forms",
    phase: "growth",
    status: "selective",
    ownerRole: "Specialized intake forms",
    job: "Handle complex forms when ConvertBox or native Erie.Pro forms are insufficient.",
    inputs: ["form schema", "visitor answers", "routing fields"],
    outputs: ["structured submissions", "webhook payloads"],
    fallback: "Native Erie.Pro forms.",
    activationRule: "Use only for complex intake that would slow the native page build.",
    publicFacing: true,
  },
  {
    id: "emailit-reoon",
    name: "Emailit / Reoon",
    phase: "growth",
    status: "selective",
    ownerRole: "Email delivery and verification",
    job: "Send transactional notices and verify emails before outreach or high-value lead delivery.",
    inputs: ["email addresses", "delivery templates", "transactional events"],
    outputs: ["verified emails", "delivery events", "transactional messages"],
    fallback: "Existing Erie.Pro email provider and manual review.",
    activationRule: "Use before outbound/provider prospecting and for lightweight transactional paths.",
    publicFacing: false,
  },
  {
    id: "prospecting",
    name: "Clodura / Google Maps Scraper / Outscraper / Happierleads / Salespanel",
    phase: "growth",
    status: "selective",
    ownerRole: "Provider prospecting and B2B intent",
    job: "Find, enrich, and prioritize provider prospects and identify B2B visitor intent.",
    inputs: ["service categories", "Erie County geography", "visitor/company signals"],
    outputs: ["prospect lists", "enrichment fields", "intent signals"],
    fallback: "Manual provider research and current directory data.",
    activationRule: "Use after compliance review and only for provider-side growth, not requester service flows.",
    publicFacing: false,
  },
  {
    id: "seo-content",
    name: "NeuronWriter / WriterZen / SEO Generator / Katteb / WordHero / SheetMagic",
    phase: "content",
    status: "selective",
    ownerRole: "SEO and content production",
    job: "Support service-page briefs, county-focused long-tail content, seasonal pages, and content calendars.",
    inputs: ["service catalog", "keyword targets", "county intent", "seasonality"],
    outputs: ["briefs", "content drafts", "optimization checks", "content calendars"],
    fallback: "Erie.Pro internal templates and manual editorial review.",
    activationRule: "Use for content planning and drafting; final public copy stays in Erie.Pro.",
    publicFacing: false,
  },
  {
    id: "documents",
    name: "Documentero / Crove / UPDF",
    phase: "fulfillment",
    status: "selective",
    ownerRole: "Generated documents and deliverables",
    job: "Generate PDFs, scorecards, blueprints, proposals, checklists, and client-facing reports.",
    inputs: ["purchase data", "service context", "generated asset content"],
    outputs: ["PDFs", "reports", "proposal documents"],
    fallback: "Erie.Pro HTML asset pages.",
    activationRule: "Use when the purchased deliverable should feel like a formal document.",
    publicFacing: true,
  },
  {
    id: "rpa",
    name: "Robomotion / RTILA / TaskMagic / PROCESIO",
    phase: "automation",
    status: "selective",
    ownerRole: "Fallback automation",
    job: "Automate UI-only workflows when no reliable API or webhook exists.",
    inputs: ["manual workflow steps", "operator credentials", "safe run rules"],
    outputs: ["completed UI tasks", "sync status", "exception logs"],
    fallback: "Manual admin task in Taskade.",
    activationRule: "Use only after API and Boost.space options are ruled out.",
    publicFacing: false,
  },
  {
    id: "call-chat",
    name: "CallScaler / SMS-iT / Insighto / Chatbase",
    phase: "later",
    status: "deferred",
    ownerRole: "Voice, SMS, and AI assistant layer",
    job: "Add call tracking, SMS recovery, voice/chat assistants, and advanced conversation routing.",
    inputs: ["phone events", "SMS consent", "chat transcripts", "service context"],
    outputs: ["call attribution", "SMS follow-up", "assistant conversations"],
    fallback: "Current forms, phone links, and email follow-up.",
    activationRule: "Activate only after core checkout, lead, and fulfillment measurement is stable.",
    publicFacing: true,
  },
]

export function getRevenueToolStackSummary() {
  const byPhase = revenueToolStack.reduce<Record<RevenueToolPhase, RevenueTool[]>>((groups, tool) => {
    groups[tool.phase] = groups[tool.phase] ?? []
    groups[tool.phase].push(tool)
    return groups
  }, {} as Record<RevenueToolPhase, RevenueTool[]>)

  return {
    totalTools: revenueToolStack.length,
    activeTools: revenueToolStack.filter((tool) => tool.status === "active").length,
    selectiveTools: revenueToolStack.filter((tool) => tool.status === "selective").length,
    deferredTools: revenueToolStack.filter((tool) => tool.status === "deferred").length,
    byPhase,
  }
}

export function getCoreEventPath() {
  return [
    "Erie.Pro page or ConvertBox overlay",
    "ThriveCart checkout/funnel when payment is needed",
    "Neon canonical event and purchase record",
    "Boost.space integration sync",
    "SuiteDash operations record",
    "ProductDyno, Taskade, or document delivery when the offer requires it",
  ]
}
