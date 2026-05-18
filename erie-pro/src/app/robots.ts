import type { MetadataRoute } from "next"
import { cityConfig } from "@/lib/city-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/",
          "/dashboard",
          "/dashboard/*",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/for-business/claim/success",
          "/for-business/leads/success",
          "/concierge/success",
          "/lead-status",
          "/setup-admin",
        ],
      },
    ],
    sitemap: `https://${cityConfig.domain}/sitemap.xml`,
  }
}
