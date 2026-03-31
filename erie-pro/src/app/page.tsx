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
  Star,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const nicheIcons: Record<string, React.ReactNode> = {
  plumbing: <Wrench className="h-6 w-6" />,
  hvac: <Thermometer className="h-6 w-6" />,
  electrical: <Zap className="h-6 w-6" />,
  roofing: <Home className="h-6 w-6" />,
  landscaping: <Leaf className="h-6 w-6" />,
  dental: <Heart className="h-6 w-6" />,
  legal: <Scale className="h-6 w-6" />,
  cleaning: <Sparkles className="h-6 w-6" />,
  "auto-repair": <Car className="h-6 w-6" />,
  "pest-control": <Bug className="h-6 w-6" />,
  painting: <Paintbrush className="h-6 w-6" />,
  "real-estate": <Building className="h-6 w-6" />,
}

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-24 text-center sm:px-6">
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

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <a href="#services">
                Browse Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="#how-it-works">How It Works</a>
            </Button>
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

      {/* ── Service grid ────────────────────────────────────── */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            Local services
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What do you need help with?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Click any category to request a free quote from a top-rated{" "}
            {cityConfig.name} provider.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {niches.map((niche) => (
            <Link key={niche.slug} href={`/${niche.slug}`} className="group">
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {nicheIcons[niche.slug] ?? (
                        <Wrench className="h-6 w-6" />
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

      {/* ── Testimonials placeholder ────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            Trusted by homeowners
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {cityConfig.name} residents love our service
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Join hundreds of homeowners who found the right professional
            through {cityConfig.domain}.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Sarah M.",
              service: "Plumbing",
              quote:
                "Found a great plumber within hours. The quote was fair and the work was excellent.",
            },
            {
              name: "James T.",
              service: "HVAC",
              quote:
                "Our AC died in July. Got matched with a top-rated HVAC company the same day.",
            },
            {
              name: "Maria L.",
              service: "Roofing",
              quote:
                "After the storm, we needed a roofer fast. Erie.pro connected us with the best in town.",
            },
          ].map(({ name, service, quote }) => (
            <Card key={name}>
              <CardHeader>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-warning text-warning"
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {service} &middot; {cityConfig.name},{" "}
                    {cityConfig.stateCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
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
              <a href="#services">
                Browse Services
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
