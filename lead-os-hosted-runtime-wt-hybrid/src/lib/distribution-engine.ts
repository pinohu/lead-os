import { randomUUID } from "crypto";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeoPage {
  id: string;
  tenantId: string;
  niche: string;
  keyword: string;
  template: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodySections: { heading: string; content: string }[];
  schemaMarkup: Record<string, unknown>;
  createdAt: string;
}

export interface ProgrammaticPage {
  id: string;
  tenantId: string;
  niche: string;
  location: string;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodySections: { heading: string; content: string }[];
  schemaMarkup: Record<string, unknown>;
  createdAt: string;
}

export interface BlogOutline {
  id: string;
  tenantId: string;
  niche: string;
  topic: string;
  targetKeyword: string;
  headings: BlogHeading[];
  targetWordCount: number;
  internalLinkSuggestions: string[];
  createdAt: string;
}

export interface BlogHeading {
  level: "h2" | "h3";
  text: string;
}

export interface SocialPost {
  id: string;
  tenantId: string;
  platform: SocialPlatform;
  content: string;
  characterLimit: number;
  sourceContentId: string;
  createdAt: string;
}

export type SocialPlatform = "twitter" | "linkedin" | "instagram";

export interface ContentSchedule {
  id: string;
  tenantId: string;
  contentType: "blog" | "social" | "seo-page";
  contentId: string;
  title: string;
  publishAt: string;
  status: "scheduled" | "published" | "cancelled";
  createdAt: string;
}

export interface DistributionMetric {
  id: string;
  tenantId: string;
  channel: string;
  metric: string;
  value: number;
  recordedAt: string;
}

export interface DistributionReport {
  tenantId: string;
  period: string;
  channels: ChannelReport[];
  totalTraffic: number;
  totalConversions: number;
}

