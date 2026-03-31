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
  plumbing: ["hvac", "electrical", "roofing"],
  hvac: ["plumbing", "electrical", "roofing"],
  electrical: ["plumbing", "hvac", "painting"],
  roofing: ["plumbing", "hvac", "painting", "landscaping"],
  landscaping: ["roofing", "painting", "pest-control"],
  dental: ["legal", "cleaning"],
  legal: ["dental", "real-estate"],
  cleaning: ["pest-control", "painting", "landscaping"],
  "auto-repair": ["electrical", "painting"],
  "pest-control": ["cleaning", "landscaping", "roofing"],
  painting: ["roofing", "cleaning", "electrical", "landscaping"],
  "real-estate": ["legal", "cleaning", "landscaping"],
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
