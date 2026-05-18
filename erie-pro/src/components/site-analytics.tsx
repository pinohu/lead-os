// erie-pro/src/components/site-analytics.tsx
"use client"

import Script from "next/script"

/**
 * Privacy-friendly analytics. No script loads until NEXT_PUBLIC_UMAMI_WEBSITE_ID is set.
 * Umami Cloud free tier fits the ~$100/mo infra budget.
 */
export function SiteAnalytics() {
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiHost =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://cloud.umami.is/script.js"

  if (!umamiId) return null

  return (
    <Script
      async
      defer
      data-website-id={umamiId}
      src={umamiHost}
      strategy="afterInteractive"
    />
  )
}
