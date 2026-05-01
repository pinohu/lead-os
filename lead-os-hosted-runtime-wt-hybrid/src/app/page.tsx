import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  PlugZap,
  Route,
  ShieldCheck,
  SquareStack,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { provisionablePackages } from "@/lib/package-catalog";
import { buildOgImageUrl } from "@/lib/og-url";
import { notLiveUntilConfigured, publicPlans } from "@/lib/public-offer";
import { tenantConfig } from "@/lib/tenant";

const brandName = tenantConfig.brandName || "Lead OS";

export const metadata: Metadata = {
  title: `${brandName} | Launch the complete solution your client bought`,
  description:
    "Lead OS helps teams sell outcome-based AI solutions, collect client intake details, and launch the customer-ready pages, routing, assets, dashboards, and reports the client paid for.",
  openGraph: {
    title: `${brandName} - Launch the complete solution your client bought`,
    description: "Sell the outcome. Collect one intake form. Launch the client-ready solution.",
    images: [{ url: buildOgImageUrl(brandName, "Client lead system launcher"), width: 1200, height: 630 }],
  },
};

const launchSteps = [
  {
    title: "Pick a solution",
    body: "Choose the outcome the client bought, such as missed-call recovery, lead reactivation, content repurposing, or a full AI-first business OS.",
  },
  {
    title: "Collect intake details",
    body: "The client gives the business name, domain, outcome, market, delivery contact, success metric, constraints, and optional account access.",
  },
  {
    title: "Launch the delivery hub",
    body: "Lead OS creates the customer-facing pages, finished assets, routing logic, reports, acceptance checks, and solution-specific outputs.",
  },
  {
    title: "Operate and report",
    body: "The delivery team tracks outcomes, lead quality, managed handoffs, revenue events, and customer-ready reports.",
  },
];

const launchedOutputs = [
  { icon: FileCheck2, title: "Public intake page", body: "A shareable lead capture page for the customer's offer." },
  { icon: PlugZap, title: "Website embed", body: "Copy-ready embed code for the customer's site." },
  { icon: Route, title: "Routing rules", body: "Solution-specific scoring and handoff logic." },
  { icon: SquareStack, title: "Delivery hub", body: "Dashboard, launch status, and next actions." },
  { icon: WalletCards, title: "Revenue surfaces", body: "Pricing, invoice, subscription, and ROI views where the solution supports them." },
  { icon: ClipboardList, title: "Reports", body: "Lead, source, qualified, booking, and pipeline value reporting." },
];

const audienceRows = [
  ["Agency", "Sell repeatable lead systems to clients without rebuilding fulfillment every time."],
  ["Lead seller", "Package, price, route, and report on lead inventory and buyer outcomes."],
  ["Consultant", "Launch authority funnels that qualify prospects before a call or proposal."],
  ["Directory owner", "Turn category traffic into routed and monetized lead demand."],
  ["Franchise or SaaS team", "Route leads by territory, trial stage, partner, or customer segment."],
];

