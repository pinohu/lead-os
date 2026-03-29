import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Meiro CDP Types
// ---------------------------------------------------------------------------

export interface MeiroCdpConfig {
  apiKey: string;
  baseUrl: string;
}

export interface CustomerProfile {
  id: string;
  primaryEmail: string;
  emails: string[];
  phones: string[];
  names: string[];
  companies: string[];
  sources: string[];
  firstSeen: string;
  lastSeen: string;
  totalInteractions: number;
  attributes: Record<string, string | number | boolean>;
  segments: string[];
  tenantId?: string;
  mergedProfileIds: string[];
}

export interface DataSource {
  id: string;
  name: string;
  type: "website" | "form" | "chat" | "phone" | "email" | "api" | "import";
  eventsCount: number;
  lastSyncAt: string;
  tenantId?: string;
}

export interface CustomerEvent {
  id: string;
  profileId: string;
  source: string;
  eventType: string;
  properties: Record<string, string | number>;
  timestamp: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  conditions: {
    attribute: string;
    operator: "equals" | "contains" | "gt" | "lt" | "exists";
    value: string | number;
  }[];
  profileCount: number;
  tenantId?: string;
  createdAt: string;
}

export interface IdentityResolution {
  profileId: string;
  matchedOn: string;
  mergedFrom: string[];
  confidence: number;
}

export interface MeiroStats {
  totalProfiles: number;
  totalEvents: number;
  totalSources: number;
  totalSegments: number;
  avgInteractions: number;
  identityResolutions: number;
  topSources: { source: string; events: number }[];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const profileStore = new Map<string, CustomerProfile>();
const eventStore = new Map<string, CustomerEvent>();
const sourceStore = new Map<string, DataSource>();
const segmentStore = new Map<string, CustomerSegment>();
const resolutionStore = new Map<string, IdentityResolution>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveMeiroConfig(): MeiroCdpConfig | null {
  const apiKey = process.env.MEIRO_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.MEIRO_BASE_URL ?? "https://api.meiro.io/v1",
  };
}

export function isMeiroDryRun(): boolean {
  return !process.env.MEIRO_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureMeiroSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_meiro (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        tenant_id TEXT,
        email TEXT,
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
// DB persistence helpers
// ---------------------------------------------------------------------------

async function persistToDb(
  id: string,
  type: string,
  tenantId: string | undefined,
  email: string | undefined,
  payload: unknown,
): Promise<void> {
  await ensureMeiroSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_meiro (id, type, tenant_id, email, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           email = EXCLUDED.email,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, email ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Identity Resolution
// ---------------------------------------------------------------------------

function findProfileByEmail(email: string): CustomerProfile | undefined {
  const lower = email.toLowerCase();
  for (const profile of profileStore.values()) {
    if (profile.emails.some((e) => e.toLowerCase() === lower)) {
      return profile;
    }
  }
  return undefined;
}

function findProfileByPhone(phone: string): CustomerProfile | undefined {
  for (const profile of profileStore.values()) {
    if (profile.phones.includes(phone)) {
      return profile;
    }
  }
  return undefined;
}

export async function resolveIdentity(
  email: string,
  phone?: string,
): Promise<{ profile: CustomerProfile; resolution: IdentityResolution }> {
  const now = new Date().toISOString();

  const byEmail = findProfileByEmail(email);
  if (byEmail) {
    const resolution: IdentityResolution = {
      profileId: byEmail.id,
      matchedOn: "email",
      mergedFrom: [],
      confidence: 1.0,
    };
    resolutionStore.set(`res-${byEmail.id}-${Date.now()}`, resolution);
    return { profile: byEmail, resolution };
  }

  if (phone) {
    const byPhone = findProfileByPhone(phone);
    if (byPhone) {
      if (!byPhone.emails.includes(email.toLowerCase())) {
        byPhone.emails.push(email.toLowerCase());
      }
      byPhone.lastSeen = now;
      const resolution: IdentityResolution = {
        profileId: byPhone.id,
        matchedOn: "phone",
        mergedFrom: [],
        confidence: 0.85,
      };
      resolutionStore.set(`res-${byPhone.id}-${Date.now()}`, resolution);
      await persistToDb(byPhone.id, "profile", byPhone.tenantId, byPhone.primaryEmail, byPhone);
      return { profile: byPhone, resolution };
    }
  }

  const newProfile: CustomerProfile = {
    id: crypto.randomUUID(),
    primaryEmail: email.toLowerCase(),
    emails: [email.toLowerCase()],
    phones: phone ? [phone] : [],
    names: [],
    companies: [],
    sources: [],
    firstSeen: now,
    lastSeen: now,
    totalInteractions: 0,
    attributes: {},
    segments: [],
    mergedProfileIds: [],
  };

  profileStore.set(newProfile.id, newProfile);
  await persistToDb(newProfile.id, "profile", undefined, newProfile.primaryEmail, newProfile);

  const resolution: IdentityResolution = {
    profileId: newProfile.id,
    matchedOn: "new",
    mergedFrom: [],
    confidence: 1.0,
  };
  resolutionStore.set(`res-${newProfile.id}-${Date.now()}`, resolution);

  return { profile: newProfile, resolution };
}

// ---------------------------------------------------------------------------
// Event Ingestion
// ---------------------------------------------------------------------------

export async function ingestEvent(
  event: Omit<CustomerEvent, "id">,
): Promise<CustomerEvent> {
  const id = crypto.randomUUID();
  const fullEvent: CustomerEvent = { id, ...event };

  eventStore.set(id, fullEvent);

  const profile = profileStore.get(event.profileId);
  if (profile) {
    profile.totalInteractions += 1;
    profile.lastSeen = event.timestamp;
    if (!profile.sources.includes(event.source)) {
      profile.sources.push(event.source);
    }
  }

  const source = [...sourceStore.values()].find(
    (s) => s.name === event.source || s.id === event.source,
  );
  if (source) {
    source.eventsCount += 1;
    source.lastSyncAt = event.timestamp;
  }

  await persistToDb(id, "event", profile?.tenantId, undefined, fullEvent);

  if (!isMeiroDryRun()) {
    const cfg = resolveMeiroConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.baseUrl}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(fullEvent),
          signal: AbortSignal.timeout(30_000),
        });
      } catch {
        // API call failed — local store is still valid
      }
    }
  }

  return fullEvent;
}

