import Link from "next/link"
import type { Metadata } from "next"
import { MapPin, ArrowRight, Building2 } from "lucide-react"
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
import { safeJsonLd } from "@/lib/jsonld"

export const metadata: Metadata = {
  title: `Service Areas — ${cityConfig.name} Metro | ${cityConfig.domain}`,
  description: `${cityConfig.domain} serves ${cityConfig.serviceArea.length} communities in the ${cityConfig.name}, ${cityConfig.stateCode} metro area. Find verified local professionals near you.`,
}

const AREA_DESCRIPTIONS: Record<string, string> = {
  Erie: "The heart of Erie County and the core of our service area. Erie's mix of historic neighborhoods, waterfront districts, and developing suburbs means diverse home service needs year-round.",
  Millcreek: "Erie's largest township and most populous suburb. Millcreek's growing residential areas and established neighborhoods keep local service professionals busy with everything from new construction to historic home maintenance.",
  Harborcreek: "A thriving eastern suburb with a mix of rural properties and newer subdivisions. Harborcreek homeowners benefit from quick access to Erie-based professionals while enjoying a more spacious setting.",
  Fairview: "A western Erie suburb known for its strong school district and family-friendly neighborhoods. Fairview's steady growth means consistent demand for quality home services and reliable local providers.",
  "Summit Township": "Located south of Erie, Summit Township offers a blend of suburban development and open space. Growing residential areas create ongoing demand for licensed contractors and service professionals.",
  McKean: "A small borough south of Erie with a close-knit community character. McKean homeowners appreciate the personalized service that local professionals provide to smaller communities.",
  Edinboro: "Home to a university campus and a charming small-town atmosphere, Edinboro serves both student housing and established residential areas. Local service providers understand the unique mix of properties.",
  Waterford: "A historic borough southeast of Erie known for its well-preserved architecture and community pride. Waterford properties often require professionals experienced with older construction methods.",
  "North East": "The easternmost community in our service area, North East is known for its vineyards and lake access. Properties range from historic homes to newer developments near the lake.",
  Girard: "A western Erie County borough with a strong community identity. Girard homeowners enjoy competitive pricing from providers who serve the broader Erie metro area.",
}

export default function AreasPage() {
  return (
    <main>
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Service Areas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <MapPin className="mr-1.5 h-3 w-3" />
            Service Areas
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Communities We Serve in the {cityConfig.name} Metro Area
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {cityConfig.domain} connects homeowners with verified professionals
            across {cityConfig.serviceArea.length} communities in{" "}
            {cityConfig.name} County, {cityConfig.state}.
          </p>
        </div>
      </section>

      {/* ── Area Cards ────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {cityConfig.serviceArea.map((area) => (
            <Card key={area}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                  {area}, {cityConfig.stateCode}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {AREA_DESCRIPTIONS[area] ??
                    `A valued community in the ${cityConfig.name} metro area served by verified professionals on ${cityConfig.domain}.`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {niches.slice(0, 4).map((niche) => (
                    <Badge key={niche.slug} variant="outline" className="text-xs">
                      {niche.icon} {niche.label}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    +{niches.length - 4} more
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Services in All Areas ──────────────────────────────── */}
      <section className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-xl font-bold text-center mb-8">
            Services Available in All {cityConfig.name} Metro Communities
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
            {niches.map((niche) => (
              <Link
                key={niche.slug}
                href={`/${niche.slug}`}
                className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <span className="text-lg">{niche.icon}</span>
                {niche.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Building2 className="mx-auto mb-4 h-8 w-8 text-primary/60" />
          <h2 className="text-xl font-bold">
            Serve customers in the {cityConfig.name} area?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Join {cityConfig.domain} and connect with homeowners across{" "}
            {cityConfig.serviceArea.length} communities. Exclusive territory
            listings available.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/for-business">
                List Your Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Schema.org AreaServed ──────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: cityConfig.domain,
            url: `https://${cityConfig.domain}`,
            areaServed: cityConfig.serviceArea.map((area) => ({
              "@type": "City",
              name: area,
              containedInPlace: {
                "@type": "State",
                name: cityConfig.state,
              },
            })),
          }),
        }}
      />
    </main>
  )
}
