import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import { tenantConfig } from "./tenant.ts";

export type IngressChannel =
  | "seo"
  | "paid-search"
  | "paid-social"
  | "organic-social"
  | "referral"
  | "directory"
  | "email"
  | "partner"
  | "direct";

export type IntentLevel = "high" | "medium" | "low";

export interface IngressRule {
  id: string;
  tenantId: string;
  channel: IngressChannel;
  intentLevel: IntentLevel;
  funnelType: string;
  keywords?: string[];
  sourcePatterns?: string[];
  initialScoreBoost: number;
  priority: number;
  active: boolean;
}

export interface IngressDecision {
  channel: IngressChannel;
  intentLevel: IntentLevel;
  funnelType: string;
  scoreBoost: number;
  matchedRule?: string;
  confidence: number;
}

export interface IngressAnalytics {
  channel: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  avgScore: number;
  cost?: number;
}

const DEFAULT_INGRESS_MAP: Record<
  IngressChannel,
  { intentLevel: IntentLevel; funnelType: string; scoreBoost: number }
> = {
  "paid-search": { intentLevel: "high", funnelType: "qualification", scoreBoost: 25 },
  direct: { intentLevel: "high", funnelType: "qualification", scoreBoost: 20 },
  referral: { intentLevel: "high", funnelType: "qualification", scoreBoost: 30 },
  partner: { intentLevel: "medium", funnelType: "authority", scoreBoost: 20 },
  "paid-social": { intentLevel: "medium", funnelType: "lead-magnet", scoreBoost: 15 },
  directory: { intentLevel: "medium", funnelType: "qualification", scoreBoost: 15 },
  email: { intentLevel: "medium", funnelType: "nurture", scoreBoost: 10 },
  "organic-social": { intentLevel: "low", funnelType: "lead-magnet", scoreBoost: 5 },
  seo: { intentLevel: "low", funnelType: "lead-magnet", scoreBoost: 5 },
};

const SEARCH_ENGINE_PATTERNS = [
  "google.com",
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
  "baidu.com",
  "yandex.com",
];

const SOCIAL_PLATFORMS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
  "pinterest.com",
  "reddit.com",
  "threads.net",
];

const DIRECTORY_PLATFORMS = [
  "yelp.com",
  "yellowpages.com",
  "bbb.org",
  "g2.com",
  "capterra.com",
  "trustpilot.com",
  "clutch.co",
  "angi.com",
  "homeadvisor.com",
  "thumbtack.com",
];

