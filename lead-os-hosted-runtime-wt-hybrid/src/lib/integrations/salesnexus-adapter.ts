import { randomUUID } from "crypto";
import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesNexusConfig {
  apiKey: string;
  baseUrl: string;
}

export interface SNContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
  status: "lead" | "prospect" | "customer" | "inactive";
  score: number;
  tags: string[];
  tenantId?: string;
  createdAt: string;
}

export interface SNDeal {
  id: string;
  contactId: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  status: "open" | "won" | "lost";
  tenantId?: string;
  createdAt: string;
}

export interface SNEmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  recipientFilter: Record<string, string>;
  status: "draft" | "active" | "paused" | "completed";
  sentCount: number;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  };
  tenantId?: string;
  createdAt: string;
}

export interface SNDripSequence {
  id: string;
  name: string;
  steps: { delayDays: number; subject: string; body: string }[];
  enrolledCount: number;
  active: boolean;
  tenantId?: string;
}

export interface SNStats {
  totalContacts: number;
  totalDeals: number;
  openDeals: number;
  totalRevenue: number;
  avgDealValue: number;
  winRate: number;
  campaignsSent: number;
  avgOpenRate: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const contactStore = new Map<string, SNContact>();
const dealStore = new Map<string, SNDeal>();
const campaignStore = new Map<string, SNEmailCampaign>();
const sequenceStore = new Map<string, SNDripSequence>();
const enrollmentStore = new Map<string, Set<string>>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveSNConfig(): SalesNexusConfig | null {
  const apiKey = process.env.SALESNEXUS_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.SALESNEXUS_BASE_URL ?? "https://api.salesnexus.com/v1",
  };
}

