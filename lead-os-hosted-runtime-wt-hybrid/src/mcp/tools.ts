import { provisionTenant, type ProvisionTenantInput } from "../lib/tenant-provisioner.ts";
import { getTenant, listTenants, type TenantRecord } from "../lib/tenant-store.ts";
import { generateNicheConfig } from "../lib/niche-generator.ts";
import {
  validateDesignSpec,
  generateDesignSpecTemplate,
  generateSystemConfig,
  parseDesignSpec,
  type DesignSpec,
} from "../lib/design-spec.ts";
import { processLeadIntake, type HostedLeadPayload } from "../lib/intake.ts";
import {
  computeCompositeScore,
  computeIntentScore,
  computeFitScore,
  computeEngagementScore,
  computeUrgencyScore,
  classifyLeadTemperature,
  getScoreRecommendation,
  type ScoringContext,
} from "../lib/scoring-engine.ts";
import { decideNextStep, type DecisionSignal } from "../lib/orchestrator.ts";
import { getLeadRecord, getLeadRecords } from "../lib/runtime-store.ts";
import {
  collectPerformanceMetrics,
  runFeedbackCycle,
  generateInsights,
  getDefaultKPITargets,
} from "../lib/feedback-engine.ts";
import {
  publishLeadToMarketplace,
  claimLeadForBuyer,
} from "../lib/marketplace.ts";
import { listMarketplaceLeads } from "../lib/marketplace-store.ts";
import {
  createExperiment,
  analyzeExperiment,
  type Experiment,
  type ExperimentVariant,
} from "../lib/experiment-engine.ts";
import { createPage, type LandingPage } from "../lib/page-builder.ts";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

function requiredString(description: string): Record<string, unknown> {
  return { type: "string", description };
}

function optionalString(description: string): Record<string, unknown> {
  return { type: "string", description };
}

