// ── Deep Local SEO Data System ──────────────────────────────────────
// Comprehensive Erie, PA local data for search engine optimization.
// Every page gets deep local signals: neighborhoods, landmarks, climate,
// regulations, and niche-specific context paragraphs.

import { getNicheBySlug } from "./niches";
import { cityConfig } from "./city-config";

// ── Niche-category local context ─────────────────────────────────
// Returns a contextual sentence appropriate for the niche category,
// instead of one-size-fits-all "lake-effect climate and older housing stock."

const HOME_SERVICE_NICHES = new Set([
  "plumbing", "hvac", "electrical", "roofing", "landscaping", "cleaning",
  "painting", "garage-door", "fencing", "flooring", "windows-doors",
  "foundation", "concrete", "septic", "chimney", "gutters", "drywall",
  "insulation", "pressure-washing", "carpet-cleaning", "handyman",
  "restoration", "glass", "irrigation", "demolition", "pool-spa",
  "home-security", "snow-removal", "tree-service", "solar",
]);
const AUTO_NICHES = new Set(["auto-repair", "towing"]);
const HEALTH_NICHES = new Set(["dental", "veterinary", "chiropractic"]);
const PROFESSIONAL_NICHES = new Set(["legal", "accounting", "photography", "real-estate"]);

export function getLocalContext(nicheSlug: string): string {
  if (HOME_SERVICE_NICHES.has(nicheSlug)) {
    return "Erie's lake-effect climate, older housing stock, and freeze-thaw cycles create specific demands that require experienced local professionals.";
  }
  if (AUTO_NICHES.has(nicheSlug)) {
    return "Erie's harsh winters, road salt, and pothole-heavy streets put extra wear on vehicles, making reliable local service essential.";
  }
  if (HEALTH_NICHES.has(nicheSlug)) {
    return "Erie residents deserve convenient access to quality healthcare providers who understand the needs of our community.";
  }
  if (PROFESSIONAL_NICHES.has(nicheSlug)) {
    return "Erie's growing business community needs trusted local professionals who understand Pennsylvania regulations and the regional economy.";
  }
  return "Erie residents and businesses trust local providers who are invested in our community's success.";
}

// ── Types ──────────────────────────────────────────────────────────

export interface LocalSeoData {
  city: string;
  state: string;
  stateCode: string;
  // Geographic
  neighborhoods: string[];
  landmarks: string[];
  zipCodes: string[];
  countyName: string;
  // Climate
  climateNotes: string[];
  avgWinterTemp: string;
  avgSummerTemp: string;
  annualSnowfall: string;
  // Regulations
  buildingCodes: string[];
  licensingRequirements: string[];
  permitInfo: string;
  // Local context
  population: number;
  medianHomeValue: string;
  medianIncome: string;
  homeownershipRate: string;
  // SEO
  geoCoordinates: { lat: number; lng: number };
  nearbySearchTerms: string[];
}

// ── Erie Local SEO Data ────────────────────────────────────────────

export const ERIE_LOCAL_SEO: LocalSeoData = {
  city: "Erie",
  state: "Pennsylvania",
  stateCode: "PA",

  neighborhoods: [
    "Downtown Erie", "Glenwood", "Frontier", "Academy", "Lakeside",
    "Little Italy", "East Erie", "West Erie", "South Erie", "Bayfront",
    "Presque Isle", "Millcreek", "Harborcreek", "Fairview", "Summit Township",
  ],

  landmarks: [
    "Presque Isle State Park", "Erie Maritime Museum", "Bayfront Convention Center",
    "Waldameer Park", "Tom Ridge Environmental Center", "Erie Art Museum",
    "Bicentennial Tower", "Perry Square", "UPMC Hamot", "Erie International Airport",
  ],

  zipCodes: [
    "16501", "16502", "16503", "16504", "16505",
    "16506", "16507", "16508", "16509", "16510", "16511",
  ],

  countyName: "Erie County",

  climateNotes: [
    "Erie receives an average of 100+ inches of snow annually due to lake effect",
    "Freeze-thaw cycles are common from November through March",
    "Summer temperatures average 70-80\u00B0F with high humidity from Lake Erie",
    "Spring flooding is a recurring issue in low-lying neighborhoods",
  ],

  avgWinterTemp: "28\u00B0F (-2\u00B0C)",
  avgSummerTemp: "72\u00B0F (22\u00B0C)",
  annualSnowfall: "101 inches (lake effect)",

  buildingCodes: [
    "Pennsylvania Uniform Construction Code (UCC)",
    "International Building Code (IBC) adopted",
    "Erie County building permits required for most structural work",
    "Plumbing work requires licensed plumber per PA Act 27",
    "Electrical work requires licensed electrician per PA Act 1",
  ],

  licensingRequirements: [
    "General contractors: PA Home Improvement Contractor Registration (HICPA)",
    "Plumbers: PA licensed journeyman or master plumber",
    "Electricians: PA licensed electrician",
    "HVAC: EPA 608 certification for refrigerant handling",
    "Roofers: PA Home Improvement Contractor Registration",
  ],

  permitInfo:
    "Building permits are issued by Erie County or the City of Erie Building Department. Most projects over $500 require a permit.",

  population: 95000,
  medianHomeValue: "$125,000",
  medianIncome: "$38,000",
  homeownershipRate: "52%",

  geoCoordinates: { lat: 42.1292, lng: -80.0851 },

  nearbySearchTerms: [
    "in Erie PA", "Erie Pennsylvania", "near Erie", "Erie area",
    "near me in Erie", "Erie County PA", "around Erie",
    "Millcreek PA", "Harborcreek PA", "Fairview PA",
  ],
};

