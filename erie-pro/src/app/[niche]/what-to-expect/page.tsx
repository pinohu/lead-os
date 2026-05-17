import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ClipboardList,
  Handshake,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ArrowRight,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug, niches } from "@/lib/niches"
import {
  getWhatToExpectContent,
  type WhatToExpectStep,
} from "@/lib/niche/educational-content"
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
    title: `What to Expect When Hiring a ${label} Pro in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `Step-by-step: what happens before, during, and after a ${labelLower} appointment in ${cityConfig.name}. Pricing norms, red flags from the pro side, and how to know you're getting fair treatment.`,
    keywords: `what to expect ${labelLower}, first ${labelLower} visit, ${labelLower} appointment, ${labelLower} ${cityConfig.name.toLowerCase()}, ${labelLower} quote, ${labelLower} pricing`,
    alternates: {
      canonical: `https://${cityConfig.domain}/${slug}/what-to-expect`,
    },
  }
}

export default async function WhatToExpectPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()

  const label = niche.label
  const labelLower = label.toLowerCase()
  const data = getWhatToExpectContent(slug)

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
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
                <BreadcrumbPage>What to Expect</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-sky-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Badge variant="outline" className="mb-3">
            Hiring guide · {cityConfig.name}, {cityConfig.stateCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What to Expect From a {label} Visit
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{data.intro}</p>
        </div>
      </section>

      {/* Four-step timeline */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
          <StepCard step={data.beforeAppointment} icon={ClipboardList} number={1} />
          <StepCard step={data.atArrival} icon={Handshake} number={2} />
          <StepCard step={data.duringWork} icon={Wrench} number={3} />
          <StepCard step={data.afterCompletion} icon={CheckCircle2} number={4} />
        </div>
      </section>

      {/* Red flags from the pro side */}
      <section className="border-y bg-amber-50 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border border-amber-200 bg-background p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-700" />
              <h2 className="text-xl font-bold sm:text-2xl">
                Red flags from the pro side
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Behaviors that should make you pause, ask questions, or walk away.
            </p>
            <ul className="space-y-2">
              {data.proRedFlags.map((flag) => (
                <li key={flag} className="flex gap-2 text-sm">
                  <span className="text-amber-700">⚠</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing norms */}
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <DollarSign className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold">Pricing norms in {cityConfig.name}</h2>
                <p className="mt-2 text-muted-foreground">{data.pricingNorms}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-y bg-muted/40 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border bg-background p-6 text-center shadow-sm sm:p-8">
            <h2 className="text-xl font-bold sm:text-2xl">
              Ready to find a {labelLower} pro?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get a free quote from a vetted {cityConfig.name} contractor. No multi-contractor lead blast.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href={`/${slug}`}>
                Get a free quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {data.faq.map((item) => (
              <Card key={item.q}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {item.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="what-to-expect" />
    </main>
  )
}

// ── Step subcomponent ─────────────────────────────────────────────────

function StepCard({
  step,
  icon: Icon,
  number,
}: {
  step: WhatToExpectStep
  icon: typeof ClipboardList
  number: number
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
            {number}
          </div>
          <Icon className="h-5 w-5 text-sky-700" />
          <CardTitle className="text-xl">{step.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{step.description}</p>
        <ul className="space-y-2 text-sm">
          {step.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
