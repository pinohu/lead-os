import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthoritySiteConfig {
  niche: string;
  businessName: string;
  location: string;
  services: string[];
  domain?: string;
  template: string;
}

export interface ContentPage {
  slug: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  type: "service" | "location" | "blog" | "landing" | "about" | "contact";
}

export interface AuthoritySite {
  id: string;
  tenantId: string;
  niche: string;
  businessName: string;
  domain?: string;
  pages: ContentPage[];
  seoScore: number;
  status: "generating" | "draft" | "published";
  createdAt: string;
}

export interface GeneratedPage {
  page: ContentPage;
  targetKeyword: string;
  estimatedDifficulty: number;
}

export interface NicheTemplate {
  id: string;
  niche: string;
  name: string;
  description: string;
  defaultPages: string[];
  sampleSite?: string;
}

export interface DeployResult {
  url: string;
  deployedAt: string;
  pagesDeployed: number;
}

// ---------------------------------------------------------------------------
// Pre-built niche templates
// ---------------------------------------------------------------------------

export const NICHE_TEMPLATES: NicheTemplate[] = [
  {
    id: "tmpl-pest-management",
    niche: "pest-management",
    name: "Pest Management Authority",
    description: "Authority site template for pest control and management businesses",
    defaultPages: ["home", "services", "about", "contact", "blog", "service-areas"],
    sampleSite: "https://demo.pest-management-authority.com",
  },
  {
    id: "tmpl-errcs-bda",
    niche: "errcs-bda",
    name: "ERRCS/BDA Compliance",
    description: "Authority site for emergency responder radio coverage and bi-directional amplifier services",
    defaultPages: ["home", "errcs-services", "bda-installation", "compliance", "about", "contact"],
    sampleSite: "https://demo.errcs-bda-authority.com",
  },
  {
    id: "tmpl-fire-door-compliance",
    niche: "fire-door-compliance",
    name: "Fire Door Compliance",
    description: "Authority site for fire door inspection, installation, and compliance services",
    defaultPages: ["home", "inspection-services", "installation", "compliance-guide", "about", "contact"],
    sampleSite: "https://demo.fire-door-compliance.com",
  },
  {
    id: "tmpl-private-utility-locators",
    niche: "private-utility-locators",
    name: "Private Utility Locators",
    description: "Authority site for underground utility locating and mapping services",
    defaultPages: ["home", "locating-services", "technology", "service-areas", "about", "contact"],
    sampleSite: "https://demo.utility-locators-authority.com",
  },
  {
    id: "tmpl-general",
    niche: "general",
    name: "General Authority Blueprint",
    description: "Flexible authority site template adaptable to any service niche",
    defaultPages: ["home", "services", "about", "contact", "blog", "faq"],
  },
];

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const siteStore = new Map<string, AuthoritySite>();

export function resetAuthoritySiteStore(): void {
  siteStore.clear();
}

