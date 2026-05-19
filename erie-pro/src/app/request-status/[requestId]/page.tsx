import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cityConfig } from "@/lib/city-config"
import { getServiceRequestStatus } from "@/lib/service-requests/status"
import { StatusTimeline } from "@/components/status-timeline"
import { StatusAssistant } from "@/components/chat/status-assistant"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: `Request status | ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ requestId: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function RequestStatusPage({ params, searchParams }: PageProps) {
  const { requestId } = await params
  const { token } = await searchParams

  if (!token) notFound()

  const status = await getServiceRequestStatus(requestId, token)
  if (!status) notFound()

  const niceNiche = status.niche.replace(/-/g, " ")

  return (
    <main className="container max-w-2xl py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Your service request</CardTitle>
          <CardDescription>
            {niceNiche} in {status.city} · {status.requestId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Current status</dt>
              <dd className="font-medium capitalize">{status.status.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-medium">{new Date(status.createdAt).toLocaleString()}</dd>
            </div>
            {status.routedTo && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Routed to</dt>
                <dd className="font-medium">{status.routedTo}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Provider email sent</dt>
              <dd className="font-medium">
                {status.providerNotified
                  ? "Yes — we have a sent notification on file"
                  : "Not yet — we will not claim the provider was notified until email delivery is confirmed"}
              </dd>
            </div>
          </dl>

          <section>
            <h2 className="text-base font-semibold mb-4">Status timeline</h2>
            <StatusTimeline items={status.timeline} />
          </section>

          {status.notifications.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3">Notifications</h2>
              <ul className="text-sm space-y-2">
                {status.notifications.map((n) => (
                  <li key={`${n.templateSlug}-${n.recipientRole}`} className="flex justify-between gap-4">
                    <span className="text-muted-foreground capitalize">
                      {n.recipientRole} · {n.templateSlug.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium capitalize">{n.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </CardContent>
      </Card>

      <StatusAssistant requestId={status.requestId} statusToken={token} />
    </main>
  )
}
