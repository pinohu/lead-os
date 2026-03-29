import { randomUUID } from "crypto";
import { getPool } from "../db.ts";
import type { ProviderResult } from "../providers.ts";

// ---------------------------------------------------------------------------
// Clodura.AI B2B Prospecting Types
// ---------------------------------------------------------------------------

export interface CloduraConfig {
  apiKey: string;
  baseUrl: string;
}

export interface CloduraSearchParams {
  companyName?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  revenue?: string;
  technology?: string;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  limit?: number;
  offset?: number;
}

export interface CloduraContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  directDial?: string;
  linkedinUrl?: string;
  jobTitle: string;
  department: string;
  seniority: string;
  company: string;
  companyDomain: string;
  companySize: string;
  industry: string;
  location: string;
  revenue?: string;
  technologies?: string[];
}

export interface CloduraCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  revenue: string;
  location: string;
  founded?: number;
  technologies: string[];
  employeeCount: number;
  linkedinUrl?: string;
  description?: string;
}

export interface CloduraSearchResult {
  contacts: CloduraContact[];
  total: number;
  creditsUsed: number;
  hasMore: boolean;
}

export interface OrgChartResult {
  company: string;
  departments: { name: string; contacts: CloduraContact[] }[];
}

export interface CloduraStats {
  totalSearches: number;
  totalContacts: number;
  totalCompanies: number;
  creditsUsed: number;
  topIndustries: { industry: string; count: number }[];
  topTechnologies: { tech: string; count: number }[];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const contactStore = new Map<string, CloduraContact>();
const companyStore = new Map<string, CloduraCompany>();
const searchStore: {
  params: CloduraSearchParams;
  contactIds: string[];
  creditsUsed: number;
  searchedAt: string;
  tenantId?: string;
}[] = [];

let schemaInitialized = false;

export function resetCloduraStore(): void {
  contactStore.clear();
  companyStore.clear();
  searchStore.length = 0;
  schemaInitialized = false;
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveCloduraConfig(): CloduraConfig | null {
  const apiKey = process.env.CLODURA_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.CLODURA_BASE_URL ?? "https://api.clodura.ai/v1",
  };
}

export function isCloduraDryRun(): boolean {
  return !process.env.CLODURA_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema init (lazy)
// ---------------------------------------------------------------------------

async function ensureCloduraSchema(): Promise<void> {
  if (schemaInitialized) return;
  const pool = getPool();
  if (!pool) {
    schemaInitialized = true;
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_clodura_contacts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        email TEXT,
        company TEXT,
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

const FIRST_NAMES = ["Sarah", "James", "Priya", "Marcus", "Elena", "David", "Mei", "Carlos", "Olivia", "Raj"];
const LAST_NAMES = ["Thompson", "Gupta", "Rodriguez", "O'Brien", "Yamamoto", "Fischer", "Lee", "Santos", "Bennett", "Khan"];
const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "Operations", "Human Resources", "Product", "Legal"];
const SENIORITY_LEVELS = ["Junior", "Mid-Level", "Senior", "Director", "VP", "C-Level"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Manufacturing", "Education", "Marketing", "Retail", "Energy", "Logistics", "Real Estate"];
const TECHNOLOGIES = ["React", "Python", "AWS", "Kubernetes", "Salesforce", "HubSpot", "Snowflake", "Databricks", "Terraform", "Docker"];
const REVENUE_RANGES = ["$1M-$5M", "$5M-$10M", "$10M-$50M", "$50M-$100M", "$100M-$500M", "$500M+"];
const LOCATIONS = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Boston, MA", "Chicago, IL", "London, UK", "Berlin, DE", "Bangalore, IN", "Toronto, CA"];
const COMPANY_NAMES = ["NovaTech", "Meridian Systems", "Apex Digital", "Quantum Logic", "Pinnacle Solutions", "Stratos Cloud", "Verdant Labs", "Ignite Analytics", "Catalyst AI", "Summit Data"];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFakeContact(params: CloduraSearchParams, index: number): CloduraContact {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[index % LAST_NAMES.length];
  const company = params.companyName ?? pickRandom(COMPANY_NAMES);
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  const jobTitle = params.jobTitle ?? pickRandom(["Software Engineer", "Product Manager", "VP of Sales", "CTO", "Marketing Director"]);
  const department = params.department ?? pickRandom(DEPARTMENTS);
  const seniority = params.seniority ?? pickRandom(SENIORITY_LEVELS);
  const industry = params.industry ?? pickRandom(INDUSTRIES);
  const location = params.location ?? pickRandom(LOCATIONS);
  const companySize = params.companySize ?? pickRandom(COMPANY_SIZES);
  const revenue = params.revenue ?? pickRandom(REVENUE_RANGES);
  const technology = params.technology;
  const techs = technology ? [technology, pickRandom(TECHNOLOGIES)] : [pickRandom(TECHNOLOGIES), pickRandom(TECHNOLOGIES)];

  return {
    id: `clo-${randomUUID()}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    emailVerified: Math.random() > 0.15,
    phone: Math.random() > 0.4 ? `+1-555-${String(2000 + index).slice(0, 4)}` : undefined,
    directDial: Math.random() > 0.6 ? `+1-555-${String(3000 + index).slice(0, 4)}` : undefined,
    linkedinUrl: Math.random() > 0.2 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${index}` : undefined,
    jobTitle,
    department,
    seniority,
    company,
    companyDomain: domain,
    companySize,
    industry,
    location,
    revenue,
    technologies: techs,
  };
}

function generateFakeCompany(params: { industry?: string; location?: string; size?: string; technology?: string }, index: number): CloduraCompany {
  const name = COMPANY_NAMES[index % COMPANY_NAMES.length];
  const domain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  const industry = params.industry ?? pickRandom(INDUSTRIES);
  const location = params.location ?? pickRandom(LOCATIONS);
  const size = params.size ?? pickRandom(COMPANY_SIZES);
  const technology = params.technology;
  const techs = technology ? [technology, pickRandom(TECHNOLOGIES), pickRandom(TECHNOLOGIES)] : [pickRandom(TECHNOLOGIES), pickRandom(TECHNOLOGIES)];
  const employeeCount = parseInt(size.split("-")[0].replace(/[^0-9]/g, ""), 10) || 50;

  return {
    id: `clo-co-${randomUUID()}`,
    name,
    domain,
    industry,
    size,
    revenue: pickRandom(REVENUE_RANGES),
    location,
    founded: 2000 + (index % 24),
    technologies: techs,
    employeeCount,
    linkedinUrl: `https://linkedin.com/company/${name.toLowerCase().replace(/\s+/g, "-")}`,
    description: `${name} is a leading ${industry.toLowerCase()} company based in ${location}.`,
  };
}

// ---------------------------------------------------------------------------
// Core: Search Contacts
// ---------------------------------------------------------------------------

export async function searchContacts(params: CloduraSearchParams): Promise<CloduraSearchResult> {
  const limit = params.limit ?? 10;
  const offset = params.offset ?? 0;

  if (isCloduraDryRun()) {
    const count = Math.min(limit, 5 + Math.floor(Math.random() * 6));
    const contacts: CloduraContact[] = [];
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

  const cfg = resolveCloduraConfig();
  if (!cfg) {
    return { contacts: [], total: 0, creditsUsed: 0, hasMore: false };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/contacts/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ ...params, limit, offset }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as CloduraSearchResult;
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

// ---------------------------------------------------------------------------
// Core: Search Companies
// ---------------------------------------------------------------------------

export async function searchCompanies(params: {
  industry?: string;
  location?: string;
  size?: string;
  technology?: string;
  limit?: number;
}): Promise<CloduraCompany[]> {
  const limit = params.limit ?? 10;

  if (isCloduraDryRun()) {
    const count = Math.min(limit, 3 + Math.floor(Math.random() * 5));
    const companies: CloduraCompany[] = [];
    for (let i = 0; i < count; i++) {
      const company = generateFakeCompany(params, i);
      companies.push(company);
      companyStore.set(company.id, company);
    }
    return companies;
  }

  const cfg = resolveCloduraConfig();
  if (!cfg) return [];

  try {
    const res = await fetch(`${cfg.baseUrl}/companies/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { companies: CloduraCompany[] };
      for (const c of data.companies) {
        companyStore.set(c.id, c);
      }
      return data.companies;
    }
  } catch {
    // fall through
  }

  return [];
}

// ---------------------------------------------------------------------------
// Core: Org Chart
// ---------------------------------------------------------------------------

export async function getOrgChart(companyName: string): Promise<OrgChartResult> {
  if (isCloduraDryRun()) {
    const departmentCount = 3 + Math.floor(Math.random() * 3);
    const selectedDepts = DEPARTMENTS.slice(0, departmentCount);
    const departments = selectedDepts.map((deptName, deptIdx) => {
      const contactCount = 2 + Math.floor(Math.random() * 3);
      const contacts: CloduraContact[] = [];
      for (let i = 0; i < contactCount; i++) {
        const contact = generateFakeContact(
          { companyName, department: deptName },
          deptIdx * 10 + i,
        );
        contacts.push(contact);
        contactStore.set(contact.id, contact);
      }
      return { name: deptName, contacts };
    });

    return { company: companyName, departments };
  }

  const cfg = resolveCloduraConfig();
  if (!cfg) return { company: companyName, departments: [] };

  try {
    const res = await fetch(`${cfg.baseUrl}/companies/org-chart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ companyName }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as OrgChartResult;
      for (const dept of data.departments) {
        for (const c of dept.contacts) {
          contactStore.set(c.id, c);
        }
      }
      return data;
    }
  } catch {
    // fall through
  }

  return { company: companyName, departments: [] };
}

// ---------------------------------------------------------------------------
// Core: Enrich Contact
// ---------------------------------------------------------------------------

export async function enrichContact(email: string): Promise<CloduraContact | null> {
  if (isCloduraDryRun()) {
    const [localPart, domain] = email.split("@");
    const nameParts = (localPart ?? "john.doe").split(".");
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "John";
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "Doe";
    const companyName = (domain ?? "example.com").replace(/\.(com|io|co|org|net)$/i, "");
    const formattedCompany = companyName.charAt(0).toUpperCase() + companyName.slice(1);

    const contact: CloduraContact = {
      id: `clo-${randomUUID()}`,
      firstName,
      lastName,
      email,
      emailVerified: true,
      jobTitle: "Senior Manager",
      department: "Operations",
      seniority: "Senior",
      company: formattedCompany,
      companyDomain: domain ?? "example.com",
      companySize: "51-200",
      industry: "Technology",
      location: "San Francisco, CA",
      revenue: "$10M-$50M",
      technologies: ["React", "AWS"],
    };

    contactStore.set(contact.id, contact);
    return contact;
  }

  const cfg = resolveCloduraConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${cfg.baseUrl}/contacts/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { contact?: CloduraContact };
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
// Core: Enrich Company
// ---------------------------------------------------------------------------

export async function enrichCompany(domain: string): Promise<CloduraCompany | null> {
  if (isCloduraDryRun()) {
    const companyName = domain.replace(/\.(com|io|co|org|net)$/i, "");
    const formattedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

    const company: CloduraCompany = {
      id: `clo-co-${randomUUID()}`,
      name: formattedName,
      domain,
      industry: "Technology",
      size: "201-500",
      revenue: "$50M-$100M",
      location: "San Francisco, CA",
      founded: 2015,
      technologies: ["React", "AWS", "Kubernetes"],
      employeeCount: 350,
      linkedinUrl: `https://linkedin.com/company/${companyName.toLowerCase()}`,
      description: `${formattedName} is a leading technology company.`,
    };

    companyStore.set(company.id, company);
    return company;
  }

  const cfg = resolveCloduraConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${cfg.baseUrl}/companies/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ domain }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { company?: CloduraCompany };
      if (data.company) {
        companyStore.set(data.company.id, data.company);
        return data.company;
      }
    }
  } catch {
    // fall through
  }

  return null;
}

// ---------------------------------------------------------------------------
// Core: Find by Technology
// ---------------------------------------------------------------------------

export async function findByTechnology(technology: string, limit?: number): Promise<CloduraCompany[]> {
  return searchCompanies({ technology, limit });
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function saveContacts(contacts: CloduraContact[], tenantId?: string): Promise<void> {
  await ensureCloduraSchema();

  for (const c of contacts) {
    contactStore.set(c.id, c);
  }

  const pool = getPool();
  if (!pool) return;

  try {
    for (const c of contacts) {
      await pool.query(
        `INSERT INTO lead_os_clodura_contacts (id, tenant_id, email, company, payload, found_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET payload = $5, tenant_id = COALESCE($2, lead_os_clodura_contacts.tenant_id)`,
        [c.id, tenantId ?? null, c.email, c.company, JSON.stringify(c)],
      );
    }
  } catch {
    // in-memory store is already populated
  }
}

export async function getStoredContacts(tenantId?: string, limit?: number): Promise<CloduraContact[]> {
  await ensureCloduraSchema();

  const pool = getPool();
  if (pool) {
    try {
      const query = tenantId
        ? `SELECT payload FROM lead_os_clodura_contacts WHERE tenant_id = $1 ORDER BY found_at DESC LIMIT $2`
        : `SELECT payload FROM lead_os_clodura_contacts ORDER BY found_at DESC LIMIT $1`;
      const params = tenantId ? [tenantId, limit ?? 100] : [limit ?? 100];
      const result = await pool.query<{ payload: CloduraContact }>(query, params);
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

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getSearchStats(tenantId?: string): Promise<CloduraStats> {
  const relevantSearches = tenantId
    ? searchStore.filter((s) => s.tenantId === tenantId)
    : searchStore;

  const allContactIds = new Set(relevantSearches.flatMap((s) => s.contactIds));
  const contacts: CloduraContact[] = [];
  for (const id of allContactIds) {
    const c = contactStore.get(id);
    if (c) contacts.push(c);
  }

  const industryCounts = new Map<string, number>();
  const techCounts = new Map<string, number>();

  for (const c of contacts) {
    industryCounts.set(c.industry, (industryCounts.get(c.industry) ?? 0) + 1);
    if (c.technologies) {
      for (const tech of c.technologies) {
        techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1);
      }
    }
  }

  const topIndustries = [...industryCounts.entries()]
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topTechnologies = [...techCounts.entries()]
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalSearches: relevantSearches.length,
    totalContacts: contacts.length,
    totalCompanies: companyStore.size,
    creditsUsed: relevantSearches.reduce((sum, s) => sum + s.creditsUsed, 0),
    topIndustries,
    topTechnologies,
  };
}

// ---------------------------------------------------------------------------
// Search + ingest as prospects
// ---------------------------------------------------------------------------

export async function searchAndIngestAsProspects(
  params: CloduraSearchParams,
  tenantId?: string,
): Promise<{ contactsFound: number; prospectsCreated: number; creditsUsed: number }> {
  const result = await searchContacts(params);

  if (result.contacts.length > 0) {
    await saveContacts(result.contacts, tenantId);

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

export function cloduraResult(operation: string, detail: string): ProviderResult {
  const dryRun = isCloduraDryRun();
  return {
    ok: true,
    provider: "Clodura",
    mode: dryRun ? "dry-run" : "live",
    detail,
  };
}

export async function searchViaClodura(params: CloduraSearchParams): Promise<ProviderResult> {
  const dryRun = isCloduraDryRun();
  const result = await searchContacts(params);

  return {
    ok: true,
    provider: "Clodura",
    mode: dryRun ? "dry-run" : "live",
    detail: dryRun
      ? `Found ${result.contacts.length} contacts (Clodura dry-run)`
      : `Found ${result.contacts.length} contacts via Clodura`,
    payload: {
      total: result.total,
      contactsReturned: result.contacts.length,
      creditsUsed: result.creditsUsed,
      hasMore: result.hasMore,
    },
  };
}
