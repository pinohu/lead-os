import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  Siren,
  Phone,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import {
  getNicheContent,
  getAllNicheSlugs,
  hasEmergencyServices,
} from "@/lib/niche-content"
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

type Props = { params: Promise<{ niche: string }> }

export function generateStaticParams() {
  return getAllNicheSlugs()
    .filter((slug) => hasEmergencyServices(slug))
    .map((slug) => ({ niche: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content || content.emergencyServices.length === 0)
    return { title: "Not Found" }
  return {
    title: `Emergency ${niche.label} in ${cityConfig.name}, ${cityConfig.stateCode} — 24/7 Service`,
    description: `Need emergency ${content.serviceLabel} in ${cityConfig.name}? Get fast response from verified providers. Available 24/7 for urgent situations.`,
    alternates: { canonical: `https://erie.pro/${slug}/emergency` },
  }
}

export default async function NicheEmergencyPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content || content.emergencyServices.length === 0) notFound()

  const emergencyJsonLd = {
    "@context": "https://schema.org",
    "@type": "EmergencyService",
    "@id": `https://erie.pro/${slug}/emergency#service`,
    name: `Emergency ${niche.label} in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `24/7 emergency ${content.serviceLabel} in ${cityConfig.name}. Fast response from verified, licensed providers.`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `https://erie.pro/${slug}/#business`,
      name: cityConfig.domain,
      telephone: "+18142000328",
      address: {
        "@type": "PostalAddress",
        addressLocality: cityConfig.name,
        addressRegion: cityConfig.stateCode,
        addressCountry: "US",
      },
    },
    areaServed: { "@type": "City", name: cityConfig.name },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `https://erie.pro/${slug}#quote`,
      availableLanguage: "English",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    serviceType: content.emergencyServices,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(emergencyJsonLd) }}
      />
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
                <BreadcrumbPage>Emergency</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-red-50 pb-12 pt-10 dark:bg-red-950/20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="destructive" className="mb-4">
            <Siren className="mr-1.5 h-3 w-3" />
            Emergency Service
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Emergency {niche.label} Service in{" "}
            {cityConfig.name}, {cityConfig.stateCode}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Need urgent {content.serviceLabel}? Get connected with an
            emergency provider in {cityConfig.name} now.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-red-700 dark:text-red-300">
            For emergencies, call a provider directly from our directory
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="destructive">
              <Link href={`/${slug}#quote`}>
                <Phone className="mr-2 h-4 w-4" />
                Get Emergency Help Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/${slug}`}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Browse {niche.label} Directory
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Emergency Services List ───────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Emergency {niche.label} Services We Cover
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.emergencyServices.map((service, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 pt-6">
                <Siren className="h-5 w-5 flex-shrink-0 text-red-500" />
                <span className="font-medium">{service}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── What to do in an emergency ────────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            What to Do in a {niche.label} Emergency
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900/50" aria-label="Step 1: Ensure safety first">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">
                    Ensure safety first
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If there is immediate danger to people (gas leak,
                    electrical hazard, flooding, fire risk), evacuate the
                    area and call 911. Your safety is more important than
                    property damage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600 dark:bg-amber-900/50" aria-label="Step 2: Mitigate further damage">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">
                    Mitigate further damage
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If it&apos;s safe to do so, take steps to prevent
                    additional damage. Turn off the main water supply for
                    leaks, flip the breaker for electrical issues, or
                    contain flooding with towels and buckets.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/50" aria-label="Step 3: Contact an emergency provider">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">
                    Contact an emergency provider
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use our emergency request form to get connected with a
                    verified {niche.label.toLowerCase()} provider in{" "}
                    {cityConfig.name} who handles emergency calls. Many
                    providers offer 24/7 emergency service.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-900/50" aria-label="Step 4: Document the damage">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">
                    Document the damage
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Take photos and videos of the damage for insurance
                    purposes. Note the date, time, and circumstances.
                    This documentation will be valuable for insurance
                    claims and repair estimates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Emergency expectations ────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          What to Expect from Emergency Service
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Fast Response</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Emergency providers in {cityConfig.name} typically respond
                within 1 to 4 hours, depending on the time and nature of
                the emergency.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Higher Rates Apply</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Emergency and after-hours service typically costs 1.5 to
                2 times the standard rate. This is normal industry pricing
                for urgent service.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Verified Providers</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All emergency providers on {cityConfig.domain} are
                verified, licensed, and insured — even for after-hours
                calls.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Direct Communication</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We connect you directly with the provider so you can
                describe the emergency and get an estimated arrival time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-red-50 py-12 dark:bg-red-950/20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Need Emergency {niche.label} Service Now?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get connected with a verified emergency provider in{" "}
            {cityConfig.name} right away.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="destructive">
              <Link href={`/${slug}#quote`}>
                <Phone className="mr-2 h-4 w-4" />
                Get Emergency Help Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:+18142000328">
                <Phone className="mr-2 h-4 w-4" />
                Call (814) 200-0328
              </a>
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Or call your local emergency service provider directly.
            </p>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
