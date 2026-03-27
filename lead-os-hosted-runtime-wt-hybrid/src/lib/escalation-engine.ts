import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EscalationType =
  | "immediate-call"
  | "scheduled-demo"
  | "vip-concierge"
  | "partnership-inquiry";

export interface Escalation {
  id: string;
  leadId: string;
  tenantId: string;
  type: EscalationType;
  priority: "critical" | "high" | "medium" | "low";
  assignedRepId: string | null;
  estimatedValue: number;
  signals: string[];
  status: "pending" | "assigned" | "in-progress" | "completed" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  niches: string[];
  timezone: string;
  maxDailyCapacity: number;
  currentDailyLoad: number;
  isAvailable: boolean;
  closingRate: number;
}

export interface SalesHandoff {
  escalationId: string;
  leadId: string;
  repId: string;
  leadSummary: string;
  scoringBreakdown: { category: string; score: number; factors: string[] }[];
  conversationHighlights: string[];
  recommendedApproach: string;
  objectionPredictions: string[];
  estimatedValue: number;
  createdAt: string;
}

export interface CallbackTask {
  id: string;
  escalationId: string;
  leadId: string;
  repId: string;
  preferredTime: string;
  leadContext: string;
  status: "scheduled" | "completed" | "missed" | "rescheduled";
  createdAt: string;
}

export interface EscalationOutcome {
  escalationId: string;
  outcome: "won" | "lost" | "no-response" | "rescheduled";
  dealValue: number;
  notes: string;
  recordedAt: string;
}

