import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ScrollText,
  ShieldCheck,
  Building,
  AlertCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug, niches } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { localSeo } from "@/lib/local-seo"
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
import { InternalLinks } from "@/components/internal-links"

type Props = { params: Promise<{ niche: string }> }

export function generateStaticParams() {
  return niches.map((n) => ({ niche: n.slug }))
}

// ── Per-niche permit hints ────────────────────────────────────────
// Substantial home-improvement work in Pennsylvania almost always needs
// permits + licensed contractors. Use slug-pattern matching to surface
// niche-relevant guidance, with safe defaults for niches that don't have
// permit implications (e.g. pet grooming, photography).

interface PermitGuide {
  alwaysRequired: boolean
  /** Permit / inspector or "Generally none" */
  who: string
  /** When in the process to pull the permit */
  when: string
  /** What's needed */
  what: string[]
  /** Approximate cost / timing range */
  cost: string
}

function deriveGuide(slug: string, label: string): PermitGuide {
  // Niches that almost always require permits + licensed work
  if (/plumb|sewer|water-heater|drain|septic/.test(slug)) {
    return {
      alwaysRequired: true,
      who: "Erie city / county plumbing inspector",
      when: "Before work begins; never let a contractor work without one",
      what: [
        "Plumbing permit application (contractor or homeowner pulls)",
        "PA-licensed plumber (Act 27)",
        "Final inspection after work completes",
      ],
      cost: "$60–$250 typical permit fee + $50–$150 inspection",
    }
  }
  if (/electric|panel|generator|ev-charger|solar/.test(slug)) {
    return {
      alwaysRequired: true,
      who: "Erie electrical inspector (third-party agency in PA)",
      when: "Before any panel, service, or hardwired work begins",
      what: [
        "Electrical permit (third-party inspection agency in PA)",
        "PA-licensed electrician (Act 1) — verify license number",
        "Rough-in inspection (before drywall) + final inspection",
      ],
      cost: "$80–$300 permit + $75–$200 per inspection visit",
    }
  }
  if (/roof|siding|windows|doors|gutter/.test(slug)) {
    return {
      alwaysRequired: true,
      who: "Erie / Millcreek / Harborcreek building department (varies by municipality)",
      when: "Before tear-off or installation begins",
      what: [
        "Building permit for re-roofs and replacements",
        "Property owner or licensed contractor pulls",
        "May trigger code upgrades for older structures",
      ],
      cost: "$100–$400 permit fee + final inspection",
    }
  }
  if (/hvac|ac-repair|furnace|duct/.test(slug)) {
    return {
      alwaysRequired: true,
      who: "Erie building department (mechanical permit)",
      when: "Before any system installation or replacement",
      what: [
        "Mechanical permit (replacement systems usually do require)",
        "Combustion appliance testing for gas/oil",
        "Refrigerant work requires EPA Section 608 certification",
      ],
      cost: "$80–$250 typical permit fee",
    }
  }
  if (/general-contractor|home-remodel|kitchen-remodel|bathroom-remodel|addition|basement-finishing|home-builders/.test(slug)) {
    return {
      alwaysRequired: true,
      who: "Local building department + plumbing/electrical/mechanical sub-permits",
      when: "Before any structural, plumbing, or electrical work begins",
      what: [
        "PA Home Improvement Contractor Registration (HICPA) for contracts >$500",
        "Building permit + zoning review for structural changes",
        "Sub-permits for plumbing, electrical, mechanical work",
        "Pre-drywall and final inspections",
      ],
      cost: "$200–$1,500+ depending on project value",
    }
  }
  if (/foundation|concrete|demolition|driveway-paving|fence|deck|patio|retaining-wall/.test(slug)) {
    return {
      alwaysRequired: true,
      who: "Erie building department + zoning for setback verification",
      when: "Before any pour, dig, or demolition begins",
      what: [
        "Building permit (most structural exterior work)",
        "Zoning review for fence height, setback, easement",
        "PA One Call (811) before any digging — mandatory",
      ],
      cost: "$75–$400 permit + zoning review",
    }
  }
  if (/restoration|fire-damage|water-damage|mold-remediation|storm-damage/.test(slug)) {
    return {
      alwaysRequired: false,
      who: "Building department (for structural repair component); IICRC certification (industry, not gov)",
      when: "Permits triggered by structural rebuild after mitigation",
      what: [
        "Mitigation work usually doesn't require permits (drying, removal)",
        "Reconstruction does — pulls follow general remodeling rules",
        "Insurance often coordinates pulling permits for covered work",
        "IICRC-certified pros are the industry standard for restoration",
      ],
      cost: "Varies — most permits pulled by reconstruction sub",
    }
  }
  if (/tree|landscaping|irrigation|snow|pest|carpet|cleaning|junk|moving/.test(slug)) {
    return {
      alwaysRequired: false,
      who: "Generally none required",
      when: "Most service work doesn't need a permit",
      what: [
        "PA Home Improvement Contractor Registration if contract >$500",
        "PA One Call (811) before any digging for irrigation",
        "Tree removal in some Erie historic districts may need review",
      ],
      cost: "Permits rare; HICPA registration is the main credential",
    }
  }
  if (/auto|towing|locksmith|appliance/.test(slug)) {
    return {
      alwaysRequired: false,
      who: "PA state licensing (Bureau of Professional Occupational Affairs) where applicable",
      when: "Most service work doesn't require permits",
      what: [
        "PA business license",
        "Industry-specific certifications (ASE for auto, etc.)",
      ],
      cost: "N/A for typical service calls",
    }
  }
  if (/legal|dental|veterinary|chiropractic|accounting|optometry|dermatology|physical-therapy|mental-health/.test(slug)) {
    return {
      alwaysRequired: false,
      who: "PA professional licensing board for the profession",
      when: "Practitioner credential, not a permit you pull",
      what: [
        "State license through PA Department of State",
        "Active malpractice / professional liability insurance",
        "Continuing education requirements",
      ],
      cost: "N/A — credentialing, not permitting",
    }
  }
  // Default: generic Erie-area guidance
  return {
    alwaysRequired: false,
    who: "Erie building department for any structural / electrical / plumbing component",
    when: "Before work that opens walls, ground, or service connections",
    what: [
      `PA Home Improvement Contractor Registration if contract >$500`,
      "Building permit for structural / mechanical / electrical components",
      "Verify license and insurance before signing any contract",
    ],
    cost: "$75–$300 typical permit for structural work",
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) return { title: "Not Found" }
  const label = niche.label
  return {
    title: `${label} Permits in ${cityConfig.name}, ${cityConfig.stateCode} — Codes & Licensing Guide`,
    description: `Erie County ${label.toLowerCase()} permit requirements, PA contractor licensing, building codes, and what to verify before hiring. Up-to-date 2026 guide.`,
    keywords: `${label.toLowerCase()} permits ${cityConfig.name}, ${label.toLowerCase()} licensing Erie PA, Erie building permits, PA HICPA, ${label.toLowerCase()} code requirements`,
    alternates: {
      canonical: `https://${cityConfig.domain}/${slug}/permits`,
    },
  }
}

