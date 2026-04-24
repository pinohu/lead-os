import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Shield, BarChart3, Users, Bot, Clock } from "lucide-react";

const brandName = tenantConfig.brandName || "CX React";

export const metadata: Metadata = {
  title: `${brandName} | Lead capture, scoring & nurture for teams that sell expertise`,
  description:
    "One runtime for agencies, SaaS teams, lead-gen shops, consultants, and franchise operators: capture, score, route, and nurture demand across industries — with an operator dashboard and APIs you control.",
  openGraph: {
    title: `${brandName} — Lead OS for multi-industry operators`,
    description:
      "Replace scattered tools with one configurable platform: intake, scoring, funnels, marketplace, billing hooks, and 130+ integration adapters (keys required).",
    images: [{ url: buildOgImageUrl(brandName, "Lead capture & nurture for every operator model"), width: 1200, height: 630 }],
  },
};

const replacedTools = [
  "CRM", "Email Marketing", "SMS", "Landing Pages", "A/B Testing", "Analytics",
  "Workflow Automation", "Content AI", "Lead Scoring", "Booking", "Chat", "Billing",
];

const steps = [
  {
    n: "01",
    title: "Define your workspace",
    desc: "Set tenant, brand, and industry templates. Agencies add clients; SaaS and lead-gen teams map products or territories — the same engine powers every model.",
  },
  {
    n: "02",
    title: "Turn on capture",
    desc: "Widgets, assessments, calculators, and API intake (`/api/intake`) feed one pipeline with duplicate detection and configurable funnels.",
  },
  {
    n: "03",
    title: "Score & route automatically",
    desc: "Intent, fit, engagement, and urgency roll into a composite score plus temperature bands so humans and automations agree on what to do next.",
  },
  {
    n: "04",
    title: "Prove outcomes",
    desc: "Dashboards, attribution views, marketplace listing (when enabled), and webhooks give you receipts for clients, investors, or franchise partners.",
  },
];

const stats = [
  { stat: "16", label: "Industries ready to launch" },
  { stat: "137+", label: "Tool integrations" },
  { stat: "15+", label: "Hours saved per week" },
  { stat: "61%", label: "Avg. SaaS cost reduction" },
];

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "Security-first defaults",
    desc: "Hardened headers, CSP hooks, parameterized data access, and operator audit patterns suitable for regulated workflows when you configure Postgres + secrets.",
  },
  {
    icon: Users,
    title: "Operator access controls",
    desc: "Magic-link operator sessions gate `/dashboard/*` mutations. Map your own IdP story separately if you need SSO — the runtime is API-first today.",
  },
  {
    icon: BarChart3,
    title: "Published SLA targets",
    desc: "Enterprise uptime commitments are documented in our SLA. Review `/docs/sla` before you promise SLAs downstream.",
  },
  {
    icon: Zap,
    title: "Automation & webhooks",
    desc: "Queue-friendly pricing ticks, cron surfaces, marketplace APIs, and outbound delivery hubs — all optional behind env keys and billing gates.",
  },
  {
    icon: Bot,
    title: "AI-assisted workflows",
    desc: "When LLM keys are present, scoring explanations, content drafts, and agent playbooks augment humans — never a black box without your prompts.",
  },
  {
    icon: Clock,
    title: "Operational visibility",
    desc: "Control plane snapshots, health/deep probes, and GTM execution boards help operators prove rollout status without inventing vanity metrics.",
  },
];

const joyOvernight = [
  "Churn prevention \u2014 disengaged leads re-engaged per workspace playbook",
  "Warm leads going cold \u2014 next nurture step queued from the active funnel graph",
  "Pipeline gaps \u2014 prospecting or partner routes fire when thresholds trip",
  "Roll-up report generated for each workspace you track (brand, territory, or account)",
];

const joyMorning = [
  "\u201cNew demand landed overnight across your workspaces — scored and queued\u201d",
  "\u201cHours reclaimed from manual follow-ups — tied to the automations you enabled\u201d",
  "\u201cA short list of workspaces that need a human nudge today\u201d",
  "One prioritized action per workspace so the day starts with clarity",
];

