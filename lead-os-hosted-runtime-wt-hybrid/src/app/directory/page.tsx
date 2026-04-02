import Link from "next/link";
import type { Metadata } from "next";
import { nicheCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Business Directory | Lead OS",
  description:
    "Browse our industry directory. Find automation solutions, expert resources, and growth tools for your specific business vertical.",
};

export default function DirectoryIndexPage() {
  const niches = Object.values(nicheCatalog);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";

  const directoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/directory#directory`,
    name: "Business Directory | Lead OS",
    description: "Browse by vertical to discover assessment tools, authority guides, lead capture systems, and proven funnel blueprints designed for your specific business.",
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
    <div data-theme="light" className="[color-scheme:light]">
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Business directory</p>
          <h1>Find the right growth system for your industry</h1>
          <p className="lede">
            Browse by vertical to discover assessment tools, authority guides,
            lead capture systems, and proven funnel blueprints designed for your
            specific business.
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Directory stats">
        <article className="metric-card">
          <p className="eyebrow">Industries covered</p>
          <h2>{niches.length}</h2>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Pages per vertical</p>
          <h2>4</h2>
          <p className="muted">Industry, Assessment, Guide, Calculator</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Personalization depth</p>
          <h2>4 temperatures</h2>
          <p className="muted">Cold, Warm, Hot, Burning</p>
        </article>
      </section>

      <section>
        <div className="grid three">
          {niches.map((niche) => (
            <article key={niche.slug} className="panel flex flex-col gap-3">
              <p className="eyebrow">{niche.slug}</p>
              <h2 className="text-lg m-0">{niche.label}</h2>
              <p className="muted flex-1">{niche.summary}</p>
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

      <section className="panel text-center mt-10">
        <p className="eyebrow">Not sure where to start?</p>
        <h2>Let us match you to the right vertical</h2>
        <p className="muted">
          Take our general assessment and we will recommend the best niche
          configuration, funnel blueprint, and growth path for your business.
        </p>
        <div className="cta-row justify-center">
          <Link href="/assess/general" className="primary">Take the general assessment</Link>
          <Link href="/contact" className="secondary">Talk to a human</Link>
        </div>
      </section>
    </main>
    </div>
    </>
  );
}
