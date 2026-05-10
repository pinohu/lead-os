import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, CheckCircle2, Clock, Lock, ShieldCheck } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { HomepageLeadForm } from "@/components/homepage-lead-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Get Matched Free",
  description: `Tell ${cityConfig.domain} what you need and get matched with one local ${cityConfig.name}, ${cityConfig.stateCode} pro. Free request, no bidding wars, no obligation.`,
  alternates: { canonical: `https://${cityConfig.domain}/get-matched` },
}

export default function GetMatchedPage() {
  const searchNiches = niches.map((n) => ({
    slug: n.slug,
    label: n.label,
    icon: n.icon,
  }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://${cityConfig.domain}/get-matched#webpage`,
    name: "Get Matched Free",
    url: `https://${cityConfig.domain}/get-matched`,
    description: `Request a local service match in ${cityConfig.name}, ${cityConfig.stateCode}.`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `https://${cityConfig.domain}` },
        { "@type": "ListItem", position: 2, name: "Get Matched Free", item: `https://${cityConfig.domain}/get-matched` },
      ],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Get Matched Free</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <section className="border-b bg-muted/30 py-12">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <Badge variant="secondary" className="mb-4">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Free local match
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Get matched with a local Erie pro.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
                Tell us what you need. Erie.pro routes your request to one relevant local
                provider when a fit is available. No public request blast, no bidding war,
                and no obligation to hire.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["One request", "Start with a simple service form."],
                  ["One local pro", "We focus the match instead of sending five calls."],
                  ["You decide", "Confirm price, timing, and fit before hiring."],
                ].map(([title, body]) => (
                  <Card key={title}>
                    <CardContent className="p-4">
                      <CheckCircle2 className="mb-2 h-5 w-5 text-primary" />
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tell us what you need</CardTitle>
              </CardHeader>
              <CardContent>
                <HomepageLeadForm
                  niches={searchNiches}
                  citySlug={cityConfig.slug}
                  cityName={cityConfig.name}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <Clock className="h-5 w-5" />,
                title: "Use it when time matters",
                body: "Good for plumbing, HVAC, electrical, restoration, garage door, locksmith, snow, and other local needs.",
              },
              {
                icon: <Lock className="h-5 w-5" />,
                title: "Your request stays focused",
                body: "Erie.pro should not publish your request or sell it into a bidding marketplace.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Verify before hiring",
                body: "Confirm credentials, pricing, service area, and availability directly with the provider.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <div className="mb-2 text-primary">{item.icon}</div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/services">Browse Services</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/directory">Browse Directory</Link>
            </Button>
            <Button asChild>
              <Link href="/emergency">
                Emergency Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
