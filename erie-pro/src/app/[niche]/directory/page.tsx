import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Building2, ArrowRight, MapPin, Star, Clock, ShieldCheck, Phone } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type Props = { params: Promise<{ niche: string }> }

export function generateStaticParams() {
  return getAllNicheSlugs().map((slug) => ({ niche: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) return { title: "Not Found" }
  return {
    title: `${content.pluralLabel} Directory — ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    description: `Browse verified ${content.pluralLabel.toLowerCase()} in ${cityConfig.name}, ${cityConfig.stateCode}. Licensed, insured professionals with reviews. Claim your listing today.`,
  }
}

const PLACEHOLDER_SLOTS = [
  { area: "Erie", specialty: "Full service", featured: true },
  { area: "Millcreek", specialty: "Residential specialist", featured: false },
  { area: "Harborcreek", specialty: "Commercial & residential", featured: false },
  { area: "Fairview", specialty: "Licensed & insured", featured: true },
  { area: "Summit Township", specialty: "Emergency service available", featured: false },
  { area: "North East", specialty: "Serving all of Erie County", featured: false },
  { area: "Edinboro", specialty: "Family-owned & operated", featured: true },
  { area: "Girard", specialty: "20+ years experience", featured: false },
]

export default async function NicheDirectoryPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

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
                <BreadcrumbLink asChild>
                  <Link href={`/${slug}`}>{niche.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Directory</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Building2 className="mr-1.5 h-3 w-3" />
            Local Directory
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {content.pluralLabel} in {cityConfig.name},{" "}
            {cityConfig.stateCode}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Browse verified {content.pluralLabel.toLowerCase()} serving the{" "}
            {cityConfig.name} metro area. Every listing is vetted for licensing,
            insurance, and reputation.
          </p>
        </div>
      </section>

      {/* ── Directory Listings ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {content.pluralLabel} — {cityConfig.name} Area
          </h2>
          <Badge variant="outline">
            {PLACEHOLDER_SLOTS.length} Listings Available
          </Badge>
        </div>

        <div className="grid gap-4">
          {PLACEHOLDER_SLOTS.map((slot, i) => (
            <Card
              key={i}
              className="border-dashed border-2 hover:border-primary/50 transition-colors"
            >
              <CardContent className="flex items-center gap-4 py-5">
                <Avatar className="h-14 w-14 bg-muted">
                  <AvatarFallback className="text-lg text-muted-foreground/40">
                    {niche.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-muted-foreground/60">
                      {niche.label} Professional — {slot.area}
                    </p>
                    {slot.featured && (
                      <Badge className="bg-primary/10 text-primary text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {slot.area}, {cityConfig.stateCode}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      {slot.specialty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Available
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-green-300 text-green-700 dark:text-green-400"
                >
                  Available
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── Claim Your Listing CTA ────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              Are you a {niche.label.toLowerCase()} professional in{" "}
              {cityConfig.name}?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mx-auto max-w-lg text-muted-foreground mb-6">
              Claim your exclusive listing on {cityConfig.domain} and become
              the go-to {niche.label.toLowerCase()} provider in your service
              area. Limited to one verified provider per community.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 max-w-lg mx-auto mb-8">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Verified Badge</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Star className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Featured Listing</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Phone className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Direct Leads</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/for-business">
                  Claim Your Listing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Learn More</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Starting at ${niche.monthlyFee}/month &middot; Exclusive
              territory available
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Consumer CTA ──────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Looking for {content.serviceLabel} now?
          </h2>
          <p className="mt-2 text-muted-foreground">
            While our directory grows, you can still get connected with verified{" "}
            {content.pluralLabel.toLowerCase()} by requesting a free quote.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
