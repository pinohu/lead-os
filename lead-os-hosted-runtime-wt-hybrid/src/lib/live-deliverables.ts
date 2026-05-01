import { publicPlans, type PublicPlanId } from "./public-offer.ts";

export type DeliverableSlug =
  | "lead-capture-workspace"
  | "lead-scoring-routing"
  | "email-nurture-workflow"
  | "embed-capture-script"
  | "operator-dashboard"
  | "ab-testing-surface"
  | "attribution-view"
  | "channel-readiness"
  | "marketplace-surface"
  | "support-lane"
  | "funnel-library"
  | "production-launch-checklist";

export interface LiveDeliverable {
  slug: DeliverableSlug;
  title: string;
  planIds: PublicPlanId[];
  audienceModel: "B2B" | "B2B2C";
  audienceSummary: string;
  buyerOutcome: string;
  deliveredArtifact: string;
  backendReality: string;
  livePath: string;
  acceptanceCriteria: string[];
}

export interface LiveDeliverableGuide {
  summary: string;
  startHere: string[];
  implementationSteps: string[];
  operatingWorkflow: string[];
  acceptanceChecklist: string[];
  failureStates: string[];
  nextMilestones: string[];
}

export const liveDeliverables: LiveDeliverable[] = [
  {
    slug: "lead-capture-workspace",
    title: "Hosted lead capture workspace",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B2C",
    audienceSummary: "Bought by businesses or agencies; used by the client's leads, patients, shoppers, or prospects.",
    buyerOutcome: "A public intake page that captures a lead and returns a traceable lead record.",
    deliveredArtifact: "A hosted workspace page, intake form, score, stage, routing decision, and lead key.",
    backendReality: "Powered by the same intake runtime used by /api/intake, running in dry-run/provider-safe mode until production services are connected.",
    livePath: "/deliverables/lead-capture-workspace",
    acceptanceCriteria: [
      "Lead form accepts name, email, phone, and service intent.",
      "Submission returns a lead key, score, stage, and routing family.",
      "No manual handoff is required to produce the artifact.",
    ],
  },
  {
    slug: "lead-scoring-routing",
    title: "Basic lead scoring and routing",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B2C",
    audienceSummary: "Bought by operators; converts end-customer signals into routing decisions for the business.",
    buyerOutcome: "A lead is scored and assigned the next best action.",
    deliveredArtifact: "Intent, fit, engagement, urgency, composite score, temperature, and route recommendation.",
    backendReality: "Uses the scoring engine and routing orchestrator directly from server code.",
    livePath: "/deliverables/lead-scoring-routing",
    acceptanceCriteria: [
      "Input signals produce a score without operator intervention.",
      "Temperature is shown in plain language.",
      "The route tells the operator what should happen next.",
    ],
  },
  {
    slug: "email-nurture-workflow",
    title: "Email nurture workflow",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B2C",
    audienceSummary: "Bought by the business; experienced by leads or customers after they enter the funnel.",
    buyerOutcome: "A new lead receives a prepared follow-up sequence.",
    deliveredArtifact: "A five-step nurture sequence with timing, subject, message purpose, and send mode.",
    backendReality: "The sequence is generated immediately; live sending remains disabled until outbound provider credentials are attached.",
    livePath: "/deliverables/email-nurture-workflow",
    acceptanceCriteria: [
      "Sequence exists immediately after setup.",
      "Each step has timing and purpose.",
      "Dry-run/live mode is visible instead of hidden.",
    ],
  },
  {
    slug: "embed-capture-script",
    title: "Embeddable capture script",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B2C",
    audienceSummary: "Installed for a business website; used by its visitors to start the outcome flow.",
    buyerOutcome: "A customer can paste a script into a site to mount lead capture.",
    deliveredArtifact: "A tenant-aware script tag and live embedded capture preview.",
    backendReality: "Onboarding already returns this script; the example shows the final artifact with a working intake preview.",
    livePath: "/deliverables/embed-capture-script",
    acceptanceCriteria: [
      "Script includes a tenant identifier.",
      "Widget preview captures a lead.",
      "The artifact is available immediately after signup.",
    ],
  },
  {
    slug: "operator-dashboard",
    title: "Operator dashboard access",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B",
    audienceSummary: "Used by business operators, agencies, and internal teams to run fulfillment.",
    buyerOutcome: "An operator can see workspace health, lead flow, and production readiness from one place.",
    deliveredArtifact: "Dashboard route plus a public example operator snapshot.",
    backendReality: "Dashboard routes are deployed; sensitive mutations remain authenticated.",
    livePath: "/deliverables/operator-dashboard",
    acceptanceCriteria: [
      "Dashboard URL is present after onboarding.",
      "Health, leads, routing, and activation status are visible.",
      "Protected actions remain behind operator auth.",
    ],
  },
  {
    slug: "ab-testing-surface",
    title: "A/B testing surface",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B2C",
    audienceSummary: "Bought by businesses; optimizes offers shown to prospects, buyers, patients, or shoppers.",
    buyerOutcome: "A workspace can compare two offer variants and identify the active winner candidate.",
    deliveredArtifact: "Offer A, Offer B, assignment, conversion counts, and current winner.",
    backendReality: "The example is generated from deterministic sample events so the artifact is complete without manual setup.",
    livePath: "/deliverables/ab-testing-surface",
    acceptanceCriteria: [
      "Two variants are shown.",
      "Traffic assignment is visible.",
      "Winner logic is explained with conversion math.",
    ],
  },
  {
    slug: "attribution-view",
    title: "Attribution view",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B",
    audienceSummary: "Used by operators and clients to understand source, pipeline, and ROI performance.",
    buyerOutcome: "A customer can see where leads came from and which source deserves credit.",
    deliveredArtifact: "UTM source, channel, lead count, qualified count, pipeline value, and ROI summary.",
    backendReality: "The example mirrors the attribution fields collected by intake and analytics routes.",
    livePath: "/deliverables/attribution-view",
    acceptanceCriteria: [
      "Sources are grouped in one table.",
      "Qualified leads are separated from raw leads.",
      "Revenue attribution math is visible.",
    ],
  },
  {
    slug: "channel-readiness",
    title: "WhatsApp-ready channel toggle",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    audienceModel: "B2B",
    audienceSummary: "Used by the business or delivery team before customer-facing channels go live.",
    buyerOutcome: "An operator can select intended channels and see what is ready versus waiting on credentials.",
    deliveredArtifact: "Email, SMS, WhatsApp, chat, booking, CRM, and document readiness matrix.",
    backendReality: "Provider toggles are stored during onboarding; live sends require verified credentials.",
    livePath: "/deliverables/channel-readiness",
    acceptanceCriteria: [
      "Each channel has a readiness state.",
      "Missing credential requirements are explicit.",
      "No channel is represented as live unless configured.",
    ],
  },
  {
    slug: "marketplace-surface",
    title: "Marketplace access surface",
    planIds: ["whitelabel-enterprise"],
    audienceModel: "B2B2C",
    audienceSummary: "Bought by lead sellers or marketplaces; connects end-customer demand to business buyers.",
    buyerOutcome: "A lead seller can show scored inventory and buyer claim flow.",
    deliveredArtifact: "Lead cards, quality score, temperature, price, claim action, and outcome reporting.",
    backendReality: "Marketplace routes are deployed; the example uses safe sample inventory when no production database is attached.",
    livePath: "/deliverables/marketplace-surface",
    acceptanceCriteria: [
      "Inventory is visible as lead cards.",
      "Claim and outcome concepts are represented.",
      "Sample mode is clearly labeled when database inventory is unavailable.",
    ],
  },
  {
    slug: "support-lane",
    title: "Priority support lane",
    planIds: ["whitelabel-enterprise"],
    audienceModel: "B2B",
    audienceSummary: "Used by client teams and business customers to request support on the launched system.",
    buyerOutcome: "A customer can open a priority support request and receive a ticket reference.",
    deliveredArtifact: "Priority ticket form, generated ticket ID, severity, response target, and next step.",
    backendReality: "This public example creates a deterministic support artifact; production helpdesk delivery requires provider credentials.",
    livePath: "/deliverables/support-lane",
    acceptanceCriteria: [
      "Ticket ID is generated immediately.",
      "Severity and response target are visible.",
      "Next step is explicit.",
    ],
  },
  {
    slug: "funnel-library",
    title: "Unlimited funnel definitions",
    planIds: ["whitelabel-enterprise"],
    audienceModel: "B2B",
    audienceSummary: "Used by agencies, operators, and client teams to understand the installed funnel logic.",
    buyerOutcome: "A customer can see the exact funnel blueprint created for a workspace.",
    deliveredArtifact: "Named funnel, stages, trigger events, routing rules, and conversion goal.",
    backendReality: "The blueprint is a runtime-ready definition; production persistence requires database configuration.",
    livePath: "/deliverables/funnel-library",
    acceptanceCriteria: [
      "Funnel stages are listed in order.",
      "Triggers and routing rules are concrete.",
      "The conversion goal is measurable.",
    ],
  },
  {
    slug: "production-launch-checklist",
    title: "Production launch checklist",
    planIds: ["whitelabel-enterprise"],
    audienceModel: "B2B",
    audienceSummary: "Used by internal operators and client stakeholders to verify production readiness.",
    buyerOutcome: "A customer can see exactly what must be connected before launch.",
    deliveredArtifact: "Database, queues, billing, live sends, domain, auth, and monitoring checklist.",
    backendReality: "Reads the same production readiness facts surfaced by /api/production-readiness.",
    livePath: "/deliverables/production-launch-checklist",
    acceptanceCriteria: [
      "Every launch dependency is visible.",
      "Current configured/not-configured state is not hidden.",
      "The customer knows the next action.",
    ],
  },
];

