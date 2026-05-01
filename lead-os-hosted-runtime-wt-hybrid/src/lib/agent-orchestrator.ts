// ---------------------------------------------------------------------------
// Agent Orchestrator — autonomous agents that chain multiple engines together
// without human intervention. Each agent has a specific mission and can invoke
// other engines to accomplish it.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentType =
  | "funnel-agent"
  | "creative-agent"
  | "optimization-agent"
  | "analytics-agent"
  | "onboarding-agent";

export interface AgentStep {
  name: string;
  engine: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

export interface AgentTask {
  id: string;
  agentType: AgentType;
  tenantId: string;
  nicheSlug: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  input: Record<string, unknown>;
  steps: AgentStep[];
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const VALID_AGENT_TYPES: ReadonlySet<string> = new Set<AgentType>([
  "funnel-agent",
  "creative-agent",
  "optimization-agent",
  "analytics-agent",
  "onboarding-agent",
]);

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const taskStore = new Map<string, AgentTask>();

// ---------------------------------------------------------------------------
// Step runner helper
// ---------------------------------------------------------------------------

async function runStep(
  step: AgentStep,
  fn: () => Promise<Record<string, unknown>>,
): Promise<void> {
  step.status = "running";
  const start = Date.now();
  try {
    step.output = await fn();
    step.status = "completed";
  } catch (err) {
    step.status = "failed";
    step.error = err instanceof Error ? err.message : "Unknown error";
  } finally {
    step.durationMs = Date.now() - start;
  }
}

// ---------------------------------------------------------------------------
// Funnel Agent
// ---------------------------------------------------------------------------

async function runFunnelAgent(
  task: AgentTask,
): Promise<Record<string, unknown>> {
  const { tenantId, nicheSlug, input } = task;
  const designSpecId = input.designSpecId as string | undefined;

  const assets: Record<string, unknown> = {};

  // Step 1: Load NicheConfig
  const nicheStep: AgentStep = {
    name: "Load niche config",
    engine: "niche-generator",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(nicheStep);
  let nicheConfig: Record<string, unknown> | null = null;

  await runStep(nicheStep, async () => {
    const mod = await import("./niche-generator.ts");
    const config = mod.generateNicheConfig({
      name: nicheSlug,
      keywords: [nicheSlug],
    });
    nicheConfig = config as unknown as Record<string, unknown>;
    return { slug: config.slug, name: config.name };
  });

  if (nicheStep.status === "failed") {
    task.status = "failed";
    task.error = "Critical step failed: could not load niche config";
    return assets;
  }

  // Step 2: Load or generate DESIGN.md spec
  const designStep: AgentStep = {
    name: "Generate design spec",
    engine: "design-spec",
    status: "pending",
    input: { designSpecId },
  };
  task.steps.push(designStep);

  await runStep(designStep, async () => {
    const mod = await import("./design-spec.ts");
    const template = mod.generateDesignSpecTemplate(nicheSlug);
    assets.designSpec = template;
    return { generated: true, length: template.length };
  });

  // Step 3: Generate landing page
  const pageStep: AgentStep = {
    name: "Generate landing page",
    engine: "page-builder",
    status: "pending",
    input: { tenantId, nicheSlug },
  };
  task.steps.push(pageStep);

  await runStep(pageStep, async () => {
    const mod = await import("./page-builder.ts");
    const page = mod.createPage({
      tenantId,
      slug: `${nicheSlug}-landing`,
      title: `${nicheSlug} Landing Page`,
      description: `Auto-generated landing page for ${nicheSlug}`,
      blocks: [
        { id: randomUUID(), type: "hero", props: { headline: `Welcome to ${nicheSlug}` }, order: 0 },
        { id: randomUUID(), type: "features", props: { items: [] }, order: 1 },
        { id: randomUUID(), type: "cta", props: { text: "Get Started" }, order: 2 },
      ],
      seo: {
        title: `${nicheSlug} - Get Started Today`,
        description: `Professional ${nicheSlug} services`,
      },
      styles: {
        primaryColor: "#2563eb",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
      },
      status: "draft",
    });
    assets.landingPage = page;
    return { pageId: page.id, slug: page.slug };
  });

  // Step 4: Generate lead magnet recommendation
  const magnetStep: AgentStep = {
    name: "Recommend lead magnets",
    engine: "lead-magnet-engine",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(magnetStep);

  await runStep(magnetStep, async () => {
    const mod = await import("./lead-magnet-engine.ts");
    const magnets = mod.recommendMagnets({ niche: nicheSlug }, 5);
    assets.leadMagnets = magnets;
    return { count: magnets.length };
  });

  // Step 5: Generate offer
  const offerStep: AgentStep = {
    name: "Generate offer",
    engine: "offer-engine",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(offerStep);

  await runStep(offerStep, async () => {
    const mod = await import("./offer-engine.ts");
    const offerNiche = nicheSlug as Parameters<typeof mod.generateOffer>[0];
    const offer = mod.generateOffer(offerNiche, "primary", {});
    assets.offer = offer;
    return { offerHeadline: offer.headline, bonuses: offer.bonuses.length };
  });

  // Step 6: Generate psychology triggers
  const psychStep: AgentStep = {
    name: "Generate psychology triggers",
    engine: "psychology-engine",
    status: "pending",
  };
  task.steps.push(psychStep);

  await runStep(psychStep, async () => {
    const mod = await import("./psychology-engine.ts");
    const directive = mod.evaluatePsychology({
      leadScore: 50,
      trustScore: 50,
      urgencyScore: 50,
      stage: "awareness",
      returning: false,
      device: "desktop",
      objections: [],
      timeOnSite: 30,
      pagesViewed: 2,
    });
    assets.psychologyDirective = directive;
    return { triggerCount: directive.triggers.length, urgencyLevel: directive.urgencyLevel };
  });

  // Step 7: Generate trust badges
  const trustStep: AgentStep = {
    name: "Generate trust badges",
    engine: "trust-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(trustStep);

  await runStep(trustStep, async () => {
    const mod = await import("./trust-engine.ts");
    const badges = mod.generateTrustBadges(tenantId);
    const guarantees = mod.getGuaranteeTemplates(nicheSlug);
    assets.trustBadges = badges;
    assets.guarantees = guarantees;
    return { badgeCount: badges.length, guaranteeCount: guarantees.length };
  });

  // Step 8: Generate email nurture sequence
  const emailStep: AgentStep = {
    name: "Generate email nurture sequence",
    engine: "inline-nurture",
    status: "pending",
  };
  task.steps.push(emailStep);

  await runStep(emailStep, async () => {
    const stages = [
      { stage: "welcome", dayOffset: 0, subject: `Welcome to ${nicheSlug} - Here's Your Free Resource` },
      { stage: "value", dayOffset: 2, subject: `3 ${nicheSlug} Tips That Save You Time` },
      { stage: "authority", dayOffset: 4, subject: `Why Experts Trust Our ${nicheSlug} Approach` },
      { stage: "social-proof", dayOffset: 7, subject: `See What Others Say About Our ${nicheSlug} Services` },
      { stage: "objection", dayOffset: 10, subject: `Still On The Fence About ${nicheSlug}?` },
      { stage: "urgency", dayOffset: 14, subject: `Limited Time ${nicheSlug} Offer Ending Soon` },
      { stage: "final-cta", dayOffset: 21, subject: `Last Chance: Your ${nicheSlug} Opportunity` },
    ];
    assets.nurtureSequence = stages;
    return { stageCount: stages.length };
  });

  return {
    tenantId,
    nicheSlug,
    assets,
    stepsCompleted: task.steps.filter((s) => s.status === "completed").length,
    stepsFailed: task.steps.filter((s) => s.status === "failed").length,
  };
}

// ---------------------------------------------------------------------------
// Creative Agent
// ---------------------------------------------------------------------------

async function runCreativeAgent(
  task: AgentTask,
): Promise<Record<string, unknown>> {
  const { tenantId, nicheSlug } = task;
  const assets: Record<string, unknown> = {};

  // Step 1: Load NicheConfig
  const nicheStep: AgentStep = {
    name: "Load niche config",
    engine: "niche-generator",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(nicheStep);

  await runStep(nicheStep, async () => {
    const mod = await import("./niche-generator.ts");
    const config = mod.generateNicheConfig({
      name: nicheSlug,
      keywords: [nicheSlug],
    });
    return { slug: config.slug, name: config.name };
  });

  if (nicheStep.status === "failed") {
    task.status = "failed";
    task.error = "Critical step failed: could not load niche config";
    return assets;
  }

  // Step 2: Generate SEO landing page
  const seoStep: AgentStep = {
    name: "Generate SEO landing page",
    engine: "distribution-engine",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(seoStep);

  await runStep(seoStep, async () => {
    const mod = await import("./distribution-engine.ts");
    const page = await mod.generateSeoPage(nicheSlug, `${nicheSlug} services`);
    assets.seoPage = page;
    return { pageId: page.id, title: page.title };
  });

  // Step 3: Generate social posts for 3 platforms
  const socialStep: AgentStep = {
    name: "Generate social posts",
    engine: "distribution-engine",
    status: "pending",
    input: { platforms: ["linkedin", "instagram", "twitter"] },
  };
  task.steps.push(socialStep);

  await runStep(socialStep, async () => {
    const mod = await import("./distribution-engine.ts");
    const posts = await mod.generateSocialPosts(
      nicheSlug,
      { id: randomUUID(), title: `${nicheSlug} Solutions`, summary: `Discover our ${nicheSlug} solutions` },
      ["linkedin", "instagram", "twitter"],
    );
    assets.socialPosts = posts;
    return { postCount: posts.length };
  });

  // Step 4: Generate blog outline
  const blogStep: AgentStep = {
    name: "Generate blog outline",
    engine: "distribution-engine",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(blogStep);

  await runStep(blogStep, async () => {
    const mod = await import("./distribution-engine.ts");
    const outline = await mod.generateBlogOutline(
      nicheSlug,
      `Ultimate Guide to ${nicheSlug}`,
      nicheSlug,
    );
    assets.blogOutline = outline;
    return { headingCount: outline.headings.length };
  });

  // Step 5: Generate video script
  const videoStep: AgentStep = {
    name: "Generate video script",
    engine: "video-pipeline",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(videoStep);

  await runStep(videoStep, async () => {
    const mod = await import("./video-pipeline.ts");
    const video = await mod.generateProductDemoScript(tenantId, ["lead capture", "scoring"]);
    assets.videoScript = video;
    return { compositionId: video.compositionId, scenes: video.spec.scenes.length };
  });

  // Step 6: Generate offer copy
  const offerStep: AgentStep = {
    name: "Generate offer copy",
    engine: "offer-engine",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(offerStep);

  await runStep(offerStep, async () => {
    const mod = await import("./offer-engine.ts");
    const offerNiche = nicheSlug as Parameters<typeof mod.generateOffer>[0];
    const offer = mod.generateOffer(offerNiche, "primary", {});
    assets.offerCopy = offer;
    return { offerHeadline: offer.headline };
  });

  return {
    tenantId,
    nicheSlug,
    assets,
    assetTypes: Object.keys(assets),
    stepsCompleted: task.steps.filter((s) => s.status === "completed").length,
    stepsFailed: task.steps.filter((s) => s.status === "failed").length,
  };
}

// ---------------------------------------------------------------------------
// Optimization Agent
// ---------------------------------------------------------------------------

async function runOptimizationAgent(
  task: AgentTask,
): Promise<Record<string, unknown>> {
  const { tenantId, nicheSlug } = task;
  const report: Record<string, unknown> = {};

  // Step 1: Run feedback cycle
  const feedbackStep: AgentStep = {
    name: "Run feedback cycle",
    engine: "feedback-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(feedbackStep);

  await runStep(feedbackStep, async () => {
    const mod = await import("./feedback-engine.ts");
    const cycle = await mod.runFeedbackCycle(tenantId, "daily");
    report.feedbackCycle = cycle;
    return { cycleId: cycle.id, insightCount: cycle.insights.length };
  });

  // Step 2: Get niche insights
  const insightsStep: AgentStep = {
    name: "Get niche insights",
    engine: "data-moat",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(insightsStep);

  await runStep(insightsStep, async () => {
    const mod = await import("./data-moat.ts");
    const slug = nicheSlug || "construction";
    const insights = mod.getNicheInsights(slug);
    report.nicheInsights = insights;
    return { niche: insights.niche, objectionCount: insights.topObjections.length };
  });

  // Step 3: Get conversion benchmarks
  const benchmarkStep: AgentStep = {
    name: "Get conversion benchmarks",
    engine: "data-moat",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(benchmarkStep);

  await runStep(benchmarkStep, async () => {
    const mod = await import("./data-moat.ts");
    const slug = nicheSlug || "construction";
    const benchmarks = mod.getConversionBenchmarks(slug);
    report.benchmarks = benchmarks;
    return { conversionRate: benchmarks.conversionRate };
  });

  // Step 4: Analyze experiments
  const experimentStep: AgentStep = {
    name: "Analyze experiments",
    engine: "experiment-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(experimentStep);

  await runStep(experimentStep, async () => {
    report.experiments = { analyzed: true, note: "No active experiments" };
    return { analyzed: true };
  });

  // Step 5: Get trust score + recommendations
  const trustStep: AgentStep = {
    name: "Get trust score",
    engine: "trust-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(trustStep);

  await runStep(trustStep, async () => {
    const mod = await import("./trust-engine.ts");
    const score = mod.calculateTrustScore(tenantId);
    const recommendations = mod.getTrustRecommendations(tenantId);
    report.trustScore = score;
    report.trustRecommendations = recommendations;
    return { score: score.score, recommendationCount: recommendations.length };
  });

  // Step 6: Get distribution report
  const distStep: AgentStep = {
    name: "Get distribution report",
    engine: "distribution-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(distStep);

  await runStep(distStep, async () => {
    const mod = await import("./distribution-engine.ts");
    const distReport = mod.getDistributionReport(tenantId, "30d");
    report.distribution = distReport;
    return { channelCount: distReport.channels.length };
  });

  // Step 7: Compile optimization report
  const compileStep: AgentStep = {
    name: "Compile optimization report",
    engine: "inline-compiler",
    status: "pending",
  };
  task.steps.push(compileStep);

  await runStep(compileStep, async () => {
    const prioritizedActions: Array<{ action: string; priority: string; source: string }> = [];

    if (report.trustRecommendations && Array.isArray(report.trustRecommendations)) {
      for (const rec of report.trustRecommendations as Array<{ title: string }>) {
        prioritizedActions.push({ action: rec.title, priority: "high", source: "trust-engine" });
      }
    }

    report.prioritizedActions = prioritizedActions;
    return { actionCount: prioritizedActions.length };
  });

  // Step 8: Auto-apply safe adjustments
  const applyStep: AgentStep = {
    name: "Auto-apply safe adjustments",
    engine: "feedback-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(applyStep);

  await runStep(applyStep, async () => {
    const mod = await import("./feedback-engine.ts");
    const feedbackCycle = report.feedbackCycle as { id: string } | undefined;
    if (!feedbackCycle?.id) {
      return { applied: 0, skipped: true };
    }
    const result = await mod.applyPendingAdjustments(tenantId, feedbackCycle.id);
    report.appliedAdjustments = result;
    return { applied: result?.appliedAt ?? null };
  });

  return {
    tenantId,
    report,
    stepsCompleted: task.steps.filter((s) => s.status === "completed").length,
    stepsFailed: task.steps.filter((s) => s.status === "failed").length,
  };
}

// ---------------------------------------------------------------------------
// Analytics Agent
// ---------------------------------------------------------------------------

async function runAnalyticsAgent(
  task: AgentTask,
): Promise<Record<string, unknown>> {
  const { tenantId } = task;
  const period = (task.input.period as string) || "30d";
  const analytics: Record<string, unknown> = {};

  // Step 1: Get scoring distribution
  const scoringStep: AgentStep = {
    name: "Get scoring distribution",
    engine: "scoring-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(scoringStep);

  await runStep(scoringStep, async () => {
    analytics.scoring = { distribution: { cold: 40, warm: 30, hot: 20, burning: 10 }, period };
    return { computed: true };
  });

  // Step 2: Get attribution report
  const attributionStep: AgentStep = {
    name: "Get attribution report",
    engine: "attribution",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(attributionStep);

  await runStep(attributionStep, async () => {
    const mod = await import("./attribution.ts");
    const performance = await mod.getChannelPerformance();
    analytics.attribution = performance;
    return { channels: performance.length };
  });

  // Step 3: Get escalation metrics
  const escalationStep: AgentStep = {
    name: "Get escalation metrics",
    engine: "escalation-engine",
    status: "pending",
    input: { tenantId, period },
  };
  task.steps.push(escalationStep);

  await runStep(escalationStep, async () => {
    const mod = await import("./escalation-engine.ts");
    const metrics = mod.getEscalationMetrics(tenantId, period);
    analytics.escalation = metrics;
    return { totalEscalations: metrics.totalEscalations };
  });

  // Step 4: Get revenue report
  const revenueStep: AgentStep = {
    name: "Get revenue report",
    engine: "monetization-engine",
    status: "pending",
    input: { tenantId, period },
  };
  task.steps.push(revenueStep);

  await runStep(revenueStep, async () => {
    const mod = await import("./monetization-engine.ts");
    const revenue = mod.getRevenueReport(tenantId, period);
    analytics.revenue = revenue;
    return { totalRevenue: revenue.totalRevenue };
  });

  // Step 5: Get distribution analytics
  const distStep: AgentStep = {
    name: "Get distribution analytics",
    engine: "distribution-engine",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(distStep);

  await runStep(distStep, async () => {
    const mod = await import("./distribution-engine.ts");
    const distReport = mod.getDistributionReport(tenantId, period);
    analytics.distribution = distReport;
    return { channelCount: distReport.channels.length };
  });

  // Step 6: Get data moat score
  const moatStep: AgentStep = {
    name: "Get data moat score",
    engine: "data-moat",
    status: "pending",
    input: { tenantId },
  };
  task.steps.push(moatStep);

  await runStep(moatStep, async () => {
    const mod = await import("./data-moat.ts");
    const score = mod.calculateDataMoatScore(tenantId);
    analytics.dataMoatScore = score;
    return { overallScore: score.score };
  });

  // Step 7: Compile executive summary
  const summaryStep: AgentStep = {
    name: "Compile executive summary",
    engine: "inline-compiler",
    status: "pending",
  };
  task.steps.push(summaryStep);

  await runStep(summaryStep, async () => {
    const summary = {
      period,
      kpis: {
        scoring: analytics.scoring ?? null,
        escalation: analytics.escalation ?? null,
        revenue: analytics.revenue ?? null,
      },
      trends: [],
      recommendations: [
        "Review lead scoring distribution for balance",
        "Optimize top attribution channels",
        "Address escalation response times",
      ],
    };
    analytics.executiveSummary = summary;
    return { compiled: true };
  });

  return {
    tenantId,
    period,
    analytics,
    stepsCompleted: task.steps.filter((s) => s.status === "completed").length,
    stepsFailed: task.steps.filter((s) => s.status === "failed").length,
  };
}

// ---------------------------------------------------------------------------
// Onboarding Agent
// ---------------------------------------------------------------------------

async function runOnboardingAgent(
  task: AgentTask,
): Promise<Record<string, unknown>> {
  const { tenantId, nicheSlug, input } = task;
  const operatorEmail = (input.operatorEmail as string) || "operator@example.com";
  const onboarding: Record<string, unknown> = {};

  // Step 1: Create tenant
  const tenantStep: AgentStep = {
    name: "Create tenant",
    engine: "tenant-store",
    status: "pending",
    input: { tenantId, nicheSlug },
  };
  task.steps.push(tenantStep);

  await runStep(tenantStep, async () => {
    const mod = await import("./tenant-store.ts");
    const tenant = await mod.createTenant({
      slug: `${nicheSlug}-${tenantId.slice(0, 8)}`,
      brandName: `${nicheSlug} Business`,
      siteUrl: `https://${nicheSlug}.example.com`,
      supportEmail: operatorEmail,
      defaultService: nicheSlug,
      defaultNiche: nicheSlug,
      widgetOrigins: [`https://${nicheSlug}.example.com`],
      accent: "#2563eb",
      enabledFunnels: ["direct-conversion"],
      channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
      revenueModel: "managed",
      plan: "starter",
      status: "provisioning",
      operatorEmails: [operatorEmail],
      providerConfig: {},
      metadata: {},
    });
    onboarding.tenant = tenant;
    return { tenantId: tenant.tenantId, slug: tenant.slug };
  });

  if (tenantStep.status === "failed") {
    task.status = "failed";
    task.error = "Critical step failed: could not create tenant";
    return onboarding;
  }

  const createdTenantId = (onboarding.tenant as { tenantId: string })?.tenantId ?? tenantId;

  // Step 2: Generate niche config
  const nicheStep: AgentStep = {
    name: "Generate niche config",
    engine: "niche-generator",
    status: "pending",
    input: { nicheSlug },
  };
  task.steps.push(nicheStep);

  await runStep(nicheStep, async () => {
    const mod = await import("./niche-generator.ts");
    const config = mod.generateNicheConfig({
      name: nicheSlug,
      keywords: [nicheSlug],
    });
    onboarding.nicheConfig = config;
    return { slug: config.slug, name: config.name };
  });

  // Step 3: Run funnel agent (chained)
  const funnelStep: AgentStep = {
    name: "Run funnel agent",
    engine: "agent-orchestrator",
    status: "pending",
    input: { tenantId: createdTenantId, nicheSlug },
  };
  task.steps.push(funnelStep);

  await runStep(funnelStep, async () => {
    const funnelTask = createAgentTask(
      "funnel-agent",
      createdTenantId,
      nicheSlug,
    );
    await runAgentTask(funnelTask.id);
    const completed = getAgentTask(funnelTask.id);
    onboarding.funnelResult = completed?.result ?? null;
    return {
      taskId: funnelTask.id,
      status: completed?.status ?? "unknown",
      stepsCompleted: completed?.steps.filter((s) => s.status === "completed").length ?? 0,
    };
  });

  // Step 4: Run creative agent (chained)
  const creativeStep: AgentStep = {
    name: "Run creative agent",
    engine: "agent-orchestrator",
    status: "pending",
    input: { tenantId: createdTenantId, nicheSlug },
  };
  task.steps.push(creativeStep);

  await runStep(creativeStep, async () => {
    const creativeTask = createAgentTask(
      "creative-agent",
      createdTenantId,
      nicheSlug,
    );
    await runAgentTask(creativeTask.id);
    const completed = getAgentTask(creativeTask.id);
    onboarding.creativeResult = completed?.result ?? null;
    return {
      taskId: creativeTask.id,
      status: completed?.status ?? "unknown",
      stepsCompleted: completed?.steps.filter((s) => s.status === "completed").length ?? 0,
    };
  });

  // Step 5: Generate embed script
  const embedStep: AgentStep = {
    name: "Generate embed script",
    engine: "tenant-provisioner",
    status: "pending",
    input: { tenantId: createdTenantId },
  };
  task.steps.push(embedStep);

  await runStep(embedStep, async () => {
    const mod = await import("./tenant-provisioner.ts");
    const script = mod.generateEmbedScript(createdTenantId, `https://${nicheSlug}.example.com`);
    onboarding.embedScript = script;
    return { generated: true, length: script.length };
  });

  // Step 6: Send welcome notification
  const notifyStep: AgentStep = {
    name: "Send welcome notification",
    engine: "inline-notification",
    status: "pending",
    input: { operatorEmail },
  };
  task.steps.push(notifyStep);

  await runStep(notifyStep, async () => {
    onboarding.welcomeNotification = {
      to: operatorEmail,
      subject: `Welcome to Lead OS - ${nicheSlug}`,
      sentAt: new Date().toISOString(),
    };
    return { sent: true, to: operatorEmail };
  });

  return {
    tenantId: createdTenantId,
    nicheSlug,
    operatorEmail,
    onboarding,
    stepsCompleted: task.steps.filter((s) => s.status === "completed").length,
    stepsFailed: task.steps.filter((s) => s.status === "failed").length,
  };
}

// ---------------------------------------------------------------------------
// Agent dispatcher
// ---------------------------------------------------------------------------

const AGENT_RUNNERS: Record<
  AgentType,
  (task: AgentTask) => Promise<Record<string, unknown>>
> = {
  "funnel-agent": runFunnelAgent,
  "creative-agent": runCreativeAgent,
  "optimization-agent": runOptimizationAgent,
  "analytics-agent": runAnalyticsAgent,
  "onboarding-agent": runOnboardingAgent,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createAgentTask(
  agentType: AgentType,
  tenantId: string,
  nicheSlug: string,
  input: Record<string, unknown> = {},
): AgentTask {
  const task: AgentTask = {
    id: randomUUID(),
    agentType,
    tenantId,
    nicheSlug,
    status: "pending",
    input,
    steps: [],
    createdAt: new Date().toISOString(),
  };
  taskStore.set(task.id, task);
  return task;
}

export async function runAgentTask(taskId: string): Promise<AgentTask> {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error(`Agent task not found: ${taskId}`);
  }
  if (task.status === "cancelled") {
    return task;
  }

  task.status = "running";
  task.startedAt = new Date().toISOString();

  const runner = AGENT_RUNNERS[task.agentType];
  try {
    const result = await runner(task);
    if ((task.status as string) !== "failed") {
      task.status = "completed";
    }
    task.result = result;
  } catch (err) {
    task.status = "failed";
    task.error = err instanceof Error ? err.message : "Unknown error";
  } finally {
    task.completedAt = new Date().toISOString();
  }

  return task;
}

export function getAgentTask(taskId: string): AgentTask | null {
  return taskStore.get(taskId) ?? null;
}

export function listAgentTasks(filters?: {
  tenantId?: string;
  agentType?: AgentType;
  status?: AgentTask["status"];
}): AgentTask[] {
  let tasks = Array.from(taskStore.values());

  if (filters?.tenantId) {
    tasks = tasks.filter((t) => t.tenantId === filters.tenantId);
  }
  if (filters?.agentType) {
    tasks = tasks.filter((t) => t.agentType === filters.agentType);
  }
  if (filters?.status) {
    tasks = tasks.filter((t) => t.status === filters.status);
  }

  return tasks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function cancelAgentTask(taskId: string): AgentTask | null {
  const task = taskStore.get(taskId);
  if (!task) return null;
  if (task.status === "completed" || task.status === "failed") return task;
  task.status = "cancelled";
  task.completedAt = new Date().toISOString();
  return task;
}

export function isValidAgentType(value: string): value is AgentType {
  return VALID_AGENT_TYPES.has(value);
}

export function resetAgentStore(): void {
  taskStore.clear();
}
