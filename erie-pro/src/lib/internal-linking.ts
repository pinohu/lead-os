// ── Internal Linking System ────────────────────────────────────────────
// Programmatic internal linking that connects pages across niches
// and generates related content links for SEO and user navigation.

export interface InternalLink {
  href: string;
  label: string;
  context:
    | "related-service"
    | "same-niche"
    | "nearby-city"
    | "content-cluster";
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent: boolean;
}

// ── Niche Relationship Map ────────────────────────────────────────────
// Defines which niches are related to each other for cross-linking.

const nicheRelationships: Record<string, string[]> = {
  plumbing: ["hvac", "electrical", "roofing", "septic", "foundation"],
  hvac: ["plumbing", "electrical", "roofing", "windows-doors", "chimney"],
  electrical: ["plumbing", "hvac", "painting", "appliance-repair", "home-security", "garage-door"],
  roofing: ["plumbing", "hvac", "painting", "landscaping", "chimney", "windows-doors"],
  landscaping: ["roofing", "painting", "pest-control", "fencing", "concrete", "tree-service"],
  dental: ["legal", "cleaning"],
  legal: ["dental", "real-estate"],
  cleaning: ["pest-control", "painting", "landscaping", "moving", "flooring"],
  "auto-repair": ["electrical", "painting"],
  "pest-control": ["cleaning", "landscaping", "roofing"],
  painting: ["roofing", "cleaning", "electrical", "landscaping", "fencing", "flooring"],
  "real-estate": ["legal", "cleaning", "landscaping", "moving"],
  "garage-door": ["roofing", "home-security", "electrical"],
  fencing: ["landscaping", "concrete", "painting"],
  flooring: ["painting", "cleaning", "windows-doors"],
  "windows-doors": ["roofing", "hvac", "electrical", "flooring"],
  moving: ["cleaning", "painting", "flooring"],
  "tree-service": ["landscaping", "roofing", "fencing"],
  "appliance-repair": ["electrical", "plumbing", "hvac"],
  foundation: ["concrete", "plumbing", "septic"],
  "home-security": ["electrical", "windows-doors", "garage-door"],
  concrete: ["foundation", "fencing", "landscaping"],
  septic: ["plumbing", "foundation", "landscaping"],
  chimney: ["roofing", "hvac", "painting"],
  "pool-spa": ["landscaping", "electrical", "concrete", "fencing", "pressure-washing"],
  locksmith: ["home-security", "auto-repair", "glass"],
  towing: ["auto-repair", "locksmith", "glass"],
  "carpet-cleaning": ["cleaning", "flooring", "restoration", "pressure-washing"],
  "pressure-washing": ["painting", "roofing", "gutters", "concrete", "fencing"],
  drywall: ["painting", "restoration", "flooring", "insulation"],
  insulation: ["hvac", "windows-doors", "roofing", "drywall", "solar"],
  solar: ["electrical", "roofing", "insulation", "windows-doors"],
  gutters: ["roofing", "pressure-washing", "foundation", "painting"],
  handyman: ["painting", "drywall", "electrical", "plumbing", "flooring"],
  veterinary: ["pet-grooming"],
  chiropractic: ["dental", "legal"],
  accounting: ["legal", "real-estate"],
  photography: ["real-estate", "painting"],
  "pet-grooming": ["veterinary"],
  "snow-removal": ["towing", "landscaping", "concrete", "roofing"],
  restoration: ["plumbing", "foundation", "drywall", "carpet-cleaning", "glass"],
  glass: ["windows-doors", "home-security", "auto-repair", "restoration"],
  irrigation: ["landscaping", "plumbing", "pool-spa", "fencing"],
  demolition: ["concrete", "foundation", "tree-service", "landscaping", "excavation"],
};

// ── Niche Labels ──────────────────────────────────────────────────────

