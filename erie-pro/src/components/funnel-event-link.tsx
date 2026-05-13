"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

type FunnelEventLinkProps = ComponentProps<typeof Link> & {
  eventType: string
  funnelSlug?: string
  offerSlug?: string
  serviceSlug?: string
  serviceLabel?: string
  serviceFamily?: string
  visitorSegment?: string
  sourcePageType?: string
}

function getCampaignParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name)
  } catch {
    return null
  }
}

function getStoredId(key: string, prefix: string) {
  try {
    const storage = key.includes("session") ? window.sessionStorage : window.localStorage
    const existing = storage.getItem(key)
    if (existing) return existing
    const generated = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    storage.setItem(key, generated)
    return generated
  } catch {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  }
}

export function FunnelEventLink({
  eventType,
  funnelSlug,
  offerSlug,
  serviceSlug,
  serviceLabel,
  serviceFamily,
  visitorSegment = "provider",
  sourcePageType = "funnel_page",
  onClick,
  ...props
}: FunnelEventLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)
        const body = JSON.stringify({
          eventType,
          funnelSlug,
          offerSlug,
          serviceSlug,
          serviceLabel,
          serviceFamily,
          visitorSegment,
          sourcePage: window.location.href,
          sourcePageType,
          sessionId: getStoredId("erie_pro_funnel_session_id", "epfs"),
          visitorId: getStoredId("erie_pro_funnel_visitor_id", "epfv"),
          utmSource: getCampaignParam("utm_source"),
          utmMedium: getCampaignParam("utm_medium"),
          utmCampaign: getCampaignParam("utm_campaign"),
          gclid: getCampaignParam("gclid"),
          metadata: {
            targetHref: String(props.href),
          },
        })
        if (navigator.sendBeacon) {
          const sent = navigator.sendBeacon("/api/funnels", new Blob([body], { type: "application/json" }))
          if (sent) return
        }
        void fetch("/api/funnels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {})
      }}
    />
  )
}