export const tools: McpTool[] = [
  // --- Tenant & Provisioning ---
  {
    name: "lead_os_provision_tenant",
    description:
      "Provision a new Lead OS tenant with full niche configuration, funnels, and embed script generation.",
    inputSchema: {
      type: "object",
      properties: {
        slug: requiredString("URL-safe tenant identifier"),
        brandName: requiredString("Display name for the brand"),
        siteUrl: requiredString("Root URL of the tenant site"),
        supportEmail: requiredString("Support email address"),
        operatorEmail: requiredString("Operator email for admin access"),
        niche: requiredString("Target niche (e.g. immigration-law, roofing)"),
        industry: optionalString("Industry category (legal, health, construction, etc.)"),
        revenueModel: {
          type: "string",
          enum: ["managed", "white-label", "implementation", "directory"],
          description: "Revenue model for the tenant",
        },
        plan: {
          type: "string",
          enum: ["starter", "growth", "enterprise", "custom"],
          description: "Subscription plan tier",
        },
      },
      required: ["slug", "brandName", "siteUrl", "supportEmail", "operatorEmail", "niche", "revenueModel", "plan"],
    },
    handler: async (params) => {
      const input: ProvisionTenantInput = {
        slug: params.slug as string,
        brandName: params.brandName as string,
        siteUrl: params.siteUrl as string,
        supportEmail: params.supportEmail as string,
        operatorEmail: params.operatorEmail as string,
        niche: params.niche as string,
        industry: params.industry as string | undefined,
        revenueModel: params.revenueModel as ProvisionTenantInput["revenueModel"],
        plan: params.plan as ProvisionTenantInput["plan"],
      };
      return provisionTenant(input);
    },
  },

  {
    name: "lead_os_list_tenants",
    description: "List all Lead OS tenants with optional status and revenue model filters.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["provisioning", "active", "suspended", "cancelled"],
          description: "Filter by tenant status",
        },
        revenueModel: {
          type: "string",
          enum: ["managed", "white-label", "implementation", "directory"],
          description: "Filter by revenue model",
        },
      },
    },
    handler: async (params) => {
      return listTenants({
        status: params.status as TenantRecord["status"] | undefined,
        revenueModel: params.revenueModel as TenantRecord["revenueModel"] | undefined,
      });
    },
  },

  {
    name: "lead_os_get_tenant",
    description: "Get detailed information about a specific tenant by ID.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("The tenant ID to look up"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      const tenant = await getTenant(params.tenantId as string);
      if (!tenant) {
        throw new Error(`Tenant not found: ${params.tenantId}`);
      }
      return tenant;
    },
  },

  // --- Niche & Design ---
  {
    name: "lead_os_generate_niche",
    description:
      "Generate a complete niche configuration including assessment questions, scoring weights, nurture sequences, personalization content, and recommended funnels.",
    inputSchema: {
      type: "object",
      properties: {
        name: requiredString("Niche name (e.g. immigration-law, roofing-contractors)"),
        industry: optionalString("Industry category override"),
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Additional keywords for industry detection",
        },
      },
      required: ["name"],
    },
    handler: async (params) => {
      return generateNicheConfig({
        name: params.name as string,
        industry: params.industry as string | undefined,
        keywords: params.keywords as string[] | undefined,
      });
    },
  },

  {
    name: "lead_os_create_design_spec",
    description:
      "Create and validate a DESIGN.md spec. Pass a JSON object matching the DesignSpec schema. Returns validation result and generated system config.",
    inputSchema: {
      type: "object",
      properties: {
        spec: {
          type: "object",
          description: "Full DesignSpec JSON object with niche, ingress, funnels, psychology, offers, automation, kpis fields",
        },
      },
      required: ["spec"],
    },
    handler: async (params) => {
      const validation = validateDesignSpec(params.spec);
      if (!validation.valid) {
        return { valid: false, errors: validation.errors };
      }
      const spec = params.spec as DesignSpec;
      const systemConfig = generateSystemConfig(spec);
      return { valid: true, spec, systemConfig };
    },
  },

  {
    name: "lead_os_apply_design_spec",
    description:
      "Apply a design spec to a tenant. Validates the spec and generates system configuration.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Target tenant ID"),
        specJson: {
          type: "object",
          description: "DesignSpec JSON to apply",
        },
      },
      required: ["tenantId", "specJson"],
    },
    handler: async (params) => {
      const tenant = await getTenant(params.tenantId as string);
      if (!tenant) {
        throw new Error(`Tenant not found: ${params.tenantId}`);
      }
      const validation = validateDesignSpec(params.specJson);
      if (!validation.valid) {
        return { applied: false, errors: validation.errors };
      }
      const spec = params.specJson as DesignSpec;
      const systemConfig = generateSystemConfig(spec);
      return { applied: true, tenantId: params.tenantId, systemConfig };
    },
  },

  {
    name: "lead_os_export_design_md",
    description:
      "Export a Stitch-compatible DESIGN.md template for a tenant's niche. Returns the full spec as a markdown-wrapped JSON document.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID to export design spec for"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      const tenant = await getTenant(params.tenantId as string);
      if (!tenant) {
        throw new Error(`Tenant not found: ${params.tenantId}`);
      }
      const markdown = generateDesignSpecTemplate(tenant.defaultNiche, tenant.metadata?.industry as string | undefined);
      return { tenantId: params.tenantId, designMd: markdown };
    },
  },

  // --- Lead Operations ---
  {
    name: "lead_os_capture_lead",
    description:
      "Capture a new lead through the intake pipeline. Triggers scoring, routing, CRM sync, alerts, and follow-up actions.",
    inputSchema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          enum: ["contact_form", "assessment", "roi_calculator", "exit_intent", "chat", "webinar", "checkout", "manual"],
          description: "Lead source channel",
        },
        email: optionalString("Lead email address"),
        phone: optionalString("Lead phone number"),
        firstName: optionalString("Lead first name"),
        lastName: optionalString("Lead last name"),
        company: optionalString("Company name"),
        niche: optionalString("Target niche"),
        service: optionalString("Service of interest"),
      },
      required: ["source"],
    },
    handler: async (params) => {
      const payload: HostedLeadPayload = {
        source: params.source as HostedLeadPayload["source"],
        email: params.email as string | undefined,
        phone: params.phone as string | undefined,
        firstName: params.firstName as string | undefined,
        lastName: params.lastName as string | undefined,
        company: params.company as string | undefined,
        niche: params.niche as string | undefined,
        service: params.service as string | undefined,
      };
      return processLeadIntake(payload);
    },
  },

  {
    name: "lead_os_score_lead",
    description:
      "Score a lead based on intent, fit, engagement, and urgency signals. Returns composite score, temperature classification, and recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        source: requiredString("Lead source (referral, organic, paid, direct, social, email)"),
        niche: optionalString("Lead niche"),
        service: optionalString("Service of interest"),
        pagesViewed: { type: "number", description: "Number of pages viewed" },
        timeOnSite: { type: "number", description: "Time on site in seconds" },
        formCompletions: { type: "number", description: "Number of forms completed" },
        chatMessages: { type: "number", description: "Number of chat messages" },
        emailOpens: { type: "number", description: "Number of emails opened" },
        emailClicks: { type: "number", description: "Number of email clicks" },
        assessmentCompleted: { type: "boolean", description: "Whether assessment was completed" },
        assessmentScore: { type: "number", description: "Assessment score if completed" },
        calculatorUsed: { type: "boolean", description: "Whether ROI calculator was used" },
        returnVisits: { type: "number", description: "Number of return visits" },
        hasPhone: { type: "boolean", description: "Whether phone number was provided" },
        hasCompany: { type: "boolean", description: "Whether company name was provided" },
        hasEmail: { type: "boolean", description: "Whether email was provided" },
        companySize: optionalString("Company size category (enterprise, mid-market, small, solo)"),
        budget: optionalString("Budget range"),
        timeline: optionalString("Timeline (immediate, this-week, this-month, this-quarter, exploring)"),
        referralSource: optionalString("Referral source if applicable"),
      },
      required: ["source"],
    },
    handler: async (params) => {
      const ctx: ScoringContext = {
        source: params.source as string,
        niche: params.niche as string | undefined,
        service: params.service as string | undefined,
        pagesViewed: params.pagesViewed as number | undefined,
        timeOnSite: params.timeOnSite as number | undefined,
        formCompletions: params.formCompletions as number | undefined,
        chatMessages: params.chatMessages as number | undefined,
        emailOpens: params.emailOpens as number | undefined,
        emailClicks: params.emailClicks as number | undefined,
        assessmentCompleted: params.assessmentCompleted as boolean | undefined,
        assessmentScore: params.assessmentScore as number | undefined,
        calculatorUsed: params.calculatorUsed as boolean | undefined,
        returnVisits: params.returnVisits as number | undefined,
        hasPhone: params.hasPhone as boolean | undefined,
        hasCompany: params.hasCompany as boolean | undefined,
        hasEmail: params.hasEmail as boolean | undefined,
        companySize: params.companySize as string | undefined,
        budget: params.budget as string | undefined,
        timeline: params.timeline as string | undefined,
        referralSource: params.referralSource as string | undefined,
      };
      const intent = computeIntentScore(ctx);
      const fit = computeFitScore(ctx);
      const engagement = computeEngagementScore(ctx);
      const urgency = computeUrgencyScore(ctx);
      const composite = computeCompositeScore(ctx);
      const temperature = classifyLeadTemperature(composite.score);
      const scores = [intent, fit, engagement, urgency, composite];
      const recommendation = getScoreRecommendation(scores);
      return { composite, temperature, recommendation };
    },
  },

  {
    name: "lead_os_route_lead",
    description:
      "Get an intelligent routing decision for a lead based on behavioral signals. Returns funnel family, destination URL, CTA label, and recommended channels.",
    inputSchema: {
      type: "object",
      properties: {
        source: optionalString("Traffic source"),
        service: optionalString("Service of interest"),
        niche: optionalString("Niche"),
        hasEmail: { type: "boolean", description: "Has email" },
        hasPhone: { type: "boolean", description: "Has phone" },
        returning: { type: "boolean", description: "Is a returning visitor" },
        askingForQuote: { type: "boolean", description: "Asking for a quote" },
        wantsBooking: { type: "boolean", description: "Wants to book" },
        wantsCheckout: { type: "boolean", description: "Wants to checkout" },
        prefersChat: { type: "boolean", description: "Prefers chat" },
        contentEngaged: { type: "boolean", description: "Engaged with content" },
        score: { type: "number", description: "Current lead score" },
      },
    },
    handler: async (params) => {
      const signal: DecisionSignal = {
        source: params.source as string | undefined,
        service: params.service as string | undefined,
        niche: params.niche as string | undefined,
        hasEmail: params.hasEmail as boolean | undefined,
        hasPhone: params.hasPhone as boolean | undefined,
        returning: params.returning as boolean | undefined,
        askingForQuote: params.askingForQuote as boolean | undefined,
        wantsBooking: params.wantsBooking as boolean | undefined,
        wantsCheckout: params.wantsCheckout as boolean | undefined,
        prefersChat: params.prefersChat as boolean | undefined,
        contentEngaged: params.contentEngaged as boolean | undefined,
        score: params.score as number | undefined,
      };
      return decideNextStep(signal);
    },
  },

  {
    name: "lead_os_list_leads",
    description: "List leads with optional filters for niche, stage, and minimum score.",
    inputSchema: {
      type: "object",
      properties: {
        niche: optionalString("Filter by niche"),
        stage: optionalString("Filter by lead stage"),
        minScore: { type: "number", description: "Minimum score filter" },
        limit: { type: "number", description: "Max results (default 50)" },
      },
    },
    handler: async (params) => {
      let records = await getLeadRecords();
      if (params.niche) {
        records = records.filter((r) => r.niche === params.niche);
      }
      if (params.stage) {
        records = records.filter((r) => r.stage === params.stage);
      }
      if (params.minScore !== undefined) {
        records = records.filter((r) => r.score >= (params.minScore as number));
      }
      const limit = Math.min((params.limit as number) || 50, 100);
      return { leads: records.slice(0, limit), total: records.length };
    },
  },

  {
    name: "lead_os_get_lead",
    description: "Get detailed lead record by lead key.",
    inputSchema: {
      type: "object",
      properties: {
        leadKey: requiredString("Unique lead key identifier"),
      },
      required: ["leadKey"],
    },
    handler: async (params) => {
      const record = await getLeadRecord(params.leadKey as string);
      if (!record) {
        throw new Error(`Lead not found: ${params.leadKey}`);
      }
      return record;
    },
  },

  // --- Analytics & Feedback ---
  {
    name: "lead_os_get_analytics",
    description: "Get a performance analytics snapshot for a tenant including conversion rates, top funnels, sources, and email performance.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        since: optionalString("Start date ISO 8601"),
        until: optionalString("End date ISO 8601"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      const now = new Date();
      const since = (params.since as string) ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const until = (params.until as string) ?? now.toISOString();
      const metrics = await collectPerformanceMetrics(params.tenantId as string, since, until);
      const targets = getDefaultKPITargets();
      const insights = generateInsights(metrics, targets);
      return { metrics, insights, targets };
    },
  },

  {
    name: "lead_os_run_feedback_cycle",
    description:
      "Trigger an automated feedback optimization cycle that analyzes performance, generates insights, and proposes scoring/routing adjustments.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        type: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "Feedback cycle frequency type",
        },
      },
      required: ["tenantId", "type"],
    },
    handler: async (params) => {
      return runFeedbackCycle(
        params.tenantId as string,
        params.type as "daily" | "weekly" | "monthly",
      );
    },
  },

  {
    name: "lead_os_get_insights",
    description: "Get current performance insights and recommendations for a tenant.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      const now = new Date();
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const until = now.toISOString();
      const metrics = await collectPerformanceMetrics(params.tenantId as string, since, until);
      const targets = getDefaultKPITargets();
      return generateInsights(metrics, targets);
    },
  },

  // --- Marketplace ---
  {
    name: "lead_os_publish_lead",
    description: "Publish a lead to the Lead OS marketplace for resale to buyers.",
    inputSchema: {
      type: "object",
      properties: {
        leadKey: requiredString("Lead key to publish"),
        tenantId: requiredString("Publishing tenant ID"),
        niche: requiredString("Lead niche"),
        score: { type: "number", description: "Lead quality score (0-100)" },
        temperature: {
          type: "string",
          enum: ["cold", "warm", "hot", "burning"],
          description: "Lead temperature",
        },
        firstName: optionalString("Lead first name (will be anonymized)"),
        service: optionalString("Service interest"),
        city: optionalString("City"),
        state: optionalString("State"),
      },
      required: ["leadKey", "tenantId", "niche", "score", "temperature"],
    },
    handler: async (params) => {
      return publishLeadToMarketplace(
        params.leadKey as string,
        params.tenantId as string,
        {
          firstName: params.firstName as string | undefined,
          niche: params.niche as string,
          score: params.score as number,
          temperature: params.temperature as "cold" | "warm" | "hot" | "burning",
          city: params.city as string | undefined,
          state: params.state as string | undefined,
          service: params.service as string | undefined,
        },
      );
    },
  },

  {
    name: "lead_os_list_marketplace",
    description: "List available leads on the marketplace with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        niche: optionalString("Filter by niche"),
        temperature: {
          type: "string",
          enum: ["cold", "warm", "hot", "burning"],
          description: "Filter by temperature",
        },
        status: {
          type: "string",
          enum: ["available", "claimed", "sold", "expired"],
          description: "Filter by status",
        },
        limit: { type: "number", description: "Max results" },
      },
    },
    handler: async (params) => {
      return listMarketplaceLeads({
        niche: params.niche as string | undefined,
        temperature: params.temperature as "cold" | "warm" | "hot" | "burning" | undefined,
        status: params.status as "available" | "claimed" | "sold" | "expired" | undefined,
        limit: params.limit as number | undefined,
      });
    },
  },

  {
    name: "lead_os_claim_lead",
    description: "Claim a marketplace lead for a buyer. Returns the lead with revealed contact information.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: requiredString("Marketplace lead ID"),
        buyerId: requiredString("Buyer account ID"),
      },
      required: ["leadId", "buyerId"],
    },
    handler: async (params) => {
      return claimLeadForBuyer(params.leadId as string, params.buyerId as string);
    },
  },

  // --- Experiments ---
  {
    name: "lead_os_create_experiment",
    description: "Create a new A/B test experiment with named variants and a target metric.",
    inputSchema: {
      type: "object",
      properties: {
        name: requiredString("Experiment name"),
        description: optionalString("Experiment description"),
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              weight: { type: "number" },
              isControl: { type: "boolean" },
            },
            required: ["name"],
          },
          description: "Experiment variants (first is control by default)",
        },
        targetMetric: optionalString("Target metric to optimize (default: conversion_rate)"),
        minimumSampleSize: { type: "number", description: "Minimum sample size for significance (default: 100)" },
      },
      required: ["name", "variants"],
    },
    handler: async (params) => {
      const rawVariants = params.variants as Array<{ name: string; weight?: number; isControl?: boolean }>;
      const variants: ExperimentVariant[] = rawVariants.map((v, i) => ({
        id: `var_${Date.now()}_${i}`,
        name: v.name,
        weight: v.weight ?? (1 / rawVariants.length),
        isControl: v.isControl ?? (i === 0),
      }));
      return createExperiment({
        name: params.name as string,
        description: (params.description as string) ?? "",
        status: "draft",
        variants,
        targetMetric: (params.targetMetric as string) ?? "conversion_rate",
        minimumSampleSize: (params.minimumSampleSize as number) ?? 100,
      });
    },
  },

  {
    name: "lead_os_get_experiment_results",
    description:
      "Get analysis of an A/B test experiment including conversion rates, statistical significance, and winner recommendation.",
    inputSchema: {
      type: "object",
      properties: {
        experimentId: requiredString("Experiment ID to analyze"),
      },
      required: ["experimentId"],
    },
    handler: async (params) => {
      return analyzeExperiment(params.experimentId as string);
    },
  },

  // --- Creative Pipeline ---
  {
    name: "lead_os_generate_landing_page",
    description: "Generate a landing page with hero, CTA, testimonial, and form blocks for a given niche.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        slug: requiredString("URL slug for the landing page"),
        title: requiredString("Page title / headline"),
        niche: requiredString("Target niche"),
        description: optionalString("Page meta description"),
        primaryColor: optionalString("Primary brand color (hex)"),
      },
      required: ["tenantId", "slug", "title", "niche"],
    },
    handler: async (params) => {
      const page = createPage({
        tenantId: params.tenantId as string,
        slug: params.slug as string,
        title: params.title as string,
        description: (params.description as string) ?? `Landing page for ${params.niche}`,
        blocks: [
          {
            id: "hero_1",
            type: "hero",
            props: {
              headline: params.title,
              subheadline: `Expert ${params.niche} services tailored to your needs`,
              ctaText: "Get Started",
              ctaUrl: `/funnel/lead-magnet?niche=${params.niche}`,
            },
            order: 0,
          },
          {
            id: "features_1",
            type: "features",
            props: {
              items: [
                { title: "Expert Team", description: "Industry-leading professionals" },
                { title: "Proven Results", description: "Data-driven approach with measurable outcomes" },
                { title: "Fast Turnaround", description: "Get results when you need them" },
              ],
            },
            order: 1,
          },
          {
            id: "social_proof_1",
            type: "social-proof",
            props: {
              message: "Trusted by hundreds of businesses",
              count: 500,
            },
            order: 2,
          },
          {
            id: "testimonial_1",
            type: "testimonial",
            props: {
              quote: `Working with this ${params.niche} team transformed our business`,
              author: "Satisfied Client",
              company: "Growth Co",
            },
            order: 3,
          },
          {
            id: "form_1",
            type: "form",
            props: {
              heading: "Get Your Free Consultation",
              fields: ["firstName", "email", "phone", "message"],
              submitLabel: "Request Consultation",
              source: "contact_form",
            },
            order: 4,
          },
          {
            id: "cta_1",
            type: "cta",
            props: {
              text: "Ready to grow your business?",
              buttonText: "Schedule a Call",
              url: `/funnel/qualification?niche=${params.niche}`,
            },
            order: 5,
          },
        ],
        seo: {
          title: `${params.title} | ${params.niche}`,
          description: (params.description as string) ?? `Professional ${params.niche} services`,
        },
        styles: {
          primaryColor: (params.primaryColor as string) ?? "#2563eb",
          backgroundColor: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        status: "draft",
      });
      return page;
    },
  },

  {
    name: "lead_os_generate_email_sequence",
    description:
      "Generate a 7-stage nurture email sequence for a niche with subject lines, preview text, and body templates.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        niche: requiredString("Target niche"),
        brandName: requiredString("Brand name for personalization"),
      },
      required: ["tenantId", "niche", "brandName"],
    },
    handler: async (params) => {
      const niche = params.niche as string;
      const brandName = params.brandName as string;
      const stages = [
        { day: 0, label: "Welcome & Value Delivery", goal: "Deliver lead magnet and set expectations" },
        { day: 2, label: "Quick Win", goal: "Share an actionable tip they can implement today" },
        { day: 5, label: "Proof & Positioning", goal: "Show a case study or testimonial" },
        { day: 10, label: "Authority Follow-Up", goal: "Share expertise and build trust" },
        { day: 14, label: "Consultation Offer", goal: "Invite to a free consultation" },
        { day: 21, label: "Reactivation", goal: "Re-engage with a limited-time offer" },
        { day: 30, label: "Long-Term Nurture", goal: "Provide ongoing value and stay top of mind" },
      ];
      const sequence = stages.map((stage, i) => ({
        stageId: `stage_${i + 1}`,
        dayOffset: stage.day,
        subject: generateEmailSubject(niche, brandName, stage.label, i),
        previewText: generatePreviewText(niche, stage.goal),
        bodyTemplate: generateEmailBody(niche, brandName, stage.label, stage.goal, i),
      }));
      return { tenantId: params.tenantId, niche, brandName, sequence };
    },
  },

  {
    name: "lead_os_export_video_script",
    description:
      "Generate a Remotion-compatible video script for a product demo, data report, or launch video.",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        type: {
          type: "string",
          enum: ["product-demo", "data-report", "launch-video"],
          description: "Type of video to generate",
        },
        title: optionalString("Video title override"),
        features: {
          type: "array",
          items: { type: "string" },
          description: "Features or data points to highlight",
        },
        brandColor: optionalString("Brand color hex"),
        duration: { type: "number", description: "Target duration in seconds (default 30)" },
      },
      required: ["tenantId", "type"],
    },
    handler: async (params) => {
      const videoType = params.type as string;
      const features = (params.features as string[]) ?? getDefaultFeatures(videoType);
      const duration = (params.duration as number) ?? 30;
      const fps = 30;
      const totalFrames = duration * fps;
      const brandColor = (params.brandColor as string) ?? "#2563eb";
      const title = (params.title as string) ?? getDefaultTitle(videoType);

      const scenes = generateVideoScenes(videoType, title, features, brandColor, totalFrames);

      return {
        tenantId: params.tenantId,
        type: videoType,
        title,
        remotionConfig: {
          compositionId: `lead-os-${videoType}`,
          width: 1920,
          height: 1080,
          fps,
          durationInFrames: totalFrames,
        },
        scenes,
        brandColor,
        features,
      };
    },
  },

  // --- Distribution ---
  {
    name: "lead_os_generate_seo_page",
    description: "Generate SEO-optimized landing page",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Target niche"),
        keyword: requiredString("Primary SEO keyword"),
        template: optionalString("Page template: standard, long-form, local (default: standard)"),
      },
      required: ["niche", "keyword"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/distribution-engine.ts");
        return await mod.generateSeoPage(params.niche as string, params.keyword as string, (params.template as string) || "standard");
      } catch {
        return { error: "distribution-engine module not yet available" };
      }
    },
  },

  {
    name: "lead_os_generate_programmatic_pages",
    description: "Batch generate location-specific pages",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Target niche"),
        locations: {
          type: "array",
          items: { type: "string" },
          description: "List of locations to generate pages for",
        },
        template: optionalString("Page template to use"),
      },
      required: ["niche", "locations"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/distribution-engine.ts");
        return await mod.generateProgrammaticPages(params.niche as string, params.locations as string[]);
      } catch {
        return { error: "distribution-engine module not yet available" };
      }
    },
  },

  // --- Offers ---
  {
    name: "lead_os_generate_offer",
    description: "Generate irresistible offer with pricing psychology",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Target niche"),
        service: requiredString("Service to create offer for"),
        pricePoint: { type: "number", description: "Base price point" },
        urgency: optionalString("Urgency level: low, medium, high"),
      },
      required: ["niche", "service"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/offer-engine.ts");
        return mod.generateOffer(
          params.niche as Parameters<typeof mod.generateOffer>[0],
          params.service as string,
          {
            averageProjectValue: params.pricePoint as number | undefined,
            urgencyType: (params.urgency as string) === "high" ? "countdown" : undefined,
          },
        );
      } catch {
        return { error: "offer-engine module not yet available" };
      }
    },
  },

  {
    name: "lead_os_generate_pricing_tiers",
    description: "Generate 3-tier pricing with decoy effect",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Target niche"),
        service: requiredString("Service to price"),
        basePrice: { type: "number", description: "Base price for the starter tier" },
      },
      required: ["niche", "service", "basePrice"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/offer-engine.ts");
        return mod.generatePriceTiers(params.service as string, params.niche as Parameters<typeof mod.generatePriceTiers>[1]);
      } catch {
        return { error: "offer-engine module not yet available" };
      }
    },
  },

  // --- Monetization ---
  {
    name: "lead_os_calculate_lead_value",
    description: "Calculate dynamic lead value by niche",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Lead niche"),
        quality: optionalString("Lead quality: low, medium, high, premium"),
        score: { type: "number", description: "Lead score (0-100)" },
      },
      required: ["niche"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/monetization-engine.ts");
        return mod.calculateLeadValue(
          { id: "dynamic", metadata: { quality: (params.quality as string) || "medium" } },
          params.niche as string,
          (params.score as number) ?? 50,
        );
      } catch {
        return { error: "monetization-engine module not yet available" };
      }
    },
  },

  {
    name: "lead_os_auction_lead",
    description: "Auction lead to highest bidder",
    inputSchema: {
      type: "object",
      properties: {
        leadKey: requiredString("Lead key to auction"),
        niche: requiredString("Lead niche"),
        score: { type: "number", description: "Lead quality score" },
        minBid: { type: "number", description: "Minimum bid amount" },
      },
      required: ["leadKey", "niche", "score"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/monetization-engine.ts");
        return mod.auctionLead(
          {
            id: params.leadKey as string,
            niche: params.niche as string,
            reservePrice: (params.minBid as number) ?? 0,
          },
          [],
        );
      } catch {
        return { error: "monetization-engine module not yet available" };
      }
    },
  },

  {
    name: "lead_os_get_revenue_report",
    description: "Revenue breakdown by source",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        since: optionalString("Start date ISO 8601"),
        until: optionalString("End date ISO 8601"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/monetization-engine.ts");
        return mod.getRevenueReport(params.tenantId as string, (params.since as string) ?? "30d");
      } catch {
        return { error: "monetization-engine module not yet available" };
      }
    },
  },

  // --- Escalation ---
  {
    name: "lead_os_evaluate_escalation",
    description: "Evaluate lead for human handoff",
    inputSchema: {
      type: "object",
      properties: {
        leadKey: requiredString("Lead key to evaluate"),
        score: { type: "number", description: "Current lead score" },
        signals: {
          type: "object",
          description: "Behavioral signals object",
        },
      },
      required: ["leadKey", "score"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/escalation-engine.ts");
        const lead: Parameters<typeof mod.shouldEscalate>[0] = {
          id: params.leadKey as string,
          tenantId: "default",
        };
        const signals: Parameters<typeof mod.shouldEscalate>[2] = (params.signals ?? {}) as Parameters<typeof mod.shouldEscalate>[2];
        return mod.shouldEscalate(lead, params.score as number, signals);
      } catch {
        return { error: "escalation-engine module not yet available" };
      }
    },
  },

  {
    name: "lead_os_create_handoff",
    description: "Create sales handoff document",
    inputSchema: {
      type: "object",
      properties: {
        leadKey: requiredString("Lead key to hand off"),
        assignee: requiredString("Sales rep or team to assign to"),
        context: optionalString("Additional context for the handoff"),
      },
      required: ["leadKey", "assignee"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/escalation-engine.ts");
        const lead: Parameters<typeof mod.createSalesHandoff>[0] = {
          id: params.leadKey as string,
          tenantId: "default",
        };
        const rep: Parameters<typeof mod.createSalesHandoff>[1] = {
          id: params.assignee as string,
          name: params.assignee as string,
          email: "",
          phone: "",
          niches: [],
          timezone: "UTC",
          maxDailyCapacity: 10,
          currentDailyLoad: 0,
          isAvailable: true,
          closingRate: 0,
        };
        return mod.createSalesHandoff(lead, rep, {
          conversationHighlights: (params.context as string) ? [(params.context as string)] : [],
        });
      } catch {
        return { error: "escalation-engine module not yet available" };
      }
    },
  },

  // --- Trust ---
  {
    name: "lead_os_get_trust_score",
    description: "Calculate trust score with recommendations",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID to evaluate"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/trust-engine.ts");
        const score = mod.calculateTrustScore(params.tenantId as string);
        const recommendations = mod.getTrustRecommendations(params.tenantId as string);
        return { score, recommendations };
      } catch {
        return { error: "trust-engine module not yet available" };
      }
    },
  },

  {
    name: "lead_os_generate_social_proof",
    description: "Generate social proof elements",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: requiredString("Tenant ID"),
        type: optionalString("Proof type: testimonials, stats, badges, logos (default: all)"),
      },
      required: ["tenantId"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/trust-engine.ts");
        const proofType = (params.type as string) || "counter";
        return mod.generateSocialProof(params.tenantId as string, proofType as Parameters<typeof mod.generateSocialProof>[1]);
      } catch {
        return { error: "trust-engine module not yet available" };
      }
    },
  },

  // --- Data Moat ---
  {
    name: "lead_os_get_niche_insights",
    description: "Aggregated niche intelligence",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Niche to analyze"),
      },
      required: ["niche"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/data-moat.ts");
        return await mod.getNicheInsights(params.niche as string);
      } catch {
        return { error: "data-moat module not yet available" };
      }
    },
  },

  {
    name: "lead_os_get_conversion_benchmarks",
    description: "Niche conversion benchmarks",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Niche to get benchmarks for"),
      },
      required: ["niche"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/data-moat.ts");
        return await mod.getConversionBenchmarks(params.niche as string);
      } catch {
        return { error: "data-moat module not yet available" };
      }
    },
  },

  // --- Psychology ---
  {
    name: "lead_os_generate_deep_psychology",
    description: "Generate fear/desire/identity triggers",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Target niche"),
        emotion: requiredString("Primary emotion: fear, desire, identity, urgency, belonging"),
        intensity: optionalString("Intensity level: subtle, moderate, intense (default: moderate)"),
      },
      required: ["niche", "emotion"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/psychology-engine.ts");
        const triggers = mod.listAllTriggers().filter(
          (t) => t.category === (params.emotion as string) || t.type === (params.emotion as string),
        );
        return { niche: params.niche, emotion: params.emotion, intensity: (params.intensity as string) || "moderate", triggers };
      } catch {
        return { error: "deep-psychology module not yet available" };
      }
    },
  },

  {
    name: "lead_os_generate_emotional_sequence",
    description: "Funnel-stage emotional trigger sequence",
    inputSchema: {
      type: "object",
      properties: {
        niche: requiredString("Target niche"),
        funnelStages: {
          type: "array",
          items: { type: "string" },
          description: "Funnel stages to generate triggers for",
        },
      },
      required: ["niche"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/psychology-engine.ts");
        const stages = (params.funnelStages as string[]) ?? ["awareness", "consideration", "decision"];
        const allTriggers = mod.listAllTriggers();
        const sequence = stages.map((stage) => ({
          stage,
          triggers: allTriggers.filter((t) => t.conditions.stages?.includes(stage)),
        }));
        return { niche: params.niche, sequence };
      } catch {
        return { error: "deep-psychology module not yet available" };
      }
    },
  },

  // --- Personalization ---
  {
    name: "lead_os_personalize",
    description: "Generate personalized experience for visitor",
    inputSchema: {
      type: "object",
      properties: {
        visitorId: requiredString("Visitor or lead identifier"),
        niche: requiredString("Target niche"),
        signals: {
          type: "object",
          description: "Visitor behavioral signals (pages viewed, time on site, etc.)",
        },
      },
      required: ["visitorId", "niche"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/personalization-engine.ts");
        const context: Parameters<typeof mod.personalize>[0] = {
          visitorId: params.visitorId as string,
          niche: params.niche as string,
          ...(params.signals as Record<string, unknown> | undefined),
        };
        return mod.personalize(context);
      } catch {
        return { error: "personalization-engine module not yet available" };
      }
    },
  },

  // --- Visitor Tracking ---
  {
    name: "lead_os_track_session",
    description: "Create or update visitor session",
    inputSchema: {
      type: "object",
      properties: {
        visitorId: requiredString("Visitor identifier"),
        tenantId: requiredString("Tenant ID"),
        page: requiredString("Current page URL or path"),
        referrer: optionalString("Referrer URL"),
        event: optionalString("Event type: pageview, click, scroll, form_start, form_submit"),
        metadata: {
          type: "object",
          description: "Additional event metadata",
        },
      },
      required: ["visitorId", "tenantId", "page"],
    },
    handler: async (params) => {
      try {
        const mod = await import("../lib/visitor-tracking.ts");
        const session = mod.createSession(
          params.visitorId as string,
          { type: "desktop", browser: "unknown", os: "unknown", screenWidth: 1920, screenHeight: 1080 },
          params.referrer as string | undefined,
        );
        mod.recordPageView(session, { path: params.page as string, title: params.page as string, scrollDepth: 0, timeOnPage: 0 });
        if (params.event && params.event !== "pageview") {
          mod.recordEvent(session, { type: params.event as string, target: params.page as string });
        }
        return session;
      } catch {
        return { error: "visitor-tracking module not yet available" };
      }
    },
  },
];

