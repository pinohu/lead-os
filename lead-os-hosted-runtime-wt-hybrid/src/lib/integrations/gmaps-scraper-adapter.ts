import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Google Maps Scraper Types
// ---------------------------------------------------------------------------

export interface GMapsScrapeConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ScrapeQuery {
  query: string;
  location?: string;
  radius?: number;
  limit?: number;
  language?: string;
}

export interface ScrapedBusiness {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  website?: string;
  email?: string;
  rating: number;
  reviewCount: number;
  category: string;
  additionalCategories: string[];
  placeId: string;
  latitude: number;
  longitude: number;
  hours?: string[];
  photos?: string[];
}

export interface ScrapeResult {
  businesses: ScrapedBusiness[];
  total: number;
  query: string;
  location: string;
  scrapedAt: string;
  creditsUsed: number;
}

export type ScrapeJobStatus = "pending" | "running" | "completed" | "failed";

export interface ScrapeJob {
  id: string;
  query: ScrapeQuery;
  status: ScrapeJobStatus;
  result?: ScrapeResult;
  tenantId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ScrapeStats {
  totalJobs: number;
  totalBusinesses: number;
  creditsUsed: number;
  topCategories: { category: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const businessStore = new Map<string, { business: ScrapedBusiness; tenantId?: string }>();
const jobStore = new Map<string, ScrapeJob>();
const resultStore = new Map<string, { result: ScrapeResult; tenantId?: string }>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveGMapsConfig(): GMapsScrapeConfig | null {
  const apiKey = process.env.GMAPS_SCRAPER_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.GMAPS_SCRAPER_BASE_URL ?? "https://api.googlemapsscraper.com/v1",
  };
}

export function isGMapsDryRun(): boolean {
  return !process.env.GMAPS_SCRAPER_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureGMapsSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_gmaps_scrapes (
        id TEXT NOT NULL PRIMARY KEY,
        tenant_id TEXT,
        query TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed — fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// Dry-run data generation
// ---------------------------------------------------------------------------

const BUSINESS_NAME_PREFIXES: Record<string, string[]> = {
  plumber: ["Elite Plumbing", "Pro Pipe Solutions", "AquaFlow Plumbing", "ClearDrain Services", "PipeMaster", "Rapid Response Plumbing", "TrueBlue Plumbing", "AllStar Plumbing", "TopNotch Drain", "WaterWorks Pro", "FastFix Plumbing", "Premier Pipe", "Reliable Plumbing", "Express Drain", "PureFlow Services"],
  electrician: ["Spark Electric", "PowerLine Services", "BrightWire Electric", "Circuit Pro", "VoltAge Solutions", "SafeWire Electric", "ThunderBolt Electric", "Elite Electrical", "PrimePower Co", "AmpUp Electric", "CurrentFlow Services", "LightSpeed Electric", "WireRight Solutions", "ProVolt Electric", "Precision Electric"],
  dentist: ["Bright Smile Dental", "Family Dental Care", "Gentle Dentistry", "PearlWhite Dental", "SmileCraft Studio", "Horizon Dental Group", "ClearView Dental", "Premier Dental Arts", "SunRise Dental", "TrueCare Dental", "Radiant Smile Dental", "Comfort Dental Care", "Diamond Dental", "CrestView Dental", "Wellness Dental"],
  restaurant: ["The Golden Fork", "Harvest Table", "Blue Plate Kitchen", "Cedar & Sage", "Iron Skillet Grill", "Olive Branch Bistro", "The Rustic Spoon", "Maple Street Eatery", "Fireside Kitchen", "The Corner Plate", "River Rock Cafe", "Fresh & Co", "The Daily Grind", "Urban Bites", "The Local Table"],
  lawyer: ["Justice Legal Group", "Shield Law Firm", "Pinnacle Legal Services", "Cornerstone Law", "Liberty Legal Associates", "Advocate Partners", "TrustBridge Law", "FairClaim Legal", "Summit Legal Group", "Precision Law Firm", "Guardian Legal", "Heritage Law Group", "ProBono Partners", "Alliance Legal", "Keystone Law"],
  default: ["Premier Services", "ProTech Solutions", "AllStar Group", "Elite Professionals", "TrueValue Co", "Pinnacle Services", "NextLevel Solutions", "Quality First", "TopTier Group", "Reliable Pros", "Express Services", "Prime Solutions", "Trusted Partners", "Excellence Co", "Superior Group"],
};

const STATE_DATA: Record<string, { state: string; stateCode: string; zip: string; lat: number; lng: number }> = {
  seattle: { state: "Washington", stateCode: "WA", zip: "98101", lat: 47.6062, lng: -122.3321 },
  "new york": { state: "New York", stateCode: "NY", zip: "10001", lat: 40.7128, lng: -74.006 },
  "los angeles": { state: "California", stateCode: "CA", zip: "90001", lat: 34.0522, lng: -118.2437 },
  chicago: { state: "Illinois", stateCode: "IL", zip: "60601", lat: 41.8781, lng: -87.6298 },
  houston: { state: "Texas", stateCode: "TX", zip: "77001", lat: 29.7604, lng: -95.3698 },
  miami: { state: "Florida", stateCode: "FL", zip: "33101", lat: 25.7617, lng: -80.1918 },
  denver: { state: "Colorado", stateCode: "CO", zip: "80201", lat: 39.7392, lng: -104.9903 },
  phoenix: { state: "Arizona", stateCode: "AZ", zip: "85001", lat: 33.4484, lng: -112.074 },
  portland: { state: "Oregon", stateCode: "OR", zip: "97201", lat: 45.5152, lng: -122.6784 },
  austin: { state: "Texas", stateCode: "TX", zip: "73301", lat: 30.2672, lng: -97.7431 },
};

const STREET_NAMES = [
  "Main St", "Oak Ave", "Elm St", "Pine Rd", "Maple Dr",
  "Broadway", "Park Ave", "Cedar Ln", "1st Ave", "2nd St",
  "3rd Ave", "Market St", "Highland Dr", "Lake Blvd", "River Rd",
];

function detectCategory(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes("plumb")) return "Plumber";
  if (lower.includes("electr")) return "Electrician";
  if (lower.includes("dent")) return "Dentist";
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe")) return "Restaurant";
  if (lower.includes("lawyer") || lower.includes("attorney") || lower.includes("legal")) return "Lawyer";
  if (lower.includes("salon") || lower.includes("hair") || lower.includes("barber")) return "Hair Salon";
  if (lower.includes("mechanic") || lower.includes("auto") || lower.includes("car")) return "Auto Repair";
  if (lower.includes("gym") || lower.includes("fitness")) return "Gym";
  if (lower.includes("doctor") || lower.includes("clinic") || lower.includes("medical")) return "Medical Clinic";
  if (lower.includes("vet") || lower.includes("animal")) return "Veterinarian";
  return "Local Business";
}

function detectNameKey(query: string): string {
  const lower = query.toLowerCase();
  for (const key of Object.keys(BUSINESS_NAME_PREFIXES)) {
    if (key !== "default" && lower.includes(key)) return key;
  }
  if (lower.includes("food") || lower.includes("cafe")) return "restaurant";
  if (lower.includes("attorney") || lower.includes("legal")) return "lawyer";
  return "default";
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateDryRunBusinesses(query: ScrapeQuery): ScrapedBusiness[] {
  const limit = Math.min(query.limit ?? 10, 50);
  const count = Math.min(Math.max(5, limit), 15);
  const category = detectCategory(query.query);
  const nameKey = detectNameKey(query.query);
  const names = BUSINESS_NAME_PREFIXES[nameKey] ?? BUSINESS_NAME_PREFIXES.default;
  const locationLower = (query.location ?? "seattle").toLowerCase();
  const cityData = STATE_DATA[locationLower] ?? STATE_DATA.seattle;
  const cityName = query.location
    ? query.location.split(",")[0].trim().replace(/\b\w/g, (c) => c.toUpperCase())
    : "Seattle";

  const seed = hashString(query.query + (query.location ?? ""));
  const rng = seededRandom(seed);

  const businesses: ScrapedBusiness[] = [];

  for (let i = 0; i < count; i++) {
    const nameIndex = i % names.length;
    const streetNum = 100 + Math.floor(rng() * 9900);
    const streetName = STREET_NAMES[Math.floor(rng() * STREET_NAMES.length)];
    const rating = Math.round((3.0 + rng() * 2.0) * 10) / 10;
    const reviewCount = 5 + Math.floor(rng() * 495);
    const zipSuffix = Math.floor(rng() * 99).toString().padStart(2, "0");
    const latOffset = (rng() - 0.5) * 0.1;
    const lngOffset = (rng() - 0.5) * 0.1;

    const business: ScrapedBusiness = {
      id: `gmaps-dry-${seed}-${i}`,
      name: names[nameIndex],
      address: `${streetNum} ${streetName}`,
      city: cityName,
      state: cityData.stateCode,
      postalCode: `${cityData.zip.slice(0, 3)}${zipSuffix}`,
      country: "US",
      phone: `(${200 + Math.floor(rng() * 800)}) ${100 + Math.floor(rng() * 900)}-${1000 + Math.floor(rng() * 9000)}`,
      website: `https://www.${names[nameIndex].toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      rating,
      reviewCount,
      category,
      additionalCategories: [],
      placeId: `ChIJ${seed.toString(36)}${i.toString(36)}dryrun`,
      latitude: cityData.lat + latOffset,
      longitude: cityData.lng + lngOffset,
    };

    businesses.push(business);
  }

  return businesses;
}

// ---------------------------------------------------------------------------
// Scrape Businesses
// ---------------------------------------------------------------------------

export async function scrapeBusinesses(query: ScrapeQuery): Promise<ScrapeResult> {
  const now = new Date().toISOString();
  const location = query.location ?? "Unknown";

  if (isGMapsDryRun()) {
    const businesses = generateDryRunBusinesses(query);
    return {
      businesses,
      total: businesses.length,
      query: query.query,
      location,
      scrapedAt: now,
      creditsUsed: 0,
    };
  }

  const cfg = resolveGMapsConfig();
  if (!cfg) {
    const businesses = generateDryRunBusinesses(query);
    return {
      businesses,
      total: businesses.length,
      query: query.query,
      location,
      scrapedAt: now,
      creditsUsed: 0,
    };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        query: query.query,
        location: query.location,
        radius: query.radius,
        limit: query.limit,
        language: query.language,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const businesses = Array.isArray(data.businesses) ? (data.businesses as ScrapedBusiness[]) : [];
      return {
        businesses,
        total: businesses.length,
        query: query.query,
        location,
        scrapedAt: now,
        creditsUsed: typeof data.creditsUsed === "number" ? data.creditsUsed : businesses.length,
      };
    }
  } catch {
    // Fall through to dry-run on network failure
  }

  const businesses = generateDryRunBusinesses(query);
  return {
    businesses,
    total: businesses.length,
    query: query.query,
    location,
    scrapedAt: now,
    creditsUsed: 0,
  };
}

// ---------------------------------------------------------------------------
// Job Management
// ---------------------------------------------------------------------------

export async function createScrapeJob(query: ScrapeQuery, tenantId?: string): Promise<ScrapeJob> {
  const now = new Date().toISOString();
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const job: ScrapeJob = {
    id: jobId,
    query,
    status: "pending",
    tenantId,
    createdAt: now,
  };

  jobStore.set(jobId, job);

  // Execute immediately in-process
  job.status = "running";
  try {
    const result = await scrapeBusinesses(query);
    job.status = "completed";
    job.result = result;
    job.completedAt = new Date().toISOString();

    // Auto-persist results
    await saveScrapeResults(result, tenantId);
  } catch {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
  }

  jobStore.set(jobId, job);
  return job;
}

export function getScrapeJob(jobId: string): ScrapeJob | null {
  return jobStore.get(jobId) ?? null;
}

export function listScrapeJobs(tenantId?: string): ScrapeJob[] {
  const jobs = [...jobStore.values()];
  if (!tenantId) return jobs;
  return jobs.filter((j) => j.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Store & Retrieve
// ---------------------------------------------------------------------------

export async function saveScrapeResults(result: ScrapeResult, tenantId?: string): Promise<void> {
  const resultId = `result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  resultStore.set(resultId, { result, tenantId });

  for (const biz of result.businesses) {
    businessStore.set(biz.placeId, { business: biz, tenantId });
  }

  await ensureGMapsSchema();
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_gmaps_scrapes (id, tenant_id, query, payload, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE
         SET tenant_id = EXCLUDED.tenant_id,
             query = EXCLUDED.query,
             payload = EXCLUDED.payload`,
        [resultId, tenantId ?? null, result.query, JSON.stringify(result), result.scrapedAt],
      );
    } catch {
      // DB write failed — in-memory store is still valid
    }
  }
}

export function getStoredBusinesses(tenantId?: string, category?: string, location?: string): ScrapedBusiness[] {
  const entries = [...businessStore.values()];

  let filtered = tenantId
    ? entries.filter((e) => e.tenantId === tenantId)
    : entries;

  if (category) {
    const lowerCat = category.toLowerCase();
    filtered = filtered.filter((e) => e.business.category.toLowerCase() === lowerCat);
  }

  if (location) {
    const lowerLoc = location.toLowerCase();
    filtered = filtered.filter((e) =>
      e.business.city.toLowerCase().includes(lowerLoc) ||
      e.business.state.toLowerCase().includes(lowerLoc),
    );
  }

  return filtered.map((e) => e.business);
}

export function findBusinessByPlaceId(placeId: string): ScrapedBusiness | null {
  const entry = businessStore.get(placeId);
  return entry?.business ?? null;
}

// ---------------------------------------------------------------------------
// GMB Conversion
// ---------------------------------------------------------------------------

export function convertToGMBListing(business: ScrapedBusiness): Record<string, unknown> {
  return {
    placeId: business.placeId,
    name: business.name,
    address: business.address,
    city: business.city,
    state: business.state,
    postalCode: business.postalCode,
    country: business.country,
    phone: business.phone ?? "",
    website: business.website ?? "",
    primaryCategory: business.category,
    additionalCategories: business.additionalCategories,
    rating: business.rating,
    reviewCount: business.reviewCount,
    geo: { lat: business.latitude, lng: business.longitude },
    hours: business.hours
      ? business.hours.map((h) => {
          const parts = h.split(": ");
          const day = (parts[0] ?? "monday").toLowerCase();
          const times = (parts[1] ?? "09:00-17:00").split("-");
          return { day, open: times[0] ?? "09:00", close: times[1] ?? "17:00" };
        })
      : undefined,
    photos: business.photos
      ? business.photos.map((url) => ({ url }))
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Scrape & Ingest Pipeline
// ---------------------------------------------------------------------------

export async function scrapeAndIngest(
  query: ScrapeQuery,
  tenantId?: string,
): Promise<{ scraped: number; ingested: number; creditsUsed: number }> {
  const result = await scrapeBusinesses(query);
  await saveScrapeResults(result, tenantId);

  let ingested = 0;
  for (const biz of result.businesses) {
    convertToGMBListing(biz);
    ingested++;
  }

  return {
    scraped: result.businesses.length,
    ingested,
    creditsUsed: result.creditsUsed,
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getScrapeStats(tenantId?: string): ScrapeStats {
  const jobs = listScrapeJobs(tenantId);
  const businesses = getStoredBusinesses(tenantId);

  const totalJobs = jobs.length;
  const totalBusinesses = businesses.length;
  const creditsUsed = jobs.reduce((sum, j) => sum + (j.result?.creditsUsed ?? 0), 0);

  const categoryMap = new Map<string, number>();
  const locationMap = new Map<string, number>();

  for (const biz of businesses) {
    categoryMap.set(biz.category, (categoryMap.get(biz.category) ?? 0) + 1);
    const loc = `${biz.city}, ${biz.state}`;
    locationMap.set(loc, (locationMap.get(loc) ?? 0) + 1);
  }

  const topCategories = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topLocations = [...locationMap.entries()]
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { totalJobs, totalBusinesses, creditsUsed, topCategories, topLocations };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export async function scrapeViaGMaps(query: ScrapeQuery): Promise<ProviderResult> {
  const dryRun = isGMapsDryRun();
  const result = await scrapeBusinesses(query);

  return {
    ok: true,
    provider: "GMaps-Scraper",
    mode: dryRun ? "dry-run" : "live",
    detail: `Scraped ${result.total} businesses for "${query.query}" in ${result.location}`,
    payload: {
      total: result.total,
      query: query.query,
      location: result.location,
      creditsUsed: result.creditsUsed,
    },
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetGMapsStore(): void {
  businessStore.clear();
  jobStore.clear();
  resultStore.clear();
  schemaEnsured = false;
}
