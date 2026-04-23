import { getPool } from "./db.ts";
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

export interface ListOnboardingFilters {
  status?: "active" | "complete";
  email?: string;
  limit?: number;
  offset?: number;
}

const STEP_ORDER: OnboardingStep[] = ["niche", "plan", "branding", "integrations", "review", "complete"];

const onboardingStore = new Map<string, OnboardingState>();

let schemaReady: Promise<void> | null = null;

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

function prevStep(current: OnboardingStep): OnboardingStep | null {
  const idx = STEP_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STEP_ORDER[idx - 1];
}

function rowToState(row: Record<string, unknown>): OnboardingState {
  const payload = row.payload as OnboardingState;
  return {
    ...payload,
    id: row.id as string,
    email: row.email as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

async function ensureOnboardingTable(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_onboarding_sessions (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_onboarding_email ON lead_os_onboarding_sessions (email);
      `);
    } catch (err) {
      schemaReady = null;
      throw err;
    }
  })();

  return schemaReady;
}

async function persistState(state: OnboardingState): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await ensureOnboardingTable();
    await pool.query(
      `INSERT INTO lead_os_onboarding_sessions (id, email, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         payload = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at`,
      [state.id, state.email, JSON.stringify(state), state.createdAt, state.updatedAt],
    );
  } catch {
    // silently fail — memory store is the source of truth
  }
}

async function loadFromDb(id: string): Promise<OnboardingState | undefined> {
  const pool = getPool();
  if (!pool) return undefined;

  try {
    await ensureOnboardingTable();
    const result = await pool.query(
      `SELECT id, email, payload, created_at, updated_at
       FROM lead_os_onboarding_sessions WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return undefined;
    return rowToState(result.rows[0]);
  } catch {
    return undefined;
  }
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

export async function startOnboarding(email: string): Promise<OnboardingState> {
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    throw new Error("email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Return existing active session if one exists (idempotency)
  const existing = await getOnboardingByEmail(normalizedEmail);
  if (existing) return existing;

  const now = new Date().toISOString();
  const state: OnboardingState = {
    id: generateId(),
    email: normalizedEmail,
    currentStep: "niche",
    completedSteps: [],
    createdAt: now,
    updatedAt: now,
  };

  onboardingStore.set(state.id, state);
  await persistState(state);
  return state;
}

export async function getOnboardingState(id: string): Promise<OnboardingState | undefined> {
  // Memory-first, fall back to DB
  const inMemory = onboardingStore.get(id);
  if (inMemory) return inMemory;

  const fromDb = await loadFromDb(id);
  if (fromDb) {
    onboardingStore.set(fromDb.id, fromDb);
    return fromDb;
  }

  return undefined;
}

export async function getOnboardingByEmail(email: string): Promise<OnboardingState | undefined> {
  if (!email || typeof email !== "string") return undefined;
  const normalizedEmail = email.trim().toLowerCase();

  // Check memory first
  for (const state of onboardingStore.values()) {
    if (state.email === normalizedEmail && state.currentStep !== "complete") {
      return state;
    }
  }

  // Fall back to DB
  const pool = getPool();
  if (!pool) return undefined;

  try {
    await ensureOnboardingTable();
    const result = await pool.query(
      `SELECT id, email, payload, created_at, updated_at
       FROM lead_os_onboarding_sessions
       WHERE email = $1
         AND (payload->>'currentStep') != 'complete'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [normalizedEmail],
    );
    if (result.rows.length === 0) return undefined;
    const state = rowToState(result.rows[0]);
    onboardingStore.set(state.id, state);
    return state;
  } catch {
    return undefined;
  }
}

export async function advanceOnboarding(id: string, stepData: Record<string, unknown>): Promise<OnboardingState> {
  const state = await getOnboardingState(id);
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
  await persistState(state);
  return state;
}

export async function goBackOnboarding(id: string): Promise<OnboardingState> {
  const state = await getOnboardingState(id);
  if (!state) {
    throw new Error("Onboarding session not found");
  }

  if (state.currentStep === "complete") {
    throw new Error("Cannot go back from a completed onboarding session");
  }

  const previous = prevStep(state.currentStep);
  if (previous === null) {
    throw new Error("Already at the first step, cannot go back");
  }

  // Remove the last completed step entry matching previous step
  const lastCompletedIdx = state.completedSteps.lastIndexOf(previous);
  if (lastCompletedIdx !== -1) {
    state.completedSteps.splice(lastCompletedIdx, 1);
  }

  state.currentStep = previous;
  state.updatedAt = new Date().toISOString();

  onboardingStore.set(id, state);
  await persistState(state);
  return state;
}

export async function completeOnboarding(id: string): Promise<OnboardingState> {
  const state = await getOnboardingState(id);
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

  const baseUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
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
  await persistState(state);
  return state;
}

export async function listOnboardingSessions(filters?: ListOnboardingFilters): Promise<OnboardingState[]> {
  const pool = getPool();
  const limit = filters?.limit ?? 100;
  const offset = filters?.offset ?? 0;

  if (pool) {
    try {
      await ensureOnboardingTable();

      const conditions: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (filters?.status === "complete") {
        conditions.push(`payload->>'currentStep' = 'complete'`);
      } else if (filters?.status === "active") {
        conditions.push(`payload->>'currentStep' != 'complete'`);
      }

      if (filters?.email) {
        conditions.push(`email = $${paramIdx++}`);
        values.push(filters.email.trim().toLowerCase());
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      values.push(limit, offset);

      const result = await pool.query(
        `SELECT id, email, payload, created_at, updated_at
         FROM lead_os_onboarding_sessions
         ${where}
         ORDER BY updated_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        values,
      );

      const sessions = result.rows.map(rowToState);
      for (const s of sessions) {
        onboardingStore.set(s.id, s);
      }
      return sessions;
    } catch {
      // fall through to memory
    }
  }

  // Memory fallback
  let sessions = Array.from(onboardingStore.values());

  if (filters?.status === "complete") {
    sessions = sessions.filter((s) => s.currentStep === "complete");
  } else if (filters?.status === "active") {
    sessions = sessions.filter((s) => s.currentStep !== "complete");
  }

  if (filters?.email) {
    const normalizedEmail = filters.email.trim().toLowerCase();
    sessions = sessions.filter((s) => s.email === normalizedEmail);
  }

  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sessions.slice(offset, offset + limit);
}

export function resetOnboardingStore(): void {
  onboardingStore.clear();
  schemaReady = null;
}