const ingressRuleStore = new Map<string, IngressRule>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_ingress_rules (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          channel TEXT NOT NULL,
          intent_level TEXT NOT NULL,
          funnel_type TEXT NOT NULL,
          keywords JSONB NOT NULL DEFAULT '[]',
          source_patterns JSONB NOT NULL DEFAULT '[]',
          initial_score_boost INTEGER NOT NULL DEFAULT 0,
          priority INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_ingress_rules_tenant
          ON lead_os_ingress_rules (tenant_id, priority DESC);

        CREATE TABLE IF NOT EXISTS lead_os_ingress_events (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          channel TEXT NOT NULL,
          lead_key TEXT,
          score_boost INTEGER NOT NULL DEFAULT 0,
          converted BOOLEAN NOT NULL DEFAULT false,
          lead_score INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_ingress_events_tenant
          ON lead_os_ingress_events (tenant_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_ingress_events_channel
          ON lead_os_ingress_events (tenant_id, channel);
      `);
    } catch (error: unknown) {
      console.error("Failed to create ingress engine schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

function matchesDomain(url: string, domains: string[]): boolean {
  const lower = url.toLowerCase();
  return domains.some((d) => lower.includes(d));
}

export function detectIngressChannel(
  source: string,
  referrer?: string,
  utmSource?: string,
  utmMedium?: string,
): IngressChannel {
  const src = (source ?? "").toLowerCase().trim();
  const ref = (referrer ?? "").toLowerCase().trim();
  const medium = (utmMedium ?? "").toLowerCase().trim();
  const utmSrc = (utmSource ?? "").toLowerCase().trim();

  if (medium === "cpc" || medium === "ppc" || medium === "paid-search" || medium === "sem") {
    return "paid-search";
  }

  if (medium === "paid-social" || medium === "paidsocial" || medium === "paid_social") {
    return "paid-social";
  }

  if (medium === "email" || utmSrc === "email" || utmSrc === "newsletter" || src === "email") {
    return "email";
  }

  if (medium === "partner" || medium === "affiliate" || utmSrc === "partner" || src === "partner") {
    return "partner";
  }

  if (medium === "referral" || src === "referral") {
    return "referral";
  }

  if (medium === "social" || medium === "organic-social") {
    return "organic-social";
  }

  if (matchesDomain(ref, SEARCH_ENGINE_PATTERNS) || matchesDomain(src, SEARCH_ENGINE_PATTERNS)) {
    if (medium === "organic" || medium === "" || medium === "none") {
      return "seo";
    }
    return "paid-search";
  }

  if (matchesDomain(ref, SOCIAL_PLATFORMS) || matchesDomain(src, SOCIAL_PLATFORMS)) {
    if (medium === "cpc" || medium === "ppc" || medium === "paid") {
      return "paid-social";
    }
    return "organic-social";
  }

  if (matchesDomain(ref, DIRECTORY_PLATFORMS) || matchesDomain(src, DIRECTORY_PLATFORMS)) {
    return "directory";
  }

  if (ref && ref !== "" && ref !== "(none)" && ref !== "direct") {
    return "referral";
  }

  if (src === "direct" || src === "" || src === "(direct)" || src === "(none)") {
    return "direct";
  }

  return "direct";
}

export function resolveIngressDecision(
  channel: IngressChannel,
  tenantId: string,
  keywords?: string[],
): IngressDecision {
  const rules = [...ingressRuleStore.values()]
    .filter((r) => r.tenantId === tenantId && r.active && r.channel === channel)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of rules) {
    if (rule.keywords && rule.keywords.length > 0 && keywords && keywords.length > 0) {
      const lowerKeywords = keywords.map((k) => k.toLowerCase());
      const hasMatch = rule.keywords.some((rk) =>
        lowerKeywords.some((lk) => lk.includes(rk.toLowerCase())),
      );
      if (!hasMatch) continue;
    }

    return {
      channel,
      intentLevel: rule.intentLevel,
      funnelType: rule.funnelType,
      scoreBoost: rule.initialScoreBoost,
      matchedRule: rule.id,
      confidence: 0.95,
    };
  }

  const defaultMapping = DEFAULT_INGRESS_MAP[channel];
  return {
    channel,
    intentLevel: defaultMapping.intentLevel,
    funnelType: defaultMapping.funnelType,
    scoreBoost: defaultMapping.scoreBoost,
    confidence: 0.7,
  };
}

export async function createIngressRule(
  rule: Omit<IngressRule, "id">,
): Promise<IngressRule> {
  await ensureSchema();

  const newRule: IngressRule = {
    ...rule,
    id: randomUUID(),
  };

  ingressRuleStore.set(newRule.id, newRule);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_ingress_rules
        (id, tenant_id, channel, intent_level, funnel_type, keywords, source_patterns, initial_score_boost, priority, active)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)`,
      [
        newRule.id,
        newRule.tenantId,
        newRule.channel,
        newRule.intentLevel,
        newRule.funnelType,
        JSON.stringify(newRule.keywords ?? []),
        JSON.stringify(newRule.sourcePatterns ?? []),
        newRule.initialScoreBoost,
        newRule.priority,
        newRule.active,
      ],
    );
  }

  return newRule;
}

