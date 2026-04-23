import type { DesignSpec } from "./design-spec.ts";
import { generateDesignSpecTemplate, parseDesignSpec } from "./design-spec.ts";
import type { DesignIngestionResult } from "./design-ingestion.ts";
import type { GeneratedNicheConfig } from "./niche-generator.ts";
import { generateNicheConfig } from "./niche-generator.ts";

// ---------------------------------------------------------------------------
// Funnel type mapping
// ---------------------------------------------------------------------------

const FUNNEL_FAMILY_TO_TYPE: Record<string, DesignSpec["funnels"][number]["type"]> = {
  quiz: "quiz",
  calculator: "calculator",
  webinar: "webinar",
  "lead-magnet": "lead-magnet",
  comparison: "comparison",
  application: "application",
  "direct-conversion": "direct-conversion",
  nurture: "nurture",
  authority: "authority",
};

function resolveFunnelType(family: string): DesignSpec["funnels"][number]["type"] {
  return FUNNEL_FAMILY_TO_TYPE[family] ?? "direct-conversion";
}

// ---------------------------------------------------------------------------
// Trust builder mapping
// ---------------------------------------------------------------------------

const TRUST_BUILDER_TYPE: DesignSpec["psychology"]["trustBuilders"][number]["type"] = "social-proof";

function buildTrustBuilders(
  socialProofClaims: string[],
): DesignSpec["psychology"]["trustBuilders"] {
  return socialProofClaims.slice(0, 5).map((content) => ({
    type: TRUST_BUILDER_TYPE,
    content,
  }));
}

// ---------------------------------------------------------------------------
// Assessment questions from FAQ
// ---------------------------------------------------------------------------

function buildMicroCommitmentsFromFaq(
  faqQuestions: string[],
): DesignSpec["psychology"]["microCommitments"] {
  return faqQuestions.slice(0, 5).map((label) => ({
    type: "quiz-step" as const,
    label,
  }));
}

// ---------------------------------------------------------------------------
// Funnel steps from layout sections
// ---------------------------------------------------------------------------

function buildFunnelStepsFromSections(
  sections: DesignIngestionResult["layout"]["sections"],
): DesignSpec["funnels"][number]["steps"] {
  const typeToStep: Record<string, string> = {
    hero: "landing_page",
    form: "assessment_node",
    pricing: "offer_page",
    cta: "booking_node",
    features: "landing_page",
    testimonials: "landing_page",
  };

  return sections
    .filter((s) => s.type in typeToStep)
    .slice(0, 5)
    .map((s, i) => ({
      id: `step-${i + 1}`,
      type: typeToStep[s.type] ?? "landing_page",
      content: s.headingText,
    }));
}

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

export function convertIngestionToDesignSpec(
  ingestion: DesignIngestionResult,
  nicheConfig?: GeneratedNicheConfig,
): Partial<DesignSpec> {
  const { copy, funnel, layout } = ingestion;

  const funnelType = resolveFunnelType(funnel.detectedFamily);
  const funnelSteps = buildFunnelStepsFromSections(layout.sections);
  const trustBuilders = buildTrustBuilders(copy.socialProofClaims);
  const microCommitments = buildMicroCommitmentsFromFaq(copy.faqQuestions);

  const coreName = nicheConfig?.name ?? copy.headlines[0] ?? "Extracted Offer";
  const coreDescription = copy.valuePropositions[0] ?? nicheConfig?.definition.shortDescription ?? "";

  const painPoints: string[] = copy.valuePropositions.slice(0, 3).length > 0
    ? copy.valuePropositions.slice(0, 3)
    : (nicheConfig?.painPoints.slice(0, 3) ?? ["Pain point not detected"]);

  const urgencyTriggers: DesignSpec["psychology"]["urgencyTriggers"] = copy.socialProofClaims
    .slice(0, 2)
    .map((message) => ({ type: "social-proof-velocity" as const, message }));

  const partialFunnel: DesignSpec["funnels"][number] = {
    id: "ingested-primary",
    name: `${coreName} Funnel`,
    type: funnelType,
    steps: funnelSteps.length > 0
      ? funnelSteps
      : [{ id: "step-1", type: "landing_page", content: "Landing page" }],
    conversionGoal: funnel.hasBooking ? "consultation-booked" : "lead-captured",
  };

  const assessmentFields = funnel.formFields.slice(0, 5);

  const partial: Partial<DesignSpec> = {
    niche: {
      name: coreName,
      industry: nicheConfig?.industry,
      icp: {
        painPoints,
        urgencyTriggers: nicheConfig?.urgencySignals ?? [],
        demographics: nicheConfig?.definition.shortDescription,
      },
    },
    funnels: [partialFunnel],
    psychology: {
      urgencyTriggers,
      trustBuilders: trustBuilders.length > 0
        ? trustBuilders
        : (nicheConfig ? [] : []),
      objectionHandlers: [],
      microCommitments,
    },
    offers: {
      core: {
        name: coreName,
        price: 0,
        description: coreDescription,
        deliverables: copy.valuePropositions.slice(0, 4),
      },
      leadMagnets: assessmentFields.length > 0
        ? [{ name: `${coreName} Assessment`, type: "quiz", deliveryMethod: "inline" }]
        : undefined,
    },
  };

  return partial;
}

