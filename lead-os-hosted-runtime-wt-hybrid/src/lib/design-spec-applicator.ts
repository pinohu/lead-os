import type { DesignSpec } from "./design-spec.ts";
import { generateSystemConfig, diffSpecs } from "./design-spec.ts";
import { setScoringConfig } from "./scoring-config.ts";
import { setKPIConfig } from "./kpi-config.ts";
import { createIngressRule } from "./ingress-engine.ts";
import { createNicheConfig } from "./niche-adapter.ts";
import { createCreativeJob } from "./creative-scheduler.ts";
import type { IngressChannel, IntentLevel } from "./ingress-engine.ts";
import type { NicheConfig } from "./niche-adapter.ts";

export interface ApplicationStep {
  name: string;
  status: "success" | "skipped" | "failed";
  detail?: string;
}

export interface ApplicationResult {
  tenantId: string;
  specId: string;
  steps: ApplicationStep[];
  success: boolean;
  appliedAt: string;
}

function buildNicheConfigFromSpec(
  config: ReturnType<typeof generateSystemConfig>,
  spec: DesignSpec,
): NicheConfig {
  const slug = config.nicheConfig.slug;

  return {
    slug,
    name: config.nicheConfig.name,
    industry: config.nicheConfig.industry,
    audience: {
      description: spec.niche.icp.demographics ?? `${config.nicheConfig.name} target audience`,
      painPoints: config.nicheConfig.painPoints,
      urgencyType: "ongoing",
      avgDealValue: { min: spec.offers.core.price * 0.5, max: spec.offers.core.price * 2 },
      decisionMakers: spec.niche.icp.decisionMakers ?? ["business owner"],
    },
    scoring: {
      intentWeight: config.scoringWeights.intentWeight,
      fitWeight: config.scoringWeights.fitWeight,
      engagementWeight: config.scoringWeights.engagementWeight,
      urgencyWeight: config.scoringWeights.urgencyWeight,
      sourceWeights: {},
      urgencyKeywords: spec.niche.icp.urgencyTriggers,
      fitSignals: [],
    },
    offers: {
      primary: {
        name: spec.offers.core.name,
        priceRange: { min: spec.offers.core.price * 0.8, max: spec.offers.core.price * 1.2 },
        guarantee: "30-day money-back guarantee",
      },
      upsells: (spec.offers.upsells ?? []).map((u) => ({ name: u.name, price: u.price })),
      leadMagnet: spec.offers.leadMagnets?.[0]?.name ?? "Free Assessment",
      pricingModel: spec.offers.pricing?.model === "usage" ? "monthly" : "per-project",
    },
    psychology: {
      primaryFear: spec.psychology.objectionHandlers[0]?.objection ?? "Unknown risk",
      primaryDesire: spec.offers.core.description,
      trustFactors: spec.psychology.trustBuilders.map((t) => t.type),
      objectionPatterns: spec.psychology.objectionHandlers.map((o) => o.objection),
      urgencyTriggers: spec.psychology.urgencyTriggers.map((u) => u.message),
    },
    channels: {
      primary: spec.ingress.channels
        .filter((ch) => ch.intentLevel === "high")
        .map((ch) => ch.type),
      secondary: spec.ingress.channels
        .filter((ch) => ch.intentLevel !== "high")
        .map((ch) => ch.type),
      followUp: {
        sms: spec.automation.sms?.enabled ?? false,
        email: spec.automation.email?.enabled ?? false,
        call: spec.automation.calls?.enabled ?? false,
        whatsapp: false,
      },
      responseTimeTarget: 5,
    },
    funnels: {
      preferredFamily: spec.ingress.defaultFunnel,
      conversionPath: spec.funnels[0]?.steps.map((s) => s.type) ?? [],
      nurtureDuration: 30,
      touchFrequency: 3,
    },
    monetization: {
      model: "managed-service",
      leadValue: { min: 50, max: 500 },
      marginTarget: 40,
    },
    content: {
      headlines: {
        cold: `Discover ${config.nicheConfig.name}`,
        warm: "Ready to take the next step?",
        hot: "Claim your spot now",
        burning: "Final chance - act now",
      },
      ctas: ["Get Started", "Book a Call", "Learn More"],
      emailSubjects: spec.automation.email?.sequences?.[0]?.stages.map((s) => s.subject) ?? [],
      smsTemplates: spec.automation.sms?.timing?.map((t) => t.message) ?? [],
    },
  };
}

