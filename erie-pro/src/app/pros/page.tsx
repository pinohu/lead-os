import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Lock,
  MapPin,
  Shield,
  Sparkles,
  Target,
  Zap,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getFoundingOffer } from "@/lib/founding-offer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Keep the slot counter fresh without a redeploy.
export const revalidate = 3600

export const metadata: Metadata = {
  title: `Erie pros: exclusive local leads. No bidding. Ever.`,
  description: `Become an ${cityConfig.name} pro on ${cityConfig.domain}. We find service requests across Craigslist, Facebook, Nextdoor, and direct inbound — then send one to one pro in your 30-mile zone. Founding members: $39/mo, locked for 24 months.`,
  openGraph: {
    title: `Erie pros: exclusive local leads. No bidding. Ever.`,
    description: `One request. One pro. No bidding. Founding-member rate: $39/mo for 24 months.`,
  },
}

// Pricing ladder per Launch Kit Part 2 & Broker Strategy.
// Starter is pay-per-lead, Pro is the flagship subscription with the
// founding discount, Pro+ adds zone expansion + cross-sell, Dominate
// locks the category.
interface TierCard {
  key: "starter" | "pro" | "pro-plus" | "dominate"
  name: string
  price: string
  priceSub?: string
  tagline: string
  bullets: string[]
  cta: string
  ctaHref: string
  highlight?: boolean
  badge?: string
}

const reasons: Array<{ title: string; body: string; icon: React.ReactNode }> = [
  {
    title: "No bidding wars",
    body:
      "You never compete with 3–5 other pros for the same lead. When we match, the job is yours to close.",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: "Local signal, not spray-and-pray",
    body:
      "We pull real service requests from Craigslist, Facebook groups, Nextdoor, and direct inbound — then filter to your 30-mile zone.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "One-to-one matching",
    body:
      "Each request is matched to one pro based on fit, distance, availability, and track record — not who paid the most.",
    icon: <BadgeCheck className="h-5 w-5" />,
  },
  {
    title: "Locked pricing for founders",
    body: `$39/mo for 24 months as a founding member. Normally $99. After the first 40 pros, the rate resets.`,
    icon: <Lock className="h-5 w-5" />,
  },
  {
    title: "Built in Erie, for Erie",
    body:
      "We know lake-effect winters, freeze-thaw cycles, and which neighborhoods want what. No Silicon Valley call center.",
    icon: <MapPin className="h-5 w-5" />,
  },
]

