import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  BookMarked,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
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
import { InternalLinks } from "@/components/internal-links"

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
    title: `${niche.label} Guides — Comprehensive Resources for ${cityConfig.name}`,
    description: `In-depth ${niche.label.toLowerCase()} guides for ${cityConfig.name}, ${cityConfig.stateCode}. Costs, hiring tips, and everything you need to know.`,
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/guides` },
  }
}

/** Derive 4–5 concrete steps for a guide topic based on its title keywords */
function deriveGuideSteps(topic: string, serviceLabel: string, city: string): string[] {
  const t = topic.toLowerCase()
  if (t.includes("hire") || t.includes("hiring") || t.includes("choosing") || t.includes("find")) {
    return [
      `Define your project scope and set a realistic budget for ${serviceLabel} in ${city}.`,
      `Verify PA state license and confirm active liability insurance and workers' comp.`,
      `Request itemized written estimates from at least three local providers.`,
      `Check online reviews, BBB rating, and ask for local references.`,
      `Review the contract terms, warranty, and payment schedule before signing.`,
    ]
  }
  if (t.includes("cost") || t.includes("price") || t.includes("buyer") || t.includes("sizing")) {
    return [
      `Understand what factors drive pricing for ${serviceLabel} in the ${city} market.`,
      `Get multiple itemized quotes and compare scope of work — not just total price.`,
      `Ask about material grades, warranty periods, and what is not included in the quote.`,
      `Factor in permit fees, access requirements, and potential unforeseen conditions.`,
      `Evaluate long-term cost of ownership including maintenance and energy efficiency.`,
    ]
  }
  if (t.includes("emergency") || t.includes("urgent") || t.includes("repair")) {
    return [
      `Identify the immediate hazard and take safety precautions (shut off water/power/gas if needed).`,
      `Document the damage with photos before any cleanup or temporary fixes.`,
      `Call a licensed emergency ${serviceLabel} provider — verify they serve ${city} 24/7.`,
      `Get a written scope of emergency work and confirm after-hours rate before work begins.`,
      `Schedule follow-up inspection and permanent repair within 48 hours of emergency service.`,
    ]
  }
  if (t.includes("permit") || t.includes("code") || t.includes("regulation") || t.includes("requirement")) {
    return [
      `Determine which projects require permits under Erie County and Pennsylvania codes.`,
      `Submit permit application with project drawings and specifications to the local building department.`,
      `Schedule required inspections at each milestone — rough-in, pressure test, and final.`,
      `Ensure your licensed contractor pulls permits in their name to protect your warranty.`,
      `Obtain a copy of the signed final inspection for your property records.`,
    ]
  }
  if (t.includes("maintenance") || t.includes("seasonal") || t.includes("prevent") || t.includes("winter") || t.includes("annual")) {
    return [
      `Create a seasonal maintenance calendar for ${serviceLabel} specific to ${city}'s climate.`,
      `Inspect all accessible components before the harshest season (winter or spring thaw).`,
      `Clean, test, and replace consumable parts per manufacturer schedule.`,
      `Document findings and repairs to track equipment age and performance trends.`,
      `Schedule professional tune-up annually to catch issues before they become emergencies.`,
    ]
  }
  // Generic fallback
  return [
    `Research your options for ${serviceLabel} and understand what the project involves.`,
    `Gather at least three quotes from licensed ${city} providers and compare scope of work.`,
    `Verify credentials, insurance, and local references before selecting a contractor.`,
    `Get the full agreement in writing with a clear timeline, payment schedule, and warranty.`,
    `Inspect completed work before final payment and keep all documentation for your records.`,
  ]
}

export default async function NicheGuidesPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  // Build HowTo JSON-LD for the first guide (highest SEO value)
  const primaryGuide = content.guideTopics[0]
  const primarySteps = deriveGuideSteps(primaryGuide, content.serviceLabel, cityConfig.name)
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: primaryGuide,
    description: `Step-by-step guide to ${content.serviceLabel} in ${cityConfig.name}, ${cityConfig.stateCode}.`,
    image: `https://${cityConfig.domain}/og-${slug}.jpg`,
    totalTime: "PT30M",
    step: primarySteps.map((stepText, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text: stepText,
    })),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

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
                <BreadcrumbPage>Guides</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <BookMarked className="mr-1.5 h-3 w-3" />
            Comprehensive Guides
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Guides for {cityConfig.name} Residents
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            In-depth resources to help you make informed decisions about{" "}
            {content.serviceLabel} in {cityConfig.name},{" "}
            {cityConfig.stateCode}.
          </p>
        </div>
      </section>

      {/* ── Guide Cards ───────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-8">
          {content.guideTopics.map((topic, i) => {
            const steps = deriveGuideSteps(topic, content.serviceLabel, cityConfig.name)
            return (
              <Card key={i} className="group overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex flex-col sm:flex-row">
                  {/* Icon area */}
                  <div className="flex items-center justify-center bg-primary/5 px-8 py-6 sm:min-w-[120px]">
                    <FileText className="h-10 w-10 text-primary/60" />
                  </div>

                  <div className="flex-1">
                    <CardHeader>
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          Guide
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {10 + (i * 3)} min read
                        </span>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary">
                        {topic}
                      </CardTitle>
                      <CardDescription>
                        {topic.toLowerCase().includes("complete guide")
                          ? `Everything you need to know about ${content.serviceLabel} in ${cityConfig.name} — from finding the right provider to understanding costs and local regulations.`
                          : topic.toLowerCase().includes("buyer")
                          ? `A detailed comparison of options, pricing, and features to help ${cityConfig.name} homeowners make the best choice.`
                          : `A comprehensive resource covering key considerations, local factors, and expert recommendations for ${cityConfig.name} residents.`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Step list */}
                      <ol className="mb-4 space-y-2">
                        {steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      <Button asChild variant="ghost" size="sm" className="group/btn -ml-2 text-primary">
                        <Link href={`/${slug}#quote`}>
                          Get Expert Help
                          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Related content links ─────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-6 text-xl font-bold">
            More {niche.label} Resources
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${slug}/blog`}>Blog Articles</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${slug}/faq`}>FAQ</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${slug}/pricing`}>Pricing Guide</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${slug}/compare`}>How to Compare</Link>
            </Button>
            {content.emergencyServices.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/${slug}/emergency`}>Emergency Services</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Ready to find {content.serviceLabel}?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get matched with a verified {niche.label.toLowerCase()} provider in{" "}
            {cityConfig.name}.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/${slug}#quote`}>
              {content.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="guides" />
    </main>
  )
}
