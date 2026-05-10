import { cityConfig } from "@/lib/city-config";
import { getNicheBySlug, niches } from "@/lib/niches";
import {
  TIER_BENEFITS,
  TIER_ORDER,
  type ProviderTier,
} from "@/lib/premium-rewards";

export type FulfillmentMode =
  | "instant"
  | "scheduled"
  | "continuous"
  | "managed-autopilot";

export interface ProviderFulfillmentPromise {
  id: string;
  label: string;
  tiers: ProviderTier[];
  mode: FulfillmentMode;
  cadence: "on-activation" | "per-lead" | "monthly" | "continuous" | "on-expansion";
  automatedSteps: string[];
  evidence: string[];
  acceptanceCriteria: string[];
}

export interface ProviderFulfillmentDeliverable extends ProviderFulfillmentPromise {
  status: "provisioned";
  dueAt: string | null;
}

export interface ProviderFulfillmentPlan {
  planId: string;
  providerId: string;
  providerName: string;
  providerEmail?: string;
  niche: string;
  nicheLabel: string;
  city: string;
  cityLabel: string;
  serviceTier: ProviderTier;
  monthlyFee?: number;
  deliverables: ProviderFulfillmentDeliverable[];
}

export interface ProvisionProviderFulfillmentInput {
  providerId: string;
  providerName: string;
  providerEmail?: string;
  niche: string;
  city?: string;
  serviceTier: ProviderTier;
  monthlyFee?: number;
}

const ALL_TIERS: ProviderTier[] = ["standard", "premium", "elite"];
const PREMIUM_PLUS: ProviderTier[] = ["premium", "elite"];
const ELITE_ONLY: ProviderTier[] = ["elite"];