function generateEmailSubject(niche: string, brand: string, label: string, index: number): string {
  const subjects = [
    `Welcome to ${brand} - Your ${niche} guide is ready`,
    `Quick ${niche} win you can use today`,
    `How we helped a ${niche} client achieve 3x growth`,
    `The #1 mistake in ${niche} (and how to avoid it)`,
    `Your free ${niche} strategy session with ${brand}`,
    `Last chance: Exclusive ${niche} offer from ${brand}`,
    `Monthly ${niche} insights from ${brand}`,
  ];
  return subjects[index] ?? `${brand}: ${label}`;
}

function generatePreviewText(niche: string, goal: string): string {
  return `${goal} for your ${niche} business`;
}

function generateEmailBody(niche: string, brand: string, label: string, goal: string, index: number): string {
  return [
    `Hi {{firstName}},`,
    ``,
    `${getEmailIntro(index, niche, brand)}`,
    ``,
    `${goal}.`,
    ``,
    `${getEmailCta(index, niche)}`,
    ``,
    `Best,`,
    `The ${brand} Team`,
    ``,
    `---`,
    `Stage: ${label} | Day ${[0, 2, 5, 10, 14, 21, 30][index]}`,
  ].join("\n");
}

function getEmailIntro(index: number, niche: string, brand: string): string {
  const intros = [
    `Thanks for downloading our ${niche} guide. Here's what you need to know to get started.`,
    `We wanted to share a quick tip that our most successful ${niche} clients use.`,
    `Real results speak louder than promises. Here's a recent ${niche} success story.`,
    `After years in the ${niche} space, we've seen one critical mistake come up again and again.`,
    `We'd love to discuss your ${niche} goals in a complimentary strategy session.`,
    `We have a limited-time opportunity for ${niche} businesses like yours.`,
    `Here's your monthly roundup of ${niche} trends and insights from ${brand}.`,
  ];
  return intros[index] ?? `Here's an update from ${brand} about ${niche}.`;
}