const nicheLabels: Record<string, string> = {
  plumbing: "Plumbing",
  hvac: "HVAC",
  electrical: "Electrical",
  roofing: "Roofing",
  landscaping: "Landscaping",
  dental: "Dental",
  legal: "Legal",
  cleaning: "Cleaning",
  "auto-repair": "Auto Repair",
  "pest-control": "Pest Control",
  painting: "Painting",
  "real-estate": "Real Estate",
  "garage-door": "Garage Door",
  fencing: "Fencing",
  flooring: "Flooring",
  "windows-doors": "Windows & Doors",
  moving: "Moving",
  "tree-service": "Tree Service",
  "appliance-repair": "Appliance Repair",
  foundation: "Foundation",
  "home-security": "Home Security",
  concrete: "Concrete",
  septic: "Septic",
  chimney: "Chimney",
  "pool-spa": "Pool & Spa",
  locksmith: "Locksmith",
  towing: "Towing",
  "carpet-cleaning": "Carpet Cleaning",
  "pressure-washing": "Pressure Washing",
  drywall: "Drywall",
  insulation: "Insulation",
  solar: "Solar & Energy",
  gutters: "Gutters",
  handyman: "Handyman",
  veterinary: "Veterinary",
  chiropractic: "Chiropractic",
  accounting: "Accounting",
  photography: "Photography",
  "pet-grooming": "Pet Grooming",
  "snow-removal": "Snow Removal",
  restoration: "Restoration",
  glass: "Glass & Glazing",
  irrigation: "Irrigation",
  demolition: "Demolition",
};

// ── Content Page Types ────────────────────────────────────────────────

const contentPages: { segment: string; label: string }[] = [
  { segment: "blog", label: "Blog" },
  { segment: "guides", label: "Guides" },
  { segment: "faq", label: "FAQ" },
  { segment: "pricing", label: "Pricing" },
  { segment: "costs", label: "Cost Guide" },
  { segment: "glossary", label: "Glossary" },
  { segment: "seasonal", label: "Seasonal Tips" },
  { segment: "checklist", label: "Hiring Checklist" },
  { segment: "compare", label: "Compare" },
  { segment: "tips", label: "Tips" },
  { segment: "certifications", label: "Certifications" },
  { segment: "emergency", label: "Emergency" },
  { segment: "directory", label: "Directory" },
  { segment: "reviews", label: "Reviews" },
];

// ── Core Functions ────────────────────────────────────────────────────

/**
 * Get 3-4 related niches for the current niche.
 */
export function getRelatedNiches(currentNiche: string): string[] {
  return nicheRelationships[currentNiche] ?? [];
}

/**
 * Get all content page links for a niche.
 */
export function getNicheContentLinks(niche: string): InternalLink[] {
  const label = nicheLabels[niche] ?? niche;
  return contentPages.map((page) => ({
    href: `/${niche}/${page.segment}`,
    label: `${label} ${page.label}`,
    context: "same-niche" as const,
  }));
}

/**
 * Get cross-niche links — same page type in related niches.
 * For example, if on /plumbing/faq, returns links to /hvac/faq, /electrical/faq, etc.
 */
export function getCrossNicheLinks(
  currentNiche: string,
  currentPage: string
): InternalLink[] {
  const related = getRelatedNiches(currentNiche);
  const pageInfo = contentPages.find((p) => p.segment === currentPage);

  if (!pageInfo) {
    // If currentPage is empty or the niche homepage, link to related niche homepages
    return related.map((slug) => ({
      href: `/${slug}`,
      label: `${nicheLabels[slug] ?? slug} in Erie`,
      context: "related-service" as const,
    }));
  }

  return related.map((slug) => ({
    href: `/${slug}/${currentPage}`,
    label: `${nicheLabels[slug] ?? slug} ${pageInfo.label}`,
    context: "content-cluster" as const,
  }));
}

/**
 * Generate breadcrumb data from URL segments.
 */
export function getBreadcrumbItems(segments: string[]): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/", isCurrent: false },
  ];

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;
    const isCurrent = i === segments.length - 1;

    // Resolve label
    let label: string;
    if (i === 0 && nicheLabels[segment]) {
      label = nicheLabels[segment];
    } else {
      const page = contentPages.find((p) => p.segment === segment);
      label = page?.label ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    items.push({ label, href: path, isCurrent });
  }

  return items;
}

/**
 * Get the display label for a niche slug.
 */
export function getNicheLabel(slug: string): string {
  return nicheLabels[slug] ?? slug;
}

/**
 * Get all available content page types.
 */
export function getContentPageTypes(): { segment: string; label: string }[] {
  return [...contentPages];
}
