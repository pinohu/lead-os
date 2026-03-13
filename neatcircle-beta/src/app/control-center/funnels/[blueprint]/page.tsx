import Link from "next/link";
import { notFound } from "next/navigation";
import { buildFunnelGraph, getImplementedBlueprintIds } from "@/lib/funnel-implementation";
import { normalizeNicheSlug } from "@/lib/funnel-blueprints";

type InspectorPageProps = {
  params: Promise<{ blueprint: string }>;
  searchParams: Promise<{ niche?: string }>;
};

export function generateStaticParams() {
  return getImplementedBlueprintIds().map((blueprint) => ({ blueprint }));
}

export default async function FunnelInspectorPage({ params, searchParams }: InspectorPageProps) {
  const { blueprint } = await params;
  const { niche } = await searchParams;
  const graph = buildFunnelGraph(blueprint, normalizeNicheSlug(niche));

  if (!graph) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-navy px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm uppercase tracking-[0.3em] text-cyan">Funnel Inspector</div>
          <h1 className="mt-4 text-5xl font-bold">{graph.blueprintName}</h1>
          <p className="mt-3 text-slate-300">
            Inspect the internal node connections, dedicated assets, and automation handoffs for this funnel.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Node Graph</h2>
            <div className="mt-6 space-y-4">
              {graph.nodes.map((node) => {
                const nodeEdges = graph.edges.filter((edge) => edge.from === node.id);
                return (
                  <div key={node.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-cyan">{node.type}</div>
                        <div className="mt-1 text-xl font-semibold text-white">{node.headline}</div>
                        <div className="mt-1 text-sm text-slate-300">{node.subtext}</div>
                      </div>
                      <Link
                        href={`/funnels/${graph.blueprintId}/${node.id}?niche=${graph.niche}`}
                        className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-navy"
                      >
                        Open Node
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm font-semibold text-white">Outgoing Connections</div>
                        <div className="mt-2 space-y-2 text-sm text-slate-300">
                          {nodeEdges.map((edge) => (
                            <div key={`${edge.from}-${edge.to}-${edge.trigger}`} className="rounded-xl border border-white/10 px-3 py-2">
                              <div><strong className="text-white">{edge.label}</strong></div>
                              <div>To: {edge.to}</div>
                              <div>Trigger: {edge.trigger}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white">Post-Step Automations</div>
                        <div className="mt-2 space-y-2 text-sm text-slate-300">
                          {node.implementation.postStepAutomations.map((automation) => (
                            <div key={automation.id} className="rounded-xl border border-white/10 px-3 py-2">
                              <div><strong className="text-white">{automation.name}</strong></div>
                              <div>{automation.channel} · {automation.timing}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Graph Summary</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div><strong className="text-white">Blueprint ID:</strong> {graph.blueprintId}</div>
                <div><strong className="text-white">Niche:</strong> {graph.niche}</div>
                <div><strong className="text-white">Node Count:</strong> {graph.nodes.length}</div>
                <div><strong className="text-white">Edge Count:</strong> {graph.edges.length}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Blueprint Coverage</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>Every node now has:</div>
                <div>- a dedicated runtime page</div>
                <div>- asset recommendations</div>
                <div>- explicit post-step automation definitions</div>
                <div>- inspectable default and recovery connections</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

