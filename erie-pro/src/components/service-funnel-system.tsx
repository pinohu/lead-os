import Link from "next/link"
import { ArrowRight, GitBranch, ShieldCheck } from "lucide-react"
import { getFunnelsForService } from "@/lib/sales-funnels"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FunnelEventLink } from "@/components/funnel-event-link"

type ServiceFunnelSystemProps = {
  serviceSlug: string
  serviceLabel: string
}

function price(cents?: number) {
  if (cents == null) return null
  if (cents === 0) return "Free"
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function publicTitle(value: string) {
  return value.replace(" Funnel-in-a-Box", " Website Lead Path").replace(" Funnel", "").replace(" / Save", "")
}

function checkoutWithContext(href: string, input: { funnelSlug: string; offerSlug: string; serviceSlug: string; serviceFamily?: string }) {
  if (!href.startsWith("http")) return href
  const url = new URL(href)
  url.searchParams.set("funnelSlug", input.funnelSlug)
  url.searchParams.set("offerSlug", input.offerSlug)
  url.searchParams.set("serviceSlug", input.serviceSlug)
  if (input.serviceFamily) url.searchParams.set("serviceFamily", input.serviceFamily)
  url.searchParams.set("sourcePageType", "service_funnel_panel")
  url.searchParams.set("utm_source", "erie_pro")
  url.searchParams.set("utm_medium", "service_page_panel")
  url.searchParams.set("utm_campaign", input.funnelSlug)
  return url.toString()
}

export function ServiceFunnelSystem({ serviceSlug, serviceLabel }: ServiceFunnelSystemProps) {
  const recommendations = getFunnelsForService(serviceSlug).slice(0, 6)
  const primary = recommendations[0]
  const paid = recommendations.find((item) => item.offer?.checkoutUrl && item.offer.basePriceCents > 0)

  if (!primary) return null

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <Card className="overflow-hidden border-teal-200 bg-white shadow-sm">
        <CardHeader className="bg-slate-950 text-white">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
            <GitBranch className="h-3.5 w-3.5" />
            Growth path for {serviceLabel} providers
          </div>
          <CardTitle className="max-w-2xl text-2xl">
            Start with the right next step for your Erie County {serviceLabel.toLowerCase()} business.
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            This path is matched to the service category, urgency, buyer expectations, and the practical support Erie.Pro can provide.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            {recommendations.slice(0, 3).map((item, index) => (
              <div key={item.funnel.slug} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {item.offer ? <Badge variant="secondary">{price(item.offer.basePriceCents)}</Badge> : null}
                </div>
                <h3 className="text-sm font-semibold text-slate-950">{publicTitle(item.funnel.title)}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold">Designed not to overwhelm visitors.</p>
                <p className="mt-1 text-emerald-900">
                  Requesters stay on the service request path. Providers can explore growth tools when they are looking for business support.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-teal-700 hover:bg-teal-800">
              <FunnelEventLink
                href={`/funnels/${primary.funnel.slug}/landing?service=${serviceSlug}`}
                eventType="funnel.service_path_opened"
                funnelSlug={primary.funnel.slug}
                offerSlug={primary.offer?.slug}
                serviceSlug={serviceSlug}
                serviceLabel={serviceLabel}
                serviceFamily={primary.serviceFamily}
              >
                View recommended option
                <ArrowRight className="ml-2 h-4 w-4" />
              </FunnelEventLink>
            </Button>
            {paid?.offer?.checkoutUrl ? (
              <Button asChild variant="outline">
                <FunnelEventLink
                  href={checkoutWithContext(paid.offer.checkoutUrl, {
                    funnelSlug: paid.funnel.slug,
                    offerSlug: paid.offer.slug,
                    serviceSlug,
                    serviceFamily: paid.serviceFamily,
                  })}
                  eventType="funnel.service_checkout_clicked"
                  funnelSlug={paid.funnel.slug}
                  offerSlug={paid.offer.slug}
                  serviceSlug={serviceSlug}
                  serviceLabel={serviceLabel}
                  serviceFamily={paid.serviceFamily}
                >
                  {paid.funnel.primaryCta}
                </FunnelEventLink>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link href="/funnels">See all provider options</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
