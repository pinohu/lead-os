import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowRight,
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
import { getNicheContent } from "@/lib/niche-content"
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
import IntakeOrForm from "@/components/intake-or-form"
import { ProviderGrowthOffer } from "@/components/provider-growth-offer"
import { ServiceFunnelSystem } from "@/components/service-funnel-system"
import { inferServiceFamily } from "@/lib/automated-offers"
import NichePersonaQuickJump from "@/components/niche/persona-quick-jump"
import NicheCostSection from "@/components/niche/cost-section"
import NicheServiceScope from "@/components/niche/service-scope"
import NicheVettingChecklist from "@/components/niche/vetting-checklist"
import NicheFAQInline from "@/components/niche/faq-inline"
import NicheTrustSignals from "@/components/niche/trust-signals"
import NicheRelatedServices from "@/components/niche/related-services"
import { buildNichePageSchema } from "@/lib/niche-page-schema"

type Props = { params: Promise<{ niche: string }> }

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

  const description = getLocalMetaDescription(slug)
  const content = getNicheContent(slug)
  const title = content?.metaTitle
    ?? `${withServices(niche.label)} in ${cityConfig.name}, ${cityConfig.stateCode} — Get a Free Quote`

  const allKeywords = [
    ...(content?.primaryKeywords ?? []),
    ...(content?.secondaryKeywords ?? []),
  ].slice(0, 12)

  return {
    title,
    description,
    keywords: allKeywords.length > 0 ? allKeywords.join(", ") : undefined,
    openGraph: {
      type: "website",
      siteName: cityConfig.domain,
      locale: "en_US",
      title,
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

  const content = getNicheContent(slug)
  const localSnippet = getLocalSeoSnippet(slug)
  const localBusinessSchema = getLocalSchemaOrg(slug)
  const neighborhoods = localSeo.neighborhoods
  const pageUrl = `https://${cityConfig.domain}/${slug}`

  const combinedSchema = buildNichePageSchema({
    nicheSlug: slug,
    nicheLabel: niche.label,
    nicheDescription: niche.description,
    pageUrl,
    domain: cityConfig.domain,
    cityName: cityConfig.name,
    cityStateCode: cityConfig.stateCode,
    countyName: localSeo.countyName,
    faqItems: content?.faqItems ?? [],
    localBusinessSchema,
    priceRange: niche.avgProjectValue,
  })

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
  const subtleListings = featuredProviderId
    ? directoryListings.filter((l) => l.claimedByProviderId !== featuredProviderId)
    : directoryListings

  const heroHeadline = content?.heroHeadline
    ?? `${withServices(niche.label)} in ${cityConfig.name}, ${cityConfig.stateCode}`
  const heroSubheadline = content?.heroSubheadline
    ?? `${niche.description}. Serving ${neighborhoods.slice(0, 5).join(", ")} and surrounding areas.`
  const aboutDescription = content?.aboutDescription ?? localSnippet

  return (
    <main>
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium" aria-current="page">{niche.label}</li>
          </ol>
        </div>
      </nav>

      {/* ── Featured Provider (perk-managed) ──────────────────── */}
      <FeaturedProvider niche={niche.slug} city={cityConfig.slug} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative border-b pb-10 pt-12 sm:pt-16 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" aria-hidden="true" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-4 text-5xl sm:text-6xl" aria-hidden="true">{niche.icon}</div>
          <Badge variant="secondary" className="mb-4">
            <MapPin className="mr-1.5 h-3 w-3" aria-hidden="true" />
            {cityConfig.name}, {cityConfig.stateCode}
          </Badge>

          <h1
            id="hero-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {heroHeadline}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {heroSubheadline}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
              Verified providers
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              Quick response
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-primary" aria-hidden="true" />
              Top rated
            </span>
          </div>
        </div>
      </section>

      {/* ── Persona quick-jump ─────────────────────────────────── */}
      <div className="pt-6">
        <NichePersonaQuickJump nicheLabel={niche.label} />
      </div>

      {/* ── Local context (county + neighborhoods) ─────────────── */}
      <section
        aria-labelledby="local-heading"
        className="mx-auto max-w-4xl px-4 py-10 sm:px-6"
      >
        <h2
          id="local-heading"
          className="mb-4 text-xl font-bold tracking-tight"
        >
          {withServices(niche.label)} in {localSeo.countyName}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {aboutDescription}
        </p>
        {neighborhoods.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-semibold">Serving:</span>{" "}
            {neighborhoods.join(" · ")}
          </p>
        )}
      </section>

      {/* ── Subtle provider links (existing listings) ────────── */}
      {subtleListings.length > 0 && (
        <section
          aria-labelledby="other-providers-heading"
          className="mx-auto max-w-4xl px-4 pb-4 sm:px-6"
        >
          <h2
            id="other-providers-heading"
            className="mb-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider"
          >
            Other {niche.label.toLowerCase()} providers in {cityConfig.name}
          </h2>
          <div className="flex flex-wrap gap-x-1 gap-y-0.5">
            {subtleListings.slice(0, 15).map((listing, i) => (
              <span key={listing.id}>
                {i > 0 && <span className="text-muted-foreground/30 mr-1" aria-hidden="true">·</span>}
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
                <span className="text-muted-foreground/30 mr-1" aria-hidden="true">·</span>
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

      {/* ── Empty-state for unclaimed categories ────────────────*/}
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
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
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

      {/* ── Cost transparency (priceRanges from niche-content) ─ */}
      {(content?.pricingRanges?.length ?? 0) > 0 && (
        <NicheCostSection
          nicheSlug={niche.slug}
          nicheLabel={niche.label}
          pricingRanges={content!.pricingRanges}
        />
      )}

      {/* ── Service scope (common, emergency, seasonal) ─────── */}
      <NicheServiceScope
        nicheLabel={niche.label}
        commonServices={content?.commonServices ?? []}
        emergencyServices={content?.emergencyServices ?? []}
        seasonalTips={content?.seasonalTips ?? []}
      />

      {/* ── Quote form (intake widget) ──────────────────────── */}
      <section
        id="quote"
        aria-labelledby="quote-heading"
        className="mx-auto max-w-2xl scroll-mt-28 px-4 pb-16 sm:px-6"
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle id="quote-heading">
              {content?.quoteFormTitle ?? `Get a free ${niche.label.toLowerCase()} quote`}
            </CardTitle>
            <CardDescription>
              {content?.quoteFormDescription ?? `Tell us what you need. We'll connect you with the best ${niche.label.toLowerCase()} provider in ${cityConfig.name}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntakeOrForm
              nicheSlug={niche.slug}
              nicheLabel={niche.label}
              citySlug={cityConfig.slug}
              cityName={cityConfig.name}
            />
          </CardContent>
        </Card>
      </section>

      {/* ── Vetting checklist (research-mode persona) ─────────── */}
      <NicheVettingChecklist
        nicheLabel={niche.label}
        comparisonPoints={content?.comparisonPoints ?? []}
      />

      {/* ── Trust signals (certifications, licensing) ────────── */}
      <NicheTrustSignals
        nicheLabel={niche.label}
        certifications={content?.certifications ?? []}
        trustSignals={content?.trustSignals ?? []}
      />

      {/* ── FAQ (inline — was previously only at subroute) ───── */}
      <NicheFAQInline
        nicheLabel={niche.label}
        faqItems={content?.faqItems ?? []}
      />

      {/* ── Why choose us ─────────────────────────────────────── */}
      <section
        aria-labelledby="why-heading"
        className="bg-muted/50 py-12"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2
            id="why-heading"
            className="mb-8 text-center text-2xl font-bold tracking-tight"
          >
            Why choose {cityConfig.domain} for {niche.label.toLowerCase()}?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "One verified provider per territory",
                desc: `No bidding wars or shared leads. ${niche.label} requests in ${cityConfig.name} route to one vetted local pro.`,
              },
              {
                title: "Free, no-obligation quotes",
                desc: "Get a custom quote at no cost. Compare and decide on your own terms.",
              },
              {
                title: "Fast response times",
                desc: `${cityConfig.name} ${niche.label.toLowerCase()} providers typically respond within hours, not days.`,
              },
              {
                title: `Serving all of ${localSeo.countyName}`,
                desc: `Coverage across ${neighborhoods.slice(0, 4).join(", ")}, and more.`,
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Resource links (deeper subroutes) ─────────────────── */}
      <section
        aria-labelledby="resources-heading"
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
      >
        <h2
          id="resources-heading"
          className="mb-4 text-lg font-bold tracking-tight"
        >
          Go deeper on {niche.label.toLowerCase()}
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: `/${slug}/directory`, label: "Full provider directory" },
            { href: `/${slug}/costs`, label: "Detailed cost guide" },
            { href: `/${slug}/faq`, label: "Complete FAQ" },
            { href: `/${slug}/guides`, label: "Hiring guides" },
            { href: `/${slug}/checklist`, label: "Hiring checklist" },
            { href: `/${slug}/compare`, label: "Compare providers" },
            { href: `/${slug}/reviews`, label: "Reviews" },
            { href: `/${slug}/blog`, label: "Blog & news" },
            { href: `/${slug}/tips`, label: "Tips" },
            { href: `/${slug}/seasonal`, label: "Seasonal guide" },
            { href: `/${slug}/emergency`, label: "Emergency services" },
            { href: `/${slug}/certifications`, label: "Certifications" },
            { href: `/${slug}/glossary`, label: "Glossary" },
            { href: `/${slug}/pricing`, label: "Pricing guide" },
          ].map((link) => (
            <Button key={link.href} asChild variant="outline" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ── Related niches (curated, not the wall of 112) ─────── */}
      <NicheRelatedServices
        nicheSlug={niche.slug}
        nicheLabel={niche.label}
      />

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
            <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" />
          </Link>
        </p>
      </section>

      {/* ── Enhanced Schema.org graph ─────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema),
        }}
      />

      <SeoLaunchEnhancement nicheSlug={niche.slug} nicheLabel={niche.label} pageType="core" />

      <InternalLinks niche={niche.slug} currentPage="" />
    </main>
  )
}
