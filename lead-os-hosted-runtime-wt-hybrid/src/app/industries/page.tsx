import Link from "next/link";
import type { Metadata } from "next";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";
import { getIndustryPositioning } from "@/lib/industry-positioning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Industry growth systems | Lead OS",
  description:
    "Choose the buyer, pain, promised outcome, and installed workflow for each industry Lead OS serves.",
};

export default function IndustriesPage() {
  const niches = Object.values(nicheCatalog);
  const positionedNiches = niches.map((niche) => ({
    niche,
    positioning: getIndustryPositioning(niche.slug),
  }));
  const baseUrl = tenantConfig.siteUrl.replace(/\/$/, "");

  const industriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/industries#industries`,
    name: "Industry growth systems | Lead OS",
    description: "Industry-specific outcome pages for client-business solution intake, capture, scoring, routing, and follow-up.",
    numberOfItems: niches.length,
    itemListElement: positionedNiches.map(({ niche, positioning }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: niche.label,
      description: positioning.summary,
      url: `${baseUrl}/industries/${niche.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(industriesJsonLd) }} />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="mb-10 max-w-4xl">
          <Badge variant="secondary" className="mb-4">Industry-specific outcomes</Badge>
          <h1 className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl">
            Every industry page should sound like it has sat inside that business.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            These are not interchangeable templates. Each path names the buyer, the operational pain, the promised
            result, and the form of delivery the client should expect after onboarding.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {positionedNiches.map(({ niche, positioning }) => (
            <article key={niche.slug} className="flex min-h-[360px] flex-col rounded-lg border border-border bg-card p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{positioning.eyebrow}</p>
              <h2 className="mt-3 text-xl font-bold leading-tight text-foreground">{niche.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{positioning.marketTruth}</p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pain</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{positioning.primaryPain}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Result</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{positioning.promisedResult}</p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <Button asChild size="sm">
                  <Link href={`/industries/${niche.slug}`}>Open {niche.label}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/assess/${niche.slug}`}>Check fit</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
