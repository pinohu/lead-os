import Link from "next/link"
import {
  Wrench,
  Zap,
  Thermometer,
  Home,
  Leaf,
  Heart,
  Scale,
  Sparkles,
  Car,
  Bug,
  Paintbrush,
  Building,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  MapPin,
  Globe,
  Phone,
  Star,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { CITY_TEMPLATES } from "@/lib/city-factory"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServiceSearch } from "@/components/service-search"
import { HomepageLeadForm } from "@/components/homepage-lead-form"

const nicheIcons: Record<string, React.ReactNode> = {
  plumbing: <Wrench className="h-6 w-6" aria-hidden="true" />,
  hvac: <Thermometer className="h-6 w-6" aria-hidden="true" />,
  electrical: <Zap className="h-6 w-6" aria-hidden="true" />,
  roofing: <Home className="h-6 w-6" aria-hidden="true" />,
  landscaping: <Leaf className="h-6 w-6" aria-hidden="true" />,
  dental: <Heart className="h-6 w-6" aria-hidden="true" />,
  legal: <Scale className="h-6 w-6" aria-hidden="true" />,
  cleaning: <Sparkles className="h-6 w-6" aria-hidden="true" />,
  "auto-repair": <Car className="h-6 w-6" aria-hidden="true" />,
  "pest-control": <Bug className="h-6 w-6" aria-hidden="true" />,
  painting: <Paintbrush className="h-6 w-6" aria-hidden="true" />,
  "real-estate": <Building className="h-6 w-6" aria-hidden="true" />,
}

/* Emergency / most-searched services shown as quick-pick buttons */
const QUICK_PICKS = [
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "locksmith",
  "towing",
  "restoration",
  "auto-repair",
] as const