export interface EscalationMetrics {
  tenantId: string;
  period: string;
  totalEscalations: number;
  conversionRate: number;
  averageDealSize: number;
  averageResponseTimeMinutes: number;
  outcomeBreakdown: Record<string, number>;
  closeRateByRep: Record<string, number>;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Escalation signal thresholds
// ---------------------------------------------------------------------------

const SCORE_THRESHOLD = 85;
const HIGH_VALUE_THRESHOLD = 5000;
const ENTERPRISE_SIZES = ["enterprise", "1000+", "501-1000"];
const URGENCY_KEYWORDS = ["asap", "urgent", "immediately", "today", "now", "emergency"];

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const escalationStore = new Map<string, Escalation>();
const outcomeStore = new Map<string, EscalationOutcome>();
const callbackStore = new Map<string, CallbackTask>();
const handoffStore = new Map<string, SalesHandoff>();

let escalationCounter = 0;
let callbackCounter = 0;

let schemaReady: Promise<void> | null = null;

async function ensureEscalationSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_escalations (
          id TEXT PRIMARY KEY,
          lead_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          type TEXT NOT NULL,
          priority TEXT NOT NULL,
          assigned_rep_id TEXT,
          estimated_value NUMERIC(12,2) NOT NULL DEFAULT 0,
          signals JSONB NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_escalation_outcomes (
          escalation_id TEXT PRIMARY KEY,
          outcome TEXT NOT NULL,
          deal_value NUMERIC(12,2) NOT NULL DEFAULT 0,
          notes TEXT NOT NULL DEFAULT '',
          recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_escalations_tenant ON lead_os_escalations(tenant_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_escalations_status ON lead_os_escalations(status)
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Lead Qualification for Human Handoff
// ---------------------------------------------------------------------------

export interface EscalationSignals {
  compositeScore?: number;
  estimatedDealValue?: number;
  hasPhoneRequest?: boolean;
  competitorMentioned?: boolean;
  urgencyLevel?: "low" | "medium" | "high" | "critical";
  companySize?: string;
  explicitCallRequest?: boolean;
  isReturningVisitor?: boolean;
  chatMessageCount?: number;
  urgencyKeywords?: string[];
}

export interface LeadForEscalation {
  id: string;
  tenantId: string;
  niche?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  companySize?: string;
  estimatedDealValue?: number;
  conversationHistory?: string[];
  metadata?: Record<string, unknown>;
}

export function shouldEscalate(
  lead: LeadForEscalation,
  score: number,
  signals: EscalationSignals,
): { escalate: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (score >= SCORE_THRESHOLD) {
    reasons.push(`composite-score-${score}-above-threshold`);
  }

  const dealValue = signals.estimatedDealValue ?? lead.estimatedDealValue ?? 0;
  if (dealValue >= HIGH_VALUE_THRESHOLD) {
    reasons.push(`deal-value-${dealValue}-above-threshold`);
  }

  if (signals.hasPhoneRequest || signals.explicitCallRequest) {
    reasons.push("explicit-phone-request");
  }

  if (signals.competitorMentioned && (signals.urgencyLevel === "high" || signals.urgencyLevel === "critical")) {
    reasons.push("competitor-mention-with-high-urgency");
  }

  const companySize = (signals.companySize ?? lead.companySize ?? "").toLowerCase();
  if (ENTERPRISE_SIZES.some((s) => companySize === s)) {
    reasons.push("enterprise-company-size");
  }

  if (signals.urgencyKeywords) {
    const found = signals.urgencyKeywords.filter((kw) =>
      URGENCY_KEYWORDS.includes(kw.toLowerCase()),
    );
    if (found.length > 0) {
      reasons.push(`urgency-keywords: ${found.join(", ")}`);
    }
  }

  return { escalate: reasons.length > 0, reasons };
}

export function classifyEscalationType(lead: LeadForEscalation): EscalationType {
  const companySize = (lead.companySize ?? "").toLowerCase();
  const isEnterprise = ENTERPRISE_SIZES.some((s) => companySize === s);
  const dealValue = lead.estimatedDealValue ?? 0;

  if (lead.phone && dealValue >= HIGH_VALUE_THRESHOLD) {
    return "immediate-call";
  }

  if (isEnterprise && dealValue >= 20000) {
    return "vip-concierge";
  }

  if (isEnterprise || dealValue >= 10000) {
    return "partnership-inquiry";
  }

  return "scheduled-demo";
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export function routeToSalesRep(
  lead: LeadForEscalation,
  team: SalesRep[],
): SalesRep | null {
  const available = team.filter(
    (rep) => rep.isAvailable && rep.currentDailyLoad < rep.maxDailyCapacity,
  );

  if (available.length === 0) return null;

  const scored = available.map((rep) => {
    let score = 0;

    const nicheMatch = lead.niche && rep.niches.some((n) => n.toLowerCase() === lead.niche!.toLowerCase());
    if (nicheMatch) score += 40;

    score += Math.round(rep.closingRate * 30);

    const capacityRatio = 1 - (rep.currentDailyLoad / rep.maxDailyCapacity);
    score += Math.round(capacityRatio * 20);

    const loadPenalty = rep.currentDailyLoad * 2;
    score -= loadPenalty;

    return { rep, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].rep;
}

export function createSalesHandoff(
  lead: LeadForEscalation,
  rep: SalesRep,
  context: {
    scoringBreakdown?: { category: string; score: number; factors: string[] }[];
    conversationHighlights?: string[];
    estimatedValue?: number;
  },
): SalesHandoff {
  const estimatedValue = context.estimatedValue ?? lead.estimatedDealValue ?? 0;

  const leadSummary = buildLeadSummary(lead);
  const recommendedApproach = generateRecommendedApproach(lead, estimatedValue);
  const objectionPredictions = predictObjections(lead);

  escalationCounter += 1;
  const escalationId = `esc-${lead.tenantId}-${escalationCounter}-${Date.now()}`;

  const handoff: SalesHandoff = {
    escalationId,
    leadId: lead.id,
    repId: rep.id,
    leadSummary,
    scoringBreakdown: context.scoringBreakdown ?? [],
    conversationHighlights: context.conversationHighlights ?? [],
    recommendedApproach,
    objectionPredictions,
    estimatedValue,
    createdAt: new Date().toISOString(),
  };

  handoffStore.set(escalationId, handoff);

  const escalation: Escalation = {
    id: escalationId,
    leadId: lead.id,
    tenantId: lead.tenantId,
    type: classifyEscalationType(lead),
    priority: estimatedValue >= 20000 ? "critical" : estimatedValue >= HIGH_VALUE_THRESHOLD ? "high" : "medium",
    assignedRepId: rep.id,
    estimatedValue,
    signals: [],
    status: "assigned",
    createdAt: handoff.createdAt,
    updatedAt: handoff.createdAt,
  };
  escalationStore.set(escalationId, escalation);

  persistEscalation(escalation);

  return handoff;
}

function buildLeadSummary(lead: LeadForEscalation): string {
  const parts: string[] = [];
  if (lead.name) parts.push(`Name: ${lead.name}`);
  if (lead.email) parts.push(`Email: ${lead.email}`);
  if (lead.phone) parts.push(`Phone: ${lead.phone}`);
  if (lead.company) parts.push(`Company: ${lead.company}`);
  if (lead.companySize) parts.push(`Company Size: ${lead.companySize}`);
  if (lead.niche) parts.push(`Niche: ${lead.niche}`);
  if (lead.estimatedDealValue) parts.push(`Estimated Deal: $${lead.estimatedDealValue}`);
  return parts.join(" | ");
}

function generateRecommendedApproach(lead: LeadForEscalation, estimatedValue: number): string {
  if (estimatedValue >= 20000) {
    return "Executive outreach with customized ROI analysis. Schedule a strategy session with senior team.";
  }
  if (estimatedValue >= HIGH_VALUE_THRESHOLD) {
    return "Consultative approach with case studies from similar businesses. Focus on pain points and measurable outcomes.";
  }
  if (lead.phone) {
    return "Direct phone follow-up within 5 minutes. Lead has shown high intent by providing phone number.";
  }
  return "Personalized email with relevant case study, followed by a phone call within 24 hours.";
}

function predictObjections(lead: LeadForEscalation): string[] {
  const objections: string[] = [];
  const niche = (lead.niche ?? "").toLowerCase();

  objections.push("Price sensitivity - be ready to demonstrate ROI with concrete numbers");

  if (["lawyer", "attorney"].includes(niche)) {
    objections.push("Compliance concerns - prepare regulatory compliance documentation");
  }
  if (["plumber", "electrician", "hvac"].includes(niche)) {
    objections.push("Time constraints - emphasize hands-off setup and ongoing management");
  }
  if (lead.companySize === "enterprise" || lead.companySize === "1000+") {
    objections.push("Integration complexity - have technical architecture overview ready");
    objections.push("Security requirements - prepare SOC2 and data handling documentation");
  }

  return objections;
}

async function persistEscalation(escalation: Escalation): Promise<void> {
  try {
    await ensureEscalationSchema();
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO lead_os_escalations (id, lead_id, tenant_id, type, priority, assigned_rep_id, estimated_value, signals, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        escalation.id, escalation.leadId, escalation.tenantId, escalation.type,
        escalation.priority, escalation.assignedRepId, escalation.estimatedValue,
        JSON.stringify(escalation.signals), escalation.status,
        escalation.createdAt, escalation.updatedAt,
      ],
    );
  } catch {
    // In-memory store is the fallback
  }
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

export function scheduleCallback(
  lead: LeadForEscalation,
  repId: string,
  preferredTime: string,
): CallbackTask {
  callbackCounter += 1;
  const id = `cb-${lead.tenantId}-${callbackCounter}-${Date.now()}`;
  const escalationId = findEscalationForLead(lead.id) ?? id;

  const task: CallbackTask = {
    id,
    escalationId,
    leadId: lead.id,
    repId,
    preferredTime,
    leadContext: buildLeadSummary(lead),
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  callbackStore.set(id, task);
  return task;
}

function findEscalationForLead(leadId: string): string | undefined {
  for (const esc of escalationStore.values()) {
    if (esc.leadId === leadId) return esc.id;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationResult {
  channels: string[];
  sentAt: string;
  escalationId: string;
}

export function notifySalesTeam(escalation: Escalation): NotificationResult {
  const channels: string[] = [];

  channels.push("dashboard");
  channels.push("email");

  if (escalation.priority === "critical" || escalation.priority === "high") {
    channels.push("sms");
    channels.push("slack");
  }

  return {
    channels,
    sentAt: new Date().toISOString(),
    escalationId: escalation.id,
  };
}

export function notifyHighValueLead(
  lead: LeadForEscalation,
  estimatedValue: number,
): NotificationResult {
  const channels = ["dashboard", "email", "sms", "slack"];

  escalationCounter += 1;
  const escalationId = `hvl-${lead.tenantId}-${escalationCounter}-${Date.now()}`;

  return {
    channels,
    sentAt: new Date().toISOString(),
    escalationId,
  };
}

// ---------------------------------------------------------------------------
// Outcome Tracking
// ---------------------------------------------------------------------------

export async function recordEscalationOutcome(
  escalationId: string,
  outcome: EscalationOutcome["outcome"],
  dealValue: number = 0,
  notes: string = "",
): Promise<EscalationOutcome> {
  const record: EscalationOutcome = {
    escalationId,
    outcome,
    dealValue,
    notes,
    recordedAt: new Date().toISOString(),
  };

  outcomeStore.set(escalationId, record);

  const escalation = escalationStore.get(escalationId);
  if (escalation) {
    escalation.status = outcome === "won" ? "completed" : outcome === "rescheduled" ? "in-progress" : "completed";
    escalation.updatedAt = record.recordedAt;
  }

  try {
    await ensureEscalationSchema();
    const pool = getPool();
    if (pool) {
      await pool.query(
        `INSERT INTO lead_os_escalation_outcomes (escalation_id, outcome, deal_value, notes, recorded_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (escalation_id) DO UPDATE SET outcome = $2, deal_value = $3, notes = $4, recorded_at = $5`,
        [record.escalationId, record.outcome, record.dealValue, record.notes, record.recordedAt],
      );
    }
  } catch {
    // In-memory store is the fallback
  }

  return record;
}

export function getEscalationMetrics(tenantId: string, period: string): EscalationMetrics {
  const escalations: Escalation[] = [];
  for (const esc of escalationStore.values()) {
    if (esc.tenantId !== tenantId) continue;
    if (!esc.createdAt.startsWith(period)) continue;
    escalations.push(esc);
  }

  const outcomeBreakdown: Record<string, number> = {};
  const repWins: Record<string, number> = {};
  const repTotal: Record<string, number> = {};
  let totalDealValue = 0;
  let wonCount = 0;

  for (const esc of escalations) {
    const outcome = outcomeStore.get(esc.id);
    if (outcome) {
      outcomeBreakdown[outcome.outcome] = (outcomeBreakdown[outcome.outcome] ?? 0) + 1;
      if (outcome.outcome === "won") {
        wonCount += 1;
        totalDealValue += outcome.dealValue;
        if (esc.assignedRepId) {
          repWins[esc.assignedRepId] = (repWins[esc.assignedRepId] ?? 0) + 1;
        }
      }
      if (esc.assignedRepId) {
        repTotal[esc.assignedRepId] = (repTotal[esc.assignedRepId] ?? 0) + 1;
      }
    }
  }

  const closeRateByRep: Record<string, number> = {};
  for (const repId of Object.keys(repTotal)) {
    const wins = repWins[repId] ?? 0;
    const total = repTotal[repId];
    closeRateByRep[repId] = total > 0 ? Math.round((wins / total) * 10000) / 100 : 0;
  }

  const conversionRate = escalations.length > 0
    ? Math.round((wonCount / escalations.length) * 10000) / 100
    : 0;

  const averageDealSize = wonCount > 0 ? Math.round((totalDealValue / wonCount) * 100) / 100 : 0;

  return {
    tenantId,
    period,
    totalEscalations: escalations.length,
    conversionRate,
    averageDealSize,
    averageResponseTimeMinutes: 0,
    outcomeBreakdown,
    closeRateByRep,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// MCP convenience wrappers
// ---------------------------------------------------------------------------

export async function evaluateEscalation(
  leadKey: string,
  score: number,
  signals?: Record<string, unknown>,
): Promise<{ shouldEscalate: boolean; reasons: string[]; escalationType: EscalationType | null }> {
  const lead: LeadForEscalation = { id: leadKey, tenantId: "default" };
  const parsed: EscalationSignals = {
    compositeScore: score,
    estimatedDealValue: typeof signals?.estimatedDealValue === "number" ? signals.estimatedDealValue : undefined,
    hasPhoneRequest: signals?.hasPhoneRequest === true,
    competitorMentioned: signals?.competitorMentioned === true,
    urgencyLevel: typeof signals?.urgencyLevel === "string" ? signals.urgencyLevel as EscalationSignals["urgencyLevel"] : undefined,
    companySize: typeof signals?.companySize === "string" ? signals.companySize : undefined,
    explicitCallRequest: signals?.explicitCallRequest === true,
  };
  if (parsed.companySize) lead.companySize = parsed.companySize;
  if (typeof signals?.phone === "string") lead.phone = signals.phone;
  if (typeof signals?.estimatedDealValue === "number") lead.estimatedDealValue = signals.estimatedDealValue;

  const result = shouldEscalate(lead, score, parsed);
  const escalationType = result.escalate ? classifyEscalationType(lead) : null;
  return { shouldEscalate: result.escalate, reasons: result.reasons, escalationType };
}

export async function createHandoff(
  leadKey: string,
  assignee: string,
  context?: string,
): Promise<SalesHandoff> {
  const lead: LeadForEscalation = { id: leadKey, tenantId: "default" };
  const rep: SalesRep = {
    id: assignee,
    name: assignee,
    email: "",
    phone: "",
    niches: [],
    timezone: "UTC",
    maxDailyCapacity: 100,
    currentDailyLoad: 0,
    isAvailable: true,
    closingRate: 0.5,
  };
  return createSalesHandoff(lead, rep, {
    conversationHighlights: context ? [context] : [],
  });
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  escalationStore.clear();
  outcomeStore.clear();
  callbackStore.clear();
  handoffStore.clear();
  escalationCounter = 0;
  callbackCounter = 0;
}