export async function ingestBulkEvents(
  events: Omit<CustomerEvent, "id">[],
): Promise<CustomerEvent[]> {
  const results: CustomerEvent[] = [];
  for (const event of events) {
    results.push(await ingestEvent(event));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Profile Operations
// ---------------------------------------------------------------------------

export async function getProfile(profileId: string): Promise<CustomerProfile | null> {
  const cached = profileStore.get(profileId);
  if (cached) return cached;

  await ensureMeiroSchema();
  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await pool.query<{ payload: CustomerProfile }>(
        `SELECT payload FROM lead_os_meiro WHERE id = $1 AND type = 'profile'`,
        [profileId],
      );
      if (rows.length > 0) {
        profileStore.set(profileId, rows[0].payload);
        return rows[0].payload;
      }
    } catch {
      // DB read failed
    }
  }

  return null;
}

export async function getProfileByEmail(email: string): Promise<CustomerProfile | null> {
  const found = findProfileByEmail(email);
  if (found) return found;

  await ensureMeiroSchema();
  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await pool.query<{ payload: CustomerProfile }>(
        `SELECT payload FROM lead_os_meiro WHERE email = $1 AND type = 'profile' LIMIT 1`,
        [email.toLowerCase()],
      );
      if (rows.length > 0) {
        profileStore.set(rows[0].payload.id, rows[0].payload);
        return rows[0].payload;
      }
    } catch {
      // DB read failed
    }
  }

  return null;
}

export async function listProfiles(
  tenantId?: string,
  limit?: number,
): Promise<CustomerProfile[]> {
  const all = [...profileStore.values()];
  const filtered = tenantId ? all.filter((p) => p.tenantId === tenantId) : all;
  return limit ? filtered.slice(0, limit) : filtered;
}

// ---------------------------------------------------------------------------
// Profile Merging
// ---------------------------------------------------------------------------

