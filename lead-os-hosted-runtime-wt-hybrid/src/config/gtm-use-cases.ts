// src/config/gtm-use-cases.ts
// Maps revenue playbooks → runtime features (intake, directory routing, billing, hub, control plane).
// Single source for product/engineering alignment; keep in sync with docs/GO-TO-MARKET-USE-CASES.md

export interface GtmUseCase {
  id: number;
  slug: string;
  /** Optional marketing-facing blurb (CLI / dashboard). */
  summary?: string;
  /** Alternate slugs for filters and bookmarks (e.g. `erie-plumbing` → Erie #1). */
  slugAliases?: readonly string[];
  title: string;
  /** What in this repo backs the play today */
  technicalAnchors: string[];
  /** Env / config knobs */
  envKeys: string[];
  /** First actions aligned to “this week” column */
  weekOneActions: string[];
}

export const GTM_USE_CASES: readonly GtmUseCase[] = [
  {
    id: 1,
    slug: "erie-exclusive-niche",
    slugAliases: ["erie-plumbing"],
    summary:
      "Erie directory tenant with plumbing-first exclusive niche: intake → directory-lead-flow → nodes (010) → lead-delivery-hub.",
    title: "Erie.pro — exclusive niche routing (plumbing first)",
    technicalAnchors: [
      "POST /api/intake",
      "db/migrations/010_erie_directory_seed.sql",
      "src/lib/erie/directory-lead-flow.ts",
      "src/lib/integrations/lead-delivery-hub.ts",
      "nodes.metadata.category → node_key",
    ],
    envKeys: [
      "LEAD_OS_TENANT_ID=erie",
      "LEAD_OS_DIRECTORY_TENANTS=erie",
      "LEAD_OS_BILLING_ENFORCE",
      "SUITEDASH_*",
      "ACTIVEPIECES_WEBHOOK_URL",
    ],
    weekOneActions: [
      "Ship plumbing landing + form POSTing to /api/intake with x-tenant-id: erie + category: plumbing",
      "Confirm migration 010 applied; plumber_erie_test_1 active",
      "Run one test lead; verify lead_os_directory_routes + events",
      "Outreach: 20 plumbers with live demo link",
    ],
  },
  {
    id: 2,
    slug: "exclusive-category-ownership",
    title: "Exclusive category ownership (city × niche)",
    technicalAnchors: [
      "Same as #1; one active node per (tenant_id, metadata.category) — ops rule",
      "LEAD_OS_SINGLE_TENANT_ENFORCE + per-city LEAD_OS_TENANT_ID or extra tenant rows",
      "billing_subscriptions per tenant",
    ],
    envKeys: ["LEAD_OS_TENANT_ID", "LEAD_OS_DIRECTORY_TENANTS", "LEAD_OS_BILLING_ENFORCE"],
    weekOneActions: [
      "Package: “Only plumber for Erie” → one paying tenant config",
      "Seed one node per sold category; pause competitors’ nodes in control plane",
      "Close 1 deal; enable node + run test lead",
    ],
  },
  {
    id: 3,
    slug: "managed-lead-ops",
    title: "Managed lead ops (done-for-you automation)",
    technicalAnchors: [
      "lead-delivery-hub sendLead / triggerWorkflow / notifyClient",
      "SuiteDash + Activepieces webhooks",
      "POST /api/intake + operator control plane",
    ],
    envKeys: ["SUITEDASH_*", "ACTIVEPIECES_WEBHOOK_URL", "LEAD_OS_AUTOMATION_WEBHOOK_URL", "PABBLY_WEBHOOK_URL"],
    weekOneActions: [
      "Pick vertical (e.g. pest control); clone 010 pattern for tenant slug",
      "Connect webhook; dry-run with LEAD_OS_ENABLE_LIVE_SENDS=false then flip",
      "Demo to 3 prospects with control plane + intake JSON",
    ],
  },
  {
    id: 4,
    slug: "national-territory-directory",
    title: "National niche directory territories",
    technicalAnchors: [
      "Repeat tenant + nodes per city; LEAD_OS_DIRECTORY_TENANTS=a,b,c",
      "Same intake + directory-lead-flow per tenant",
    ],
    envKeys: ["LEAD_OS_DIRECTORY_TENANTS", "LEAD_OS_TENANT_ID"],
    weekOneActions: [
      "After Erie proof: add second tenant row + nodes migration or SQL seed",
      "Point subdomain or x-tenant-id at new tenant",
      "Reuse docs/ERIE-PRO.md flow",
    ],
  },
  {
    id: 5,
    slug: "white-label-agencies",
    title: "White-label for agencies / consultants",
    technicalAnchors: [
      "billing_plans / billing_subscriptions (007+)",
      "Operator session + POST /api/operator/actions",
      "Per-agency LEAD_OS_TENANT_ID deployment or multi-tenant DB rows",
    ],
    envKeys: ["LEAD_OS_BILLING_ENFORCE", "LEAD_OS_OPERATOR_EMAILS", "STRIPE_*"],
    weekOneActions: [
      "Define agency plan in billing_plans if custom tier needed",
      "Demo dashboard control plane + intake + routing",
      "One agency pilot tenant",
    ],
  },
  {
    id: 6,
    slug: "home-services-concierge",
    title: "Home services concierge / broker",
    technicalAnchors: [
      "Multiple categories → multiple nodes (metadata.category)",
      "directory-lead-flow category resolution",
    ],
    envKeys: ["LEAD_OS_DIRECTORY_TENANTS"],
    weekOneActions: [
      "Add nodes for categories you broker (hvac, electrical, …)",
      "Single “request anything” form maps category client-side",
      "Route to 1–2 nodes; test each category",
    ],
  },
  {
    id: 7,
    slug: "legal-immigration-intake",
    title: "Immigration / legal intake routing",
    technicalAnchors: [
      "POST /api/intake + metadata / message for case summary",
      "Category = practice area key matching node metadata.category",
      "Billing gate for high-value seat",
    ],
    envKeys: ["LEAD_OS_BILLING_ENFORCE", "LEAD_OS_DIRECTORY_TENANTS"],
    weekOneActions: [
      "Intake form fields → body.message + category specialty slug",
      "One attorney node; pilot with LEAD_OS_ENABLE_LIVE_SENDS controlled",
    ],
  },
  {
    id: 8,
    slug: "internal-ops-yourdeputy",
    title: "Internal ops engine (YourDeputy stack)",
    technicalAnchors: [
      "All forms → POST /api/intake",
      "/dashboard/control-plane — nodes, DLQ, pricing tick",
      "Idempotency-Key on intake for dedupe",
    ],
    envKeys: ["LEAD_OS_AUTH_SECRET", "CRON_SECRET", "REDIS_URL"],
    weekOneActions: [
      "Pipe internal forms to /api/intake with correct x-tenant-id",
      "Monitor DLQ + queue via operator UI",
    ],
  },
  {
    id: 9,
    slug: "integration-hub",
    title: "Integration hub (reduce Zapier sprawl)",
    technicalAnchors: [
      "lead-delivery-hub.ts central outbound",
      "ACTIVEPIECES_WEBHOOK_URL + optional PABBLY_WEBHOOK_URL",
      "Canonical events for observability",
    ],
    envKeys: ["ACTIVEPIECES_WEBHOOK_URL", "PABBLY_WEBHOOK_URL", "LEAD_OS_AUTOMATION_WEBHOOK_URL"],
    weekOneActions: [
      "Point Activepieces/Pabbly at one workflow receiving lead_os.directory_lead JSON",
      "Turn off duplicate Zaps for same trigger",
    ],
  },
  {
    id: 10,
    slug: "platform-resale-deferred",
    title: "Platform / SaaS resale (later)",
    technicalAnchors: ["Defer until 3–5 paying case studies from #1–9"],
    envKeys: [],
    weekOneActions: ["Do not start; collect case studies from Erie + one vertical clone"],
  },
] as const;

export function getGtmUseCaseById(id: number): GtmUseCase | undefined {
  return GTM_USE_CASES.find((c) => c.id === id);
}

export function getGtmUseCaseBySlug(slug: string): GtmUseCase | undefined {
  const normalized = slug.trim().toLowerCase();
  return GTM_USE_CASES.find(
    (c) => c.slug === normalized || (c.slugAliases ?? []).some((a) => a === normalized),
  );
}

export function resolveGtmCanonicalSlug(slug: string): string | undefined {
  return getGtmUseCaseBySlug(slug)?.slug;
}
