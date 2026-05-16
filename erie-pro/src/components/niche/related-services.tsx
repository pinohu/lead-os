// ── Niche Related Services ───────────────────────────────────────────
// Curated, not the full wall of all 112 niches. Picks related niches via
// search-term keyword overlap with the current niche. Falls back to
// high-traffic top niches when there's no signal.

import Link from "next/link";
import { niches, type LocalNiche } from "@/lib/niches";

interface Props {
  nicheSlug: string;
  nicheLabel: string;
}

function tokensOf(niche: LocalNiche): Set<string> {
  const all = [niche.label, ...niche.searchTerms, niche.description]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4); // drop stop-words and short tokens
  return new Set(all);
}

function relatedNiches(currentSlug: string): LocalNiche[] {
  const current = niches.find((n) => n.slug === currentSlug);
  if (!current) return [];
  const currentTokens = tokensOf(current);

  const scored = niches
    .filter((n) => n.slug !== currentSlug)
    .map((n) => {
      const tks = tokensOf(n);
      let overlap = 0;
      for (const t of tks) if (currentTokens.has(t)) overlap++;
      return { niche: n, score: overlap };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map((s) => s.niche);
}

// High-traffic top-up when keyword overlap is thin
const TOP_TRAFFIC = [
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "restoration",
  "landscaping",
  "handyman",
  "garage-door",
  "tree-service",
  "cleaning",
];

export default function NicheRelatedServices({
  nicheSlug,
  nicheLabel,
}: Props) {
  const overlapBased = relatedNiches(nicheSlug);
  const items: LocalNiche[] = [...overlapBased];
  for (const t of TOP_TRAFFIC) {
    if (items.length >= 8) break;
    if (t !== nicheSlug && !items.some((n) => n.slug === t)) {
      const n = niches.find((x) => x.slug === t);
      if (n) items.push(n);
    }
  }

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
    >
      <h2
        id="related-heading"
        className="mb-4 text-lg font-bold tracking-tight"
      >
        Related to {nicheLabel.toLowerCase()}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 8).map((n) => (
          <Link
            key={n.slug}
            href={`/${n.slug}`}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span aria-hidden="true" className="text-2xl">
              {n.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight group-hover:text-primary">
                {n.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {n.avgProjectValue}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