function getEmailCta(index: number, niche: string): string {
  const ctas = [
    `[Read the full guide]({{guideUrl}})`,
    `[Try this tip now]({{tipUrl}})`,
    `[Read the case study]({{caseStudyUrl}})`,
    `[Learn more]({{articleUrl}})`,
    `[Book your free session]({{bookingUrl}})`,
    `[Claim your offer]({{offerUrl}})`,
    `[Read full insights]({{insightsUrl}})`,
  ];
  return ctas[index] ?? `[Learn more about ${niche}]({{learnMoreUrl}})`;
}

function getDefaultFeatures(videoType: string): string[] {
  switch (videoType) {
    case "product-demo":
      return ["AI-Powered Lead Scoring", "Smart Routing Engine", "Automated Nurture Sequences", "Real-Time Analytics"];
    case "data-report":
      return ["Conversion Rate Trends", "Lead Quality Metrics", "Channel Performance", "ROI Analysis"];
    case "launch-video":
      return ["Next-Gen Lead OS", "MCP Integration", "Marketplace Launch", "Enterprise Features"];
    default:
      return ["Lead OS Platform", "Intelligent Automation", "Measurable Results"];
  }
}

function getDefaultTitle(videoType: string): string {
  switch (videoType) {
    case "product-demo":
      return "Lead OS - The AI-Powered Lead Generation Platform";
    case "data-report":
      return "Lead OS Performance Report";
    case "launch-video":
      return "Introducing Lead OS";
    default:
      return "Lead OS";
  }
}

