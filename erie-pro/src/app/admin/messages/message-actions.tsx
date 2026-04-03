"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Eye, CheckCircle2 } from "lucide-react"

interface MessageActionsProps {
  messageId: string
  status: string
  email: string
  name: string | null
}

export function MessageActions({
  messageId,
  status,
  email,
  name,
}: MessageActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(newStatus: "read" | "replied") {
    setLoading(newStatus)
    try {
      const res = await fetch("/api/admin/messages/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error("Failed to update status:", data)
        return
      }
      router.refresh()
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setLoading(null)
    }
  }

  const subject = encodeURIComponent(
    `Re: Your message to Erie Pro${name ? ` — ${name}` : ""}`
  )
  const mailtoHref = `mailto:${email}?subject=${subject}`

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3">
      {status === "unread" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading === "read"}
          onClick={() => updateStatus("read")}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {loading === "read" ? "Updating..." : "Mark Read"}
        </Button>
      )}

      {status !== "replied" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading === "replied"}
          onClick={() => updateStatus("replied")}
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          {loading === "replied" ? "Updating..." : "Mark Replied"}
        </Button>
      )}

      <Button variant="default" size="sm" asChild>
        <a href={mailtoHref}>
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Reply
        </a>
      </Button>
    </div>
  )
}
