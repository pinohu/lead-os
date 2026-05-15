import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Shield,
  Star,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches, getNicheBySlug } from "@/lib/niches"
import {
  getLocalSeoSnippet,
  getLocalSchemaOrg,
  getLocalMetaDescription,
  localSeo,
} from "@/lib/local-seo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { InternalLinks } from "@/components/internal-links"
import { SeoLaunchEnhancement } from "@/components/seo-launch-enhancement"
import { FeaturedProvider } from "@/components/featured-provider"
import { getDirectoryListingsByNiche } from "@/lib/directory-store"
import { getFeaturedProviderId } from "@/lib/perk-manager"
import LeadForm from "@/components/lead-form"
import { ProviderGrowthOffer } from "@/components/provider-growth-offer"
import { ServiceFunnelSystem } from "@/components/service-funnel-system"
import { inferServiceFamily } from "@/lib/automated-offers"

type Props = { params: Promise<{ niche: string }> }

/** Append "Services" only when the label doesn't already end with "Service(s)". */
function withServices(label: string): string {
  return /\bServices?\s*$/i.test(label) ? label : `${label} Services`;
}

export function generateStaticParams() {
  return niches.map((n) => ({ niche: n.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) return { title: "Not Found" }

  // Use the enriched local SEO meta description
  const description = getLocalMetaDescription(slug)

  return {
    title: `${withServices(niche.label)} in ${cityConfig.name}, ${cityConfig.stateCode} — Get a Free Quote`,
    description,
    openGraph: {
      type: "website",
      siteName: cityConfig.domain,
      locale: "en_US",
      title: `${withServices(niche.label)} in ${cityConfig.name}, ${cityConfig.stateCode} — Get a Free Quote`,
      description,
      url: `https://${cityConfig.domain}/${slug}`,
      images: [
        {
          url: `https://${cityConfig.domain}/api/og/${slug}`,
          width: 1200,
          height: 630,
          alt: `${withServices(niche.label)} in ${cityConfig.name}, ${cityConfig.stateCode}`,
        },
      ],
    },
    alternates: { canonical: `https://${cityConfig.domain}/${slug}` },
  }
}

export default async function NichePage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()
  const serviceFamily = inferServiceFamily(niche.slug)

  // ── Local SEO data ──────────────────────────────────────────────
  const localSnippet = getLocalSeoSnippet(slug)
  const localSchema = getLocalSchemaOrg(slug)
  const neighborhoods = localSeo.neighborhoods

  // ── Directory listings for subtle links ────────────────────────
  let directoryListings: Awaited<ReturnType<typeof getDirectoryListingsByNiche>> = []
  let featuredProviderId: string | null = null
  try {
    [directoryListings, featuredProviderId] = await Promise.all([
      getDirectoryListingsByNiche(slug, { limit: 20 }),
      getFeaturedProviderId(slug, cityConfig.slug),
    ])
  } catch {
    // DB unavailable during static build
  }
  // Exclude the territory owner from the subtle links (they're featured above)
  const subtleListings = featuredProviderId
    ? directoryListings.filter((l) => l.claimedByProviderId !== featuredProviderId)
    : directoryListings

  return (
    <main>
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">Home</Link></li>
            <li>/</li>
            <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{niche.label}</li>
          </ol>
        </div>
      </nav>

      {/* ── Featured Provider (perk-managed) ──────────────────── */}
      <FeaturedProvider niche={niche.slug} city={cityConfig.slug} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative border-b pb-12 pt-16 overflow-hidden">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 text-6xl">{niche.icon}</div>
          <Badge variant="secondary" className="mb-4">
            <MapPin className="mr-1.5 h-3 w-3" />
            {cityConfig.name}, {cityConfig.stateCode}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {niche.label} in {cityConfig.name},{" "}
            {cityConfig.stateCode}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {niche.description}. Serving{" "}
            {neighborhoods.slice(0, 5).join(", ")} and
            surrounding areas.
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <a href="#quote">
                Get a Free Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              Verified providers
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              Quick response
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-primary" />
              Top rated
            </span>
          </div>
        </div>
      </section>

      {/* ── Local SEO Context Section ─────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="mb-4 text-xl font-bold tracking-tight">
          {withServices(niche.label)} in {localSeo.countyName}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {localSnippet}
        </p>
      </section>

      {/* ── Subtle provider links ────────────────────────────── */}
      {subtleListings.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
            Other {niche.label.toLowerCase()} providers in {cityConfig.name}
          </p>
          <div className="flex flex-wrap gap-x-1 gap-y-0.5">
            {subtleListings.slice(0, 15).map((listing, i) => (
              <span key={listing.id}>
                {i > 0 && <span className="text-muted-foreground/30 mr-1">&middot;</span>}
                <Link
                  href={`/${slug}/${listing.slug}`}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {listing.businessName}
                </Link>
              </span>
            ))}
            {subtleListings.length > 15 && (
              <span>
                <span className="text-muted-foreground/30 mr-1">&middot;</span>
                <Link
                  href={`/${slug}/directory`}
                  className="text-xs text-muted-foreground/50 hover:text-primary transition-colors"
                >
                  +{subtleListings.length - 15} more
                </Link>
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Empty-state for unclaimed categories ────────────────
           Renders only when this niche has no claimed territory AND
           no directory listings to show. Pre-launch audit flagged the
           previous behavior — pages with zero data looked broken /
           half-loaded. This frames the empty state as a provider
           acquisition opportunity instead. */}
      {!featuredProviderId && subtleListings.length === 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Open territory
                </p>
                <h3 className="mb-2 text-lg font-bold sm:text-xl">
                  No {niche.label.toLowerCase()} provider has claimed {cityConfig.name} yet
                </h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Erie.pro routes every {niche.label.toLowerCase()} request to one exclusive
                  provider per {cityConfig.name} territory — no bidding, no shared leads.
                  The first qualified provider to claim this category keeps it.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-[180px]">
                <Link
                  href={`/for-business/claim?niche=${slug}`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Claim this category
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
                <Link
                  href="/get-matched"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  I need this service
                </Link>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Looking for a {niche.label.toLowerCase()} pro right now? Call{" "}
              <a href="tel:+18142000328" className="font-medium text-primary hover:underline">
                (814) 200-0328
              </a>{" "}
              and we&apos;ll route you to a vetted Erie pro outside the platform.
            </p>
          </div>
        </section>
      )}

      {/* ── Service info cards ──────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Service Area</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {neighborhoods.join(", ")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What&apos;s Included</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {niche.description}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Typical Project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {niche.avgProjectValue}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Explore niche resources ──────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          Explore {niche.label} Resources
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: `/${slug}/directory`, label: "Provider Directory" },
            { href: `/${slug}/reviews`, label: "Reviews" },
            { href: `/${slug}/pricing`, label: "Pricing Guide" },
            { href: `/${slug}/costs`, label: "Cost Breakdown" },
            { href: `/${slug}/faq`, label: "FAQ" },
            { href: `/${slug}/guides`, label: "Hiring Guides" },
            { href: `/${slug}/blog`, label: "Blog" },
            { href: `/${slug}/compare`, label: "Compare Providers" },
            { href: `/${slug}/tips`, label: "Tips" },
            { href: `/${slug}/emergency`, label: "Emergency Services" },
            { href: `/${slug}/seasonal`, label: "Seasonal Guide" },
            { href: `/${slug}/checklist`, label: "Hiring Checklist" },
            { href: `/${slug}/certifications`, label: "Certifications" },
            { href: `/${slug}/glossary`, label: "Glossary" },
          ].map((link) => (
            <Button key={link.href} asChild variant="outline" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ── Quote form ──────────────────────────────────────── */}
      <section id="quote" className="mx-auto max-w-2xl scroll-mt-28 px-4 pb-16 sm:px-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              Get a free {niche.label.toLowerCase()} quote
            </CardTitle>
            <CardDescription>
              Tell us what you need. We&apos;ll connect you with the best{" "}
              {niche.label.toLowerCase()} provider in {cityConfig.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadForm
              nicheSlug={niche.slug}
              nicheLabel={niche.label}
              citySlug={cityConfig.slug}
              cityName={cityConfig.name}
            />
          </CardContent>
        </Card>
      </section>

      {/* ── Why choose us ───────────────────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
            Why choose {cityConfig.domain} for {niche.label.toLowerCase()}?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Verified professionals",
                desc: `Every ${niche.label.toLowerCase()} provider on our platform is verified and vetted.`,
              },
              {
                title: "Free, no-obligation quotes",
                desc: "Get a custom quote at no cost. Compare and decide on your own terms.",
              },
              {
                title: "Fast response times",
                desc: `${cityConfig.name} providers typically respond within hours, not days.`,
              },
              {
                title: `Serving all of ${localSeo.countyName}`,
                desc: `Coverage across ${neighborhoods.slice(0, 4).join(", ")}, and more.`,
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Other services ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-6 text-xl font-bold">
          Other services in {cityConfig.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {niches
            .filter((n) => n.slug !== niche.slug)
            .map((n) => (
              <Button key={n.slug} asChild variant="outline" size="sm">
                <Link href={`/${n.slug}`}>
                  {n.icon} {n.label}
                </Link>
              </Button>
            ))}
        </div>
      </section>

      {/* ── Provider CTA ────────────────────────────────────── */}
      <Separator />
      <ProviderGrowthOffer
        serviceSlug={niche.slug}
        serviceLabel={niche.label}
        serviceFamily={serviceFamily}
      />
      <ServiceFunnelSystem serviceSlug={niche.slug} serviceLabel={niche.label} />
      <section className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">
          Are you a {niche.label.toLowerCase()} provider?{" "}
          <Link
            href={`/for-business/claim?niche=${slug}`}
            className="font-medium text-primary hover:underline"
          >
            Claim this territory
            <ArrowRight className="ml-1 inline h-3 w-3" />
          </Link>
        </p>
      </section>

      {/* ── Enhanced Schema.org with local SEO data ────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localSchema),
        }}
      />

      <SeoLaunchEnhancement nicheSlug={niche.slug} nicheLabel={niche.label} pageType="core" />

      <InternalLinks niche={niche.slug} currentPage="" />
    </main>
  )
}
