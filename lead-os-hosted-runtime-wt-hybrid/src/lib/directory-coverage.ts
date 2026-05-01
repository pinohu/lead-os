import { nicheCatalog, type NicheDefinition } from "./catalog.ts";
import { directoryCategories } from "./directory-solution.ts";

export type DirectoryCoverageKind = "city" | "state" | "region" | "national-niche" | "national";

export interface DirectoryMarket {
  slug: string;
  label: string;
  state?: string;
  regionSlug: string;
  populationTier: "anchor" | "major" | "emerging";
  seedTenantId?: string;
  seededCategories?: string[];
  notes: string;
}

export interface DirectoryRegion {
  slug: string;
  label: string;
  states: string[];
  citySlugs: string[];
  summary: string;
}

export interface DirectoryState {
  slug: string;
  label: string;
  code: string;
  regionSlug: string;
  citySlugs: string[];
}

export interface DirectoryCoveragePage {
  slug: string;
  kind: DirectoryCoverageKind;
  label: string;
  title: string;
  summary: string;
  audience: string;
  routePattern: string;
  primaryMarket?: DirectoryMarket;
  state?: DirectoryState;
  region?: DirectoryRegion;
  niche?: NicheDefinition;
  niches: NicheDefinition[];
  markets: DirectoryMarket[];
  operationalNotes: string[];
  canonicalLinks: Array<{ label: string; href: string; description: string }>;
}

const directoryNiches = Object.values(nicheCatalog).filter((niche) => niche.slug !== "general");

export const directoryRegions: DirectoryRegion[] = [
  {
    slug: "northeast",
    label: "Northeast",
    states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "DE", "MD", "DC"],
    citySlugs: ["city-new-york-ny", "city-boston-ma", "city-philadelphia-pa", "city-pittsburgh-pa", "city-baltimore-md"],
    summary: "Dense metro and corridor markets where local search, lead routing, and service-area ownership compound quickly.",
  },
  {
    slug: "great-lakes",
    label: "Great Lakes",
    states: ["IL", "IN", "MI", "OH", "PA", "WI", "MN"],
    citySlugs: ["city-chicago-il", "city-detroit-mi", "city-cleveland-oh", "city-columbus-oh", "city-erie-pa", "city-milwaukee-wi", "city-minneapolis-mn"],
    summary: "Clustered city and mid-market service corridors with strong home-service, healthcare, legal, and franchise demand.",
  },
  {
    slug: "southeast",
    label: "Southeast",
    states: ["VA", "NC", "SC", "GA", "AL", "MS", "TN", "KY", "AR", "LA"],
    citySlugs: ["city-atlanta-ga", "city-charlotte-nc", "city-nashville-tn", "city-raleigh-nc", "city-new-orleans-la"],
    summary: "Fast-growth metros and regional service hubs suited for multi-niche directories and territory resale.",
  },
  {
    slug: "florida",
    label: "Florida",
    states: ["FL"],
    citySlugs: ["city-miami-fl", "city-orlando-fl", "city-tampa-fl", "city-jacksonville-fl"],
    summary: "A standalone state cluster because demand, tourism, healthcare, legal, home services, and real estate overlap heavily.",
  },
  {
    slug: "texas",
    label: "Texas",
    states: ["TX"],
    citySlugs: ["city-houston-tx", "city-dallas-tx", "city-austin-tx", "city-san-antonio-tx"],
    summary: "A standalone state cluster for high-volume city directories and niche territory ownership.",
  },
  {
    slug: "west-coast",
    label: "West Coast",
    states: ["CA", "OR", "WA", "AK", "HI"],
    citySlugs: ["city-los-angeles-ca", "city-san-francisco-ca", "city-san-diego-ca", "city-seattle-wa", "city-portland-or"],
    summary: "Large metro markets where national niche pages can feed regional and city-level buyer routing.",
  },
  {
    slug: "mountain-west",
    label: "Mountain West",
    states: ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY"],
    citySlugs: ["city-phoenix-az", "city-denver-co", "city-las-vegas-nv", "city-salt-lake-city-ut"],
    summary: "Growth and migration markets with strong service-area, real estate, healthcare, and franchise opportunities.",
  },
  {
    slug: "plains-midwest",
    label: "Plains and Midwest",
    states: ["IA", "KS", "MO", "NE", "ND", "OK", "SD"],
    citySlugs: ["city-kansas-city-mo", "city-st-louis-mo", "city-omaha-ne", "city-oklahoma-city-ok"],
    summary: "Efficient regional grouping for state-wide directories where individual city pages can be added as demand proves out.",
  },
];

