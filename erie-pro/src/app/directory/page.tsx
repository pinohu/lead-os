import Link from "next/link"
import type { Metadata } from "next"
import {
  Building2,
  ArrowRight,
  MapPin,
  Star,
  Users,
  Search,
  ShieldCheck,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  title: `Business Directory — ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
  description: `Browse all ${niches.length} service categories and hundreds of verified local businesses in ${cityConfig.name}, ${cityConfig.stateCode}. Find providers for plumbing, HVAC, electrical, roofing, dental, legal, and more.`,
  alternates: { canonical: `https://${cityConfig.domain}/directory` },
}

export const dynamic = "force-dynamic"

export default async function DirectoryIndexPage() {
  // Fetch listing counts and claimed territory counts per niche in parallel
  let listingCounts: Record<string, number> = {}
  let claimedNiches: Set<string> = new Set()
  let totalListings = 0

  try {
    const [countsByNiche, territories] = await Promise.all([
      prisma.directoryListing.groupBy({
        by: ["niche"],
        where: { isActive: true },
        _count: true,
      }),
      prisma.territory.findMany({
        where: { deactivatedAt: null },
        select: { niche: true },
      }),
    ])

    for (const row of countsByNiche) {
      listingCounts[row.niche] = row._count
      totalListings += row._count
    }
    for (const t of territories) {
      claimedNiches.add(t.niche)
    }
  } catch {
    // DB unavailable during build
  }

  const totalCategories = niches.length
  const categoriesWithListings = Object.keys(listingCounts).length
  const claimedCount = claimedNiches.size

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `https://${cityConfig.domain}/directory#directory`,
    name: `Business Directory — ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `Browse all ${totalCategories} service categories in ${cityConfig.name}.`,
    numberOfItems: totalCategories,
    itemListElement: niches.map((niche, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: niche.label,
      url: `https://${cityConfig.domain}/${niche.slug}/directory`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <main>
        {/* Breadcrumb */}
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
                  <BreadcrumbPage>Directory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Hero */}
        <section className="border-b bg-muted/30 pb-12 pt-10">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <Badge variant="secondary" className="mb-4">
              <Search className="mr-1.5 h-3 w-3" />
              Business Directory
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Find Local Professionals in {cityConfig.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Browse {totalCategories} service categories and{" "}
              {totalListings > 0
                ? `${totalListings.toLocaleString()}+ verified businesses`
                : "verified businesses"}{" "}
              across {cityConfig.name}, {cityConfig.stateCode}. Every provider
              is vetted for licensing, insurance, and reputation.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b">
          <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x sm:grid-cols-4">
            <StatCell
              value={totalCategories}
              label="Service categories"
            />
            <StatCell
              value={totalListings > 0 ? `${totalListings.toLocaleString()}+` : "—"}
              label="Local businesses"
            />
            <StatCell
              value={claimedCount}
              label="Verified providers"
            />
            <StatCell
              value={cityConfig.serviceArea.length}
              label="Communities served"
            />
          </div>
        </section>

        {/* Category Grid */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-bold">All Categories</h2>
            <Badge variant="secondary">
              {totalCategories} categories
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {niches.map((niche) => {
              const count = listingCounts[niche.slug] ?? 0
              const isClaimed = claimedNiches.has(niche.slug)

              return (
                <Card
                  key={niche.slug}
                  className="group hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{niche.icon}</span>
                      {isClaimed && (
                        <Badge variant="secondary" className="text-xs">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <Link
                      href={`/${niche.slug}/directory`}
                      className="block mb-1"
                    >
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {niche.label}
                      </h3>
                    </Link>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {niche.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      {count > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {count} {count === 1 ? "listing" : "listings"}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {cityConfig.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href={`/${niche.slug}/directory`}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        Directory
                      </Link>
                      <Link
                        href={`/${niche.slug}/reviews`}
                        className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        Reviews
                      </Link>
                      <Link
                        href={`/${niche.slug}/pricing`}
                        className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        Pricing
                      </Link>
                      <Link
                        href={`/${niche.slug}/faq`}
                        className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        FAQ
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Business CTA */}
        <section className="border-t bg-muted/50 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <Building2 className="mx-auto mb-4 h-8 w-8 text-primary/60" />
            <h2 className="text-2xl font-bold">
              Are you a local business owner?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Claim your exclusive territory on {cityConfig.domain} and become
              the go-to provider in your service area. Get verified, receive
              leads, and grow your business.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/for-business/claim">
                  Claim Your Territory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/for-business">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Consumer CTA */}
        <section className="border-t py-12">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-xl font-bold">
              Not sure which service you need?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tell us about your project and we will match you with the right
              professional in {cityConfig.name}.
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href="/contact">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function StatCell({
  value,
  label,
}: {
  value: string | number
  label: string
}) {
  return (
    <div className="px-4 py-6 text-center sm:px-6">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
