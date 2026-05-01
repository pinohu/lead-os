import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { provisionablePackages } from "@/lib/package-catalog";
import { liveDeliverables } from "@/lib/live-deliverables";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Live Examples | Lead OS",
  description:
    "View full Lead OS package and deliverable examples that match what the backend can provision in production.",
};

const featuredPackages = provisionablePackages.slice(0, 6);
const featuredDeliverables = liveDeliverables.slice(0, 6);

export default function DemoPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");

  const exampleJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/demo#examples`,
    name: "Lead OS Live Examples",
    description: "Package and deliverable examples matching production-provisioned Lead OS outputs.",
    numberOfItems: featuredPackages.length + featuredDeliverables.length,
    itemListElement: [
      ...featuredPackages.map((pkg, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: pkg.title,
        description: pkg.customerOutcome,
        url: `${baseUrl}/packages/${pkg.slug}`,
      })),
      ...featuredDeliverables.map((deliverable, i) => ({
        "@type": "ListItem",
        position: featuredPackages.length + i + 1,
        name: deliverable.title,
        description: deliverable.buyerOutcome,
        url: `${baseUrl}${deliverable.livePath}`,
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(exampleJsonLd) }} />
      <main className="w-full max-w-none overflow-x-hidden p-0">
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.78fr] lg:items-start">
            <div>
              <Badge variant="secondary" className="mb-4">
                Live examples
              </Badge>
              <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
                See the same outputs Lead OS can provision for a paying client.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                These are not strategy PDFs. Use this page to inspect the package detail pages and the live deliverable
                surfaces that match the backend catalog.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/packages">
                    Launch a complete package <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/deliverables">Inspect building blocks</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-muted/35 p-4" aria-label="How to use examples">
              <h2 className="text-base font-bold text-foreground">How to read this page</h2>
              <ul className="mt-3 grid gap-3 pl-0 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Package examples show what a customer can buy.",
                  "Deliverable examples show the individual surfaces inside those packages.",
    "A real launch starts on the solution page and uses the intake form.",
                  "Provider-backed actions activate when the required credentials are present.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6">
            <Badge variant="outline" className="mb-3">
              Complete packages
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              These are the full outcomes an operator sells.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredPackages.map((pkg) => (
              <Card key={pkg.slug} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.title}</CardTitle>
                  <CardDescription>{pkg.customerOutcome}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="mb-4 text-sm text-muted-foreground">{pkg.launchPromise}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/packages/${pkg.slug}`}>
                      View package <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6">
              <Badge variant="outline" className="mb-3">
                Built surfaces
              </Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                These are examples of the pieces inside the packages.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredDeliverables.map((deliverable) => (
                <Card key={deliverable.slug} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                    <CardDescription>{deliverable.buyerOutcome}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button asChild variant="outline" size="sm">
                      <Link href={deliverable.livePath}>
                        Open surface <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
