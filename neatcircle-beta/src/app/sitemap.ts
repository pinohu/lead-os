import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/services";
import { nicheManifests } from "@/lib/niche-config";
import { gmbProfiles } from "@/lib/gmb-profiles";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.siteUrl || "https://neatcircle.com";
  const now = new Date();
  const serviceSlugs = getAllSlugs();
  const nicheSlugs = Object.keys(nicheManifests);

  return [
    // ─── Core pages ────────────────────────────────────────
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/locations`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/webinar`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/webinar/on-demand`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/customer-success`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/giveaway`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },

    // ─── Service pages ─────────────────────────────────────
    ...serviceSlugs.map((slug) => ({
      url: `${baseUrl}/services/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // ─── Stories (per service) ─────────────────────────────
    ...serviceSlugs.map((slug) => ({
      url: `${baseUrl}/stories/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // ─── Industry pages ────────────────────────────────────
    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/industries/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // ─── Location pages ────────────────────────────────────
    ...gmbProfiles.map((profile) => ({
      url: `${baseUrl}/locations/${profile.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // ─── Assessment pages ──────────────────────────────────
    ...nicheSlugs.map((slug) => ({
      url: `${baseUrl}/assess/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
