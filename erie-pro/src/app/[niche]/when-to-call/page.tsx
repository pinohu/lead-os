import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  AlertTriangle,
  Clock,
  CalendarDays,
  Phone,
  ArrowRight,
  ChevronRight,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug, niches } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { getIntakeTemplate } from "@/lib/intake/templates"
import { CONCIERGE_PHONE_DISPLAY, CONCIERGE_PHONE_TEL } from "@/lib/concierge"
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) return { title: "Not Found" }
  const label = niche.label
  const labelLower = label.toLowerCase()
  return {
    title: `When to Call a ${label} Pro in ${cityConfig.name}, ${cityConfig.stateCode} — Emergency vs. Wait`,
    description: `How to know if your ${labelLower} situation needs a pro right now, can wait a few days, or is something you can DIY. Erie-specific guidance.`,
    keywords: `when to call a ${labelLower}, ${labelLower} emergency, ${labelLower} ${cityConfig.name.toLowerCase()}, ${labelLower} red flags, ${labelLower} same day`,
    alternates: {
      canonical: `https://${cityConfig.domain}/${slug}/when-to-call`,
    },
  }
}

export default async function WhenToCallPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()

  const content = getNicheContent(slug)
  const intake = getIntakeTemplate(slug)
  const label = niche.label
  const labelLower = label.toLowerCase()

  const emergencyExpectation = intake.urgencyExpectations.emergency
  const thisWeekExpectation = intake.urgencyExpectations["this-week"]
  const researchingExpectation = intake.urgencyExpectations.researching

  // Emergency examples — prefer hand-tuned emergencyServices, fall back to generic
  const emergencyExamples: string[] =
    (content?.emergencyServices?.length ?? 0) > 0
      ? content!.emergencyServices.slice(0, 6)
      : [
          `Active ${labelLower} problem causing damage right now`,
          `Safety risk to people or property`,
          `System completely offline`,
          `Visible signs of imminent failure`,
        ]

  // Build FAQPage schema for SEO
  const faqEntries = [
    {
      q: `When should I call a ${labelLower} pro vs. waiting?`,
      a: `Call right away if you see ${emergencyExamples.slice(0, 2).join(" or ").toLowerCase()}. Wait until normal business hours if the issue is annoying but not actively getting worse. For planning or research, you can take a few days to compare quotes.`,
    },
    {
      q: `Are there ${labelLower} services available 24/7 in ${cityConfig.name}?`,
      a: `Yes. Most ${labelLower} emergencies in ${cityConfig.name} can be reached after hours. If the listed providers don't answer immediately, the Erie.pro concierge line at ${CONCIERGE_PHONE_DISPLAY} will route you to whoever's on call.`,
    },
    {
      q: `What does a ${labelLower} emergency call cost?`,
      a: `Expect ${intake.priceHint.low}. After-hours and weekend calls typically add 25–50% on top of the standard service-call fee. Ask up front about the diagnostic fee and whether it's credited toward the repair.`,
    },
    {
      q: `What questions will the ${labelLower} pro ask when I call?`,
      a: `They'll usually ask: where in the home/property the issue is, when it started, what you've already tried, whether there's active damage occurring, and whether the system is partially or fully offline. Have these answers ready to shorten the call.`,
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
                <BreadcrumbPage>When to call</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="border-b bg-gradient-to-br from-amber-50 via-background to-red-50 py-12"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Clock className="mr-1.5 h-3 w-3" aria-hidden="true" />
            Decision guide
          </Badge>
          <h1
            id="hero-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            When to call a {labelLower} pro in {cityConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Three honest answers for the three real situations: it&apos;s an
            emergency, it can wait a few days, or you&apos;re just gathering
            information. Skip the guesswork.
          </p>
        </div>
      </section>

      {/* The three buckets */}
      <section
        aria-labelledby="buckets-heading"
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
      >
        <h2 id="buckets-heading" className="sr-only">
          Three urgency levels
        </h2>

        <div className="space-y-4">
          {/* Emergency */}
          <article className="rounded-lg border-2 border-red-200 bg-red-50/40 p-6">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Right now — call within the hour
                </p>
                <h3 className="text-xl font-bold text-red-900">
                  Emergency situations
                </h3>
                <p className="mt-1 text-sm text-red-900/80">
                  Response goal: {emergencyExpectation.expectedResponseTime}.
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-red-900/90">
              These situations get worse — and more expensive — by the hour.
              Don&apos;t wait for morning.
            </p>
            <ul className="mb-5 grid gap-2 sm:grid-cols-2">
              {emergencyExamples.map((e) => (
                <li key={e} className="flex gap-2 text-sm text-red-900/90">
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                  />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={CONCIERGE_PHONE_TEL}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Concierge: {CONCIERGE_PHONE_DISPLAY}
              </a>
              <Link
                href={`/${slug}#quote`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-900 transition hover:bg-red-50"
              >
                Start a 90-second intake
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* This week */}
          <article className="rounded-lg border border-amber-200 bg-amber-50/40 p-6">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  This week — within 24–48 hours
                </p>
                <h3 className="text-xl font-bold text-amber-900">
                  Non-emergency but needs fixing
                </h3>
                <p className="mt-1 text-sm text-amber-900/80">
                  Response goal: {thisWeekExpectation.expectedResponseTime}.
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-amber-900/90">
              The issue is annoying or progressively worse, but no immediate
              damage. You can wait a business day to get the right pro at the
              right price. Worth getting 2–3 quotes if cost is a factor.
            </p>
            <div className="mt-4">
              <Link
                href={`/${slug}#quote`}
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-900 underline-offset-4 hover:underline"
              >
                Get a quote in 90 seconds
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* Researching */}
          <article className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-6">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Just researching — no rush
                </p>
                <h3 className="text-xl font-bold text-emerald-900">
                  Planning ahead or comparing options
                </h3>
                <p className="mt-1 text-sm text-emerald-900/80">
                  Response goal: {researchingExpectation.expectedResponseTime}.
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-emerald-900/90">
              You&apos;re comparing options or planning a project several weeks
              out. Take the time to vet contractors, get multiple quotes, and
              check references. Read the full pricing guide and FAQ first.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href={`/${slug}/costs`}
                className="inline-flex items-center gap-1 font-medium text-emerald-900 underline-offset-4 hover:underline"
              >
                {label} cost guide
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={`/${slug}/faq`}
                className="inline-flex items-center gap-1 font-medium text-emerald-900 underline-offset-4 hover:underline"
              >
                Full FAQ
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={`/${slug}/checklist`}
                className="inline-flex items-center gap-1 font-medium text-emerald-900 underline-offset-4 hover:underline"
              >
                Hiring checklist
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section
        aria-labelledby="faq-heading"
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
      >
        <h2
          id="faq-heading"
          className="mb-6 text-2xl font-bold tracking-tight"
        >
          Common questions
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

      {/* CTA strip */}
      <section className="border-t bg-muted/40 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Still not sure? Start a 90-second {labelLower} intake.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ll classify the urgency for you and route to a vetted
            local pro.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                Start your intake
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={CONCIERGE_PHONE_TEL}>
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                {CONCIERGE_PHONE_DISPLAY}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="when-to-call" />
    </main>
  )
}
