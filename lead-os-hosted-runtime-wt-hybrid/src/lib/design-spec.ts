import { z } from "zod";
import { INDUSTRY_TEMPLATES, type IndustryCategory } from "./niche-templates.ts";

export const DesignSpecSchema = z.object({
  niche: z.object({
    name: z.string().min(2).max(100),
    industry: z.string().optional(),
    icp: z.object({
      painPoints: z.array(z.string()).min(1),
      urgencyTriggers: z.array(z.string()),
      demographics: z.string().optional(),
      psychographics: z.string().optional(),
      budget: z.string().optional(),
      decisionMakers: z.array(z.string()).optional(),
    }),
  }),

  ingress: z.object({
    channels: z.array(
      z.object({
        type: z.enum([
          "seo",
          "paid-search",
          "paid-social",
          "organic-social",
          "referral",
          "directory",
          "email",
          "partner",
          "direct",
        ]),
        intentLevel: z.enum(["high", "medium", "low"]),
        funnelType: z.string(),
        budget: z.number().optional(),
        keywords: z.array(z.string()).optional(),
      }),
    ),
    defaultFunnel: z.string(),
  }),

  funnels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum([
        "direct-conversion",
        "nurture",
        "authority",
        "quiz",
        "calculator",
        "webinar",
        "lead-magnet",
        "comparison",
        "application",
      ]),
      steps: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          content: z.string().optional(),
          action: z.string().optional(),
        }),
      ),
      targetSegment: z.string().optional(),
      conversionGoal: z.string(),
    }),
  ),

  psychology: z.object({
    urgencyTriggers: z.array(
      z.object({
        type: z.enum([
          "countdown",
          "limited-slots",
          "price-increase",
          "seasonal",
          "social-proof-velocity",
        ]),
        message: z.string(),
        threshold: z.number().optional(),
      }),
    ),
    trustBuilders: z.array(
      z.object({
        type: z.enum([
          "testimonial",
          "guarantee",
          "certification",
          "case-study",
          "social-proof",
          "authority-badge",
        ]),
        content: z.string(),
      }),
    ),
    objectionHandlers: z.array(
      z.object({
        objection: z.string(),
        response: z.string(),
        trigger: z.string().optional(),
      }),
    ),
    microCommitments: z.array(
      z.object({
        type: z.enum([
          "quiz-step",
          "calculator-input",
          "checklist-item",
          "mini-survey",
          "preference-select",
        ]),
        label: z.string(),
      }),
    ),
  }),

  offers: z.object({
    core: z.object({
      name: z.string(),
      price: z.number(),
      description: z.string(),
      deliverables: z.array(z.string()),
    }),
    upsells: z
      .array(
        z.object({
          name: z.string(),
          price: z.number(),
          trigger: z.string(),
        }),
      )
      .optional(),
    leadMagnets: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          deliveryMethod: z.string(),
        }),
      )
      .optional(),
    pricing: z
      .object({
        model: z.enum(["fixed", "tiered", "usage", "custom"]),
        anchor: z.number().optional(),
        discount: z.number().optional(),
      })
      .optional(),
  }),

  automation: z.object({
    sms: z
      .object({
        enabled: z.boolean(),
        timing: z.array(
          z.object({ delay: z.string(), message: z.string() }),
        ),
      })
      .optional(),
    email: z
      .object({
        enabled: z.boolean(),
        sequences: z.array(
          z.object({
            name: z.string(),
            stages: z.array(
              z.object({
                day: z.number(),
                subject: z.string(),
                goal: z.string(),
              }),
            ),
          }),
        ),
      })
      .optional(),
    calls: z
      .object({
        enabled: z.boolean(),
        triggerScore: z.number(),
        provider: z.string().optional(),
      })
      .optional(),
    webhooks: z
      .array(
        z.object({
          event: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
  }),

  kpis: z.object({
    targetConversionRate: z.number().min(0).max(1),
    targetCAC: z.number().optional(),
    targetLTV: z.number().optional(),
    targetLeadsPerMonth: z.number().optional(),
    targetRevenuePerMonth: z.number().optional(),
  }),

  scoring: z
    .object({
      intentWeight: z.number().min(0).max(1).default(0.3),
      fitWeight: z.number().min(0).max(1).default(0.25),
      engagementWeight: z.number().min(0).max(1).default(0.25),
      urgencyWeight: z.number().min(0).max(1).default(0.2),
      hotThreshold: z.number().default(75),
      qualifiedThreshold: z.number().default(50),
    })
    .optional(),
});

export type DesignSpec = z.infer<typeof DesignSpecSchema>;

function extractJsonFromMarkdown(markdown: string): string | null {
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/;
  const match = markdown.match(jsonBlockPattern);
  if (match) return match[1].trim();

  const yamlFrontmatterPattern = /^---\s*\n([\s\S]*?)\n---/;
  const yamlMatch = markdown.match(yamlFrontmatterPattern);
  if (yamlMatch) return yamlMatch[1].trim();

  return null;
}

function isRawJson(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

export function parseDesignSpec(markdownOrJson: string): DesignSpec {
  let jsonStr: string;

  if (isRawJson(markdownOrJson)) {
    jsonStr = markdownOrJson;
  } else {
    const extracted = extractJsonFromMarkdown(markdownOrJson);
    if (!extracted) {
      throw new Error(
        "Failed to extract spec from DESIGN.md: no JSON code block or YAML frontmatter found",
      );
    }
    jsonStr = extracted;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse design spec JSON: invalid JSON syntax");
  }

  const result = DesignSpecSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Design spec validation failed: ${errors}`);
  }

  return result.data;
}

export function validateDesignSpec(input: unknown): {
  valid: boolean;
  errors: string[];
} {
  const result = DesignSpecSchema.safeParse(input);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    ),
  };
}

export interface SystemConfig {
  nicheConfig: {
    name: string;
    industry: string;
    slug: string;
    painPoints: string[];
    keywords: string[];
  };
  scoringWeights: {
    intentWeight: number;
    fitWeight: number;
    engagementWeight: number;
    urgencyWeight: number;
    hotThreshold: number;
    qualifiedThreshold: number;
  };
  personalizationContent: {
    urgencyTriggers: DesignSpec["psychology"]["urgencyTriggers"];
    trustBuilders: DesignSpec["psychology"]["trustBuilders"];
    objectionHandlers: DesignSpec["psychology"]["objectionHandlers"];
    microCommitments: DesignSpec["psychology"]["microCommitments"];
  };
  funnelGraphs: Array<{
    id: string;
    name: string;
    type: string;
    steps: DesignSpec["funnels"][number]["steps"];
    conversionGoal: string;
    targetSegment?: string;
  }>;
  automationRecipes: {
    sms: DesignSpec["automation"]["sms"];
    email: DesignSpec["automation"]["email"];
    calls: DesignSpec["automation"]["calls"];
    webhooks: DesignSpec["automation"]["webhooks"];
  };
  ingressRules: Array<{
    channel: string;
    intentLevel: string;
    funnelType: string;
    budget?: number;
    keywords?: string[];
  }>;
  psychologyConfig: {
    urgencyTriggers: DesignSpec["psychology"]["urgencyTriggers"];
    trustBuilders: DesignSpec["psychology"]["trustBuilders"];
    objectionHandlers: DesignSpec["psychology"]["objectionHandlers"];
    microCommitments: DesignSpec["psychology"]["microCommitments"];
  };
  kpiTargets: DesignSpec["kpis"];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSystemConfig(spec: DesignSpec): SystemConfig {
  const slug = slugify(spec.niche.name);
  const industry = spec.niche.industry ?? "general";

  const allKeywords = spec.ingress.channels.flatMap((ch) => ch.keywords ?? []);
  const uniqueKeywords = Array.from(
    new Set([...allKeywords, slug, industry, spec.niche.name.toLowerCase()]),
  );

  const scoringDefaults = {
    intentWeight: 0.3,
    fitWeight: 0.25,
    engagementWeight: 0.25,
    urgencyWeight: 0.2,
    hotThreshold: 75,
    qualifiedThreshold: 50,
  };

  const scoringWeights = spec.scoring
    ? {
        intentWeight: spec.scoring.intentWeight,
        fitWeight: spec.scoring.fitWeight,
        engagementWeight: spec.scoring.engagementWeight,
        urgencyWeight: spec.scoring.urgencyWeight,
        hotThreshold: spec.scoring.hotThreshold,
        qualifiedThreshold: spec.scoring.qualifiedThreshold,
      }
    : scoringDefaults;

  const funnelGraphs = spec.funnels.map((funnel) => ({
    id: funnel.id,
    name: funnel.name,
    type: funnel.type,
    steps: funnel.steps,
    conversionGoal: funnel.conversionGoal,
    targetSegment: funnel.targetSegment,
  }));

  const ingressRules = spec.ingress.channels.map((ch) => ({
    channel: ch.type,
    intentLevel: ch.intentLevel,
    funnelType: ch.funnelType,
    budget: ch.budget,
    keywords: ch.keywords,
  }));

  return {
    nicheConfig: {
      name: spec.niche.name,
      industry,
      slug,
      painPoints: spec.niche.icp.painPoints,
      keywords: uniqueKeywords,
    },
    scoringWeights,
    personalizationContent: {
      urgencyTriggers: spec.psychology.urgencyTriggers,
      trustBuilders: spec.psychology.trustBuilders,
      objectionHandlers: spec.psychology.objectionHandlers,
      microCommitments: spec.psychology.microCommitments,
    },
    funnelGraphs,
    automationRecipes: {
      sms: spec.automation.sms,
      email: spec.automation.email,
      calls: spec.automation.calls,
      webhooks: spec.automation.webhooks,
    },
    ingressRules,
    psychologyConfig: {
      urgencyTriggers: spec.psychology.urgencyTriggers,
      trustBuilders: spec.psychology.trustBuilders,
      objectionHandlers: spec.psychology.objectionHandlers,
      microCommitments: spec.psychology.microCommitments,
    },
    kpiTargets: spec.kpis,
  };
}

export function generateDesignSpecTemplate(
  nicheName: string,
  industry?: string,
): string {
  const resolvedIndustry = (industry ?? "general") as IndustryCategory;
  const template =
    INDUSTRY_TEMPLATES[resolvedIndustry] ?? INDUSTRY_TEMPLATES.general;
  const slug = slugify(nicheName);

  const painPoints = template.painPoints
    .slice(0, 3)
    .map((p) => p.replace(/\{\{niche\}\}/g, nicheName));

  const urgencySignals = template.urgencySignals.slice(0, 3);

  const spec: DesignSpec = {
    niche: {
      name: nicheName,
      industry: resolvedIndustry,
      icp: {
        painPoints,
        urgencyTriggers: urgencySignals,
        demographics: `${nicheName} business owners and decision makers`,
        psychographics: `Results-oriented professionals seeking growth and efficiency`,
      },
    },
    ingress: {
      channels: [
        {
          type: "seo",
          intentLevel: "high",
          funnelType: "direct-conversion",
          keywords: [slug, nicheName.toLowerCase()],
        },
        {
          type: "paid-search",
          intentLevel: "high",
          funnelType: "direct-conversion",
          budget: 1000,
          keywords: [`${nicheName.toLowerCase()} services`, `best ${nicheName.toLowerCase()}`],
        },
        {
          type: "organic-social",
          intentLevel: "low",
          funnelType: "lead-magnet",
        },
      ],
      defaultFunnel: "main-qualification",
    },
    funnels: [
      {
        id: "main-qualification",
        name: `${nicheName} Qualification Funnel`,
        type: "direct-conversion",
        steps: [
          {
            id: "landing",
            type: "landing_page",
            content: `Landing page for ${nicheName}`,
          },
          {
            id: "assessment",
            type: "assessment_node",
            content: `${nicheName} readiness assessment`,
          },
          {
            id: "offer",
            type: "offer_page",
            content: "Core offer presentation",
            action: "present-offer",
          },
          {
            id: "booking",
            type: "booking_node",
            action: "book-consultation",
          },
        ],
        conversionGoal: "consultation-booked",
      },
      {
        id: "nurture-sequence",
        name: `${nicheName} Nurture Funnel`,
        type: "nurture",
        steps: [
          {
            id: "magnet-delivery",
            type: "lead_magnet_delivery",
            content: "Lead magnet delivery",
          },
          {
            id: "email-nurture",
            type: "email_followup",
            content: "7-day nurture sequence",
          },
          {
            id: "consult-offer",
            type: "offer_page",
            content: "Consultation offer",
            action: "present-offer",
          },
        ],
        targetSegment: "warm-leads",
        conversionGoal: "consultation-booked",
      },
    ],
    psychology: {
      urgencyTriggers: [
        {
          type: "limited-slots",
          message: `Only a few ${nicheName} consultation slots remaining this week`,
          threshold: 5,
        },
        {
          type: "social-proof-velocity",
          message: `12 ${nicheName} businesses signed up in the last 48 hours`,
        },
      ],
      trustBuilders: [
        {
          type: "guarantee",
          content: "30-day money-back guarantee, no questions asked",
        },
        {
          type: "social-proof",
          content: `Trusted by over 100 ${nicheName} businesses`,
        },
        {
          type: "testimonial",
          content: `"This transformed how we run our ${nicheName} business" - Happy Client`,
        },
      ],
      objectionHandlers: [
        {
          objection: "Too expensive",
          response:
            "Our clients typically see ROI within the first 30 days. We also offer flexible payment plans.",
          trigger: "pricing-page-exit",
        },
        {
          objection: "Not enough time",
          response:
            "Setup takes less than 30 minutes and our team handles the heavy lifting.",
          trigger: "long-session-no-conversion",
        },
        {
          objection: "Not sure it will work for us",
          response:
            "Take our free assessment to see exactly how this applies to your situation.",
          trigger: "repeated-faq-views",
        },
      ],
      microCommitments: [
        { type: "quiz-step", label: "Answer your first assessment question" },
        {
          type: "calculator-input",
          label: "Calculate your potential savings",
        },
        { type: "checklist-item", label: "Review your personalized roadmap" },
      ],
    },
    offers: {
      core: {
        name: `${nicheName} Growth Package`,
        price: 997,
        description: `Complete lead capture and automation system for ${nicheName} businesses`,
        deliverables: [
          "Custom lead capture system",
          "Automated follow-up sequences",
          "Lead scoring and qualification",
          "Monthly performance reporting",
        ],
      },
      upsells: [
        {
          name: "Priority Support",
          price: 297,
          trigger: "post-purchase",
        },
      ],
      leadMagnets: [
        {
          name: `${nicheName} Growth Checklist`,
          type: "checklist",
          deliveryMethod: "email",
        },
      ],
      pricing: {
        model: "fixed",
        anchor: 2497,
        discount: 0.6,
      },
    },
    automation: {
      sms: {
        enabled: true,
        timing: [
          {
            delay: "5m",
            message: `Thanks for your interest in ${nicheName} growth solutions! Check your email for your personalized report.`,
          },
          {
            delay: "24h",
            message: `Quick reminder: your ${nicheName} assessment results are ready. Reply YES to schedule a free strategy call.`,
          },
        ],
      },
      email: {
        enabled: true,
        sequences: [
          {
            name: "Main Nurture",
            stages: [
              { day: 0, subject: "Your personalized growth roadmap is ready", goal: "deliver-value" },
              { day: 2, subject: "Quick win for your business this week", goal: "build-trust" },
              { day: 5, subject: "How a similar business grew 3x in 90 days", goal: "social-proof" },
              { day: 10, subject: "Three strategies that consistently deliver", goal: "authority" },
              { day: 14, subject: "Let us map out your growth plan together", goal: "book-consultation" },
            ],
          },
        ],
      },
      calls: {
        enabled: true,
        triggerScore: 75,
      },
    },
    kpis: {
      targetConversionRate: 0.05,
      targetCAC: 150,
      targetLTV: 4000,
      targetLeadsPerMonth: 200,
      targetRevenuePerMonth: 10000,
    },
    scoring: {
      intentWeight: template.scoringBias.intentWeight,
      fitWeight: template.scoringBias.fitWeight,
      engagementWeight: template.scoringBias.engagementWeight,
      urgencyWeight: template.scoringBias.urgencyWeight,
      hotThreshold: 75,
      qualifiedThreshold: 50,
    },
  };

  const json = JSON.stringify(spec, null, 2);

  return `# DESIGN.md - ${nicheName}

> Auto-generated design spec for the **${nicheName}** niche (${resolvedIndustry} industry).
> This file is the single source of truth for all downstream system configuration.

## Spec

\`\`\`json
${json}
\`\`\`

## Usage

Parse this file with \`parseDesignSpec()\` and apply with \`applyDesignSpec()\` to configure
all systems (scoring, funnels, automation, personalization, ingress routing) from a single source.
`;
}

export function diffSpecs(
  oldSpec: DesignSpec,
  newSpec: DesignSpec,
): string[] {
  const changes: string[] = [];

  if (oldSpec.niche.name !== newSpec.niche.name) {
    changes.push(
      `Niche name changed from "${oldSpec.niche.name}" to "${newSpec.niche.name}"`,
    );
  }

  if (oldSpec.niche.industry !== newSpec.niche.industry) {
    changes.push(
      `Industry changed from "${oldSpec.niche.industry ?? "unset"}" to "${newSpec.niche.industry ?? "unset"}"`,
    );
  }

  const oldPainPoints = oldSpec.niche.icp.painPoints.join("|");
  const newPainPoints = newSpec.niche.icp.painPoints.join("|");
  if (oldPainPoints !== newPainPoints) {
    changes.push(
      `ICP pain points updated (${oldSpec.niche.icp.painPoints.length} -> ${newSpec.niche.icp.painPoints.length})`,
    );
  }

  if (oldSpec.ingress.channels.length !== newSpec.ingress.channels.length) {
    changes.push(
      `Ingress channels changed from ${oldSpec.ingress.channels.length} to ${newSpec.ingress.channels.length}`,
    );
  }

  if (oldSpec.ingress.defaultFunnel !== newSpec.ingress.defaultFunnel) {
    changes.push(
      `Default funnel changed from "${oldSpec.ingress.defaultFunnel}" to "${newSpec.ingress.defaultFunnel}"`,
    );
  }

  if (oldSpec.funnels.length !== newSpec.funnels.length) {
    changes.push(
      `Funnel count changed from ${oldSpec.funnels.length} to ${newSpec.funnels.length}`,
    );
  } else {
    for (let i = 0; i < oldSpec.funnels.length; i++) {
      if (oldSpec.funnels[i].id !== newSpec.funnels[i].id) {
        changes.push(`Funnel at index ${i} changed id`);
      }
      if (
        oldSpec.funnels[i].steps.length !== newSpec.funnels[i].steps.length
      ) {
        changes.push(
          `Funnel "${oldSpec.funnels[i].id}" steps changed from ${oldSpec.funnels[i].steps.length} to ${newSpec.funnels[i].steps.length}`,
        );
      }
    }
  }

  if (
    oldSpec.psychology.urgencyTriggers.length !==
    newSpec.psychology.urgencyTriggers.length
  ) {
    changes.push(`Urgency trigger count changed`);
  }

  if (
    oldSpec.psychology.trustBuilders.length !==
    newSpec.psychology.trustBuilders.length
  ) {
    changes.push(`Trust builder count changed`);
  }

  if (
    oldSpec.psychology.objectionHandlers.length !==
    newSpec.psychology.objectionHandlers.length
  ) {
    changes.push(`Objection handler count changed`);
  }

  if (oldSpec.offers.core.name !== newSpec.offers.core.name) {
    changes.push(
      `Core offer name changed from "${oldSpec.offers.core.name}" to "${newSpec.offers.core.name}"`,
    );
  }

  if (oldSpec.offers.core.price !== newSpec.offers.core.price) {
    changes.push(
      `Core offer price changed from ${oldSpec.offers.core.price} to ${newSpec.offers.core.price}`,
    );
  }

  const oldEmail = oldSpec.automation.email?.enabled;
  const newEmail = newSpec.automation.email?.enabled;
  if (oldEmail !== newEmail) {
    changes.push(`Email automation ${newEmail ? "enabled" : "disabled"}`);
  }

  const oldSms = oldSpec.automation.sms?.enabled;
  const newSms = newSpec.automation.sms?.enabled;
  if (oldSms !== newSms) {
    changes.push(`SMS automation ${newSms ? "enabled" : "disabled"}`);
  }

  const oldCalls = oldSpec.automation.calls?.enabled;
  const newCalls = newSpec.automation.calls?.enabled;
  if (oldCalls !== newCalls) {
    changes.push(`Call automation ${newCalls ? "enabled" : "disabled"}`);
  }

  if (
    oldSpec.kpis.targetConversionRate !== newSpec.kpis.targetConversionRate
  ) {
    changes.push(
      `Target conversion rate changed from ${oldSpec.kpis.targetConversionRate} to ${newSpec.kpis.targetConversionRate}`,
    );
  }

  if (oldSpec.kpis.targetCAC !== newSpec.kpis.targetCAC) {
    changes.push(`Target CAC changed`);
  }

  if (oldSpec.kpis.targetLTV !== newSpec.kpis.targetLTV) {
    changes.push(`Target LTV changed`);
  }

  const oldScoring = oldSpec.scoring;
  const newScoring = newSpec.scoring;
  if (JSON.stringify(oldScoring) !== JSON.stringify(newScoring)) {
    changes.push(`Scoring weights updated`);
  }

  return changes;
}
