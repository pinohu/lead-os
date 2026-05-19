"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface NotificationRow {
  id: string
  requestId: string
  templateSlug: string
  recipientEmail: string
  recipientRole: string
  status: string
  retryCount: number
  maxRetries: number
  lastError: string | null
  nextRetryAt: string | null
  sentAt: string | null
  createdAt: string
}

export function AdminNotificationsClient({
  initialEvents,
}: {
  initialEvents: NotificationRow[]
}) {
  const [events, setEvents] = useState(initialEvents)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function retry(eventId: string) {
    setLoadingId(eventId)
    try {
      const res = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json()
      if (data.success && data.event) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status: data.event.status,
                  retryCount: data.event.retryCount,
                  lastError: data.event.lastError,
                  sentAt: data.event.sentAt,
                }
              : e
          )
        )
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Request</th>
            <th className="p-3 font-medium">Template</th>
            <th className="p-3 font-medium">To</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Retries</th>
            <th className="p-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-3 font-mono text-xs">{e.requestId}</td>
              <td className="p-3">{e.templateSlug}</td>
              <td className="p-3">{e.recipientEmail}</td>
              <td className="p-3 capitalize">{e.status}</td>
              <td className="p-3">
                {e.retryCount}/{e.maxRetries}
              </td>
              <td className="p-3">
                {e.status !== "sent" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === e.id}
                    onClick={() => retry(e.id)}
                  >
                    {loadingId === e.id ? "Retrying…" : "Retry"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && (
        <p className="p-6 text-center text-muted-foreground">No notification events yet.</p>
      )}
    </div>
  )
}
