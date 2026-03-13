import {
  FUNNEL_BLUEPRINTS,
  interpolateStep,
  normalizeNicheSlug,
  type FunnelBlueprint,
  type FunnelStep,
} from "./funnel-blueprints.ts";
import { nicheManifests } from "./niche-config.ts";

export interface FunnelAutomationAction {
  id: string;
  name: string;
  description: string;
  channel: "email" | "whatsapp" | "crm" | "alert" | "dashboard" | "retargeting";
  timing: "immediate" | "after-step" | "on-abandon" | "post-conversion";
}

export interface FunnelAsset {
  id: string;
  label: string;
  type: "proof" | "calculator" | "story" | "faq" | "workshop" | "checklist" | "offer";
  description: string;
}

export interface FunnelNodeImplementation {
  stepId: string;
  routeSegment: string;
  headline: string;
  subheadline: string;
  body: string[];
  proofPoints: string[];
  assets: FunnelAsset[];
  postStepAutomations: FunnelAutomationAction[];
}

export interface FunnelConnection {
  from: string;
  to: string;
  label: string;
  trigger: "default" | "abandon" | "qualify" | "upsell";
}

export interface FunnelGraph {
  blueprintId: string;
  blueprintName: string;
  niche: string;
  nodes: Array<
    FunnelStep & {
      implementation: FunnelNodeImplementation;
      index: number;
    }
  >;
  edges: FunnelConnection[];
}