export function getLiveDeliverable(slug: string): LiveDeliverable | undefined {
  return liveDeliverables.find((item) => item.slug === slug);
}

export function getPlanDeliverables(planId: PublicPlanId): LiveDeliverable[] {
  return liveDeliverables.filter((item) => item.planIds.includes(planId));
}

export function getPublicPlanName(planId: PublicPlanId): string {
  return publicPlans.find((plan) => plan.id === planId)?.name ?? planId;
}

export function getLiveDeliverableGuide(deliverable: LiveDeliverable): LiveDeliverableGuide {
  return {
    summary: `${deliverable.title} is a working building block inside a complete Lead OS solution. It exists so the business buyer can understand exactly what was created, how it is used, and how completion is verified.`,
    startHere: [
      "Read the buyer outcome first.",
      "Confirm whether the block is B2B internal or B2B2C customer-facing.",
      "Review the delivered artifact and backend reality before using the example.",
      "Run or inspect the live example on this page.",
    ],
    implementationSteps: [
      "Use the block inside a package workspace, not as a disconnected asset.",
      "Match the block to the client success metric before presenting it as value.",
      "If the block touches downstream customers, verify the copy, consent, routing, and escalation expectations.",
      "If the block depends on live account access, use safe sample or managed-handoff mode until approved access exists.",
      "Document the next operator action in the client delivery hub.",
    ],
    operatingWorkflow: [
      "Capture or inspect the input.",
      "Produce the visible artifact.",
      "Route the result to the correct business or customer-facing next step.",
      "Measure the result against the acceptance criteria.",
      "Improve the package workflow if the artifact does not advance the promised outcome.",
    ],
    acceptanceChecklist: [
      ...deliverable.acceptanceCriteria,
      "The customer can explain what this block does in one sentence.",
      "The next action is visible without reading source code or asking support.",
      "Dry-run, sample, managed-handoff, or live status is not hidden.",
    ],
    failureStates: [
      "If the artifact looks like a sample, treat it as a demo until connected package data is present.",
      "If the next action requires a client-owned account, do not represent it as live until approved access exists.",
      "If the block does not map to the selected package outcome, return to the package delivery hub.",
      "If the customer cannot tell what to do next, use the implementation steps and acceptance checklist before handoff.",
    ],
    nextMilestones: [
      "Today: confirm the block exists and the acceptance criteria are visible.",
      "This week: connect it to a package workspace or run a sample scenario.",
      "This month: use reporting evidence to decide whether the surrounding package should be optimized, expanded, or bundled.",
    ],
  };
}
