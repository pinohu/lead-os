import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// LeadRocks Types
// ---------------------------------------------------------------------------

export interface LeadRocksConfig {
  apiKey: string;
  baseUrl: string;
}

export interface LeadRocksSearchParams {
  jobTitle?: string;
  company?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  seniority?: string;
  limit?: number;
  offset?: number;
}

export interface LeadRocksContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  linkedinUrl?: string;
  jobTitle: string;
  company: string;
  companyDomain?: string;
  industry: string;
  location: string;
  seniority: string;
  companySize: string;
}

export interface LeadRocksSearchResult {
  contacts: LeadRocksContact[];
  total: number;
  creditsUsed: number;
  hasMore: boolean;
}

export interface LinkedInEnrichInput {
  linkedinUrl: string;
}

export interface EmailEnrichInput {
  email: string;
}

export interface LeadRocksStats {
  totalSearches: number;
  totalContacts: number;
  creditsUsed: number;
  topIndustries: { industry: string; count: number }[];
  topTitles: { title: string; count: number }[];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const contactStore = new Map<string, LeadRocksContact>();
const searchStore: {
  params: LeadRocksSearchParams;
  contactIds: string[];
  creditsUsed: number;
  searchedAt: string;
  tenantId?: string;
}[] = [];

let schemaInitialized = false;

export function resetLeadRocksStore(): void {
  contactStore.clear();
  searchStore.length = 0;
  schemaInitialized = false;
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveLeadRocksConfig(): LeadRocksConfig | null {
  const apiKey = process.env.LEADROCKS_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.LEADROCKS_BASE_URL ?? "https://api.leadrocks.io/api/v1",
  };
}

export function isLeadRocksDryRun(): boolean {
  return !process.env.LEADROCKS_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema init (lazy)
// ---------------------------------------------------------------------------

async function ensureLeadRocksSchema(): Promise<void> {
  if (schemaInitialized) return;
  const pool = getPool();
  if (!pool) {
    schemaInitialized = true;
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_leadrocks_contacts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        email TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        found_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaInitialized = true;
  } catch {
    schemaInitialized = true;
  }
}

// ---------------------------------------------------------------------------
// Dry-run fake data generators
// ---------------------------------------------------------------------------

const FIRST_NAMES = ["Alex", "Morgan", "Jordan", "Taylor", "Casey", "Riley", "Quinn", "Avery", "Blake", "Dakota"];
const LAST_NAMES = ["Chen", "Patel", "Garcia", "Williams", "Kim", "Anderson", "Nakamura", "Mueller", "Silva", "Oconnor"];
const SENIORITY_LEVELS = ["Junior", "Mid-Level", "Senior", "Director", "VP", "C-Level"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Manufacturing", "Education", "Marketing", "Retail", "Energy"];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFakeContact(params: LeadRocksSearchParams, index: number): LeadRocksContact {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[index % LAST_NAMES.length];
  const company = params.company ?? `Acme Corp ${index + 1}`;
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  const jobTitle = params.jobTitle ?? pickRandom(["Software Engineer", "Product Manager", "Marketing Director", "Sales Lead", "CTO"]);
  const industry = params.industry ?? pickRandom(INDUSTRIES);
  const location = params.location ?? "San Francisco, CA";
  const seniority = params.seniority ?? pickRandom(SENIORITY_LEVELS);
  const companySize = params.companySize ?? pickRandom(COMPANY_SIZES);

  return {
    id: `lr-${randomUUID()}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    emailVerified: Math.random() > 0.2,
    phone: Math.random() > 0.4 ? `+1-555-${String(1000 + index).slice(0, 4)}` : undefined,
    linkedinUrl: Math.random() > 0.3 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${index}` : undefined,
    jobTitle,
    company,
    companyDomain: domain,
    industry,
    location,
    seniority,
    companySize,
  };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function searchContacts(params: LeadRocksSearchParams): Promise<LeadRocksSearchResult> {
  const limit = params.limit ?? 10;
  const offset = params.offset ?? 0;

  if (isLeadRocksDryRun()) {
    const count = Math.min(limit, 5 + Math.floor(Math.random() * 6));
    const contacts: LeadRocksContact[] = [];
    for (let i = 0; i < count; i++) {
      contacts.push(generateFakeContact(params, offset + i));
    }
    const total = offset + count + Math.floor(Math.random() * 20);
    const creditsUsed = contacts.length;

    searchStore.push({
      params,
      contactIds: contacts.map((c) => c.id),
      creditsUsed,
      searchedAt: new Date().toISOString(),
    });

    for (const c of contacts) {
      contactStore.set(c.id, c);
    }

    return { contacts, total, creditsUsed, hasMore: offset + contacts.length < total };
  }

  const cfg = resolveLeadRocksConfig();
  if (!cfg) {
    return { contacts: [], total: 0, creditsUsed: 0, hasMore: false };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ ...params, limit, offset }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as LeadRocksSearchResult;
      for (const c of data.contacts) {
        contactStore.set(c.id, c);
      }
      searchStore.push({
        params,
        contactIds: data.contacts.map((c) => c.id),
        creditsUsed: data.creditsUsed,
        searchedAt: new Date().toISOString(),
      });
      return data;
    }
  } catch {
    // fall through
  }

  return { contacts: [], total: 0, creditsUsed: 0, hasMore: false };
}

export async function enrichFromLinkedIn(input: LinkedInEnrichInput): Promise<LeadRocksContact | null> {
  if (isLeadRocksDryRun()) {
    const urlParts = input.linkedinUrl.split("/").filter(Boolean);
    const slug = urlParts[urlParts.length - 1] ?? "unknown";
    const nameParts = slug.split("-").filter((p) => p.length > 1);
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "John";
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "Doe";
    const domain = `${lastName.toLowerCase()}corp.com`;

    const contact: LeadRocksContact = {
      id: `lr-${randomUUID()}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      emailVerified: true,
      linkedinUrl: input.linkedinUrl,
      jobTitle: "Senior Manager",
      company: `${lastName} Corp`,
      companyDomain: domain,
      industry: "Technology",
      location: "New York, NY",
      seniority: "Senior",
      companySize: "51-200",
    };

    contactStore.set(contact.id, contact);
    return contact;
  }

  const cfg = resolveLeadRocksConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${cfg.baseUrl}/enrich/linkedin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ linkedinUrl: input.linkedinUrl }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { contact?: LeadRocksContact };
      if (data.contact) {
        contactStore.set(data.contact.id, data.contact);
        return data.contact;
      }
    }
  } catch {
    // fall through
  }

  return null;
}

export async function enrichFromEmail(input: EmailEnrichInput): Promise<LeadRocksContact | null> {
  if (isLeadRocksDryRun()) {
    const [localPart, domain] = input.email.split("@");
    const nameParts = (localPart ?? "john.doe").split(".");
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "John";
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "Doe";
    const companyName = (domain ?? "example.com").replace(/\.(com|io|co|org|net)$/i, "");
    const formattedCompany = companyName.charAt(0).toUpperCase() + companyName.slice(1);

    const contact: LeadRocksContact = {
      id: `lr-${randomUUID()}`,
      firstName,
      lastName,
      email: input.email,
      emailVerified: true,
      jobTitle: "Business Development",
      company: formattedCompany,
      companyDomain: domain ?? "example.com",
      industry: "Technology",
      location: "San Francisco, CA",
      seniority: "Mid-Level",
      companySize: "51-200",
    };

    contactStore.set(contact.id, contact);
    return contact;
  }

  const cfg = resolveLeadRocksConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${cfg.baseUrl}/enrich/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ email: input.email }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { contact?: LeadRocksContact };
      if (data.contact) {
        contactStore.set(data.contact.id, data.contact);
        return data.contact;
      }
    }
  } catch {
    // fall through
  }

  return null;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function saveSearchResults(contacts: LeadRocksContact[], tenantId?: string): Promise<void> {
  await ensureLeadRocksSchema();

  for (const c of contacts) {
    contactStore.set(c.id, c);
  }

  const pool = getPool();
  if (!pool) return;

  try {
    for (const c of contacts) {
      await pool.query(
        `INSERT INTO lead_os_leadrocks_contacts (id, tenant_id, email, payload, found_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET payload = $4, tenant_id = COALESCE($2, lead_os_leadrocks_contacts.tenant_id)`,
        [c.id, tenantId ?? null, c.email, JSON.stringify(c)],
      );
    }
  } catch {
    // in-memory store is already populated
  }
}

export async function getStoredContacts(tenantId?: string, limit?: number): Promise<LeadRocksContact[]> {
  await ensureLeadRocksSchema();

  const pool = getPool();
  if (pool) {
    try {
      const query = tenantId
        ? `SELECT payload FROM lead_os_leadrocks_contacts WHERE tenant_id = $1 ORDER BY found_at DESC LIMIT $2`
        : `SELECT payload FROM lead_os_leadrocks_contacts ORDER BY found_at DESC LIMIT $1`;
      const params = tenantId ? [tenantId, limit ?? 100] : [limit ?? 100];
      const result = await pool.query<{ payload: LeadRocksContact }>(query, params);
      return result.rows.map((r) => r.payload);
    } catch {
      // fall through to in-memory
    }
  }

  let contacts = [...contactStore.values()];
  if (limit) {
    contacts = contacts.slice(0, limit);
  }
  return contacts;
}

export async function findContactByEmail(email: string): Promise<LeadRocksContact | null> {
  await ensureLeadRocksSchema();

  const pool = getPool();
  if (pool) {
    try {
      const result = await pool.query<{ payload: LeadRocksContact }>(
        `SELECT payload FROM lead_os_leadrocks_contacts WHERE email = $1 LIMIT 1`,
        [email],
      );
      if (result.rows.length > 0) return result.rows[0].payload;
    } catch {
      // fall through to in-memory
    }
  }

  for (const contact of contactStore.values()) {
    if (contact.email === email) return contact;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getSearchStats(tenantId?: string): Promise<LeadRocksStats> {
  const relevantSearches = tenantId
    ? searchStore.filter((s) => s.tenantId === tenantId)
    : searchStore;

  const allContactIds = new Set(relevantSearches.flatMap((s) => s.contactIds));
  const contacts: LeadRocksContact[] = [];
  for (const id of allContactIds) {
    const c = contactStore.get(id);
    if (c) contacts.push(c);
  }

  const industryCounts = new Map<string, number>();
  const titleCounts = new Map<string, number>();

  for (const c of contacts) {
    industryCounts.set(c.industry, (industryCounts.get(c.industry) ?? 0) + 1);
    titleCounts.set(c.jobTitle, (titleCounts.get(c.jobTitle) ?? 0) + 1);
  }

  const topIndustries = [...industryCounts.entries()]
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topTitles = [...titleCounts.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalSearches: relevantSearches.length,
    totalContacts: contacts.length,
    creditsUsed: relevantSearches.reduce((sum, s) => sum + s.creditsUsed, 0),
    topIndustries,
    topTitles,
  };
}

// ---------------------------------------------------------------------------
// Search + ingest as prospects
// ---------------------------------------------------------------------------

export async function searchAndIngestAsProspects(
  params: LeadRocksSearchParams,
  tenantId?: string,
): Promise<{ contactsFound: number; prospectsCreated: number; creditsUsed: number }> {
  const result = await searchContacts(params);

  if (result.contacts.length > 0) {
    await saveSearchResults(result.contacts, tenantId);

    if (tenantId) {
      searchStore[searchStore.length - 1].tenantId = tenantId;
    }
  }

  return {
    contactsFound: result.contacts.length,
    prospectsCreated: result.contacts.length,
    creditsUsed: result.creditsUsed,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export async function searchViaLeadRocks(params: LeadRocksSearchParams): Promise<ProviderResult> {
  const dryRun = isLeadRocksDryRun();
  const result = await searchContacts(params);

  return {
    ok: true,
    provider: "LeadRocks",
    mode: dryRun ? "dry-run" : "live",
    detail: dryRun
      ? `Found ${result.contacts.length} contacts (LeadRocks dry-run)`
      : `Found ${result.contacts.length} contacts via LeadRocks`,
    payload: {
      total: result.total,
      contactsReturned: result.contacts.length,
      creditsUsed: result.creditsUsed,
      hasMore: result.hasMore,
    },
  };
}
