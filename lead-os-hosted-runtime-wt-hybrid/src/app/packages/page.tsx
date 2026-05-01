import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, PackageOpen } from "lucide-react";
import { PackageBundleProvisionForm } from "@/components/PackageBundleProvisionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPackagePlanNames, provisionablePackages } from "@/lib/package-catalog";

export const metadata: Metadata = {
  title: "Complete AI Agency Solutions | Lead OS",
  description:
    "Choose the customer outcome your client bought, collect the required intake details, and launch the complete solution.",
};

const packageRules = [
  "Each product is sold as a complete solution to a business problem, not as software the customer has to operate.",
  "One intake form can launch one solution, a selected bundle, or the full catalog.",
  "Provisioning creates the customer-facing pages, finished assets, routing logic, reports, acceptance checks, and managed handoffs.",
  "Optional CRM, billing, calendar, phone, email, SMS, social, or publishing access improves live integrations but never blocks delivery.",
];

export default function PackagesPage() {
  const deliverableCount = provisionablePackages.reduce((total, pkg) => total + pkg.deliverables.length, 0);

  return (
    <main className="w-full max-w-none overflow-x-hidden p-0">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4">
              Complete solution catalog
            </Badge>
            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
              Sell complete outcomes, not tools.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              This is the fulfillment entry point for productized AI agencies. Pick the business result a customer
              bought, collect the outcome context once, and Lead OS provisions the complete customer-ready solution.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#package-list">
                  View agency solutions <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/onboard">Create operator account</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-muted/35 p-4" aria-label="Solution launch rules">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">What happens after purchase</h2>
            </div>
            <ul className="grid gap-3 pl-0">
              {packageRules.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">{provisionablePackages.length}</p>
            <p className="text-sm text-muted-foreground">Complete agency solutions available to sell and provision.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">{deliverableCount}</p>
            <p className="text-sm text-muted-foreground">Customer-ready pieces across intake, content, voice, ads, routing, reporting, billing, and delivery surfaces.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">1 form</p>
            <p className="text-sm text-muted-foreground">The client intake form drives one, several, or all solutions with managed handoffs and no extra configuration.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <PackageBundleProvisionForm
          packages={provisionablePackages.map((pkg) => ({
            slug: pkg.slug,
            title: pkg.title,
            customerOutcome: pkg.customerOutcome,
          }))}
        />
      </section>

      <section id="package-list" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Badge variant="outline" className="mb-3">
            Sellable customer outcomes
          </Badge>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Choose the result the customer wants, then launch the complete solution.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {provisionablePackages.map((pkg) => (
            <Card key={pkg.slug} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{pkg.deliverables.length} built pieces</Badge>
                </div>
                <CardTitle>{pkg.title}</CardTitle>
                <CardDescription>{pkg.customerOutcome}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="mb-4 grid gap-2 text-sm">
                  <p>
                    <span className="font-semibold text-foreground">Best for:</span>{" "}
                    <span className="text-muted-foreground">{pkg.buyerPersona}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Client receives:</span>{" "}
                    <span className="text-muted-foreground">{pkg.launchPromise}</span>
                  </p>
                  {pkg.pricingModel ? (
                    <p>
                      <span className="font-semibold text-foreground">Suggested pricing:</span>{" "}
                      <span className="text-muted-foreground">{pkg.pricingModel}</span>
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-foreground">Available on:</span>{" "}
                    <span className="text-muted-foreground">{getPackagePlanNames(pkg)}</span>
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/packages/${pkg.slug}`}>
                    Launch this solution <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
