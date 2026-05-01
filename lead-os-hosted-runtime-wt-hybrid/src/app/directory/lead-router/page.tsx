import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ClipboardCheck, MapPinned, RadioTower, Route, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  directoryAudiences,
  directoryCategories,
  directoryFlowSteps,
  directoryNicheExamples,
  directorySolutionPackages,
  directorySurfaces,
} from "@/lib/directory-solution";
import { provisionablePackages } from "@/lib/package-catalog";
import { buildOgImageUrl } from "@/lib/og-url";
import { tenantConfig } from "@/lib/tenant";

const brandName = tenantConfig.brandName || "Lead OS";

export const metadata: Metadata = {
  title: `Directory Lead Router | ${brandName}`,
  description:
    "A frontend representation of the directory monetization system: public category intake, buyer routing, billing gate, delivery handoff, lead marketplace, and reporting surfaces.",
  openGraph: {
    title: "Directory Lead Router",
    description: "Turn directory traffic into routed, monetizable lead demand.",
    images: [{ url: buildOgImageUrl("Directory Lead Router", "Category intake, buyer routing, billing, delivery, and reporting"), width: 1200, height: 630 }],
  },
};

const iconMap = [MapPinned, Route, ShieldCheck, RadioTower, ClipboardCheck];

export default function DirectoryLeadRouterPage() {
  const packages = provisionablePackages.filter((pkg) => directorySolutionPackages.includes(pkg.slug));

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_0.82fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4">
              Directory monetization surface
            </Badge>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
              Turn a directory visit into a routed, billable lead handoff.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              This is the website-facing version of the directory work in the codebase. A directory owner gets a
              category intake path, buyer routing matrix, billing gate, delivery handoff, lead inventory, and outcome
              reporting without handing clients a pile of tools.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/packages/directory-monetization-system">
                  Launch this solution <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/marketplace">View lead marketplace</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-muted/30 p-4" aria-label="Directory route snapshot">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Seeded route example</p>
                <p className="text-xs text-muted-foreground">Erie is the first configured tenant pattern.</p>
              </div>
              <Badge variant="outline">B2B2C</Badge>
            </div>
            <div className="grid gap-3">
              {[
                ["Tenant", "erie"],
                ["Categories", "plumbing, hvac"],
                ["Buyer nodes", "plumber_erie_test_1, hvac_erie_test_1"],
                ["Delivery", "CRM, automation webhook, generic webhook, or simulated handoff"],
                ["Audit", "lead_os_directory_routes plus canonical events"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="audience-heading">
        <div className="mb-6 max-w-3xl">
          <Badge variant="outline" className="mb-3">
            Who the directory serves
          </Badge>
          <h2 id="audience-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
            One system, four visible customer experiences.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {directoryAudiences.map((audience) => (
            <Card key={audience.title}>
              <CardHeader>
                <CardTitle className="text-base">{audience.title}</CardTitle>
                <CardDescription>{audience.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <Badge variant="outline" className="mb-3">
                Route flow
              </Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                The frontend now shows what the backend actually does.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/docs/erie-pro">Read implementation runbook</Link>
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {directoryFlowSteps.map((step, index) => {
              const Icon = iconMap[index] ?? Route;
              return (
                <Card key={step.title}>
                  <CardHeader>
                    <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription>{step.surface}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="routing-matrix" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-3">
              Routing matrix
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Categories resolve into buyer nodes, price bands, and delivery paths.
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/docs/source/src/lib/erie/directory-lead-flow.ts">View source reference</Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Buyer node</TableHead>
                <TableHead>Price band</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directoryCategories.map((category) => (
                <TableRow key={category.key}>
                  <TableCell className="font-medium">{category.label}</TableCell>
                  <TableCell>{category.market}</TableCell>
                  <TableCell>{category.urgency}</TableCell>
                  <TableCell>{category.buyer}</TableCell>
                  <TableCell>{category.priceBand}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section id="intake-preview" className="border-y border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <Badge variant="outline" className="mb-3">
              Public intake preview
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              The requester sees a simple form, not the routing machinery.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              These are the fields the directory needs to route a request immediately after submission. The operator can
              swap categories, markets, buyer rules, and delivery destinations without changing the customer experience.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Category", "Plumbing, HVAC, roofing, dental, legal, SaaS"],
                ["Location", "City, ZIP, territory, service area"],
                ["Urgency", "Emergency, this week, researching, recurring need"],
                ["Contact", "Name, email, phone, preferred response path"],
                ["Problem", "Plain-language description of what the requester needs"],
                ["Consent", "Permission and routing disclosure for the lead handoff"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-3">
              Exposed surfaces
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              The directory work is now visible as website pages.
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {directorySurfaces.map((surface) => (
            <Card key={surface.title}>
              <CardHeader>
                <CardTitle className="text-base">{surface.title}</CardTitle>
                <CardDescription>{surface.body}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={surface.href} className="text-sm font-semibold text-primary">
                  Open surface <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 max-w-3xl">
            <Badge variant="outline" className="mb-3">
              Modular packages
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              The directory can ship alone or combine with marketplace, franchise, and local-service offers.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => (
              <Card key={pkg.slug}>
                <CardHeader>
                  <CardTitle className="text-base">{pkg.title}</CardTitle>
                  <CardDescription>{pkg.customerOutcome}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{pkg.launchPromise}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/packages/${pkg.slug}`}>Open package</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <BadgeDollarSign className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Portable across niches</CardTitle>
            <CardDescription>
              Erie is only the seeded example. The same frontend and routing pattern works for many directory categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {directoryNicheExamples.map((example) => (
                <Badge key={example} variant="outline">
                  {example}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What the client receives</CardTitle>
            <CardDescription>A complete solution: pages, route logic, buyer handoffs, monetization, and reports.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              "Category intake page",
              "Buyer onboarding form",
              "Routing matrix",
              "Billing and subscription gate",
              "Delivery hub handoff",
              "Claimable lead inventory",
              "Attribution report",
              "Revenue ledger view",
            ].map((item) => (
              <div key={item} className="rounded-md border border-border bg-background p-3 text-sm font-medium">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
