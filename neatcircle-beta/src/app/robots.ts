import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.siteUrl || "https://neatcircle.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/control-center/", "/api/", "/auth/", "/funnels/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
