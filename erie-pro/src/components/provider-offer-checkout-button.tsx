"use client"

// erie-pro/src/components/provider-offer-checkout-button.tsx

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ProviderOfferCheckoutButton({
  planSlug,
  providerId,
}: {
  planSlug: string
  providerId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    setLoading(true)
    setError(null)
    const response = await fetch("/api/offers/start-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug, providerId }),
    })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok || !data.checkoutUrl) {
      setError(data.error ?? "Checkout is not configured for this plan yet.")
      return
    }
    window.location.href = data.checkoutUrl
  }

  return (
    <div className="space-y-2">
      <Button onClick={startCheckout} disabled={loading} size="lg">
        {loading ? "Loading checkout…" : "Continue to ThriveCart checkout"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        You will complete payment on ThriveCart. Payment activates provisioning; publication still requires verification and data quality checks.
      </p>
    </div>
  )
}