export default function HomePage() {
  const baseUrl = tenantConfig.siteUrl.replace(/\/$/, "");
  const deliverableCount = provisionablePackages.reduce((total, pkg) => total + pkg.deliverables.length, 0);

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/#app`,
    name: brandName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Complete AI solution launcher for agencies, consultants, lead sellers, SaaS teams, franchises, and local-service operators.",
    url: baseUrl,
    offers: publicPlans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace("$", "").replace("/mo", ""),
      priceCurrency: "USD",
      description: plan.description,
      url: `${baseUrl}/onboard?plan=${plan.shortId}`,
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <main className="w-full max-w-none overflow-x-hidden p-0">
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:py-10 lg:grid-cols-[1fr_0.88fr] lg:items-start">
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-4">
                For teams who sell outcome-based AI solutions
              </Badge>
              <h1 className="max-w-3xl break-words text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
                Lead OS turns a client purchase into a launched solution.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Sell a specific outcome. Send one intake form. Lead OS provisions the customer-facing pages, website embed,
                routing, delivery hub, reports, finished outputs, and managed handoffs that match what the client paid for.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/packages">
                    Choose a solution to launch <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/onboard">Create operator account</Link>
                </Button>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <strong className="block text-foreground">{provisionablePackages.length} sellable solutions</strong>
                  Local services, agencies, directories, SaaS, affiliates, franchises, and more.
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <strong className="block text-foreground">{deliverableCount} finished outputs</strong>
                  Intake, embeds, routing, dashboards, reports, billing, and delivery surfaces.
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <strong className="block text-foreground">One client intake form</strong>
                  Required details launch now. Client-owned account access can replace managed handoffs later.
                </div>
              </div>
            </div>

            <aside className="min-w-0 rounded-lg border border-border bg-muted/40 p-4" aria-label="Launch path">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Launch path</p>
                  <p className="text-xs text-muted-foreground">This is what happens after a client pays.</p>
                </div>
                <Badge variant="outline">Production flow</Badge>
              </div>
              <ol className="grid gap-3 pl-0">
                {launchSteps.map((step, index) => (
                  <li key={step.title} className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-lg bg-background p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span>
                      <strong className="block text-sm text-foreground">{step.title}</strong>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20" aria-labelledby="outputs-heading">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <Badge variant="outline" className="mb-3">
                  What gets delivered
                </Badge>
                <h2 id="outputs-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
                  The customer receives working system surfaces, not only a brief.
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/deliverables">View building blocks</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {launchedOutputs.map((output) => (
                <Card key={output.title}>
                  <CardHeader className="pb-3">
                    <output.icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle className="text-base">{output.title}</CardTitle>
                    <CardDescription>{output.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="mb-3">
              Who uses it
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">If you sell the outcome, Lead OS fulfills the system.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The visitor should never wonder what Lead OS is. It is the fulfillment engine between the outcome you sell
              and the client-ready solution your customer receives.
            </p>
          </div>
          <div className="grid gap-3">
            {audienceRows.map(([title, body]) => (
              <div key={title} className="grid gap-1 rounded-lg border border-border bg-card p-4 sm:grid-cols-[10rem_1fr]">
                <strong className="text-sm text-foreground">{title}</strong>
                <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2">
            <Card>
              <CardHeader>
                <BadgeCheck className="mb-2 h-5 w-5 text-primary" />
                <CardTitle>The honest promise</CardTitle>
                <CardDescription>What Lead OS does after a customer buys and submits setup details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Creates the delivery hub and customer-facing capture surfaces.",
                  "Generates embed code, routing rules, dashboards, reports, and finished outputs.",
                  "Tracks what is delivered now and what can be upgraded with client-owned account access.",
                  "Keeps the delivery team focused on selling and improving outcomes, not manually rebuilding fulfillment.",
                ].map((item) => (
                  <div key={item} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-amber-300/50 bg-amber-50 text-amber-950">
              <CardHeader>
                <ShieldCheck className="mb-2 h-5 w-5" />
                <CardTitle>What can connect later</CardTitle>
                <CardDescription className="text-amber-900/80">
                  Lead OS launches the solution first. These outside services connect when client-owned account access is approved.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notLiveUntilConfigured.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <Badge variant="outline" className="mb-3">
                Plans
              </Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Pay for the solution capacity you operate.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Plans control lead volume, funnels, operators, experiments, integrations, and the number of client
                solutions you can run.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/pricing">Compare pricing</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {publicPlans.map((plan) => (
              <Card key={plan.id} className={plan.recommended ? "border-primary" : undefined}>
                <CardHeader>
                  {plan.recommended ? <Badge className="mb-2 w-fit">Recommended</Badge> : null}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-3xl font-extrabold">{plan.price}</p>
                  <p className="mb-5 text-sm text-muted-foreground">{plan.limits}</p>
                  <Button asChild className="w-full" variant={plan.recommended ? "default" : "outline"}>
                    <Link href={`/onboard?plan=${plan.shortId}`}>Start {plan.name} setup</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