interface VideoScene {
  id: string;
  type: string;
  startFrame: number;
  endFrame: number;
  content: Record<string, unknown>;
}

function generateVideoScenes(
  videoType: string,
  title: string,
  features: string[],
  brandColor: string,
  totalFrames: number,
): VideoScene[] {
  const introFrames = Math.floor(totalFrames * 0.15);
  const featureFrames = Math.floor(totalFrames * 0.6);
  const outroFrames = totalFrames - introFrames - featureFrames;
  const framesPerFeature = Math.floor(featureFrames / features.length);

  const scenes: VideoScene[] = [
    {
      id: "intro",
      type: "title-card",
      startFrame: 0,
      endFrame: introFrames,
      content: {
        title,
        subtitle: videoType === "data-report" ? "Performance Analytics" : "See it in action",
        backgroundColor: brandColor,
        textColor: "#ffffff",
        animation: "fade-in-up",
      },
    },
  ];

  features.forEach((feature, i) => {
    const start = introFrames + i * framesPerFeature;
    scenes.push({
      id: `feature_${i}`,
      type: videoType === "data-report" ? "data-card" : "feature-card",
      startFrame: start,
      endFrame: start + framesPerFeature,
      content: {
        heading: feature,
        description: `${feature} - powered by Lead OS`,
        icon: getFeatureIcon(i),
        accentColor: brandColor,
        animation: i % 2 === 0 ? "slide-in-left" : "slide-in-right",
      },
    });
  });

  scenes.push({
    id: "outro",
    type: "cta-card",
    startFrame: totalFrames - outroFrames,
    endFrame: totalFrames,
    content: {
      headline: "Get Started with Lead OS",
      ctaText: "Try it Free",
      url: "https://leadgenos.com",
      backgroundColor: brandColor,
      textColor: "#ffffff",
      animation: "zoom-in",
    },
  });

  return scenes;
}

function getFeatureIcon(index: number): string {
  const icons = ["chart-bar", "route", "mail", "analytics", "rocket", "shield", "zap", "target"];
  return icons[index % icons.length];
}

export function getToolByName(name: string): McpTool | undefined {
  return tools.find((t) => t.name === name);
}
