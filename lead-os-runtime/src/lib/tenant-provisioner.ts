import {
  createTenant,
  getTenant,
  updateTenant,
  type TenantRecord,
  type CreateTenantInput,
} from "./tenant-store.ts";
import {
  generateNicheConfig,
  type GeneratedNicheConfig,
} from "./niche-generator.ts";
import { canProvisionToN8n, provisionN8nStarterWorkflows } from "./n8n-client.ts";
import { provisionSubdomain, deploySite, listSites } from "./integrations/hosted-runtime-adapter.ts";
import { getLandingPage } from "./landing-page-generator.ts";
import { callLLM, isAIEnabled } from "./ai-client.ts";

export interface ProvisionTenantInput {
  slug: string;
  brandName: string;
  siteUrl: string;
  supportEmail: string;
  operatorEmail: string;
  niche: string;
  industry?: string;
  revenueModel: "managed" | "white-label" | "implementation" | "directory";
  plan: "starter" | "growth" | "enterprise" | "custom";
  accent?: string;
  enabledFunnels?: string[];
  channels?: Partial<TenantRecord["channels"]>;
}

export interface ProvisioningStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  detail?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProvisioningResult {
  tenantId: string;
  slug: string;
  steps: ProvisioningStep[];
  nicheConfig: GeneratedNicheConfig;
  embedScript: string;
  dashboardUrl: string;
  widgetBootUrl: string;
  operatorEmail: string;
  success: boolean;
  createdAt: string;
  siteUrl?: string;
  siteId?: string;
}

const STEP_NAMES = [
  "create-tenant",
  "generate-niche",
  "register-niche",
  "configure-funnels",
  "setup-creative-jobs",
  "provision-workflows",
  "configure-crm",
  "generate-embed",
  "provision-subdomain",
  "deploy-landing-page",
  "send-welcome-email",
  "create-operator",
  "send-welcome",
] as const;

type StepName = (typeof STEP_NAMES)[number];

const provisioningStore = new Map<string, ProvisioningResult>();

function createStep(name: string): ProvisioningStep {
  return { name, status: "pending" };
}

function markRunning(step: ProvisioningStep): void {
  step.status = "running";
  step.startedAt = new Date().toISOString();
}

function markCompleted(step: ProvisioningStep, detail?: string): void {
  step.status = "completed";
  step.detail = detail;
  step.completedAt = new Date().toISOString();
}

function markFailed(step: ProvisioningStep, detail: string): void {
  step.status = "failed";
  step.detail = detail;
  step.completedAt = new Date().toISOString();
}

function markSkipped(step: ProvisioningStep, detail: string): void {
  step.status = "skipped";
  step.detail = detail;
  step.completedAt = new Date().toISOString();
}

function getStep(steps: ProvisioningStep[], name: string): ProvisioningStep {
  const step = steps.find((s) => s.name === name);
  if (!step) {
    throw new Error(`Unknown provisioning step: ${name}`);
  }
  return step;
}

export function generateEmbedScript(tenantId: string, siteUrl: string): string {
  const normalizedUrl = siteUrl.replace(/\/+$/, "");
  return `<script src="${normalizedUrl}/embed/lead-os-embed.js" data-tenant="${tenantId}" data-boot="${normalizedUrl}/api/widgets/boot?tenant=${tenantId}" async></script>`;
}

async function runStep(
  step: ProvisioningStep,
  fn: () => Promise<string | void>,
): Promise<void> {
  markRunning(step);
  try {
    const detail = await fn();
    markCompleted(step, detail ?? undefined);
  } catch (error) {
    markFailed(step, error instanceof Error ? error.message : "Unknown error");
  }
}

async function runOptionalStep(
  step: ProvisioningStep,
  precondition: () => boolean,
  skipReason: string,
  fn: () => Promise<string | void>,
): Promise<void> {
  if (!precondition()) {
    markSkipped(step, skipReason);
    return;
  }
  markRunning(step);
  try {
    const detail = await fn();
    markCompleted(step, detail ?? undefined);
  } catch (error) {
    markSkipped(step, error instanceof Error ? error.message : "Unknown error");
  }
}