export const PROVIDER_FULFILLMENT_PROMISES: ProviderFulfillmentPromise[] = [
  {
    id: "exclusive-leads",
    label: "Exclusive leads in your niche",
    tiers: ALL_TIERS,
    mode: "continuous",
    cadence: "per-lead",
    automatedSteps: [
      "Create one active territory record for the niche and city.",
      "Keep the database unique constraint on niche plus city as the exclusivity lock.",
      "Route matching verified leads only to the active territory owner.",
      "Bank unmatched leads until an exclusive provider is activated.",
    ],
    evidence: [
      "territories unique niche_city row",
      "lead.routed audit event",
      "Lead.routedToId",
      "Provider.totalLeads and Provider.lastLeadAt",
    ],
    acceptanceCriteria: [
      "No second active territory can exist for the same niche and city.",
      "A matching lead routes to the provisioned provider when the provider is active and verified.",
      "A lead is not sold as a shared auction lead for an exclusively claimed niche.",
    ],
  },
  {
    id: "branded-landing-page",
    label: "Branded landing page",
    tiers: ALL_TIERS,
    mode: "instant",
    cadence: "on-activation",
    automatedSteps: [
      "Generate the provider slug from the business name and city.",
      "Publish the claimed provider profile into service and directory surfaces.",
      "Expose city, niche, service areas, description, phone, and lead CTA from the provider record.",
    ],
    evidence: [
      "Provider.slug",
      "Provider.claimedAt",
      "DirectoryListing.claimedByProviderId when a listing is claimed",
      "provider.fulfillment_provisioned audit event",
    ],
    acceptanceCriteria: [
      "The provider has a stable slug.",
      "The provider is available to local service pages and dashboard reads.",
      "Claimed listing ownership is linked when listingId was supplied.",
    ],
  },
  {
    id: "ai-lead-scoring",
    label: "AI-powered lead scoring",
    tiers: ALL_TIERS,
    mode: "continuous",
    cadence: "per-lead",
    automatedSteps: [
      "Normalize incoming lead data through the lead validation schema.",
      "Classify lead temperature for paid/banked lead flows.",
      "Persist source, status token, route type, SLA deadline, and outcome records for future routing intelligence.",
    ],
    evidence: [
      "Lead.temperature",
      "Lead.statusToken",
      "Lead.routeType",
      "LeadOutcome records",
    ],
    acceptanceCriteria: [
      "Every submitted lead has a route type and tracking token.",
      "Every purchased or routed lead can later receive an outcome.",
      "Lead outcomes can improve future provider performance reporting.",
    ],
  },
  {
    id: "seven-stage-nurture",
    label: "7-stage nurture sequence",
    tiers: ALL_TIERS,
    mode: "scheduled",
    cadence: "per-lead",
    automatedSteps: [
      "Create the lead with an SLA deadline and status token.",
      "Send the real-time new-lead notification through provider notification channels.",
      "Escalate stale leads through SLA, reminder, review, and outcome collection jobs.",
    ],
    evidence: [
      "Lead.slaDeadline",
      "Notification.deliveryStatus",
      "api/cron/sla-checker",
      "api/cron/process-delayed-leads",
    ],
    acceptanceCriteria: [
      "The lead has an SLA clock.",
      "A provider notification is queued or sent.",
      "Missed or delayed work is visible to scheduled jobs.",
    ],
  },
  {
    id: "monthly-performance-snapshot",
    label: "Monthly performance snapshot",
    tiers: ALL_TIERS,
    mode: "scheduled",
    cadence: "monthly",
    automatedSteps: [
      "Roll up total leads, converted leads, response time, ratings, and review count from provider records.",
      "Use lead outcomes as the source ledger for conversion and response-time metrics.",
      "Expose current performance in the provider dashboard and monthly report payload.",
    ],
    evidence: [
      "Provider.totalLeads",
      "Provider.convertedLeads",
      "Provider.avgResponseTime",
      "Provider.avgRating",
      "LeadOutcome records",
    ],
    acceptanceCriteria: [
      "The provider dashboard can show lead and conversion metrics.",
      "The provider has an auditable ledger of lead outcomes.",
      "Monthly reporting data can be generated without manual database intervention.",
    ],
  },
  {
    id: "featured-badge",
    label: "Featured badge on all local pages",
    tiers: PREMIUM_PLUS,
    mode: "instant",
    cadence: "on-activation",
    automatedSteps: [
      "Activate Premium or Elite perks for the territory.",
      "Derive the featured badge from the stored service tier.",
      "Expose badge label and priority styling on local pages.",
    ],
    evidence: [
      "Provider.serviceTier",
      "getPerkStatus().perks.featuredBadge",
      "getBadgeLabel(serviceTier)",
    ],
    acceptanceCriteria: [
      "Premium providers receive Featured Provider.",
      "Elite providers receive Elite Certified.",
      "Standard providers do not receive a paid badge.",
    ],
  },
  {
    id: "national-directory-listing",
    label: "Listed on national niche directory",
    tiers: PREMIUM_PLUS,
    mode: "scheduled",
    cadence: "on-activation",
    automatedSteps: [
      "Resolve national authority sites for the selected niche.",
      "Create a listing task with backlink URL, anchor text, provider, niche, and city.",
      "Attach directory coverage to the fulfillment audit event.",
    ],
    evidence: [
      "NATIONAL_SITES entries for the niche",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "The fulfillment plan includes at least one national listing task when a national site exists.",
      "If no national site exists yet, the plan records a coverage task instead of silently skipping the promise.",
    ],
  },
  {
    id: "review-automation",
    label: "Automated review collection after each job",
    tiers: PREMIUM_PLUS,
    mode: "scheduled",
    cadence: "per-lead",
    automatedSteps: [
      "Wait for converted or responded lead outcomes.",
      "Trigger review request notifications after completed jobs.",
      "Persist review notification status and provider review count.",
    ],
    evidence: [
      "LeadOutcome.outcome",
      "Notification.type=review_received",
      "Provider.reviewCount",
    ],
    acceptanceCriteria: [
      "Review collection is tied to outcome data.",
      "Review automation is enabled only for Premium and Elite providers.",
    ],
  },
  {
    id: "monthly-pdf-report",
    label: "Detailed monthly PDF performance report",
    tiers: PREMIUM_PLUS,
    mode: "scheduled",
    cadence: "monthly",
    automatedSteps: [
      "Compile monthly lead, response, conversion, and review metrics.",
      "Generate a detailed report payload for PDF rendering.",
      "Record report coverage in fulfillment evidence.",
    ],
    evidence: [
      "Provider performance metrics",
      "LeadOutcome records",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "The report data can be generated from persisted provider and lead records.",
      "The provider tier is Premium or Elite.",
    ],
  },
  {
    id: "social-media-mentions",
    label: "Social media mentions",
    tiers: PREMIUM_PLUS,
    mode: "scheduled",
    cadence: "monthly",
    automatedSteps: [
      "Read the monthly mention count from tier benefits.",
      "Create recurring content slots tied to provider, niche, and city.",
      "Record the required count in the fulfillment plan.",
    ],
    evidence: [
      "TIER_BENEFITS.socialMediaMentions",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "Premium plans require exactly 2 social mentions per month.",
      "Elite plans require exactly 4 social mentions per month.",
    ],
  },
  {
    id: "priority-placement",
    label: "Priority placement in search results",
    tiers: PREMIUM_PLUS,
    mode: "continuous",
    cadence: "continuous",
    automatedSteps: [
      "Activate priority placement perk for Premium and Elite providers.",
      "Sort local provider surfaces using service tier before unpaid directory listings.",
      "Keep priority derivation tied to stored service tier.",
    ],
    evidence: [
      "Provider.serviceTier",
      "getPerkStatus().perks.priorityPlacement",
    ],
    acceptanceCriteria: [
      "Premium and Elite providers are flagged for priority placement.",
      "Standard providers keep normal exclusive placement without Premium priority boosts.",
    ],
  },
  {
    id: "gbp-optimization",
    label: "Google Business Profile optimization",
    tiers: PREMIUM_PLUS,
    mode: "managed-autopilot",
    cadence: "monthly",
    automatedSteps: [
      "Create a GBP optimization checklist with provider, niche, service areas, and search terms.",
      "Generate suggested categories, service descriptions, post topics, and review-response prompts.",
      "Track completion through the fulfillment audit event.",
    ],
    evidence: [
      "Provider.serviceAreas",
      "LocalNiche.searchTerms",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "Premium and Elite providers receive a GBP optimization task set.",
      "The task set is generated from local niche and provider data.",
    ],
  },
  {
    id: "elite-certified-badge",
    label: "Elite Certified badge on all pages",
    tiers: ELITE_ONLY,
    mode: "instant",
    cadence: "on-activation",
    automatedSteps: [
      "Set the stored service tier to Elite.",
      "Derive Elite Certified badge label from service tier.",
      "Expose Elite badge across local and provider surfaces.",
    ],
    evidence: [
      "Provider.serviceTier=elite",
      "getBadgeLabel('elite')",
    ],
    acceptanceCriteria: [
      "Elite providers receive Elite Certified.",
      "No lower tier can receive the Elite Certified badge.",
    ],
  },
  {
    id: "branded-content",
    label: "Branded content mentioning your business",
    tiers: ELITE_ONLY,
    mode: "scheduled",
    cadence: "monthly",
    automatedSteps: [
      "Generate branded content briefs from provider, niche, city, and search terms.",
      "Attach content topics to the monthly fulfillment plan.",
      "Prioritize content on relevant service pages.",
    ],
    evidence: [
      "Provider.businessName",
      "LocalNiche.searchTerms",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "Elite providers receive branded content tasks.",
      "The content plan includes the business name and selected niche.",
    ],
  },
  {
    id: "competitor-intelligence",
    label: "Monthly competitor intelligence report",
    tiers: ELITE_ONLY,
    mode: "scheduled",
    cadence: "monthly",
    automatedSteps: [
      "Identify unclaimed directory listings and competing providers in the same niche.",
      "Compile search, rating, review, and local page observations.",
      "Attach the intelligence task to the monthly fulfillment plan.",
    ],
    evidence: [
      "DirectoryListing records",
      "Provider.avgRating",
      "Provider.reviewCount",
    ],
    acceptanceCriteria: [
      "Elite providers receive a monthly competitor report task.",
      "The task is scoped to the provider's niche and city.",
    ],
  },
  {
    id: "dedicated-account-manager",
    label: "Dedicated account manager",
    tiers: ELITE_ONLY,
    mode: "managed-autopilot",
    cadence: "on-activation",
    automatedSteps: [
      "Assign the provider to the Elite account-management queue.",
      "Create an onboarding task with provider contact, niche, city, and active promises.",
      "Include the assignment in fulfillment evidence.",
    ],
    evidence: [
      "Provider.serviceTier=elite",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "Elite providers are placed in the account-management queue automatically.",
      "Standard and Premium providers are not assigned this Elite-only promise.",
    ],
  },
  {
    id: "custom-marketing-materials",
    label: "Custom marketing materials",
    tiers: ELITE_ONLY,
    mode: "scheduled",
    cadence: "on-activation",
    automatedSteps: [
      "Generate a marketing-material task set using provider, niche, offer, city, and service-area data.",
      "Create assets for directory copy, social copy, and local service positioning.",
      "Attach asset requirements to the fulfillment plan.",
    ],
    evidence: [
      "Provider.businessName",
      "Provider.serviceAreas",
      "LocalNiche.description",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "Elite providers receive a custom asset task set.",
      "The task set is generated from the provider's actual claimed category.",
    ],
  },
  {
    id: "first-access-new-cities",
    label: "First access to new cities",
    tiers: ELITE_ONLY,
    mode: "continuous",
    cadence: "on-expansion",
    automatedSteps: [
      "Flag the provider for expansion waitlist priority.",
      "Use service tier and claim date to rank new-city notifications.",
      "Record the priority entitlement in fulfillment evidence.",
    ],
    evidence: [
      "Provider.serviceTier=elite",
      "Provider.claimedAt",
      "provider.fulfillment_provisioned audit metadata",
    ],
    acceptanceCriteria: [
      "Elite providers are eligible for first-access notifications.",
      "Lower-tier providers are not marked for first access unless upgraded.",
    ],
  },
];

