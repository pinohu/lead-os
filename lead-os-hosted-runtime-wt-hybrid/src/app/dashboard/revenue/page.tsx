import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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

const DEMO_REVENUE: RevenueData = {
  totalRevenue: 47850,
  revenueTrend: 12.4,
  previousRevenue: 42569,
  revenueByNiche: { plumbing: 12400, hvac: 9800, electrical: 7600, roofing: 6200, landscaping: 4850, "pest-control": 3500, cleaning: 2200, painting: 1300 },
  revenueBySource: { organic: 18400, referral: 14200, direct: 8600, "paid-search": 4850, social: 1800 },
  revenueByChannel: { form: 22100, chat: 12400, voice: 7800, email: 5550 },
  revenueByFunnel: { qualification: 19200, "lead-magnet": 14600, chat: 8400, checkout: 5650 },
  revenueByOffer: { "exclusive-territory": 28500, "lead-purchase": 12400, "premium-placement": 6950 },
  ltvCacRatio: 4.2,
  avgLtv: 1847,
  avgCac: 439,
  ltvSegments: [
    { tier: "burning", avgLTV: 3800, count: 19 },
    { tier: "hot", avgLTV: 2100, count: 39 },
    { tier: "warm", avgLTV: 950, count: 58 },
    { tier: "cold", avgLTV: 280, count: 31 },
  ],
  conversionByTier: { burning: 0.74, hot: 0.48, warm: 0.22, cold: 0.07 },
  scoreTierCounts: {
    "80-100": { total: 19, converted: 14 },
    "60-79": { total: 39, converted: 19 },
    "40-59": { total: 58, converted: 13 },
    "0-39": { total: 31, converted: 2 },
  },
  topLeadsByValue: [
    { leadId: "lead-001", ltv: 6200 },
    { leadId: "lead-002", ltv: 4800 },
    { leadId: "lead-003", ltv: 3900 },
    { leadId: "lead-004", ltv: 3100 },
    { leadId: "lead-005", ltv: 2700 },
  ],
  forecast: {
    forecast30d: 52400,
    forecast90d: 164000,
    dailyRevenues: [1200, 1800, 1400, 2100, 1600, 1900, 2300, 1700, 2000, 1500, 2200, 1800, 1600, 2400, 1900, 2100, 1700, 2300, 1800, 2000, 1600, 2200, 1900, 1700, 2100, 1800, 2300, 2000, 1900, 2500],
  },
  revenuePathMetrics: {
    trafficVolume: 4820,
    captureRate: 3.1,
    conversionRate: 18.4,
    avgOrderValue: 325,
  },
  period: "last-30-days",
};

async function fetchRevenueData(): Promise<RevenueData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/revenue/command?tenantId=default`, {
      cache: "no-store",
    });
    if (!res.ok) return DEMO_REVENUE;
    const json = await res.json();
    return json.data ?? DEMO_REVENUE;
  } catch {
    return DEMO_REVENUE;
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
    return <p className="text-sm text-muted-foreground">No data available</p>;
  }

  return (
    <div role="list" aria-label="Revenue distribution" className="flex flex-col gap-2">
      {data.map((item) => {
        const widthPct = maxValue > 0 ? Math.max(2, (item.value / maxValue) * 100) : 0;
        return (
          <div key={item.label} role="listitem" className="flex items-center gap-3">
            <span className="w-[120px] text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
              {item.label}
            </span>
            <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded transition-all duration-300"
                style={{ width: `${widthPct}%` }}
                aria-label={`${item.label}: ${formatCurrency(item.value)}`}
              />
            </div>
            <span className="w-[90px] text-right text-xs font-bold">
              {formatCurrency(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MetricBox({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="text-center px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default async function RevenueCommandPage() {
  const data = await fetchRevenueData();

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

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Revenue Command Center
        </p>
        <h1 className="text-2xl font-extrabold mt-1 mb-2">Revenue Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Period: {data.period} | Single source of truth for all revenue decisions.
        </p>
      </header>

      {/* Top-level metrics */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
        </CardContent>
      </Card>

      {/* Revenue by Niche + Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Revenue by Niche</h2>
            <BarChart data={nicheData} maxValue={nicheMax} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Revenue by Source / Channel</h2>
            <BarChart data={sourceData} maxValue={sourceMax} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Channel + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Revenue by Channel Performance</h2>
            <BarChart data={channelData} maxValue={channelMax} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Revenue by Funnel Family</h2>
            <BarChart data={funnelData} maxValue={funnelMax} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Offer + LTV Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Revenue by Offer Variant</h2>
            <BarChart data={offerData} maxValue={offerMax} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">LTV Segments</h2>
            <div role="list" aria-label="LTV segments" className="flex flex-col gap-2.5">
              {data.ltvSegments.map((seg) => (
                <div key={seg.tier} role="listitem" className="flex justify-between px-3 py-2 bg-muted/30 rounded-lg">
                  <span className="font-bold capitalize">{seg.tier}</span>
                  <span className="text-sm">{seg.count} leads</span>
                  <span className="font-bold text-sm">Avg LTV: {formatCurrency(seg.avgLTV)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion by tier + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Conversion Rate by Lead Score Tier</h2>
            <div role="list" aria-label="Conversion rates by score tier" className="flex flex-col gap-2">
              {Object.entries(data.conversionByTier).map(([tier, rate]) => {
                const tierCount = data.scoreTierCounts[tier];
                return (
                  <div key={tier} role="listitem" className="flex items-center gap-3">
                    <span className="w-[70px] text-sm font-bold">Score {tier}</span>
                    <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${rate > 10 ? "bg-green-600" : rate > 5 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, rate)}%` }}
                      />
                    </div>
                    <span className="w-[60px] text-right text-xs font-bold">{rate}%</span>
                    <span className="w-[80px] text-right text-xs text-muted-foreground">
                      {tierCount?.converted ?? 0}/{tierCount?.total ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-bold">Revenue Forecast</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <span className="font-semibold text-sm">30-day forecast</span>
                <span className="font-extrabold text-lg">{formatCurrency(data.forecast.forecast30d)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <span className="font-semibold text-sm">90-day forecast</span>
                <span className="font-extrabold text-lg">{formatCurrency(data.forecast.forecast90d)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on linear projection from {data.forecast.dailyRevenues.length} daily data points.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top leads by value */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h2 className="text-sm font-bold">Top 10 Leads by Predicted Value</h2>
          {data.topLeadsByValue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads with predicted value available.</p>
          ) : (
            <div role="list" aria-label="Top leads by value" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.topLeadsByValue.map((lead, i) => (
                <div
                  key={lead.leadId}
                  role="listitem"
                  className="flex justify-between items-center px-3.5 py-2.5 bg-muted/30 rounded-lg"
                >
                  <span className="text-xs">
                    <strong>#{i + 1}</strong>{" "}
                    {lead.leadId.length > 16 ? `${lead.leadId.slice(0, 16)}...` : lead.leadId}
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(lead.ltv)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
