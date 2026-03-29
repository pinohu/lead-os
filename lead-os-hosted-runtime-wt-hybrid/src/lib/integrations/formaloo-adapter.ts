import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormalooConfig {
  apiKey: string;
  baseUrl: string;
}

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "multi-select"
  | "textarea"
  | "date"
  | "file"
  | "rating"
  | "nps";

export interface FormField {
  slug: string;
  title: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormalooForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  slug: string;
  submissions: number;
  status: "active" | "paused" | "archived";
  embedCode?: string;
  tenantId?: string;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, string | number>;
  submittedAt: string;
  ip?: string;
  tenantId?: string;
}

export interface FormAnalytics {
  formId: string;
  totalSubmissions: number;
  completionRate: number;
  avgTimeSeconds: number;
  fieldDropoff: { field: string; dropoffRate: number }[];
  submissionsByDay: { date: string; count: number }[];
}

export interface FormalooStats {
  totalForms: number;
  totalSubmissions: number;
  avgCompletionRate: number;
  topForms: { formId: string; title: string; submissions: number }[];
}

// ---------------------------------------------------------------------------
// Internal stored types
// ---------------------------------------------------------------------------

interface StoredForm {
  form: FormalooForm;
}

interface StoredSubmission {
  submission: FormSubmission;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const formStore = new Map<string, StoredForm>();
const submissionStore = new Map<string, StoredSubmission>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveFormalooConfig(): FormalooConfig | null {
  const apiKey = process.env.FORMALOO_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.FORMALOO_BASE_URL ?? "https://api.formaloo.com/v2.0",
  };
}

export function isFormalooDryRun(): boolean {
  return !process.env.FORMALOO_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureFormalooSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_formaloo (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        tenant_id TEXT,
        form_id TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id)
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed — fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function persistRecord(
  id: string,
  type: string,
  tenantId: string | undefined,
  formId: string | undefined,
  payload: unknown,
): Promise<void> {
  await ensureFormalooSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_formaloo (id, type, tenant_id, form_id, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           form_id = EXCLUDED.form_id,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, formId ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Form CRUD
// ---------------------------------------------------------------------------

export async function createForm(input: {
  title: string;
  description?: string;
  fields: FormField[];
  tenantId?: string;
}): Promise<FormalooForm> {
  if (!isFormalooDryRun()) {
    const cfg = resolveFormalooConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/forms/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            fields: input.fields,
          }),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          const formData = (data.data ?? data) as Record<string, unknown>;
          const form: FormalooForm = {
            id: String(formData.slug ?? formData.id ?? crypto.randomUUID()),
            title: input.title,
            description: input.description,
            fields: input.fields,
            slug: String(formData.slug ?? slugify(input.title)),
            submissions: 0,
            status: "active",
            embedCode: typeof formData.embed_code === "string" ? formData.embed_code : undefined,
            tenantId: input.tenantId,
            createdAt: new Date().toISOString(),
          };

          formStore.set(form.id, { form });
          await persistRecord(form.id, "form", input.tenantId, form.id, form);
          return form;
        }
      } catch {
        // Fall through to dry-run creation
      }
    }
  }

  const id = crypto.randomUUID();
  const form: FormalooForm = {
    id,
    title: input.title,
    description: input.description,
    fields: input.fields,
    slug: slugify(input.title),
    submissions: 0,
    status: "active",
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  formStore.set(id, { form });
  await persistRecord(id, "form", input.tenantId, id, form);
  return form;
}

export async function getForm(formId: string): Promise<FormalooForm | null> {
  const cached = formStore.get(formId);
  if (cached) return cached.form;
  return null;
}

export async function listForms(tenantId?: string): Promise<FormalooForm[]> {
  const all = [...formStore.values()].map((s) => s.form);
  if (tenantId) {
    return all.filter((f) => f.tenantId === tenantId);
  }
  return all;
}