// ---------------------------------------------------------------------------
// Merge with niche defaults
// ---------------------------------------------------------------------------

export function mergeWithNicheDefaults(
  partial: Partial<DesignSpec>,
  nicheSlug: string,
): DesignSpec {
  const nicheName = partial.niche?.name ?? nicheSlug;
  const industry = partial.niche?.industry;

  const nicheConfig = generateNicheConfig({ name: nicheName, industry });
  const templateMarkdown = generateDesignSpecTemplate(nicheName, industry);
  const base = parseDesignSpec(templateMarkdown);

  const merged: DesignSpec = {
    ...base,
    niche: {
      ...base.niche,
      name: partial.niche?.name ?? base.niche.name,
      industry: partial.niche?.industry ?? base.niche.industry,
      icp: {
        ...base.niche.icp,
        painPoints:
          partial.niche?.icp?.painPoints?.length
            ? partial.niche.icp.painPoints
            : base.niche.icp.painPoints,
        urgencyTriggers:
          partial.niche?.icp?.urgencyTriggers?.length
            ? partial.niche.icp.urgencyTriggers
            : base.niche.icp.urgencyTriggers,
        demographics: partial.niche?.icp?.demographics ?? base.niche.icp.demographics,
      },
    },
    funnels:
      partial.funnels?.length
        ? partial.funnels
        : base.funnels,
    psychology: {
      urgencyTriggers:
        partial.psychology?.urgencyTriggers?.length
          ? partial.psychology.urgencyTriggers
          : base.psychology.urgencyTriggers,
      trustBuilders:
        partial.psychology?.trustBuilders?.length
          ? partial.psychology.trustBuilders
          : base.psychology.trustBuilders,
      objectionHandlers:
        partial.psychology?.objectionHandlers?.length
          ? partial.psychology.objectionHandlers
          : base.psychology.objectionHandlers,
      microCommitments:
        partial.psychology?.microCommitments?.length
          ? partial.psychology.microCommitments
          : base.psychology.microCommitments,
    },
    offers: {
      ...base.offers,
      core: {
        ...base.offers.core,
        name:
          partial.offers?.core?.name && partial.offers.core.name !== "Extracted Offer"
            ? partial.offers.core.name
            : base.offers.core.name,
        description:
          partial.offers?.core?.description?.length
            ? partial.offers.core.description
            : base.offers.core.description,
        deliverables:
          partial.offers?.core?.deliverables?.length
            ? partial.offers.core.deliverables
            : base.offers.core.deliverables,
        price: base.offers.core.price,
      },
      leadMagnets: partial.offers?.leadMagnets ?? base.offers.leadMagnets,
    },
  };

  // Silence unused variable — nicheConfig is available for future extension
  void nicheConfig;

  return merged;
}
