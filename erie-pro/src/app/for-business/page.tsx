import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Lock,
  ChevronDown,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
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

export const metadata: Metadata = {
  title: `For Businesses — Claim Your Territory in ${cityConfig.name}`,
  description: `Own your category in ${cityConfig.name}, ${cityConfig.stateCode}. Every lead goes exclusively to you. One provider per niche. Claim your territory today.`,
}

export default function ForBusinessPage() {
  const availableCount = niches.filter((n) => !n.subscriberSlug).length

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
            Every lead in your niche goes exclusively to you. No bidding.
            No sharing. No competition. One provider per category — first
            come, first served.
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

      {/* ── How it works for providers ──────────────────────── */}
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
                desc: `Choose your service — plumbing, HVAC, dental, legal — in ${cityConfig.name}. If it's unclaimed, it's yours exclusively.`,
              },
              {
                icon: <Zap className="h-6 w-6" />,
                step: "2",
                title: "We build your page",
                desc: "Your branded landing page goes live instantly. AI-powered lead capture, scoring, and nurture start working for you 24/7.",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                step: "3",
                title: "Exclusive leads flow in",
                desc: `Every person searching for your service in ${cityConfig.name} finds your page. Leads go to you — and only you.`,
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

      {/* ── Pricing grid ────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            Simple pricing
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One fee. All the leads.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            One fixed monthly fee. Every lead in your category goes
            exclusively to you. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((niche) => (
            <Card
              key={niche.slug}
              className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{niche.icon}</span>
                  <div>
                    <CardTitle className="text-base">{niche.label}</CardTitle>
                    <CardDescription>
                      {cityConfig.name}, {cityConfig.stateCode} — Exclusive
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-5">
                  <span className="text-4xl font-extrabold tracking-tight">
                    ${niche.monthlyFee}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
                <ul className="space-y-3">
                  {[
                    `All ${niche.label.toLowerCase()} leads in ${cityConfig.name}`,
                    "Branded landing page",
                    "AI-powered lead scoring",
                    "7-stage email nurture sequence",
                    "Monthly performance report",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {niche.subscriberSlug ? (
                  <div className="w-full rounded-md bg-muted py-3 text-center text-sm font-medium text-muted-foreground">
                    Territory claimed
                  </div>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={`/${niche.slug}`}>
                      Claim {niche.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
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
                the market. Every lead in that category goes to them — not
                you. The first to claim wins.
              </p>
              <ul className="space-y-3">
                {[
                  "Exclusive leads — no sharing, no bidding",
                  "Your branded page ranks for local searches",
                  "AI nurture converts leads while you sleep",
                  "Cancel anytime — no contracts, no lock-in",
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
                {
                  value: String(availableCount),
                  label: "Territories still open",
                },
                { value: "1", label: "Provider per category" },
                { value: "24/7", label: "AI lead capture" },
                { value: "100%", label: "Leads go to you" },
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
              q: "How much does it cost?",
              a: "Pricing varies by category, starting at $300/month. There are no setup fees, no contracts, and you can cancel anytime.",
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
            {
              q: "What's included in my subscription?",
              a: "A branded landing page, AI-powered lead scoring, a 7-stage email nurture sequence, monthly performance reports, and all the leads in your category.",
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