function titleCase(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNicheLabel(niche: string) {
  const normalized = normalizeNicheSlug(niche);
  return nicheManifests[normalized]?.label ?? titleCase(normalized);
}

function getDefaultProofPoints(step: FunnelStep, nicheLabel: string) {
  const byType: Record<FunnelStep["type"], string[]> = {
    landing: [
      `${nicheLabel} visitors get a dedicated first-step instead of a generic CTA.`,
      "The funnel adapts based on engagement, objection, and capture state.",
      "Every click, capture, and branch is traceable end to end.",
    ],
    assessment: [
      "Assessment answers improve fit, urgency, and intent scoring.",
      "Drop-off paths trigger recovery actions and lower-friction next steps.",
      "Completion routes stronger leads into higher-conviction offers.",
    ],
    calculator: [
      "ROI math turns vague interest into quantified urgency.",
      "Savings estimates feed value-ladder and consult routing.",
      "Calculator completions raise downstream lead quality automatically.",
    ],
    results: [
      "Results personalize the next offer instead of showing one-size-fits-all copy.",
      "Tiering lets the system match urgency to the right ask.",
      "Strong-result visitors can be escalated to higher-ticket paths.",
    ],
    offer: [
      "Offer framing is aligned to objection profile and temperature.",
      "Post-step automations reinforce the same offer across channels.",
      "This node can branch into upsell, downsell, or booking paths.",
    ],
    booking: [
      "Qualified visitors should get a direct path into scheduling.",
      "Booking events should notify sales and update CRM state immediately.",
      "No-shows and abandoners can be redirected into recovery flows.",
    ],
    upsell: [
      "Upsells are sequenced only after proof or value has been established.",
      "The next node can increase ACV without forcing cold visitors upward.",
      "Upsell acceptance should trigger different onboarding automations.",
    ],
    downsell: [
      "Downsells preserve momentum when the premium ask is too early.",
      "Lower-friction offers can keep the lead inside the system.",
      "Rejected upsells can still become strong nurture leads.",
    ],
    confirmation: [
      "Confirmation should close the loop and set the next expectation.",
      "This node is ideal for onboarding, referral, or expansion prompts.",
      "The system can push confirmation events to CRM and reporting instantly.",
    ],
    content: [
      "Content nodes are best for trust-building and objection handling.",
      "Strong content engagement can unlock consult or offer branches.",
      "Content-first flows are ideal when buyers need education before action.",
    ],
  };

  return byType[step.type];
}

function getAutomationTemplate(step: FunnelStep): FunnelAutomationAction[] {
  const base = [
    {
      id: `${step.id}-trace`,
      name: "Persist trace event",
      description: "Record node entry, visitor identity, blueprint, and step context for dashboarding.",
      channel: "dashboard" as const,
      timing: "immediate" as const,
    },
    {
      id: `${step.id}-crm-tag`,
      name: "Update CRM stage",
      description: "Attach blueprint and step tags so the lead state stays in sync with the funnel.",
      channel: "crm" as const,
      timing: "after-step" as const,
    },
  ];

  const byType: Partial<Record<FunnelStep["type"], FunnelAutomationAction[]>> = {
    assessment: [
      {
        id: `${step.id}-score`,
        name: "Recompute qualification score",
        description: "Update fit, intent, and urgency based on assessment behavior and answers.",
        channel: "dashboard",
        timing: "after-step",
      },
      {
        id: `${step.id}-recover`,
        name: "Assessment abandon recovery",
        description: "If the visitor drops mid-quiz, trigger a reminder path with a softer re-entry ask.",
        channel: "email",
        timing: "on-abandon",
      },
    ],
    calculator: [
      {
        id: `${step.id}-roi-summary`,
        name: "Send ROI summary",
        description: "Package savings estimates into follow-up copy for email or WhatsApp.",
        channel: "email",
        timing: "after-step",
      },
    ],
    offer: [
      {
        id: `${step.id}-offer-follow-up`,
        name: "Offer reinforcement follow-up",
        description: "Mirror the core ask by email and WhatsApp after the page interaction.",
        channel: "whatsapp",
        timing: "after-step",
      },
      {
        id: `${step.id}-retarget`,
        name: "Retarget if offer is abandoned",
        description: "Push a matching retargeting audience or recovery event when the offer is not accepted.",
        channel: "retargeting",
        timing: "on-abandon",
      },
    ],
    booking: [
      {
        id: `${step.id}-sales-alert`,
        name: "Alert sales",
        description: "Notify the sales or founder channel that a booking-ready visitor reached this node.",
        channel: "alert",
        timing: "after-step",
      },
    ],
    confirmation: [
      {
        id: `${step.id}-confirmation`,
        name: "Send confirmation sequence",
        description: "Deliver next-step instructions and transition the lead into nurture or onboarding.",
        channel: "email",
        timing: "post-conversion",
      },
    ],
  };

  return [...base, ...(byType[step.type] ?? [])];
}

function getAssetTemplate(step: FunnelStep): FunnelAsset[] {
  const common: FunnelAsset[] = [
    {
      id: `${step.id}-faq`,
      label: "Decision FAQ",
      type: "faq",
      description: "Answers the most likely objection that blocks this node from converting.",
    },
  ];

  const byType: Partial<Record<FunnelStep["type"], FunnelAsset[]>> = {
    landing: [
      {
        id: `${step.id}-story`,
        label: "Story proof block",
        type: "story",
        description: "Narrative proof or transformation story that aligns with the funnel entry promise.",
      },
    ],
    assessment: [
      {
        id: `${step.id}-checklist`,
        label: "Assessment prep checklist",
        type: "checklist",
        description: "Lightweight framework that sets up the quiz without adding friction.",
      },
    ],
    calculator: [
      {
        id: `${step.id}-calculator`,
        label: "ROI worksheet",
        type: "calculator",
        description: "Visual and numerical evidence that justifies the next step economically.",
      },
    ],
    content: [
      {
        id: `${step.id}-proof`,
        label: "Case-study stack",
        type: "proof",
        description: "Proof collection matched to the core objection handled on this page.",
      },
    ],
    offer: [
      {
        id: `${step.id}-offer`,
        label: "Offer stack",
        type: "offer",
        description: "Pricing, guarantee, urgency, and bonus framing tailored to the ask.",
      },
    ],
    booking: [
      {
        id: `${step.id}-workshop`,
        label: "Booking prep",
        type: "workshop",
        description: "Pre-call asset that increases show rate and keeps momentum after scheduling.",
      },
    ],
  };

  return [...(byType[step.type] ?? []), ...common];
}

export function buildNodeImplementation(
  blueprint: FunnelBlueprint,
  step: FunnelStep,
  niche: string,
): FunnelNodeImplementation {
  const nicheLabel = getNicheLabel(niche);
  const implementationHeadline = `${step.headline}`;
  const body = [
    `This is the ${step.type} node inside the ${blueprint.name} for ${nicheLabel}.`,
    `Its job is to move the visitor toward ${blueprint.conversionGoal} while preserving context, intent, and objection fit.`,
    `Lead OS should treat this as a bespoke page surface, not just a generic redirect, and attach dedicated post-step automations.`,
  ];

  return {
    stepId: step.id,
    routeSegment: step.id,
    headline: implementationHeadline,
    subheadline: step.subtext,
    body,
    proofPoints: getDefaultProofPoints(step, nicheLabel),
    assets: getAssetTemplate(step),
    postStepAutomations: getAutomationTemplate(step),
  };
}

export function buildFunnelGraph(blueprintId: string, niche = "general"): FunnelGraph | null {
  const blueprint = FUNNEL_BLUEPRINTS[blueprintId];
  if (!blueprint) return null;

  const normalizedNiche = normalizeNicheSlug(niche);
  const nodes = blueprint.steps.map((step, index) => {
    const interpolated = interpolateStep(step, normalizedNiche);
    return {
      ...interpolated,
      implementation: buildNodeImplementation(blueprint, interpolated, normalizedNiche),
      index,
    };
  });

  const edges: FunnelConnection[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const current = nodes[index];
    const next = nodes[index + 1];

    if (next) {
      edges.push({
        from: current.id,
        to: next.id,
        label: current.type === "upsell" ? "Advance to next offer state" : "Default progression",
        trigger: current.type === "upsell" ? "upsell" : "default",
      });
    }

    if (current.abandonRecovery) {
      edges.push({
        from: current.id,
        to: current.abandonRecovery.fallbackUrl,
        label: `Recovery: ${current.abandonRecovery.offer}`,
        trigger: "abandon",
      });
    }
  }

  return {
    blueprintId: blueprint.id,
    blueprintName: blueprint.name,
    niche: normalizedNiche,
    nodes,
    edges,
  };
}

export function getImplementedBlueprintIds() {
  return Object.keys(FUNNEL_BLUEPRINTS);
}

