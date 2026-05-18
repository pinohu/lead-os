// erie-pro/src/app/manage-data/page.tsx
"use client"

import { Suspense, useCallback, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cityConfig } from "@/lib/city-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function ManageDataForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [token, setToken] = useState(searchParams.get("token") ?? "")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [result, setResult] = useState("")

  const runAction = useCallback(
    async (action: "export" | "delete") => {
      if (!email.trim() || !token.trim()) {
        setStatus("error")
        setResult("Email and token are required. Use the link from your confirmation email.")
        return
      }
      setStatus("loading")
      setResult("")
      try {
        const params = new URLSearchParams({
          email: email.trim(),
          token: token.trim(),
          action,
        })
        const res = await fetch(`/api/privacy/self-service?${params.toString()}`)
        const json = (await res.json()) as {
          success?: boolean
          data?: { message?: string } | unknown
          error?: string
        }
        if (!res.ok || !json.success) {
          setStatus("error")
          setResult(json.error ?? "Request failed")
          return
        }
        setStatus("done")
        if (action === "delete") {
          const msg =
            json.data && typeof json.data === "object" && "message" in json.data
              ? String((json.data as { message?: string }).message)
              : "Deletion request submitted."
          setResult(msg)
          return
        }
        setResult(JSON.stringify(json.data, null, 2))
      } catch {
        setStatus("error")
        setResult("Network error. Try again later.")
      }
    },
    [email, token]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your data on {cityConfig.domain}</CardTitle>
        <CardDescription>
          Export or request deletion of personal data we hold (GDPR / CCPA). Deletions are
          processed within 48 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Access token</Label>
            <Input
              id="token"
              type="text"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="From your privacy email link"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={status === "loading"} onClick={() => runAction("export")}>
            Download my data
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={status === "loading"}
            onClick={() => runAction("delete")}
          >
            Request deletion
          </Button>
        </div>
        {result ? (
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">
            {result}
          </pre>
        ) : null}
        <p className="text-sm text-muted-foreground">
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function ManageDataPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <ManageDataForm />
      </Suspense>
    </main>
  )
}