export function _getSiteStoreForTesting(): Map<string, AuthoritySite> {
  return siteStore;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function generateDefaultPages(
  config: AuthoritySiteConfig,
  template: NicheTemplate,
): ContentPage[] {
  const pages: ContentPage[] = [];

  pages.push({
    slug: "home",
    title: `${config.businessName} - ${config.location}`,
    content: `<h1>${config.businessName}</h1><p>Professional ${config.niche} services in ${config.location}.</p>`,
    metaTitle: `${config.businessName} | ${config.niche} Services in ${config.location}`,
    metaDescription: `${config.businessName} provides expert ${config.niche} services in ${config.location}. Contact us today.`,
    keywords: [config.niche, config.location, config.businessName],
    type: "landing",
  });

  for (const service of config.services) {
    pages.push({
      slug: slugify(service),
      title: `${service} - ${config.businessName}`,
      content: `<h1>${service}</h1><p>Expert ${service.toLowerCase()} services from ${config.businessName} in ${config.location}.</p>`,
      metaTitle: `${service} | ${config.businessName}`,
      metaDescription: `Professional ${service.toLowerCase()} services in ${config.location} by ${config.businessName}.`,
      keywords: [service.toLowerCase(), config.niche, config.location],
      type: "service",
    });
  }

  pages.push({
    slug: "about",
    title: `About ${config.businessName}`,
    content: `<h1>About ${config.businessName}</h1><p>Learn about our ${config.niche} expertise in ${config.location}.</p>`,
    metaTitle: `About ${config.businessName}`,
    metaDescription: `Learn about ${config.businessName}, a trusted ${config.niche} provider in ${config.location}.`,
    keywords: [config.businessName, config.niche],
    type: "about",
  });

  pages.push({
    slug: "contact",
    title: `Contact ${config.businessName}`,
    content: `<h1>Contact Us</h1><p>Get in touch with ${config.businessName} in ${config.location}.</p>`,
    metaTitle: `Contact ${config.businessName}`,
    metaDescription: `Contact ${config.businessName} for ${config.niche} services in ${config.location}.`,
    keywords: ["contact", config.niche, config.location],
    type: "contact",
  });

  return pages;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function generateAuthoritySite(
  tenantId: string,
  config: AuthoritySiteConfig,
): Promise<AuthoritySite> {
  const template = NICHE_TEMPLATES.find(
    (t) => t.niche === config.template || t.id === config.template,
  );
  if (!template) {
    throw new Error(`Template not found: ${config.template}`);
  }

  const pages = generateDefaultPages(config, template);
  const seoScore = Math.min(95, 60 + pages.length * 5);

  const site: AuthoritySite = {
    id: `auth-site-${randomUUID()}`,
    tenantId,
    niche: config.niche,
    businessName: config.businessName,
    domain: config.domain,
    pages,
    seoScore,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  siteStore.set(site.id, site);
  return site;
}

export async function getSite(siteId: string): Promise<AuthoritySite> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Authority site not found: ${siteId}`);
  return site;
}

export async function listSites(tenantId: string): Promise<AuthoritySite[]> {
  return [...siteStore.values()].filter((s) => s.tenantId === tenantId);
}

export async function addContentPage(
  siteId: string,
  page: ContentPage,
): Promise<AuthoritySite> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Authority site not found: ${siteId}`);

  const existing = site.pages.find((p) => p.slug === page.slug);
  if (existing) {
    throw new Error(`Page with slug "${page.slug}" already exists`);
  }

  const updated: AuthoritySite = {
    ...site,
    pages: [...site.pages, page],
    seoScore: Math.min(95, site.seoScore + 3),
  };

  siteStore.set(siteId, updated);
  return updated;
}

export async function generateSEOPages(
  siteId: string,
  keywords: string[],
): Promise<GeneratedPage[]> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Authority site not found: ${siteId}`);

  const generated: GeneratedPage[] = keywords.map((keyword) => {
    const slug = slugify(keyword);
    const page: ContentPage = {
      slug,
      title: `${keyword} - ${site.businessName}`,
      content: `<h1>${keyword}</h1><p>Comprehensive guide to ${keyword.toLowerCase()} by ${site.businessName}.</p>`,
      metaTitle: `${keyword} | ${site.businessName}`,
      metaDescription: `Expert information about ${keyword.toLowerCase()} from ${site.businessName}.`,
      keywords: [keyword.toLowerCase(), site.niche],
      type: "blog",
    };

    return {
      page,
      targetKeyword: keyword,
      estimatedDifficulty: Math.floor(Math.random() * 60) + 20,
    };
  });

  const updatedPages = [...site.pages];
  for (const gen of generated) {
    if (!updatedPages.find((p) => p.slug === gen.page.slug)) {
      updatedPages.push(gen.page);
    }
  }

  siteStore.set(siteId, {
    ...site,
    pages: updatedPages,
    seoScore: Math.min(95, site.seoScore + generated.length * 2),
  });

  return generated;
}

export async function deploySite(siteId: string): Promise<DeployResult> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Authority site not found: ${siteId}`);

  const domain = site.domain ?? `${slugify(site.businessName)}.leados.io`;

  siteStore.set(siteId, { ...site, status: "published", domain });

  return {
    url: `https://${domain}`,
    deployedAt: new Date().toISOString(),
    pagesDeployed: site.pages.length,
  };
}

export function listNicheTemplates(): NicheTemplate[] {
  return NICHE_TEMPLATES;
}
