import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Clock, ShieldAlert, Siren } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
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
  title: "Emergency Services in Erie, PA",
  description: `Find emergency service help in Erie, PA for urgent plumbing, HVAC, electrical, restoration, locksmith, garage door, snow, and storm damage needs.`,
  alternates: { canonical: `https://${cityConfig.domain}/emergency` },
}

const emergencySlugs = [
  "plumbing",
  "hvac",
  "electrical",
  "restoration",
  "roofing",
  "garage-door",
  "locksmith",
  "snow-removal",
  "towing",
  "pest-control",
  "foundation",
  "auto-repair",
]

export default function EmergencyServicesPage() {
  const emergencyNiches = emergencySlugs
    .map((slug) => niches.find((n) => n.slug === slug))
    .filter(Boolean) as typeof niches

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `https://${cityConfig.domain}/emergency#webpage`,
        name: `Emergency Services in ${cityConfig.name}, ${cityConfig.stateCode}`,
        url: `https://${cityConfig.domain}/emergency`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `https://${cityConfig.domain}` },
            { "@type": "ListItem", position: 2, name: "Emergency Services", item: `https://${cityConfig.domain}/emergency` },
          ],
        },
      },
      {
        "@type": "ItemList",
        "@id": `https://${cityConfig.domain}/emergency#emergency-services`,
        name: `Emergency Services in ${cityConfig.name}, ${cityConfig.stateCode}`,
        numberOfItems: emergencyNiches.length,
        itemListElement: emergencyNiches.map((niche, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: niche.label,
          url: `https://${cityConfig.domain}/${niche.slug}/emergency`,
        })),
      },
    ],
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
                  <BreadcrumbPage>Emergency Services</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <section className="border-b bg-muted/30 py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <Badge variant="secondary" className="mb-4">
              <Siren className="mr-1.5 h-3.5 w-3.5" />
              Urgent local help
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Emergency services in Erie, PA
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              For urgent local needs, start with the service category below. If there is
              immediate danger, call 911 first. Erie.pro helps route non-life-threatening
              service requests to local providers when a fit is available.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/get-matched">
                  Get Matched Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Urgent service categories</h2>
            <Badge variant="outline">{emergencyNiches.length} categories</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {emergencyNiches.map((niche) => (
              <Card key={niche.slug} className="transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span>{niche.icon}</span>
                    {niche.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-6 text-muted-foreground">
                    {niche.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/${niche.slug}/emergency`}>Emergency page</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/${niche.slug}`}>Overview</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30 py-12">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:px-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Clock className="mb-2 h-5 w-5 text-primary" />
                <CardTitle>What to share</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Describe the problem, when it started, your Erie-area location, access
                limits, photos if safe, and whether the issue is still getting worse.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ShieldAlert className="mb-2 h-5 w-5 text-primary" />
                <CardTitle>What not to assume</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Do not rely on guaranteed arrival times, pricing, licenses, or
                availability unless the provider has confirmed those details directly.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  )
}