// ── Niche-Specific Local SEO Snippets ──────────────────────────────
// Each niche gets a custom paragraph weaving in climate, regulations,
// neighborhoods, and local context.

const NICHE_SEO_SNIPPETS: Record<string, string> = {
  plumbing:
    "Erie's freeze-thaw cycles and 101 inches of annual lake-effect snowfall create unique challenges for plumbing systems. Frozen pipes, burst water lines, and basement flooding are common issues for homeowners in Millcreek, Harborcreek, and downtown Erie. Pennsylvania law requires all plumbing work to be performed by a licensed plumber under PA Act 27.",

  hvac:
    "With winter temperatures averaging 28\u00B0F and over 100 inches of lake-effect snow, Erie homeowners depend on reliable heating systems. Summer humidity from Lake Erie makes air conditioning essential too. All HVAC technicians working in Erie County must hold EPA 608 certification for refrigerant handling. Residents in Glenwood, Academy, and Lakeside neighborhoods frequently need furnace repairs during peak winter months.",

  electrical:
    "Erie's aging housing stock, particularly in Downtown, Little Italy, and East Erie, often requires electrical panel upgrades and rewiring to meet modern safety standards. Pennsylvania Act 1 mandates that all electrical work be performed by a licensed electrician. Lake-effect storms frequently cause power outages, driving demand for generator installation and surge protection across Erie County.",

  roofing:
    "Erie County's 101 inches of annual snowfall, combined with lake-effect ice storms, makes roofing one of the most critical home services in the region. Homes in Millcreek, Fairview, and Summit Township experience significant roof wear from freeze-thaw cycles. Pennsylvania requires all roofing contractors to hold a Home Improvement Contractor Registration under HICPA.",

  landscaping:
    "Erie's climate presents unique landscaping challenges with heavy snowfall from November through March and humid summers along Lake Erie. Homeowners in Harborcreek, Fairview, and Millcreek invest in spring cleanups, drainage solutions, and salt-tolerant plantings. The growing season in Erie County typically runs from late April through early October.",

  dental:
    "The Erie metro area, home to approximately 95,000 residents, is served by dental professionals throughout Millcreek, downtown Erie, and surrounding communities. With a median household income of $38,000, affordable dental care is a priority for Erie County families. Many residents in Academy, Glenwood, and South Erie seek dental providers who accept a wide range of insurance plans.",

  legal:
    "Erie County residents face a range of legal needs from personal injury cases on I-90 to family law matters in the Erie County Court of Common Pleas. With a homeownership rate of 52% and median home values around $125,000, real estate transactions and estate planning are common legal services. Attorneys serving Downtown Erie, Millcreek, and Harborcreek handle everything from criminal defense to business law.",

  cleaning:
    "Erie homeowners and businesses across Millcreek, Downtown, and Harborcreek rely on professional cleaning services year-round. Lake-effect weather brings extra dirt, salt, and moisture indoors during winter months, making deep cleaning essential. With Erie's mix of historic homes in Little Italy and newer developments in Summit Township, cleaning needs vary widely.",

  "auto-repair":
    "Erie's harsh winters, with over 100 inches of lake-effect snow and road salt, take a serious toll on vehicles. Residents in Millcreek, Harborcreek, and South Erie regularly need rust repair, brake service, and alignment work. Pennsylvania requires annual vehicle inspections and emissions testing, keeping auto repair shops busy throughout Erie County.",

  "pest-control":
    "Erie County's proximity to Lake Erie and its humid summers create ideal conditions for mosquitoes, termites, and rodents. Older homes in Downtown Erie, Little Italy, and Glenwood are particularly susceptible to pest issues. Basements in low-lying neighborhoods face moisture problems that attract insects and rodents year-round.",

  painting:
    "Erie's extreme weather, from lake-effect snowstorms to humid summers, demands high-quality exterior paint that can withstand temperature swings of over 80 degrees annually. Homes in the historic districts of Downtown Erie and Little Italy often require specialized restoration painting. Interior painting remains popular year-round in Millcreek, Summit Township, and Fairview.",

  "real-estate":
    "The Erie real estate market offers affordable housing with a median home value of approximately $125,000 and a homeownership rate of 52%. Popular neighborhoods include Millcreek, Harborcreek, and Fairview, with downtown Erie experiencing revitalization along the Bayfront. The market serves roughly 95,000 city residents plus surrounding Erie County communities.",

  "garage-door":
    "Erie's heavy snowfall and ice storms put significant strain on garage doors and openers. Residents in Millcreek, Summit Township, and Harborcreek frequently need spring replacement, opener repair, and weatherstripping upgrades. Freeze-thaw cycles can warp tracks and damage panels, making garage door service a year-round necessity in Erie County.",

  fencing:
    "Erie County homeowners invest in fencing for privacy, security, and property value. Wind off Lake Erie and heavy snow loads require sturdy fence construction, particularly in Lakeside, Bayfront, and Presque Isle areas. Wood fences need regular maintenance due to Erie's moisture, while vinyl and aluminum options are popular in Millcreek and Fairview.",

  flooring:
    "Erie's lake-effect climate creates specific flooring challenges. Salt tracked in during winter, basement moisture from spring thaw, and humidity fluctuations from Lake Erie all affect flooring choices. Homeowners in Millcreek, Downtown Erie, and Harborcreek increasingly choose waterproof vinyl plank and tile over hardwood for ground-floor installations.",

  "windows-doors":
    "Energy efficiency is critical in Erie where winter temperatures average 28\u00B0F and over 100 inches of snow falls annually. Many homes in Little Italy, Glenwood, and Downtown Erie have original single-pane windows that drive up heating costs. Pennsylvania Uniform Construction Code requires all replacement windows to meet current energy standards.",

  moving:
    "Erie's affordable housing market attracts movers from across the region, with many relocating to Millcreek, Harborcreek, and Fairview. Winter moves in Erie require special planning due to lake-effect snow and icy conditions from November through March. Local movers understand the challenges of navigating Erie's older neighborhoods with narrow streets and steep driveways.",

  "tree-service":
    "Erie's lake-effect storms and heavy ice accumulation make tree service essential for homeowner safety. Mature trees in Glenwood, Academy, and Frontier neighborhoods are especially vulnerable to storm damage. Emergency tree removal peaks during winter ice storms and summer thunderstorms, with stump grinding and trimming in demand year-round across Erie County.",

  "appliance-repair":
    "Erie's approximately 95,000 residents depend on working appliances through long winters when heating systems, dryers, and water heaters run constantly. Hard water common in Erie County can shorten appliance life. Homes in Millcreek, Downtown Erie, and Harborcreek frequently need washer, dryer, and refrigerator repairs.",

  foundation:
    "Erie's freeze-thaw cycles, high water table, and lake-effect precipitation create serious foundation challenges. Basement flooding is common in low-lying neighborhoods like Glenwood and parts of South Erie. Homes built before 1970 in Downtown Erie and Little Italy often need crack sealing, waterproofing, and sump pump installation. Spring snowmelt is the peak season for foundation emergencies.",

  "home-security":
    "Erie residents across Millcreek, Downtown, and Harborcreek invest in home security systems for protection and peace of mind. With a median home value of $125,000 and 52% homeownership rate, security is a priority for Erie County property owners. Modern systems include smart locks, cameras, and 24/7 monitoring compatible with Erie's variable weather conditions.",

  concrete:
    "Erie's 101 inches of annual snowfall and freeze-thaw cycles are extremely hard on concrete surfaces. Driveways, sidewalks, and patios in Millcreek, Fairview, and Summit Township frequently need repair or replacement due to salt damage and frost heaving. Erie County building permits are required for most structural concrete work, and contractors must hold a PA Home Improvement Contractor Registration.",

  septic:
    "Many homes in the outer Erie County communities of Harborcreek, Fairview, and Summit Township rely on septic systems. High water tables and Erie's heavy precipitation, including over 100 inches of lake-effect snow, create unique demands on septic systems. Pennsylvania regulations require regular pumping and inspection, and all work must be performed by licensed professionals.",

  chimney:
    "Erie homeowners rely heavily on fireplaces and wood stoves during long, cold winters averaging 28\u00B0F. Lake-effect moisture accelerates chimney deterioration in neighborhoods like Downtown Erie, Glenwood, and Academy. Annual chimney inspections and cleanings are critical for fire safety, and Erie's freeze-thaw cycles can crack mortar joints and damage flue liners.",
};

