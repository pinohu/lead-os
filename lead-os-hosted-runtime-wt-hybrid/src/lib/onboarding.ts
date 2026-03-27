import { getPlanById } from "./plan-catalog.ts";
import { createTenant, type CreateTenantInput } from "./tenant-store.ts";

export type OnboardingStep = "niche" | "plan" | "branding" | "integrations" | "review" | "complete";

export interface OnboardingState {
  id: string;
  email: string;
  tenantId?: string;
  currentStep: OnboardingStep;
  nicheInput?: { name: string; industry?: string; keywords?: string[] };
  nicheSlug?: string;
  selectedPlan?: string;
  branding?: {
    name: string;
    accent: string;
    logoUrl?: string;
    siteUrl?: string;
    supportEmail?: string;
  };
  enabledProviders?: string[];
  revenueModel?: "managed" | "white-label" | "implementation" | "directory";
  completedSteps: OnboardingStep[];
  provisioningResult?: { tenantId: string; embedScript: string; dashboardUrl: string };
  createdAt: string;
  updatedAt: string;
}

const STEP_ORDER: OnboardingStep[] = ["niche", "plan", "branding", "integrations", "review", "complete"];

const onboardingStore = new Map<string, OnboardingState>();

function generateId(): string {
  return `onb_${crypto.randomUUID()}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_ORDER.indexOf(current);
  if (idx === -1 || idx >= STEP_ORDER.length - 1) return "complete";
  return STEP_ORDER[idx + 1];
}

export async function startOnboarding(email: string): Promise<OnboardingState> {
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    throw new Error("email is required");
  }

  const now = new Date().toISOString();
  const state: OnboardingState = {
    id: generateId(),
    email: email.trim().toLowerCase(),
    currentStep: "niche",
    completedSteps: [],
    createdAt: now,
    updatedAt: now,
  };

  onboardingStore.set(state.id, state);
  return state;
}

export async function getOnboardingState(id: string): Promise<OnboardingState | undefined> {
  return onboardingStore.get(id);
}

function validateNicheStep(data: Record<string, unknown>): { name: string; industry?: string; keywords?: string[] } {
  const name = data.name;
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    throw new Error("Niche name is required (2-100 characters)");
  }

  const industry = typeof data.industry === "string" ? data.industry : undefined;
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter((k): k is string => typeof k === "string")
    : undefined;

  return { name: name.trim(), industry, keywords };
}

function validatePlanStep(data: Record<string, unknown>): string {
  const planId = data.planId;
  if (!planId || typeof planId !== "string") {
    throw new Error("planId is required");
  }

  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  return planId;
}

function validateBrandingStep(data: Record<string, unknown>): OnboardingState["branding"] {
  const name = data.name;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Brand name is required");
  }

  return {
    name: (name as string).trim(),
    accent: typeof data.accent === "string" && data.accent.trim().length > 0 ? data.accent.trim() : "#14b8a6",
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl.trim() : undefined,
    siteUrl: typeof data.siteUrl === "string" ? data.siteUrl.trim() : undefined,
    supportEmail: typeof data.supportEmail === "string" ? data.supportEmail.trim() : undefined,
  };
}

function validateIntegrationsStep(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.enabledProviders)) {
    const providers = data.enabledProviders.filter((p): p is string => typeof p === "string");
    return providers.length > 0 ? providers : ["email"];
  }
  return ["email"];
}

export async function advanceOnboarding(id: string, stepData: Record<string, unknown>): Promise<OnboardingState> {
  const state = onboardingStore.get(id);
  if (!state) {
    throw new Error("Onboarding session not found");
  }

  if (state.currentStep === "complete") {
    throw new Error("Onboarding is already complete");
  }

  const now = new Date().toISOString();

  switch (state.currentStep) {
    case "niche": {
      const nicheInput = validateNicheStep(stepData);
      state.nicheInput = nicheInput;
      state.nicheSlug = slugify(nicheInput.name);
      break;
    }
    case "plan": {
      const planId = validatePlanStep(stepData);
      state.selectedPlan = planId;
      const plan = getPlanById(planId);
      if (plan) {
        state.revenueModel = plan.revenueModel;
      }
      break;
    }
    case "branding": {
      state.branding = validateBrandingStep(stepData);
      break;
    }
    case "integrations": {
      state.enabledProviders = validateIntegrationsStep(stepData);
      break;
    }
    case "review": {
      break;
    }
  }

  state.completedSteps.push(state.currentStep);
  state.currentStep = nextStep(state.currentStep);
  state.updatedAt = now;

  onboardingStore.set(id, state);
  return state;
}

export async function completeOnboarding(id: string): Promise<OnboardingState> {
  const state = onboardingStore.get(id);
  if (!state) {
    throw new Error("Onboarding session not found");
  }

  const requiredSteps: OnboardingStep[] = ["niche", "plan", "branding", "integrations", "review"];
  for (const step of requiredSteps) {
    if (!state.completedSteps.includes(step)) {
      throw new Error(`Step "${step}" must be completed before finishing onboarding`);
    }
  }

  const brandName = state.branding?.name ?? state.nicheInput?.name ?? "My Business";
  const slug = slugify(brandName);

  const channelMap: Record<string, boolean> = {
    email: false,
    whatsapp: false,
    sms: false,
    chat: false,
    voice: false,
  };
  for (const provider of state.enabledProviders ?? ["email"]) {
    const key = provider.toLowerCase().replace(/\s+/g, "");
    if (key in channelMap) {
      channelMap[key] = true;
    }
  }

  const planId = state.selectedPlan ?? "whitelabel-starter";
  const plan = getPlanById(planId);
  const planTier = plan
    ? (plan.id.includes("enterprise") ? "enterprise" : plan.id.includes("growth") ? "growth" : "starter")
    : "starter";

  const tenantInput: CreateTenantInput = {
    slug,
    brandName,
    siteUrl: state.branding?.siteUrl ?? "",
    supportEmail: state.branding?.supportEmail ?? state.email,
    defaultService: "lead-capture",
    defaultNiche: state.nicheInput?.name ?? "general",
    widgetOrigins: state.branding?.siteUrl ? [state.branding.siteUrl] : [],
    accent: state.branding?.accent ?? "#14b8a6",
    enabledFunnels: ["lead-magnet", "qualification", "chat"],
    channels: {
      email: channelMap.email ?? true,
      whatsapp: channelMap.whatsapp ?? false,
      sms: channelMap.sms ?? false,
      chat: channelMap.chat ?? false,
      voice: channelMap.voice ?? false,
    },
    revenueModel: state.revenueModel ?? "white-label",
    plan: planTier as "starter" | "growth" | "enterprise" | "custom",
    status: "provisioning",
    operatorEmails: [state.email],
    providerConfig: {},
    metadata: {
      onboardingId: state.id,
      nicheSlug: state.nicheSlug,
      industry: state.nicheInput?.industry,
    },
  };

  const tenant = await createTenant(tenantInput);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.leadgenmachine.com";
  const embedScript = `<script src="${baseUrl}/embed.js" data-tenant="${tenant.tenantId}" data-accent="${tenant.accent}" async></script>`;
  const dashboardUrl = `${baseUrl}/dashboard?tenantId=${tenant.tenantId}`;

  state.tenantId = tenant.tenantId;
  state.provisioningResult = {
    tenantId: tenant.tenantId,
    embedScript,
    dashboardUrl,
  };
  state.currentStep = "complete";
  if (!state.completedSteps.includes("complete")) {
    state.completedSteps.push("complete");
  }
  state.updatedAt = new Date().toISOString();

  onboardingStore.set(id, state);
  return state;
}

export function resetOnboardingStore(): void {
  onboardingStore.clear();
}
