import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Flowlu CRM & Project Management Types
// ---------------------------------------------------------------------------

export interface FlowluConfig {
  apiKey: string;
  domain: string;
  baseUrl: string;
}

export interface FlowluContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  tags: string[];
  customFields: Record<string, string>;
  tenantId?: string;
  createdAt: string;
}

export interface FlowluDeal {
  id: string;
  title: string;
  contactId: string;
  stageId: string;
  stageName: string;
  amount: number;
  currency: string;
  probability: number;
  status: "open" | "won" | "lost";
  expectedCloseDate?: string;
  tenantId?: string;
  createdAt: string;
}

export interface FlowluPipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; order: number }[];
  tenantId?: string;
}

export interface FlowluTask {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  dealId?: string;
  contactId?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  tenantId?: string;
  createdAt: string;
}

export interface FlowluStats {
  totalContacts: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  avgDealSize: number;
  winRate: number;
  byStage: Record<string, number>;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const contactStore = new Map<string, FlowluContact>();
const dealStore = new Map<string, FlowluDeal>();
const pipelineStore = new Map<string, FlowluPipeline>();
const taskStore = new Map<string, FlowluTask>();

let schemaEnsured = false;
let contactSeq = 0;
let dealSeq = 0;
let pipelineSeq = 0;
let taskSeq = 0;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveFlowluConfig(): FlowluConfig | null {
  const apiKey = process.env.FLOWLU_API_KEY ?? "";
  if (!apiKey) return null;

  const domain = process.env.FLOWLU_DOMAIN ?? "";
  if (!domain) return null;

  const baseUrl =
    process.env.FLOWLU_BASE_URL ??
    `https://${domain}.flowlu.com/api/v1`;

  return { apiKey, domain, baseUrl };
}

export function isFlowluDryRun(): boolean {
  return !process.env.FLOWLU_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureFlowluSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_flowlu (
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
    // Schema creation failed -- fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// DB persistence helper
// ---------------------------------------------------------------------------

async function persistToDb(
  id: string,
  type: string,
  tenantId: string | undefined,
  payload: unknown,
): Promise<void> {
  await ensureFlowluSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_flowlu (id, type, tenant_id, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed -- in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export async function createContact(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, string>;
  tenantId?: string;
}): Promise<FlowluContact> {
  contactSeq += 1;
  const id = `fl_contact_${contactSeq}`;
  const now = new Date().toISOString();

  const contact: FlowluContact = {
    id,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    position: input.position,
    source: input.source ?? "api",
    tags: input.tags ?? [],
    customFields: input.customFields ?? {},
    tenantId: input.tenantId,
    createdAt: now,
  };

  contactStore.set(id, contact);
  await persistToDb(id, "contact", input.tenantId, contact);

  return contact;
}

export async function getContact(id: string): Promise<FlowluContact | null> {
  return contactStore.get(id) ?? null;
}

export async function getContactByEmail(email: string): Promise<FlowluContact | null> {
  for (const contact of contactStore.values()) {
    if (contact.email === email) return contact;
  }
  return null;
}

export async function listContacts(tenantId?: string): Promise<FlowluContact[]> {
  const all = [...contactStore.values()];
  if (!tenantId) return all;
  return all.filter((c) => c.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Pipelines
// ---------------------------------------------------------------------------

export async function createPipeline(input: {
  name: string;
  stages: { name: string; order: number }[];
  tenantId?: string;
}): Promise<FlowluPipeline> {
  pipelineSeq += 1;
  const id = `fl_pipeline_${pipelineSeq}`;

  const stages = input.stages.map((s, i) => ({
    id: `fl_stage_${pipelineSeq}_${i + 1}`,
    name: s.name,
    order: s.order,
  }));

  const pipeline: FlowluPipeline = {
    id,
    name: input.name,
    stages,
    tenantId: input.tenantId,
  };

  pipelineStore.set(id, pipeline);
  await persistToDb(id, "pipeline", input.tenantId, pipeline);

  return pipeline;
}

export async function listPipelines(tenantId?: string): Promise<FlowluPipeline[]> {
  const all = [...pipelineStore.values()];
  if (!tenantId) return all;
  return all.filter((p) => p.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function createDeal(input: {
  title: string;
  contactId: string;
  stageId: string;
  stageName: string;
  amount?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  tenantId?: string;
}): Promise<FlowluDeal> {
  dealSeq += 1;
  const id = `fl_deal_${dealSeq}`;
  const now = new Date().toISOString();

  const deal: FlowluDeal = {
    id,
    title: input.title,
    contactId: input.contactId,
    stageId: input.stageId,
    stageName: input.stageName,
    amount: input.amount ?? 0,
    currency: input.currency ?? "USD",
    probability: input.probability ?? 0,
    status: "open",
    expectedCloseDate: input.expectedCloseDate,
    tenantId: input.tenantId,
    createdAt: now,
  };

  dealStore.set(id, deal);
  await persistToDb(id, "deal", input.tenantId, deal);

  return deal;
}

export async function moveDealToStage(
  dealId: string,
  stageId: string,
  stageName: string,
): Promise<FlowluDeal | null> {
  const deal = dealStore.get(dealId);
  if (!deal) return null;

  deal.stageId = stageId;
  deal.stageName = stageName;

  dealStore.set(dealId, deal);
  await persistToDb(dealId, "deal", deal.tenantId, deal);

  return deal;
}

export async function updateDealStatus(
  dealId: string,
  status: "won" | "lost",
): Promise<FlowluDeal | null> {
  const deal = dealStore.get(dealId);
  if (!deal) return null;

  deal.status = status;
  if (status === "won") {
    deal.probability = 100;
  } else {
    deal.probability = 0;
  }

  dealStore.set(dealId, deal);
  await persistToDb(dealId, "deal", deal.tenantId, deal);

  return deal;
}

export async function listDeals(filter?: {
  stageId?: string;
  status?: string;
  contactId?: string;
  tenantId?: string;
}): Promise<FlowluDeal[]> {
  let results = [...dealStore.values()];

  if (filter?.stageId) {
    results = results.filter((d) => d.stageId === filter.stageId);
  }
  if (filter?.status) {
    results = results.filter((d) => d.status === filter.status);
  }
  if (filter?.contactId) {
    results = results.filter((d) => d.contactId === filter.contactId);
  }
  if (filter?.tenantId) {
    results = results.filter((d) => d.tenantId === filter.tenantId);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(input: {
  title: string;
  description?: string;
  assigneeId?: string;
  dealId?: string;
  contactId?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  tenantId?: string;
}): Promise<FlowluTask> {
  taskSeq += 1;
  const id = `fl_task_${taskSeq}`;
  const now = new Date().toISOString();

  const task: FlowluTask = {
    id,
    title: input.title,
    description: input.description,
    assigneeId: input.assigneeId,
    dealId: input.dealId,
    contactId: input.contactId,
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate,
    tenantId: input.tenantId,
    createdAt: now,
  };

  taskStore.set(id, task);
  await persistToDb(id, "task", input.tenantId, task);

  return task;
}

export async function listTasks(filter?: {
  dealId?: string;
  contactId?: string;
  status?: string;
  assigneeId?: string;
  tenantId?: string;
}): Promise<FlowluTask[]> {
  let results = [...taskStore.values()];

  if (filter?.dealId) {
    results = results.filter((t) => t.dealId === filter.dealId);
  }
  if (filter?.contactId) {
    results = results.filter((t) => t.contactId === filter.contactId);
  }
  if (filter?.status) {
    results = results.filter((t) => t.status === filter.status);
  }
  if (filter?.assigneeId) {
    results = results.filter((t) => t.assigneeId === filter.assigneeId);
  }
  if (filter?.tenantId) {
    results = results.filter((t) => t.tenantId === filter.tenantId);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Lead sync
// ---------------------------------------------------------------------------

export async function syncLeadToFlowlu(
  lead: {
    email: string;
    name: string;
    phone?: string;
    company?: string;
    source?: string;
  },
  tenantId?: string,
): Promise<ProviderResult> {
  const nameParts = lead.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const existing = await getContactByEmail(lead.email);
  const contact = existing ?? await createContact({
    firstName,
    lastName,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source ?? "lead-os",
    tenantId,
  });

  const deal = await createDeal({
    title: `Lead: ${lead.name}`,
    contactId: contact.id,
    stageId: "new",
    stageName: "New",
    tenantId,
  });

  return {
    ok: true,
    provider: "Flowlu",
    mode: isFlowluDryRun() ? "dry-run" : "live",
    detail: `[sync] Contact ${contact.id} and deal ${deal.id} created for ${lead.email}`,
    payload: {
      contactId: contact.id,
      dealId: deal.id,
      email: lead.email,
      tenantId: tenantId ?? contact.tenantId,
    },
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getFlowluStats(tenantId?: string): Promise<FlowluStats> {
  const contacts = tenantId
    ? [...contactStore.values()].filter((c) => c.tenantId === tenantId)
    : [...contactStore.values()];

  const deals = tenantId
    ? [...dealStore.values()].filter((d) => d.tenantId === tenantId)
    : [...dealStore.values()];

  const openDeals = deals.filter((d) => d.status === "open");
  const wonDeals = deals.filter((d) => d.status === "won");
  const lostDeals = deals.filter((d) => d.status === "lost");
  const closedDeals = wonDeals.length + lostDeals.length;
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.amount, 0);

  const byStage: Record<string, number> = {};
  for (const deal of deals) {
    byStage[deal.stageName] = (byStage[deal.stageName] ?? 0) + 1;
  }

  return {
    totalContacts: contacts.length,
    totalDeals: deals.length,
    openDeals: openDeals.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    totalRevenue,
    avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
    winRate: closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0,
    byStage,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function flowluResult(op: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "Flowlu",
    mode: isFlowluDryRun() ? "dry-run" : "live",
    detail: `[${op}] ${detail}`,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetFlowluStore(): void {
  contactStore.clear();
  dealStore.clear();
  pipelineStore.clear();
  taskStore.clear();
  contactSeq = 0;
  dealSeq = 0;
  pipelineSeq = 0;
  taskSeq = 0;
  schemaEnsured = false;
}
