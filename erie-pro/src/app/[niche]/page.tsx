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
  ERIE_LOCAL_SEO,
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
import { FeaturedProvider } from "@/components/featured-provider"
import LeadForm from "@/components/lead-form"

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
    },
    alternates: { canonical: `https://${cityConfig.domain}/${slug}` },
  }
}

export default async function NichePage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()

  // ── Local SEO data ──────────────────────────────────────────────
  const localSnippet = getLocalSeoSnippet(slug)
  const localSchema = getLocalSchemaOrg(slug)
  const neighborhoods = ERIE_LOCAL_SEO.neighborhoods

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
      <section className="border-b bg-muted/30 pb-12 pt-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
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
          {withServices(niche.label)} in {ERIE_LOCAL_SEO.countyName}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {localSnippet}
        </p>
      </section>

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

      {/* ── Quote form ──────────────────────────────────────── */}
      <section id="quote" className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
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
                title: `Serving all of ${ERIE_LOCAL_SEO.countyName}`,
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
      <section className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">
          Are you a {niche.label.toLowerCase()} provider?{" "}
          <Link
            href="/for-business"
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

      <InternalLinks niche={niche.slug} currentPage="" />
    </main>
  )
}
