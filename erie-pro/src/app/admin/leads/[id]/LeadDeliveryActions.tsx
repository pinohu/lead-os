"use client"

import { useState } from "react"

type ActionState = {
  status: "idle" | "loading" | "success" | "error"
  message: string
}

export function LeadDeliveryActions({
  leadId,
  requestedProviderName,
  defaultEmail,
}: {
  leadId: string
  requestedProviderName?: string | null
  defaultEmail?: string | null
}) {
  const [providerEmail, setProviderEmail] = useState(defaultEmail ?? "")
  const [notes, setNotes] = useState("")
  const [state, setState] = useState<ActionState>({ status: "idle", message: "" })

  async function post(url: string, body?: Record<string, unknown>) {
    setState({ status: "loading", message: "Working..." })
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.success) {
      setState({ status: "error", message: result?.error ?? "Action failed." })
      return
    }
    setState({ status: "success", message: result.message ?? "Action completed." })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Delivery email
          </label>
          <input
            value={providerEmail}
            onChange={(event) => setProviderEmail(event.target.value)}
            placeholder="provider@example.com"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Notes
          </label>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={`Delivered to ${requestedProviderName ?? "provider"}`}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={state.status === "loading"}
          onClick={() => post(`/api/admin/leads/${leadId}/deliver`, { providerEmail, notes })}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Deliver to Provider
        </button>
        <button
          type="button"
          disabled={state.status === "loading"}
          onClick={() => post(`/api/admin/leads/${leadId}/sync`)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Retry Boost.space Sync
        </button>
      </div>
      {state.message && (
        <p
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            state.status === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