export default async function PermitsPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()

  const content = getNicheContent(slug)
  const label = niche.label
  const labelLower = label.toLowerCase()
  const guide = deriveGuide(slug, label)

  // FAQPage schema
  const faqEntries = [
    {
      q: `Do I need a permit for ${labelLower} work in ${cityConfig.name}?`,
      a: guide.alwaysRequired
        ? `Yes — ${labelLower} work in ${cityConfig.name} almost always requires a permit. The permit is typically pulled by ${guide.who.toLowerCase()}. ${guide.when}.`
        : `Most routine ${labelLower} work in ${cityConfig.name} doesn't require a permit. Structural, electrical, plumbing, or mechanical components can trigger a permit requirement. ${guide.when}.`,
    },
    {
      q: `Who pulls the ${labelLower} permit — me or the contractor?`,
      a: `Either can. In Pennsylvania, contractors usually pull permits as part of the contract scope. A homeowner can pull their own permit, but that places liability for code compliance on the homeowner. Always confirm in writing who's pulling it.`,
    },
    {
      q: `How much does an ${labelLower} permit cost in ${cityConfig.name}?`,
      a: `${guide.cost}. Permit fees in Erie County are typically a small percentage of the work value, plus a flat inspection fee per visit. Multi-trade projects (e.g. a kitchen remodel with plumbing, electrical, and structural components) need separate sub-permits.`,
    },
    {
      q: `What happens if I do ${labelLower} work without a permit?`,
      a: `Unpermitted work in ${cityConfig.name} can stop a home sale, trigger fines, void homeowners insurance for damage related to the work, and force you to redo the work to current code. If something happens later, lack of permit also voids most contractor warranties.`,
    },
    {
      q: `How do I verify a ${labelLower} contractor's PA license?`,
      a: `Pennsylvania licenses can be checked at the PA Department of State Bureau of Professional Occupational Affairs. HICPA registration numbers (for general home improvement contractors over $500) are on the contractor's website and required by law on any signed estimate.`,
    },
  ]

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb */}
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
                  <Link href={`/${slug}`}>{label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Permits</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="border-b bg-gradient-to-br from-blue-50 via-background to-cyan-50 py-12"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <ScrollText className="mr-1.5 h-3 w-3" aria-hidden="true" />
            Permits & licensing
          </Badge>
          <h1
            id="hero-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {label} permits in {cityConfig.name}, {cityConfig.stateCode}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Erie County permit requirements, Pennsylvania contractor
            licensing, and what to verify before hiring. Save the page or
            send it to your contractor — they should already know all of this.
          </p>
        </div>
      </section>

      {/* Required at a glance */}
      <section
        aria-labelledby="overview-heading"
        className="mx-auto max-w-4xl px-4 py-10 sm:px-6"
      >
        <h2 id="overview-heading" className="sr-only">
          Permit requirements overview
        </h2>

        <div
          className={`rounded-lg border-2 p-6 ${
            guide.alwaysRequired
              ? "border-red-200 bg-red-50/40"
              : "border-emerald-200 bg-emerald-50/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                guide.alwaysRequired ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {guide.alwaysRequired ? (
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  guide.alwaysRequired ? "text-red-700" : "text-emerald-700"
                }`}
              >
                {guide.alwaysRequired ? "Permit required" : "Permit typically not required"}
              </p>
              <h3
                className={`text-xl font-bold ${
                  guide.alwaysRequired ? "text-red-900" : "text-emerald-900"
                }`}
              >
                {guide.who}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  guide.alwaysRequired ? "text-red-900/80" : "text-emerald-900/80"
                }`}
              >
                {guide.when}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The four W's */}
      <section
        aria-labelledby="details-heading"
        className="mx-auto max-w-4xl px-4 py-8 sm:px-6"
      >
        <h2
          id="details-heading"
          className="mb-6 text-2xl font-bold tracking-tight"
        >
          What you need
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                Required documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {guide.what.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                Approximate cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{guide.cost}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Erie County permit fees are typically a small percentage of
                project value, plus inspection visits. Multi-trade projects
                require separate sub-permits.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PA-wide context — pull from local-seo */}
      {localSeo.licensingRequirements.length > 0 && (
        <section
          aria-labelledby="pa-licensing-heading"
          className="mx-auto max-w-4xl px-4 py-8 sm:px-6"
        >
          <h2
            id="pa-licensing-heading"
            className="mb-4 text-xl font-bold tracking-tight"
          >
            Pennsylvania contractor licensing context
          </h2>
          <ul className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            {localSeo.licensingRequirements.map((l) => (
              <li key={l} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications (from niche-content if present) */}
      {(content?.certifications?.length ?? 0) > 0 && (
        <section
          aria-labelledby="cert-heading"
          className="mx-auto max-w-4xl px-4 py-8 sm:px-6"
        >
          <h2
            id="cert-heading"
            className="mb-4 text-xl font-bold tracking-tight"
          >
            {label} credentials to verify
          </h2>
          <ul className="grid gap-2 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground sm:grid-cols-2">
            {content!.certifications.map((c) => (
              <li key={c} className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section
        aria-labelledby="faq-heading"
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
      >
        <h2
          id="faq-heading"
          className="mb-6 text-2xl font-bold tracking-tight"
        >
          Permit FAQ
        </h2>
        <div className="space-y-4">
          {faqEntries.map((f) => (
            <Card key={f.q}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{f.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Related pages */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          Related {labelLower} resources
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${slug}`}>{label} overview</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${slug}/costs`}>Costs &amp; pricing</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${slug}/when-to-call`}>When to call</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${slug}/checklist`}>Hiring checklist</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${slug}/certifications`}>Certifications</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${slug}/faq`}>Full FAQ</Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/40 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Hiring a {labelLower} pro who pulls permits correctly
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Erie.pro&apos;s verified providers carry the right credentials and
            handle permit pulls. Get matched in 90 seconds.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                Start your intake
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${slug}/checklist`}>
                Vetting checklist
                <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="permits" />
    </main>
  )
}