export async function mergeProfiles(
  profileId1: string,
  profileId2: string,
): Promise<CustomerProfile | null> {
  const primary = profileStore.get(profileId1);
  const secondary = profileStore.get(profileId2);

  if (!primary || !secondary) return null;
  if (profileId1 === profileId2) return primary;

  for (const email of secondary.emails) {
    if (!primary.emails.includes(email)) {
      primary.emails.push(email);
    }
  }
  for (const phone of secondary.phones) {
    if (!primary.phones.includes(phone)) {
      primary.phones.push(phone);
    }
  }
  for (const name of secondary.names) {
    if (!primary.names.includes(name)) {
      primary.names.push(name);
    }
  }
  for (const company of secondary.companies) {
    if (!primary.companies.includes(company)) {
      primary.companies.push(company);
    }
  }
  for (const source of secondary.sources) {
    if (!primary.sources.includes(source)) {
      primary.sources.push(source);
    }
  }

  if (new Date(secondary.firstSeen) < new Date(primary.firstSeen)) {
    primary.firstSeen = secondary.firstSeen;
  }
  if (new Date(secondary.lastSeen) > new Date(primary.lastSeen)) {
    primary.lastSeen = secondary.lastSeen;
  }

  primary.totalInteractions += secondary.totalInteractions;

  for (const [key, value] of Object.entries(secondary.attributes)) {
    if (!(key in primary.attributes)) {
      primary.attributes[key] = value;
    }
  }

  for (const segment of secondary.segments) {
    if (!primary.segments.includes(segment)) {
      primary.segments.push(segment);
    }
  }

  if (!primary.mergedProfileIds.includes(profileId2)) {
    primary.mergedProfileIds.push(profileId2);
  }
  for (const merged of secondary.mergedProfileIds) {
    if (!primary.mergedProfileIds.includes(merged)) {
      primary.mergedProfileIds.push(merged);
    }
  }

  for (const event of eventStore.values()) {
    if (event.profileId === profileId2) {
      (event as { profileId: string }).profileId = profileId1;
    }
  }

  profileStore.delete(profileId2);

  const resolution: IdentityResolution = {
    profileId: profileId1,
    matchedOn: "manual_merge",
    mergedFrom: [profileId2],
    confidence: 1.0,
  };
  resolutionStore.set(`res-merge-${Date.now()}`, resolution);

  await persistToDb(primary.id, "profile", primary.tenantId, primary.primaryEmail, primary);

  return primary;
}

// ---------------------------------------------------------------------------
// Data Sources
// ---------------------------------------------------------------------------

