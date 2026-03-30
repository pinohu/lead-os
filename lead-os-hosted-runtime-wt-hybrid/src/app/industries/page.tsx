import Link from "next/link";
import type { Metadata } from "next";
import { nicheCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Industries | Lead OS",
  description:
    "Explore growth systems, lead capture funnels, and automation infrastructure purpose-built for your industry. Discover how Lead OS adapts to the way your business actually works.",
};

export default function IndustriesPage() {
  const niches = Object.values(nicheCatalog);

  return (
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-copy">
          <p className="eyebrow">Industries we serve</p>
          <h1>Growth systems built for your industry</h1>
          <p className="lede">
            Every industry has different lead sources, sales cycles, and
            compliance requirements. Lead OS ships pre-configured funnels,
            scoring rules, and automation playbooks tuned to the way your
            market actually buys.
          </p>
        </div>
      </section>

      <section className="grid two" style={{ gap: "var(--space-4)" }}>
        {niches.map((niche) => (
          <article key={niche.slug} className="panel">
            <p className="eyebrow">{niche.label}</p>
            <p>{niche.summary}</p>
            <div className="cta-row">
              <Link href={`/industries/${niche.slug}`} className="primary">
                Explore {niche.label}
              </Link>
              <Link href={`/assess/${niche.slug}`} className="secondary">
                Take the Assessment
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
