"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DisputeActionsProps {
  disputeId: string
  providerName: string
  leadName: string
}

export function DisputeActions({
  disputeId,
  providerName,
  leadName,
}: DisputeActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleResolve(status: "approved" | "denied") {
    setLoading(status === "approved" ? "approve" : "deny")
    setError(null)

    try {
      const res = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId,
          status,
          // creditAmount can be added later via a modal
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? `Failed to ${status === "approved" ? "approve" : "deny"} dispute`)
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="default"
        className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
        disabled={loading !== null}
        onClick={() => handleResolve("approved")}
        aria-label={`Approve dispute from ${providerName} for lead ${leadName}`}
      >
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 px-2.5 text-xs"
        disabled={loading !== null}
        onClick={() => handleResolve("denied")}
        aria-label={`Deny dispute from ${providerName} for lead ${leadName}`}
      >
        {loading === "deny" ? "..." : "Deny"}
      </Button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 max-w-[120px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}