export default async function ProsPage() {
  const offer = await getFoundingOffer()

  const tiers: TierCard[] = [
    {
      key: "starter",
      name: "Starter",
      price: "$0",
      priceSub: "per month",
      tagline: "Pay only when we send you a matched lead.",
      bullets: [
        "Pay-per-lead only — $15–$75 per matched request",
        "Listed in the public directory",
        "Priced by job value (plumbing emergency > estimate walk-through)",
        "Good fit for part-time or occasional work",
      ],
      cta: "Join the waitlist",
      ctaHref: `/for-business/claim?tier=standard`,
    },
    {
      key: "pro",
      name: "Pro",
      price: offer.isSoldOut ? `$${offer.normalPrice}` : `$${offer.price}`,
      priceSub: offer.isSoldOut
        ? "per month"
        : `per month · locked for ${offer.lockMonths} months`,
      tagline: offer.isSoldOut
        ? "The flagship plan. Exclusive leads in your niche."
        : `Founding rate. Normally $${offer.normalPrice}/mo — yours forever at the founding price.`,
      bullets: [
        `Exclusive leads in your niche in ${cityConfig.name}`,
        "Priority ranking over Starter pros on every match",
        "Branded landing page + reviews widget",
        "7-step nurture sequence for unclosed leads",
        "Monthly performance report",
      ],
      cta: offer.isSoldOut ? "Claim a Pro seat" : "Claim founding seat",
      ctaHref: `/for-business/claim?tier=premium`,
      highlight: true,
      badge: offer.isSoldOut
        ? "Most popular"
        : `${offer.remainingSlots} of ${offer.totalSlots} founding seats left`,
    },
    {
      key: "pro-plus",
      name: "Pro+",
      price: "$249",
      priceSub: "per month",
      tagline: "Expand your coverage zone and cross-sell adjacent work.",
      bullets: [
        "Everything in Pro",
        "Extended 45-mile coverage zone (incl. OH/NY overlap)",
        "Cross-sell routing from adjacent niches you opt into",
        "Featured badge on every local page",
        "Automated review collection after each closed job",
        "Google Business Profile optimization",
      ],
      cta: "Upgrade to Pro+",
      ctaHref: `/for-business/claim?tier=elite`,
    },
    {
      key: "dominate",
      name: "Dominate",
      price: "$799",
      priceSub: "per month",
      tagline: "Own the category. One Dominate slot per niche in Erie.",
      bullets: [
        "Everything in Pro+",
        "Category exclusivity — you are the only Dominate pro",
        "Branded content (blog posts mention your business)",
        "Monthly competitor intelligence report",
        "Dedicated account manager + custom marketing materials",
        "First access to new cities when we expand",
      ],
      cta: "Talk to us about Dominate",
      ctaHref: `/contact?subject=dominate`,
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: "Erie Pro founding-member plan",
    description: `$${offer.price}/month locked for ${offer.lockMonths} months. First ${offer.totalSlots} Erie pros only.`,
    price: String(offer.price),
    priceCurrency: "USD",
    availability: offer.isSoldOut
      ? "https://schema.org/SoldOut"
      : "https://schema.org/LimitedAvailability",
    eligibleQuantity: {
      "@type": "QuantitativeValue",
      value: offer.remainingSlots,
      unitText: "seats",
    },
    seller: {
      "@type": "Organization",
      name: cityConfig.domain,
      url: `https://${cityConfig.domain}`,
    },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="mr-1.5 h-3 w-3" />
            For {cityConfig.name}, {cityConfig.stateCode} service pros
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {cityConfig.name} pros:
            <br />
            <span className="text-primary">exclusive local leads.</span>
            <br />
            No bidding. Ever.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            We find service requests across Craigslist, Facebook, Nextdoor,
            and direct inbound — then send one to one pro in your 30-mile zone.
            No auctions. No shared leads. Just work that&apos;s yours to close.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <a href="#fit-call">
                <Calendar className="mr-2 h-4 w-4" />
                Book a 15-Minute Fit Call
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="#pricing">See pricing</a>
            </Button>
          </div>

          {!offer.isSoldOut && (
            <p className="mt-6 text-sm text-muted-foreground">
              Founding rate: <strong className="text-foreground">${offer.price}/mo</strong> locked
              for {offer.lockMonths} months. {offer.remainingSlots} of{" "}
              {offer.totalSlots} seats left.
            </p>
          )}
        </div>
      </section>

      {/* ── Founding-Member Offer ──────────────────────────────── */}
      <section
        id="founding-offer"
        className="border-b bg-gradient-to-b from-primary/5 via-background to-background py-20"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="border-2 border-primary/50 shadow-xl">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-3 w-fit" variant="default">
                <Lock className="mr-1.5 h-3 w-3" />
                Founding member offer
              </Badge>
              <CardTitle className="text-3xl sm:text-4xl">
                ${offer.price}/month. Locked for {offer.lockMonths} months.
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Normally ${offer.normalPrice}/mo. Open only to the first{" "}
                {offer.totalSlots} {cityConfig.name} pros.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Slot counter */}
              <div className="rounded-lg border bg-muted/40 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Seats claimed
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {offer.claimedSlots}
                      <span className="text-base font-normal text-muted-foreground">
                        {" "}/ {offer.totalSlots}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Remaining
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        offer.isSoldOut ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {offer.remainingSlots}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={offer.claimedSlots}
                  aria-valuemin={0}
                  aria-valuemax={offer.totalSlots}
                  aria-label="Founding seats claimed"
                >
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{
                      width: `${Math.round(
                        (offer.claimedSlots / Math.max(offer.totalSlots, 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  `$${offer.price}/mo instead of $${offer.normalPrice}/mo`,
                  `Rate locked for ${offer.lockMonths} months`,
                  "No setup fees, no per-lead fees on Pro",
                  "Cancel any time, no contract lock-in",
                  "Priority support from the founder directly",
                  "First in line when we add a new niche near yours",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {offer.isSoldOut
                  ? "Founding seats are full — join the waitlist for the regular plan."
                  : `Only ${offer.remainingSlots} seats left. Once they're gone, the rate resets to $${offer.normalPrice}/mo.`}
              </p>
              <Button asChild size="lg">
                <a href="#fit-call">
                  {offer.isSoldOut ? "Join the waitlist" : "Claim my seat"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* ── Why Erie Pros Are Signing Up ───────────────────────── */}
      <section className="border-b bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wide text-primary">
              Why pros switch to us
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Erie pros are signing up
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              We&apos;re not another lead-auction platform. We&apos;re the
              opposite of one.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map((r) => (
              <Card key={r.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {r.icon}
                  </div>
                  <CardTitle className="text-lg">{r.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{r.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Ladder ─────────────────────────────────────── */}
      <section id="pricing" className="border-b bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wide text-primary">
              Simple ladder
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pick the plan that fits how you work
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Start pay-per-lead, grow into exclusive leads, expand your zone,
              or own your category outright.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <Card
                key={tier.key}
                className={
                  tier.highlight
                    ? "relative border-2 border-primary shadow-xl lg:scale-[1.03]"
                    : "relative border"
                }
              >
                {tier.badge && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    variant={tier.highlight ? "default" : "secondary"}
                  >
                    {tier.badge}
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.priceSub && (
                      <span className="text-sm text-muted-foreground">
                        {tier.priceSub}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-sm">
                    {tier.tagline}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="space-y-2.5">
                    {tier.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant={tier.highlight ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={tier.ctaHref}>
                      {tier.cta}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">
            All plans are month-to-month. Cancel any time. Starter pays per
            lead only. Pro, Pro+, and Dominate are flat monthly — you keep
            100% of the revenue from closed jobs.
          </p>
        </div>
      </section>

      {/* ── Fit-Call CTA ───────────────────────────────────────── */}
      <section id="fit-call" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1.5 h-3 w-3" />
            15 minutes. Zero pressure.
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Book a 15-minute fit call
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We&apos;ll walk through your service area, what you charge, and
            whether we have demand in your niche right now. If it&apos;s not a
            fit, we&apos;ll tell you — no sales pitch.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/contact?subject=pro-fit-call">
                <Calendar className="mr-2 h-4 w-4" />
                Book a fit call
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href={`mailto:pros@${cityConfig.domain}?subject=Founding%20seat%20request`}>
                Email pros@{cityConfig.domain}
              </a>
            </Button>
          </div>

          <Separator className="my-10" />

          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">No setup fees</p>
              <p>We don&apos;t charge to get you live.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">No contract</p>
              <p>Month-to-month. Cancel anytime.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Built in {cityConfig.name}</p>
              <p>Talk directly to the founder.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