export default function HomePage() {
  const quickPickNiches = QUICK_PICKS
    .map((slug) => niches.find((n) => n.slug === slug))
    .filter(Boolean) as typeof niches

  /* Serializable niche data for client components */
  const searchNiches = niches.map((n) => ({
    slug: n.slug,
    label: n.label,
    icon: n.icon,
    description: n.description,
    searchTerms: n.searchTerms,
  }))

  return (
    <main>
      {/* ── Hero with Search ────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-24 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6">
            <Shield className="mr-1.5 h-3 w-3" />
            Verified providers in {cityConfig.name}, {cityConfig.stateCode}
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Find the best local
            <br />
            <span className="text-primary">
              services in {cityConfig.name}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {niches.length} service categories across{" "}
            {cityConfig.serviceArea.length} communities. Get free quotes
            from verified local professionals — no obligation, no hassle.
          </p>

          {/* ── Search bar ──────────────────────────────────── */}
          <div className="mt-10">
            <ServiceSearch niches={searchNiches} cityName={cityConfig.name} />
          </div>

          {/* ── Quick pick buttons ──────────────────────────── */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Popular right now
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {quickPickNiches.map((n) => (
                <Button
                  key={n.slug}
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <Link href={`/${n.slug}`}>
                    {n.icon} {n.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Verified providers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Free quotes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No obligation
            </span>
          </div>
        </div>
      </section>

      {/* ── Trust bar ───────────────────────────────────────── */}
      <section className="border-b bg-muted/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 py-8 sm:px-6">
          {[
            {
              icon: <Building className="h-5 w-5 text-primary" />,
              value: String(niches.length),
              label: "Service categories",
            },
            {
              icon: <Shield className="h-5 w-5 text-primary" />,
              value: "Verified",
              label: "Local providers",
            },
            {
              icon: <Clock className="h-5 w-5 text-primary" />,
              value: "< 2 min",
              label: "To get a quote",
            },
            {
              icon: <Star className="h-5 w-5 text-primary" />,
              value: "$0",
              label: "Always free for you",
            },
          ].map(({ icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              {icon}
              <div>
                <div className="text-base font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Instant Quote Form ──────────────────────────────── */}
      <section id="get-quote" className="bg-primary/[0.03] py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            {/* Left: value proposition */}
            <div className="lg:pt-4">
              <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
                Ready to get started?
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Request your free quote
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Fill out this quick form and a verified {cityConfig.name} provider
                will reach out — usually within hours, not days.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: <Shield className="h-5 w-5 text-primary" />, title: "100% Free", desc: "No cost to you, ever. Providers pay to be on our platform." },
                  { icon: <Clock className="h-5 w-5 text-primary" />, title: "Fast Response", desc: "Most providers respond within 2-4 hours during business hours." },
                  { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, title: "Verified Pros Only", desc: "Every provider is vetted and verified before joining." },
                  { icon: <Phone className="h-5 w-5 text-primary" />, title: "No Spam, No Runaround", desc: "Your info goes to one verified provider — not sold to a list." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0">{icon}</div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: the form */}
            <Card className="shadow-xl border-primary/10">
              <CardHeader>
                <CardTitle className="text-xl">Get a Free Quote</CardTitle>
                <CardDescription>
                  Takes less than 2 minutes. No obligation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HomepageLeadForm
                  niches={searchNiches.map((n) => ({ slug: n.slug, label: n.label, icon: n.icon }))}
                  citySlug={cityConfig.slug}
                  cityName={cityConfig.name}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Service grid ────────────────────────────────────── */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            All {niches.length} service categories
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Browse all services
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Click any category to learn more and request a free quote from a
            top-rated {cityConfig.name} provider.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {niches.map((niche) => (
            <Link key={niche.slug} href={`/${niche.slug}`} className="group rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {nicheIcons[niche.slug] ?? (
                        <Wrench className="h-6 w-6" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary">
                    {niche.label}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {niche.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      {niche.avgProjectValue}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Get a Quote
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="bg-muted/50 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
              Simple process
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get a free quote in 3 easy steps
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              No phone calls, no waiting. Tell us what you need and we
              handle the rest.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tell us what you need",
                desc: `Choose a service category and describe your project. It takes less than 2 minutes.`,
              },
              {
                step: "2",
                title: "We match you with the best pro",
                desc: `We connect you with a verified, top-rated ${cityConfig.name} provider who specializes in exactly what you need.`,
              },
              {
                step: "3",
                title: "Get your free quote",
                desc: `The provider reaches out with a custom quote. No obligation — compare and decide on your terms.`,
              },
            ].map(({ step, title, desc }) => (
              <Card key={step} className="relative text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {step}
                  </div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ──────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            By the numbers
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {cityConfig.name} trusts {cityConfig.domain}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Real results from a platform built for homeowners and local
            professionals.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              metric: "500+",
              label: "Homeowners connected with verified providers",
              icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
            },
            {
              metric: String(niches.length),
              label: "Service categories covered across " + cityConfig.name,
              icon: <Building className="h-8 w-8 text-primary" />,
            },
            {
              metric: "< 2 hrs",
              label: "Average provider response time during business hours",
              icon: <Clock className="h-8 w-8 text-primary" />,
            },
          ].map(({ metric, label, icon }) => (
            <Card key={label} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2">{icon}</div>
                <CardTitle className="text-3xl font-extrabold text-primary">
                  {metric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── City Expansion ────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Globe className="h-4 w-4" />
              Expanding across the Great Lakes Region
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One city at a time
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              We started in {cityConfig.name}. Next, we bring the same
              verified provider network to cities across Pennsylvania, New
              York, and Ohio.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CITY_TEMPLATES.map((city) => (
              <Card
                key={city.slug}
                className={`relative overflow-hidden ${city.status !== "active" ? "opacity-80" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className={`h-5 w-5 ${city.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
                      <CardTitle className="text-lg">{city.name}</CardTitle>
                    </div>
                    {city.status === "active" ? (
                      <Badge variant="default">Live</Badge>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
                        {city.status === "coming-soon" ? "Coming 2025" : "Planned"}
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    {city.stateCode} &middot; Pop. {city.population.toLocaleString()} &middot;{" "}
                    {city.serviceArea.length} communities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {city.serviceArea.slice(0, 5).join(", ")}
                    {city.serviceArea.length > 5 && ` +${city.serviceArea.length - 5} more`}
                  </p>
                  {city.status === "active" ? (
                    <div className="mt-3">
                      <Badge variant="default" className="bg-green-600 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Active &mdash; {niches.length} niches
                      </Badge>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground italic">
                      {city.status === "coming-soon"
                        ? "Provider sign-ups opening soon"
                        : "On the expansion roadmap"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Want to be the exclusive provider in a new city?{" "}
              <Link href="/for-business" className="font-semibold text-primary hover:underline">
                Claim your territory early <ArrowRight className="inline h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="border-t bg-primary">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Get a free quote in under 2 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/80">
            Tell us what you need and we&apos;ll connect you with the best
            local professional in {cityConfig.name}. Free, fast, no
            obligation.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-base"
            >
              <a href="#get-quote">
                Get Your Free Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Schema.org ──────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: `${cityConfig.name} Local Services`,
                url: `https://${cityConfig.domain}`,
                description: `Find trusted local service providers in ${cityConfig.name}, ${cityConfig.state}. ${niches.length} categories.`,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `https://${cityConfig.domain}/services?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "LocalBusiness",
                name: cityConfig.domain,
                url: `https://${cityConfig.domain}`,
                areaServed: {
                  "@type": "City",
                  name: cityConfig.name,
                  containedInPlace: {
                    "@type": "State",
                    name: cityConfig.state,
                  },
                },
              },
            ],
          }),
        }}
      />
    </main>
  )
}