const stateRows: Array<[string, string, string]> = [
  ["AL", "Alabama", "southeast"], ["AK", "Alaska", "west-coast"], ["AZ", "Arizona", "mountain-west"], ["AR", "Arkansas", "southeast"],
  ["CA", "California", "west-coast"], ["CO", "Colorado", "mountain-west"], ["CT", "Connecticut", "northeast"], ["DE", "Delaware", "northeast"],
  ["FL", "Florida", "florida"], ["GA", "Georgia", "southeast"], ["HI", "Hawaii", "west-coast"], ["ID", "Idaho", "mountain-west"],
  ["IL", "Illinois", "great-lakes"], ["IN", "Indiana", "great-lakes"], ["IA", "Iowa", "plains-midwest"], ["KS", "Kansas", "plains-midwest"],
  ["KY", "Kentucky", "southeast"], ["LA", "Louisiana", "southeast"], ["ME", "Maine", "northeast"], ["MD", "Maryland", "northeast"],
  ["MA", "Massachusetts", "northeast"], ["MI", "Michigan", "great-lakes"], ["MN", "Minnesota", "great-lakes"], ["MS", "Mississippi", "southeast"],
  ["MO", "Missouri", "plains-midwest"], ["MT", "Montana", "mountain-west"], ["NE", "Nebraska", "plains-midwest"], ["NV", "Nevada", "mountain-west"],
  ["NH", "New Hampshire", "northeast"], ["NJ", "New Jersey", "northeast"], ["NM", "New Mexico", "mountain-west"], ["NY", "New York", "northeast"],
  ["NC", "North Carolina", "southeast"], ["ND", "North Dakota", "plains-midwest"], ["OH", "Ohio", "great-lakes"], ["OK", "Oklahoma", "plains-midwest"],
  ["OR", "Oregon", "west-coast"], ["PA", "Pennsylvania", "great-lakes"], ["RI", "Rhode Island", "northeast"], ["SC", "South Carolina", "southeast"],
  ["SD", "South Dakota", "plains-midwest"], ["TN", "Tennessee", "southeast"], ["TX", "Texas", "texas"], ["UT", "Utah", "mountain-west"],
  ["VT", "Vermont", "northeast"], ["VA", "Virginia", "southeast"], ["WA", "Washington", "west-coast"], ["WV", "West Virginia", "southeast"],
  ["WI", "Wisconsin", "great-lakes"], ["WY", "Wyoming", "mountain-west"], ["DC", "Washington, DC", "northeast"],
];

type DirectoryMarketRow = [
  slug: string,
  label: string,
  state: string,
  regionSlug: string,
  populationTier: DirectoryMarket["populationTier"],
  seedTenantId: string | undefined,
  seededCategories: string[] | undefined,
  notes: string,
];

