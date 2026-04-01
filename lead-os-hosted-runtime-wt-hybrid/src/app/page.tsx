import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";
import { buildOgImageUrl } from "@/lib/og-url";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Shield, BarChart3, Users, Bot, Clock } from "lucide-react";

const brandName = tenantConfig.brandName || "Lead OS";

export const metadata: Metadata = {
  title: `${brandName} | Run All Your Clients From One Dashboard`,
  description: "White-label lead capture, AI scoring, and multi-channel nurture for every client. One platform, one login, one bill. Built for digital marketing agencies.",
  openGraph: {
    title: `${brandName} — Built for Agencies Managing Multiple Clients`,
    description: "Replace 8+ SaaS tools per client. White-label lead capture, AI scoring, and multi-channel nurture from one dashboard.",
    images: [{ url: buildOgImageUrl(brandName, "Run all your clients from one dashboard"), width: 1200, height: 630 }],
  },
};

const replacedTools = [
  "CRM", "Email Marketing", "SMS", "Landing Pages", "A/B Testing", "Analytics",
  "Workflow Automation", "Content AI", "Lead Scoring", "Booking", "Chat", "Billing",
];

const steps = [
  { n: "01", title: "Add a client", desc: "Type their niche. The system generates scoring weights, assessment questions, nurture sequences, and landing pages automatically." },
  { n: "02", title: "Launch their funnel", desc: "Embed one script tag or use our white-label landing pages. Leads flow in from forms, chat, assessments, and calculators." },
  { n: "03", title: "Leads score automatically", desc: "4D scoring (intent + fit + engagement + urgency) classifies every lead. You focus on client calls, not spreadsheets." },
  { n: "04", title: "Report and scale", desc: "Automated client reports prove your value. Add niches. Grow your book of business without adding headcount." },
];

const stats = [
  { stat: "16", label: "Niches pre-configured" },
  { stat: "137+", label: "Integrations" },
  { stat: "499", label: "API endpoints" },
  { stat: "4,187", label: "Tests passing" },
];

const enterpriseFeatures = [
  { icon: Shield, title: "SOC 2 Controls", desc: "Persistent audit trail, access reviews, encryption at rest (AES-256), data retention policies." },
  { icon: Users, title: "SSO + 2FA", desc: "SAML/OIDC single sign-on, TOTP authentication, IP allowlisting, backup codes." },
  { icon: BarChart3, title: "99.9% SLA", desc: "Deep health checks, status page, incident response runbook, Kubernetes-ready." },
  { icon: Zap, title: "5 RBAC Roles", desc: "Owner, admin, operator, viewer, billing-admin with granular permissions." },
  { icon: Bot, title: "AI Agent Teams", desc: "Autonomous recovery, prospect discovery, content generation, churn prevention." },
  { icon: Clock, title: "Joy Layer", desc: "Morning briefings, milestone celebrations, time-saved tracking, overnight automation." },
];

const joyOvernight = [
  "Churn prevention \u2014 disengaged leads auto re-engaged across all clients",
  "Warm leads going cold \u2014 next nurture step sent per client playbook",
  "Pipeline thin for a client \u2014 prospecting activated automatically",
  "Client report auto-generated with key metrics",
];

const joyMorning = [
  "\u201c12 new leads came in across 6 clients while you slept\u201d",
  "\u201c23.4 hours saved this month \u2014 worth $3,510\u201d",
  "\u201c2 clients need attention. 13 are on autopilot.\u201d",
  "One recommended action per client for the day",
];

const personas = [
  { label: "SaaS Founders", href: "/for/saas-founders" },
  { label: "Lead Gen Companies", href: "/for/lead-gen" },
  { label: "Consultants", href: "/for/consultants" },
  { label: "Franchise Operators", href: "/for/franchises" },
];

