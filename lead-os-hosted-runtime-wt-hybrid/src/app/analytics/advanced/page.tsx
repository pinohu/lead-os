import { getAdvancedMetrics } from "@/lib/analytics/advanced-metrics";

export default async function AdvancedAnalyticsPage() {
  const metrics = await getAdvancedMetrics();

  return (
    <main style={{ padding: 40 }}>
      <h1>Advanced Analytics</h1>

      <section>
        <h2>Top Territories</h2>
        {metrics.topTerritories.map(t => (
          <div key={t.node}>{t.node}: {t.count}</div>
        ))}
      </section>

      <section>
        <h2>Provider ROI</h2>
        {metrics.providerROI.map(p => (
          <div key={p.owner}>Owner {p.owner}: {p.leads} leads (${p.estValue})</div>
        ))}
      </section>

      <section>
        <h2>Churn Risk</h2>
        {metrics.churnRisk.map(c => (
          <div key={c.owner + c.node}>
            {c.owner} - {c.node}: {c.risk}
          </div>
        ))}
      </section>
    </main>
  );
}