const marketRows: DirectoryMarketRow[] = [
  ["erie-pa", "Erie, PA", "PA", "great-lakes", "anchor", "erie", ["plumbing", "hvac"], "Seeded Erie.pro market with active plumbing and HVAC fallback nodes."],
  ["buffalo-ny", "Buffalo, NY", "NY", "great-lakes", "major", undefined, undefined, "Natural Erie expansion market with overlapping home-service and healthcare demand."],
  ["cleveland-oh", "Cleveland, OH", "OH", "great-lakes", "major", undefined, undefined, "Great Lakes anchor for home services, legal, healthcare, franchise, and staffing."],
  ["pittsburgh-pa", "Pittsburgh, PA", "PA", "northeast", "major", undefined, undefined, "Pennsylvania metro expansion adjacent to Erie and Ohio markets."],
  ["philadelphia-pa", "Philadelphia, PA", "PA", "northeast", "major", undefined, undefined, "Large Northeast metro for legal, healthcare, home services, education, and finance."],
  ["new-york-ny", "New York, NY", "NY", "northeast", "major", undefined, undefined, "National-density metro for premium niche directories and B2B buyer routing."],
  ["boston-ma", "Boston, MA", "MA", "northeast", "major", undefined, undefined, "Healthcare, education, professional services, and technology directory market."],
  ["baltimore-md", "Baltimore, MD", "MD", "northeast", "major", undefined, undefined, "Legal, healthcare, home services, and local media directory market."],
  ["chicago-il", "Chicago, IL", "IL", "great-lakes", "major", undefined, undefined, "Large Great Lakes market for national-to-city routing."],
  ["detroit-mi", "Detroit, MI", "MI", "great-lakes", "major", undefined, undefined, "Regional anchor for trades, staffing, healthcare, franchise, and local services."],
  ["columbus-oh", "Columbus, OH", "OH", "great-lakes", "major", undefined, undefined, "Fast-growing Ohio metro suited for state and city directory demand."],
  ["milwaukee-wi", "Milwaukee, WI", "WI", "great-lakes", "major", undefined, undefined, "Great Lakes city route with strong local service and healthcare demand."],
  ["minneapolis-mn", "Minneapolis, MN", "MN", "great-lakes", "major", undefined, undefined, "Upper Midwest anchor for B2B, home services, healthcare, and education."],
  ["atlanta-ga", "Atlanta, GA", "GA", "southeast", "major", undefined, undefined, "Southeast anchor for franchise, staffing, legal, home services, and healthcare."],
  ["charlotte-nc", "Charlotte, NC", "NC", "southeast", "major", undefined, undefined, "Finance, real estate, home services, and franchise directory market."],
  ["nashville-tn", "Nashville, TN", "TN", "southeast", "major", undefined, undefined, "Healthcare, creator, music, home service, and local media opportunity."],
  ["raleigh-nc", "Raleigh, NC", "NC", "southeast", "major", undefined, undefined, "Education, technology, healthcare, and local service growth market."],
  ["new-orleans-la", "New Orleans, LA", "LA", "southeast", "major", undefined, undefined, "Regional services, tourism-adjacent, legal, home services, and local media."],
  ["miami-fl", "Miami, FL", "FL", "florida", "major", undefined, undefined, "High-volume Florida city for real estate, legal, healthcare, and home services."],
  ["orlando-fl", "Orlando, FL", "FL", "florida", "major", undefined, undefined, "Tourism, home services, healthcare, and franchise-heavy directory market."],
  ["tampa-fl", "Tampa, FL", "FL", "florida", "major", undefined, undefined, "Florida metro with strong local services, healthcare, finance, and real estate."],
  ["jacksonville-fl", "Jacksonville, FL", "FL", "florida", "major", undefined, undefined, "Large service-area city for state-level and city-level lead routing."],
  ["houston-tx", "Houston, TX", "TX", "texas", "major", undefined, undefined, "Large Texas market for legal, home services, healthcare, and B2B directories."],
  ["dallas-tx", "Dallas, TX", "TX", "texas", "major", undefined, undefined, "Texas anchor for multi-niche city routing and franchise territory ownership."],
  ["austin-tx", "Austin, TX", "TX", "texas", "major", undefined, undefined, "Technology, creator, local services, education, and healthcare directory market."],
  ["san-antonio-tx", "San Antonio, TX", "TX", "texas", "major", undefined, undefined, "Texas city route for home services, legal, healthcare, and local media."],
  ["los-angeles-ca", "Los Angeles, CA", "CA", "west-coast", "major", undefined, undefined, "West Coast anchor for health, legal, real estate, creative, and services."],
  ["san-francisco-ca", "San Francisco, CA", "CA", "west-coast", "major", undefined, undefined, "Technology and professional-services market with national buyer overlap."],
  ["san-diego-ca", "San Diego, CA", "CA", "west-coast", "major", undefined, undefined, "Healthcare, real estate, home services, legal, and wellness directory market."],
  ["seattle-wa", "Seattle, WA", "WA", "west-coast", "major", undefined, undefined, "Technology, home services, healthcare, and professional-services route."],
  ["portland-or", "Portland, OR", "OR", "west-coast", "major", undefined, undefined, "West Coast regional route for local services, creative, health, and B2B."],
  ["phoenix-az", "Phoenix, AZ", "AZ", "mountain-west", "major", undefined, undefined, "High-growth Mountain West city for home services, real estate, and healthcare."],
  ["denver-co", "Denver, CO", "CO", "mountain-west", "major", undefined, undefined, "Mountain West anchor for local services, health, technology, and real estate."],
  ["las-vegas-nv", "Las Vegas, NV", "NV", "mountain-west", "major", undefined, undefined, "Regional market for home services, legal, healthcare, and local media."],
  ["salt-lake-city-ut", "Salt Lake City, UT", "UT", "mountain-west", "major", undefined, undefined, "Mountain West growth market for B2B, home services, and family services."],
  ["kansas-city-mo", "Kansas City, MO", "MO", "plains-midwest", "major", undefined, undefined, "Central market for home services, staffing, healthcare, and local media."],
  ["st-louis-mo", "St. Louis, MO", "MO", "plains-midwest", "major", undefined, undefined, "Midwest city for legal, healthcare, home services, and franchise routing."],
  ["omaha-ne", "Omaha, NE", "NE", "plains-midwest", "major", undefined, undefined, "State and regional directory access for professional and local services."],
  ["oklahoma-city-ok", "Oklahoma City, OK", "OK", "plains-midwest", "major", undefined, undefined, "Central market for home services, healthcare, legal, and real estate."],
];

