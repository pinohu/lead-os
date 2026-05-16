import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  Wrench,
  HardHat,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Phone,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug, niches } from "@/lib/niches"
import { getDiyVsProContent } from "@/lib/niche/educational-content"
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
    title: `${label} DIY vs Hiring a Pro in ${cityConfig.name}, ${cityConfig.stateCode} — Where to Draw the Line`,
    description: `Which ${labelLower} jobs are safe to DIY in ${cityConfig.name}, which need experience, and which legally require a licensed pro. Save money on the easy stuff and avoid disasters on the hard stuff.`,
    keywords: `${labelLower} DIY, when to call a ${labelLower}, ${labelLower} ${cityConfig.name.toLowerCase()}, DIY ${labelLower} repair, ${labelLower} permit, hire a ${labelLower}`,
    alternates: {
      canonical: `https://${cityConfig.domain}/${slug}/diy-vs-pro`,
    },
  }
}

export default async function DiyVsProPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()

  const label = niche.label
  const labelLower = label.toLowerCase()
  const data = getDiyVsProContent(slug)

  const toneStyles: Record<string, { icon: typeof Wrench; bg: string; border: string; badge: string }> = {
    diy: { icon: Wrench, bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-900" },
    "skilled-diy": { icon: HardHat, bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-900" },
    "pro-only": { icon: ShieldAlert, bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-900" },
  }

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
                <BreadcrumbPage>DIY vs. Pro</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-sky-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Badge variant="outline" className="mb-3">
            Decision guide · {cityConfig.name}, {cityConfig.stateCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {label} DIY vs. Hiring a Pro
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{data.intro}</p>
        </div>
      </section>

      {/* Risk callout */}
      <section className="border-b bg-amber-50 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
            <p className="text-sm text-amber-900">
              <strong>Before you start:</strong> {data.riskCallout}
            </p>
          </div>
        </div>
      </section>

      {/* Three tiers */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
          {data.tiers.map((tier) => {
            const style = toneStyles[tier.toneSlug]
            const Icon = style.icon
            return (
              <Card
                key={tier.heading}
                className={`${style.border} ${style.bg}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${style.badge}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{tier.heading}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                  <ul className="space-y-1.5 text-sm">
                    {tier.examples.map((ex) => (
                      <li key={ex} className="flex gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y bg-muted/40 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold sm:text-2xl">
              Decided you need a pro?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get a free quote from a vetted {labelLower} contractor in {cityConfig.name}. Most respond within hours.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/${slug}`}>
                  Get a free quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${"8142000328"}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Or call concierge
                </a>
              </Button>
            </div>
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

      <InternalLinks niche={slug} currentPage="diy-vs-pro" />
    </main>
  )
}
