import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  Eye,
  AlertCircle,
  Siren,
  ArrowRight,
  Phone,
  TrendingUp,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug, niches } from "@/lib/niches"
import { getRedFlagsContent, type RedFlag } from "@/lib/niche/educational-content"
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
    title: `${label} Warning Signs in ${cityConfig.name}, ${cityConfig.stateCode} — When to Worry`,
    description: `${label} red flags ranked from "monitor" to "call now". Catching the early warning signs of a ${labelLower} problem in ${cityConfig.name} prevents thousands in damage.`,
    keywords: `${labelLower} warning signs, ${labelLower} red flags, when is ${labelLower} serious, ${labelLower} ${cityConfig.name.toLowerCase()}, ${labelLower} emergency signs`,
    alternates: {
      canonical: `https://${cityConfig.domain}/${slug}/red-flags`,
    },
  }
}

export default async function RedFlagsPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  if (!niche) notFound()

  const label = niche.label
  const labelLower = label.toLowerCase()
  const data = getRedFlagsContent(slug)

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
                <BreadcrumbPage>Warning Signs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-rose-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Badge variant="outline" className="mb-3">
            Warning signs · {cityConfig.name}, {cityConfig.stateCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {label} Warning Signs to Know
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{data.intro}</p>
        </div>
      </section>

      {/* Three severity tiers */}
      <Tier
        title="Early — keep an eye on"
        description="These don't need action today but signal the system is aging or stressed. Note the date you first noticed; if it persists or worsens, schedule a visit."
        icon={Eye}
        flags={data.earlyWarnings}
        bg="bg-slate-50"
        border="border-slate-200"
        accent="text-slate-700"
      />

      <Tier
        title="Mid — schedule a visit"
        description="Symptoms that mean something is actually wrong and will get worse. Schedule within days to a couple of weeks."
        icon={AlertCircle}
        flags={data.midSeverity}
        bg="bg-amber-50"
        border="border-amber-200"
        accent="text-amber-800"
      />

      <Tier
        title="Urgent — call now"
        description={`If you see any of these, stop reading and pick up the phone. ${cityConfig.name} concierge line: ${CONCIERGE_PHONE_DISPLAY}.`}
        icon={Siren}
        flags={data.urgent}
        bg="bg-rose-50"
        border="border-rose-200"
        accent="text-rose-700"
      />

      {/* Cost of delay */}
      <section className="border-y bg-muted/40 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 shrink-0 text-rose-600" />
              <div>
                <h2 className="text-xl font-bold">The cost of waiting</h2>
                <p className="mt-2 text-muted-foreground">{data.costOfDelay}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/${slug}`}>
                  Get a free quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={CONCIERGE_PHONE_TEL}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call concierge
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

      <InternalLinks niche={slug} currentPage="red-flags" />
    </main>
  )
}

// ── Tier subcomponent ─────────────────────────────────────────────────

function Tier({
  title,
  description,
  icon: Icon,
  flags,
  bg,
  border,
  accent,
}: {
  title: string
  description: string
  icon: typeof Eye
  flags: RedFlag[]
  bg: string
  border: string
  accent: string
}) {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className={`rounded-xl border ${border} ${bg} p-6 sm:p-8`}>
          <div className="mb-4 flex items-center gap-3">
            <Icon className={`h-6 w-6 ${accent}`} />
            <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">{description}</p>
          <ul className="space-y-3">
            {flags.map((flag) => (
              <li
                key={flag.sign}
                className="rounded-lg border bg-background/60 p-4"
              >
                <div className="font-medium">{flag.sign}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {flag.meaning}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
