import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug, niches } from "@/lib/niches"
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
    title: `${niche.label} Blog — Expert Tips for ${cityConfig.name} Homeowners`,
    description: `Read expert ${niche.label.toLowerCase()} tips, guides, and advice for ${cityConfig.name}, ${cityConfig.stateCode} homeowners. Seasonal tips, cost guides, and more.`,
  }
}

export default async function NicheBlogPage({ params }: Props) {
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
                <BreadcrumbPage>Blog</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="mr-1.5 h-3 w-3" />
            {niche.label} Blog
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Blog — Expert Tips for{" "}
            {cityConfig.name} Homeowners
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Practical advice, cost guides, and seasonal tips about{" "}
            {content.serviceLabel} in {cityConfig.name},{" "}
            {cityConfig.stateCode}.
          </p>
        </div>
      </section>

      {/* ── Blog Topics Grid ──────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {content.blogTopics.map((topic, i) => (
            <Card key={i} className="group transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Article</span>
                  <span className="text-muted-foreground/50">|</span>
                  <Clock className="h-3 w-3" />
                  <span>{4 + (i % 5)} min read</span>
                </div>
                <CardTitle className="text-lg leading-snug group-hover:text-primary">
                  {topic}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Expert insights on {topic.toLowerCase().includes("erie") ? "" : `${content.serviceLabel} in ${cityConfig.name} — `}
                  {topic.toLowerCase().includes("cost") || topic.toLowerCase().includes("price")
                    ? "pricing, budgeting tips, and what to expect."
                    : topic.toLowerCase().includes("winter") || topic.toLowerCase().includes("season")
                    ? "seasonal considerations and local climate factors."
                    : "practical tips and professional recommendations."}
                </p>
                <Button variant="ghost" size="sm" className="group/btn -ml-2 text-primary">
                  Read Article
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Need {content.serviceLabel} in {cityConfig.name}?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Skip the research. Get matched with a verified{" "}
            {niche.label.toLowerCase()} provider today.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/${slug}#quote`}>
              {content.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Schema.org ────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${niche.label} Blog — ${cityConfig.domain}`,
            description: `Expert ${niche.label.toLowerCase()} tips and guides for ${cityConfig.name}, ${cityConfig.stateCode} homeowners.`,
            url: `https://${cityConfig.domain}/${slug}/blog`,
            publisher: {
              "@type": "Organization",
              name: cityConfig.domain,
              url: `https://${cityConfig.domain}`,
            },
          }),
        }}
      />

      <InternalLinks niche={slug} currentPage="blog" />
    </main>
  )
}
