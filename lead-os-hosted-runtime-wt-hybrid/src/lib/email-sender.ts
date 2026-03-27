import { getPool } from "./db.ts";
import {
  type EmailContext,
  type EmailTemplate,
  getTemplate,
  renderEmail,
} from "./email-templates.ts";
import { sendEmailAction } from "./providers.ts";
import { ensureTraceContext, type TraceContext } from "./trace.ts";

export interface SendEmailInput {
  to: string;
  templateId?: string;
  template?: EmailTemplate;
  context: EmailContext;
  tenantId: string;
  leadKey?: string;
  emailId?: string;
  tags?: string[];
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  mode: "live" | "dry-run";
  detail: string;
}

export interface SuppressionEntry {
  email: string;
  reason: "bounce" | "complaint" | "unsubscribe" | "manual";
  tenantId: string;
  createdAt: string;
}

const suppressionStore = new Map<string, SuppressionEntry>();

function suppressionKey(email: string, tenantId: string): string {
  return `${email.toLowerCase().trim()}::${tenantId}`;
}

async function ensureSuppressionSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_os_email_suppressions (
      email TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (email, tenant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_suppressions_tenant
      ON lead_os_email_suppressions (tenant_id);
  `);
}

let suppressionSchemaReady: Promise<void> | null = null;

function ensureSuppressionSchemaOnce(): Promise<void> {
  if (!suppressionSchemaReady) {
    suppressionSchemaReady = ensureSuppressionSchema().catch(() => {
      suppressionSchemaReady = null;
    });
  }
  return suppressionSchemaReady;
}

export async function addToSuppressionList(
  email: string,
  reason: SuppressionEntry["reason"],
  tenantId: string,
): Promise<SuppressionEntry> {
  const normalized = email.toLowerCase().trim();
  const entry: SuppressionEntry = {
    email: normalized,
    reason,
    tenantId,
    createdAt: new Date().toISOString(),
  };
  suppressionStore.set(suppressionKey(normalized, tenantId), entry);

  const pool = getPool();
  if (pool) {
    await ensureSuppressionSchemaOnce();
    await pool.query(
      `INSERT INTO lead_os_email_suppressions (email, tenant_id, reason, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, tenant_id) DO UPDATE SET reason = $3, created_at = $4`,
      [normalized, tenantId, reason, entry.createdAt],
    );
  }

  return entry;
}

export async function removeFromSuppressionList(email: string, tenantId: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const key = suppressionKey(normalized, tenantId);
  const existed = suppressionStore.delete(key);

  const pool = getPool();
  if (pool) {
    await ensureSuppressionSchemaOnce();
    const result = await pool.query(
      `DELETE FROM lead_os_email_suppressions WHERE email = $1 AND tenant_id = $2`,
      [normalized, tenantId],
    );
    return (result.rowCount ?? 0) > 0 || existed;
  }

  return existed;
}

export async function isEmailSuppressed(email: string, tenantId: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const key = suppressionKey(normalized, tenantId);

  if (suppressionStore.has(key)) return true;

  const pool = getPool();
  if (pool) {
    await ensureSuppressionSchemaOnce();
    const result = await pool.query(
      `SELECT 1 FROM lead_os_email_suppressions WHERE email = $1 AND tenant_id = $2 LIMIT 1`,
      [normalized, tenantId],
    );
    if (result.rows.length > 0) {
      suppressionStore.set(key, {
        email: normalized,
        reason: "manual",
        tenantId,
        createdAt: new Date().toISOString(),
      });
      return true;
    }
  }

  return false;
}

export async function getSuppressionList(tenantId: string): Promise<SuppressionEntry[]> {
  const pool = getPool();
  if (pool) {
    await ensureSuppressionSchemaOnce();
    const result = await pool.query(
      `SELECT email, reason, tenant_id, created_at FROM lead_os_email_suppressions WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows.map((row) => ({
      email: String(row.email),
      reason: String(row.reason) as SuppressionEntry["reason"],
      tenantId: String(row.tenant_id),
      createdAt: String(row.created_at),
    }));
  }

  return [...suppressionStore.values()].filter((e) => e.tenantId === tenantId);
}

export async function processBounceback(
  email: string,
  tenantId: string,
  bounceType: "hard" | "soft",
): Promise<void> {
  if (bounceType === "hard") {
    await addToSuppressionList(email, "bounce", tenantId);
  }
}

export async function processComplaint(email: string, tenantId: string): Promise<void> {
  await addToSuppressionList(email, "complaint", tenantId);
}

export async function processUnsubscribe(email: string, tenantId: string): Promise<void> {
  await addToSuppressionList(email, "unsubscribe", tenantId);
}

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const suppressed = await isEmailSuppressed(input.to, input.tenantId);
  if (suppressed) {
    return {
      ok: false,
      provider: "suppression-list",
      mode: "live",
      detail: `Email to ${input.to} blocked by suppression list`,
    };
  }

  const template = input.template ?? (input.templateId ? getTemplate(input.templateId) : undefined);
  if (!template) {
    return {
      ok: false,
      provider: "none",
      mode: "live",
      detail: `Template not found: ${input.templateId ?? "no template provided"}`,
    };
  }

  const rendered = renderEmail(template, input.context);

  const trace: TraceContext = ensureTraceContext({
    tenant: input.tenantId,
    leadKey: input.leadKey,
    blueprintId: `email-${template.id}`,
    source: "email-sender",
  });

  const providerResult = await sendEmailAction({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    trace,
  });

  return {
    ok: providerResult.ok,
    provider: providerResult.provider,
    messageId: input.emailId,
    mode: providerResult.mode === "live" ? "live" : "dry-run",
    detail: providerResult.detail,
  };
}

export function _getSuppressionStoreForTesting(): Map<string, SuppressionEntry> {
  return suppressionStore;
}
