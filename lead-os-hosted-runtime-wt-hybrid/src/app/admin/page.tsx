import { getOperatorDashboardData } from "@/lib/admin/operator-metrics";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, minWidth: 180 }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminDashboard() {
  const data = await getOperatorDashboardData();

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Operator Control Panel</h1>
      <p style={{ color: "#4b5563", marginBottom: 20 }}>
        Live operating view for pricing approvals, territory performance, churn risk, and delivery reliability.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <MetricCard label="Total Revenue" value={`$${data.kpis.totalRevenue}`} />
        <MetricCard label="Active Providers" value={data.kpis.activeProviders} />
        <MetricCard label="Pending Approvals" value={data.kpis.pendingApprovals} />
        <MetricCard label="High Risk Accounts" value={data.kpis.highRiskAccounts} />
        <MetricCard label="Dead Letters" value={data.kpis.deadLetters} />
      </div>

      <Section title="Pricing Recommendations">
        <div style={{ display: "grid", gap: 12 }}>
          {data.pricingRecommendations.length === 0 ? (
            <div>No pricing recommendations found.</div>
          ) : (
            data.pricingRecommendations.map((rec: any) => (
              <div key={rec.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700 }}>{rec.node_id || rec.nodeId || "Unknown node"}</div>
                <div style={{ marginTop: 6, color: "#374151" }}>
                  Current: ${rec.current_price_cents ?? rec.currentPrice ?? 0} → Recommended: ${rec.recommended_price_cents ?? rec.recommendedPrice ?? 0}
                </div>
                <div style={{ marginTop: 6, color: "#6b7280" }}>Status: {rec.status || "proposed"}</div>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Top Territories">
        <div style={{ display: "grid", gap: 12 }}>
          {data.territories.map((territory: any) => (
            <div key={territory.nodeId} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700 }}>{territory.nodeId}</div>
              <div style={{ marginTop: 6 }}>Leads: {territory.leads}</div>
              <div>Revenue: ${territory.revenue}</div>
              <div>ROI: {territory.roi.toFixed(2)}</div>
              <div>Risk: {territory.risk}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Risk Watchlist">
        <div style={{ display: "grid", gap: 12 }}>
          {data.riskWatchlist.map((item: any) => (
            <div key={`${item.ownerId}:${item.nodeId}`} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700 }}>{item.ownerId}</div>
              <div style={{ marginTop: 6 }}>Node: {item.nodeId}</div>
              <div>Leads: {item.leads}</div>
              <div>Revenue: ${item.revenue}</div>
              <div>Risk: {item.risk}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Dead Letter Queue">
        <div style={{ display: "grid", gap: 12 }}>
          {data.deadLetters.length === 0 ? (
            <div>No dead-letter jobs queued.</div>
          ) : (
            data.deadLetters.map((item: any) => (
              <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700 }}>{item.channel}</div>
                <div style={{ marginTop: 6 }}>Owner: {item.owner_id}</div>
                <div>Created: {item.created_at}</div>
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}
