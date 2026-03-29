import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Autobound AI Types
// ---------------------------------------------------------------------------

export interface AutoboundConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ProspectInput {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  website?: string;
}

export interface PersonalizedEmail {
  id: string;
  prospectEmail: string;
  subject: string;
  body: string;
  personalizationSignals: string[];
  tone: "professional" | "casual" | "urgent";
  confidence: number;
  variant: number;
  createdAt: string;
}

export interface GenerateEmailInput {
  prospect: ProspectInput;
  senderName: string;
  senderCompany: string;
  valueProposition: string;
  tone?: "professional" | "casual" | "urgent";
  numberOfVariants?: number;
  tenantId?: string;
}

export interface EmailSequence {
  id: string;
  prospectEmail: string;
  emails: PersonalizedEmail[];
  status: "draft" | "active" | "completed" | "paused";
  currentStep: number;
  tenantId?: string;
  createdAt: string;
}

export interface GenerateSequenceInput {
  prospect: ProspectInput;
  senderName: string;
  senderCompany: string;
  valueProposition: string;
  steps: number;
  delayDays: number[];
  tenantId?: string;
}

export interface AutoboundStats {
  totalGenerated: number;
  totalSequences: number;
  avgConfidence: number;
  topSignals: { signal: string; count: number }[];
  byTone: Record<string, number>;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const emailStore = new Map<string, PersonalizedEmail>();
const sequenceStore = new Map<string, EmailSequence>();
const ratingStore = new Map<string, "good" | "bad">();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveAutoboundConfig(): AutoboundConfig | null {
  const apiKey = process.env.AUTOBOUND_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.AUTOBOUND_BASE_URL ?? "https://api.autobound.ai/api/v1",
  };
}

