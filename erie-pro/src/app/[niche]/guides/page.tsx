import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  BookMarked,
  ArrowRight,
  FileText,
  Clock,
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
  }
}

export default async function NicheGuidesPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  return (
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
        <div className="space-y-6">
          {content.guideTopics.map((topic, i) => (
            <Card key={i} className="group transition-shadow hover:shadow-md">
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
          ))}
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
