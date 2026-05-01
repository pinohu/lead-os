import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Check, CreditCard, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { notLiveUntilConfigured, publicPlans } from "@/lib/public-offer";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Pricing | Lead OS",
  description:
    "Choose how many client solutions, leads, delivery seats, funnels, and integrations you want to run.",
};

const faq = [
  {
    q: "What am I paying for?",
    a: "You are paying for operating capacity: client solution hubs, leads, funnels, delivery seats, experiments, integrations, and reporting surfaces.",
  },
  {
    q: "What does the client get after they pay me?",
    a: "After the intake form is submitted, Lead OS provisions the selected solution: customer-facing page, embed, routing, dashboard, reports, and solution-specific finished outputs.",
  },
  {
    q: "Do I need every account connection before launch?",
    a: "No. Required intake fields launch the solution. Optional CRM, Stripe, email, SMS, calendar, analytics, and webhook access activate those external services when added.",
  },
  {
    q: "Who is the end customer?",
    a: "Usually your client: a business that wants more qualified leads. You operate the system; their leads submit the intake or embedded form.",
  },
  {
    q: "What should I do first?",
    a: "View Solutions, choose the outcome the client bought, then create an account or launch that solution from its detail page.",
  },
];

export default function PricingPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");

  const pricingFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/#app`,
    name: "Lead OS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Complete solution launch with capture, scoring, routing, dashboards, reports, and managed handoffs.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <main className="w-full max-w-none overflow-x-hidden p-0">
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.72fr] lg:items-start">
            <div>
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
                Choose the capacity for the client solutions you will operate.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Pricing is not a mystery platform fee. Each plan controls how many solutions, leads, funnels, operators,
                experiments, and integrations your account can run.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/packages">Choose a solution first</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/production">Check production readiness</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-muted/35 p-4" aria-label="Pricing explanation">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">How billing maps to delivery</h2>
              </div>
              <ol className="grid gap-3 pl-0">
                {[
                  "The delivery team chooses a plan.",
                  "The client solution launch stores the selected plan and delivery limits.",
                  "Billing gates protected capacity while intake forms and readiness surfaces stay explicit.",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-5 md:grid-cols-3">
            {publicPlans.map((plan) => (
              <Card key={plan.id} className={plan.recommended ? "border-2 border-primary shadow-sm" : undefined}>
                <CardHeader>
                  {plan.recommended ? <Badge className="mb-2 w-fit">Recommended</Badge> : null}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-4xl font-extrabold">
                    {plan.price.replace("/mo", "")}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="mb-5 text-sm text-muted-foreground">{plan.limits}</p>
                  <ul className="space-y-2 pl-0">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant={plan.recommended ? "default" : "outline"} size="lg">
                    <Link href={`/onboard?plan=${plan.shortId}`}>Start {plan.name} setup</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge variant="outline" className="mb-3">
                What the price unlocks
              </Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">A paid plan should lead directly to a provisioned solution.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The plan controls capacity. The solution intake form controls what gets built for the client.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Client intake forms",
                "Solution delivery hubs",
                "Lead intake and embeds",
                "Routing and scoring rules",
                "Operations dashboards",
                "Reports and revenue surfaces",
              ].map((item) => (
                <div key={item} className="flex gap-2 rounded-lg border border-border bg-card p-4 text-sm">
                  <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-8 rounded-lg border border-amber-300/50 bg-amber-50 p-5 text-amber-950">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="text-base font-semibold">Account access your client may need to approve</h2>
                <p className="mt-1 text-sm leading-relaxed">
                  Lead OS creates the base solution outputs first. These outside services turn on only when required
                  client-owned accounts are connected.
                </p>
                <ul className="mt-4 grid gap-2 pl-0 text-sm md:grid-cols-2">
                  {notLiveUntilConfigured.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <section className="grid gap-3 md:grid-cols-2" aria-label="Pricing questions">
            {faq.map((item) => (
              <details key={item.q} className="rounded-lg border border-border p-5">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </section>
        </section>
      </main>
    </>
  );
}