// ── Fallback snippet generator for niches without a custom entry ───

function generateGenericSnippet(nicheSlug: string): string {
  const niche = getNicheBySlug(nicheSlug);
  const label = niche?.label ?? nicheSlug;
  return `Erie, Pennsylvania residents rely on quality ${label.toLowerCase()} services throughout the year. With a population of approximately 95,000 and a homeownership rate of 52%, there is steady demand for ${label.toLowerCase()} across neighborhoods like Millcreek, Harborcreek, Downtown Erie, and Fairview. ${getLocalContext(nicheSlug)}`;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Returns a niche-specific local context paragraph for SEO content.
 * Weaves in Erie climate, neighborhoods, regulations, and local data.
 */
export function getLocalSeoSnippet(niche: string): string {
  return NICHE_SEO_SNIPPETS[niche] ?? generateGenericSnippet(niche);
}

/**
 * Returns enhanced Schema.org structured data with deep local signals.
 */
export function getLocalSchemaOrg(niche: string): object {
  const nicheData = getNicheBySlug(niche);
  const label = nicheData?.label ?? niche;
  const description = nicheData?.description ?? "";
  const seo = ERIE_LOCAL_SEO;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${label} in ${seo.city}, ${seo.stateCode}`,
    description: `${description} ${getLocalSeoSnippet(niche)}`,
    url: `https://${cityConfig.domain}/${niche}`,
    areaServed: [
      {
        "@type": "City",
        name: seo.city,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: seo.countyName,
        },
      },
      ...seo.neighborhoods.slice(0, 8).map((n) => ({
        "@type": "Place",
        name: n,
      })),
    ],
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: seo.geoCoordinates.lat,
        longitude: seo.geoCoordinates.lng,
      },
      geoRadius: "25 miles",
    },
    provider: {
      "@type": "LocalBusiness",
      name: cityConfig.domain,
      url: `https://${cityConfig.domain}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: seo.city,
        addressRegion: seo.stateCode,
        addressCountry: "US",
        postalCode: seo.zipCodes[0],
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: seo.geoCoordinates.lat,
        longitude: seo.geoCoordinates.lng,
      },
      areaServed: seo.neighborhoods.map((n) => ({
        "@type": "Place",
        name: n,
      })),
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `https://${cityConfig.domain}/${niche}`,
      serviceLocation: {
        "@type": "Place",
        name: `${seo.city}, ${seo.stateCode}`,
        geo: {
          "@type": "GeoCoordinates",
          latitude: seo.geoCoordinates.lat,
          longitude: seo.geoCoordinates.lng,
        },
      },
    },
  };
}

