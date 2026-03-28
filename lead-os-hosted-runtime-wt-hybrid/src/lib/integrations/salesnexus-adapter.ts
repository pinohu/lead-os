import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesNexusConfig {
  apiKey: string;
  baseUrl: string;
}

export interface Contact {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  score?: number;
  stage: "lead" | "prospect" | "opportunity" | "customer" | "churned";
  tags: string[];
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  stages: string[];
  createdAt: string;
}

export interface Deal {
  id: string;
  tenantId: string;
  contactId: string;
  pipelineId: string;
  stage: string;
  value: number;
  currency: string;
  status: "open" | "won" | "lost";
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const contactStore = new Map<string, Contact>();
const pipelineStore = new Map<string, Pipeline>();
const dealStore = new Map<string, Deal>();

export function resetSalesNexusStore(): void {
  contactStore.clear();
  pipelineStore.clear();
  dealStore.clear();
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: Partial<SalesNexusConfig>): SalesNexusConfig {
  return {
    apiKey: config?.apiKey ?? process.env.SALESNEXUS_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.SALESNEXUS_BASE_URL ?? "https://api.salesnexus.com/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: Partial<SalesNexusConfig>): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "SalesNexus API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/account`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return res.ok
      ? { ok: true, message: "SalesNexus connection verified" }
      : { ok: false, message: `SalesNexus returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

export async function createContact(
  tenantId: string,
  data: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
    score?: number;
    tags?: string[];
    customFields?: Record<string, string>;
  },
): Promise<Contact> {
  const now = new Date().toISOString();
  const contact: Contact = {
    id: `snc-${randomUUID()}`,
    tenantId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    company: data.company,
    phone: data.phone,
    score: data.score,
    stage: "lead",
    tags: data.tags ?? [],
    customFields: data.customFields ?? {},
    createdAt: now,
    updatedAt: now,
  };
  contactStore.set(contact.id, contact);
  return contact;
}

export async function getContact(contactId: string): Promise<Contact | undefined> {
  return contactStore.get(contactId);
}

export async function listContacts(tenantId: string): Promise<Contact[]> {
  return [...contactStore.values()].filter((c) => c.tenantId === tenantId);
}

export async function updateContact(
  contactId: string,
  updates: Partial<Pick<Contact, "firstName" | "lastName" | "company" | "phone" | "score" | "stage" | "tags" | "customFields">>,
): Promise<Contact> {
  const contact = contactStore.get(contactId);
  if (!contact) throw new Error(`Contact not found: ${contactId}`);

  const updated: Contact = {
    ...contact,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  contactStore.set(contactId, updated);
  return updated;
}

export async function deleteContact(contactId: string): Promise<boolean> {
  return contactStore.delete(contactId);
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function createPipeline(
  tenantId: string,
  name: string,
  stages: string[],
): Promise<Pipeline> {
  const pipeline: Pipeline = {
    id: `pipe-${randomUUID()}`,
    tenantId,
    name,
    stages,
    createdAt: new Date().toISOString(),
  };
  pipelineStore.set(pipeline.id, pipeline);
  return pipeline;
}

export async function getPipeline(pipelineId: string): Promise<Pipeline | undefined> {
  return pipelineStore.get(pipelineId);
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function createDeal(
  tenantId: string,
  contactId: string,
  pipelineId: string,
  stage: string,
  value: number,
  currency = "USD",
): Promise<Deal> {
  const now = new Date().toISOString();
  const deal: Deal = {
    id: `deal-${randomUUID()}`,
    tenantId,
    contactId,
    pipelineId,
    stage,
    value,
    currency,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  dealStore.set(deal.id, deal);
  return deal;
}

export async function getDeal(dealId: string): Promise<Deal | undefined> {
  return dealStore.get(dealId);
}

export async function listDeals(tenantId: string): Promise<Deal[]> {
  return [...dealStore.values()].filter((d) => d.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Bi-directional sync
// ---------------------------------------------------------------------------

export async function syncLeadsToSalesNexus(
  tenantId: string,
  leads: { email: string; firstName: string; lastName: string; score?: number; tags?: string[] }[],
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      const existing = [...contactStore.values()].find(
        (c) => c.tenantId === tenantId && c.email === lead.email,
      );

      if (existing) {
        await updateContact(existing.id, {
          firstName: lead.firstName,
          lastName: lead.lastName,
          score: lead.score,
          tags: lead.tags,
        });
        updated++;
      } else {
        await createContact(tenantId, lead);
        created++;
      }
    } catch (err) {
      errors.push(`Failed to sync ${lead.email}: ${err instanceof Error ? err.message : "unknown"}`);
      skipped++;
    }
  }

  return { created, updated, skipped, errors };
}

export async function pullCrmUpdates(tenantId: string): Promise<Contact[]> {
  return listContacts(tenantId);
}
