// erie-pro/src/components/local-proof-ticker.tsx
"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, Star } from "lucide-react"
import type { SocialProofPayload } from "@/app/api/public/social-proof/route"

interface LocalProofTickerProps {
  className?: string
}

export function LocalProofTicker({ className = "" }: LocalProofTickerProps) {
  const [proof, setProof] = useState<SocialProofPayload | null>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch("/api/public/social-proof")
        if (!response.ok) return
        const data = (await response.json()) as SocialProofPayload
        if (!cancelled) setProof(data)
      } catch {
        // Keep static fallback in render
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const messages = proof?.messages ?? []
    if (messages.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [proof?.messages])

  const messages =
    proof?.messages ?? [
      "One vetted local pro per job — free for homeowners",
      "Serving Erie County communities daily",
    ]

  const statsLine = proof
    ? [
        proof.serviceCount > 0 ? `${proof.serviceCount}+ services` : null,
        proof.communityCount > 0 ? `${proof.communityCount} communities` : null,
        proof.listingCount != null && proof.listingCount > 0
          ? `${proof.listingCount.toLocaleString()} directory listings`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null

  return (
    <aside
      className={`rounded-lg border bg-muted/40 px-4 py-3 text-sm ${className}`}
      aria-live="polite"
      aria-label="Local trust signals"
    >
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-medium text-foreground">{messages[index] ?? messages[0]}</span>
        {statsLine ? (
          <>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {statsLine}
            </span>
          </>
        ) : null}
      </div>
    </aside>
  )
}
