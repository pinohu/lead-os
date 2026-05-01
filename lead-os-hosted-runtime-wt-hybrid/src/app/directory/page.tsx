import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { nicheCatalog } from "@/lib/catalog";
import { directoryCategories, directoryFlowSteps, directorySurfaces } from "@/lib/directory-solution";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Solution Directory | Lead OS",
  description:
    "Match a client business's industry to the right assessment, calculator, solution, and lead capture path.",
};

export default function DirectoryIndexPage() {
  const niches = Object.values(nicheCatalog);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");

  const directoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/directory#directory`,
    name: "Solution Directory | Lead OS",
    description: "Browse by vertical to match a client business to the right assessment, calculator, solution, and lead capture path.",
    numberOfItems: niches.length,
    itemListElement: niches.map((niche, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: niche.label,
      description: niche.summary,
      url: `${baseUrl}/industries/${niche.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryJsonLd) }} />
    <div>
    <main className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Solution directory</p>
          <h1 className="text-foreground">Find the right client solution by industry</h1>
          <p className="text-lg text-muted-foreground">
            Use this directory to match a business buyer to the right assessment, calculator, solution, and downstream
            lead capture path before launching the system they paid for.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/directory/lead-router">Open directory lead router</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/packages/directory-monetization-system">Launch directory monetization</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Directory stats">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Industries covered</p>
          <h2 className="text-foreground">{niches.length}</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pages per vertical</p>
          <h2 className="text-foreground">4</h2>
          <p className="text-muted-foreground">Industry, Assessment, Guide, Calculator</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Personalization depth</p>
          <h2 className="text-foreground">4 temperatures</h2>
          <p className="text-muted-foreground">Cold, Warm, Hot, Burning</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Router surfaces</p>
          <h2 className="text-foreground">{directorySurfaces.length}</h2>
          <p className="text-muted-foreground">Intake, routing, billing, marketplace, docs, source reference</p>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-3">
              Directory lead router
            </Badge>
            <h2 className="text-foreground">A visible frontend for the directory routing engine</h2>
            <p className="text-muted-foreground">
              The codebase already routes category-based requests through node resolution, billing checks, delivery
              handoffs, and route audit events. This directory now exposes that as a customer-facing solution surface,
              not a hidden implementation detail.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/directory/lead-router">View router experience</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/marketplace">View lead inventory</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {directoryFlowSteps.map((step) => (
              <div key={step.title} className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{step.surface}</p>
                <h3 className="mt-1 text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {directoryCategories.map((category) => (
            <Badge key={category.key} variant="outline">
              {category.label}: {category.priceBand}
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <div className="grid md:grid-cols-3 gap-6">
          {niches.map((niche) => (
            <article key={niche.slug} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{niche.slug}</p>
              <h2 className="text-foreground text-lg m-0">{niche.label}</h2>
              <p className="text-muted-foreground flex-1">{niche.summary}</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <Link href={`/industries/${niche.slug}`} className="text-primary">
                  Industry overview &rarr;
                </Link>
                <Link href={`/assess/${niche.slug}`} className="text-secondary">
                  Take the assessment &rarr;
                </Link>
                <Link href={`/resources/${niche.slug}`} className="text-secondary">
                  Read the guide &rarr;
                </Link>
                <Link href={`/calculator?niche=${niche.slug}`} className="text-secondary">
                  ROI calculator &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 text-center mt-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Not sure where to start?</p>
        <h2 className="text-foreground">Start with a complete solution</h2>
        <p className="text-muted-foreground">
          If you already know the outcome the client business bought, go straight to the solution launch center and collect the
          intake details needed to provision it.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild><Link href="/packages">Launch a solution</Link></Button>
          <Button asChild variant="outline"><Link href="/assess/general">Take the general assessment</Link></Button>
        </div>
      </section>
    </main>
    </div>
    </>
  );
}
