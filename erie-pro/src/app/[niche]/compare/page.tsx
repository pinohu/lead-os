import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  Shield,
  AlertTriangle,
  X,
  Minus,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { InternalLinks } from "@/components/internal-links"

type ComparisonValue = "yes" | "no" | "varies" | string

interface ComparisonRow {
  factor: string
  budget: ComparisonValue
  established: ComparisonValue
  erieProVerified: ComparisonValue
}

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (value === "yes") return (
    <span className="flex items-center justify-center gap-1 text-green-600 font-medium text-sm">
      <CheckCircle2 className="h-4 w-4" /> Yes
    </span>
  )
  if (value === "no") return (
    <span className="flex items-center justify-center gap-1 text-red-500 font-medium text-sm">
      <X className="h-4 w-4" /> No
    </span>
  )
  if (value === "varies") return (
    <span className="flex items-center justify-center gap-1 text-amber-500 font-medium text-sm">
      <Minus className="h-4 w-4" /> Varies
    </span>
  )
  return <span className="text-center text-sm text-muted-foreground block">{value}</span>
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { factor: "PA State License Verified", budget: "varies", established: "yes", erieProVerified: "yes" },
  { factor: "Liability Insurance on File", budget: "no", established: "yes", erieProVerified: "yes" },
  { factor: "Written Estimate Provided", budget: "varies", established: "yes", erieProVerified: "yes" },
  { factor: "Warranty on Labor", budget: "no", established: "varies", erieProVerified: "yes" },
  { factor: "24/7 Emergency Service", budget: "no", established: "varies", erieProVerified: "yes" },
  { factor: "Verified Customer Reviews", budget: "varies", established: "yes", erieProVerified: "yes" },
  { factor: "Upfront Pricing Transparency", budget: "no", established: "varies", erieProVerified: "yes" },
  { factor: "Background Checked", budget: "no", established: "varies", erieProVerified: "yes" },
  { factor: "Satisfaction Guarantee", budget: "no", established: "varies", erieProVerified: "yes" },
]

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
    title: `How to Compare ${content.pluralLabel} in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `What to look for when choosing a ${niche.label.toLowerCase()} provider in ${cityConfig.name}. Compare licensing, pricing, reviews, and more.`,
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/compare` },
  }
}

export default async function NicheComparePage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  const compareJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://${cityConfig.domain}/${slug}/compare#article`,
    headline: `How to Choose the Right ${niche.label} Provider in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `What to look for, what to ask, and red flags to avoid when comparing ${content.pluralLabel.toLowerCase()} in the Erie area.`,
    url: `https://${cityConfig.domain}/${slug}/compare`,
    publisher: {
      "@type": "Organization",
      "@id": `https://${cityConfig.domain}/#organization`,
      name: cityConfig.domain,
    },
    about: {
      "@type": "Service",
      name: `${niche.label} Services`,
      areaServed: { "@type": "City", name: cityConfig.name },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareJsonLd) }}
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
                <BreadcrumbPage>How to Compare</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Scale className="mr-1.5 h-3 w-3" />
            Comparison Guide
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How to Choose the Right{" "}
            {niche.label === "Legal" ? "Attorney" : niche.label === "Dental" ? "Dentist" : `${niche.label} Provider`} in {cityConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            What to look for, what to ask, and red flags to avoid when
            comparing {content.pluralLabel.toLowerCase()} in the Erie area.
          </p>
        </div>
      </section>

      {/* ── Side-by-Side Comparison Table ────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          Provider Comparison at a Glance
        </h2>
        <p className="mb-8 text-muted-foreground">
          How different types of {content.pluralLabel.toLowerCase()} stack up across the criteria that matter most.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold" scope="col">Criteria</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground" scope="col">Budget Provider</th>
                <th className="px-4 py-3 text-center font-semibold" scope="col">Established Pro</th>
                <th className="px-4 py-3 text-center font-semibold text-primary" scope="col">
                  Erie Pro Verified ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-medium">{row.factor}</td>
                  <td className="px-4 py-3"><ComparisonCell value={row.budget} /></td>
                  <td className="px-4 py-3"><ComparisonCell value={row.established} /></td>
                  <td className="px-4 py-3 bg-primary/5"><ComparisonCell value={row.erieProVerified} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          * "Budget Provider" refers to unverified contractors found through general search or classified ads. "Established Pro" refers to established local businesses without platform verification. All {cityConfig.domain} providers are screened for license, insurance, and reviews.
        </p>
      </section>

      {/* ── Comparison Points ─────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Key Factors to Compare
        </h2>
        <div className="space-y-4">
          {content.comparisonPoints.map((point, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{point}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {point.toLowerCase().includes("license") || point.toLowerCase().includes("certification")
                      ? `Verify credentials before hiring. Pennsylvania has specific requirements for ${content.serviceLabel}. Ask for proof and confirm with the issuing authority.`
                      : point.toLowerCase().includes("insurance")
                      ? "Adequate insurance protects you from liability if something goes wrong during the work. Always ask for a current certificate of insurance."
                      : point.toLowerCase().includes("warranty")
                      ? "A solid warranty shows the provider stands behind their work. Get it in writing and understand what's covered and for how long."
                      : point.toLowerCase().includes("review") || point.toLowerCase().includes("rating")
                      ? "Online reviews provide insight, but look for patterns rather than individual reviews. Pay attention to how the provider responds to negative feedback."
                      : point.toLowerCase().includes("price") || point.toLowerCase().includes("fee") || point.toLowerCase().includes("estimate")
                      ? "Get multiple written estimates and compare them side-by-side. The cheapest option isn't always the best value — consider quality, warranty, and reputation."
                      : point.toLowerCase().includes("emergency") || point.toLowerCase().includes("response")
                      ? `In ${cityConfig.name}'s climate, emergency availability matters. Ask about after-hours response times and additional charges for emergency service.`
                      : `An important factor when evaluating ${content.pluralLabel.toLowerCase()} in ${cityConfig.name}. Ask specific questions and compare answers across providers.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Trust Signals & Certifications ─────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Certifications to look for */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Certifications to Look For
                </CardTitle>
                <CardDescription>
                  Industry credentials that indicate quality and
                  professionalism.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {content.certifications.map((cert, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Red flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Red Flags to Watch For
                </CardTitle>
                <CardDescription>
                  Warning signs that a provider may not be trustworthy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Refuses to provide a written estimate",
                    "Cannot show proof of insurance or license",
                    "Demands large upfront payment before starting work",
                    "Pressures you to sign a contract immediately",
                    "No physical address or only a P.O. box",
                    "No online reviews or refuses to provide references",
                    "Quote is dramatically lower than other estimates",
                  ].map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Trust signals from niche ──────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          What {cityConfig.domain} Verifies
        </h2>
        <p className="mb-8 text-muted-foreground">
          Every {niche.label.toLowerCase()} provider on our platform meets
          these standards:
        </p>
        <div className="flex flex-wrap gap-3">
          {content.trustSignals.map((signal, i) => (
            <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-600" />
              {signal}
            </Badge>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Ready to Compare {content.pluralLabel}?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get matched with verified {content.pluralLabel.toLowerCase()} in{" "}
            {cityConfig.name} and compare your options.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/${slug}#quote`}>
              {content.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="compare" />
    </main>
    </>
  )
}
