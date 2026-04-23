import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Building2, ArrowRight, MapPin, Star, Clock, ShieldCheck, Phone, Flame, Lock, ExternalLink } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { getProviderByNicheAndCity } from "@/lib/provider-store"
import { getDirectoryListingsByNiche } from "@/lib/directory-store"
import { getBankedLeadsByNiche } from "@/lib/lead-routing"
import { LEAD_PRICES } from "@/lib/stripe-integration"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { InternalLinks } from "@/components/internal-links"
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
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/directory` },
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

function getTodayHours(hoursJson: unknown): string | null {
  if (!hoursJson || typeof hoursJson !== "object") return null
  const hours = hoursJson as { weekdayDescriptions?: string[] }
  if (!Array.isArray(hours.weekdayDescriptions)) return null
  const dayIndex = new Date().getDay()
  // Google weekdayDescriptions: Mon(0) → Sun(6), JS getDay: Sun(0) → Sat(6)
  const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1
  const todayStr = hours.weekdayDescriptions[mappedIndex]
  if (!todayStr) return null
  // Strip the day name prefix (e.g., "Monday: 8:00 AM – 5:00 PM" → "8:00 AM – 5:00 PM")
  const colonIdx = todayStr.indexOf(":")
  return colonIdx > -1 ? todayStr.slice(colonIdx + 1).trim() : todayStr
}

export default async function NicheDirectoryPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  // DB calls wrapped in try/catch so SSG builds succeed without a database.
  let claimedProvider;
  let bankedLeads = 0;
  let listings: Awaited<ReturnType<typeof getDirectoryListingsByNiche>> = [];
  try {
    [claimedProvider, bankedLeads, listings] = await Promise.all([
      getProviderByNicheAndCity(slug, cityConfig.slug),
      getBankedLeadsByNiche(slug),
      getDirectoryListingsByNiche(slug, { limit: 50 }),
    ]);
  } catch {
    // DB unavailable during static build — treat as unclaimed with no banked leads
    claimedProvider = undefined
  }
  const isClaimed = claimedProvider !== undefined
  const hasListings = listings.length > 0
  const highUrgency = bankedLeads >= 10
  const medUrgency = bankedLeads >= 3
  const totalCount = listings.length + (isClaimed ? 1 : 0)

  const directoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `https://${cityConfig.domain}/${slug}/directory#directory`,
    name: `${content.pluralLabel} Directory — ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `${content.pluralLabel} serving the ${cityConfig.name} metro area. Licensed, insured professionals with reviews.`,
    numberOfItems: totalCount,
    itemListElement: [
      ...(claimedProvider ? [{
        "@type": "ListItem" as const,
        position: 1,
        item: {
          "@type": "LocalBusiness" as const,
          name: claimedProvider.businessName,
          url: `https://${cityConfig.domain}/${slug}/${claimedProvider.slug}`,
          telephone: claimedProvider.phone,
          aggregateRating: claimedProvider.reviewCount > 0 ? {
            "@type": "AggregateRating" as const,
            ratingValue: claimedProvider.avgRating,
            reviewCount: claimedProvider.reviewCount,
          } : undefined,
        },
      }] : []),
      ...listings.map((l, i) => ({
        "@type": "ListItem" as const,
        position: (isClaimed ? 2 : 1) + i,
        item: {
          "@type": "LocalBusiness" as const,
          name: l.businessName,
          url: `https://${cityConfig.domain}/${slug}/${l.slug}`,
          telephone: l.phone,
          ...(l.rating && l.reviewCount > 0 ? {
            aggregateRating: {
              "@type": "AggregateRating" as const,
              ratingValue: l.rating,
              reviewCount: l.reviewCount,
            },
          } : {}),
        },
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryJsonLd) }}
      />
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
      <section className="relative border-b pb-12 pt-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-4 text-5xl">{niche.icon}</div>
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

      {/* ── Urgency Banner (unclaimed + banked leads) ─────────── */}
      {!isClaimed && bankedLeads > 0 && (
        <div className={`border-b px-4 py-3 text-center text-sm font-medium ${
          highUrgency
            ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300"
            : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300"
        }`}>
          <Flame className="inline h-4 w-4 mr-1 -mt-0.5" />
          {highUrgency
            ? `${bankedLeads} leads are waiting in ${niche.label} right now — no one is receiving them. This territory is unclaimed.`
            : `${bankedLeads} ${niche.label.toLowerCase()} leads are sitting unclaimed in ${cityConfig.name}. Be the first to receive them.`
          }
        </div>
      )}

      {/* ── Directory Listings ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {content.pluralLabel} — {cityConfig.name} Area
          </h2>
          <Badge variant="secondary">
            {totalCount} {totalCount === 1 ? "provider" : "providers"}
          </Badge>
        </div>

        {/* Featured: show the paying provider at the top */}
        {isClaimed && claimedProvider && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-5">
              <Avatar className="h-14 w-14 bg-primary/10">
                {claimedProvider.photoUrl ? (
                  <AvatarImage src={claimedProvider.photoUrl} alt={claimedProvider.businessName} />
                ) : null}
                <AvatarFallback className="text-lg">{niche.icon}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/${slug}/${claimedProvider.slug}`} className="font-semibold hover:underline">
                    {claimedProvider.businessName}
                  </Link>
                  <Badge className="text-xs">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{cityConfig.name}, {cityConfig.stateCode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500" />{claimedProvider.avgRating.toFixed(1)} ({claimedProvider.reviewCount} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />Responds in ~{Math.round(claimedProvider.avgResponseTime / 60)} min
                  </span>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href={`/${slug}/${claimedProvider.slug}`}>
                  View Profile
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Real listings from Google Places */}
        {hasListings && (
          <div className="grid gap-3">
            {listings.map((listing, idx) => {
              const todayHours = getTodayHours(listing.hoursJson)
              // Rotate through accent colors for visual variety
              const colors = [
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
              ]
              const colorClass = colors[idx % colors.length]
              return (
                <Card key={listing.id} className="hover:border-primary/30 hover:shadow-sm transition-all">
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className={`h-12 w-12 ${colorClass}`}>
                      <AvatarFallback className={`text-sm font-bold ${colorClass}`}>
                        {listing.businessName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/${slug}/${listing.slug}`}
                          className="font-semibold hover:underline truncate"
                        >
                          {listing.businessName}
                        </Link>
                        {listing.website && (
                          <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-primary">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {listing.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                            <span aria-label={`${listing.rating} out of 5 stars`}>
                              {listing.rating.toFixed(1)}
                            </span>
                            {listing.reviewCount > 0 && (
                              <span className="text-muted-foreground/60">
                                ({listing.reviewCount})
                              </span>
                            )}
                          </span>
                        )}
                        {listing.addressCity && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {listing.addressCity}, {listing.addressState ?? cityConfig.stateCode}
                          </span>
                        )}
                        {listing.phone && (
                          <a
                            href={`tel:${listing.phone.replace(/\D/g, "")}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {listing.phone}
                          </a>
                        )}
                        {todayHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {todayHours}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href={`/${slug}/${listing.slug}`}>
                        View Profile
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Claim CTA below real listings */}
        {hasListings && (
          <div className="mt-6 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Are you a {niche.label.toLowerCase()} provider in {cityConfig.name}?{" "}
              <Link href={`/for-business/claim?niche=${slug}`} className="font-semibold text-primary hover:underline">
                Claim your listing
              </Link>{" "}
              to manage your info, receive leads, and get a Verified badge.
            </p>
          </div>
        )}

        {/* Fallback: show placeholder slots when no real data exists */}
        {!hasListings && !isClaimed && (
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
                        Be the first {niche.label.toLowerCase()} provider in {slot.area}
                      </p>
                      {slot.featured && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                          Featured Territory
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
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={`/for-business/claim?niche=${slug}`}>
                      Claim Listing
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── Business CTA — tiered based on claim status & banked leads ── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {isClaimed ? (
          /* Claimed: only show consumer CTA, no business pitch */
          <Card className="bg-muted/30">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">
                Looking for {content.serviceLabel} in {cityConfig.name}?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mx-auto max-w-lg text-muted-foreground mb-6">
                Our verified {niche.label.toLowerCase()} professional is ready to help.
                Request a free quote and get a response within the hour.
              </p>
              <Button asChild size="lg">
                <Link href={`/${slug}#quote`}>
                  {content.ctaPrimary}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : bankedLeads > 0 ? (
          /* Unclaimed + banked leads: show the full pitch with lead count */
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Tier 1: Pay-per-lead */}
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg">Try one lead first</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {bankedLeads} {niche.label.toLowerCase()} {bankedLeads === 1 ? "lead is" : "leads are"} waiting right now.
                  Buy one with no commitment.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border bg-background p-2 text-center">
                    <p className="font-bold text-base">${LEAD_PRICES.cold}</p>
                    <p className="text-muted-foreground">Cold lead</p>
                  </div>
                  <div className="rounded border bg-background p-2 text-center">
                    <p className="font-bold text-base text-amber-700">${LEAD_PRICES.warm}</p>
                    <p className="text-muted-foreground">Warm lead</p>
                  </div>
                  <div className="rounded border bg-background p-2 text-center">
                    <p className="font-bold text-base text-orange-600">${LEAD_PRICES.hot}</p>
                    <p className="text-muted-foreground">Hot lead</p>
                  </div>
                  <div className="rounded border bg-background p-2 text-center">
                    <p className="font-bold text-base text-red-600">${LEAD_PRICES.burning}</p>
                    <p className="text-muted-foreground">Burning lead</p>
                  </div>
                </div>
                <Button asChild size="sm" className="w-full" variant="outline">
                  <Link href={`/for-business?niche=${slug}&intent=buy-lead`}>
                    Buy a Lead — No Contract
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Tier 2: Claim the territory */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Own the territory</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Claim exclusive access to all {bankedLeads} banked leads plus
                  every future {niche.label.toLowerCase()} lead in {cityConfig.name}.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 grid-cols-3 text-center text-xs mb-2">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-medium">Verified Badge</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="font-medium">Featured Listing</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="font-medium">All Leads</span>
                  </div>
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/for-business/claim?niche=${slug}`}>
                    Claim Territory — from ${niche.monthlyFee}/mo
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                {(highUrgency || medUrgency) && (
                  <p className="text-xs text-center text-muted-foreground">
                    {highUrgency
                      ? `⚡ High demand — ${bankedLeads} leads unclaimed`
                      : `${bankedLeads} leads waiting for a provider`}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Unclaimed, no banked leads: standard claim pitch */
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                Are you a {niche.label.toLowerCase()} professional in {cityConfig.name}?
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
                  <Link href={`/for-business/claim?niche=${slug}`}>
                    Claim Your Listing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Learn More</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Starting at ${niche.monthlyFee}/month &middot; Exclusive territory available
              </p>
            </CardContent>
          </Card>
        )}
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

      <InternalLinks niche={slug} currentPage="directory" />
    </main>
    </>
  )
}
