import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalespanelConfig {
  apiKey: string;
  baseUrl: string;
}

export type LeadSource = "website" | "email" | "form" | "chat" | "api" | "import";

export interface SalespanelLead {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  domain?: string;
  phone?: string;
  source: LeadSource;
  behaviorScore: number;
  fitScore: number;
  totalScore: number;
  temperature: "cold" | "warm" | "hot" | "burning";
  pageViews: { url: string; timestamp: string; duration: number }[];
  events: { name: string; value?: string; timestamp: string }[];
  firstSeen: string;
  lastSeen: string;
  tenantId?: string;
}

export interface SalespanelSegment {
  id: string;
  name: string;
  conditions: SegmentCondition[];
  leadCount: number;
  tenantId?: string;
}

export interface SegmentCondition {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than";
  value: string | number;
}

export interface ScoringRule {
  id: string;
  name: string;
  type: "behavior" | "fit";
  field: string;
  condition: string;
  points: number;
  tenantId?: string;
}

export interface SalespanelStats {
  totalLeads: number;
  bySource: Record<LeadSource, number>;
  byTemperature: Record<string, number>;
  avgBehaviorScore: number;
  avgFitScore: number;
  topPages: { url: string; views: number }[];
}

export interface TrackEventInput {
  leadId: string;
  eventName: string;
  eventValue?: string;
  url?: string;
  tenantId?: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const leadStore = new Map<string, SalespanelLead>();
const segmentStore = new Map<string, SalespanelSegment>();
const scoringRuleStore = new Map<string, ScoringRule>();

let schemaEnsured = false;
let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveSalespanelConfig(): SalespanelConfig | null {
  const apiKey = process.env.SALESPANEL_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.SALESPANEL_BASE_URL ?? "https://salespanel.io/api/v1",
  };
}