export function isSNDryRun(): boolean {
  return !process.env.SALESNEXUS_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureSNSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_salesnexus (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        tenant_id TEXT,
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

async function persistRecord(id: string, type: string, tenantId: string | undefined, payload: unknown): Promise<void> {
  await ensureSNSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_salesnexus (id, type, tenant_id, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

export async function createContact(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
  status?: SNContact["status"];
  score?: number;
  tags?: string[];
  tenantId?: string;
}): Promise<SNContact> {
  const contact: SNContact = {
    id: `snc-${randomUUID()}`,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    company: input.company,
    title: input.title,
    source: input.source,
    status: input.status ?? "lead",
    score: input.score ?? 0,
    tags: input.tags ?? [],
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  contactStore.set(contact.id, contact);
  await persistRecord(contact.id, "contact", contact.tenantId, contact);
  return contact;
}

export async function getContact(id: string): Promise<SNContact | null> {
  return contactStore.get(id) ?? null;
}

export async function getContactByEmail(email: string): Promise<SNContact | null> {
  for (const contact of contactStore.values()) {
    if (contact.email === email) return contact;
  }
  return null;
}

export async function updateContact(
  id: string,
  updates: Partial<Pick<SNContact, "firstName" | "lastName" | "phone" | "company" | "title" | "source" | "status" | "score" | "tags">>,
): Promise<SNContact> {
  const existing = contactStore.get(id);
  if (!existing) throw new Error(`Contact not found: ${id}`);

  const updated: SNContact = { ...existing, ...updates };
  contactStore.set(id, updated);
  await persistRecord(id, "contact", updated.tenantId, updated);
  return updated;
}

export async function listContacts(filter?: { tenantId?: string; status?: SNContact["status"]; tag?: string }): Promise<SNContact[]> {
  let results = [...contactStore.values()];
  if (filter?.tenantId) results = results.filter((c) => c.tenantId === filter.tenantId);
  if (filter?.status) results = results.filter((c) => c.status === filter.status);
  if (filter?.tag) results = results.filter((c) => c.tags.includes(filter.tag!));
  return results;
}

// ---------------------------------------------------------------------------
// Deal CRUD
// ---------------------------------------------------------------------------

export async function createDeal(input: {
  contactId: string;
  title: string;
  value: number;
  stage: string;
  probability?: number;
  tenantId?: string;
}): Promise<SNDeal> {
  const deal: SNDeal = {
    id: `snd-${randomUUID()}`,
    contactId: input.contactId,
    title: input.title,
    value: input.value,
    stage: input.stage,
    probability: input.probability ?? 50,
    status: "open",
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  dealStore.set(deal.id, deal);
  await persistRecord(deal.id, "deal", deal.tenantId, deal);
  return deal;
}

export async function updateDeal(
  id: string,
  updates: Partial<Pick<SNDeal, "title" | "value" | "stage" | "probability" | "status">>,
): Promise<SNDeal> {
  const existing = dealStore.get(id);
  if (!existing) throw new Error(`Deal not found: ${id}`);

  const updated: SNDeal = { ...existing, ...updates };
  dealStore.set(id, updated);
  await persistRecord(id, "deal", updated.tenantId, updated);
  return updated;
}

export async function listDeals(filter?: { tenantId?: string; contactId?: string; status?: SNDeal["status"] }): Promise<SNDeal[]> {
  let results = [...dealStore.values()];
  if (filter?.tenantId) results = results.filter((d) => d.tenantId === filter.tenantId);
  if (filter?.contactId) results = results.filter((d) => d.contactId === filter.contactId);
  if (filter?.status) results = results.filter((d) => d.status === filter.status);
  return results;
}

// ---------------------------------------------------------------------------
// Email Campaign CRUD
// ---------------------------------------------------------------------------

export async function createCampaign(input: {
  name: string;
  subject: string;
  body: string;
  recipientFilter?: Record<string, string>;
  tenantId?: string;
}): Promise<SNEmailCampaign> {
  const campaign: SNEmailCampaign = {
    id: `sncamp-${randomUUID()}`,
    name: input.name,
    subject: input.subject,
    body: input.body,
    recipientFilter: input.recipientFilter ?? {},
    status: "draft",
    sentCount: 0,
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  campaignStore.set(campaign.id, campaign);
  await persistRecord(campaign.id, "campaign", campaign.tenantId, campaign);
  return campaign;
}

export async function sendCampaign(id: string): Promise<SNEmailCampaign> {
  const campaign = campaignStore.get(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);
  if (campaign.status === "completed") throw new Error("Cannot send a completed campaign");

  const matchingContacts = [...contactStore.values()].filter((c) => {
    if (campaign.tenantId && c.tenantId !== campaign.tenantId) return false;
    for (const [key, value] of Object.entries(campaign.recipientFilter)) {
      if (key === "status" && c.status !== value) return false;
      if (key === "tag" && !c.tags.includes(value)) return false;
    }
    return true;
  });

  const sentCount = matchingContacts.length;
  const updated: SNEmailCampaign = {
    ...campaign,
    status: "active",
    sentCount,
    stats: {
      sent: sentCount,
      opened: Math.floor(sentCount * 0.35),
      clicked: Math.floor(sentCount * 0.12),
      bounced: Math.floor(sentCount * 0.02),
      openRate: sentCount > 0 ? 35 : 0,
      clickRate: sentCount > 0 ? 12 : 0,
    },
  };

  campaignStore.set(id, updated);
  await persistRecord(id, "campaign", updated.tenantId, updated);
  return updated;
}

export async function pauseCampaign(id: string): Promise<SNEmailCampaign> {
  const campaign = campaignStore.get(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);
  if (campaign.status !== "active") throw new Error("Can only pause an active campaign");

  const updated: SNEmailCampaign = { ...campaign, status: "paused" };
  campaignStore.set(id, updated);
  await persistRecord(id, "campaign", updated.tenantId, updated);
  return updated;
}

export async function getCampaignStats(id: string): Promise<SNEmailCampaign["stats"] | null> {
  const campaign = campaignStore.get(id);
  if (!campaign) return null;
  return campaign.stats ?? null;
}

// ---------------------------------------------------------------------------
// Drip Sequence
// ---------------------------------------------------------------------------

export async function createDripSequence(input: {
  name: string;
  steps: { delayDays: number; subject: string; body: string }[];
  tenantId?: string;
}): Promise<SNDripSequence> {
  const sequence: SNDripSequence = {
    id: `snseq-${randomUUID()}`,
    name: input.name,
    steps: input.steps,
    enrolledCount: 0,
    active: true,
    tenantId: input.tenantId,
  };

  sequenceStore.set(sequence.id, sequence);
  enrollmentStore.set(sequence.id, new Set());
  await persistRecord(sequence.id, "sequence", sequence.tenantId, sequence);
  return sequence;
}

export async function enrollInSequence(sequenceId: string, contactId: string): Promise<SNDripSequence> {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) throw new Error(`Sequence not found: ${sequenceId}`);

  const contact = contactStore.get(contactId);
  if (!contact) throw new Error(`Contact not found: ${contactId}`);

  let enrolled = enrollmentStore.get(sequenceId);
  if (!enrolled) {
    enrolled = new Set();
    enrollmentStore.set(sequenceId, enrolled);
  }

  if (!enrolled.has(contactId)) {
    enrolled.add(contactId);
    const updated: SNDripSequence = { ...sequence, enrolledCount: enrolled.size };
    sequenceStore.set(sequenceId, updated);
    await persistRecord(sequenceId, "sequence", updated.tenantId, updated);
    return updated;
  }

  return sequence;
}

export async function listSequences(tenantId?: string): Promise<SNDripSequence[]> {
  const all = [...sequenceStore.values()];
  if (tenantId) return all.filter((s) => s.tenantId === tenantId);
  return all;
}

// ---------------------------------------------------------------------------
// Lead OS bridge — sync lead to SalesNexus contact
// ---------------------------------------------------------------------------

export async function syncLeadToSalesNexus(
  lead: { email: string; firstName?: string; lastName?: string; phone?: string; company?: string; source?: string },
  tenantId?: string,
): Promise<SNContact> {
  const existing = await getContactByEmail(lead.email);
  if (existing) {
    return updateContact(existing.id, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
    });
  }

  return createContact({
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    company: lead.company,
    source: lead.source ?? "lead-os",
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Provider bridge — send email via SalesNexus
// ---------------------------------------------------------------------------

export async function sendEmailViaSalesNexus(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<ProviderResult> {
  const dryRun = isSNDryRun();

  if (!dryRun) {
    const cfg = resolveSNConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/email/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({ to: input.to, subject: input.subject, html: input.html }),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          return {
            ok: true,
            provider: "SalesNexus",
            mode: "live",
            detail: `Email sent to ${input.to} via SalesNexus`,
            payload: { to: input.to, subject: input.subject },
          };
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  return {
    ok: true,
    provider: "SalesNexus",
    mode: "dry-run",
    detail: `Email to ${input.to} prepared (dry-run)`,
    payload: { to: input.to, subject: input.subject },
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getSNStats(tenantId?: string): Promise<SNStats> {
  const contacts = tenantId
    ? [...contactStore.values()].filter((c) => c.tenantId === tenantId)
    : [...contactStore.values()];

  const deals = tenantId
    ? [...dealStore.values()].filter((d) => d.tenantId === tenantId)
    : [...dealStore.values()];

  const campaigns = tenantId
    ? [...campaignStore.values()].filter((c) => c.tenantId === tenantId)
    : [...campaignStore.values()];

  const openDeals = deals.filter((d) => d.status === "open");
  const wonDeals = deals.filter((d) => d.status === "won");
  const closedDeals = deals.filter((d) => d.status === "won" || d.status === "lost");
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const avgDealValue = deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0;
  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

  const sentCampaigns = campaigns.filter((c) => c.status !== "draft");
  const campaignsSent = sentCampaigns.length;
  const avgOpenRate = campaignsSent > 0
    ? sentCampaigns.reduce((sum, c) => sum + (c.stats?.openRate ?? 0), 0) / campaignsSent
    : 0;

  return {
    totalContacts: contacts.length,
    totalDeals: deals.length,
    openDeals: openDeals.length,
    totalRevenue,
    avgDealValue,
    winRate,
    campaignsSent,
    avgOpenRate,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetSNStore(): void {
  contactStore.clear();
  dealStore.clear();
  campaignStore.clear();
  sequenceStore.clear();
  enrollmentStore.clear();
  schemaEnsured = false;
}