/**
 * Returns an array of search term variations for this niche.
 * e.g. ["plumbing in Erie PA", "plumber near Erie", ...]
 */
export function getNearbySearchVariations(niche: string): string[] {
  const nicheData = getNicheBySlug(niche);
  const label = nicheData?.label ?? niche;
  const terms = nicheData?.searchTerms ?? [niche];
  const seo = ERIE_LOCAL_SEO;

  const variations: string[] = [];

  for (const term of terms.slice(0, 3)) {
    for (const suffix of seo.nearbySearchTerms.slice(0, 6)) {
      variations.push(`${term} ${suffix}`);
    }
  }

  // Add neighborhood-specific terms
  for (const neighborhood of seo.neighborhoods.slice(0, 5)) {
    variations.push(`${label.toLowerCase()} in ${neighborhood}`);
  }

  return variations;
}

/**
 * Returns a meta description enriched with local SEO signals.
 */
export function getLocalMetaDescription(niche: string): string {
  const nicheData = getNicheBySlug(niche);
  const label = nicheData?.label ?? niche;
  const seo = ERIE_LOCAL_SEO;

  return `Find trusted ${label.toLowerCase()} providers in ${seo.city}, ${seo.stateCode}. Compare verified professionals, read reviews, get free quotes. Serving Millcreek, Harborcreek, Fairview and surrounding areas.`;
}

/**
 * Returns a list of neighborhoods for display in content.
 */
export function getNeighborhoodList(): string[] {
  return [...ERIE_LOCAL_SEO.neighborhoods];
}

/**
 * Returns a list of zip codes for display.
 */
export function getZipCodes(): string[] {
  return [...ERIE_LOCAL_SEO.zipCodes];
}