export interface ChannelReport {
  channel: string;
  metrics: Record<string, number>;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const seoPageStore = new Map<string, SeoPage>();
const programmaticPageStore = new Map<string, ProgrammaticPage>();
const blogOutlineStore = new Map<string, BlogOutline>();
const socialPostStore = new Map<string, SocialPost>();
const contentScheduleStore = new Map<string, ContentSchedule>();
const distributionMetricStore = new Map<string, DistributionMetric>();

export function resetDistributionStore(): void {
  seoPageStore.clear();
  programmaticPageStore.clear();
  blogOutlineStore.clear();
  socialPostStore.clear();
  contentScheduleStore.clear();
  distributionMetricStore.clear();
}

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_seo_pages (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          niche TEXT NOT NULL,
          keyword TEXT NOT NULL,
          template TEXT NOT NULL DEFAULT 'standard',
          title TEXT NOT NULL,
          meta_description TEXT NOT NULL,
          h1 TEXT NOT NULL,
          body_sections JSONB NOT NULL DEFAULT '[]',
          schema_markup JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_seo_pages_tenant
          ON lead_os_seo_pages (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_seo_pages_keyword
          ON lead_os_seo_pages (keyword);

        CREATE TABLE IF NOT EXISTS lead_os_programmatic_pages (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          niche TEXT NOT NULL,
          location TEXT NOT NULL,
          slug TEXT NOT NULL,
          title TEXT NOT NULL,
          meta_description TEXT NOT NULL,
          h1 TEXT NOT NULL,
          body_sections JSONB NOT NULL DEFAULT '[]',
          schema_markup JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_programmatic_pages_tenant
          ON lead_os_programmatic_pages (tenant_id);

        CREATE TABLE IF NOT EXISTS lead_os_blog_outlines (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          niche TEXT NOT NULL,
          topic TEXT NOT NULL,
          target_keyword TEXT NOT NULL,
          headings JSONB NOT NULL DEFAULT '[]',
          target_word_count INTEGER NOT NULL DEFAULT 1500,
          internal_link_suggestions JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_blog_outlines_tenant
          ON lead_os_blog_outlines (tenant_id);

        CREATE TABLE IF NOT EXISTS lead_os_social_posts (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          content TEXT NOT NULL,
          character_limit INTEGER NOT NULL,
          source_content_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_social_posts_tenant
          ON lead_os_social_posts (tenant_id);

        CREATE TABLE IF NOT EXISTS lead_os_content_schedules (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          content_type TEXT NOT NULL,
          content_id TEXT NOT NULL,
          title TEXT NOT NULL,
          publish_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'scheduled',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_content_schedules_tenant
          ON lead_os_content_schedules (tenant_id, status);

        CREATE TABLE IF NOT EXISTS lead_os_distribution_metrics (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          channel TEXT NOT NULL,
          metric TEXT NOT NULL,
          value DOUBLE PRECISION NOT NULL,
          recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_distribution_metrics_tenant
          ON lead_os_distribution_metrics (tenant_id, channel, recorded_at);
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// SEO Factory
// ---------------------------------------------------------------------------

const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  linkedin: 1300,
  instagram: 2200,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function capitalize(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateSeoPage(
  niche: string,
  keyword: string,
  template: string = "standard",
): Promise<SeoPage> {
  await ensureSchema();

  const nicheTitle = capitalize(niche);
  const keywordTitle = capitalize(keyword);
  const now = new Date().toISOString();

  const page: SeoPage = {
    id: randomUUID(),
    tenantId: "system",
    niche,
    keyword,
    template,
    title: `${keywordTitle} | Expert ${nicheTitle} Services`,
    metaDescription: `Looking for ${keyword}? Our ${niche} professionals deliver top-rated results. Get a free consultation today.`,
    h1: `${keywordTitle} - Professional ${nicheTitle} Solutions`,
    bodySections: [
      {
        heading: `Why Choose Our ${keywordTitle} Services`,
        content: `Our team of experienced ${niche} professionals specializes in ${keyword}. We deliver measurable results backed by years of industry expertise.`,
      },
      {
        heading: `What Sets Our ${keywordTitle} Apart`,
        content: `We combine cutting-edge techniques with proven ${niche} strategies to ensure your project exceeds expectations. Every engagement starts with a thorough assessment.`,
      },
      {
        heading: `Get Started with ${keywordTitle}`,
        content: `Ready to take the next step? Contact our ${niche} experts today for a free consultation and personalized plan tailored to your needs.`,
      },
    ],
    schemaMarkup: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${keywordTitle}`,
      provider: {
        "@type": "Organization",
        name: `${nicheTitle} Experts`,
      },
      description: `Professional ${keyword} services in the ${niche} industry.`,
      serviceType: keyword,
    },
    createdAt: now,
  };

  seoPageStore.set(page.id, page);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_seo_pages (id, tenant_id, niche, keyword, template, title, meta_description, h1, body_sections, schema_markup, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          page.id, page.tenantId, page.niche, page.keyword, page.template,
          page.title, page.metaDescription, page.h1,
          JSON.stringify(page.bodySections), JSON.stringify(page.schemaMarkup),
          page.createdAt,
        ],
      );
    } catch {
      // In-memory fallback already stored
    }
  }

  return page;
}

export function listSeoPages(tenantId?: string): SeoPage[] {
  const pages = [...seoPageStore.values()];
  if (tenantId) return pages.filter((p) => p.tenantId === tenantId);
  return pages;
}

export async function generateProgrammaticPages(
  niche: string,
  locationList: string[],
): Promise<ProgrammaticPage[]> {
  await ensureSchema();

  const now = new Date().toISOString();
  const nicheTitle = capitalize(niche);
  const pages: ProgrammaticPage[] = [];

  for (const location of locationList) {
    const locationTitle = capitalize(location);
    const slug = slugify(`${niche}-in-${location}`);

    const page: ProgrammaticPage = {
      id: randomUUID(),
      tenantId: "system",
      niche,
      location,
      slug,
      title: `Best ${nicheTitle} in ${locationTitle} | Local Experts`,
      metaDescription: `Find the best ${niche} services in ${locationTitle}. Trusted local professionals with proven results. Free quotes available.`,
      h1: `Top-Rated ${nicheTitle} in ${locationTitle}`,
      bodySections: [
        {
          heading: `${nicheTitle} Services in ${locationTitle}`,
          content: `Looking for reliable ${niche} services in ${locationTitle}? Our local team delivers exceptional results tailored to the ${locationTitle} community.`,
        },
        {
          heading: `Why ${locationTitle} Residents Choose Us`,
          content: `With deep roots in ${locationTitle}, we understand local needs. Our ${niche} professionals are licensed, insured, and committed to excellence.`,
        },
        {
          heading: `Get a Free ${nicheTitle} Quote in ${locationTitle}`,
          content: `Contact us today for a free estimate on ${niche} services in ${locationTitle}. Same-day consultations available.`,
        },
      ],
      schemaMarkup: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: `${nicheTitle} in ${locationTitle}`,
        areaServed: {
          "@type": "City",
          name: locationTitle,
        },
        serviceType: niche,
      },
      createdAt: now,
    };

    programmaticPageStore.set(page.id, page);
    pages.push(page);
  }

  const pool = getPool();
  if (pool && pages.length > 0) {
    try {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const page of pages) {
        placeholders.push(
          `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10})`,
        );
        values.push(
          page.id, page.tenantId, page.niche, page.location, page.slug,
          page.title, page.metaDescription, page.h1,
          JSON.stringify(page.bodySections), JSON.stringify(page.schemaMarkup),
          page.createdAt,
        );
        idx += 11;
      }
      await pool.query(
        `INSERT INTO lead_os_programmatic_pages (id, tenant_id, niche, location, slug, title, meta_description, h1, body_sections, schema_markup, created_at)
         VALUES ${placeholders.join(", ")}`,
        values,
      );
    } catch {
      // In-memory fallback already stored
    }
  }

  return pages;
}

export function listProgrammaticPages(tenantId?: string): ProgrammaticPage[] {
  const pages = [...programmaticPageStore.values()];
  if (tenantId) return pages.filter((p) => p.tenantId === tenantId);
  return pages;
}

export function buildSitemap(pages: { slug: string; updatedAt?: string }[]): string {
  const urls = pages.map((page) => {
    const lastmod = page.updatedAt ?? new Date().toISOString().slice(0, 10);
    return `  <url>\n    <loc>https://example.com/${page.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

export function generateRobotsTxt(siteUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${siteUrl}/sitemap.xml`;
}

// ---------------------------------------------------------------------------
// Content Engine
// ---------------------------------------------------------------------------

export async function generateBlogOutline(
  niche: string,
  topic: string,
  targetKeyword: string,
): Promise<BlogOutline> {
  await ensureSchema();

  const nicheTitle = capitalize(niche);
  const topicTitle = capitalize(topic);
  const now = new Date().toISOString();

  const headings: BlogHeading[] = [
    { level: "h2", text: `What Is ${topicTitle}?` },
    { level: "h3", text: `Key Concepts in ${topicTitle}` },
    { level: "h3", text: `Why ${topicTitle} Matters for ${nicheTitle}` },
    { level: "h2", text: `How to Get Started with ${topicTitle}` },
    { level: "h3", text: `Step-by-Step Guide` },
    { level: "h3", text: `Common Mistakes to Avoid` },
    { level: "h2", text: `${topicTitle} Best Practices for ${nicheTitle}` },
    { level: "h3", text: `Tools and Resources` },
    { level: "h3", text: `Case Studies and Examples` },
    { level: "h2", text: `Conclusion: Taking Action on ${topicTitle}` },
  ];

  const outline: BlogOutline = {
    id: randomUUID(),
    tenantId: "system",
    niche,
    topic,
    targetKeyword,
    headings,
    targetWordCount: 1500,
    internalLinkSuggestions: [
      `/${slugify(niche)}-services`,
      `/${slugify(niche)}-guide`,
      `/${slugify(niche)}-pricing`,
    ],
    createdAt: now,
  };

  blogOutlineStore.set(outline.id, outline);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_blog_outlines (id, tenant_id, niche, topic, target_keyword, headings, target_word_count, internal_link_suggestions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          outline.id, outline.tenantId, outline.niche, outline.topic,
          outline.targetKeyword, JSON.stringify(outline.headings),
          outline.targetWordCount, JSON.stringify(outline.internalLinkSuggestions),
          outline.createdAt,
        ],
      );
    } catch {
      // In-memory fallback
    }
  }

  return outline;
}

export function listBlogOutlines(tenantId?: string): BlogOutline[] {
  const outlines = [...blogOutlineStore.values()];
  if (tenantId) return outlines.filter((o) => o.tenantId === tenantId);
  return outlines;
}

export async function generateSocialPosts(
  niche: string,
  contentPiece: { id: string; title: string; summary: string },
  platforms: SocialPlatform[],
): Promise<SocialPost[]> {
  await ensureSchema();

  const now = new Date().toISOString();
  const posts: SocialPost[] = [];

  for (const platform of platforms) {
    const charLimit = PLATFORM_CHAR_LIMITS[platform];
    let content: string;

    switch (platform) {
      case "twitter": {
        const base = `${contentPiece.title} - ${contentPiece.summary}`;
        content = base.length > charLimit ? base.slice(0, charLimit - 3) + "..." : base;
        break;
      }
      case "linkedin": {
        content = `${contentPiece.title}\n\n${contentPiece.summary}\n\nOur ${capitalize(niche)} team put together this resource to help you stay ahead. What strategies are working for you?\n\n#${niche.replace(/\s+/g, "")} #business #growth`;
        if (content.length > charLimit) content = content.slice(0, charLimit - 3) + "...";
        break;
      }
      case "instagram": {
        content = `${contentPiece.title}\n\n${contentPiece.summary}\n\nDouble tap if this resonates with your ${niche} journey.\n\n#${niche.replace(/\s+/g, "")} #expert #tips #strategy #growth #business #marketing`;
        if (content.length > charLimit) content = content.slice(0, charLimit - 3) + "...";
        break;
      }
    }

    const post: SocialPost = {
      id: randomUUID(),
      tenantId: "system",
      platform,
      content,
      characterLimit: charLimit,
      sourceContentId: contentPiece.id,
      createdAt: now,
    };

    socialPostStore.set(post.id, post);
    posts.push(post);
  }

  const pool = getPool();
  if (pool && posts.length > 0) {
    try {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const post of posts) {
        placeholders.push(
          `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`,
        );
        values.push(
          post.id, post.tenantId, post.platform, post.content,
          post.characterLimit, post.sourceContentId, post.createdAt,
        );
        idx += 7;
      }
      await pool.query(
        `INSERT INTO lead_os_social_posts (id, tenant_id, platform, content, character_limit, source_content_id, created_at)
         VALUES ${placeholders.join(", ")}`,
        values,
      );
    } catch {
      // In-memory fallback
    }
  }

  return posts;
}

export async function scheduleContent(
  tenantId: string,
  contentPlan: { contentType: "blog" | "social" | "seo-page"; contentId: string; title: string; publishAt: string }[],
): Promise<ContentSchedule[]> {
  await ensureSchema();

  const now = new Date().toISOString();
  const schedules: ContentSchedule[] = [];

  for (const item of contentPlan) {
    const schedule: ContentSchedule = {
      id: randomUUID(),
      tenantId,
      contentType: item.contentType,
      contentId: item.contentId,
      title: item.title,
      publishAt: item.publishAt,
      status: "scheduled",
      createdAt: now,
    };

    contentScheduleStore.set(schedule.id, schedule);
    schedules.push(schedule);
  }

  const pool = getPool();
  if (pool && schedules.length > 0) {
    try {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const s of schedules) {
        placeholders.push(
          `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7})`,
        );
        values.push(
          s.id, s.tenantId, s.contentType, s.contentId,
          s.title, s.publishAt, s.status, s.createdAt,
        );
        idx += 8;
      }
      await pool.query(
        `INSERT INTO lead_os_content_schedules (id, tenant_id, content_type, content_id, title, publish_at, status, created_at)
         VALUES ${placeholders.join(", ")}`,
        values,
      );
    } catch {
      // In-memory fallback
    }
  }

  return schedules;
}

export function listContentSchedules(tenantId: string): ContentSchedule[] {
  return [...contentScheduleStore.values()].filter((s) => s.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Distribution Analytics
// ---------------------------------------------------------------------------

export async function trackDistributionMetric(
  tenantId: string,
  channel: string,
  metric: string,
  value: number,
): Promise<DistributionMetric> {
  await ensureSchema();

  const now = new Date().toISOString();

  const entry: DistributionMetric = {
    id: randomUUID(),
    tenantId,
    channel,
    metric,
    value,
    recordedAt: now,
  };

  distributionMetricStore.set(entry.id, entry);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_distribution_metrics (id, tenant_id, channel, metric, value, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entry.id, entry.tenantId, entry.channel, entry.metric, entry.value, entry.recordedAt],
      );
    } catch {
      // In-memory fallback
    }
  }

  return entry;
}

export function getDistributionReport(
  tenantId: string,
  period: string,
): DistributionReport {
  const metrics = [...distributionMetricStore.values()].filter(
    (m) => m.tenantId === tenantId,
  );

  const channelMap = new Map<string, Record<string, number>>();
  let totalTraffic = 0;
  let totalConversions = 0;

  for (const m of metrics) {
    const existing = channelMap.get(m.channel) ?? {};
    existing[m.metric] = (existing[m.metric] ?? 0) + m.value;
    channelMap.set(m.channel, existing);

    if (m.metric === "traffic") totalTraffic += m.value;
    if (m.metric === "conversions") totalConversions += m.value;
  }

  const channels: ChannelReport[] = [...channelMap.entries()].map(
    ([channel, metricMap]) => ({ channel, metrics: metricMap }),
  );

  return {
    tenantId,
    period,
    channels,
    totalTraffic,
    totalConversions,
  };
}

export function getTopPerformingContent(
  tenantId: string,
  limit: number = 10,
): { contentId: string; channel: string; traffic: number; conversions: number }[] {
  const metrics = [...distributionMetricStore.values()].filter(
    (m) => m.tenantId === tenantId,
  );

  const contentMap = new Map<string, { channel: string; traffic: number; conversions: number }>();

  for (const m of metrics) {
    const key = `${m.channel}:${m.metric}`;
    const existing = contentMap.get(key) ?? { channel: m.channel, traffic: 0, conversions: 0 };
    if (m.metric === "traffic") existing.traffic += m.value;
    if (m.metric === "conversions") existing.conversions += m.value;
    contentMap.set(key, existing);
  }

  return [...contentMap.entries()]
    .map(([contentId, data]) => ({ contentId, ...data }))
    .sort((a, b) => b.traffic + b.conversions - (a.traffic + a.conversions))
    .slice(0, limit);
}