export const directoryMarkets: DirectoryMarket[] = marketRows.map(([slug, label, state, regionSlug, populationTier, seedTenantId, seededCategories, notes]) => ({
  slug: `city-${slug}`,
  label,
  state,
  regionSlug,
  populationTier,
  seedTenantId,
  seededCategories,
  notes,
}));

export const directoryStates: DirectoryState[] = stateRows.map(([code, label, regionSlug]) => ({
  slug: `state-${code.toLowerCase()}`,
  label,
  code,
  regionSlug,
  citySlugs: directoryMarkets.filter((market) => market.state === code).map((market) => market.slug),
}));

export const erieDirectoryAudit = {
  status: "complete",
  tenantId: "erie",
  publicPath: "/directory/city-erie-pa",
  routerPath: "/directory/lead-router",
  docsPath: "/docs/erie-pro",
  sourcePath: "/docs/source/src/lib/erie/directory-lead-flow.ts",
  seededNodes: ["plumber_erie_test_1", "hvac_erie_test_1"],
  seededCategories: ["plumbing", "hvac"],
  verifiedSurfaces: [
    "tenant seed",
    "node resolution",
    "billing gate",
    "delivery handoff",
    "route audit table",
    "operator docs",
    "public router page",
    "city directory page",
  ],
  remainingOperationalInputs: [
    "Add real buyer contact destinations before enabling live delivery.",
    "Add category-specific public copy and proof after Erie receives real traffic.",
    "Keep inactive buyer slots paused until category ownership is sold.",
  ],
};