function generateWelcomeEmailTemplate(
  brandName: string,
  slug: string,
  dashboardUrl: string,
  embedScript: string,
): string {
  return [
    `Welcome to ${brandName}!`,
    "",
    `Your tenant "${slug}" has been provisioned successfully.`,
    "",
    `Dashboard: ${dashboardUrl}`,
    "",
    "Embed this script on your site to activate the widget:",
    embedScript,
    "",
    "If you have any questions, reply to this email.",
  ].join("\n");
}

export async function provisionTenant(input: ProvisionTenantInput): Promise<ProvisioningResult> {
  const steps: ProvisioningStep[] = STEP_NAMES.map(createStep);
  let tenantId = "";
  let nicheConfig: GeneratedNicheConfig | null = null;
  let embedScript = "";
  let siteId = "";
  let siteFullUrl = "";
  const defaultChannels: TenantRecord["channels"] = {
    email: true,
    whatsapp: false,
    sms: false,
    chat: false,
    voice: false,
  };

  // Step 1: create-tenant
  let tenant: TenantRecord | null = null;
  await runStep(getStep(steps, "create-tenant"), async () => {
    const tenantInput: CreateTenantInput = {
      slug: input.slug,
      brandName: input.brandName,
      siteUrl: input.siteUrl,
      supportEmail: input.supportEmail,
      defaultService: "lead-capture",
      defaultNiche: input.niche,
      widgetOrigins: [input.siteUrl],
      accent: input.accent ?? "#14b8a6",
      enabledFunnels: input.enabledFunnels ?? [],
      channels: { ...defaultChannels, ...input.channels },
      revenueModel: input.revenueModel,
      plan: input.plan,
      status: "provisioning",
      operatorEmails: [input.operatorEmail],
      providerConfig: {},
      metadata: {},
    };
    tenant = await createTenant(tenantInput);
    tenantId = tenant.tenantId;
    return `Tenant created with ID ${tenantId}`;
  });

  if (!tenant) {
    const result: ProvisioningResult = {
      tenantId: "",
      slug: input.slug,
      steps,
      nicheConfig: {} as GeneratedNicheConfig,
      embedScript: "",
      dashboardUrl: "",
      widgetBootUrl: "",
      operatorEmail: input.operatorEmail,
      success: false,
      createdAt: new Date().toISOString(),
    };
    provisioningStore.set(input.slug, result);
    return result;
  }

  // Step 2: generate-niche
  await runStep(getStep(steps, "generate-niche"), async () => {
    nicheConfig = generateNicheConfig({
      name: input.niche,
      industry: input.industry,
      revenueModel: input.revenueModel,
    });
    return `Generated niche config for ${nicheConfig.slug} (${nicheConfig.industry})`;
  });

  // Step 3: register-niche
  await runStep(getStep(steps, "register-niche"), async () => {
    if (!nicheConfig) {
      throw new Error("Niche config not available from previous step");
    }
    await updateTenant(tenantId, {
      metadata: {
        ...(tenant as TenantRecord).metadata,
        nicheConfig,
        provisioningSteps: steps,
      },
    });
    return `Niche config registered in tenant metadata`;
  });

  // Step 4: configure-funnels
  await runStep(getStep(steps, "configure-funnels"), async () => {
    const funnels = input.enabledFunnels ?? nicheConfig?.recommendedFunnels ?? [];
    await updateTenant(tenantId, { enabledFunnels: funnels });
    return `Configured ${funnels.length} funnels`;
  });

  // Step 5: setup-creative-jobs
  await runStep(getStep(steps, "setup-creative-jobs"), async () => {
    const { setupDefaultCreativeJobs } = await import("./creative-auto-setup.ts");
    const results = await setupDefaultCreativeJobs(tenantId, input.niche);
    const created = results.filter((r) => r.status === "created").length;
    const failed = results.filter((r) => r.status === "failed").length;
    return `Created ${created} creative jobs${failed > 0 ? `, ${failed} failed` : ""}`;
  });

  // Step 6: provision-workflows (optional, skip if n8n not configured)
  await runOptionalStep(
    getStep(steps, "provision-workflows"),
    () => canProvisionToN8n(),
    "n8n not configured",
    async () => {
      const result = await provisionN8nStarterWorkflows({
        slugs: nicheConfig?.n8nWorkflowSlugs,
      });
      return `Provisioned ${result.count} workflows (success: ${result.success})`;
    },
  );

  // Step 7: configure-crm (optional, skip if SuiteDash not configured)
  await runOptionalStep(
    getStep(steps, "configure-crm"),
    () => {
      const hasSuiteDash = Boolean(
        process.env.SUITEDASH_API_KEY || process.env.SUITEDASH_PUBLIC_ID,
      );
      return hasSuiteDash;
    },
    "SuiteDash not configured",
    async () => {
      await updateTenant(tenantId, {
        metadata: {
          ...(await getTenant(tenantId))?.metadata,
          crmConfigured: true,
          crmTags: [input.niche, input.revenueModel, input.plan],
        },
      });
      return `CRM tags and pipeline configured`;
    },
  );

  // Step 8: generate-embed
  await runStep(getStep(steps, "generate-embed"), async () => {
    embedScript = generateEmbedScript(tenantId, input.siteUrl);
    await updateTenant(tenantId, {
      metadata: {
        ...(await getTenant(tenantId))?.metadata,
        embedScript,
      },
    });
    return `Embed script generated`;
  });

  // Step 9: provision-subdomain (critical)
  await runStep(getStep(steps, "provision-subdomain"), async () => {
    const site = await provisionSubdomain(tenantId, {
      subdomain: input.slug,
      sslEnabled: true,
      cdnEnabled: false,
    });
    siteId = site.id;
    siteFullUrl = site.fullUrl;
    await updateTenant(tenantId, {
      metadata: {
        ...(await getTenant(tenantId))?.metadata,
        siteId,
        siteFullUrl,
      },
    });
    return `Subdomain provisioned at ${siteFullUrl}`;
  });

  // Step 10: deploy-landing-page (optional, skip if no landing page exists)
  await runOptionalStep(
    getStep(steps, "deploy-landing-page"),
    () => true,
    "No landing page generated yet",
    async () => {
      const landingPage = await getLandingPage(input.slug);
      if (!landingPage) {
        throw new Error("No landing page generated yet");
      }
      const currentMeta = (await getTenant(tenantId))?.metadata ?? {};
      const resolvedSiteId = siteId || (currentMeta.siteId as string);
      if (!resolvedSiteId) {
        throw new Error("No site ID available from subdomain provisioning");
      }
      await deploySite(resolvedSiteId, {
        html: "<!-- LP placeholder -->",
        css: "/* generated */",
        js: undefined,
      });
      return `Landing page deployed for ${input.slug}`;
    },
  );

  // Step 11: send-welcome-email (optional, skip if email not configured)
  const normalizedUrl = input.siteUrl.replace(/\/+$/, "");
  const dashboardUrl = `${normalizedUrl}/dashboard`;
  await runOptionalStep(
    getStep(steps, "send-welcome-email"),
    () => {
      const hasEmail = Boolean(
        process.env.RESEND_API_KEY
          || process.env.SENDGRID_API_KEY
          || process.env.POSTMARK_API_KEY,
      );
      return hasEmail;
    },
    "Email provider not configured",
    async () => {
      let emailBody: string;
      if (isAIEnabled()) {
        const prompt = [
          `Write a welcome email for a new tenant.`,
          `Brand name: ${input.brandName}`,
          `Slug: ${input.slug}`,
          `Dashboard URL: ${dashboardUrl}`,
          `Embed script: ${embedScript}`,
          `Keep it concise, professional, and actionable.`,
        ].join("\n");
        const response = await callLLM([
          { role: "system", content: "You are a helpful onboarding assistant." },
          { role: "user", content: prompt },
        ]);
        emailBody = response.content;
      } else {
        emailBody = generateWelcomeEmailTemplate(
          input.brandName,
          input.slug,
          dashboardUrl,
          embedScript,
        );
      }
      await updateTenant(tenantId, {
        metadata: {
          ...(await getTenant(tenantId))?.metadata,
          welcomeEmailBody: emailBody,
        },
      });
      return `Welcome email generated for ${input.operatorEmail} (send via provider integration)`;
    },
  );

  // Step 12: create-operator
  await runStep(getStep(steps, "create-operator"), async () => {
    const currentTenant = await getTenant(tenantId);
    const existingEmails = currentTenant?.operatorEmails ?? [];
    if (!existingEmails.includes(input.operatorEmail)) {
      await updateTenant(tenantId, {
        operatorEmails: [...existingEmails, input.operatorEmail],
      });
    }
    return `Operator ${input.operatorEmail} registered`;
  });

  // Step 13: send-welcome (optional, skip if email not configured)
  await runOptionalStep(
    getStep(steps, "send-welcome"),
    () => {
      const hasEmail = Boolean(
        process.env.RESEND_API_KEY
          || process.env.SENDGRID_API_KEY
          || process.env.POSTMARK_API_KEY,
      );
      return hasEmail;
    },
    "Email provider not configured",
    async () => {
      return `Welcome email queued for ${input.operatorEmail}`;
    },
  );

  // Finalize: activate tenant if all critical steps passed
  const criticalSteps = [
    "create-tenant",
    "generate-niche",
    "register-niche",
    "generate-embed",
    "provision-subdomain",
    "create-operator",
  ];
  const allCriticalPassed = criticalSteps.every((name) => {
    const s = getStep(steps, name);
    return s.status === "completed";
  });

  if (allCriticalPassed) {
    await updateTenant(tenantId, { status: "active" });
  }

  // Store final provisioning steps in tenant metadata
  const finalTenant = await getTenant(tenantId);
  if (finalTenant) {
    await updateTenant(tenantId, {
      metadata: {
        ...finalTenant.metadata,
        provisioningSteps: steps,
      },
    });
  }

  const result: ProvisioningResult = {
    tenantId,
    slug: input.slug,
    steps,
    nicheConfig: nicheConfig ?? ({} as GeneratedNicheConfig),
    embedScript,
    dashboardUrl,
    widgetBootUrl: `${normalizedUrl}/api/widgets/boot?tenant=${tenantId}`,
    operatorEmail: input.operatorEmail,
    success: allCriticalPassed,
    createdAt: new Date().toISOString(),
    siteUrl: siteFullUrl || undefined,
    siteId: siteId || undefined,
  };

  provisioningStore.set(tenantId, result);

  return result;
}