export async function listIngressRules(tenantId: string): Promise<IngressRule[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, channel, intent_level, funnel_type, keywords, source_patterns,
                initial_score_boost, priority, active
         FROM lead_os_ingress_rules WHERE tenant_id = $1 ORDER BY priority DESC`,
        [tenantId],
      );
      const rules: IngressRule[] = result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        channel: row.channel,
        intentLevel: row.intent_level,
        funnelType: row.funnel_type,
        keywords: row.keywords,
        sourcePatterns: row.source_patterns,
        initialScoreBoost: row.initial_score_boost,
        priority: row.priority,
        active: row.active,
      }));
      for (const r of rules) ingressRuleStore.set(r.id, r);
      return rules;
    } catch {
      // fall through to in-memory
    }
  }

  return [...ingressRuleStore.values()]
    .filter((r) => r.tenantId === tenantId)
    .sort((a, b) => b.priority - a.priority);
}

export async function updateIngressRule(
  id: string,
  patch: Partial<Omit<IngressRule, "id" | "tenantId">>,
): Promise<IngressRule | null> {
  await ensureSchema();

  const existing = ingressRuleStore.get(id);
  if (!existing) return null;

  const updated: IngressRule = {
    ...existing,
    ...patch,
    id: existing.id,
    tenantId: existing.tenantId,
  };

  ingressRuleStore.set(id, updated);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE lead_os_ingress_rules SET
        channel = $2, intent_level = $3, funnel_type = $4, keywords = $5::jsonb,
        source_patterns = $6::jsonb, initial_score_boost = $7, priority = $8, active = $9,
        updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        updated.channel,
        updated.intentLevel,
        updated.funnelType,
        JSON.stringify(updated.keywords ?? []),
        JSON.stringify(updated.sourcePatterns ?? []),
        updated.initialScoreBoost,
        updated.priority,
        updated.active,
      ],
    );
  }

  return updated;
}

export async function deleteIngressRule(id: string): Promise<boolean> {
  await ensureSchema();

  const existed = ingressRuleStore.delete(id);

  const pool = getPool();
  if (pool) {
    await pool.query(`DELETE FROM lead_os_ingress_rules WHERE id = $1`, [id]);
  }

  return existed;
}

export async function recordIngressEvent(
  tenantId: string,
  channel: IngressChannel,
  leadKey?: string,
  scoreBoost?: number,
  converted?: boolean,
  leadScore?: number,
): Promise<void> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_ingress_events (id, tenant_id, channel, lead_key, score_boost, converted, lead_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), tenantId, channel, leadKey ?? null, scoreBoost ?? 0, converted ?? false, leadScore ?? null],
    );
  }
}

export async function getIngressAnalytics(
  tenantId: string,
  since?: string,
): Promise<IngressAnalytics[]> {
  await ensureSchema();

  const pool = getPool();
  if (!pool) {
    return Object.keys(DEFAULT_INGRESS_MAP).map((ch) => ({
      channel: ch,
      leads: 0,
      conversions: 0,
      conversionRate: 0,
      avgScore: 0,
    }));
  }

  const sinceDate = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const result = await pool.query(
    `SELECT
       channel,
       COUNT(*)::int AS leads,
       COUNT(*) FILTER (WHERE converted = true)::int AS conversions,
       CASE WHEN COUNT(*) > 0
         THEN ROUND(COUNT(*) FILTER (WHERE converted = true)::numeric / COUNT(*)::numeric * 100, 2)
         ELSE 0
       END AS conversion_rate,
       COALESCE(ROUND(AVG(lead_score)::numeric, 1), 0) AS avg_score
     FROM lead_os_ingress_events
     WHERE tenant_id = $1 AND created_at >= $2::timestamptz
     GROUP BY channel
     ORDER BY leads DESC`,
    [tenantId, sinceDate],
  );

  return result.rows.map((row) => ({
    channel: row.channel,
    leads: row.leads,
    conversions: row.conversions,
    conversionRate: Number(row.conversion_rate),
    avgScore: Number(row.avg_score),
  }));
}

export function getDefaultIngressMap(): Record<
  IngressChannel,
  { intentLevel: IntentLevel; funnelType: string; scoreBoost: number }
> {
  return { ...DEFAULT_INGRESS_MAP };
}

export function resetIngressStore(): void {
  ingressRuleStore.clear();
  schemaReady = null;
}
