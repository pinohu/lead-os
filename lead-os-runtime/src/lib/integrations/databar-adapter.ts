import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DatabarConfig {
  apiKey: string;
  baseUrl: string;
}

export interface PersonEnrichmentInput {
  email?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

export interface CompanyEnrichmentInput {
  domain?: string;
  name?: string;
  linkedinUrl?: string;
}

export interface EnrichedPerson {
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  industry: string;
  linkedinUrl: string;
  location: string;
  phone: string;
  seniority: string;
  department: string;
  companySize: string;
  companyRevenue: string;
  technologies: string[];
}

export interface EnrichedCompany {
  name: string;
  domain: string;
  industry: string;
  size: string;
  revenue: string;
  founded: number;
  location: string;
  description: string;
  technologies: string[];
  socialProfiles: Record<string, string>;
  employees: number;
  fundingTotal: string;
}

export interface EnrichmentResult {
  ok: boolean;
  source: "live" | "cache" | "dry-run";
  person?: EnrichedPerson;
  company?: EnrichedCompany;
  creditsUsed: number;
}

interface StoredEnrichment {
  id: string;
  tenantId: string;
  type: "person" | "company";
  lookupKey: string;
  payload: EnrichedPerson | EnrichedCompany;
  creditsUsed: number;
  enrichedAt: string;
}

export interface EnrichmentStats {
  total: number;
  persons: number;
  companies: number;
  creditsUsed: number;
  cacheHits: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const enrichmentStore = new Map<string, StoredEnrichment>();
let cacheHitCount = 0;

export function resetDatabarStore(): void {
  enrichmentStore.clear();
  cacheHitCount = 0;
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveDatabarConfig(): DatabarConfig | null {
  const apiKey = process.env.DATABAR_API_KEY ?? "";
  const baseUrl = process.env.DATABAR_BASE_URL ?? "https://api.databar.ai/api/v1";
  if (!apiKey) return null;
  return { apiKey, baseUrl };
}

export function isDatabarDryRun(): boolean {
  return !process.env.DATABAR_API_KEY;
}

// ---------------------------------------------------------------------------
// Dry-run data generators
// ---------------------------------------------------------------------------

function extractNameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/);
  const firstName = capitalize(parts[0] ?? "Jane");
  const lastName = capitalize(parts[1] ?? "Doe");
  return { firstName, lastName };
}

function extractDomainFromEmail(email: string): string {
  return email.split("@")[1] ?? "example.com";
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function domainToCompanyName(domain: string): string {
  const name = domain.split(".")[0] ?? "Acme";
  return capitalize(name) + " Corp";
}

function generateDryRunPerson(input: PersonEnrichmentInput): EnrichedPerson {
  const email = input.email ?? "contact@example.com";
  const extracted = extractNameFromEmail(email);
  const domain = extractDomainFromEmail(email);
  const firstName = input.firstName ?? extracted.firstName;
  const lastName = input.lastName ?? extracted.lastName;
  const company = input.company ?? domainToCompanyName(domain);

  return {
    email,
    firstName,
    lastName,
    title: "Senior Manager",
    company,
    industry: "Technology",
    linkedinUrl: input.linkedinUrl ?? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    location: "San Francisco, CA",
    phone: "+1-555-0100",
    seniority: "Manager",
    department: "Engineering",
    companySize: "51-200",
    companyRevenue: "$10M-$50M",
    technologies: ["React", "Node.js", "PostgreSQL"],
  };
}

function generateDryRunCompany(input: CompanyEnrichmentInput): EnrichedCompany {
  const domain = input.domain ?? "example.com";
  const name = input.name ?? domainToCompanyName(domain);

  return {
    name,
    domain,
    industry: "Technology",
    size: "51-200",
    revenue: "$10M-$50M",
    founded: 2015,
    location: "San Francisco, CA",
    description: `${name} is a technology company specializing in innovative solutions.`,
    technologies: ["React", "Node.js", "AWS"],
    socialProfiles: {
      linkedin: input.linkedinUrl ?? `https://linkedin.com/company/${domain.split(".")[0]}`,
      twitter: `https://twitter.com/${domain.split(".")[0]}`,
    },
    employees: 120,
    fundingTotal: "$25M",
  };
}

// ---------------------------------------------------------------------------
// Lookup key helpers
// ---------------------------------------------------------------------------

function personLookupKey(input: PersonEnrichmentInput): string {
  if (input.email) return input.email.toLowerCase();
  if (input.linkedinUrl) return input.linkedinUrl.toLowerCase();
  if (input.firstName && input.lastName && input.company) {
    return `${input.firstName}:${input.lastName}:${input.company}`.toLowerCase();
  }
  return "";
}

function companyLookupKey(input: CompanyEnrichmentInput): string {
  if (input.domain) return input.domain.toLowerCase();
  if (input.name) return input.name.toLowerCase();
  if (input.linkedinUrl) return input.linkedinUrl.toLowerCase();
  return "";
}

// ---------------------------------------------------------------------------
// Core enrichment functions
// ---------------------------------------------------------------------------

export async function enrichPerson(input: PersonEnrichmentInput): Promise<EnrichmentResult> {
  const key = personLookupKey(input);

  if (isDatabarDryRun()) {
    const person = generateDryRunPerson(input);
    return { ok: true, source: "dry-run", person, creditsUsed: 0 };
  }

  const config = resolveDatabarConfig();
  if (!config) {
    const person = generateDryRunPerson(input);
    return { ok: true, source: "dry-run", person, creditsUsed: 0 };
  }

  try {
    const res = await fetch(`${config.baseUrl}/enrich/person`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { person?: EnrichedPerson; credits_used?: number };
      if (data.person) {
        return { ok: true, source: "live", person: data.person, creditsUsed: data.credits_used ?? 1 };
      }
    }
  } catch {
    // fall through to dry-run on error
  }

  const person = generateDryRunPerson(input);
  return { ok: true, source: "dry-run", person, creditsUsed: 0 };
}

export async function enrichCompany(input: CompanyEnrichmentInput): Promise<EnrichmentResult> {
  const key = companyLookupKey(input);

  if (isDatabarDryRun()) {
    const company = generateDryRunCompany(input);
    return { ok: true, source: "dry-run", company, creditsUsed: 0 };
  }

  const config = resolveDatabarConfig();
  if (!config) {
    const company = generateDryRunCompany(input);
    return { ok: true, source: "dry-run", company, creditsUsed: 0 };
  }

  try {
    const res = await fetch(`${config.baseUrl}/enrich/company`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { company?: EnrichedCompany; credits_used?: number };
      if (data.company) {
        return { ok: true, source: "live", company: data.company, creditsUsed: data.credits_used ?? 1 };
      }
    }
  } catch {
    // fall through to dry-run on error
  }

  const company = generateDryRunCompany(input);
  return { ok: true, source: "dry-run", company, creditsUsed: 0 };
}

// ---------------------------------------------------------------------------
// Store & retrieve
// ---------------------------------------------------------------------------

export async function getStoredEnrichment(
  lookupKey: string,
  type: "person" | "company",
): Promise<StoredEnrichment | null> {
  const normalizedKey = lookupKey.toLowerCase();

  // Check in-memory first
  for (const entry of enrichmentStore.values()) {
    if (entry.lookupKey === normalizedKey && entry.type === type) {
      return entry;
    }
  }

  // Check PostgreSQL
  const pool = getPool();
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, type, lookup_key, payload, credits_used, enriched_at
         FROM lead_os_enrichments
         WHERE lookup_key = $1 AND type = $2
         LIMIT 1`,
        [normalizedKey, type],
      );
      if (result.rows.length > 0) {
        const row = result.rows[0] as {
          id: string;
          tenant_id: string;
          type: "person" | "company";
          lookup_key: string;
          payload: EnrichedPerson | EnrichedCompany;
          credits_used: number;
          enriched_at: string;
        };
        const stored: StoredEnrichment = {
          id: row.id,
          tenantId: row.tenant_id,
          type: row.type,
          lookupKey: row.lookup_key,
          payload: row.payload,
          creditsUsed: row.credits_used,
          enrichedAt: row.enriched_at,
        };
        enrichmentStore.set(stored.id, stored);
        return stored;
      }
    } catch {
      // fall through — DB may not have the table yet
    }
  }

  return null;
}

export async function enrichAndStore(
  input: PersonEnrichmentInput | CompanyEnrichmentInput,
  type: "person" | "company",
  tenantId?: string,
): Promise<EnrichmentResult> {
  const key = type === "person"
    ? personLookupKey(input as PersonEnrichmentInput)
    : companyLookupKey(input as CompanyEnrichmentInput);

  if (!key) {
    return { ok: false, source: "dry-run", creditsUsed: 0 };
  }

  // Check cache first
  const cached = await getStoredEnrichment(key, type);
  if (cached) {
    cacheHitCount++;
    const result: EnrichmentResult = {
      ok: true,
      source: "cache",
      creditsUsed: 0,
    };
    if (type === "person") {
      result.person = cached.payload as EnrichedPerson;
    } else {
      result.company = cached.payload as EnrichedCompany;
    }
    return result;
  }

  // Enrich
  const enrichResult = type === "person"
    ? await enrichPerson(input as PersonEnrichmentInput)
    : await enrichCompany(input as CompanyEnrichmentInput);

  if (!enrichResult.ok) return enrichResult;

  // Store the result
  const id = `enr-${randomUUID()}`;
  const now = new Date().toISOString();
  const resolvedTenantId = tenantId ?? "default";
  const payload = type === "person" ? enrichResult.person! : enrichResult.company!;

  const stored: StoredEnrichment = {
    id,
    tenantId: resolvedTenantId,
    type,
    lookupKey: key,
    payload,
    creditsUsed: enrichResult.creditsUsed,
    enrichedAt: now,
  };
  enrichmentStore.set(id, stored);

  // Persist to PostgreSQL
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_enrichments (id, tenant_id, type, lookup_key, payload, credits_used, enriched_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [id, resolvedTenantId, type, key, JSON.stringify(payload), enrichResult.creditsUsed, now],
      );
    } catch {
      // in-memory store already populated
    }
  }

  return enrichResult;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getEnrichmentStats(tenantId?: string): Promise<EnrichmentStats> {
  const entries = [...enrichmentStore.values()].filter(
    (e) => !tenantId || e.tenantId === tenantId,
  );

  return {
    total: entries.length,
    persons: entries.filter((e) => e.type === "person").length,
    companies: entries.filter((e) => e.type === "company").length,
    creditsUsed: entries.reduce((sum, e) => sum + e.creditsUsed, 0),
    cacheHits: cacheHitCount,
  };
}

// ---------------------------------------------------------------------------
// Auto-enrichment convenience
// ---------------------------------------------------------------------------

export async function enrichLeadAutomatically(
  lead: { email?: string; company?: string; website?: string },
  tenantId?: string,
): Promise<{ person?: EnrichmentResult; company?: EnrichmentResult }> {
  const results: { person?: EnrichmentResult; company?: EnrichmentResult } = {};

  if (lead.email) {
    const personInput: PersonEnrichmentInput = {
      email: lead.email,
      company: lead.company,
    };
    results.person = await enrichAndStore(personInput, "person", tenantId);
  }

  const domain = lead.website
    ?? (lead.email ? extractDomainFromEmail(lead.email) : undefined);

  if (domain) {
    const companyInput: CompanyEnrichmentInput = {
      domain,
      name: lead.company,
    };
    results.company = await enrichAndStore(companyInput, "company", tenantId);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export async function enrichViaDatabar(input: PersonEnrichmentInput): Promise<ProviderResult> {
  if (isDatabarDryRun()) {
    const result = await enrichPerson(input);
    return {
      ok: true,
      provider: "Databar",
      mode: "dry-run",
      detail: "Person enriched (Databar dry-run)",
      payload: { lookupKey: personLookupKey(input), person: result.person as unknown as Record<string, unknown> },
    };
  }

  const result = await enrichPerson(input);
  return {
    ok: result.ok,
    provider: "Databar",
    mode: result.source === "live" ? "live" : "dry-run",
    detail: result.ok ? "Person enriched via Databar" : "Databar enrichment failed",
    payload: {
      lookupKey: personLookupKey(input),
      creditsUsed: result.creditsUsed,
      ...(result.person ? { person: result.person as unknown as Record<string, unknown> } : {}),
    },
  };
}