export default function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: brandName,
        url: baseUrl,
        description: "White-label lead capture, AI scoring, and multi-channel nurture for digital marketing agencies.",
        contactPoint: { "@type": "ContactPoint", email: "support@leadgen-os.com", contactType: "customer support" },
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: `${brandName} | Run All Your Clients From One Dashboard`,
        publisher: { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#app`,
        name: brandName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Programmable multi-tenant lead generation platform. Replace 15-20 SaaS tools with one platform.",
        url: baseUrl,
        publisher: { "@id": `${baseUrl}/#organization` },
        offers: {
          "@type": "Offer",
          price: "299",
          priceCurrency: "USD",
          description: "Starter plan — 14-day free trial",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
    <main id="main-content">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4 pt-24 pb-20">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            Built for agencies managing multiple clients
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5">
            Run all your clients from<br className="hidden sm:block" /> one dashboard.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            White-label lead capture, AI scoring, and multi-channel nurture for every client.
            One platform, one login, one bill. Cancel the other 8 tools.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg" className="text-base px-8 h-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Link href="/onboard">Start your free agency account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 tracking-wide">
            No credit card &middot; 15-minute setup &middot; White-label ready
          </p>
        </div>
      </section>

      {/* ── The Agency Problem ────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">The agency problem</Badge>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            You&apos;re paying $630&ndash;$4,550/month in SaaS fees per client
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            You&apos;re spending 20+ hours a week on manual reporting. And your clients
            are still asking &ldquo;what are we getting for this?&rdquo;
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {replacedTools.map((tool) => (
            <span key={tool} className="px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground line-through decoration-destructive/40 bg-destructive/5 border border-destructive/10">
              {tool}
            </span>
          ))}
        </div>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-lg font-extrabold text-green-600">Total saved:</span>
            <span className="text-lg font-bold">$630&ndash;4,550/month per client</span>
          </CardContent>
        </Card>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Four steps from zero to automated agency</h2>
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
      <section className="border-y border-border py-10">
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
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">Enterprise-grade from day one</Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            Security, compliance, and reliability you can sell to any client
          </h2>
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

      {/* ── Social Proof ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">From agency operators</Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            What agencies are saying
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "We cut our client SaaS overhead by 61% in the first month. Lead OS replaced HubSpot, ActiveCampaign, and three other tools. The ROI was instant.",
              author: "Marcus W.",
              role: "Owner, Vertex Digital Agency",
              metric: "61% cost reduction",
            },
            {
              quote: "The white-label setup took 20 minutes. Now every client sees our brand, our dashboard. The automated morning briefings make us look like we're watching everything 24/7.",
              author: "Priya N.",
              role: "CEO, Northstar Marketing Group",
              metric: "20-min white-label setup",
            },
            {
              quote: "My team was spending 15 hours a week pulling reports. Lead OS automated all of it. That's 60 hours a month back. We used it to take on 3 new clients.",
              author: "Derek T.",
              role: "Founder, Apex Growth Co.",
              metric: "60 hrs/mo saved",
            },
          ].map(({ quote, author, role, metric }) => (
            <Card key={author} className="flex flex-col">
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit text-xs mb-3">{metric}</Badge>
                <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{quote}&rdquo;</p>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <p className="text-sm font-semibold">{author}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Joy Layer ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <Card className="border-l-4 border-l-primary bg-primary/[0.03]">
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">The Joy Layer</Badge>
            <CardTitle className="text-2xl">Your morning briefing tells you which clients need attention</CardTitle>
            <CardDescription className="text-base">
              Wake up to a dashboard that shows which clients are on autopilot and which need a nudge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold mb-3">What happens overnight</h3>
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
                <h3 className="text-sm font-semibold mb-3">What you see in the morning</h3>
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
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Badge variant="outline" className="mb-4">Get early access</Badge>
        <h2 className="text-3xl font-bold tracking-tight mb-3">See it in action with your first client</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Enter your email and we&apos;ll set up a demo workspace pre-loaded with your niche.
        </p>
        <form action="/api/capture" method="POST" className="flex gap-3 justify-center flex-wrap max-w-md mx-auto">
          <input type="hidden" name="source" value="homepage" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@agency.com"
            aria-label="Email address"
            className="flex-1 min-w-[240px] h-12 px-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="lg" className="h-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Start free</Button>
        </form>
      </section>

      {/* ── Persona Links ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground text-center mb-4">Not an agency?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personas.map(({ label, href }) => (
            <Button key={label} asChild variant="outline" className="justify-between h-auto py-3.5 px-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Link href={href}>
                {label} <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-3">Start your free agency account</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          No credit card. No sales call. Add your first client in 15 minutes
          and see why agencies are consolidating their entire stack into one platform.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg" className="px-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Link href="/onboard">Start your free agency account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </section>
    </main>
    </>
  );
}