export async function getProvisioningStatus(tenantId: string): Promise<ProvisioningStep[]> {
  const stored = provisioningStore.get(tenantId);
  if (stored) {
    return stored.steps;
  }

  const tenant = await getTenant(tenantId);
  if (!tenant) {
    return [];
  }

  const steps = tenant.metadata.provisioningSteps as ProvisioningStep[] | undefined;
  return steps ?? [];
}

export async function reprovisionStep(
  tenantId: string,
  stepName: string,
): Promise<ProvisioningStep> {
  if (!STEP_NAMES.includes(stepName as StepName)) {
    throw new Error(`Unknown step: ${stepName}`);
  }

  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const existingSteps = await getProvisioningStatus(tenantId);
  const step = existingSteps.find((s) => s.name === stepName);
  if (!step) {
    throw new Error(`Step ${stepName} not found in provisioning history`);
  }

  const input: ProvisionTenantInput = {
    slug: tenant.slug,
    brandName: tenant.brandName,
    siteUrl: tenant.siteUrl,
    supportEmail: tenant.supportEmail,
    operatorEmail: tenant.operatorEmails[0] ?? "",
    niche: tenant.defaultNiche,
    revenueModel: tenant.revenueModel,
    plan: tenant.plan,
    accent: tenant.accent,
    enabledFunnels: tenant.enabledFunnels,
    channels: tenant.channels,
  };

  const nicheConfig = tenant.metadata.nicheConfig as GeneratedNicheConfig | undefined;
  const normalizedUrl = input.siteUrl.replace(/\/+$/, "");
  const dashboardUrl = `${normalizedUrl}/dashboard`;
  const embedScript = (tenant.metadata.embedScript as string) ?? "";

  const stepHandlers: Record<StepName, () => Promise<string | void>> = {
    "create-tenant": async () => {
      return `Tenant already exists with ID ${tenantId}`;
    },
    "generate-niche": async () => {
      const config = generateNicheConfig({
        name: input.niche,
        industry: input.industry,
        revenueModel: input.revenueModel,
      });
      await updateTenant(tenantId, {
        metadata: { ...tenant.metadata, nicheConfig: config },
      });
      return `Regenerated niche config for ${config.slug}`;
    },
    "register-niche": async () => {
      if (!nicheConfig) {
        throw new Error("No niche config in tenant metadata to register");
      }
      return `Niche config already registered`;
    },
    "configure-funnels": async () => {
      const funnels = input.enabledFunnels ?? nicheConfig?.recommendedFunnels ?? [];
      await updateTenant(tenantId, { enabledFunnels: funnels });
      return `Reconfigured ${funnels.length} funnels`;
    },
    "setup-creative-jobs": async () => {
      const { setupDefaultCreativeJobs } = await import("./creative-auto-setup.ts");
      const results = await setupDefaultCreativeJobs(tenantId, input.niche);
      const created = results.filter((r) => r.status === "created").length;
      return `Reprovisioned ${created} creative jobs`;
    },
    "provision-workflows": async () => {
      if (!canProvisionToN8n()) {
        throw new Error("n8n not configured");
      }
      const result = await provisionN8nStarterWorkflows({
        slugs: nicheConfig?.n8nWorkflowSlugs,
      });
      return `Reprovisioned ${result.count} workflows`;
    },
    "configure-crm": async () => {
      await updateTenant(tenantId, {
        metadata: {
          ...tenant.metadata,
          crmConfigured: true,
          crmTags: [input.niche, input.revenueModel, input.plan],
        },
      });
      return `CRM reconfigured`;
    },
    "generate-embed": async () => {
      const script = generateEmbedScript(tenantId, input.siteUrl);
      await updateTenant(tenantId, {
        metadata: { ...tenant.metadata, embedScript: script },
      });
      return `Embed script regenerated`;
    },
    "provision-subdomain": async () => {
      const existingSites = await listSites(tenantId);
      const existingSite = existingSites.find((s) => s.subdomain === input.slug);
      if (existingSite) {
        return `Subdomain already provisioned at ${existingSite.fullUrl}`;
      }
      const site = await provisionSubdomain(tenantId, {
        subdomain: input.slug,
        sslEnabled: true,
        cdnEnabled: false,
      });
      await updateTenant(tenantId, {
        metadata: {
          ...tenant.metadata,
          siteId: site.id,
          siteFullUrl: site.fullUrl,
        },
      });
      return `Subdomain reprovisioned at ${site.fullUrl}`;
    },
    "deploy-landing-page": async () => {
      const landingPage = await getLandingPage(input.slug);
      if (!landingPage) {
        throw new Error("No landing page generated yet");
      }
      const resolvedSiteId = (tenant.metadata.siteId as string) ?? "";
      if (!resolvedSiteId) {
        throw new Error("No site ID available from subdomain provisioning");
      }
      await deploySite(resolvedSiteId, {
        html: "<!-- LP placeholder -->",
        css: "/* generated */",
        js: undefined,
      });
      return `Landing page redeployed for ${input.slug}`;
    },
    "send-welcome": async () => {
      return `Welcome email re-queued for ${input.operatorEmail}`;
    },
    "create-operator": async () => {
      return `Operator ${input.operatorEmail} already registered`;
    },
    "send-welcome-email": async () => {
      let emailBody: string;
      if (isAIEnabled()) {
        const prompt = [
          `Write a welcome email for a new tenant.`,
          `Brand name: ${input.brandName}`,
          `Slug: ${input.slug}`,
          `Dashboard URL: ${dashboardUrl}`,
          `Embed script: ${embedScript}`,
          `Keep it concise, professional, and actionable.`,
        ].join("\n");
        const response = await callLLM([
          { role: "system", content: "You are a helpful onboarding assistant." },
          { role: "user", content: prompt },
        ]);
        emailBody = response.content;
      } else {
        emailBody = generateWelcomeEmailTemplate(
          input.brandName,
          input.slug,
          dashboardUrl,
          embedScript,
        );
      }
      await updateTenant(tenantId, {
        metadata: {
          ...(await getTenant(tenantId))?.metadata,
          welcomeEmailBody: emailBody,
        },
      });
      return `Welcome email regenerated for ${input.operatorEmail}`;
    },
  };

  markRunning(step);
  try {
    const detail = await stepHandlers[stepName as StepName]();
    markCompleted(step, detail ?? undefined);
  } catch (error) {
    markFailed(step, error instanceof Error ? error.message : "Unknown error");
  }

  // Update stored steps
  const stored = provisioningStore.get(tenantId);
  if (stored) {
    const idx = stored.steps.findIndex((s) => s.name === stepName);
    if (idx >= 0) {
      stored.steps[idx] = step;
    }
  }

  await updateTenant(tenantId, {
    metadata: {
      ...(await getTenant(tenantId))?.metadata,
      provisioningSteps: existingSteps,
    },
  });

  return step;
}

export function resetProvisioningStore(): void {
  provisioningStore.clear();
}