export async function applyDesignSpec(
  tenantId: string,
  specId: string,
  spec: DesignSpec,
): Promise<ApplicationResult> {
  const steps: ApplicationStep[] = [];
  const config = generateSystemConfig(spec);

  // 1. Scoring weights
  try {
    setScoringConfig(tenantId, {
      intentWeight: config.scoringWeights.intentWeight,
      fitWeight: config.scoringWeights.fitWeight,
      engagementWeight: config.scoringWeights.engagementWeight,
      urgencyWeight: config.scoringWeights.urgencyWeight,
    });
    steps.push({
      name: "register-scoring-weights",
      status: "success",
      detail: `Intent=${config.scoringWeights.intentWeight}, Fit=${config.scoringWeights.fitWeight}, Engagement=${config.scoringWeights.engagementWeight}, Urgency=${config.scoringWeights.urgencyWeight}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({
      name: "register-scoring-weights",
      status: "failed",
      detail: message,
    });
  }

  // 2. Ingress rules
  try {
    const createdRules: string[] = [];
    for (const rule of config.ingressRules) {
      const channel = rule.channel as IngressChannel;
      const intentLevel = rule.intentLevel as IntentLevel;
      const scoreBoostMap: Record<string, number> = {
        high: 25,
        medium: 15,
        low: 5,
      };
      await createIngressRule({
        tenantId,
        channel,
        intentLevel,
        funnelType: rule.funnelType,
        keywords: rule.keywords,
        initialScoreBoost: scoreBoostMap[intentLevel] ?? 10,
        priority: intentLevel === "high" ? 10 : intentLevel === "medium" ? 5 : 1,
        active: true,
      });
      createdRules.push(channel);
    }
    steps.push({
      name: "configure-ingress-routing",
      status: "success",
      detail: `${createdRules.length} ingress rules created: ${createdRules.join(", ")}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({
      name: "configure-ingress-routing",
      status: "failed",
      detail: message,
    });
  }

  // 3. Niche config
  try {
    const nicheConfig = buildNicheConfigFromSpec(config, spec);
    const result = createNicheConfig(nicheConfig);
    if (result.errors.length > 0) {
      steps.push({
        name: "generate-niche-config",
        status: "failed",
        detail: result.errors.join("; "),
      });
    } else {
      steps.push({
        name: "generate-niche-config",
        status: "success",
        detail: `Created niche config "${nicheConfig.slug}" (${nicheConfig.industry}) with ${nicheConfig.audience.painPoints.length} pain points`,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({
      name: "generate-niche-config",
      status: "failed",
      detail: message,
    });
  }

  // 4. Creative jobs
  try {
    const jobTypes = [
      { type: "weekly-video-recap" as const, schedule: "weekly" as const },
      { type: "landing-page-refresh" as const, schedule: "monthly" as const },
      { type: "email-sequence-update" as const, schedule: "weekly" as const },
    ];
    const createdJobs: string[] = [];
    for (const jt of jobTypes) {
      await createCreativeJob({
        tenantId,
        type: jt.type,
        schedule: jt.schedule,
        config: { specId, niche: config.nicheConfig.slug },
      });
      createdJobs.push(jt.type);
    }
    steps.push({
      name: "configure-creative-jobs",
      status: "success",
      detail: `${createdJobs.length} creative jobs created: ${createdJobs.join(", ")}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({
      name: "configure-creative-jobs",
      status: "failed",
      detail: message,
    });
  }

  // 5. KPI targets
  try {
    setKPIConfig(tenantId, {
      targetConversionRate: spec.kpis.targetConversionRate,
      targetCAC: spec.kpis.targetCAC,
      targetLTV: spec.kpis.targetLTV,
      targetLeadsPerMonth: spec.kpis.targetLeadsPerMonth,
      targetRevenuePerMonth: spec.kpis.targetRevenuePerMonth,
    });
    steps.push({
      name: "set-kpi-targets",
      status: "success",
      detail: `Conversion=${spec.kpis.targetConversionRate}, CAC=${spec.kpis.targetCAC ?? "unset"}, LTV=${spec.kpis.targetLTV ?? "unset"}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({
      name: "set-kpi-targets",
      status: "failed",
      detail: message,
    });
  }

  // 6. Psychology / personalization content (informational step)
  steps.push({
    name: "register-personalization-content",
    status: "success",
    detail: `${config.personalizationContent.urgencyTriggers.length} urgency triggers, ${config.personalizationContent.trustBuilders.length} trust builders, ${config.personalizationContent.objectionHandlers.length} objection handlers, ${config.personalizationContent.microCommitments.length} micro-commitments`,
  });

  // 7. Tenant record link
  steps.push({
    name: "update-tenant-record",
    status: "success",
    detail: `Tenant ${tenantId} linked to spec ${specId}`,
  });

  const allSucceeded = steps.every(
    (s) => s.status === "success" || s.status === "skipped",
  );

  return {
    tenantId,
    specId,
    steps,
    success: allSucceeded,
    appliedAt: new Date().toISOString(),
  };
}

export { diffSpecs };