function regionBySlug(slug: string) {
  return directoryRegions.find((region) => region.slug === slug);
}

function stateByCode(code?: string) {
  return directoryStates.find((state) => state.code === code);
}

function coverageLinksForMarkets(markets: DirectoryMarket[]) {
  return markets.slice(0, 12).map((market) => ({
    label: market.label,
    href: `/directory/${market.slug}`,
    description: market.notes,
  }));
}

function pageBase(slug: string, kind: DirectoryCoverageKind, label: string): Pick<DirectoryCoveragePage, "slug" | "kind" | "label" | "routePattern"> {
  return {
    slug,
    kind,
    label,
    routePattern: "/directory/[vertical]",
  };
}

export function buildDirectoryCoveragePage(slug: string): DirectoryCoveragePage | null {
  if (slug === "national") {
    return {
      ...pageBase("national", "national", "National Directory Network"),
      title: "National directory network across all niches",
      summary: "One national directory index that routes visitors into niche, region, state, and city pages without duplicating page templates.",
      audience: "Directory operators selling national sponsorship, regional ownership, state access, city routes, or niche-specific buyer inventory.",
      niches: directoryNiches,
      markets: directoryMarkets,
      operationalNotes: [
        "Use this as the top-level access point for every directory motion.",
        "Regional pages group many cities together so the site can scale before every market has custom proof.",
        "Niche national pages sell category ownership nationally while state and city pages handle local routing.",
      ],
      canonicalLinks: [
        ...directoryRegions.map((region) => ({ label: region.label, href: `/directory/region-${region.slug}`, description: region.summary })),
        ...directoryNiches.slice(0, 8).map((niche) => ({ label: `National ${niche.label}`, href: `/directory/national-${niche.slug}`, description: niche.summary })),
      ],
    };
  }

  if (slug.startsWith("national-")) {
    const nicheSlug = slug.replace("national-", "");
    const niche = nicheCatalog[nicheSlug];
    if (!niche || niche.slug === "general") return null;
    return {
      ...pageBase(slug, "national-niche", `National ${niche.label}`),
      title: `National ${niche.label} directory`,
      summary: `A national ${niche.label.toLowerCase()} directory entry point that can route demand into regions, states, cities, and buyer-owned territories.`,
      audience: `Directory owners and operators selling national ${niche.label.toLowerCase()} access, category sponsorship, or routed lead inventory.`,
      niche,
      niches: [niche],
      markets: directoryMarkets,
      operationalNotes: [
        "Use one national niche page per category family, then route to city or state pages as inventory proves out.",
        "Do not duplicate city copy for every niche until there is buyer demand or search traction.",
        "Sell national sponsorship separately from exclusive city ownership.",
      ],
      canonicalLinks: [
        ...directoryRegions.slice(0, 6).map((region) => ({ label: `${niche.label} in the ${region.label}`, href: `/directory/region-${region.slug}`, description: region.summary })),
        { label: "Directory monetization package", href: "/packages/directory-monetization-system", description: "Provision the intake, buyer routing, billing gate, and reporting surfaces." },
      ],
    };
  }

  if (slug.startsWith("region-")) {
    const regionSlug = slug.replace("region-", "");
    const region = regionBySlug(regionSlug);
    if (!region) return null;
    const markets = directoryMarkets.filter((market) => market.regionSlug === region.slug);
    return {
      ...pageBase(slug, "region", `${region.label} Regional Directory`),
      title: `${region.label} regional directory hub`,
      summary: `${region.summary} This page groups all niches together for regional access, then routes visitors into states and major city pages.`,
      audience: "Operators selling regional directory sponsorship, multi-city access, or first-right category ownership across grouped markets.",
      region,
      niches: directoryNiches,
      markets,
      operationalNotes: [
        "Regional hubs keep the site efficient by grouping cities before every city earns a standalone niche page.",
        "Use regional pages for all-niche access and link to state or city pages for local specificity.",
        "Add custom proof only after region-level traffic, buyer capacity, or revenue appears.",
      ],
      canonicalLinks: [
        ...coverageLinksForMarkets(markets),
        ...region.states.map((code) => {
          const state = stateByCode(code);
          return { label: state?.label ?? code, href: `/directory/state-${code.toLowerCase()}`, description: `${code} state directory access.` };
        }),
      ],
    };
  }

  if (slug.startsWith("state-")) {
    const state = directoryStates.find((item) => item.slug === slug);
    if (!state) return null;
    const markets = directoryMarkets.filter((market) => market.state === state.code);
    const region = regionBySlug(state.regionSlug);
    return {
      ...pageBase(slug, "state", `${state.label} Directory`),
      title: `${state.label} state directory`,
      summary: `A statewide directory access page for all niches in ${state.label}, with major city routes and regional grouping handled from one reusable template.`,
      audience: "Directory operators selling state sponsorships, statewide lead access, or city-by-city category ownership.",
      state,
      region,
      niches: directoryNiches,
      markets,
      operationalNotes: [
        "State pages hold all niches together and hand off to major city pages where demand is strongest.",
        "Use state pages for SEO and buyer education before creating city-by-niche long tails.",
        "City pages can inherit the same intake and buyer-routing contract.",
      ],
      canonicalLinks: [
        ...(region ? [{ label: `${region.label} region`, href: `/directory/region-${region.slug}`, description: region.summary }] : []),
        ...coverageLinksForMarkets(markets),
      ],
    };
  }

  if (slug.startsWith("city-")) {
    const market = directoryMarkets.find((item) => item.slug === slug);
    if (!market) return null;
    const state = stateByCode(market.state);
    const region = regionBySlug(market.regionSlug);
    const seededCategoryLabels = market.seededCategories?.map((key) => directoryCategories.find((category) => category.key === key)?.label ?? key) ?? [];
    return {
      ...pageBase(slug, "city", `${market.label} Directory`),
      title: `${market.label} local directory`,
      summary: `${market.notes} The page groups all niches for the city and points category demand into routed buyer handoffs.`,
      audience: "Directory owners selling a city market, local media teams, category sponsors, and lead buyers who want owned territory access.",
      primaryMarket: market,
      state,
      region,
      niches: directoryNiches,
      markets: [market],
      operationalNotes: [
        market.seedTenantId ? `${market.label} is seeded as tenant ${market.seedTenantId} with ${seededCategoryLabels.join(" and ")} routing.` : "Create tenant and buyer nodes when this city is sold or selected for launch.",
        "Use this city page as the public demand capture destination, then keep buyer routing inside the directory lead router.",
        "Add niche-specific proof only for categories with real traffic, paid buyers, or verified outcomes.",
      ],
      canonicalLinks: [
        ...(state ? [{ label: `${state.label} state directory`, href: `/directory/${state.slug}`, description: `Statewide directory access for ${state.label}.` }] : []),
        ...(region ? [{ label: `${region.label} regional hub`, href: `/directory/region-${region.slug}`, description: region.summary }] : []),
        { label: "Directory lead router", href: "/directory/lead-router", description: "Preview category intake, buyer matching, billing, and delivery handoff." },
      ],
    };
  }

  return null;
}

export function listDirectoryCoveragePages(): DirectoryCoveragePage[] {
  return [
    buildDirectoryCoveragePage("national"),
    ...directoryNiches.map((niche) => buildDirectoryCoveragePage(`national-${niche.slug}`)),
    ...directoryRegions.map((region) => buildDirectoryCoveragePage(`region-${region.slug}`)),
    ...directoryStates.map((state) => buildDirectoryCoveragePage(state.slug)),
    ...directoryMarkets.map((market) => buildDirectoryCoveragePage(market.slug)),
  ].filter((page): page is DirectoryCoveragePage => Boolean(page));
}
