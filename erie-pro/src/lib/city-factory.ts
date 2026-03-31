// ── City Replication System ─────────────────────────────────────────
// Makes it trivial to replicate erie.pro to any new city.
// Pre-defined templates for immediate deployment.

import type { CityConfig } from "./city-config";

export interface CityTemplate {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  domain: string;
  population: number;
  coordinates: { lat: number; lng: number };
  serviceArea: string[];
  tagline: string;
  status: "active" | "coming-soon" | "planned";
}

// ── Pre-defined City Templates ──────────────────────────────────────

export const CITY_TEMPLATES: CityTemplate[] = [
  // Erie (current — active)
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
    status: "active",
  },
  // Phase 2 — Coming Soon
  {
    slug: "pittsburgh",
    name: "Pittsburgh",
    state: "Pennsylvania",
    stateCode: "PA",
    domain: "pittsburgh.pro",
    population: 302000,
    coordinates: { lat: 40.4406, lng: -79.9959 },
    serviceArea: [
      "Pittsburgh", "Mt. Lebanon", "Bethel Park", "Ross Township", "Penn Hills",
      "Monroeville", "Cranberry Township", "McCandless", "Shaler", "North Hills",
    ],
    tagline: "Pittsburgh's local business directory powered by AI",
    status: "coming-soon",
  },
  {
    slug: "buffalo",
    name: "Buffalo",
    state: "New York",
    stateCode: "NY",
    domain: "buffalo.pro",
    population: 278000,
    coordinates: { lat: 42.8864, lng: -78.8784 },
    serviceArea: [
      "Buffalo", "Cheektowaga", "Amherst", "Tonawanda", "Hamburg",
      "West Seneca", "Orchard Park", "Clarence", "Lancaster", "Depew",
    ],
    tagline: "Buffalo's local business directory powered by AI",
    status: "coming-soon",
  },
  {
    slug: "cleveland",
    name: "Cleveland",
    state: "Ohio",
    stateCode: "OH",
    domain: "cleveland.pro",
    population: 373000,
    coordinates: { lat: 41.4993, lng: -81.6944 },
    serviceArea: [
      "Cleveland", "Parma", "Lakewood", "Euclid", "Strongsville",
      "Westlake", "North Olmsted", "Mentor", "Solon", "Brunswick",
    ],
    tagline: "Cleveland's local business directory powered by AI",
    status: "coming-soon",
  },
  {
    slug: "rochester",
    name: "Rochester",
    state: "New York",
    stateCode: "NY",
    domain: "rochester.pro",
    population: 211000,
    coordinates: { lat: 43.1566, lng: -77.6088 },
    serviceArea: [
      "Rochester", "Greece", "Irondequoit", "Brighton", "Henrietta",
      "Webster", "Penfield", "Pittsford", "Gates", "Chili",
    ],
    tagline: "Rochester's local business directory powered by AI",
    status: "coming-soon",
  },
  // Phase 3 — Planned
  {
    slug: "akron",
    name: "Akron",
    state: "Ohio",
    stateCode: "OH",
    domain: "akron.pro",
    population: 190000,
    coordinates: { lat: 41.0814, lng: -81.519 },
    serviceArea: [
      "Akron", "Cuyahoga Falls", "Stow", "Hudson", "Tallmadge",
      "Barberton", "Green", "Copley", "Fairlawn", "Munroe Falls",
    ],
    tagline: "Akron's local business directory powered by AI",
    status: "planned",
  },
  {
    slug: "youngstown",
    name: "Youngstown",
    state: "Ohio",
    stateCode: "OH",
    domain: "youngstown.pro",
    population: 60000,
    coordinates: { lat: 41.0998, lng: -80.6495 },
    serviceArea: [
      "Youngstown", "Boardman", "Canfield", "Poland", "Austintown",
      "Hubbard", "Warren", "Niles", "Girard", "Liberty",
    ],
    tagline: "Youngstown's local business directory powered by AI",
    status: "planned",
  },
];

// ── Query Functions ─────────────────────────────────────────────────

export function getCityTemplate(slug: string): CityTemplate | undefined {
  return CITY_TEMPLATES.find((c) => c.slug === slug);
}

export function getAllCityTemplates(): CityTemplate[] {
  return [...CITY_TEMPLATES];
}

export function getActiveCities(): CityTemplate[] {
  return CITY_TEMPLATES.filter((c) => c.status === "active");
}

export function getComingSoonCities(): CityTemplate[] {
  return CITY_TEMPLATES.filter((c) => c.status === "coming-soon");
}

export function getPlannedCities(): CityTemplate[] {
  return CITY_TEMPLATES.filter((c) => c.status === "planned");
}

// ── City Configuration Generator ────────────────────────────────────

/**
 * Generate the content for a city-config.ts file from a template.
 * This output can be written directly to a new city project.
 */
export function generateCityConfig(template: CityTemplate): string {
  return `export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  domain: string;
  population: number;
  coordinates: { lat: number; lng: number };
  serviceArea: string[];
  tagline: string;
}

export const cityConfig: CityConfig = {
  slug: "${template.slug}",
  name: "${template.name}",
  state: "${template.state}",
  stateCode: "${template.stateCode}",
  domain: "${template.domain}",
  population: ${template.population},
  coordinates: { lat: ${template.coordinates.lat}, lng: ${template.coordinates.lng} },
  serviceArea: ${JSON.stringify(template.serviceArea, null, 4).replace(/\n/g, "\n  ")},
  tagline: "${template.tagline}",
};
`;
}

/**
 * Get expansion statistics.
 */
export function getExpansionStats(): {
  totalCities: number;
  active: number;
  comingSoon: number;
  planned: number;
  totalPopulationReach: number;
  totalServiceAreas: number;
} {
  const all = CITY_TEMPLATES;
  const totalPop = all.reduce((sum, c) => sum + c.population, 0);
  const totalAreas = all.reduce((sum, c) => sum + c.serviceArea.length, 0);

  return {
    totalCities: all.length,
    active: all.filter((c) => c.status === "active").length,
    comingSoon: all.filter((c) => c.status === "coming-soon").length,
    planned: all.filter((c) => c.status === "planned").length,
    totalPopulationReach: totalPop,
    totalServiceAreas: totalAreas,
  };
}
