import type { MetadataRoute } from "next";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";

const PERSONA_SLUGS = ["agencies", "saas-founders", "lead-gen", "consultants", "franchises"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");
  const now = new Date();
  const nicheSlugs = Object.keys(nicheCatalog);

  return [
    // ─── Core pages ────────────────────────────────────────
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/onboard`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/roadmap`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/auth/sign-in`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/manage-data`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/preferences`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/docs/api`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/docs/sla`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/offers`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },

    // ─── Industry directory ────────────────────────────────
    { url: `${baseUrl}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/industries/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/offers/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // ─── Assessments per niche ────────────────────────────
    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/assess/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // ─── Authority resource guides ────────────────────────
    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/resources/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),

    // ─── Directory pages ──────────────────────────────────
    { url: `${baseUrl}/directory`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/directory/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),

    // ─── Persona landing pages ────────────────────────────
    ...PERSONA_SLUGS.map((slug) => ({
      url: `${baseUrl}/for/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