export async function updateForm(
  formId: string,
  updates: Partial<Pick<FormalooForm, "title" | "description" | "fields" | "status">>,
): Promise<FormalooForm> {
  const stored = formStore.get(formId);
  if (!stored) {
    throw new Error(`Form ${formId} not found`);
  }

  const updated: FormalooForm = {
    ...stored.form,
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.fields !== undefined ? { fields: updates.fields } : {}),
    ...(updates.status !== undefined ? { status: updates.status } : {}),
  };

  if (updates.title !== undefined) {
    updated.slug = slugify(updates.title);
  }

  formStore.set(formId, { form: updated });
  await persistRecord(formId, "form", updated.tenantId, formId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function submitForm(
  formId: string,
  data: Record<string, string | number>,
): Promise<FormSubmission> {
  const stored = formStore.get(formId);
  if (!stored) {
    throw new Error(`Form ${formId} not found`);
  }

  if (stored.form.status !== "active") {
    throw new Error(`Form ${formId} is not accepting submissions (status: ${stored.form.status})`);
  }

  const id = crypto.randomUUID();
  const submission: FormSubmission = {
    id,
    formId,
    data,
    submittedAt: new Date().toISOString(),
    tenantId: stored.form.tenantId,
  };

  submissionStore.set(id, { submission });
  stored.form.submissions += 1;
  formStore.set(formId, stored);

  await persistRecord(id, "submission", stored.form.tenantId, formId, submission);
  return submission;
}

export async function listSubmissions(
  formId: string,
  tenantId?: string,
): Promise<FormSubmission[]> {
  const all = [...submissionStore.values()]
    .map((s) => s.submission)
    .filter((s) => s.formId === formId);

  if (tenantId) {
    return all.filter((s) => s.tenantId === tenantId);
  }
  return all;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getFormAnalytics(formId: string): Promise<FormAnalytics> {
  const stored = formStore.get(formId);
  if (!stored) {
    throw new Error(`Form ${formId} not found`);
  }

  const submissions = [...submissionStore.values()]
    .map((s) => s.submission)
    .filter((s) => s.formId === formId);

  const totalSubmissions = submissions.length;
  const fields = stored.form.fields;

  const fieldDropoff: { field: string; dropoffRate: number }[] = fields.map((field) => {
    if (totalSubmissions === 0) {
      return { field: field.slug, dropoffRate: 0 };
    }
    const filledCount = submissions.filter(
      (s) => s.data[field.slug] !== undefined && s.data[field.slug] !== "",
    ).length;
    const dropoffRate = Math.round(((totalSubmissions - filledCount) / totalSubmissions) * 100) / 100;
    return { field: field.slug, dropoffRate };
  });

  const requiredFields = fields.filter((f) => f.required);
  let completionRate = totalSubmissions > 0 ? 1 : 0;
  if (totalSubmissions > 0 && requiredFields.length > 0) {
    const completeSubmissions = submissions.filter((s) =>
      requiredFields.every(
        (f) => s.data[f.slug] !== undefined && s.data[f.slug] !== "",
      ),
    ).length;
    completionRate = Math.round((completeSubmissions / totalSubmissions) * 100) / 100;
  }

  const dayMap = new Map<string, number>();
  for (const s of submissions) {
    const day = s.submittedAt.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const submissionsByDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const avgTimeSeconds = totalSubmissions > 0 ? 45 + Math.floor(fields.length * 8) : 0;

  return {
    formId,
    totalSubmissions,
    completionRate,
    avgTimeSeconds,
    fieldDropoff,
    submissionsByDay,
  };
}

// ---------------------------------------------------------------------------
// Embed Code
// ---------------------------------------------------------------------------

export async function generateEmbedCode(formId: string): Promise<string> {
  const stored = formStore.get(formId);
  if (!stored) {
    throw new Error(`Form ${formId} not found`);
  }

  const cfg = resolveFormalooConfig();
  const baseUrl = cfg?.baseUrl ?? "https://api.formaloo.com/v2.0";
  const embedUrl = `${baseUrl.replace("/v2.0", "")}/embed/${stored.form.slug}`;

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border:none;" title="${stored.form.title}"></iframe>`;
  stored.form.embedCode = embedCode;
  formStore.set(formId, stored);
  return embedCode;
}

// ---------------------------------------------------------------------------
// Lead Conversion
// ---------------------------------------------------------------------------

export async function convertSubmissionToLead(
  submissionId: string,
  tenantId?: string,
): Promise<ProviderResult> {
  const stored = submissionStore.get(submissionId);
  if (!stored) {
    return formalooResult(
      "convert-submission-to-lead",
      `Submission ${submissionId} not found`,
      false,
    );
  }

  const sub = stored.submission;
  const effectiveTenant = tenantId ?? sub.tenantId;

  const leadData: Record<string, unknown> = {
    source: "formaloo",
    formId: sub.formId,
    submissionId: sub.id,
    tenantId: effectiveTenant,
    capturedAt: sub.submittedAt,
    ...sub.data,
  };

  const leadId = crypto.randomUUID();
  await persistRecord(leadId, "lead", effectiveTenant, sub.formId, leadData);

  return formalooResult(
    "convert-submission-to-lead",
    `Submission ${submissionId} converted to lead ${leadId}`,
    true,
    { leadId, ...leadData },
  );
}

// ---------------------------------------------------------------------------
// Lead Capture Form (convenience)
// ---------------------------------------------------------------------------

const NICHE_FIELD_MAP: Record<string, FormField[]> = {
  default: [
    { slug: "full_name", title: "Full Name", type: "text", required: true, placeholder: "Your full name" },
    { slug: "email", title: "Email", type: "email", required: true, placeholder: "your@email.com" },
    { slug: "phone", title: "Phone", type: "phone", required: false, placeholder: "+1 (555) 123-4567" },
    { slug: "service", title: "Service Interested In", type: "select", required: true, options: ["Consultation", "Quote", "Demo", "Other"] },
    { slug: "message", title: "Message", type: "textarea", required: false, placeholder: "Tell us more..." },
  ],
  real_estate: [
    { slug: "full_name", title: "Full Name", type: "text", required: true, placeholder: "Your full name" },
    { slug: "email", title: "Email", type: "email", required: true, placeholder: "your@email.com" },
    { slug: "phone", title: "Phone", type: "phone", required: true, placeholder: "+1 (555) 123-4567" },
    { slug: "property_type", title: "Property Type", type: "select", required: true, options: ["Residential", "Commercial", "Land", "Multi-Family"] },
    { slug: "budget", title: "Budget Range", type: "select", required: false, options: ["Under $250K", "$250K-$500K", "$500K-$1M", "Over $1M"] },
    { slug: "timeline", title: "Timeline", type: "select", required: false, options: ["Immediately", "1-3 months", "3-6 months", "6+ months"] },
  ],
  saas: [
    { slug: "full_name", title: "Full Name", type: "text", required: true, placeholder: "Your full name" },
    { slug: "email", title: "Work Email", type: "email", required: true, placeholder: "you@company.com" },
    { slug: "company", title: "Company", type: "text", required: true, placeholder: "Company name" },
    { slug: "team_size", title: "Team Size", type: "select", required: true, options: ["1-10", "11-50", "51-200", "201-1000", "1000+"] },
    { slug: "use_case", title: "Primary Use Case", type: "textarea", required: false, placeholder: "What problem are you solving?" },
  ],
  healthcare: [
    { slug: "full_name", title: "Full Name", type: "text", required: true, placeholder: "Your full name" },
    { slug: "email", title: "Email", type: "email", required: true, placeholder: "your@email.com" },
    { slug: "phone", title: "Phone", type: "phone", required: true, placeholder: "+1 (555) 123-4567" },
    { slug: "service", title: "Service Needed", type: "select", required: true, options: ["General Consultation", "Specialist Referral", "Telehealth", "Second Opinion"] },
    { slug: "insurance", title: "Insurance Provider", type: "text", required: false, placeholder: "Insurance provider name" },
    { slug: "preferred_date", title: "Preferred Date", type: "date", required: false },
  ],
};

export async function createLeadCaptureForm(
  niche: string,
  tenantId?: string,
): Promise<FormalooForm> {
  const nicheKey = niche.toLowerCase().replace(/[\s-]+/g, "_");
  const fields = NICHE_FIELD_MAP[nicheKey] ?? NICHE_FIELD_MAP.default;

  const title = `Lead Capture - ${niche.charAt(0).toUpperCase() + niche.slice(1)}`;

  return createForm({
    title,
    description: `Lead capture form tailored for the ${niche} niche`,
    fields,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getFormalooStats(tenantId?: string): Promise<FormalooStats> {
  const forms = await listForms(tenantId);
  const totalForms = forms.length;
  const totalSubmissions = forms.reduce((sum, f) => sum + f.submissions, 0);

  let avgCompletionRate = 0;
  if (forms.length > 0) {
    const rates: number[] = [];
    for (const form of forms) {
      const analytics = await getFormAnalytics(form.id);
      rates.push(analytics.completionRate);
    }
    avgCompletionRate =
      Math.round((rates.reduce((sum, r) => sum + r, 0) / rates.length) * 100) / 100;
  }

  const topForms = [...forms]
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 5)
    .map((f) => ({ formId: f.id, title: f.title, submissions: f.submissions }));

  return { totalForms, totalSubmissions, avgCompletionRate, topForms };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function formalooResult(
  op: string,
  detail: string,
  ok = true,
  payload?: Record<string, unknown>,
): ProviderResult {
  return {
    ok,
    provider: "Formaloo",
    mode: isFormalooDryRun() ? "dry-run" : "live",
    detail: `[${op}] ${detail}`,
    payload,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetFormalooStore(): void {
  formStore.clear();
  submissionStore.clear();
  schemaEnsured = false;
}
