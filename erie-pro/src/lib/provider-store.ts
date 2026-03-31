// ── Provider Data Management ────────────────────────────────────────
// In-memory store for service provider profiles with full CRUD operations.

export interface ProviderProfile {
  id: string;
  slug: string;
  businessName: string;
  niche: string;
  city: string;
  // Contact
  phone: string;
  email: string;
  website?: string;
  // Location
  address: { street: string; city: string; state: string; zip: string };
  serviceAreas: string[];
  // Business details
  description: string;
  yearEstablished: number;
  employeeCount: string;
  license?: string;
  insurance: boolean;
  // Subscription
  tier: "primary" | "backup" | "overflow";
  subscriptionStatus: "active" | "trial" | "expired" | "cancelled";
  monthlyFee: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Performance
  totalLeads: number;
  convertedLeads: number;
  avgResponseTime: number; // seconds
  avgRating: number;
  reviewCount: number;
  // Timestamps
  claimedAt: string;
  lastLeadAt?: string;
}

// ── In-Memory Store ─────────────────────────────────────────────────

function generateId(): string {
  return `prov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const providers: Map<string, ProviderProfile> = new Map();

// ── Seed Data ───────────────────────────────────────────────────────

const seedProviders: ProviderProfile[] = [
  {
    id: "prov-plumb-001",
    slug: "johnson-plumbing-erie",
    businessName: "Johnson Plumbing & Drain",
    niche: "plumbing",
    city: "erie",
    phone: "(814) 555-0101",
    email: "leads@johnsonplumbing-erie.com",
    website: "https://erie.pro/plumbing/johnson-plumbing-erie",
    address: { street: "1420 Peach St", city: "Erie", state: "PA", zip: "16501" },
    serviceAreas: ["Erie", "Millcreek", "Harborcreek", "Fairview"],
    description: "Full-service plumbing company specializing in emergency repairs, drain cleaning, water heater installation, and residential remodeling plumbing. Family-owned since 2005.",
    yearEstablished: 2005,
    employeeCount: "6-10",
    license: "PA-PLB-039271",
    insurance: true,
    tier: "primary",
    subscriptionStatus: "active",
    monthlyFee: 500,
    stripeCustomerId: "cus_mock_johnson",
    stripeSubscriptionId: "sub_mock_johnson",
    totalLeads: 147,
    convertedLeads: 98,
    avgResponseTime: 420,
    avgRating: 4.7,
    reviewCount: 63,
    claimedAt: "2024-06-15T10:00:00Z",
    lastLeadAt: "2026-03-28T14:30:00Z",
  },
  {
    id: "prov-hvac-001",
    slug: "erie-comfort-hvac",
    businessName: "Erie Comfort HVAC",
    niche: "hvac",
    city: "erie",
    phone: "(814) 555-0301",
    email: "leads@eriecomforthvac.com",
    website: "https://erie.pro/hvac/erie-comfort-hvac",
    address: { street: "3205 W 26th St", city: "Erie", state: "PA", zip: "16506" },
    serviceAreas: ["Erie", "Millcreek", "Summit Township", "McKean"],
    description: "Heating, cooling, and indoor air quality experts. We service all makes and models. 24/7 emergency service available. EPA-certified technicians.",
    yearEstablished: 2010,
    employeeCount: "11-20",
    license: "PA-HVAC-051842",
    insurance: true,
    tier: "primary",
    subscriptionStatus: "active",
    monthlyFee: 500,
    stripeCustomerId: "cus_mock_eriecomfort",
    stripeSubscriptionId: "sub_mock_eriecomfort",
    totalLeads: 112,
    convertedLeads: 71,
    avgResponseTime: 600,
    avgRating: 4.5,
    reviewCount: 48,
    claimedAt: "2024-07-01T09:00:00Z",
    lastLeadAt: "2026-03-27T11:15:00Z",
  },
  {
    id: "prov-elec-001",
    slug: "bayfront-electric",
    businessName: "Bayfront Electric Services",
    niche: "electrical",
    city: "erie",
    phone: "(814) 555-0401",
    email: "leads@bayfrontelectric.com",
    address: { street: "855 E 12th St", city: "Erie", state: "PA", zip: "16503" },
    serviceAreas: ["Erie", "Harborcreek", "North East"],
    description: "Licensed electricians providing panel upgrades, rewiring, lighting installation, and code compliance inspections. Commercial and residential.",
    yearEstablished: 2012,
    employeeCount: "6-10",
    license: "PA-ELEC-028374",
    insurance: true,
    tier: "primary",
    subscriptionStatus: "active",
    monthlyFee: 500,
    totalLeads: 89,
    convertedLeads: 54,
    avgResponseTime: 540,
    avgRating: 4.4,
    reviewCount: 37,
    claimedAt: "2024-08-10T14:00:00Z",
    lastLeadAt: "2026-03-26T16:45:00Z",
  },
  {
    id: "prov-dental-001",
    slug: "lakeshore-dental",
    businessName: "Lakeshore Family Dental",
    niche: "dental",
    city: "erie",
    phone: "(814) 555-0501",
    email: "appointments@lakeshoredental.com",
    website: "https://erie.pro/dental/lakeshore-dental",
    address: { street: "2500 Peach St Suite 200", city: "Erie", state: "PA", zip: "16502" },
    serviceAreas: ["Erie", "Millcreek", "Fairview", "Edinboro"],
    description: "Comprehensive family dental care including cleanings, cosmetic dentistry, Invisalign, dental implants, and emergency services. Accepting new patients.",
    yearEstablished: 1998,
    employeeCount: "11-20",
    license: "PA-DDS-018293",
    insurance: true,
    tier: "primary",
    subscriptionStatus: "active",
    monthlyFee: 800,
    stripeCustomerId: "cus_mock_lakeshore",
    stripeSubscriptionId: "sub_mock_lakeshore",
    totalLeads: 201,
    convertedLeads: 162,
    avgResponseTime: 300,
    avgRating: 4.8,
    reviewCount: 124,
    claimedAt: "2024-05-20T08:00:00Z",
    lastLeadAt: "2026-03-29T10:00:00Z",
  },
  {
    id: "prov-legal-001",
    slug: "erie-law-partners",
    businessName: "Erie Law Partners LLC",
    niche: "legal",
    city: "erie",
    phone: "(814) 555-0601",
    email: "intake@erielawpartners.com",
    website: "https://erie.pro/legal/erie-law-partners",
    address: { street: "100 State St Suite 400", city: "Erie", state: "PA", zip: "16501" },
    serviceAreas: ["Erie", "Millcreek", "Harborcreek", "Fairview", "Summit Township"],
    description: "Full-service law firm specializing in personal injury, family law, criminal defense, and estate planning. Free initial consultations.",
    yearEstablished: 2001,
    employeeCount: "6-10",
    license: "PA-BAR-204857",
    insurance: true,
    tier: "primary",
    subscriptionStatus: "active",
    monthlyFee: 1000,
    stripeCustomerId: "cus_mock_erielaw",
    stripeSubscriptionId: "sub_mock_erielaw",
    totalLeads: 95,
    convertedLeads: 58,
    avgResponseTime: 480,
    avgRating: 4.6,
    reviewCount: 41,
    claimedAt: "2024-06-01T12:00:00Z",
    lastLeadAt: "2026-03-28T09:20:00Z",
  },
  {
    id: "prov-roof-001",
    slug: "great-lakes-roofing",
    businessName: "Great Lakes Roofing Co.",
    niche: "roofing",
    city: "erie",
    phone: "(814) 555-0701",
    email: "estimates@greatlakesroofing.com",
    address: { street: "4010 W Ridge Rd", city: "Erie", state: "PA", zip: "16506" },
    serviceAreas: ["Erie", "Millcreek", "Fairview", "Girard", "McKean"],
    description: "Trusted roofers serving Erie County for over 15 years. Shingle, metal, and flat roof installation. Storm damage restoration and insurance claim assistance.",
    yearEstablished: 2008,
    employeeCount: "11-20",
    license: "PA-ROOF-043918",
    insurance: true,
    tier: "primary",
    subscriptionStatus: "active",
    monthlyFee: 400,
    totalLeads: 76,
    convertedLeads: 49,
    avgResponseTime: 720,
    avgRating: 4.3,
    reviewCount: 32,
    claimedAt: "2024-09-01T10:00:00Z",
    lastLeadAt: "2026-03-25T13:00:00Z",
  },
];

// Initialize store with seed data
for (const p of seedProviders) {
  providers.set(p.id, p);
}

// ── CRUD Operations ─────────────────────────────────────────────────

export function getProvider(id: string): ProviderProfile | undefined {
  return providers.get(id);
}

export function getProviderBySlug(slug: string): ProviderProfile | undefined {
  for (const p of providers.values()) {
    if (p.slug === slug) return p;
  }
  return undefined;
}

export function getProviderByNicheAndCity(niche: string, city: string): ProviderProfile | undefined {
  for (const p of providers.values()) {
    if (
      p.niche === niche &&
      p.city.toLowerCase() === city.toLowerCase() &&
      p.tier === "primary" &&
      p.subscriptionStatus === "active"
    ) {
      return p;
    }
  }
  return undefined;
}

export function getProvidersByNiche(niche: string): ProviderProfile[] {
  return Array.from(providers.values()).filter((p) => p.niche === niche);
}

export function getAllProviders(): ProviderProfile[] {
  return Array.from(providers.values());
}

export function getActiveProviders(): ProviderProfile[] {
  return Array.from(providers.values()).filter(
    (p) => p.subscriptionStatus === "active"
  );
}

export function createProvider(
  data: Omit<ProviderProfile, "id" | "claimedAt">
): ProviderProfile {
  const id = generateId();
  const profile: ProviderProfile = {
    ...data,
    id,
    slug: data.slug || slugify(data.businessName + "-" + data.city),
    claimedAt: new Date().toISOString(),
  };
  providers.set(id, profile);
  return profile;
}

export function updateProvider(
  id: string,
  updates: Partial<ProviderProfile>
): ProviderProfile | undefined {
  const existing = providers.get(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...updates, id: existing.id };
  providers.set(id, updated);
  return updated;
}

export function deleteProvider(id: string): boolean {
  return providers.delete(id);
}

// ── Query Helpers ───────────────────────────────────────────────────

export function getProviderStats(): {
  total: number;
  active: number;
  totalLeads: number;
  totalConverted: number;
  avgRating: number;
} {
  const all = getAllProviders();
  const active = all.filter((p) => p.subscriptionStatus === "active");
  const totalLeads = all.reduce((sum, p) => sum + p.totalLeads, 0);
  const totalConverted = all.reduce((sum, p) => sum + p.convertedLeads, 0);
  const avgRating =
    all.length > 0
      ? Math.round((all.reduce((sum, p) => sum + p.avgRating, 0) / all.length) * 10) / 10
      : 0;

  return { total: all.length, active: active.length, totalLeads, totalConverted, avgRating };
}

export function getClaimedNiches(city: string): string[] {
  return Array.from(providers.values())
    .filter(
      (p) =>
        p.city.toLowerCase() === city.toLowerCase() &&
        p.subscriptionStatus === "active" &&
        p.tier === "primary"
    )
    .map((p) => p.niche);
}

export function getAvailableNiches(city: string, allNicheSlugs: string[]): string[] {
  const claimed = new Set(getClaimedNiches(city));
  return allNicheSlugs.filter((slug) => !claimed.has(slug));
}
