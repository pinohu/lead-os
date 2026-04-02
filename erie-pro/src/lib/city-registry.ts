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
      "Erie", "Millcreek", "Harborcreek", "Fairview", "Summit Township",
      "McKean", "Edinboro", "Waterford", "North East", "Girard",
    ],
    tagline: "Erie's local business directory powered by AI",
    timezone: "America/New_York",
    pricingMultiplier: 1.0,
    metroArea: "Erie Metro Area",
    counties: ["Erie County"],
  },
  // ── Expansion cities (uncomment when ready to deploy) ────────────
  // {
  //   slug: "meadville",
  //   name: "Meadville",
  //   state: "Pennsylvania",
  //   stateCode: "PA",
  //   domain: "meadville.pro",
  //   population: 13000,
  //   coordinates: { lat: 41.6414, lng: -80.1515 },
  //   serviceArea: [
  //     "Meadville", "Vernon Township", "West Mead", "East Mead",
  //     "Hayfield", "Cambridge Springs", "Saegertown", "Conneaut Lake",
  //   ],
  //   tagline: "Meadville's trusted local service directory",
  //   timezone: "America/New_York",
  //   pricingMultiplier: 0.7,
  //   metroArea: "Crawford County",
  //   counties: ["Crawford County"],
  // },
  // {
  //   slug: "warren",
  //   name: "Warren",
  //   state: "Pennsylvania",
  //   stateCode: "PA",
  //   domain: "warren.pro",
  //   population: 9400,
  //   coordinates: { lat: 41.8439, lng: -79.1453 },
  //   serviceArea: [
  //     "Warren", "Pleasant Township", "Glade Township", "Conewango",
  //     "Youngsville", "Sugar Grove", "Sheffield",
  //   ],
  //   tagline: "Warren's local service connection",
  //   timezone: "America/New_York",
  //   pricingMultiplier: 0.65,
  //   metroArea: "Warren County",
  //   counties: ["Warren County"],
  // },
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