function tierRank(tier: ProviderTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function getProviderTierPromiseIds(serviceTier: ProviderTier): string[] {
  return PROVIDER_FULFILLMENT_PROMISES
    .filter((promise) => promise.tiers.includes(serviceTier))
    .map((promise) => promise.id);
}

export function getProviderTierPromises(serviceTier: ProviderTier): ProviderFulfillmentPromise[] {
  return PROVIDER_FULFILLMENT_PROMISES.filter((promise) =>
    promise.tiers.includes(serviceTier)
  );
}

function getDueAt(cadence: ProviderFulfillmentPromise["cadence"], now: Date): string | null {
  if (cadence === "on-activation") return now.toISOString();
  if (cadence === "per-lead" || cadence === "continuous") return null;

  const dueAt = new Date(now);
  if (cadence === "monthly") dueAt.setDate(dueAt.getDate() + 30);
  if (cadence === "on-expansion") dueAt.setMonth(dueAt.getMonth() + 3);
  return dueAt.toISOString();
}

export function buildProviderFulfillmentPlan(
  input: ProvisionProviderFulfillmentInput,
  now = new Date()
): ProviderFulfillmentPlan {
  const niche = getNicheBySlug(input.niche);
  if (!niche) {
    throw new Error(`Cannot provision unknown niche: ${input.niche}`);
  }

  const serviceTier = input.serviceTier;
  if (!TIER_ORDER.includes(serviceTier)) {
    throw new Error(`Cannot provision unknown provider service tier: ${serviceTier}`);
  }

  const deliverables = getProviderTierPromises(serviceTier).map((promise) => ({
    ...promise,
    status: "provisioned" as const,
    dueAt: getDueAt(promise.cadence, now),
  }));

  return {
    planId: `${input.providerId}:${input.city ?? cityConfig.slug}:${input.niche}:${serviceTier}`,
    providerId: input.providerId,
    providerName: input.providerName,
    providerEmail: input.providerEmail,
    niche: input.niche,
    nicheLabel: niche.label,
    city: input.city ?? cityConfig.slug,
    cityLabel: cityConfig.name,
    serviceTier,
    monthlyFee: input.monthlyFee,
    deliverables,
  };
}

export function getProviderFulfillmentReadiness(): {
  nicheCount: number;
  tierCount: number;
  promiseCount: number;
  matrixRows: Array<{ niche: string; tier: ProviderTier; promiseCount: number }>;
} {
  return {
    nicheCount: niches.length,
    tierCount: TIER_ORDER.length,
    promiseCount: PROVIDER_FULFILLMENT_PROMISES.length,
    matrixRows: niches.flatMap((niche) =>
      TIER_ORDER.map((tier) => ({
        niche: niche.slug,
        tier,
        promiseCount: getProviderTierPromises(tier).length,
      }))
    ),
  };
}

export function assertTierInheritance(): void {
  for (const tier of TIER_ORDER) {
    const expectedMinimum = PROVIDER_FULFILLMENT_PROMISES.filter((promise) =>
      promise.tiers.some((promiseTier) => tierRank(promiseTier) <= tierRank(tier))
    );
    const actual = getProviderTierPromiseIds(tier);

    for (const promise of expectedMinimum) {
      if (promise.tiers.includes(tier) && !actual.includes(promise.id)) {
        throw new Error(`Tier ${tier} is missing promise ${promise.id}`);
      }
    }
  }
}

export async function provisionProviderFulfillment(
  input: ProvisionProviderFulfillmentInput
): Promise<ProviderFulfillmentPlan> {
  const plan = buildProviderFulfillmentPlan(input);
  const { audit } = await import("@/lib/audit-log");

  await audit({
    action: "provider.fulfillment_provisioned",
    entityType: "fulfillment",
    entityId: plan.planId,
    providerId: plan.providerId,
    metadata: {
      niche: plan.niche,
      city: plan.city,
      serviceTier: plan.serviceTier,
      monthlyFee: plan.monthlyFee,
      promises: plan.deliverables.map((deliverable) => ({
        id: deliverable.id,
        label: deliverable.label,
        cadence: deliverable.cadence,
        mode: deliverable.mode,
        dueAt: deliverable.dueAt,
        status: deliverable.status,
      })),
    },
  });

  return plan;
}
