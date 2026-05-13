import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, Layers3, PackageCheck, Route, Sparkles, type LucideIcon } from "lucide-react"
import { salesFunnels, getServiceFamilySummary } from "@/lib/sales-funnels"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Erie.Pro Provider Growth Options",
  description: "Service-specific Erie.Pro options for providers who want clearer pages, stronger trust, better follow-up, and more organized growth.",
}

function publicTitle(value: string) {
  return value.replace(" Funnel-in-a-Box", " Website Lead Path").replace(" Funnel", "").replace(" / Save", "")
}

export default function FunnelsPage() {
  const families = getServiceFamilySummary()
  const counts = {
    funnels: salesFunnels.length,
    families: families.length,
    provider: salesFunnels.filter((funnel) => funnel.primaryAudience === "provider").length,
    customer: salesFunnels.filter((funnel) => funnel.temperature === "customer").length,
  }
  const metricCards: Array<[string, number, LucideIcon]> = [
    ["Growth options", counts.funnels, BriefcaseBusiness],
    ["Service groups", counts.families, Layers3],
    ["Provider tools", counts.provider, Route],
    ["Customer care", counts.customer, PackageCheck],
  ]

  return (
    <main className="bg-slate-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Badge className="mb-4 bg-teal-700 text-white hover:bg-teal-700">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Erie.Pro provider growth
          </Badge>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Practical growth options for Erie County service providers.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Choose the support that fits your service, urgency, and current stage, from a quick scorecard to page improvements, follow-up assets, reputation support, and monthly opportunity guidance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metricCards.map(([name, value, Icon]) => (
                <Card key={String(name)} className="border-slate-200">
                  <CardContent className="p-4">
                    <Icon className="mb-3 h-5 w-5 text-teal-700" />
                    <div className="text-2xl font-bold text-slate-950">{String(value)}</div>
                    <div className="text-xs font-medium uppercase text-slate-500">{String(name)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-2">
        {salesFunnels.map((funnel) => (
          <Card key={funnel.slug} className="border-slate-200 bg-white">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{funnel.primaryAudience === "provider" ? "For providers" : "Customer support"}</Badge>
                <Badge variant="outline">Guided next step</Badge>
              </div>
              <CardTitle className="text-xl">{publicTitle(funnel.title)}</CardTitle>
              <CardDescription>{funnel.subheadline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What it helps with</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{funnel.headline}</p>
                <p className="mt-1 text-sm text-slate-600">{funnel.offerMechanics.promise}</p>
              </div>
              <div>
                <Button asChild className="h-11 justify-between bg-teal-700 hover:bg-teal-800">
                  <Link href={`/funnels/${funnel.slug}/landing`}>
                    See details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
