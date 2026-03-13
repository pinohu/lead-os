import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { buildFunnelGraph, getImplementedBlueprintIds } from "@/lib/funnel-implementation";
import { normalizeNicheSlug } from "@/lib/funnel-blueprints";

type FunnelPageProps = {
  params: Promise<{ blueprint: string; step?: string[] }>;
  searchParams: Promise<{ niche?: string }>;
};

export function generateStaticParams() {
  return getImplementedBlueprintIds().map((blueprint) => ({ blueprint }));
}

export default async function FunnelPage({ params, searchParams }: FunnelPageProps) {
  const { blueprint, step } = await params;
  const { niche } = await searchParams;
  const graph = buildFunnelGraph(blueprint, normalizeNicheSlug(niche));

  if (!graph) {
    notFound();
  }

  const routeStep = step?.[0];
  const activeNode =
    graph.nodes.find((node) => node.implementation.routeSegment === routeStep || node.id === routeStep) ??
    graph.nodes[0];

  if (!activeNode) {
    notFound();
  }

  const currentIndex = graph.nodes.findIndex((node) => node.id === activeNode.id);
  const previousNode = currentIndex > 0 ? graph.nodes[currentIndex - 1] : null;
  const nextNode = currentIndex < graph.nodes.length - 1 ? graph.nodes[currentIndex + 1] : null;

  return (
    <>
      <Navbar />
      <main className="bg-navy pt-28 text-white">
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1 text-sm text-cyan">
            {graph.blueprintName} · {activeNode.type} node
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">{activeNode.implementation.headline}</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">{activeNode.implementation.subheadline}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={activeNode.ctaUrl}
              className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white"
            >
              {activeNode.cta}
            </a>
            <a
              href={`/control-center/funnels/${graph.blueprintId}?niche=${graph.niche}`}
              className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white"
            >
              Inspect Funnel Nodes
            </a>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <h2 className="text-2xl font-semibold">Bespoke page flow</h2>
              <div className="mt-4 space-y-4 text-slate-300">
                {activeNode.implementation.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {activeNode.implementation.proofPoints.map((point) => (
                  <div key={point} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Node Context</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div><strong className="text-white">Blueprint:</strong> {graph.blueprintName}</div>
                <div><strong className="text-white">Niche:</strong> {graph.niche}</div>
                <div><strong className="text-white">Current Step:</strong> {activeNode.id}</div>
                <div><strong className="text-white">Previous:</strong> {previousNode?.id ?? "entry"}</div>
                <div><strong className="text-white">Next:</strong> {nextNode?.id ?? "completion"}</div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Dedicated Assets</h2>
              <div className="mt-4 space-y-3">
                {activeNode.implementation.assets.map((asset) => (
                  <div key={asset.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{asset.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan">{asset.type}</div>
                    <div className="mt-2 text-sm text-slate-300">{asset.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Post-Step Automations</h2>
              <div className="mt-4 space-y-3">
                {activeNode.implementation.postStepAutomations.map((automation) => (
                  <div key={automation.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{automation.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan">
                      {automation.channel} · {automation.timing}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{automation.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}

