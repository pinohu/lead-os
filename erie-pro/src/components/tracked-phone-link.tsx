"use client"

import type { AnchorHTMLAttributes, ReactNode } from "react"

type TrackedPhoneLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  phone: string
  children: ReactNode
  serviceNiche?: string
  serviceSlug?: string
  sourcePageType?: string
  keywordCluster?: string
  requestedProviderName?: string | null
  requestedProviderSlug?: string | null
  exclusiveProviderId?: string | null
  exclusiveProviderName?: string | null
  routingModel?: "general" | "provider_specific" | "exclusive_niche" | "unknown"
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return phone
}

function getSessionId(): string {
  const key = "erie_pro_session_id"
  try {
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.sessionStorage.setItem(key, next)
    return next
  } catch {
    return "session-unavailable"
  }
}

function getUtmParam(name: string): string | null {
  try {
    return new URL(window.location.href).searchParams.get(name)
  } catch {
    return null
  }
}

export function TrackedPhoneLink({
  phone,
  children,
  serviceNiche,
  serviceSlug,
  sourcePageType,
  keywordCluster,
  requestedProviderName,
  requestedProviderSlug,
  exclusiveProviderId,
  exclusiveProviderName,
  routingModel,
  ...props
}: TrackedPhoneLinkProps) {
  const dialable = phone.replace(/\D/g, "")

  function trackPhoneClick() {
    if (typeof window === "undefined") return

    const providerSpecific = Boolean(requestedProviderSlug || requestedProviderName)
    const payload = {
      eventId:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `phone-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      eventType: "phone.click_created",
      sourceSystem: "erie-pro",
      sourceDomain: window.location.hostname || "erie.pro",
      sourcePage: window.location.href,
      sourcePageType,
      serviceNiche,
      serviceSlug: serviceSlug ?? serviceNiche,
      keywordCluster,
      phoneNumberClicked: normalizePhone(phone),
      requestedProviderName,
      requestedProviderSlug,
      exclusiveProviderId,
      exclusiveProviderName,
      routingModel: routingModel ?? (providerSpecific ? "provider_specific" : "general"),
      sessionId: getSessionId(),
      utmSource: getUtmParam("utm_source"),
      utmMedium: getUtmParam("utm_medium"),
      utmCampaign: getUtmParam("utm_campaign"),
      gclid: getUtmParam("gclid"),
    }

    const body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events/phone-click", new Blob([body], { type: "application/json" }))
      return
    }

    fetch("/api/events/phone-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <a href={`tel:${dialable}`} onClick={trackPhoneClick} {...props}>
      {children}
    </a>
  )
}
