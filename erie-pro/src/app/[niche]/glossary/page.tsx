import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BookOpen, ArrowRight, Search } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { getGlossaryTerms } from "@/lib/glossary-data"
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
    title: `${niche.label} Glossary — Key Terms Every ${cityConfig.name} Homeowner Should Know`,
    description: `Understand ${content.serviceLabel} terminology. ${content.pluralLabel} glossary with definitions for common industry terms relevant to ${cityConfig.name}, ${cityConfig.stateCode} residents.`,
  }
}

export default async function NicheGlossaryPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  const terms = getGlossaryTerms(slug)

  // Group terms alphabetically
  const grouped = terms.reduce<Record<string, typeof terms>>((acc, term) => {
    const letter = term.term[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(term)
    return acc
  }, {})

  const sortedLetters = Object.keys(grouped).sort()

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
                <BreadcrumbPage>Glossary</BreadcrumbPage>
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
            Industry Glossary
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Glossary for {cityConfig.name} Homeowners
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Understanding {content.serviceLabel} terminology helps you make
            informed decisions and communicate effectively with{" "}
            {content.pluralLabel.toLowerCase()}.
          </p>
        </div>
      </section>

      {/* ── Letter Navigation ─────────────────────────────────── */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-2">
            {sortedLetters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Glossary Terms ────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-10">
          {sortedLetters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              <h2 className="mb-4 text-2xl font-bold text-primary">{letter}</h2>
              <div className="grid gap-4 sm:grid-cols-1">
                {grouped[letter].map((item, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{item.term}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.definition}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Search className="mx-auto mb-4 h-8 w-8 text-primary/60" />
          <h2 className="text-xl font-bold">
            Need a {niche.label.toLowerCase()} professional?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Connect with verified {content.pluralLabel.toLowerCase()} in{" "}
            {cityConfig.name} who can explain every detail and deliver
            quality work.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${slug}/faq`}>View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Schema.org DefinedTermSet ─────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: `${niche.label} Glossary — ${cityConfig.name}, ${cityConfig.stateCode}`,
            description: `Industry glossary for ${content.serviceLabel} in ${cityConfig.name}, ${cityConfig.stateCode}`,
            hasDefinedTerm: terms.map((t) => ({
              "@type": "DefinedTerm",
              name: t.term,
              description: t.definition,
            })),
          }),
        }}
      />
    </main>
  )
}
