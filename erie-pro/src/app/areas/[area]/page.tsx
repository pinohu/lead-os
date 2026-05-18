// erie-pro/src/app/areas/[area]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { MapPin, ArrowRight } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { getServiceAreaBySlug, getServiceAreaSlugs } from "@/lib/area-registry"
import { getMatrixNicheSlugs } from "@/lib/seo-matrix"
import { shouldNoindexAreaHubPage } from "@/lib/seo-publish-gate"
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

type Props = { params: Promise<{ area: string }> }

export function generateStaticParams() {
  return getServiceAreaSlugs().map((area) => ({ area }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: areaSlug } = await params
  const area = getServiceAreaBySlug(areaSlug)
  if (!area) return { title: "Not Found" }

  const title = `Home Services in ${area.label}, ${cityConfig.stateCode}`
  const description = `Find vetted local home service pros serving ${area.label}, ${cityConfig.stateCode}. Plumbing, HVAC, cleaning, and more — one matched pro, free for homeowners.`

  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: `https://${cityConfig.domain}/areas/${area.slug}` },
  }

  if (shouldNoindexAreaHubPage(area.slug)) {
    return { ...metadata, robots: { index: false, follow: true } }
  }

  return metadata
}

export default async function AreaHubPage({ params }: Props) {
  const { area: areaSlug } = await params
  const area = getServiceAreaBySlug(areaSlug)
  if (!area) notFound()

  const matrixNiches = getMatrixNicheSlugs()
    .map((slug) => niches.find((niche) => niche.slug === slug))
    .filter((niche): niche is (typeof niches)[number] => Boolean(niche))

  return (
    <main>
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
                  <Link href="/areas">Areas</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{area.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <MapPin className="mr-1.5 h-3 w-3" />
            {area.label}, {cityConfig.stateCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Home services in {area.label}, {cityConfig.stateCode}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {area.description}
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/get-matched">
                Get matched in {area.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-semibold">Services in {area.label}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {matrixNiches.map((niche) => (
            <Card key={niche.slug}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {niche.icon} {niche.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="default">
                  <Link href={`/${niche.slug}/areas/${area.slug}`}>
                    {niche.label} in {area.label}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${niche.slug}`}>Overview</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
