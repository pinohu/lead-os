import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  DollarSign,
  ArrowRight,
  Info,
  TrendingUp,
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    title: `${niche.label} Costs in ${cityConfig.name}, ${cityConfig.stateCode} — Pricing Guide`,
    description: `How much does ${content.serviceLabel} cost in ${cityConfig.name}? See average prices for common services and get a free quote.`,
  }
}

export default async function NichePricingPage({ params }: Props) {
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
                <BreadcrumbPage>Pricing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <DollarSign className="mr-1.5 h-3 w-3" />
            Pricing Guide
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Much Does {niche.label} Cost in{" "}
            {cityConfig.name}, {cityConfig.stateCode}?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Average prices for common {content.serviceLabel} in the Erie
            area. Updated for {new Date().getFullYear()}.
          </p>
        </div>
      </section>

      {/* ── Pricing Table ─────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {cityConfig.name} {niche.label} Pricing
            </CardTitle>
            <CardDescription>
              Average costs based on {cityConfig.name}-area providers.
              Actual prices depend on job scope, complexity, and materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Prices are estimates for {cityConfig.name},{" "}
                {cityConfig.stateCode} as of {new Date().getFullYear()}.
                Get a personalized quote for your specific needs.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Service</TableHead>
                  <TableHead className="text-right">
                    Typical Price Range
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.pricingRanges.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {item.service}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {item.range}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ── Pricing Factors ───────────────────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            What Affects {niche.label} Pricing in{" "}
            {cityConfig.name}?
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Erie&apos;s Climate and Conditions
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lake effect weather, harsh winters, and heavy snowfall
                    create unique demands on {content.serviceLabel}. Materials
                    and techniques must withstand freeze-thaw cycles, which can
                    affect pricing compared to milder regions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Home Age and Condition
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Many Erie homes were built before 1960. Older homes often
                    require additional work to bring systems up to current
                    Pennsylvania codes, which can add to project costs.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Seasonal Demand
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prices and availability fluctuate with the seasons.
                    Emergency services during winter storms command premium
                    rates, while scheduling work in the off-season can offer
                    better pricing and availability.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Licensing and Permits
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pennsylvania licensing requirements and Erie municipal
                    permits protect consumers but add modest costs. Always
                    verify your provider is properly licensed — unlicensed
                    work may seem cheaper but carries significant risks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Get an Exact Price for Your Project
          </h2>
          <p className="mt-2 text-muted-foreground">
            These are averages. Get a free, personalized quote from a
            verified {niche.label.toLowerCase()} provider in{" "}
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

      <InternalLinks niche={slug} currentPage="pricing" />
    </main>
  )
}
