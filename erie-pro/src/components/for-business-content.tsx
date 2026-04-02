"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  TrendingUp,
  Lock,
  Award,
  Crown,
  Star,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import {
  TIER_BENEFITS,
  TIER_ORDER,
  calculateMonthlyFee,
  type ProviderTier,
} from "@/lib/premium-rewards"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const tierIcons: Record<ProviderTier, React.ReactNode> = {
  standard: <Shield className="h-5 w-5" />,
  premium: <Star className="h-5 w-5" />,
  elite: <Crown className="h-5 w-5" />,
}

const tierCardStyles: Record<ProviderTier, string> = {
  standard: "border",
  premium: "border-2 border-amber-400 dark:border-amber-600 shadow-md",
  elite:
    "border-2 border-purple-500 dark:border-purple-600 shadow-xl ring-2 ring-purple-500/20 scale-[1.02]",
}

export function ForBusinessContent() {
  const availableCount = niches.filter((n) => !n.subscriberSlug).length
  const [selectedNiche, setSelectedNiche] = useState(niches[0].slug)
  const activeNiche = niches.find((n) => n.slug === selectedNiche) ?? niches[0]

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-24 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6">
            <Lock className="mr-1.5 h-3 w-3" />
            {availableCount} of {niches.length} territories still available
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Own your category
            <br />
            <span className="text-primary">in {cityConfig.name}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Every lead in your niche goes exclusively to you. Choose your
            tier for more visibility, features, and growth tools.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <a href="#pricing">
                Claim Your Territory
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how-it-works" className="bg-muted/50 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
              For local businesses
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works for providers
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Three steps to owning every lead in your category across{" "}
              {cityConfig.name}.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                step: "1",
                title: "Claim your category",
                desc: `Choose your service in ${cityConfig.name}. If it's unclaimed, it's yours exclusively.`,
              },
              {
                icon: <Zap className="h-6 w-6" />,
                step: "2",
                title: "Choose your tier",
                desc: "Standard for leads, Premium for growth tools, or Elite for full-service domination.",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                step: "3",
                title: "Exclusive leads flow in",
                desc: `Every person searching for your service in ${cityConfig.name} finds your page. Leads go to you only.`,
              },
            ].map(({ icon, step, title, desc }) => (
              <Card key={step} className="relative text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {icon}
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

      {/* ── Why Providers Choose Us ─────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            The exclusive advantage
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for providers who want to grow
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            No shared leads. No bidding wars. Just your territory, your leads.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <Lock className="h-8 w-8 text-primary" />,
              title: "Exclusive territory model",
              desc: "One provider per niche per city. Your competitors cannot buy their way onto your listing.",
            },
            {
              icon: <Zap className="h-8 w-8 text-primary" />,
              title: "Leads delivered in real-time",
              desc: "When a homeowner submits a request, you are notified instantly via email and SMS. No delays.",
            },
            {
              icon: <Shield className="h-8 w-8 text-primary" />,
              title: "Cancel anytime, no contracts",
              desc: "Month-to-month billing with no penalties, no lock-in, and no hidden fees. Full control is yours.",
            },
          ].map(({ icon, title, desc }) => (
            <Card key={title} className="flex flex-col text-center">
              <CardHeader>
                <div className="mx-auto mb-2">{icon}</div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Tiered Pricing ──────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            Demand-based pricing
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your niche. Pick your tier.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Select your service category below, then choose the tier that
            fits your growth goals.
          </p>
        </div>

        {/* Niche selector */}
        <div className="mb-12">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Select your niche:
          </p>
          <div className="flex flex-wrap gap-2">
            {niches.map((n) => (
              <button
                key={n.slug}
                onClick={() => setSelectedNiche(n.slug)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                  selectedNiche === n.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <span>{n.icon}</span>
                {n.label}
                {n.subscriberSlug && (
                  <span className="ml-1 text-xs opacity-60">Claimed</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tier cards for selected niche */}
        <div className="grid items-start gap-6 md:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const benefits = TIER_BENEFITS[tier]
            const price = calculateMonthlyFee(activeNiche.monthlyFee, tier)
            const isElite = tier === "elite"
            const isPremium = tier === "premium"

            return (
              <Card
                key={tier}
                className={`relative flex flex-col ${tierCardStyles[tier]}`}
              >
                {isElite && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                      <Award className="mr-1 h-3 w-3" />
                      Best Value
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isElite
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : isPremium
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tierIcons[tier]}
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {tier}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {activeNiche.icon} {activeNiche.label} in{" "}
                        {cityConfig.name}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${price}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      /month
                    </span>
                    {tier !== "standard" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {benefits.monthlyMultiplier}x base rate ($
                        {activeNiche.monthlyFee})
                      </p>
                    )}
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="flex-1 pt-5">
                  <ul className="space-y-2.5">
                    {benefits.benefits.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {benefits.gbpOptimization && (
                      <Badge variant="outline" className="text-xs">
                        GBP Optimization
                      </Badge>
                    )}
                    {benefits.reviewAutomation && (
                      <Badge variant="outline" className="text-xs">
                        Review Automation
                      </Badge>
                    )}
                    {benefits.competitorIntelligence && (
                      <Badge variant="outline" className="text-xs">
                        Competitor Intel
                      </Badge>
                    )}
                    {benefits.socialMediaMentions > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {benefits.socialMediaMentions} Social Posts/mo
                      </Badge>
                    )}
                    {benefits.brandedContent && (
                      <Badge variant="outline" className="text-xs">
                        Branded Content
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  {activeNiche.subscriberSlug ? (
                    <div className="w-full rounded-md bg-muted py-3 text-center text-sm font-medium text-muted-foreground">
                      Territory claimed
                    </div>
                  ) : (
                    <Button
                      asChild
                      className={`w-full ${
                        isElite
                          ? "bg-purple-600 hover:bg-purple-700"
                          : isPremium
                          ? "bg-amber-700 hover:bg-amber-800"
                          : ""
                      }`}
                    >
                      <Link
                        href={`/for-business/claim?niche=${activeNiche.slug}&tier=${tier}`}
                      >
                        Claim as{" "}
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Quick comparison table */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-3 text-left font-semibold">Feature</th>
                <th scope="col" className="py-3 text-center font-semibold">Standard</th>
                <th scope="col" className="py-3 text-center font-semibold text-amber-700 dark:text-amber-400">
                  Premium
                </th>
                <th scope="col" className="py-3 text-center font-semibold text-purple-700 dark:text-purple-400">
                  Elite
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { feature: "Exclusive leads", standard: true, premium: true, elite: true },
                { feature: "Custom landing page", standard: true, premium: true, elite: true },
                { feature: "AI lead scoring", standard: true, premium: true, elite: true },
                { feature: "Monthly report", standard: true, premium: true, elite: true },
                { feature: "Featured badge", standard: false, premium: true, elite: true },
                { feature: "National directory listing", standard: false, premium: true, elite: true },
                { feature: "Review automation", standard: false, premium: true, elite: true },
                { feature: "GBP optimization", standard: false, premium: true, elite: true },
                { feature: "Priority placement", standard: false, premium: true, elite: true },
                { feature: "Social media mentions", standard: "0", premium: "2/mo", elite: "4/mo" },
                { feature: "Branded content", standard: false, premium: false, elite: true },
                { feature: "Competitor intelligence", standard: false, premium: false, elite: true },
                { feature: "Dedicated account manager", standard: false, premium: false, elite: true },
                { feature: "First access to new cities", standard: false, premium: false, elite: true },
              ].map(({ feature, standard, premium, elite }) => (
                <tr key={feature}>
                  <td className="py-2.5 text-muted-foreground">{feature}</td>
                  {[standard, premium, elite].map((val, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {typeof val === "string" ? (
                        <span className="text-xs font-medium">{val}</span>
                      ) : val ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Urgency section ─────────────────────────────────── */}
      <section className="border-y bg-muted/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
                Why act now
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Only one provider per category
              </h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                When a competitor claims your niche, that territory is off
                the market. Every lead in that category goes to them. The
                first to claim wins.
              </p>
              <ul className="space-y-3">
                {[
                  "Exclusive leads -- no sharing, no bidding",
                  "Your branded page ranks for local searches",
                  "AI nurture converts leads while you sleep",
                  "Cancel anytime -- no contracts, no lock-in",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: String(availableCount), label: "Territories still open" },
                { value: "1", label: "Provider per category" },
                { value: String(niches.length), label: "Niche categories" },
                { value: "3", label: "Provider tiers" },
              ].map(({ value, label }) => (
                <Card key={label} className="p-6 text-center">
                  <div className="text-3xl font-extrabold text-primary">
                    {value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            Questions?
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "What does \"exclusive territory\" mean?",
              a: `When you claim a category (e.g., Plumbing) in ${cityConfig.name}, you are the only provider listed in that category. Every lead that comes through for that service goes directly and exclusively to you.`,
            },
            {
              q: "What is the difference between tiers?",
              a: "Standard gets you exclusive leads and a branded page. Premium adds a featured badge, review automation, GBP optimization, and social media mentions. Elite includes everything plus branded content, competitor intelligence, a dedicated account manager, and first access to new cities.",
            },
            {
              q: "Can I upgrade my tier later?",
              a: "Absolutely. You can upgrade from Standard to Premium or Elite at any time. Your new benefits activate immediately and the price adjusts on your next billing cycle.",
            },
            {
              q: "What if my category is already claimed?",
              a: "Each category only has one provider. If your category is taken, you can join a waitlist and we'll notify you if it opens up.",
            },
            {
              q: "How do leads get to me?",
              a: `We build a branded landing page for your service in ${cityConfig.name}. When someone searches for your service, they find your page and submit a quote request. That lead goes directly to you via email and SMS.`,
            },
            {
              q: "Is there a contract?",
              a: "No. Month-to-month billing. Cancel anytime with no penalties or hidden fees.",
            },
          ].map(({ q, a }) => (
            <Card key={q}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">{q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="border-t bg-primary">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Claim your territory before
            <br className="hidden sm:block" /> a competitor does
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/80">
            One provider per niche. First come, first served.{" "}
            {availableCount} territories still available in{" "}
            {cityConfig.name}.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-base"
            >
              <a href="#pricing">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