export function isAutoboundDryRun(): boolean {
  return !process.env.AUTOBOUND_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureAutoboundSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_autobound (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        tenant_id TEXT,
        prospect_email TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id)
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed -- fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${rand}`;
}

// ---------------------------------------------------------------------------
// Personalization signal extraction
// ---------------------------------------------------------------------------

function extractSignals(prospect: ProspectInput): string[] {
  const signals: string[] = [];

  if (prospect.company) {
    signals.push(`Works at ${prospect.company}`);
  }
  if (prospect.title) {
    signals.push(`Role: ${prospect.title}`);
  }
  if (prospect.linkedinUrl) {
    signals.push("LinkedIn profile available");
  }
  if (prospect.website) {
    signals.push(`Company website: ${prospect.website}`);
  }
  if (prospect.firstName && prospect.lastName) {
    signals.push(`Full name identified: ${prospect.firstName} ${prospect.lastName}`);
  }

  const domain = prospect.email.split("@")[1];
  if (domain && !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(domain)) {
    signals.push(`Corporate email domain: ${domain}`);
  }

  if (signals.length < 2) {
    signals.push("Email contact verified");
  }
  if (signals.length < 2) {
    signals.push("Prospect identified for outreach");
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Dry-run email generation
// ---------------------------------------------------------------------------

const SUBJECT_ANGLES: Record<number, string[]> = {
  0: [
    "Quick question about {{company}}",
    "Idea for {{company}}'s growth",
    "{{firstName}}, a thought on {{company}}",
  ],
  1: [
    "Helping {{title}}s like you",
    "{{company}} + {{senderCompany}} synergy",
    "A resource for {{company}}",
  ],
  2: [
    "One thing {{company}} might be missing",
    "{{firstName}}, saw something interesting",
    "For {{title}}s scaling their teams",
  ],
};

const BODY_TEMPLATES: Record<number, string> = {
  0: `Hi {{firstName}},

I noticed that {{company}} is doing impressive work in your space. As a {{title}}, you're likely thinking about how to {{valueProposition}}.

At {{senderCompany}}, we've helped similar companies achieve exactly that. I'd love to share a few ideas that could be relevant for {{company}}.

Would you be open to a quick 15-minute call this week?

Best,
{{senderName}}`,

  1: `{{firstName}},

I've been following {{company}}'s trajectory and wanted to reach out. Many {{title}}s I speak with are looking for ways to {{valueProposition}}.

We recently helped a company similar to {{company}} see significant results. I put together a brief overview that might be useful for your team.

Worth a conversation?

{{senderName}}
{{senderCompany}}`,

  2: `Hi {{firstName}},

As someone leading efforts at {{company}}, I imagine {{valueProposition}} is high on your priority list.

I work with {{senderCompany}} and we specialize in exactly this. I have a few data points from companies like yours that I think you'd find valuable.

Can I send them over?

Cheers,
{{senderName}}`,
};

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function buildTemplateVars(
  prospect: ProspectInput,
  senderName: string,
  senderCompany: string,
  valueProposition: string,
): Record<string, string> {
  return {
    firstName: prospect.firstName ?? "there",
    lastName: prospect.lastName ?? "",
    company: prospect.company ?? "your company",
    title: prospect.title ?? "professional",
    senderName,
    senderCompany,
    valueProposition,
  };
}

function generateDryRunEmail(
  prospect: ProspectInput,
  senderName: string,
  senderCompany: string,
  valueProposition: string,
  tone: "professional" | "casual" | "urgent",
  variant: number,
): PersonalizedEmail {
  const vars = buildTemplateVars(prospect, senderName, senderCompany, valueProposition);
  const subjectPool = SUBJECT_ANGLES[variant % 3] ?? SUBJECT_ANGLES[0];
  const subjectTemplate = subjectPool[variant % subjectPool.length];
  const bodyTemplate = BODY_TEMPLATES[variant % 3] ?? BODY_TEMPLATES[0];

  const subject = fillTemplate(subjectTemplate, vars);
  const body = fillTemplate(bodyTemplate, vars);
  const signals = extractSignals(prospect);
  const confidence = Math.min(0.95, 0.7 + signals.length * 0.05);

  return {
    id: generateId("abemail"),
    prospectEmail: prospect.email,
    subject,
    body,
    personalizationSignals: signals,
    tone,
    confidence,
    variant,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Sequence step themes
// ---------------------------------------------------------------------------

const SEQUENCE_THEMES: Record<number, { subjectSuffix: string; approach: string }> = {
  0: { subjectSuffix: "", approach: "initial outreach" },
  1: { subjectSuffix: " - a resource for you", approach: "value add" },
  2: { subjectSuffix: " - what others are doing", approach: "social proof" },
  3: { subjectSuffix: " - last chance", approach: "urgency" },
};

function getSequenceTheme(step: number): { subjectSuffix: string; approach: string } {
  if (step >= 3) return SEQUENCE_THEMES[3];
  return SEQUENCE_THEMES[step];
}

const SEQUENCE_BODY_TEMPLATES: Record<string, string> = {
  "initial outreach": `Hi {{firstName}},

I came across {{company}} and was impressed by your work. As a {{title}}, I think you'd be interested in how {{senderCompany}} helps teams {{valueProposition}}.

Would a brief call make sense?

Best,
{{senderName}}`,

  "value add": `{{firstName}},

Following up on my earlier note. I wanted to share a quick insight: companies like {{company}} that focus on {{valueProposition}} tend to see 2-3x improvements in their first quarter.

I put together a brief analysis for {{company}} -- happy to share if you're interested.

{{senderName}}`,

  "social proof": `Hi {{firstName}},

A {{title}} at a company similar to {{company}} recently told us that {{senderCompany}} helped them {{valueProposition}} faster than they expected.

I thought this might resonate with what you're building at {{company}}. Worth exploring?

{{senderName}}`,

  "urgency": `{{firstName}},

I wanted to reach out one more time. We're working with a limited number of companies this quarter on {{valueProposition}}, and I think {{company}} would be a great fit.

If this isn't a priority right now, no worries at all. But if it is, I'd love to connect before our calendar fills up.

{{senderName}}
{{senderCompany}}`,
};

// ---------------------------------------------------------------------------
// DB persistence helper
// ---------------------------------------------------------------------------

async function persistToDb(
  id: string,
  type: string,
  tenantId: string | undefined,
  prospectEmail: string,
  payload: unknown,
): Promise<void> {
  await ensureAutoboundSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_autobound (id, type, tenant_id, prospect_email, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           prospect_email = EXCLUDED.prospect_email,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, prospectEmail, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed -- in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Generate Email(s)
// ---------------------------------------------------------------------------

export async function generateEmail(input: GenerateEmailInput): Promise<PersonalizedEmail[]> {
  const tone = input.tone ?? "professional";
  const numVariants = input.numberOfVariants ?? 3;

  if (isAutoboundDryRun()) {
    const emails: PersonalizedEmail[] = [];
    for (let i = 0; i < numVariants; i++) {
      const email = generateDryRunEmail(
        input.prospect,
        input.senderName,
        input.senderCompany,
        input.valueProposition,
        tone,
        i,
      );
      emailStore.set(email.id, email);
      await persistToDb(email.id, "email", input.tenantId, input.prospect.email, email);
      emails.push(email);
    }
    return emails;
  }

  const cfg = resolveAutoboundConfig();
  if (!cfg) {
    return generateEmail({ ...input });
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/generate-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        prospect: input.prospect,
        sender_name: input.senderName,
        sender_company: input.senderCompany,
        value_proposition: input.valueProposition,
        tone,
        number_of_variants: numVariants,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { emails?: Record<string, unknown>[] };
      if (Array.isArray(data.emails)) {
        const emails: PersonalizedEmail[] = data.emails.map((e, idx) => {
          const email: PersonalizedEmail = {
            id: generateId("abemail"),
            prospectEmail: input.prospect.email,
            subject: typeof e.subject === "string" ? e.subject : `Generated email ${idx + 1}`,
            body: typeof e.body === "string" ? e.body : "",
            personalizationSignals: Array.isArray(e.personalization_signals)
              ? (e.personalization_signals as string[])
              : extractSignals(input.prospect),
            tone,
            confidence: typeof e.confidence === "number" ? e.confidence : 0.8,
            variant: idx,
            createdAt: new Date().toISOString(),
          };
          emailStore.set(email.id, email);
          return email;
        });

        for (const email of emails) {
          await persistToDb(email.id, "email", input.tenantId, input.prospect.email, email);
        }

        return emails;
      }
    }
  } catch {
    // Fall through to dry-run on network failure
  }

  const fallback: PersonalizedEmail[] = [];
  for (let i = 0; i < numVariants; i++) {
    const email = generateDryRunEmail(
      input.prospect,
      input.senderName,
      input.senderCompany,
      input.valueProposition,
      tone,
      i,
    );
    emailStore.set(email.id, email);
    await persistToDb(email.id, "email", input.tenantId, input.prospect.email, email);
    fallback.push(email);
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Generate Sequence
// ---------------------------------------------------------------------------

export async function generateSequence(input: GenerateSequenceInput): Promise<EmailSequence> {
  const emails: PersonalizedEmail[] = [];

  for (let step = 0; step < input.steps; step++) {
    const theme = getSequenceTheme(step);
    const vars = buildTemplateVars(input.prospect, input.senderName, input.senderCompany, input.valueProposition);
    const subjectPool = SUBJECT_ANGLES[step % 3] ?? SUBJECT_ANGLES[0];
    const baseSubject = fillTemplate(subjectPool[0], vars);
    const bodyTemplate = SEQUENCE_BODY_TEMPLATES[theme.approach] ?? SEQUENCE_BODY_TEMPLATES["initial outreach"];
    const body = fillTemplate(bodyTemplate, vars);
    const signals = extractSignals(input.prospect);

    const tone: "professional" | "casual" | "urgent" = step >= 3 ? "urgent" : step >= 2 ? "casual" : "professional";
    const confidence = Math.min(0.95, 0.7 + signals.length * 0.05 - step * 0.03);

    const email: PersonalizedEmail = {
      id: generateId("abemail"),
      prospectEmail: input.prospect.email,
      subject: `${baseSubject}${theme.subjectSuffix}`,
      body,
      personalizationSignals: signals,
      tone,
      confidence: Math.max(0.5, confidence),
      variant: step,
      createdAt: new Date().toISOString(),
    };

    emailStore.set(email.id, email);
    await persistToDb(email.id, "email", input.tenantId, input.prospect.email, email);
    emails.push(email);
  }

  const sequence: EmailSequence = {
    id: generateId("abseq"),
    prospectEmail: input.prospect.email,
    emails,
    status: "draft",
    currentStep: 0,
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  sequenceStore.set(sequence.id, sequence);
  await persistToDb(sequence.id, "sequence", input.tenantId, input.prospect.email, sequence);

  return sequence;
}

// ---------------------------------------------------------------------------
// Retrieve & List
// ---------------------------------------------------------------------------

export function getGeneratedEmail(emailId: string): PersonalizedEmail | null {
  return emailStore.get(emailId) ?? null;
}

export function listGeneratedEmails(tenantId?: string): PersonalizedEmail[] {
  const all = [...emailStore.values()];
  if (!tenantId) return all;
  return all;
}

export function getSequence(sequenceId: string): EmailSequence | null {
  return sequenceStore.get(sequenceId) ?? null;
}

export function listSequences(tenantId?: string): EmailSequence[] {
  const all = [...sequenceStore.values()];
  if (!tenantId) return all;
  return all.filter((s) => s.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Sequence lifecycle
// ---------------------------------------------------------------------------

export async function advanceSequence(sequenceId: string): Promise<EmailSequence | null> {
  const seq = sequenceStore.get(sequenceId);
  if (!seq) return null;
  if (seq.status === "completed" || seq.status === "paused") return seq;

  if (seq.status === "draft") {
    seq.status = "active";
  }

  if (seq.currentStep < seq.emails.length - 1) {
    seq.currentStep += 1;
  } else {
    seq.status = "completed";
  }

  sequenceStore.set(sequenceId, seq);
  await persistToDb(sequenceId, "sequence", seq.tenantId, seq.prospectEmail, seq);
  return seq;
}

export async function pauseSequence(sequenceId: string): Promise<EmailSequence | null> {
  const seq = sequenceStore.get(sequenceId);
  if (!seq) return null;
  if (seq.status === "completed") return seq;

  seq.status = "paused";
  sequenceStore.set(sequenceId, seq);
  await persistToDb(sequenceId, "sequence", seq.tenantId, seq.prospectEmail, seq);
  return seq;
}

export async function resumeSequence(sequenceId: string): Promise<EmailSequence | null> {
  const seq = sequenceStore.get(sequenceId);
  if (!seq) return null;
  if (seq.status !== "paused") return seq;

  seq.status = "active";
  sequenceStore.set(sequenceId, seq);
  await persistToDb(sequenceId, "sequence", seq.tenantId, seq.prospectEmail, seq);
  return seq;
}

// ---------------------------------------------------------------------------
// Email rating
// ---------------------------------------------------------------------------

export function rateEmail(emailId: string, rating: "good" | "bad"): boolean {
  const email = emailStore.get(emailId);
  if (!email) return false;
  ratingStore.set(emailId, rating);
  return true;
}

// ---------------------------------------------------------------------------
// Bulk pipeline generation
// ---------------------------------------------------------------------------

export async function generateForProspectPipeline(
  prospects: ProspectInput[],
  senderInfo: { name: string; company: string; valueProposition: string },
  tenantId?: string,
): Promise<{ generated: number; sequences: string[]; avgConfidence: number }> {
  const sequenceIds: string[] = [];
  let totalConfidence = 0;
  let emailCount = 0;

  for (const prospect of prospects) {
    const seq = await generateSequence({
      prospect,
      senderName: senderInfo.name,
      senderCompany: senderInfo.company,
      valueProposition: senderInfo.valueProposition,
      steps: 3,
      delayDays: [0, 3, 7],
      tenantId,
    });

    sequenceIds.push(seq.id);
    for (const email of seq.emails) {
      totalConfidence += email.confidence;
      emailCount++;
    }
  }

  return {
    generated: emailCount,
    sequences: sequenceIds,
    avgConfidence: emailCount > 0 ? totalConfidence / emailCount : 0,
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getAutoboundStats(tenantId?: string): AutoboundStats {
  const allEmails = [...emailStore.values()];
  const allSequences = [...sequenceStore.values()];

  const filteredSequences = tenantId
    ? allSequences.filter((s) => s.tenantId === tenantId)
    : allSequences;

  const filteredEmails = tenantId
    ? allEmails.filter((e) => {
        for (const seq of filteredSequences) {
          if (seq.emails.some((se) => se.id === e.id)) return true;
        }
        return !filteredSequences.length;
      })
    : allEmails;

  const totalGenerated = filteredEmails.length;
  const totalSequences = filteredSequences.length;

  const avgConfidence =
    totalGenerated > 0
      ? filteredEmails.reduce((sum, e) => sum + e.confidence, 0) / totalGenerated
      : 0;

  const signalCounts = new Map<string, number>();
  for (const email of filteredEmails) {
    for (const signal of email.personalizationSignals) {
      signalCounts.set(signal, (signalCounts.get(signal) ?? 0) + 1);
    }
  }

  const topSignals = [...signalCounts.entries()]
    .map(([signal, count]) => ({ signal, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byTone: Record<string, number> = {};
  for (const email of filteredEmails) {
    byTone[email.tone] = (byTone[email.tone] ?? 0) + 1;
  }

  return { totalGenerated, totalSequences, avgConfidence, topSignals, byTone };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function autoboundResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "Autobound",
    mode: isAutoboundDryRun() ? "dry-run" : "live",
    detail: `[${operation}] ${detail}`,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetAutoboundStore(): void {
  emailStore.clear();
  sequenceStore.clear();
  ratingStore.clear();
  schemaEnsured = false;
}
