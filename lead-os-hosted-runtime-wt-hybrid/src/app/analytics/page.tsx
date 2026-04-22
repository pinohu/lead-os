import { getRevenueMetrics } from "@/lib/analytics/metrics";

export default async function AnalyticsPage() {
  const metrics = await getRevenueMetrics();

  return (
    <main style={{ padding: 40 }}>
      <h1>Revenue & Performance Dashboard</h1>

      <section>
        <h2>Revenue Overview</h2>
        <ul>
          <li>Total Leads: {metrics.totalLeads}</li>
          <li>Active Subscriptions: {metrics.activeSubs}</li>
          <li>Estimated MRR: ${metrics.estimatedMRR}</li>
        </ul>
      </section>

      <section>
        <h2>Delivery Performance</h2>
        <ul>
          <li>Success Rate: {metrics.successRate.toFixed(2)}%</li>
          <li>Dead Letters: {metrics.deadLetters}</li>
        </ul>
      </section>
    </main>
  );
}