export function isSalespanelDryRun(): boolean {
  return !process.env.SALESPANEL_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureSalespanelSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_salespanel (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        email TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed — fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// DB persistence helpers
// ---------------------------------------------------------------------------

async function persistToDb(
  id: string,
  type: string,
  payload: unknown,
  tenantId?: string,
  email?: string,
): Promise<void> {
  await ensureSalespanelSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO lead_os_salespanel (id, type, tenant_id, email, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO UPDATE
       SET payload = EXCLUDED.payload,
           updated_at = EXCLUDED.updated_at`,
      [id, type, tenantId ?? null, email ?? null, JSON.stringify(payload), now],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function computeTemperature(totalScore: number): "cold" | "warm" | "hot" | "burning" {
  if (totalScore >= 75) return "burning";
  if (totalScore >= 50) return "hot";
  if (totalScore >= 25) return "warm";
  return "cold";
}

function computeScores(lead: SalespanelLead): {
  behaviorScore: number;
  fitScore: number;
  totalScore: number;
  temperature: "cold" | "warm" | "hot" | "burning";
} {
  const pageViewPoints = Math.min(lead.pageViews.length * 5, 50);
  const eventPoints = Math.min(lead.events.length * 10, 50);
  const behaviorScore = Math.min(pageViewPoints + eventPoints, 100);

  let fitScore = 0;
  if (lead.email) fitScore += 30;
  if (lead.company) fitScore += 40;
  if (lead.phone) fitScore += 30;

  const totalScore = Math.round((behaviorScore + fitScore) / 2);
  const temperature = computeTemperature(totalScore);

  return { behaviorScore, fitScore, totalScore, temperature };
}

// ---------------------------------------------------------------------------
// Lead CRUD
// ---------------------------------------------------------------------------

export async function createLead(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source?: LeadSource;
  tenantId?: string;
}): Promise<SalespanelLead> {
  const now = new Date().toISOString();
  const id = generateId("sp_lead");

  const lead: SalespanelLead = {
    id,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company,
    source: input.source ?? "website",
    behaviorScore: 0,
    fitScore: 0,
    totalScore: 0,
    temperature: "cold",
    pageViews: [],
    events: [],
    firstSeen: now,
    lastSeen: now,
    tenantId: input.tenantId,
  };

  const scores = computeScores(lead);
  lead.behaviorScore = scores.behaviorScore;
  lead.fitScore = scores.fitScore;
  lead.totalScore = scores.totalScore;
  lead.temperature = scores.temperature;

  leadStore.set(id, lead);
  await persistToDb(id, "lead", lead, input.tenantId, input.email);

  return lead;
}

export async function getLead(leadId: string): Promise<SalespanelLead | null> {
  return leadStore.get(leadId) ?? null;
}

export async function getLeadByEmail(email: string): Promise<SalespanelLead | null> {
  for (const lead of leadStore.values()) {
    if (lead.email === email) return lead;
  }
  return null;
}

export async function listLeads(filter?: {
  source?: LeadSource;
  temperature?: string;
  minScore?: number;
  tenantId?: string;
}): Promise<SalespanelLead[]> {
  let leads = [...leadStore.values()];

  if (filter?.source) {
    leads = leads.filter((l) => l.source === filter.source);
  }
  if (filter?.temperature) {
    leads = leads.filter((l) => l.temperature === filter.temperature);
  }
  if (filter?.minScore !== undefined) {
    leads = leads.filter((l) => l.totalScore >= filter.minScore!);
  }
  if (filter?.tenantId) {
    leads = leads.filter((l) => l.tenantId === filter.tenantId);
  }

  return leads;
}

// ---------------------------------------------------------------------------
// Event & Page View Tracking
// ---------------------------------------------------------------------------

export async function trackEvent(input: TrackEventInput): Promise<SalespanelLead | null> {
  const lead = leadStore.get(input.leadId);
  if (!lead) return null;

  const now = new Date().toISOString();
  lead.events.push({
    name: input.eventName,
    value: input.eventValue,
    timestamp: now,
  });
  lead.lastSeen = now;

  const scores = computeScores(lead);
  lead.behaviorScore = scores.behaviorScore;
  lead.fitScore = scores.fitScore;
  lead.totalScore = scores.totalScore;
  lead.temperature = scores.temperature;

  await persistToDb(lead.id, "lead", lead, lead.tenantId, lead.email);
  return lead;
}

export async function trackPageView(
  leadId: string,
  url: string,
  duration?: number,
): Promise<SalespanelLead | null> {
  const lead = leadStore.get(leadId);
  if (!lead) return null;

  const now = new Date().toISOString();
  lead.pageViews.push({
    url,
    timestamp: now,
    duration: duration ?? 0,
  });
  lead.lastSeen = now;

  const scores = computeScores(lead);
  lead.behaviorScore = scores.behaviorScore;
  lead.fitScore = scores.fitScore;
  lead.totalScore = scores.totalScore;
  lead.temperature = scores.temperature;

  await persistToDb(lead.id, "lead", lead, lead.tenantId, lead.email);
  return lead;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export async function scoreLead(leadId: string): Promise<SalespanelLead | null> {
  const lead = leadStore.get(leadId);
  if (!lead) return null;

  const scores = computeScores(lead);
  lead.behaviorScore = scores.behaviorScore;
  lead.fitScore = scores.fitScore;
  lead.totalScore = scores.totalScore;
  lead.temperature = scores.temperature;

  await persistToDb(lead.id, "lead", lead, lead.tenantId, lead.email);
  return lead;
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

export async function createSegment(input: {
  name: string;
  conditions: SegmentCondition[];
  tenantId?: string;
}): Promise<SalespanelSegment> {
  const id = generateId("sp_seg");

  const segment: SalespanelSegment = {
    id,
    name: input.name,
    conditions: input.conditions,
    leadCount: 0,
    tenantId: input.tenantId,
  };

  const matching = getMatchingLeads(segment);
  segment.leadCount = matching.length;

  segmentStore.set(id, segment);
  await persistToDb(id, "segment", segment, input.tenantId);

  return segment;
}

function matchCondition(lead: SalespanelLead, condition: SegmentCondition): boolean {
  const fieldValue = (lead as unknown as Record<string, unknown>)[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(String(condition.value));
    case "greater_than":
      return typeof fieldValue === "number" && fieldValue > Number(condition.value);
    case "less_than":
      return typeof fieldValue === "number" && fieldValue < Number(condition.value);
    default:
      return false;
  }
}

function getMatchingLeads(segment: SalespanelSegment): SalespanelLead[] {
  const leads = [...leadStore.values()];
  return leads.filter((lead) =>
    segment.conditions.every((cond) => matchCondition(lead, cond)),
  );
}

export async function getSegmentLeads(segmentId: string): Promise<SalespanelLead[]> {
  const segment = segmentStore.get(segmentId);
  if (!segment) return [];
  return getMatchingLeads(segment);
}

// ---------------------------------------------------------------------------
// Scoring Rules
// ---------------------------------------------------------------------------

export async function createScoringRule(
  rule: Omit<ScoringRule, "id">,
): Promise<ScoringRule> {
  const id = generateId("sp_rule");
  const scoringRule: ScoringRule = { id, ...rule };

  scoringRuleStore.set(id, scoringRule);
  await persistToDb(id, "scoring_rule", scoringRule, rule.tenantId);

  return scoringRule;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getLeadStats(tenantId?: string): Promise<SalespanelStats> {
  let leads = [...leadStore.values()];
  if (tenantId) {
    leads = leads.filter((l) => l.tenantId === tenantId);
  }

  const totalLeads = leads.length;

  const bySource: Record<LeadSource, number> = {
    website: 0,
    email: 0,
    form: 0,
    chat: 0,
    api: 0,
    import: 0,
  };
  for (const lead of leads) {
    bySource[lead.source] += 1;
  }

  const byTemperature: Record<string, number> = {
    cold: 0,
    warm: 0,
    hot: 0,
    burning: 0,
  };
  for (const lead of leads) {
    byTemperature[lead.temperature] = (byTemperature[lead.temperature] ?? 0) + 1;
  }

  const avgBehaviorScore =
    totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.behaviorScore, 0) / totalLeads)
      : 0;
  const avgFitScore =
    totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.fitScore, 0) / totalLeads)
      : 0;

  const pageCounts = new Map<string, number>();
  for (const lead of leads) {
    for (const pv of lead.pageViews) {
      pageCounts.set(pv.url, (pageCounts.get(pv.url) ?? 0) + 1);
    }
  }
  const topPages = [...pageCounts.entries()]
    .map(([url, views]) => ({ url, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    totalLeads,
    bySource,
    byTemperature,
    avgBehaviorScore,
    avgFitScore,
    topPages,
  };
}

// ---------------------------------------------------------------------------
// Lead OS Sync
// ---------------------------------------------------------------------------

export async function syncLeadToLeadOS(
  leadId: string,
  tenantId?: string,
): Promise<ProviderResult> {
  const lead = leadStore.get(leadId);
  if (!lead) {
    return {
      ok: false,
      provider: "Salespanel",
      mode: isSalespanelDryRun() ? "dry-run" : "live",
      detail: `Lead ${leadId} not found`,
    };
  }

  const effectiveTenant = tenantId ?? lead.tenantId;

  return {
    ok: true,
    provider: "Salespanel",
    mode: isSalespanelDryRun() ? "dry-run" : "live",
    detail: `Lead ${leadId} synced to Lead OS for tenant ${effectiveTenant ?? "default"}`,
    payload: {
      leadId: lead.id,
      email: lead.email ?? null,
      firstName: lead.firstName ?? null,
      lastName: lead.lastName ?? null,
      company: lead.company ?? null,
      source: lead.source,
      totalScore: lead.totalScore,
      temperature: lead.temperature,
      tenantId: effectiveTenant ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function salespanelResult(operation: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "Salespanel",
    mode: isSalespanelDryRun() ? "dry-run" : "live",
    detail: `[${operation}] ${detail}`,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetSalespanelStore(): void {
  leadStore.clear();
  segmentStore.clear();
  scoringRuleStore.clear();
  schemaEnsured = false;
  idCounter = 0;
}
