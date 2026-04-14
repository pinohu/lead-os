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
  Phone,
  Snowflake,
  Hammer,
  BadgeCheck,
  Lock,
  Quote,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { getAllRequesterTiers, type RequesterTier } from "@/lib/requester-tiers"
import { RequesterUpgradeButton } from "@/components/requester-upgrade-button"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  "snow-removal": <Snowflake className="h-6 w-6" aria-hidden="true" />,
  handyman: <Hammer className="h-6 w-6" aria-hidden="true" />,
}

export default function HomePage() {
  /* Launch-Kit pilot categories: HVAC+Plumbing · Handyman+Cleaning · Snow+Lawn */
  const pilotSlugs = cityConfig.pilotCategories ?? [
    "plumbing", "hvac", "handyman", "cleaning", "snow-removal", "landscaping",
  ]
  const pilotNiches = pilotSlugs
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
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.10),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-24 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6">
            <Shield className="mr-1.5 h-3 w-3" />
            Vetted {cityConfig.name}, {cityConfig.stateCode} pros · 30-mile zone
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Need a pro in {cityConfig.name}?
            <br />
            <span className="text-primary">We&apos;ll find you one. Free.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/80">
            Post what you need. We match you with <strong>one</strong> vetted
            local pro within 30 miles. No bidding wars. No five phone calls.
            No strangers. Just the right person for the job.
          </p>

          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-muted-foreground">
            Average response: under 4 hours. Emergency jobs: under 30 minutes.
          </p>

          {/* ── Search bar ──────────────────────────────────── */}
          <div className="mt-10">
            <ServiceSearch niches={searchNiches} cityName={cityConfig.name} />
          </div>

          {/* ── Pilot-category quick picks ──────────────────── */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Most-requested in {cityConfig.name}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pilotNiches.map((n) => (
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

          {/* Primary CTA */}
          <div className="mt-10">
            <Button asChild size="lg" className="text-base">
              <a href="#get-matched">
                Get Matched Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Trust bar (Launch Kit) ──────────────────────────── */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 sm:px-6">
          {[
            {
              icon: <BadgeCheck className="h-5 w-5 text-primary" />,
              label: "Licensed · Insured · Background-checked",
            },
            {
              icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
              label: "4.5-star minimum review average",
            },
            {
              icon: <MapPin className="h-5 w-5 text-primary" />,
              label: "Within 30 driving miles — or your next match is free",
            },
            {
              icon: <Lock className="h-5 w-5 text-primary" />,
              label: "Your info stays private until you say yes",
            },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-medium">
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One pro. No bidding. Always {cityConfig.name}.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Tell us what you need.",
              desc:
                "Plumbing, HVAC, handyman, cleaning, snow, lawn — 30 seconds, no account required.",
            },
            {
              step: "2",
              title: "We pick one pro, not five.",
              desc: `A single vetted ${cityConfig.name} pro inside your 30-mile zone. We text you their name, phone, and reviews.`,
            },
            {
              step: "3",
              title: "You decide.",
              desc: "If it's not a fit, we send another. Free.",
            },
          ].map(({ step, title, desc }) => (
            <Card key={step} className="relative">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {step}
                </div>
                <CardTitle className="text-xl text-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────────── */}
      <section className="border-y bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                quote:
                  "Got matched with a plumber 20 minutes after my pipe burst on a Sunday. He was at my door in Millcreek inside an hour.",
                name: "Janet R.",
                area: "Erie, PA",
              },
              {
                quote:
                  "Erie Pro sent me one HVAC guy. One. He fixed it in 40 minutes. I don't know how this is free but I'm telling every neighbor.",
                name: "Mike B.",
                area: "Harborcreek, PA",
              },
            ].map(({ quote, name, area }) => (
              <Card key={name} className="relative">
                <CardContent className="pt-8">
                  <Quote className="h-7 w-7 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-lg leading-relaxed text-foreground">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="mt-6 text-sm font-semibold text-foreground">
                    {name} <span className="font-normal text-muted-foreground">· {area}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Request form ────────────────────────────────────── */}
      <section id="get-matched" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="lg:pt-4">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Post once. Get one pro. Done.
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Get matched free
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Fill out this quick form. We text you one vetted {cityConfig.name}{" "}
              pro — usually within 4 hours, within 30 minutes for emergencies.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: <Shield className="h-5 w-5 text-primary" />, title: "100% free for you", desc: "We're paid by the pros, never you." },
                { icon: <Clock className="h-5 w-5 text-primary" />, title: "Fast match", desc: "Most matches delivered under 4 hours. Emergencies under 30 minutes." },
                { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, title: "One pro, not five", desc: "We don't sell your request. One call, not a cage match." },
                { icon: <Phone className="h-5 w-5 text-primary" />, title: "No spam", desc: "Your phone only rings once — from the pro we matched." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="mt-0.5 flex-shrink-0">{icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-primary/15 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Tell us what you need</CardTitle>
              <CardDescription>
                30 seconds. No account required. Free forever.
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
      </section>

      {/* ── Optional upgrades (Concierge / Annual) ───────────── */}
      <section aria-labelledby="upgrade-heading" className="border-t bg-background py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              Optional
            </p>
            <h2 id="upgrade-heading" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Want us to do the calling?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              Matching is always free. If you&apos;d rather we handle the legwork,
              these are the only two paid options — ever.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            {getAllRequesterTiers()
              .filter((t) => t.id !== "free")
              .map((t) => (
                <Card
                  key={t.id}
                  className={
                    t.featured
                      ? "relative border-2 border-primary/50 shadow-md"
                      : "relative border"
                  }
                >
                  {t.featured && (
                    <Badge className="absolute -top-3 left-5">Most popular</Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-baseline justify-between">
                      <CardTitle className="text-xl">{t.name}</CardTitle>
                      <div className="text-right">
                        <span className="text-2xl font-bold">${t.price}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          {t.cadence === "per-job" ? "/ job" : "/ year"}
                        </span>
                      </div>
                    </div>
                    <CardDescription className="mt-1">{t.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">{t.blurb}</p>
                    <ul className="space-y-2">
                      {t.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">
                      <RequesterUpgradeButton
                        plan={t.id as Exclude<RequesterTier, "free">}
                        label={t.cta}
                        variant={t.featured ? "default" : "outline"}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          <p className="mx-auto mt-6 max-w-xl text-center text-xs text-muted-foreground">
            Free matching is the default. You never have to upgrade to use {cityConfig.domain}.
          </p>
        </div>
      </section>

      {/* ── FAQ (compressed) ─────────────────────────────────── */}
      <section className="border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Questions people actually ask
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "Is it really free?",
                a: "Yes. We're paid by the pros, not you. You never see a fee.",
              },
              {
                q: "Who are the pros?",
                a: `Local ${cityConfig.name} tradespeople who have been license-verified, insurance-verified, background-checked, and who carry a 4.5-star minimum.`,
              },
              {
                q: "What if I don't like the match?",
                a: "Tell us. We send you another one. No questions, no cost.",
              },
              {
                q: "What makes this different from Thumbtack?",
                a: "Thumbtack sells your request to 4–6 companies. You get hammered by phone calls. We pick one pro, exclusively. You get one call.",
              },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── All services (less prominent) ────────────────────── */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            Every category we cover
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Browse all {niches.length} services
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Click any category for local pricing, seasonal tips, and to request
            a match.
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
                  <CardTitle className="text-lg text-foreground group-hover:text-primary">
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
                      Get matched
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Coverage zone ───────────────────────────────────── */}
      <section className="border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" />
              30-mile drive-time zone
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Every match stays local.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              We only route leads to pros inside a 30-mile driving radius of
              your location — roughly 45 minutes by car, an hour in snow
              season. If the closest pro is farther, your next match is free.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {cityConfig.serviceArea.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-sm font-medium"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {area}
              </span>
            ))}
          </div>

          {cityConfig.overlapAreas && cityConfig.overlapAreas.length > 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Also routing into{" "}
              {cityConfig.overlapAreas
                .map((o) => `${o.city}, ${o.stateCode}`)
                .join(" · ")}{" "}
              when within the 30-mile zone.
            </p>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/areas">
                View all service areas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── For pros CTA ────────────────────────────────────── */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            Are you an {cityConfig.name} pro?
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Exclusive local leads. No bidding. Ever.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            First 40 {cityConfig.name} pros lock in <strong>$39/mo for 24 months</strong>.
            First 3 leads are free.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="default">
              <Link href="/pros">
                See the pro offer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/for-business">
                Book a 15-min fit call
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="border-t bg-primary">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to stop chasing down contractors?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/85">
            Post once. Get one pro. Done.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-base"
            >
              <a href="#get-matched">
                Get Matched Free
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
                name: `${cityConfig.name} Pro`,
                url: `https://${cityConfig.domain}`,
                description: `${cityConfig.tagline} Find a vetted local pro in ${cityConfig.name}, ${cityConfig.state} — free.`,
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
                name: `${cityConfig.name} Pro`,
                url: `https://${cityConfig.domain}`,
                slogan: cityConfig.tagline,
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