const audiencePaths = [
  {
    label: "Digital marketing agencies",
    desc: "White-label every client, collapse redundant SaaS spend, and ship morning-ready reporting.",
    href: "/for/agencies",
  },
  {
    label: "SaaS founders",
    desc: "Instrument trial → paid journeys, automate nudges, and attribute revenue to campaigns.",
    href: "/for/saas-founders",
  },
  {
    label: "Lead generation teams",
    desc: "Score omnichannel demand, prove ROI, and clone winning funnels into new verticals fast.",
    href: "/for/lead-gen",
  },
  {
    label: "Consultants & experts",
    desc: "Authority funnels, booking automation, and nurture without hiring an ops army.",
    href: "/for/consultants",
  },
  {
    label: "Franchise operators",
    desc: "Territory-aware routing, brand guardrails, and repeatable dashboards per location.",
    href: "/for/franchises",
  },
];

export default function HomePage() {
  const baseUrl = tenantConfig.siteUrl.replace(/\/$/, "");

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: brandName,
        url: baseUrl,
        description:
          "Lead capture, scoring, routing, and nurture runtime for agencies, SaaS teams, consultants, lead-gen operators, and franchise programs.",
        contactPoint: {
          "@type": "ContactPoint",
          email: tenantConfig.supportEmail,
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: `${brandName} | Lead OS for multi-industry operators`,
        publisher: { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#app`,
        name: brandName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Multi-tenant lead generation infrastructure with APIs, dashboards, marketplace hooks, and 130+ integration adapters (credentials required).",
        url: baseUrl,
        publisher: { "@id": `${baseUrl}/#organization` },
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "299",
          highPrice: "1299",
          priceCurrency: "USD",
          description: "Self-serve plans from Starter through Enterprise — see /pricing",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4 pt-12 pb-10">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            Agencies · SaaS · Lead gen · Consultants · Franchises
          </Badge>
          <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5">
            One lead operating system<br className="hidden sm:block" /> for every growth model.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Capture demand, score it consistently, route it to the right playbook, and prove outcomes — whether you
            run fifty client accounts, a vertical SaaS, or a territory pilot like Erie. Same runtime, same APIs, your
            configuration.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg" className="text-base px-8 h-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Link href="/onboard">Start free setup</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Link href="/demo">Watch the demo tour</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 tracking-wide">
            No credit card &middot; Guided onboarding &middot; Docs at /docs
          </p>
        </div>
      </section>

      {/* ── Choose your operating model ───────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-10" aria-labelledby="audience-paths-heading">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">Choose your path</Badge>
          <h2 id="audience-paths-heading" className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Same platform. Different go-to-market motions.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each blueprint explains pains, recommended industries, and the first automations to enable. Jump in, then
            continue to pricing or onboarding when you are ready.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {audiencePaths.map(({ label, desc, href }) => (
            <Button key={href} asChild variant="outline" className="h-auto min-h-[110px] flex-col items-start p-5 text-left">
              <Link href={href} className="w-full">
                <span className="font-semibold text-base">{label}</span>
                <span className="text-xs text-muted-foreground font-normal leading-snug mt-2 block">{desc}</span>
                <span className="text-xs text-primary font-medium mt-3 inline-flex items-center gap-1">
                  Explore playbook <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Button asChild variant="secondary">
            <Link href="/industries">Browse 16+ industry templates</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/offers">See offer paths</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </section>

      {/* ── Stack sprawl (universal) ──────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-8" aria-labelledby="stack-sprawl-heading">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">Why teams consolidate here</Badge>
          <h2 id="stack-sprawl-heading" className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Most organizations stack 8–15 overlapping SaaS products
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Agencies see it per client. SaaS teams see it across growth, success, and marketing ops. Consultants feel it
            in billing hours. The result is duplicated data, fragile Zapier chains, and reporting nobody trusts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {replacedTools.map((tool) => (
            <span key={tool} className="px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground line-through decoration-destructive/40 bg-destructive/5 border border-destructive/10">
              {tool}
            </span>
          ))}
        </div>
        <Card className="border-primary/20 bg-primary/[0.04]">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground leading-relaxed">
            CX React replaces those point tools with <strong className="text-foreground">one intake + scoring + routing core</strong>,
            optional marketplace liquidity, Stripe-ready billing surfaces, and an operator dashboard so humans stay in
            control. Actual savings depend on which legacy contracts you retire.
          </CardContent>
        </Card>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-8" aria-labelledby="how-it-works-heading">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 id="how-it-works-heading" className="text-3xl font-bold tracking-tight text-foreground">Four steps from zero to automated demand</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(({ n, title, desc }) => (
            <Card key={n} className="bg-muted/30">
              <CardHeader className="pb-3">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-2">
                  {n}
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section className="border-y border-border py-10" aria-label="Platform statistics">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-12">
          {stats.map(({ stat, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold text-primary tracking-tight">{stat}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Enterprise Grade ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8" aria-labelledby="enterprise-heading">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">Enterprise-ready posture</Badge>
          <h2 id="enterprise-heading" className="text-3xl font-bold tracking-tight text-foreground">
            Controls, observability, and contracts you can stand behind
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-3">
            Review the{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/docs/sla">
              SLA summary
            </Link>{" "}
            and full GitHub document before you resell uptime guarantees.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enterpriseFeatures.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Outcomes teams target ─────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8" aria-labelledby="outcomes-heading">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">Outcomes operators target</Badge>
          <h2 id="outcomes-heading" className="text-3xl font-bold tracking-tight text-foreground">
            Representative goals — not paid testimonials
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-3">
            Replace fabricated quotes with your own customer stories once you have permission. Until then, these are
            the measurable motions the product is architected to support.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Tool consolidation",
              body: "Retire overlapping CRM, nurture, and analytics subscriptions per brand, territory, or client workspace when APIs are connected.",
            },
            {
              title: "Faster activation",
              body: "Spin up assessments, calculators, and intake flows from industry templates instead of bespoke builds.",
            },
            {
              title: "Operational receipts",
              body: "Dashboards, audits, and webhooks document what happened to every lead for downstream stakeholders.",
            },
          ].map(({ title, body }) => (
            <Card key={title} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Joy Layer ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-8" aria-label="The Joy Layer">
        <Card className="border-l-4 border-l-primary bg-primary/[0.03]">
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">The Joy Layer</Badge>
            <CardTitle className="text-2xl">Your morning briefing surfaces which accounts need attention</CardTitle>
            <CardDescription className="text-base">
              Wake up to a dashboard that shows which workspaces are healthy and which need a nudge — agencies see
              per-client rollups; SaaS and franchise teams see products or locations instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">What happens overnight</h3>
                <ul className="space-y-2">
                  {joyOvernight.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">What you see in the morning</h3>
                <ul className="space-y-2">
                  {joyMorning.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Email Capture ─────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 py-8 text-center" aria-labelledby="email-capture-heading">
        <Badge variant="outline" className="mb-4">Get early access</Badge>
        <h2 id="email-capture-heading" className="text-3xl font-bold tracking-tight text-foreground mb-3">See it with your data model</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Drop your work email — we&apos;ll route you through onboarding or a tailored demo workspace for your niche.
        </p>
        <form action="/api/capture" method="POST" className="flex gap-3 justify-center flex-wrap max-w-md mx-auto">
          <input type="hidden" name="source" value="homepage" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            aria-label="Email address"
            className="flex-1 min-w-[240px] h-12 px-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="lg" className="h-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Start free</Button>
        </form>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 py-8 text-center" aria-labelledby="final-cta-heading">
        <h2 id="final-cta-heading" className="text-3xl font-bold tracking-tight text-foreground mb-3">Ship your first workspace today</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Onboarding walks through email, niche selection, plan, branding, and integrations. Need proof first? Tour the
          demo, read the docs hub, or talk to us via contact.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg" className="px-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Link href="/onboard">Start free setup</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Link href="/docs">Read documentation</Link>
          </Button>
        </div>
      </section>
    </div>
    </>
  );
}