export async function registerDataSource(
  input: { name: string; type: DataSource["type"]; tenantId?: string },
): Promise<DataSource> {
  const existing = [...sourceStore.values()].find(
    (s) => s.name === input.name && s.tenantId === input.tenantId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const source: DataSource = {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type,
    eventsCount: 0,
    lastSyncAt: now,
    tenantId: input.tenantId,
  };

  sourceStore.set(source.id, source);
  await persistToDb(source.id, "source", input.tenantId, undefined, source);

  return source;
}

export async function listDataSources(tenantId?: string): Promise<DataSource[]> {
  const all = [...sourceStore.values()];
  return tenantId ? all.filter((s) => s.tenantId === tenantId) : all;
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

export async function createSegment(
  input: {
    name: string;
    conditions: CustomerSegment["conditions"];
    tenantId?: string;
  },
): Promise<CustomerSegment> {
  const now = new Date().toISOString();
  const matchingProfiles = evaluateSegmentConditions(input.conditions, input.tenantId);

  const segment: CustomerSegment = {
    id: crypto.randomUUID(),
    name: input.name,
    conditions: input.conditions,
    profileCount: matchingProfiles.length,
    tenantId: input.tenantId,
    createdAt: now,
  };

  segmentStore.set(segment.id, segment);

  for (const profile of matchingProfiles) {
    if (!profile.segments.includes(segment.id)) {
      profile.segments.push(segment.id);
    }
  }

  await persistToDb(segment.id, "segment", input.tenantId, undefined, segment);

  return segment;
}

function evaluateSegmentConditions(
  conditions: CustomerSegment["conditions"],
  tenantId?: string,
): CustomerProfile[] {
  const profiles = [...profileStore.values()];
  const filtered = tenantId ? profiles.filter((p) => p.tenantId === tenantId) : profiles;

  return filtered.filter((profile) =>
    conditions.every((condition) => {
      const value = profile.attributes[condition.attribute];

      switch (condition.operator) {
        case "equals":
          return String(value) === String(condition.value);
        case "contains":
          return String(value ?? "").includes(String(condition.value));
        case "gt":
          return typeof value === "number" && value > Number(condition.value);
        case "lt":
          return typeof value === "number" && value < Number(condition.value);
        case "exists":
          return condition.attribute in profile.attributes;
        default:
          return false;
      }
    }),
  );
}

export async function getSegmentProfiles(segmentId: string): Promise<CustomerProfile[]> {
  const segment = segmentStore.get(segmentId);
  if (!segment) return [];

  return [...profileStore.values()].filter((p) => p.segments.includes(segmentId));
}

export async function listSegments(tenantId?: string): Promise<CustomerSegment[]> {
  const all = [...segmentStore.values()];
  return tenantId ? all.filter((s) => s.tenantId === tenantId) : all;
}

// ---------------------------------------------------------------------------
// Sync Lead to Meiro
// ---------------------------------------------------------------------------

export async function syncLeadToMeiro(
  lead: {
    email: string;
    name?: string;
    phone?: string;
    company?: string;
    source?: string;
  },
  tenantId?: string,
): Promise<{ profile: CustomerProfile; resolution: IdentityResolution }> {
  const { profile, resolution } = await resolveIdentity(lead.email, lead.phone);

  if (lead.name && !profile.names.includes(lead.name)) {
    profile.names.push(lead.name);
  }
  if (lead.company && !profile.companies.includes(lead.company)) {
    profile.companies.push(lead.company);
  }
  if (lead.source && !profile.sources.includes(lead.source)) {
    profile.sources.push(lead.source);
  }
  if (tenantId) {
    profile.tenantId = tenantId;
  }

  profile.lastSeen = new Date().toISOString();

  await persistToDb(profile.id, "profile", profile.tenantId, profile.primaryEmail, profile);

  await ingestEvent({
    profileId: profile.id,
    source: lead.source ?? "lead-os",
    eventType: "lead_captured",
    properties: {
      email: lead.email,
      ...(lead.name ? { name: lead.name } : {}),
      ...(lead.company ? { company: lead.company } : {}),
    },
    timestamp: new Date().toISOString(),
  });

  return { profile, resolution };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getMeiroStats(tenantId?: string): Promise<MeiroStats> {
  const profiles = [...profileStore.values()];
  const filteredProfiles = tenantId
    ? profiles.filter((p) => p.tenantId === tenantId)
    : profiles;

  const events = [...eventStore.values()];
  const filteredEvents = tenantId
    ? events.filter((e) => {
        const profile = profileStore.get(e.profileId);
        return profile?.tenantId === tenantId;
      })
    : events;

  const sources = [...sourceStore.values()];
  const filteredSources = tenantId
    ? sources.filter((s) => s.tenantId === tenantId)
    : sources;

  const segments = [...segmentStore.values()];
  const filteredSegments = tenantId
    ? segments.filter((s) => s.tenantId === tenantId)
    : segments;

  const totalProfiles = filteredProfiles.length;
  const totalEvents = filteredEvents.length;
  const totalSources = filteredSources.length;
  const totalSegments = filteredSegments.length;

  const avgInteractions = totalProfiles > 0
    ? filteredProfiles.reduce((sum, p) => sum + p.totalInteractions, 0) / totalProfiles
    : 0;

  const identityResolutions = [...resolutionStore.values()].length;

  const sourceEventMap = new Map<string, number>();
  for (const event of filteredEvents) {
    const count = sourceEventMap.get(event.source) ?? 0;
    sourceEventMap.set(event.source, count + 1);
  }
  const topSources = [...sourceEventMap.entries()]
    .map(([source, count]) => ({ source, events: count }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);

  return {
    totalProfiles,
    totalEvents,
    totalSources,
    totalSegments,
    avgInteractions,
    identityResolutions,
    topSources,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function meiroResult(op: string, detail: string): ProviderResult {
  const dryRun = isMeiroDryRun();
  return {
    ok: true,
    provider: "MeiroCDP",
    mode: dryRun ? "dry-run" : "live",
    detail,
    payload: { operation: op },
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetMeiroStore(): void {
  profileStore.clear();
  eventStore.clear();
  sourceStore.clear();
  segmentStore.clear();
  resolutionStore.clear();
  schemaEnsured = false;
}
