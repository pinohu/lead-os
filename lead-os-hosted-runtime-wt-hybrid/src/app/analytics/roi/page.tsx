import { getRealROIMetrics } from "@/lib/analytics/roi-metrics";

export default async function ROIDashboard() {
  const metrics = await getRealROIMetrics();

  return (
    <main style={{ padding: 40 }}>
      <h1>Real ROI Dashboard</h1>

      <section>
        <h2>Overall</h2>
        <div>Total Revenue: ${metrics.totalRevenue}</div>
        <div>Closed Deals: {metrics.closedDeals}</div>
      </section>

      <section>
        <h2>ROI by Provider</h2>
        {metrics.roiByOwner.map(r => (
          <div key={r.owner + r.node}>
            Owner {r.owner} ({r.node}): Revenue ${r.revenue} / Cost ${r.cost} → ROI {r.roi.toFixed(2)}
          </div>
        ))}
      </section>
    </main>
  );
}
