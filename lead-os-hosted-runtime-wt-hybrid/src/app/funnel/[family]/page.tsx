import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdaptiveLeadCaptureForm } from "@/components/AdaptiveLeadCaptureForm";
import { ExperienceScaffold } from "@/components/ExperienceScaffold";
import { getRecipeForFamily } from "@/lib/automation";
import { getNiche } from "@/lib/catalog";
import { resolveExperienceProfile } from "@/lib/experience";
import { buildDefaultFunnelGraphs } from "@/lib/funnel-library";
import type { FunnelFamily } from "@/lib/runtime-schema";
import { tenantConfig } from "@/lib/tenant";

export async function generateMetadata({ params }: FunnelFamilyPageProps): Promise<Metadata> {
  const { family } = await params;
  const label = family.charAt(0).toUpperCase() + family.slice(1).replace(/-/g, " ");
  return {
    title: `${label} Funnel | Lead OS`,
    description: `Explore the ${label} funnel family — adaptive lead capture, scoring, and nurture automation.`,
  };
}

type FunnelFamilyPageProps = {
  params: Promise<{ family: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value: string | string[] | undefined) {
  const normalized = asString(value)?.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function asIntent(value: string | string[] | undefined): "discover" | "compare" | "solve-now" | undefined {
  const normalized = asString(value);
  return normalized === "discover" || normalized === "compare" || normalized === "solve-now"
    ? normalized
    : undefined;
}

export default async function FunnelFamilyPage({ params, searchParams }: FunnelFamilyPageProps) {
  const { family } = await params;
  const query = await searchParams;
  const graphs = buildDefaultFunnelGraphs(tenantConfig.tenantId);
  const graph = graphs[family as keyof typeof graphs];

  if (!graph) notFound();

  const niche = getNiche(asString(query.niche) ?? tenantConfig.defaultNiche);
  const headerStore = await headers();
  const recipe = getRecipeForFamily(graph.family);
  const profile = resolveExperienceProfile({
    family: graph.family,
    niche,
    supportEmail: tenantConfig.supportEmail,
    source: asString(query.source),
    intent: asIntent(query.intent),
    returning: asBoolean(query.returning),
    milestone: asString(query.milestone),
    preferredMode: asString(query.mode),
    score: Number(asString(query.score) ?? 0) || undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
    referrer: headerStore.get("referer") ?? undefined,
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";
  const funnelJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/funnel/${family}#webpage`,
    url: `${baseUrl}/funnel/${family}`,
    name: `${graph.name} for ${niche.label} | Lead OS`,
    description: `Explore the ${graph.name} funnel family — adaptive lead capture, scoring, and nurture automation for ${niche.label}.`,
    isPartOf: { "@id": `${baseUrl}/#website` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(funnelJsonLd) }} />
    <ExperienceScaffold
      eyebrow="Canonical funnel family"
      title={`${graph.name} for ${niche.label}`}
      summary={`${recipe.summary} This surface now adapts the ask, proof order, and fallback path around returning status, device, and intent instead of showing one generic page.`}
      profile={profile}
      metrics={[
        { label: "Goal", value: graph.goal, detail: "Primary outcome this family optimizes for." },
        { label: "Nodes", value: `${graph.nodes.length}`, detail: "Reusable canonical nodes in this graph." },
        { label: "Recipe actions", value: `${recipe.actions.length}`, detail: "Default automation steps already attached." },
      ]}
    >
      <section className="grid md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Canonical nodes</p>
          <h2>Every step has one job</h2>
          <div className="stack-grid">
            {graph.nodes.map((node) => (
              <article key={node.id} className="stack-card">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{node.channel}</p>
                <h3>{node.name}</h3>
                <p className="text-muted-foreground">
                  {node.type} • {node.purpose}
                </p>
              </article>
            ))}
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Automation recipe</p>
          <h2>How the runtime engineers visits two and three</h2>
          <p className="text-muted-foreground">Trigger: {recipe.trigger}</p>
          <ul className="space-y-2">
            {recipe.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      </section>

      <AdaptiveLeadCaptureForm
        source={
          graph.family === "qualification" ? "assessment"
          : graph.family === "chat" ? "chat"
          : graph.family === "webinar" ? "webinar"
          : graph.family === "checkout" ? "checkout"
          : "manual"
        }
        family={graph.family as FunnelFamily}
        niche={niche.slug}
        service={tenantConfig.defaultService}
        pagePath={`/funnel/${graph.family}`}
        returning={asBoolean(query.returning)}
        profile={profile}
      />
    </ExperienceScaffold>
    </>
  );
}
