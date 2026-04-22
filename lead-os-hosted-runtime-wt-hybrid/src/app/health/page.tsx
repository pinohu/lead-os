import { getSystemMetrics } from "@/lib/monitoring/metrics";

export default async function HealthPage() {
  const metrics = await getSystemMetrics();

  return (
    <main style={{ padding: 40 }}>
      <h1>System Health</h1>
      <div>Total Leads: {metrics.totalLeads}</div>
      <div>Jobs: {metrics.totalJobs}</div>
      <div>Pending: {metrics.pendingJobs}</div>
      <div>Failed: {metrics.failedJobs}</div>
      <div>Dead Letters: {metrics.deadLetters}</div>
      <div>Active Subs: {metrics.activeSubscriptions}</div>
    </main>
  );
}
