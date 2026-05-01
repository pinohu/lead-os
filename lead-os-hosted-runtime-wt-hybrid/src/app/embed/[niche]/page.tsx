import type { Metadata } from "next";
import { getNiche, nicheCatalog } from "@/lib/catalog";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ niche: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params;
  const niche = getNiche(slug);
  const label = niche?.label ?? slug;
  return {
    title: `${label} Lead Capture | Lead OS`,
    description: `Embeddable lead capture widget for a ${label} package. Collect, score, and route leads.`,
  };
}

export function generateStaticParams() {
  return Object.keys(nicheCatalog).map((niche) => ({ niche }));
}

export default async function EmbedPage({ params }: Props) {
  const { niche: slug } = await params;
  const niche = getNiche(slug);
  if (!niche) notFound();

  // Minimal embed page — no nav, no footer, just the lead capture essentials
  return (
    <main className="max-w-[480px] mx-auto p-6 text-foreground" style={{ fontFamily: "'Trebuchet MS', 'Gill Sans', 'Helvetica Neue', sans-serif" }}>
      <h2 className="text-foreground text-lg font-extrabold mb-2">
        {niche.assessmentTitle}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {niche.summary}
      </p>
      <form
        action="/api/intake"
        method="POST"
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="source" value="widget" />
        <input type="hidden" name="niche" value={niche.slug} />
        <input name="firstName" placeholder="First name" required
          className="px-3.5 py-3 border border-border rounded-lg text-sm" />
        <input name="email" type="email" placeholder="Email" required
          className="px-3.5 py-3 border border-border rounded-lg text-sm" />
        <button type="submit" className="px-5 py-3 border-none rounded-lg bg-primary text-primary-foreground font-bold text-sm cursor-pointer">
          Get your free assessment &rarr;
        </button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">
        No commitment required. Results in under 2 minutes.
      </p>
    </main>
  );
}
