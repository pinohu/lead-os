import Link from "next/link";

interface RevenueData {
  totalRevenue: number;
  revenueTrend: number;
  previousRevenue: number;
  revenueByNiche: Record<string, number>;
  revenueBySource: Record<string, number>;
  revenueByChannel: Record<string, number>;
  revenueByFunnel: Record<string, number>;
  revenueByOffer: Record<string, number>;
  ltvCacRatio: number;
  avgLtv: number;
  avgCac: number;
  ltvSegments: Array<{ tier: string; avgLTV: number; count: number }>;
  conversionByTier: Record<string, number>;
  scoreTierCounts: Record<string, { total: number; converted: number }>;
  topLeadsByValue: Array<{ leadId: string; ltv: number }>;
  forecast: { forecast30d: number; forecast90d: number; dailyRevenues: number[] };
  revenuePathMetrics: {
    trafficVolume: number;
    captureRate: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  period: string;
}

async function fetchRevenueData(): Promise<RevenueData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/revenue/command?tenantId=default`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function BarChart({ data, maxValue }: { data: Array<{ label: string; value: number }>; maxValue: number }) {
  if (data.length === 0) {
    return <p style={{ color: "var(--text-muted, #666)", fontSize: "0.875rem" }}>No data available</p>;
  }

  return (
    <div role="list" aria-label="Revenue distribution" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((item) => {
        const widthPct = maxValue > 0 ? Math.max(2, (item.value / maxValue) * 100) : 0;
        return (
          <div key={item.label} role="listitem" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 120, fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
            <div style={{ flex: 1, height: 22, background: "rgba(0,0,0,0.05)", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #0d6efd, #0dcaf0)",
                  borderRadius: 4,
                  transition: "width 0.3s ease",
                }}
                aria-label={`${item.label}: ${formatCurrency(item.value)}`}
              />
            </div>
            <span style={{ width: 90, textAlign: "right", fontSize: "0.8rem", fontWeight: 700 }}>
              {formatCurrency(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid rgba(20, 33, 29, 0.1)",
        borderRadius: 12,
        padding: 20,
        background: "rgba(255,255,255,0.55)",
      }}
    >
      <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function MetricBox({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 16px" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted, #666)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{value}</p>
      {subtitle && <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #666)", margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

export default async function RevenueCommandPage() {
  const data = await fetchRevenueData();

  if (!data) {
    return (
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px" }}>
        <h1>Revenue Command Dashboard</h1>
        <p>Unable to load revenue data. Please check your configuration and try again.</p>
        <Link href="/dashboard" style={{ color: "#0d6efd", textDecoration: "underline" }}>
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const nicheData = Object.entries(data.revenueByNiche)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const nicheMax = nicheData.length > 0 ? nicheData[0].value : 0;

  const sourceData = Object.entries(data.revenueBySource)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const sourceMax = sourceData.length > 0 ? sourceData[0].value : 0;

  const channelData = Object.entries(data.revenueByChannel)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const channelMax = channelData.length > 0 ? channelData[0].value : 0;

  const funnelData = Object.entries(data.revenueByFunnel)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const funnelMax = funnelData.length > 0 ? funnelData[0].value : 0;

  const offerData = Object.entries(data.revenueByOffer)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const offerMax = offerData.length > 0 ? offerData[0].value : 0;

  const trendArrow = data.revenueTrend > 0 ? "\u2191" : data.revenueTrend < 0 ? "\u2193" : "\u2192";
  const trendColor = data.revenueTrend > 0 ? "#198754" : data.revenueTrend < 0 ? "#dc3545" : "#6c757d";

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px" }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted, #666)" }}>
          Revenue Command Center
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "4px 0 8px" }}>Revenue Dashboard</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #666)" }}>
          Period: {data.period} | Single source of truth for all revenue decisions.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
          border: "1px solid rgba(20, 33, 29, 0.1)",
          borderRadius: 12,
          background: "rgba(255,255,255,0.55)",
          padding: "8px 0",
        }}
      >
        <MetricBox
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          subtitle={`${trendArrow} ${formatPercent(data.revenueTrend)} vs prior`}
        />
        <MetricBox label="LTV:CAC Ratio" value={`${data.ltvCacRatio}:1`} subtitle={`LTV ${formatCurrency(data.avgLtv)} / CAC ${formatCurrency(data.avgCac)}`} />
        <MetricBox label="Avg Order Value" value={formatCurrency(data.revenuePathMetrics.avgOrderValue)} />
        <MetricBox label="Conversion Rate" value={`${data.revenuePathMetrics.conversionRate}%`} />
        <MetricBox label="30d Forecast" value={formatCurrency(data.forecast.forecast30d)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card title="Revenue by Niche">
          <BarChart data={nicheData} maxValue={nicheMax} />
        </Card>
        <Card title="Revenue by Source / Channel">
          <BarChart data={sourceData} maxValue={sourceMax} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card title="Revenue by Channel Performance">
          <BarChart data={channelData} maxValue={channelMax} />
        </Card>
        <Card title="Revenue by Funnel Family">
          <BarChart data={funnelData} maxValue={funnelMax} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card title="Revenue by Offer Variant">
          <BarChart data={offerData} maxValue={offerMax} />
        </Card>
        <Card title="LTV Segments">
          <div role="list" aria-label="LTV segments" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.ltvSegments.map((seg) => (
              <div key={seg.tier} role="listitem" style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}>
                <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{seg.tier}</span>
                <span>{seg.count} leads</span>
                <span style={{ fontWeight: 700 }}>Avg LTV: {formatCurrency(seg.avgLTV)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card title="Conversion Rate by Lead Score Tier">
          <div role="list" aria-label="Conversion rates by score tier" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(data.conversionByTier).map(([tier, rate]) => {
              const tierCount = data.scoreTierCounts[tier];
              return (
                <div key={tier} role="listitem" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 70, fontSize: "0.85rem", fontWeight: 700 }}>Score {tier}</span>
                  <div style={{ flex: 1, height: 22, background: "rgba(0,0,0,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, rate)}%`,
                        height: "100%",
                        background: rate > 10 ? "#198754" : rate > 5 ? "#ffc107" : "#dc3545",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span style={{ width: 60, textAlign: "right", fontSize: "0.8rem", fontWeight: 700 }}>{rate}%</span>
                  <span style={{ width: 80, textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted, #666)" }}>
                    {tierCount?.converted ?? 0}/{tierCount?.total ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Revenue Forecast">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(13,110,253,0.06)", borderRadius: 8 }}>
              <span style={{ fontWeight: 600 }}>30-day forecast</span>
              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{formatCurrency(data.forecast.forecast30d)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(13,110,253,0.06)", borderRadius: 8 }}>
              <span style={{ fontWeight: 600 }}>90-day forecast</span>
              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{formatCurrency(data.forecast.forecast90d)}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #666)", margin: "4px 0 0" }}>
              Based on linear projection from {data.forecast.dailyRevenues.length} daily data points.
            </p>
          </div>
        </Card>
      </div>

      <Card title="Top 10 Leads by Predicted Value">
        {data.topLeadsByValue.length === 0 ? (
          <p style={{ color: "var(--text-muted, #666)", fontSize: "0.875rem" }}>No leads with predicted value available.</p>
        ) : (
          <div role="list" aria-label="Top leads by value" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {data.topLeadsByValue.map((lead, i) => (
              <div
                key={lead.leadId}
                role="listitem"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem" }}>
                  <strong>#{i + 1}</strong>{" "}
                  {lead.leadId.length > 16 ? `${lead.leadId.slice(0, 16)}...` : lead.leadId}
                </span>
                <span style={{ fontWeight: 700, color: trendColor }}>{formatCurrency(lead.ltv)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
