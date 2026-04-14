// ── City Registry ─────────────────────────────────────────────────────
// All supported city deployments. Each city gets its own domain, service
// area, coordinates, and pricing adjustments.
//
// To add a new city:
// 1. Add a CityConfig entry to CITIES below
// 2. Set CITY_SLUG=<slug> in the Vercel project env vars
// 3. Deploy — all 44 niches × 15 page types are auto-generated
//
// Pricing multiplier: 1.0 = base rate, 0.8 = 20% cheaper, 1.3 = 30% premium

export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  domain: string;
  population: number;
  coordinates: { lat: number; lng: number };
  serviceArea: string[];
  tagline: string;
  timezone: string;
  /** Multiplier applied to base niche pricing (1.0 = default) */
  pricingMultiplier: number;
  /** Metro area name for SEO (e.g., "Erie Metro Area") */
  metroArea: string;
  /** Counties served */
  counties: string[];
  /** 30-mile drive-time coverage zone: ZIP codes we route leads in */
  coverageZips?: string[];
  /** Cross-state overlap cities we route to if distance permits */
  overlapAreas?: Array<{ city: string; stateCode: string; zip: string }>;
  /** Pilot categories for the launch phase — featured first on the homepage */
  pilotCategories?: string[];
}

const CITIES: CityConfig[] = [
  {
    slug: "erie",
    name: "Erie",
    state: "Pennsylvania",
    stateCode: "PA",
    domain: "erie.pro",
    population: 95000,
    coordinates: { lat: 42.1292, lng: -80.0851 },
    serviceArea: [
      "Erie", "Millcreek", "Harborcreek", "Wesleyville", "Lawrence Park",
      "Fairview", "Girard", "Lake City", "Albion",
      "North East", "Waterford", "Edinboro", "McKean", "Union City",
      "Cambridge Springs",
    ],
    tagline: "One pro. No bidding. Always Erie.",
    timezone: "America/New_York",
    pricingMultiplier: 1.0,
    metroArea: "Erie Metro Area",
    counties: ["Erie County"],
    // 30-mile drive-time coverage zone per the Erie Pro Launch Kit.
    // Core Erie + Millcreek/Harborcreek/Wesleyville/Lawrence Park + N/S/E/W overlap.
    coverageZips: [
      "16501", "16502", "16503", "16504", "16505", "16506", "16507",
      "16508", "16509", "16510", "16511",                     // core Erie + inner ring
      "16421", "16428",                                         // Harborcreek, North East
      "16415", "16417", "16423", "16401",                       // Fairview, Girard, Lake City, Albion
      "16441", "16412", "16426", "16438", "16403",              // Waterford, Edinboro, McKean, Union City, Cambridge Springs
    ],
    overlapAreas: [
      { city: "Conneaut",     stateCode: "OH", zip: "44030" },
      { city: "Findley Lake", stateCode: "NY", zip: "14736" },
    ],
    // First 3 pilot categories per the Launch Kit (90-day focus).
    pilotCategories: [
      "plumbing", "hvac", "handyman", "cleaning", "snow-removal", "landscaping",
    ],
  },
  // ── Expansion cities ─────────────────────────────────────────────
  // Meadville is the second city. Build with CITY_SLUG=meadville to
  // verify the factory end-to-end before flipping a real domain.
  {
    slug: "meadville",
    name: "Meadville",
    state: "Pennsylvania",
    stateCode: "PA",
    domain: "meadville.pro",
    population: 13000,
    coordinates: { lat: 41.6414, lng: -80.1515 },
    serviceArea: [
      "Meadville", "Vernon Township", "West Mead", "East Mead",
      "Hayfield", "Cambridge Springs", "Saegertown", "Conneaut Lake",
      "Linesville", "Cochranton", "Townville",
    ],
    tagline: "One pro. No bidding. Always Meadville.",
    timezone: "America/New_York",
    pricingMultiplier: 0.7,
    metroArea: "Crawford County",
    counties: ["Crawford County"],
    // Coverage: Meadville core + inner Crawford County. Cambridge
    // Springs (16403) is shared with Erie's drive-time zone.
    coverageZips: [
      "16335", "16354", "16327", "16407", "16424",
      "16314", "16403", "16316", "16433",
    ],
    overlapAreas: [
      { city: "Jamestown", stateCode: "NY", zip: "14701" },
    ],
    // Three-category pilot focus, same pattern as Erie.
    pilotCategories: ["plumbing", "hvac", "handyman"],
  },
  // Warren is the third city — similar size to Meadville but in the
  // Allegheny National Forest corridor. Smaller market so we price at
  // 0.65× the Erie base rate.
  {
    slug: "warren",
    name: "Warren",
    state: "Pennsylvania",
    stateCode: "PA",
    domain: "warren.pro",
    population: 9400,
    coordinates: { lat: 41.8439, lng: -79.1453 },
    serviceArea: [
      "Warren", "Pleasant Township", "Glade Township", "Conewango Township",
      "Youngsville", "Sugar Grove", "Sheffield", "Tidioute",
      "Clarendon", "Russell", "Starbrick",
    ],
    tagline: "One pro. No bidding. Always Warren.",
    timezone: "America/New_York",
    pricingMultiplier: 0.65,
    metroArea: "Warren County",
    counties: ["Warren County"],
    // Warren's core ZIPs cluster tightly around the city proper plus
    // the National Forest edge communities.
    coverageZips: [
      "16365", "16371", "16372", "16347",
      "16353", "16438", "16340", "16254",
    ],
    overlapAreas: [
      { city: "Jamestown", stateCode: "NY", zip: "14701" },
    ],
    pilotCategories: ["plumbing", "hvac", "handyman"],
  },
  // {
  //   slug: "jamestown",
  //   name: "Jamestown",
  //   state: "New York",
  //   stateCode: "NY",
  //   domain: "jamestown.pro",
  //   population: 29000,
  //   coordinates: { lat: 42.097, lng: -79.2353 },
  //   serviceArea: [
  //     "Jamestown", "Lakewood", "Falconer", "Celoron", "Frewsburg",
  //     "Bemus Point", "Ashville", "Busti",
  //   ],
  //   tagline: "Jamestown's premier local service directory",
  //   timezone: "America/New_York",
  //   pricingMultiplier: 0.8,
  //   metroArea: "Chautauqua County",
  //   counties: ["Chautauqua County"],
  // },
  // {
  //   slug: "ashtabula",
  //   name: "Ashtabula",
  //   state: "Ohio",
  //   stateCode: "OH",
  //   domain: "ashtabula.pro",
  //   population: 18000,
  //   coordinates: { lat: 41.865, lng: -80.789 },
  //   serviceArea: [
  //     "Ashtabula", "Geneva", "Conneaut", "Jefferson", "Kingsville",
  //     "North Kingsville", "Saybrook", "Plymouth",
  //   ],
  //   tagline: "Ashtabula's trusted local service providers",
  //   timezone: "America/New_York",
  //   pricingMultiplier: 0.75,
  //   metroArea: "Ashtabula County",
  //   counties: ["Ashtabula County"],
  // },
];

/** Get all registered cities */
export function getAllCities(): CityConfig[] {
  return CITIES;
}

/** Look up a city by slug */
export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find((c) => c.slug === slug);
}

/** Get all active city slugs */
export function getAllCitySlugs(): string[] {
  return CITIES.map((c) => c.slug);
}

/** Calculate adjusted price for a city (base price × multiplier) */
export function getCityAdjustedPrice(citySlug: string, basePrice: number): number {
  const city = getCityBySlug(citySlug);
  return Math.round(basePrice * (city?.pricingMultiplier ?? 1.0));
}
